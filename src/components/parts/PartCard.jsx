import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const Tag = ({ label, color }) => {
  const colors = {
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors[color]}`}>
      {label}
    </span>
  );
};

export default function PartCard({ part }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const steps = [
    part.installation_step_1,
    part.installation_step_2,
    part.installation_step_3,
  ].filter(Boolean);

  const handleCopy = () => {
    navigator.clipboard.writeText(part.part_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 py-4 flex items-start gap-3"
      >
        <div className="flex-1 min-w-0 space-y-2">
          {/* Part number badge */}
          <span className="inline-block font-mono text-sm font-bold px-2.5 py-1 border-2 border-[#CC0000] text-[#CC0000] rounded-lg bg-red-50">
            {part.part_number}
          </span>

          {/* Description */}
          <p className="font-bold text-gray-900 text-base leading-snug">{part.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {part.brand && <Tag label={part.brand} color="red" />}
            {part.pump_model && <Tag label={part.pump_model} color="blue" />}
            {part.system_area && <Tag label={part.system_area} color="green" />}
            {part.component_type && <Tag label={part.component_type} color="purple" />}
          </div>
        </div>

        <div className="flex-shrink-0 mt-1 text-gray-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* What it does */}
          {part.what_it_does && (
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">What it does</h4>
              <p className="text-base text-gray-700 leading-relaxed">{part.what_it_does}</p>
            </div>
          )}

          {/* Variant spec */}
          {part.variant_spec && (
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Specification</h4>
              <p className="text-base text-gray-700">{part.variant_spec}</p>
            </div>
          )}

          {/* Installation steps */}
          {steps.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Installation</h4>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#CC0000] text-white text-sm font-bold flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-base text-gray-700 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety warning */}
          {part.safety_warning && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <p className="text-orange-900 font-medium text-base leading-relaxed">{part.safety_warning}</p>
            </div>
          )}

          {/* Copy button */}
          <Button
            onClick={handleCopy}
            className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-11 text-base font-medium"
          >
            {copied ? (
              <><Check className="w-4 h-4 mr-2" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" /> Copy Part Number</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}