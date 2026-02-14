import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ManualForm from "../components/ManualForm";
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
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-blue-600 text-white px-4 py-4 shadow-lg">
          <button
            onClick={() => setSelectedManual(null)}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Manuals</span>
          </button>
          <h1 className="text-xl font-bold">{selectedManual.title}</h1>
          <p className="text-sm text-blue-100 mt-1">
            {selectedManual.equipment_manufacturer} {selectedManual.equipment_model}
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {selectedManual.error_codes && (
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                ⚠️ Error Codes
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {selectedManual.error_codes}
              </pre>
            </div>
          )}

          {selectedManual.troubleshooting_steps && (
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-400">
              <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                🔧 Troubleshooting Procedures
              </h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {selectedManual.troubleshooting_steps}
              </pre>
            </div>
          )}

          {selectedManual.pdf_file && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-3">📄 Full Manual</h3>
              <a
                href={selectedManual.pdf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                View PDF Manual
              </a>
            </div>
          )}

          <Link to="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
              Ask AI about this manual
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-blue-600 text-white px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold">📚 Equipment Manuals</h1>
        <p className="text-xs text-blue-100 mt-1">{manuals.length} manuals in library</p>
      </div>

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
                  <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-gray-800 truncate">
                      {manual.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {manual.equipment_manufacturer} • {manual.equipment_model}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
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