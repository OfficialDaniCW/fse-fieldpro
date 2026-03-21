import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterChip from "../components/parts/FilterChip";
import PartCard from "../components/parts/PartCard";

const PAGE_SIZE = 15;

export default function PartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ brand: "", pump_model: "", system_area: "", component_type: "" });
  const [page, setPage] = useState(1);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date"),
    initialData: [],
  });

  // Unique values for filter dropdowns
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#CC0000] text-white px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold">Parts Finder</h1>
        <p className="text-xs text-red-100 mt-1">{parts.length} parts in database</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search part number, description, brand, model..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10 h-12 text-base bg-white"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <FilterChip
            label="Brand"
            options={options.brand}
            selected={filters.brand}
            onSelect={(v) => setFilter("brand", v)}
          />
          <FilterChip
            label="Model"
            options={options.pump_model}
            selected={filters.pump_model}
            onSelect={(v) => setFilter("pump_model", v)}
          />
          <FilterChip
            label="System"
            options={options.system_area}
            selected={filters.system_area}
            onSelect={(v) => setFilter("system_area", v)}
          />
          <FilterChip
            label="Component"
            options={options.component_type}
            selected={filters.component_type}
            onSelect={(v) => setFilter("component_type", v)}
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== parts.length ? ` of ${parts.length}` : ""}
        </p>

        {/* Results */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading parts...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No parts match your search</div>
        ) : (
          <div className="space-y-3">
            {paginated.map(part => <PartCard key={part.id} part={part} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}