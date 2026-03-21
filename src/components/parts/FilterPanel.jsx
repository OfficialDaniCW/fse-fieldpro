import React from "react";
import { Tag, Layers, Cpu, Wrench, Settings } from "lucide-react";

const SECTIONS = [
  { key: "brand", label: "Manufacturer", hint: "Who built it", icon: Tag },
  { key: "system_area", label: "System / Area", hint: "Where on the pump", icon: Settings },
  { key: "pump_model", label: "Pump Model", hint: "Which dispenser", icon: Layers },
  { key: "component_type", label: "Component Type", hint: "What the part is", icon: Wrench },
];

export default function FilterPanel({ options, filters, onSelect, onClose }) {
  return (
    <div className="bg-white border-b border-gray-200 pb-4">
      {SECTIONS.map(({ key, label, hint, icon: Icon }) => {
        const opts = options[key] || [];
        const selected = filters[key];
        return (
          <div key={key} className="border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#CC0000]" />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</span>
              </div>
              <span className="text-xs text-gray-400">{hint}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* All button */}
              <button
                onClick={() => selected && onSelect(key, selected)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  !selected
                    ? "bg-[#CC0000] text-white border-[#CC0000]"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                All
              </button>
              {opts.map(opt => (
                <button
                  key={opt}
                  onClick={() => onSelect(key, opt)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                    selected === opt
                      ? "bg-[#CC0000] text-white border-[#CC0000]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}