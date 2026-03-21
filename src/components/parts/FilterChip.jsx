import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function FilterChip({ label, options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = !!selected;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
          isActive
            ? "bg-[#CC0000] text-white border-[#CC0000]"
            : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
        }`}
      >
        {isActive ? selected : label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-40 max-h-60 overflow-y-auto">
          {isActive && (
            <button
              onClick={() => { onSelect(selected); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#CC0000] font-medium hover:bg-red-50 border-b border-gray-100"
            >
              Clear filter
            </button>
          )}
          {options.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">No options</p>
          ) : (
            options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${
                  selected === opt ? "text-[#CC0000] font-semibold" : "text-gray-700"
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}