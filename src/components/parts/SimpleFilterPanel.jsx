import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, X } from "lucide-react";
import QuickAccessSection from "./QuickAccessSection";

const DEFAULT_BRANDS = [
  "Tokheim", "Gilbarco", "Wayne", "GVR", "OPW", "Piusi", "Pumptronics", "Elaflex"
];

const COMPONENT_TYPES = [
  "Seal", "Valve", "Sensor", "Hose", "Nozzle", "Coupling", "Belt V Belt", 
  "Filter", "Gasket", "Bolt", "Bearing"
];

function CompactFilter({ label, options, selected, onSelect, onClear }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <div className="text-xs font-semibold text-gray-700 uppercase">{label}</div>
          {selected && <div className="text-sm text-[#CC0000] font-semibold mt-0.5">{selected}</div>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          {options.length > 8 && (
            <div className="mb-3 relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#CC0000]"
              />
            </div>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <button
              onClick={() => onClear()}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                !selected
                  ? "bg-[#CC0000] text-white"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              All
            </button>
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                  selected === opt
                    ? "bg-[#CC0000] text-white"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimpleFilterPanel({ options, filters, onSelect, onClose }) {
  const handleSelectComponent = (component) => {
    onSelect("component_type", component);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">
          {Object.values(filters).filter(Boolean).length > 0 ? "Filters (3 active)" : "Search & Filter"}
        </span>
        <div className="flex items-center gap-3">
          {Object.values(filters).filter(Boolean).length > 0 && (
            <button
              onClick={() => {
                Object.keys(filters).forEach(k => {
                  if (filters[k]) onSelect(k, null);
                });
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#CC0000] hover:underline"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <button onClick={onClose} className="text-xs text-gray-500 font-medium hover:text-gray-700">
            Done
          </button>
        </div>
      </div>

      {/* Quick Access Section */}
      {filters.pump_model && (
        <QuickAccessSection 
          selectedModel={filters.pump_model} 
          onSelectPart={handleSelectComponent}
        />
      )}

      {/* Primary Filter: Pump Model */}
      <CompactFilter
        label="Equipment / Pump Model"
        options={options.pump_model && options.pump_model.length > 0 ? options.pump_model : []}
        selected={filters.pump_model}
        onSelect={(val) => onSelect("pump_model", val)}
        onClear={() => onSelect("pump_model", null)}
      />

      {/* Secondary Filter: Component Type */}
      <CompactFilter
        label="What's Broken (Component Type)"
        options={options.component_type && options.component_type.length > 0 ? options.component_type : COMPONENT_TYPES}
        selected={filters.component_type}
        onSelect={(val) => onSelect("component_type", val)}
        onClear={() => onSelect("component_type", null)}
      />

      {/* Tertiary Filter: System Area */}
      <CompactFilter
        label="System / Area"
        options={options.system_area && options.system_area.length > 0 ? options.system_area : []}
        selected={filters.system_area}
        onSelect={(val) => onSelect("system_area", val)}
        onClear={() => onSelect("system_area", null)}
      />

      {/* Optional: Brand (collapsed by default) */}
      <CompactFilter
        label="Manufacturer / Brand"
        options={options.brand && options.brand.length > 0 ? options.brand : DEFAULT_BRANDS}
        selected={filters.brand}
        onSelect={(val) => onSelect("brand", val)}
        onClear={() => onSelect("brand", null)}
      />
    </div>
  );
}