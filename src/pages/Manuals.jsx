import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Button still used for Add Manual
import { Search, Plus, FileText } from "lucide-react";
import ManualForm from "../components/ManualForm";
import ManualViewer from "../components/ManualViewer";
import PageHeader from "../components/PageHeader";
import { Toaster } from "sonner";

export default function ManualsPage() {
  const [selectedManual, setSelectedManual] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: manuals = [], isLoading } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list("-created_date"),
    initialData: []
  });

  const filteredManuals = manuals.filter((manual) =>
    manual.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.equipment_manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manual.equipment_model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedManual) {
    return <ManualViewer manual={selectedManual} onBack={() => setSelectedManual(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="FSE FieldPro" subtitle={`Equipment Manuals · ${manuals.length} in library`} />

      <div className="max-w-4xl mx-auto p-4">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search manuals, manufacturers, models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Manual List */}
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">Loading manuals...</div>
        ) : filteredManuals.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? "No manuals match your search" : "No manuals added yet"}
          </div>
        ) : (
          <div className="space-y-3 mb-20">
            {filteredManuals.map((manual) => (
              <div
                key={manual.id}
                onClick={() => setSelectedManual(manual)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-red-50 rounded-lg p-2 flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#CC0000]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-gray-800 truncate">
                      {manual.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {manual.equipment_manufacturer} • {manual.equipment_model}
                    </p>
                    <p className="text-xs text-[#CC0000] mt-2 font-medium">
                      Tap to view details →
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Manual Button - Fixed at bottom */}
        <div className="fixed bottom-20 left-4 right-4 max-w-4xl mx-auto">
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full bg-green-600 hover:bg-green-700 h-14 text-base font-medium shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Manual
          </Button>
        </div>
      </div>

      {showForm && (
        <ManualForm 
          onClose={() => setShowForm(false)} 
          onSuccess={() => queryClient.invalidateQueries(["manuals"])}
        />
      )}

      <Toaster position="top-center" />
    </div>
  );
}