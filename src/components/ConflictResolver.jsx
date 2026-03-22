import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";

export default function ConflictResolver({ conflict, onResolve, onRemove, isResolving }) {
  const [expanded, setExpanded] = useState(true);
  const { local, server } = conflict;

  const getFieldDiff = (key) => {
    const localVal = local[key];
    const serverVal = server[key];
    return localVal !== serverVal ? { localVal, serverVal } : null;
  };

  // Find all fields that differ
  const allKeys = new Set([...Object.keys(local || {}), ...Object.keys(server || {})]);
  const diffs = Array.from(allKeys)
    .map(k => ({ key: k, diff: getFieldDiff(k) }))
    .filter(x => x.diff);

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 pt-4 pb-3 flex items-start justify-between gap-3 hover:bg-amber-50/50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-gray-900">Conflict Detected</p>
            <p className="text-xs text-gray-500 mt-1">
              {diffs.length} field{diffs.length !== 1 ? "s" : ""} differ from server
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Details */}
      {expanded && (
        <>
          {/* Diff list */}
          <div className="border-t border-amber-100 px-4 py-3 space-y-3 max-h-48 overflow-y-auto">
            {diffs.map(({ key, diff }) => (
              <div key={key} className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{key}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Local */}
                  <div className="bg-blue-50 border border-blue-100 rounded p-2">
                    <p className="font-semibold text-blue-700 mb-1">Your version</p>
                    <p className="text-blue-900 break-words whitespace-pre-wrap">
                      {typeof diff.localVal === "object"
                        ? JSON.stringify(diff.localVal, null, 2)
                        : String(diff.localVal || "—")}
                    </p>
                  </div>

                  {/* Server */}
                  <div className="bg-orange-50 border border-orange-100 rounded p-2">
                    <p className="font-semibold text-orange-700 mb-1">Server version</p>
                    <p className="text-orange-900 break-words whitespace-pre-wrap">
                      {typeof diff.serverVal === "object"
                        ? JSON.stringify(diff.serverVal, null, 2)
                        : String(diff.serverVal || "—")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-amber-100 px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => onResolve("local")}
              disabled={isResolving}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isResolving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Keep Your Changes
            </button>
            <button
              onClick={() => onResolve("server")}
              disabled={isResolving}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isResolving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Use Server Version
            </button>
            <button
              onClick={onRemove}
              className="flex items-center justify-center px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              title="Remove from sync queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}