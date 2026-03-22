import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import { Shield, UploadCloud, X, CheckCircle2, AlertCircle, Loader2, FolderOpen, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "sonner";

const STATUS = { PENDING: "pending", UPLOADING: "uploading", PROCESSING: "processing", DONE: "done", ERROR: "error" };

export default function BulkUpload() {
  const { isAdmin, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const dropRef = useRef(null);
  const [files, setFiles] = useState([]); // [{ file, manufacturer, model, version, status, error }]
  const [globalManufacturer, setGlobalManufacturer] = useState("");
  const [globalModel, setGlobalModel] = useState("");
  const [globalVersion, setGlobalVersion] = useState("");
  const [extractParts, setExtractParts] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#CC0000] rounded-full animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
        <Shield className="w-12 h-12 text-gray-300" />
        <p className="font-medium">Admin access only</p>
      </div>
    );
  }

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (pdfs.length === 0) { toast.error("Only PDF files are supported"); return; }
    setFiles(prev => [
      ...prev,
      ...pdfs.map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        name: f.name.replace(".pdf", ""),
        manufacturer: globalManufacturer,
        model: globalModel,
        version: globalVersion,
        status: STATUS.PENDING,
        error: null,
      }))
    ]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const updateFile = (id, updates) =>
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));

  const removeFile = (id) =>
    setFiles(prev => prev.filter(f => f.id !== id));

  const applyGlobalToAll = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      manufacturer: globalManufacturer || f.manufacturer,
      model: globalModel || f.model,
      version: globalVersion || f.version,
    })));
    toast.success("Applied to all files");
  };

  const processAll = async () => {
    const pending = files.filter(f => f.status === STATUS.PENDING);
    if (pending.length === 0) { toast.error("No pending files to process"); return; }

    setIsRunning(true);

    for (const fileEntry of pending) {
      if (!fileEntry.manufacturer || !fileEntry.model) {
        updateFile(fileEntry.id, { status: STATUS.ERROR, error: "Manufacturer & model are required" });
        continue;
      }

      updateFile(fileEntry.id, { status: STATUS.UPLOADING });
      try {
        // 1. Upload PDF
        const { file_url } = await base44.integrations.Core.UploadFile({ file: fileEntry.file });

        // 2. Create Manual record
        const manual = await base44.entities.Manual.create({
          title: fileEntry.name,
          equipment_manufacturer: fileEntry.manufacturer,
          equipment_model: fileEntry.model,
          version: fileEntry.version || null,
          pdf_file: file_url,
          extracted_parts_status: "pending",
        });

        updateFile(fileEntry.id, { status: STATUS.PROCESSING });

        // 3. Process via backend function (extract text + optionally parts)
        await base44.functions.invoke("bulkProcessManual", {
          manual_id: manual.id,
          extract_parts: extractParts,
        });

        updateFile(fileEntry.id, { status: STATUS.DONE });
      } catch (err) {
        updateFile(fileEntry.id, { status: STATUS.ERROR, error: err.message });
      }
    }

    queryClient.invalidateQueries({ queryKey: ["manuals"] });
    queryClient.invalidateQueries({ queryKey: ["parts"] });
    toast.success("Bulk upload complete!");
    setIsRunning(false);
  };

  const statusIcon = (status) => {
    if (status === STATUS.DONE) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === STATUS.ERROR) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === STATUS.UPLOADING || status === STATUS.PROCESSING) return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const statusLabel = (f) => {
    if (f.status === STATUS.ERROR) return <span className="text-xs text-red-500">{f.error}</span>;
    if (f.status === STATUS.UPLOADING) return <span className="text-xs text-blue-500 animate-pulse">Uploading PDF...</span>;
    if (f.status === STATUS.PROCESSING) return <span className="text-xs text-blue-500 animate-pulse">AI extracting text{extractParts ? " & parts" : ""}... (may take 30–60s)</span>;
    if (f.status === STATUS.DONE) return <span className="text-xs text-green-600 font-medium">✓ Complete — text & parts extracted</span>;
    return <span className="text-xs text-gray-400">Ready to upload</span>;
  };

  const doneCount = files.filter(f => f.status === STATUS.DONE).length;
  const errorCount = files.filter(f => f.status === STATUS.ERROR).length;
  const pendingCount = files.filter(f => f.status === STATUS.PENDING).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Bulk Manual Upload" subtitle="Upload multiple PDFs at once" />
      <Toaster position="top-center" />

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Global metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-4 h-4 text-[#CC0000]" />
            <h2 className="text-sm font-semibold text-gray-800">Default Folder / Metadata</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Set these to apply to all files, or edit per-file below.</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Brand / Manufacturer *</label>
              <input
                value={globalManufacturer}
                onChange={e => setGlobalManufacturer(e.target.value)}
                placeholder="e.g. Grundfos"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#CC0000]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Model *</label>
              <input
                value={globalModel}
                onChange={e => setGlobalModel(e.target.value)}
                placeholder="e.g. CM Series"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#CC0000]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Version</label>
              <input
                value={globalVersion}
                onChange={e => setGlobalVersion(e.target.value)}
                placeholder="e.g. v2.1"
                className="w-full h-9 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#CC0000]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={extractParts}
                onChange={e => setExtractParts(e.target.checked)}
                className="w-4 h-4 accent-[#CC0000]"
              />
              <span className="text-xs text-gray-600">Auto-extract parts into Parts database</span>
            </label>
            {files.length > 0 && (
              <button
                onClick={applyGlobalToAll}
                className="text-xs text-[#CC0000] font-medium underline"
              >
                Apply to all files
              </button>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          ref={dropRef}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging ? "border-[#CC0000] bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
          }`}
          onClick={() => document.getElementById("bulk-file-input").click()}
        >
          <input
            id="bulk-file-input"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">Drop PDFs here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Multiple files supported</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">{files.length} file{files.length !== 1 ? "s" : ""}</span>
                {doneCount > 0 && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{doneCount} done</span>}
                {errorCount > 0 && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{errorCount} failed</span>}
              </div>
              <button onClick={() => setFiles([])} className="text-xs text-gray-400 hover:text-red-500">Clear all</button>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {files.map((f) => (
                <div key={f.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{statusIcon(f.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{f.file.name}</p>
                      {statusLabel(f)}
                      {f.status === STATUS.PENDING && (
                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                          <input
                            value={f.manufacturer}
                            onChange={e => updateFile(f.id, { manufacturer: e.target.value })}
                            placeholder="Manufacturer *"
                            className="h-7 px-2 text-xs border border-gray-200 rounded outline-none focus:border-[#CC0000]"
                          />
                          <input
                            value={f.model}
                            onChange={e => updateFile(f.id, { model: e.target.value })}
                            placeholder="Model *"
                            className="h-7 px-2 text-xs border border-gray-200 rounded outline-none focus:border-[#CC0000]"
                          />
                          <input
                            value={f.version}
                            onChange={e => updateFile(f.id, { version: e.target.value })}
                            placeholder="Version"
                            className="h-7 px-2 text-xs border border-gray-200 rounded outline-none focus:border-[#CC0000]"
                          />
                        </div>
                      )}
                      {(f.status === STATUS.DONE || f.status === STATUS.ERROR) && (
                        <p className="text-xs text-gray-400 mt-0.5">{f.manufacturer} · {f.model}{f.version ? ` · ${f.version}` : ""}</p>
                      )}
                    </div>
                    {f.status === STATUS.PENDING && (
                      <button onClick={() => removeFile(f.id)} className="text-gray-300 hover:text-red-400 mt-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Button
                onClick={processAll}
                disabled={isRunning || pendingCount === 0}
                className="w-full bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-50"
              >
                {isRunning ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><UploadCloud className="w-4 h-4 mr-2" /> Process {pendingCount} PDF{pendingCount !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}