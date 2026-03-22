import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, ChevronDown, ChevronRight, Search, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader title="Equipment Manuals" subtitle="Browse technical documentation">
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowForm(true)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </PageHeader>

      <div className="p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search manuals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
          />
        </div>

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