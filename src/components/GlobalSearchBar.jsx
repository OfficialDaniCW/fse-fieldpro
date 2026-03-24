import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, ChevronRight, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const CACHE_KEY = "global_parts_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function highlight(text, term) {
  if (!text || !term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900 rounded-sm">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

export default function GlobalSearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load parts into memory (with short-lived cache)
  useEffect(() => {
    const loadParts = async () => {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setParts(data);
          return;
        }
      }
      setLoading(true);
      const data = await base44.entities.Part.list("-created_date", 2000);
      setParts(data || []);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: data || [], ts: Date.now() }));
      setLoading(false);
    };
    loadParts();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut: "/" to open
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && !open && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return parts
      .filter(p =>
        p.part_number?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.pump_model?.toLowerCase().includes(q) ||
        p.manufacturer_part_ref?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [query, parts]);

  const handleSelect = (part) => {
    setOpen(false);
    navigate(`/Parts?search=${encodeURIComponent(part.part_number)}`);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-2 text-sm transition-colors"
        title="Search parts (press /)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-xs opacity-80">Search parts...</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white w-full max-w-2xl mx-auto mt-16 mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-[#CC0000] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by part number, description, brand, or model..."
                className="flex-1 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 ml-1">
                <span className="text-xs border border-gray-300 rounded px-1.5 py-0.5 font-mono">ESC</span>
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {loading && (
                <div className="text-center py-8 text-sm text-gray-400">Loading parts database...</div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400">
                  No parts found matching <span className="font-semibold text-gray-600">"{query}"</span>
                </div>
              )}
              {!loading && query.length < 2 && query.length > 0 && (
                <div className="text-center py-8 text-xs text-gray-400">Type at least 2 characters to search</div>
              )}
              {!loading && query.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400 mb-3">Search across {parts.length.toLocaleString()} parts</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Wayne", "Gilbarco", "Tokheim", "Elaflex"].map(b => (
                      <button
                        key={b}
                        onClick={() => setQuery(b)}
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-[#CC0000] transition-colors"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.length > 0 && (
                <ul>
                  {results.map((part, i) => (
                    <li key={part.id}>
                      <button
                        onClick={() => handleSelect(part)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-xs font-bold text-[#CC0000]">
                              {highlight(part.part_number, query)}
                            </span>
                            {part.is_obsolete && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="w-3 h-3" /> Obsolete
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800 font-medium leading-snug truncate">
                            {highlight(part.description, query)}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {part.brand && (
                              <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                                {highlight(part.brand, query)}
                              </span>
                            )}
                            {part.pump_model && (
                              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                                {highlight(part.pump_model, query)}
                              </span>
                            )}
                            {part.system_area && (
                              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded font-medium">
                                {part.system_area}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{results.length} result{results.length !== 1 ? "s" : ""}</span>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(`/Parts?search=${encodeURIComponent(query)}`);
                  }}
                  className="text-xs text-[#CC0000] font-semibold hover:underline"
                >
                  View all in Parts →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}