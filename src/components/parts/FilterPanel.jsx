import React, { useState } from "react";
import { Tag, Settings, Layers, Wrench, ChevronDown, ChevronUp, X } from "lucide-react";

// Dynamic — but include a list of expected brands for reference
const DEFAULT_BRAND_OPTIONS = [
  "Adder (Tokheim CCTV)", "Dunclare", "Elaflex", "Fleet / Commercial",
  "Flexi / Gaskets", "GVR", "GVR / Tank Gauge", "Gilbarco", "Hose",
  "Hytek", "Labels / Stickers", "Nozzle", "OPW", "POS / FuelPOS",
  "Pipe Work", "Piusi", "Pumptronics", "Site / Consumables", "Tokheim", "Wayne",
];

const SYSTEM_AREA_OPTIONS = [
  "CABLES", "CLADDING", "CONSOLE", "CUSTOMER DISPLAY", "DISPLAY",
  "ELECTRONICS", "HEAD", "HYDRAULICS", "LIGHTING", "MAINS",
  "MISCELLANEOUS", "NETWORK", "NOZZLE", "PIPEWORK", "PROBE",
  "SEAL", "TERMINAL", "TICKET PRINTER", "UNION", "USB", "VR",
];

function FilterSection({ filterKey, label, hint, icon: Icon, options, selected, onSelect }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-100">
      {/* Section header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#CC0000]" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{label}</span>
          {selected && (
            <span className="bg-[#CC0000] text-white text-xs font-bold px-2 py-0.5 rounded-full leading-none">
              1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">{hint}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Chips */}
      {open && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          <button
            onClick={() => selected && onSelect(filterKey, selected)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              !selected
                ? "bg-[#CC0000] text-white border-[#CC0000]"
                : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
            }`}
          >
            All
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onSelect(filterKey, opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-colors ${
                selected === opt
                  ? "bg-[#CC0000] text-white border-[#CC0000]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ options, filters, onSelect, onClose }) {
  const sections = [
    {
      key: "brand",
      label: "Manufacturer / Brand",
      hint: "Who built it",
      icon: Tag,
      opts: options.brand && options.brand.length > 0 ? options.brand : DEFAULT_BRAND_OPTIONS,
    },
    {
      key: "pump_model",
      label: "Pump Model",
      hint: "Which dispenser",
      icon: Layers,
      opts: options.pump_model && options.pump_model.length > 0 ? options.pump_model : [],
    },
    {
      key: "system_area",
      label: "System / Area",
      hint: "Where on the pump",
      icon: Settings,
      opts: options.system_area && options.system_area.length > 0 ? options.system_area : SYSTEM_AREA_OPTIONS,
    },
    {
      key: "component_type",
      label: "Component Type",
      hint: "What the part is",
      icon: Wrench,
      opts: options.component_type && options.component_type.length > 0 ? options.component_type : [],
    },
  ];

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-semibold text-gray-800">
          Filters {activeCount > 0 && <span className="text-[#CC0000]">({activeCount} active)</span>}
        </span>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={() => {
                ["brand", "pump_model", "system_area", "component_type"].forEach(k => {
                  if (filters[k]) onSelect(k, filters[k]);
                });
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#CC0000] hover:underline"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
          <button onClick={onClose} className="text-xs text-gray-400 font-medium hover:text-gray-600">
            Done
          </button>
        </div>
      </div>

      {sections.map(({ key, label, hint, icon, opts }) => (
        <FilterSection
          key={key}
          filterKey={key}
          label={label}
          hint={hint}
          icon={icon}
          options={opts}
          selected={filters[key]}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}