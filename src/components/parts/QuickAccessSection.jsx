import React from "react";
import { Zap } from "lucide-react";

// Common replacement parts by equipment category
const COMMON_BY_MODEL = {
  "Tokheim": ["Seal", "Valve", "Sensor", "Coupling", "Belt V Belt"],
  "Gilbarco": ["Seal", "Hose", "Sensor", "Nozzle", "Solenoid"],
  "Wayne": ["Seal", "Valve", "Filter", "Nozzle", "Bearing"],
  "GVR": ["Seal", "Coupling", "Valve", "Bolt", "Gasket"],
  "OPW": ["Nozzle", "Coupler", "Swivel", "Seal", "Hose"],
};

export default function QuickAccessSection({ selectedModel, onSelectPart }) {
  const commonParts = selectedModel && COMMON_BY_MODEL[selectedModel] 
    ? COMMON_BY_MODEL[selectedModel] 
    : [];

  if (!commonParts.length) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-semibold text-blue-900 uppercase">Quick Access</span>
        <span className="text-xs text-blue-600 ml-auto">Common for {selectedModel}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {commonParts.map(part => (
          <button
            key={part}
            onClick={() => onSelectPart(part)}
            className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0 whitespace-nowrap"
          >
            {part}
          </button>
        ))}
      </div>
    </div>
  );
}