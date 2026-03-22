import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, ChevronDown, ChevronRight, Search, Plus, FolderOpen, Folder } from "lucide-react";
import ManualViewer from "@/components/ManualViewer";
import ManualForm from "@/components/ManualForm";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Manuals() {
  const [search, setSearch] = useState("");
  const [selectedManual, setSelectedManual] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState({});
  const [expandedVersions, setExpandedVersions] = useState({});
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useCurrentUser();

  const { data: manuals = [] } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list(),
  });

  // Auto-open a manual if ?manual=<id> is in the URL
  useEffect(() => {
    if (manuals.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const manualId = params.get("manual");
    if (manualId && !selectedManual) {
      const found = manuals.find(m => m.id === manualId);
      if (found) setSelectedManual(found);
    }
  }, [manuals]);

  const filtered = manuals.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.equipment_manufacturer?.toLowerCase().includes(q) ||
      m.equipment_model?.toLowerCase().includes(q) ||
      m.version?.toLowerCase().includes(q)
    );
  });

  // Build brand → version → manuals hierarchy
  const tree = filtered.reduce((acc, m) => {
    const brand = m.equipment_manufacturer || "Unknown";
    const version = m.version || m.equipment_model || "General";
    if (!acc[brand]) acc[brand] = {};
    if (!acc[brand][version]) acc[brand][version] = [];
    acc[brand][version].push(m);
    return acc;
  }, {});

  const toggleBrand = (brand) =>
    setExpandedBrands(prev => ({ ...prev, [brand]: prev[brand] === false ? true : false }));

  const toggleVersion = (key) =>
    setExpandedVersions(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));

  if (selectedManual) {
    return <ManualViewer manual={selectedManual} onBack={() => setSelectedManual(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#CC0000] shadow-md px-4 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-[#CC0000]">FSE</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">Equipment Manuals</h1>
              <p className="text-xs text-red-200 font-normal opacity-90">Technical documentation</p>
            </div>
          </div>
          {(isAdmin || isManager) && (
            <button
              onClick={() => setShowForm(true)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brand, model, version..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-12 rounded-xl text-sm bg-white border-0 outline-none text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="p-4">
        {Object.keys(tree).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No manuals found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(tree).map(([brand, versions]) => {
              const brandOpen = expandedBrands[brand] !== false;
              const totalCount = Object.values(versions).flat().length;

              return (
                <div key={brand} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Brand folder */}
                  <button
                    onClick={() => toggleBrand(brand)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <FolderOpen className="w-5 h-5 text-[#CC0000] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold text-gray-800">{brand}</span>
                      <span className="ml-2 text-xs text-gray-400">{totalCount} manual{totalCount !== 1 ? "s" : ""}</span>
                    </div>
                    {brandOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>

                  {brandOpen && (
                    <div className="border-t border-gray-100">
                      {Object.entries(versions).map(([version, items]) => {
                        const versionKey = `${brand}::${version}`;
                        const versionOpen = expandedVersions[versionKey] !== false;

                        return (
                          <div key={version} className="border-b border-gray-100 last:border-0">
                            {/* Version sub-folder */}
                            <button
                              onClick={() => toggleVersion(versionKey)}
                              className="w-full flex items-center gap-3 pl-8 pr-4 py-2.5 text-left hover:bg-gray-50"
                            >
                              <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">{version}</span>
                                <span className="ml-2 text-xs text-gray-400">{items.length}</span>
                              </div>
                              {versionOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                            </button>

                            {versionOpen && (
                              <div className="border-t border-gray-100 divide-y divide-gray-100">
                                {items.map((manual) => (
                                  <button
                                    key={manual.id}
                                    onClick={() => setSelectedManual(manual)}
                                    className="w-full flex items-start gap-3 pl-14 pr-4 py-3 text-left hover:bg-red-50 transition-colors"
                                  >
                                    <BookOpen className="w-4 h-4 text-[#CC0000] flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-gray-800 text-sm">{manual.title}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{manual.equipment_model}</p>
                                      {manual.manual_text && <p className="text-xs text-green-500 mt-0.5">✓ Searchable</p>}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <ManualForm
          onClose={() => setShowForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["manuals"] })}
        />
      )}
    </div>
  );
}