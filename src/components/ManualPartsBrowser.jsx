import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Package, ChevronDown } from "lucide-react";

export default function ManualPartsBrowser({ manualId }) {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedParts, setExpandedParts] = useState({});

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setIsLoading(true);
        const allParts = await base44.entities.Part.list();
        const linkedParts = allParts.filter(part => 
          part.source_manual_id === manualId || 
          (part.manual_links && part.manual_links.some(link => link.manual_id === manualId))
        );
        setParts(linkedParts);
      } catch (err) {
        console.error('Failed to fetch parts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParts();
  }, [manualId]);

  const toggleExpand = (partId) => {
    setExpandedParts(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (parts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500 text-center">No parts linked to this manual</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Package className="w-4 h-4 text-[#CC0000]" />
        <h3 className="font-bold text-gray-800 text-sm">Parts</h3>
        <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{parts.length}</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {parts.map(part => (
          <div key={part.id} className="p-3 hover:bg-gray-50 transition-colors">
            <button
              onClick={() => toggleExpand(part.id)}
              className="w-full text-left flex items-start justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 line-clamp-2">{part.description}</p>
                {part.part_number && (
                  <p className="text-xs text-gray-600 mt-1">Part #{part.part_number}</p>
                )}
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expandedParts[part.id] ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedParts[part.id] && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs">
                {part.brand && (
                  <div>
                    <span className="text-gray-600">Brand: </span>
                    <span className="text-gray-900">{part.brand}</span>
                  </div>
                )}
                {part.system_area && (
                  <div>
                    <span className="text-gray-600">System: </span>
                    <span className="text-gray-900">{part.system_area}</span>
                  </div>
                )}
                {part.component_type && (
                  <div>
                    <span className="text-gray-600">Type: </span>
                    <span className="text-gray-900">{part.component_type}</span>
                  </div>
                )}
                {part.what_it_does && (
                  <p className="text-gray-700 mt-2">{part.what_it_does}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}