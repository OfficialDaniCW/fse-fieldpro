import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Star } from "lucide-react";
import { isFavorite, toggleFavorite } from "../../lib/favorites";

const Tag = ({ label, color }) => {
  const colors = {
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-800 border-green-300",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border tracking-wide ${colors[color]}`}>
      {label}
    </span>
  );
};

export default function PartCard({ part, manuals = [], onOpenManual, allParts = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(() => isFavorite(part.id));

  useEffect(() => {
    const handler = () => setFavorited(isFavorite(part.id));
    window.addEventListener('favorites-changed', handler);
    return () => window.removeEventListener('favorites-changed', handler);
  }, [part.id]);

  const handleFavorite = (e) => {
    e.stopPropagation();
    const nowFav = toggleFavorite(part.id);
    setFavorited(nowFav);
  };

  const steps = [
    part.installation_step_1,
    part.installation_step_2,
    part.installation_step_3,
  ].filter(Boolean);

  // Get replacement and compatible parts
  const replacementPart = part.superseded_by ? allParts.find(p => p.part_number === part.superseded_by) : null;
  const compatiblePartsList = part.compatible_parts?.length > 0
    ? allParts.filter(p => part.compatible_parts.includes(p.part_number))
    : [];

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(part.part_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-xl shadow-sm">
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 pt-4 pb-3 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0 space-y-2">
          {/* Part number */}
          <span className="inline-block font-mono text-xs font-bold px-2 py-1 border border-[#CC0000] text-[#CC0000] rounded bg-white tracking-widest">
            {part.part_number}
          </span>

          {/* Description */}
          <p className="font-semibold text-gray-900 text-base leading-snug">
            {part.description}
          </p>

          {/* Variant spec subtitle */}
          {part.variant_spec && (
            <p className="text-xs text-gray-500 leading-snug">{part.variant_spec}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {part.brand && <Tag label={part.brand} color="red" />}
            {part.pump_model && <Tag label={part.pump_model} color="blue" />}
            {part.system_area && <Tag label={part.system_area} color="green" />}
            {part.component_type && <Tag label={part.component_type} color="purple" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <button
            onClick={handleFavorite}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              favorited ? "bg-amber-50 text-amber-500" : "bg-gray-100 text-gray-400 hover:text-amber-400"
            }`}
            title={favorited ? "Remove from favourites" : "Add to favourites"}
          >
            <Star className={`w-4 h-4 ${favorited ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            expanded ? "bg-[#CC0000] text-white" : "bg-gray-100 text-gray-500"
          }`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pt-4 pb-4 space-y-5">
          {/* Part image */}
          {part.image_url && (
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-3">
              <img src={part.image_url} alt={part.description} className="w-full h-48 object-cover rounded" />
            </div>
          )}

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-4">
            {part.pump_model && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Pump Model</p>
                <p className="text-sm font-semibold text-gray-900">{part.pump_model}</p>
              </div>
            )}
            {part.system_area && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">System / Area</p>
                <p className="text-sm font-semibold text-gray-900">{part.system_area}</p>
              </div>
            )}
            {part.component_type && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Component</p>
                <p className="text-sm font-semibold text-gray-900">{part.component_type}</p>
              </div>
            )}
            {part.brand && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Brand</p>
                <p className="text-sm font-semibold text-gray-900">{part.brand}</p>
              </div>
            )}
          </div>

          {/* What it does */}
          {part.what_it_does && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">What it does</p>
              <p className="text-sm text-gray-700 leading-relaxed">{part.what_it_does}</p>
            </div>
          )}

          {/* Installation steps */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Installation</p>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#CC0000] text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Obsolete warning */}
          {part.is_obsolete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-semibold leading-relaxed">This part is obsolete. See alternatives below.</p>
            </div>
          )}

          {/* Safety warning */}
          {part.safety_warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 text-[#CC0000] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 font-semibold leading-relaxed">{part.safety_warning}</p>
            </div>
          )}

          {/* Superseded by */}
          {replacementPart && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Newer Version Available</p>
              </div>
              <p className="text-sm text-blue-900 mb-2">
                <span className="font-mono font-bold">{replacementPart.part_number}</span> — {replacementPart.description}
              </p>
              {replacementPart.variant_spec && <p className="text-xs text-blue-700 mb-1">{replacementPart.variant_spec}</p>}
            </div>
          )}

          {/* Compatible parts */}
          {compatiblePartsList.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Compatible Alternatives</p>
              <div className="space-y-2">
                {compatiblePartsList.map(cp => (
                  <button
                    key={cp.id}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="w-full text-left p-2 rounded-lg hover:bg-green-100 transition-colors text-sm text-green-900"
                  >
                    <span className="font-mono font-bold">{cp.part_number}</span> — {cp.description}
                    {cp.variant_spec && <p className="text-xs text-green-700">{cp.variant_spec}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 h-11 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <><Check className="w-4 h-4 text-green-600" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy Part Number</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}