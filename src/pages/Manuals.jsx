import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, ChevronDown, ChevronRight, Search, Plus } from "lucide-react";
import ManualViewer from "@/components/ManualViewer";
import ManualForm from "@/components/ManualForm";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Manuals() {
  const [search, setSearch] = useState("");
  const [selectedManual, setSelectedManual] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useCurrentUser();

  const { data: manuals = [] } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list(),
  });

  const filtered = manuals.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.equipment_manufacturer?.toLowerCase().includes(q) ||
      m.equipment_model?.toLowerCase().includes(q)
    );
  });

  // Group by manufacturer
  const grouped = filtered.reduce((acc, m) => {
    const key = m.equipment_manufacturer || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const toggleGroup = (key) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

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
            placeholder="Search manufacturer, model, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-12 rounded-xl text-sm bg-white border-0 outline-none text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="p-4">

        {/* Grouped manuals */}
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No manuals found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([manufacturer, items]) => {
              const isOpen = expandedGroups[manufacturer] !== false; // default open
              return (
                <div key={manufacturer} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(manufacturer)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-semibold text-gray-800">{manufacturer}</span>
                      <span className="ml-2 text-xs text-gray-400">{items.length} manual{items.length !== 1 ? "s" : ""}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {items.map((manual) => (
                        <button
                          key={manual.id}
                          onClick={() => setSelectedManual(manual)}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors"
                        >
                          <BookOpen className="w-4 h-4 text-[#CC0000] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{manual.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{manual.equipment_model}</p>
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

      {showForm && (
        <ManualForm
          onClose={() => setShowForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["manuals"] })}
        />
      )}
    </div>
  );
}