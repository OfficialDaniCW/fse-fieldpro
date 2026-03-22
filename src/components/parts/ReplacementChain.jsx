import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";

export default function ReplacementChain({ part, allParts = [], onPartClick }) {
  const chain = useMemo(() => {
    const links = [];
    let current = part;
    const visited = new Set();

    // Build chain going backwards (to oldest part)
    while (current && !visited.has(current.part_number)) {
      visited.add(current.part_number);
      const predecessor = current.supersedes 
        ? allParts.find(p => p.part_number === current.supersedes)
        : null;
      if (predecessor) {
        links.unshift(predecessor);
        current = predecessor;
      } else {
        break;
      }
    }

    // Add current part
    links.push(part);

    // Build chain going forwards (to newer parts)
    current = part;
    visited.clear();
    visited.add(part.part_number);
    while (current && !visited.has(current.part_number)) {
      visited.add(current.part_number);
      const successor = current.superseded_by
        ? allParts.find(p => p.part_number === current.superseded_by)
        : null;
      if (successor) {
        links.push(successor);
        current = successor;
      } else {
        break;
      }
    }

    return links;
  }, [part, allParts]);

  const currentIndex = chain.findIndex(p => p.part_number === part.part_number);
  const hasChain = chain.length > 1;

  if (!chain || chain.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 animate-pulse">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Replacement Chain</p>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!hasChain) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Replacement Chain</p>
        <p className="text-sm text-gray-600">No replacement history available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg px-4 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Replacement Chain</p>
      
      {/* Mobile-optimized vertical layout */}
      <div className="space-y-2">
        {chain.map((p, idx) => {
          const isCurrent = p.part_number === part.part_number;
          const isObsolete = idx < currentIndex;
          const isFuture = idx > currentIndex;

          return (
            <React.Fragment key={p.part_number}>
              <button
                onClick={() => onPartClick?.(p)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isCurrent
                    ? "border-[#CC0000] bg-white shadow-md ring-1 ring-[#CC0000]/20"
                    : isObsolete
                    ? "border-gray-300 bg-white/60 opacity-70 hover:opacity-100 hover:bg-white hover:border-gray-400"
                    : "border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-400"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCurrent && (
                    <span className="text-xs font-bold text-[#CC0000] uppercase tracking-wider mt-0.5">Current</span>
                  )}
                  {isObsolete && (
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-0.5">Obsolete</span>
                  )}
                  {isFuture && (
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">Newer</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs font-bold text-[#CC0000] break-all">{p.part_number}</p>
                    <p className="text-sm text-gray-900 leading-snug mt-0.5">{p.description}</p>
                    {p.variant_spec && <p className="text-xs text-gray-600 mt-1">{p.variant_spec}</p>}
                  </div>
                </div>
              </button>

              {/* Arrow indicator */}
              {idx < chain.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="text-gray-400 text-sm font-bold">↓</div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status indicators */}
      <div className="mt-4 pt-3 border-t border-slate-300 space-y-2 text-xs text-gray-600">
        {currentIndex > 0 && (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span><strong>Older versions:</strong> {currentIndex} obsolete part(s)</span>
          </div>
        )}
        {currentIndex < chain.length - 1 && (
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
            <span><strong>Newer versions:</strong> {chain.length - currentIndex - 1} available</span>
          </div>
        )}
      </div>
    </div>
  );
}