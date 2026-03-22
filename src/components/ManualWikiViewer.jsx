import React, { useState, useMemo } from "react";
import { ArrowLeft, AlertTriangle, Info, FileText, Wrench, Download, Maximize2, X, ChevronDown, ChevronUp, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ExplodedViewViewer from "./ExplodedViewViewer";

// Extract sections from text content
function extractSections(text) {
  if (!text) return [];
  
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Detect heading (lines that are all caps or have markdown-style heading)
    if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^([A-Z][A-Z\s\d&/-]{3,}):?$/)) {
      // Save previous section
      if (currentSection) {
        sections.push({
          title: currentSection,
          content: currentContent.join('\n').trim()
        });
      }
      
      const match = trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^([A-Z][A-Z\s\d&/-]{3,}):?$/);
      currentSection = match[1] || match[2];
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  });

  // Save last section
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

  const SAFETY_KEYWORDS = /\b(WARNING|CAUTION|DANGER|SAFETY|ATEX)\b/i;
  const STEP_REGEX = /^(\d+)[.)]\s+(.+)/;

  if (SAFETY_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
        <p className="text-orange-900 font-medium text-sm leading-relaxed">{trimmed}</p>
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

function ContentSection({ label, icon: Icon, content, borderColor = "border-gray-200", defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;
  
  const lines = content.split("\n");
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
          {sections.length > 3 ? (
            // If we found structured sections, render them with sub-headings
            sections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  {section.title}
                </h4>
                <div className="space-y-2 ml-5">
                  {section.content.split('\n').map((line, lineIdx) => parseLine(line, lineIdx))}
                </div>
              </div>
            ))
          ) : (
            // Otherwise render as-is
            lines.map((line, idx) => parseLine(line, idx))
          )}
        </div>
      )}
    </div>
  );
}

function PdfViewer({ url, title }) {
  const [fullscreen, setFullscreen] = useState(false);

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
            <h2 className="font-bold text-gray-800 text-base">Original PDF</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              title="Download for offline use"
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

// Table of Contents component
function TableOfContents({ sections }) {
  const [open, setOpen] = useState(true);

  if (!sections || sections.length === 0) return null;

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
              {section.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualWikiViewer({ manual, onBack }) {
  const sections = useMemo(() => extractSections(manual.manual_text), [manual.manual_text]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#CC0000] text-white px-4 pt-10 pb-4 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-red-100 mb-3"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Manuals</span>
        </button>
        <h1 className="text-lg font-bold leading-snug">{manual.title}</h1>
        <p className="text-sm text-red-100 mt-1">
          {manual.equipment_manufacturer} — {manual.equipment_model}
          {manual.version && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">v{manual.version}</span>}
        </p>
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
          {manual.exploded_view_image_url && (
            <ExplodedViewViewer imageUrl={manual.exploded_view_image_url} title="Exploded View Diagram" />
          )}

          {/* PDF viewer */}
          {manual.pdf_file && (
            <PdfViewer url={manual.pdf_file} title={manual.title} />
          )}

          {/* Error Codes */}
          <ContentSection
            label="Error Codes & Fault Diagnosis"
            icon={AlertTriangle}
            content={manual.error_codes}
            borderColor="border-yellow-200"
          />

          {/* Troubleshooting */}
          <ContentSection
            label="Troubleshooting Procedures"
            icon={Wrench}
            content={manual.troubleshooting_steps}
            borderColor="border-red-100"
          />

          {/* Full Manual Sections */}
          {sections.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#CC0000]" />
                <h2 className="font-bold text-gray-800 text-base">Manual Sections</h2>
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

          {/* Full Extracted Text */}
          {manual.manual_text && !sections.length && (
            <ContentSection
              label="Full Extracted Text"
              icon={FileText}
              content={manual.manual_text}
              borderColor="border-gray-200"
              defaultOpen={false}
            />
          )}

          <Link to="/">
            <Button className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-12 text-base">
              Ask AI about this manual
            </Button>
          </Link>
        </div>

        {/* Sidebar - Table of Contents */}
        <div className="lg:col-span-1">
          <TableOfContents sections={sections} />
        </div>
      </div>
    </div>
  );
}