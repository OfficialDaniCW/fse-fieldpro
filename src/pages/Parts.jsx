import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import PartCard from "../components/parts/PartCard";
import FilterPanel from "../components/parts/FilterPanel";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 15;

export default function PartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ brand: "", pump_model: "", system_area: "", component_type: "" });
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const navigate = useNavigate();

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date", 2000),
  });

  const { data: manuals = [] } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list(),
  });

  const options = useMemo(() => ({
    brand: [...new Set(parts.map(p => p.brand).filter(Boolean))].sort(),
    pump_model: [...new Set(parts.map(p => p.pump_model).filter(Boolean))].sort(),
    system_area: [...new Set(parts.map(p => p.system_area).filter(Boolean))].sort(),
    component_type: [...new Set(parts.map(p => p.component_type).filter(Boolean))].sort(),
  }), [parts]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return parts.filter(p => {
      const matchSearch = !q || [p.part_number, p.description, p.brand, p.pump_model]
        .some(v => v?.toLowerCase().includes(q));
      const matchBrand = !filters.brand || p.brand === filters.brand;
      const matchModel = !filters.pump_model || p.pump_model === filters.pump_model;
      const matchSystem = !filters.system_area || p.system_area === filters.system_area;
      const matchComp = !filters.component_type || p.component_type === filters.component_type;
      return matchSearch && matchBrand && matchModel && matchSystem && matchComp;
    });
  }, [parts, searchTerm, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: f[key] === val ? "" : val }));
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#CC0000] shadow-md px-4 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#CC0000]">FSE</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">FSE FieldPro</h1>
              <p className="text-xs text-red-200 font-normal opacity-90">Parts Finder</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="text-white text-xs font-bold">{parts.length.toLocaleString()} parts</span>
          </div>
        </div>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              placeholder="Search part number, description, brand..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-4 h-12 text-sm bg-white rounded-xl border-0 outline-none text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`flex items-center gap-2 px-4 h-12 rounded-xl font-semibold text-sm flex-shrink-0 transition-colors ${
              showFilter || activeFilterCount > 0
                ? "bg-white text-[#CC0000]"
                : "bg-[#aa0000] text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <FilterPanel
          options={options}
          filters={filters}
          onSelect={setFilter}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Results bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{filtered.length.toLocaleString()}</span> parts
        </p>
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "cards" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
            >
            <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </button>
            <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            viewMode === "table" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading parts...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center text-gray-400 py-16 text-sm">No parts match your search</div>
        ) : viewMode === "cards" ? (
          <div className="px-4 py-3 space-y-3">
            {paginated.map(part => (
              <PartCard
                key={part.id}
                part={part}
                manuals={manuals}
                onOpenManual={(manualId) => navigate(`/Manuals?manual=${manualId}`)}
              />
            ))}
          </div>
        ) : (
          <TableView parts={paginated} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TableView({ parts }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#CC0000]">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Part No.</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Ref Code</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Brand</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Model</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">System</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Component</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, idx) => (
            <tr key={part.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
              <td className="px-4 py-3 font-mono text-xs font-semibold text-[#CC0000] whitespace-nowrap">{part.part_number}</td>
              <td className="px-4 py-3 font-medium text-gray-900 text-xs leading-snug">{part.description}</td>
              <td className="px-4 py-3 text-xs text-gray-400 max-w-24">{part.variant_spec}</td>
              <td className="px-4 py-3">
                {part.brand && <span className="text-xs font-semibold text-red-700 border border-red-200 bg-red-50 px-2 py-0.5 rounded whitespace-nowrap">{part.brand}</span>}
              </td>
              <td className="px-4 py-3">
                {part.pump_model && <span className="text-xs font-semibold text-blue-700 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">{part.pump_model}</span>}
              </td>
              <td className="px-4 py-3">
                {part.system_area && <span className="text-xs font-bold text-green-700 border border-green-300 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">{part.system_area}</span>}
              </td>
              <td className="px-4 py-3 text-xs font-medium text-gray-700">{part.component_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}