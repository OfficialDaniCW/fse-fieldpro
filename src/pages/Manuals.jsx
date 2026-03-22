import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText, ChevronRight, ChevronDown } from "lucide-react";
import ManualForm from "../components/ManualForm";
import ManualViewer from "../components/ManualViewer";
import PageHeader from "../components/PageHeader";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Toaster } from "sonner";

export default function ManualsPage() {
  const [selectedManual, setSelectedManual] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useCurrentUser();
  const canAddManual = isAdmin || isManager;

  const { data: manuals = [], isLoading } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list("-created_date"),
  });

  if (selectedManual) {
    return <ManualViewer manual={selectedManual} onBack={() => setSelectedManual(null)} />;
  }

  const filteredManuals = manuals.filter((m) =>
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.equipment_manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.equipment_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by manufacturer
  const grouped = filteredManuals.reduce((acc, m) => {
    const key = m.equipment_manufacturer || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort();

  const toggleGroup = (key) =>
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="FSE FieldPro" subtitle={`Equipment Manuals · ${manuals.length} in library`} />

      <div className="max-w-4xl mx-auto p-4">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search manuals, manufacturers, models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading manuals...</div>
        ) : filteredManuals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? "No manuals match your search" : "No manuals added yet"}
          </div>
        ) : (
          <div className="space-y-4 mb-28">
            {groupKeys.map((brand) => {
              const items = grouped[brand];
              const isCollapsed = collapsedGroups[brand];
              return (
                <div key={brand} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Brand group header */}
                  <button
                    onClick={() => toggleGroup(brand)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{brand}</span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        {items.length} manual{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>

                  {/* Manuals in group */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      {items.map((manual) => (
                        <button
                          key={manual.id}
                          onClick={() => setSelectedManual(manual)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors"
                        >
                          <div className="bg-red-50 rounded-lg p-2 flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#CC0000]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{manual.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{manual.equipment_model}</p>
                            {manual.manual_text && (
                              <span className="text-xs text-green-600 font-medium">✓ AI searchable</span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canAddManual && (
          <div className="fixed bottom-20 left-4 right-4 max-w-4xl mx-auto">
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-14 text-base font-medium shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Manual
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <ManualForm
          onClose={() => setShowForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["manuals"] })}
        />
      )}

      <Toaster position="top-center" />
    </div>
  );
}