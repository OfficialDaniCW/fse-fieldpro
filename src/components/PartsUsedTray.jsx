import { useState } from "react";
import { ClipboardList, X, Copy, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function PartsUsedTray({ parts, onRemove, onClear }) {
  const [open, setOpen] = useState(false);

  if (parts.length === 0) return null;

  const copyToClipboard = () => {
    const lines = [
      "PARTS USED:",
      ...parts.map(p => {
        let line = `• ${p.part_number} — ${p.description}`;
        if (p.brand) line += ` (${p.brand}`;
        if (p.pump_model) line += p.brand ? `, ${p.pump_model}` : `(${p.pump_model}`;
        if (p.brand || p.pump_model) line += ")";
        return line;
      })
    ].join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Copied to clipboard — paste into your field notes.");
  };

  return (
    <div className="fixed bottom-28 left-0 right-0 z-20 border-t border-gray-200 bg-white shadow-lg">
      {/* Header bar — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 border-b border-amber-200"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-800">
            Parts Used ({parts.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-600">tap to expand</span>
          {open ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronUp className="w-4 h-4 text-amber-600" />}
        </div>
      </button>

      {/* Expanded tray */}
      {open && (
        <div className="max-h-56 overflow-y-auto">
          <div className="px-4 py-2 space-y-1.5">
            {parts.map((p, i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#CC0000]">{p.part_number}</span>
                  <span className="text-xs text-gray-700 ml-1.5">{p.description}</span>
                  {(p.brand || p.pump_model) && (
                    <p className="text-xs text-gray-400">{[p.brand, p.pump_model].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <button onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#CC0000] text-white text-xs font-semibold rounded-lg py-2 hover:bg-[#aa0000]"
            >
              <Copy className="w-3.5 h-3.5" /> Copy for Field Notes
            </button>
            <button
              onClick={onClear}
              className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}