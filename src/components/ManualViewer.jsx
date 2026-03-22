import React from "react";
import { ArrowLeft, AlertTriangle, Info, FileText, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SAFETY_KEYWORDS = /\b(WARNING|CAUTION|DANGER|SAFETY|ATEX)\b/i;
const COST_KEYWORDS = /(\$|£|€|\bprice\b|\bcost\b|\bfee\b|\bcharge\b|\brate\b)/i;
const STEP_REGEX = /^(\d+)[.)]\s+(.+)/;
const HEADING_REGEX = /^(#{1,3})\s+(.+)|^([A-Z][A-Z\s\d&/-]{3,}):?$/;

function parseLine(line, idx) {
  const trimmed = line.trim();

  if (!trimmed) return <div key={idx} className="h-3" />;

  if (SAFETY_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
        <p className="text-orange-900 font-medium text-base leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  if (COST_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <p className="text-gray-700 text-base leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  const stepMatch = trimmed.match(STEP_REGEX);
  if (stepMatch) {
    return (
      <div key={idx} className="flex gap-4 items-start">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#CC0000] text-white text-sm font-bold flex items-center justify-center shadow-sm">
          {stepMatch[1]}
        </span>
        <p className="text-base text-gray-800 leading-relaxed pt-1">{stepMatch[2]}</p>
      </div>
    );
  }

  const headingMatch = trimmed.match(HEADING_REGEX);
  if (headingMatch) {
    const text = headingMatch[2] || headingMatch[3];
    return (
      <h3 key={idx} className="font-bold text-gray-900 text-lg mt-6 mb-2 border-b border-gray-200 pb-1">
        {text}
      </h3>
    );
  }

  return (
    <p key={idx} className="text-base text-gray-700 leading-relaxed">
      {trimmed}
    </p>
  );
}

function ContentSection({ label, icon: Icon, content, borderColor = "border-gray-200" }) {
  if (!content) return null;
  const lines = content.split("\n");
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#CC0000]" />
        <h2 className="font-bold text-gray-800 text-lg">{label}</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        {lines.map((line, idx) => parseLine(line, idx))}
      </div>
    </div>
  );
}

export default function ManualViewer({ manual, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#CC0000] text-white px-4 py-4 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-red-100 mb-3"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Manuals</span>
        </button>
        <h1 className="text-xl font-bold leading-snug">{manual.title}</h1>
        <p className="text-sm text-red-100 mt-1">
          {manual.equipment_manufacturer} — {manual.equipment_model}
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">
        {/* Summary card */}
        {manual.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">{manual.summary}</p>
          </div>
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

        {manual.pdf_file && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#CC0000]" />
              <h2 className="font-bold text-gray-800 text-lg">Full Manual PDF</h2>
            </div>
            <a
              href={manual.pdf_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#CC0000] hover:underline font-medium text-base"
            >
              Open PDF Document
            </a>
          </div>
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