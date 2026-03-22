import React, { useState } from "react";
import { ArrowLeft, AlertTriangle, Info, FileText, Wrench, Download, Maximize2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ExplodedViewViewer from "./ExplodedViewViewer";

const SAFETY_KEYWORDS = /\b(WARNING|CAUTION|DANGER|SAFETY|ATEX)\b/i;
const STEP_REGEX = /^(\d+)[.)]\s+(.+)/;
const HEADING_REGEX = /^(#{1,3})\s+(.+)|^([A-Z][A-Z\s\d&/-]{3,}):?$/;

function parseLine(line, idx) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={idx} className="h-2" />;

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

  const headingMatch = trimmed.match(HEADING_REGEX);
  if (headingMatch) {
    const text = headingMatch[2] || headingMatch[3];
    return (
      <h3 key={idx} className="font-bold text-gray-900 text-base mt-4 mb-1 border-b border-gray-200 pb-1">
        {text}
      </h3>
    );
  }

  return <p key={idx} className="text-sm text-gray-700 leading-relaxed">{trimmed}</p>;
}

function ContentSection({ label, icon: Icon, content, borderColor = "border-gray-200", defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!content) return null;
  const lines = content.split("\n");
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
          {lines.map((line, idx) => parseLine(line, idx))}
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
            <h2 className="font-bold text-gray-800 text-base">PDF Document</h2>
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
        {/* Inline PDF embed */}
        <div className="w-full" style={{ height: "500px" }}>
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            className="w-full h-full"
            title={title}
            style={{ border: "none" }}
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
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

export default function ManualViewer({ manual, onBack }) {
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
          {manual.version && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">{manual.version}</span>}
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
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

          {/* PDF viewer — shown first so engineers can access it immediately */}
          {manual.pdf_file && (
            <PdfViewer url={manual.pdf_file} title={manual.title} />
          )}

        <ContentSection
          label="Error Codes"
          icon={AlertTriangle}
          content={manual.error_codes}
          borderColor="border-yellow-200"
        />
        <ContentSection
          label="Troubleshooting Procedures"
          icon={Wrench}
          content={manual.troubleshooting_steps}
          borderColor="border-red-100"
        />

        {manual.manual_text && (
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
    </div>
  );
}