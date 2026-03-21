import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SAFETY_KEYWORDS = /\b(WARNING|CAUTION|DANGER|SAFETY|ATEX)\b/i;
const COST_KEYWORDS = /(\$|£|€|\bprice\b|\bcost\b|\bfee\b|\bcharge\b|\brate\b)/i;
const STEP_REGEX = /^(\d+)[.)]\s+(.+)/;
const HEADING_REGEX = /^(#{1,3})\s+(.+)|^([A-Z][A-Z\s\d&/-]{3,}):?$/;

function parseLine(line, idx) {
  const trimmed = line.trim();

  if (!trimmed) return <div key={idx} className="h-3" />;

  // Safety warning line
  if (SAFETY_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <p className="text-orange-900 font-medium text-base leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  // Cost / price info
  if (COST_KEYWORDS.test(trimmed)) {
    return (
      <div key={idx} className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex gap-3 items-start">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <p className="text-gray-700 text-base leading-relaxed">{trimmed}</p>
      </div>
    );
  }

  // Numbered step e.g. "1. Do this" or "1) Do this"
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

  // Section heading: markdown-style or ALL CAPS line
  const headingMatch = trimmed.match(HEADING_REGEX);
  if (headingMatch) {
    const text = headingMatch[2] || headingMatch[3];
    return (
      <h3 key={idx} className="font-bold text-gray-900 text-lg mt-6 mb-2 border-b border-gray-200 pb-1">
        {text}
      </h3>
    );
  }

  // Plain body text
  return (
    <p key={idx} className="text-base text-gray-700 leading-relaxed">
      {trimmed}
    </p>
  );
}

function ContentSection({ label, emoji, content, borderColor = "border-gray-200" }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 text-lg">
          {emoji} {label}
        </h2>
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
      {/* Header */}
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

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <ContentSection
          label="Error Codes"
          emoji="⚠️"
          content={manual.error_codes}
          borderColor="border-yellow-200"
        />
        <ContentSection
          label="Troubleshooting Procedures"
          emoji="🔧"
          content={manual.troubleshooting_steps}
          borderColor="border-red-100"
        />

        {manual.pdf_file && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-4">
            <h2 className="font-bold text-gray-800 text-lg mb-3">📄 Full Manual PDF</h2>
            <a
              href={manual.pdf_file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#CC0000] hover:underline font-medium text-base"
            >
              Open PDF Document →
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