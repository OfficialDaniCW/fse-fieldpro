import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, AlertTriangle, AlertCircle, FileText, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ManualPartsBrowser from "./ManualPartsBrowser";

function parseLine(line, idx) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={idx} className="h-2" />;

  // Check for alert keywords
  const warningKeywords = /\b(WARNING|CAUTION|ATEX|DANGER)\b/i;
  const lockoutKeywords = /\b(LOCKOUT|ISOLATE)\b/i;
  const stepRegex = /^(\d+)[.)]\s+(.+)/;

  if (lockoutKeywords.test(trimmed)) {
    return (
      <div key={idx} className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-red-900 font-medium text-sm leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  if (warningKeywords.test(trimmed)) {
    return (
      <div key={idx} className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
        <p className="text-orange-900 font-medium text-sm leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  const stepMatch = trimmed.match(stepRegex);
  if (stepMatch) {
    return (
      <div key={idx} className="flex gap-3 items-start">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#CC0000] text-white text-xs font-bold flex items-center justify-center">
          {stepMatch[1]}
        </span>
        <p className="text-sm text-gray-800 leading-relaxed pt-0.5">{stepMatch[2]}</p>
      </div>
    );
  }

  return <p key={idx} className="text-sm text-gray-700 leading-relaxed">{trimmed}</p>;
}

function ErrorCodesSection({ error_codes }) {
  if (!error_codes || error_codes.trim().length === 0) return null;

  const codes = error_codes
    .split('\n')
    .filter(line => line.trim() && line.includes('|'))
    .map(line => {
      const [code, ...rest] = line.split('|');
      return {
        code: code.trim(),
        description: rest.join('|').trim()
      };
    });

  if (codes.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#CC0000]" />
        <h2 className="font-bold text-gray-800">Error Codes</h2>
        <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{codes.length} codes</span>
      </div>
      <div className="divide-y divide-gray-200">
        {codes.map((item, idx) => (
          <div key={idx} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <code className="font-mono font-bold text-[#CC0000] text-sm flex-shrink-0">{item.code}</code>
              <p className="text-sm text-gray-700">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableOfContents({ toc_string }) {
  const [open, setOpen] = useState(false);

  if (!toc_string) return null;

  const sections = toc_string.split('|').filter(s => s.trim());
  if (sections.length === 0) return null;

  return (
    <>
      {/* Mobile dropdown */}
      <div className="md:hidden bg-white rounded-lg border border-gray-200 mb-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-800 text-sm">Table of Contents</span>
          <span className="text-xs text-gray-500">{open ? '▼' : '▶'}</span>
        </button>
        {open && (
          <div className="border-t border-gray-100 px-4 py-2 space-y-2 max-h-48 overflow-y-auto">
            {sections.map((section, idx) => (
              <a
                key={idx}
                href={`#section-${idx}`}
                className="block text-sm text-blue-600 hover:text-blue-800 py-1 line-clamp-2"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(`section-${idx}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                  setOpen(false);
                }}
              >
                {section.trim()}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 p-4 sticky top-4 max-h-96 overflow-y-auto">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">Contents</h3>
        <div className="space-y-1.5">
          {sections.map((section, idx) => (
            <a
              key={idx}
              href={`#section-${idx}`}
              className="block text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors line-clamp-2"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(`section-${idx}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {section.trim()}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ManualWikiViewer({ manual, onBack }) {
  const [displayManual, setDisplayManual] = useState(manual);
  const [isLoading, setIsLoading] = useState(false);

  const isProcessing = displayManual.processing_status === 'processing' || displayManual.processing_status === 'pending';
  const isFailed = displayManual.processing_status === 'failed';
  const isComplete = displayManual.processing_status === 'complete' && displayManual.manual_text;

  // Fetch fresh manual data on mount
  useEffect(() => {
    const fetchManual = async () => {
      try {
        const manuals = await base44.entities.Manual.list();
        const found = manuals.find(m => m.id === manual.id);
        if (found) setDisplayManual(found);
      } catch (err) {
        console.error('Failed to fetch manual:', err);
      }
    };

    fetchManual();
  }, [manual.id]);

  // Poll every 5 seconds if processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const manuals = await base44.entities.Manual.list();
        const found = manuals.find(m => m.id === manual.id);
        if (found) setDisplayManual(found);
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isProcessing, manual.id]);

  // Manual refresh button
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const manuals = await base44.entities.Manual.list();
      const found = manuals.find(m => m.id === manual.id);
      if (found) setDisplayManual(found);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse sections
  const sections = useMemo(() => {
    if (!displayManual.manual_text) return [];
    const text = displayManual.manual_text;
    const lines = text.split('\n');
    const result = [];
    let currentSection = null;
    let currentContent = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^===\s+(.+?)\s+===$/) || (trimmed.match(/^[A-Z][A-Z\s\d&\/-]{3,}:?$/) && trimmed.length > 4)) {
        if (currentSection && currentContent.length > 0) {
          result.push({ title: currentSection, content: currentContent });
        }
        const match = trimmed.match(/^===\s+(.+?)\s+===$/) || trimmed.match(/^([A-Z][A-Z\s\d&\/-]{3,}):?$/);
        if (match) {
          currentSection = match[1].replace(/=+/g, '').trim();
          currentContent = [];
        }
      } else if (currentSection) {
        currentContent.push(line);
      }
    });

    if (currentSection && currentContent.length > 0) {
      result.push({ title: currentSection, content: currentContent });
    }

    return result.filter(s => s.title && !s.title.includes('undefined'));
  }, [displayManual.manual_text]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-4 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-red-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">{displayManual.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {displayManual.manufacturer && (
                <span className="bg-white/20 px-2.5 py-1 rounded text-xs font-medium">{displayManual.manufacturer}</span>
              )}
              {displayManual.model && (
                <span className="bg-white/20 px-2.5 py-1 rounded text-xs font-medium">{displayManual.model}</span>
              )}
              {displayManual.manual_type && (
                <span className="bg-white/20 px-2.5 py-1 rounded text-xs font-medium">{displayManual.manual_type}</span>
              )}
            </div>
          </div>
          {displayManual.pdf_file && (
            <a
              href={displayManual.pdf_file}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#CC0000] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <FileText className="w-4 h-4" />
              View PDF
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="max-w-4xl mx-auto p-4 mt-6">
          <div className="bg-white rounded-lg border border-blue-200 p-8 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-800 font-medium">Extracting content from PDF...</p>
            <p className="text-sm text-gray-600 mt-2">Auto-refreshing every 5 seconds</p>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="max-w-4xl mx-auto p-4 mt-6">
          <div className="bg-red-50 rounded-lg border border-red-300 p-6 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900">Extraction Failed</h3>
                <p className="text-sm text-red-800 mt-1">{displayManual.processing_error || 'Unknown error occurred'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setRefreshCount(c => c + 1)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              {displayManual.pdf_file && (
                <a
                  href={displayManual.pdf_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  View PDF Instead
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content state */}
      {isComplete && (
        <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* Main content */}
          <div className="md:col-span-3 space-y-4">
            {/* Summary */}
            {displayManual.summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">{displayManual.summary}</p>
              </div>
            )}

            {/* Sections */}
            {sections.length > 0 && sections.map((section, idx) => (
              <div key={idx} id={`section-${idx}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 scroll-mt-20">
                <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-[#CC0000]">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.content.map((line, lineIdx) => parseLine(line, lineIdx))}
                </div>
              </div>
            ))}

            {/* Error codes */}
            {displayManual.error_codes && (
              <ErrorCodesSection error_codes={displayManual.error_codes} />
            )}

            {/* PDF button at bottom */}
            {displayManual.pdf_file && (
              <a
                href={displayManual.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-12 text-base">
                  View Original PDF
                </Button>
              </a>
            )}
          </div>

          {/* Sidebar - TOC & Parts */}
          <div className="md:col-span-1 space-y-4">
            <TableOfContents toc_string={displayManual.table_of_contents} />
            <ManualPartsBrowser manualId={displayManual.id} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isProcessing && !isFailed && !isComplete && (
        <div className="max-w-4xl mx-auto p-4 mt-6">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">No content available for this manual.</p>
          </div>
        </div>
      )}
    </div>
  );
}