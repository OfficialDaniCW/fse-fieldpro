import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Search, Plus } from "lucide-react";
import ManualWikiViewer from "@/components/ManualWikiViewer";
import ManualOrganizer from "@/components/ManualOrganizer";
import ManualForm from "@/components/ManualForm";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Manuals() {
  const [search, setSearch] = useState("");
  const [selectedManual, setSelectedManual] = useState(null);
  const [showForm, setShowForm] = useState(false);
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

  if (selectedManual) {
    return <ManualWikiViewer manual={selectedManual} onBack={() => setSelectedManual(null)} />;
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
        <ManualOrganizer manuals={filtered} onSelectManual={setSelectedManual} />
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