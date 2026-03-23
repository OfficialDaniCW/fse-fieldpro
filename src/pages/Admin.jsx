import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Trash2, FileText, Package, Shield, Pencil, Upload, RefreshCw, History, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ManualForm from "../components/ManualForm";
import PartForm from "../components/PartForm";
import PartEditModal from "../components/parts/PartEditModal";
import ActivityLogViewer from "../components/admin/ActivityLogViewer";
import TSGPartsVerifier from "../components/admin/TSGPartsVerifier";
import { useCurrentUser } from "../lib/useCurrentUser";
import { toast } from "sonner";
import { Toaster } from "sonner";

export default function AdminPage() {
  const { isAdmin, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchParts, setSearchParts] = useState("");
  const [searchManuals, setSearchManuals] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [reExtractingId, setReExtractingId] = useState(null);

  const { data: parts = [], refetch: refetchParts } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date", 10000),
  });

  useEffect(() => {
    refetchParts();
  }, [refetchParts]);

  const { data: manuals = [] } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list("-created_date"),
  });

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#CC0000] rounded-full animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
        <Shield className="w-12 h-12 text-gray-300" />
        <p className="font-medium">Admin access only</p>
      </div>
    );
  }

  const filteredParts = parts.filter(p =>
    p.part_number?.toLowerCase().includes(searchParts.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchParts.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchParts.toLowerCase())
  );

  const filteredManuals = manuals.filter(m =>
    m.title?.toLowerCase().includes(searchManuals.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(searchManuals.toLowerCase()) ||
    m.model?.toLowerCase().includes(searchManuals.toLowerCase())
  );

  const deletePart = async (id) => {
    if (!confirm("Delete this part?")) return;
    await base44.entities.Part.delete(id);
    queryClient.invalidateQueries({ queryKey: ["parts"] });
    toast.success("Part deleted");
  };

  const deleteManual = async (id) => {
    if (!confirm("Delete this manual?")) return;
    await base44.entities.Manual.delete(id);
    queryClient.invalidateQueries({ queryKey: ["manuals"] });
    toast.success("Manual deleted");
  };

  const reExtractManual = async (manual) => {
    if (!manual.pdf_file) return;
    setReExtractingId(manual.id);
    try {
      const extracted = await base44.functions.invoke("extractPdfText", { pdf_url: manual.pdf_file });
      const manual_text = extracted.data?.manual_text || null;
      const summary = extracted.data?.summary || null;
      await base44.entities.Manual.update(manual.id, { manual_text, summary });
      queryClient.invalidateQueries({ queryKey: ["manuals"] });
      toast.success("Text re-extracted successfully.");
    } catch (err) {
      console.error("Re-extraction error:", err);
      toast.error("Re-extraction failed: " + (err.message || "Unknown error"));
    }
    setReExtractingId(null);
  };

  const handleDeleteManualError = async (id) => {
    try {
      await deleteManual(id);
    } catch (err) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  const handleDeletePartError = async (id) => {
    try {
      await deletePart(id);
    } catch (err) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Admin Panel" subtitle="Manage parts & manuals" />

      <div className="max-w-4xl mx-auto p-4 pb-24">
        {/* Info banner */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <p className="text-xs text-blue-900">
            💡 <strong>Pro Tip:</strong> The <strong>manual_guide</strong> agent can help users find manuals by brand and component type. It automatically groups hydraulic, electrical, mechanical, and parts documentation.
          </p>
          <a
            href={base44.agents.getWhatsAppConnectURL('manual_guide')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-semibold text-blue-700 hover:underline"
          >
            → WhatsApp Link for Manual Guide
          </a>
        </div>



        {/* Quick links */}
        <div className="flex gap-2 mb-4">
          <Link to="/SyncManager" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-3.5 h-3.5" /> Offline Queue
            </button>
          </Link>
          <Link to="/ImportParts" className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </button>
          </Link>
        </div>

        <Tabs defaultValue="manuals">
          <TabsList className="w-full mb-4 grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
            <TabsTrigger value="manuals" className="flex flex-col items-center gap-1 py-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Manuals</span>
              <span className="text-xs text-muted-foreground">({manuals.length})</span>
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex flex-col items-center gap-1 py-2">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Parts</span>
              <span className="text-xs text-muted-foreground">({parts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col items-center gap-1 py-2">
              <History className="w-4 h-4" />
              <span className="text-xs font-medium">Activity</span>
              <span className="text-xs text-muted-foreground">Log</span>
            </TabsTrigger>
            <TabsTrigger value="tsg-verify" className="flex flex-col items-center gap-1 py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">TSG</span>
              <span className="text-xs text-muted-foreground">Verify</span>
            </TabsTrigger>
          </TabsList>

          {/* Manuals Tab */}
          <TabsContent value="manuals">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search manuals..." value={searchManuals} onChange={e => setSearchManuals(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setShowManualForm(true)} className="bg-[#CC0000] hover:bg-[#aa0000] shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {filteredManuals.map(m => (
                <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                  <div className="bg-red-50 rounded-lg p-2 shrink-0">
                    <FileText className="w-5 h-5 text-[#CC0000]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{m.title}</p>
                    <p className="text-xs text-gray-500">{m.manufacturer} · {m.model}</p>
                    {m.manual_text && <p className="text-xs text-green-600 mt-0.5">✓ Text extracted</p>}
                    {!m.manual_text && <p className="text-xs text-amber-500 mt-0.5">⚠ No text extracted</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {m.pdf_file && (
                      <>
                        <a href={m.pdf_file} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-gray-500 h-8 w-8 p-0" title="View PDF">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => reExtractManual(m)}
                          disabled={reExtractingId === m.id}
                          className="text-blue-400 h-8 w-8 p-0 hover:text-blue-600"
                          title="Re-extract text from PDF"
                        >
                          <RefreshCw className={`w-4 h-4 ${reExtractingId === m.id ? "animate-spin" : ""}`} />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteManualError(m.id)} className="text-red-400 h-8 w-8 p-0 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredManuals.length === 0 && <p className="text-center text-gray-400 py-8">No manuals found</p>}
            </div>
          </TabsContent>

          {/* Parts Tab */}
          <TabsContent value="parts">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search parts..." value={searchParts} onChange={e => setSearchParts(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setShowPartForm(true)} className="bg-[#CC0000] hover:bg-[#aa0000] shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {filteredParts.map(p => (
                <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{p.part_number}</p>
                    <p className="text-xs text-gray-500 truncate">{p.description}</p>
                    {(p.brand || p.pump_model) && (
                      <p className="text-xs text-gray-400">{p.brand}{p.pump_model ? ` · ${p.pump_model}` : ""}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setEditingPart(p)} className="text-gray-400 h-8 w-8 p-0 hover:text-gray-700 shrink-0">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePartError(p.id)} className="text-red-400 h-8 w-8 p-0 hover:text-red-600 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredParts.length === 0 && <p className="text-center text-gray-400 py-8">No parts found</p>}
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <ActivityLogViewer />
          </TabsContent>

          {/* TSG Verification Tab */}
          <TabsContent value="tsg-verify">
            <TSGPartsVerifier />
          </TabsContent>
          </Tabs>
      </div>

      {showManualForm && (
        <ManualForm
          onClose={() => setShowManualForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["manuals"] })}
        />
      )}
      {showPartForm && (
        <PartForm
          onClose={() => setShowPartForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["parts"] })}
        />
      )}
      {editingPart && (
        <PartEditModal
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["parts"] }); setEditingPart(null); }}
        />
      )}
      <Toaster position="top-center" />
    </div>
  );
}