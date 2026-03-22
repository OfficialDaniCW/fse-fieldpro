import React, { useState, useMemo } from "react";
import { ArrowLeft, AlertTriangle, Info, FileText, Wrench, Download, Maximize2, X, ChevronDown, ChevronUp, Hash, Loader2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ExplodedViewViewer from "./ExplodedViewViewer";

function extractSections(text) {
  if (!text) return [];
  
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.match(/^===\s+(.+)\s+===$/) || trimmed.match(/^([A-Z][A-Z\s\d&/-]{3,}):?$/)) {
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      
      const match = trimmed.match(/^===\s+(.+)\s+===$/) || trimmed.match(/^([A-Z][A-Z\s\d&/-]{3,}):?$/);
      currentSection = (match[1] || match[2]).replace(/=+\s*/g, '');
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  });

  if (currentSection && currentContent.length > 0) {
    sections.push({
      title: currentSection,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

function parseLine(line, idx) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={idx} className="h-2" />;

  const SAFETY_KEYWORDS = /\b(WARNING|CAUTION|DANGER|SAFETY|ATEX|CRITICAL)\b/i;
  const STEP_REGEX = /^(\d+)[.)]\s+(.+)/;

  if (SAFETY_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-red-900 font-medium text-sm leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  const stepMatch = trimmed.match(STEP_REGEX);
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

function ErrorCodesTable({ error_codes }) {
  const [expanded, setExpanded] = useState({});

  if (!error_codes) return null;

  const codes = error_codes.split('\n').filter(l => l.trim() && l.includes(':'));

  if (codes.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#CC0000]" />
        <h2 className="font-bold text-gray-800 text-base">Error Codes</h2>
        <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{codes.length} codes</span>
      </div>
      <div className="divide-y divide-gray-200">
        {codes.map((code, idx) => {
          const parts = code.split('|').map(p => p.trim());
          const title = parts[0];
          const cause = parts[1] || '';
          const action = parts[2] || '';

          return (
            <div key={idx} className="border-b last:border-b-0">
              <button
                onClick={() => setExpanded(e => ({ ...e, [idx]: !e[idx] }))}
                className="w-full px-5 py-3 hover:bg-gray-50 text-left flex items-center justify-between gap-2"
              >
                <span className="font-mono font-bold text-[#CC0000] text-sm">{title}</span>
                {expanded[idx] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expanded[idx] && (
                <div className="px-5 py-3 bg-gray-50 space-y-2 text-sm">
                  {cause && <p><span className="font-semibold text-gray-700">Cause: </span><span className="text-gray-600">{cause}</span></p>}
                  {action && <p><span className="font-semibold text-gray-700">Action: </span><span className="text-gray-600">{action}</span></p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentSection({ label, icon: Icon, content, borderColor = "border-gray-200", defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;
  
  const sections = extractSections(content);

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#CC0000]" />
          <h2 className="font-bold text-gray-800 text-base">{label}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 space-y-3">
          {content.split('\n').map((line, idx) => parseLine(line, idx))}
        </div>
      )}
    </div>
  );
}

function PdfViewer({ url, title }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!url) return null;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "manual"}.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#CC0000]" />
            <h2 className="font-bold text-gray-800 text-base">View Original PDF</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#CC0000] hover:bg-[#aa0000] px-3 py-1.5 rounded-lg transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Full screen
            </button>
          </div>
        </div>
        <div className="w-full" style={{ height: "500px" }}>
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            className="w-full h-full"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <p className="text-white text-sm font-medium truncate">{title}</p>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-200 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#CC0000] hover:bg-[#aa0000] px-3 py-1.5 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          </div>
          <iframe
            src={`${url}#toolbar=1`}
            className="flex-1 w-full"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      )}
    </>
  );
}

function TableOfContents({ toc_string }) {
  const [open, setOpen] = useState(true);

  if (!toc_string) return null;

  const sections = toc_string.split('|').filter(s => s.trim());

  if (sections.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-[#CC0000]" />
          <h2 className="font-bold text-gray-800 text-base">Contents</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      
      {open && (
        <div className="px-4 py-3 max-h-96 overflow-y-auto space-y-1">
          {sections.map((section, idx) => (
            <a
              key={idx}
              href={`#section-${idx}`}
              className="block text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors line-clamp-2"
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
      )}
    </div>
  );
}

export default function ManualWikiViewer({ manual, onBack }) {
  const sections = useMemo(() => extractSections(manual.manual_text), [manual.manual_text]);
  const isProcessing = manual.processing_status === 'processing' || manual.processing_status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 pt-10 pb-6 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-red-100 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Manuals</span>
        </button>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-snug">{manual.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-white/20 px-2.5 py-1 rounded text-sm font-medium">{manual.manufacturer}</span>
              <span className="bg-white/20 px-2.5 py-1 rounded text-sm font-medium">{manual.model}</span>
              {manual.manual_type && <span className="bg-white/20 px-2.5 py-1 rounded text-sm">{manual.manual_type}</span>}
            </div>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Extracting…</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary */}
          {manual.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 leading-relaxed">{manual.summary}</p>
            </div>
          )}

          {/* Exploded view diagram */}
          {manual.exploded_view_image_url && !manual.exploded_view_image_url.startsWith('pending') && (
            <ExplodedViewViewer imageUrl={manual.exploded_view_image_url} title="Exploded View Diagram" />
          )}

          {/* Error Codes Table */}
          {manual.error_codes && (
            <ErrorCodesTable error_codes={manual.error_codes} />
          )}

          {/* Diagrams section */}
          {manual.exploded_view_image_url && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-[#CC0000]" />
                <h3 className="font-bold text-gray-800">Diagrams</h3>
              </div>
              <p className="text-sm text-gray-600">Exploded view and technical diagrams extracted from the manual.</p>
            </div>
          )}

          {/* Linked Parts Section */}
          {manual.parts_linked > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#CC0000]" />
                  <h2 className="font-bold text-gray-800 text-base">Linked Parts</h2>
                  <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{manual.parts_linked} parts</span>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 mb-3">{manual.parts_linked} part components from this manual are in the parts database.</p>
                <Link to={`/Parts?manual=${manual.id}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    View {manual.parts_linked} Linked Parts
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* PDF viewer */}
          <PdfViewer url={manual.pdf_file} title={manual.title} />

          {/* Manual Sections */}
          {sections.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#CC0000]" />
                <h2 className="font-bold text-gray-800 text-base">Manual Content</h2>
              </div>
              <div className="px-5 py-4 space-y-6">
                {sections.map((section, idx) => (
                  <div key={idx} id={`section-${idx}`} className="scroll-mt-20">
                    <h3 className="font-bold text-lg text-gray-900 mb-3 pb-2 border-b-2 border-[#CC0000]">
                      {section.title}
                    </h3>
                    <div className="space-y-3 ml-2">
                      {section.content.split('\n').map((line, lineIdx) => parseLine(line, lineIdx))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Assistant CTA */}
          <Link to="/">
            <Button className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-12 text-base">
              Ask AI about this manual
            </Button>
          </Link>
        </div>

        {/* Sidebar - Table of Contents */}
        <div className="lg:col-span-1">
          <TableOfContents toc_string={manual.table_of_contents} />
        </div>
      </div>
    </div>
  );
}