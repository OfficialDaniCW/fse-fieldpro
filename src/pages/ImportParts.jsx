import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft, FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const REQUIRED_COLS = ["part_number", "description"];
const ALL_COLS = [
  "part_number", "description", "brand", "pump_model", "system_area",
  "component_type", "variant_spec", "what_it_does",
  "installation_step_1", "installation_step_2", "installation_step_3", "safety_warning"
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
  if (missing.length) throw new Error(`Missing required columns: ${missing.join(", ")}`);

  return lines.slice(1).map((line, i) => {
    // Handle quoted fields
    const values = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, idx) => {
      if (ALL_COLS.includes(h) && values[idx]) row[h] = values[idx];
    });
    if (!row.part_number || !row.description) return null;
    return row;
  }).filter(Boolean);
}

export default function ImportPartsPage() {
  const { isAdmin, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#CC0000] rounded-full animate-spin" /></div>;
  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Import Parts" subtitle="Admin only" />
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <AlertTriangle className="w-10 h-10" />
        <p className="text-sm font-medium">Admin access required</p>
      </div>
    </div>
  );

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setParseError("");
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        setPreview(rows);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setImporting(true);
    let success = 0, failed = 0;
    // Batch in groups of 50
    const BATCH = 50;
    for (let i = 0; i < preview.length; i += BATCH) {
      const batch = preview.slice(i, i + BATCH);
      try {
        await base44.entities.Part.bulkCreate(batch);
        success += batch.length;
      } catch {
        failed += batch.length;
      }
    }
    setImporting(false);
    setResult({ success, failed });
    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success(`Imported ${success} parts successfully.`);
    }
    if (failed > 0) toast.error(`${failed} parts failed to import.`);
  };

  const downloadTemplate = () => {
    const header = ALL_COLS.join(",");
    const example = `140852556,Vapour Recovery Hose Assembly,Gilbarco,Encore 700S,Hydraulic,Hose,4m length,Transfers fuel vapour from nozzle to tank,Isolate pump,Connect hose to VR port,Tighten to 25Nm,⚠️ Isolate before work`;
    const blob = new Blob([header + "\n" + example], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "parts_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Bulk Import Parts" subtitle="Upload CSV to add parts in bulk">
        <Link to="/Admin">
          <button className="flex items-center gap-1 text-white/80 hover:text-white text-xs">
            <ArrowLeft className="w-4 h-4" /> Admin
          </button>
        </Link>
      </PageHeader>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Template download */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">Need a template?</p>
            <p className="text-xs text-blue-600 mt-0.5">Download the CSV template with all supported columns and an example row.</p>
            <button onClick={downloadTemplate} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline">
              <Download className="w-3.5 h-3.5" /> Download template
            </button>
          </div>
        </div>

        {/* Required columns info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Column Reference</p>
          <div className="flex flex-wrap gap-2">
            {ALL_COLS.map(c => (
              <span key={c} className={`text-xs px-2 py-1 rounded font-mono ${REQUIRED_COLS.includes(c) ? "bg-red-100 text-red-700 font-bold" : "bg-gray-100 text-gray-600"}`}>
                {c}{REQUIRED_COLS.includes(c) ? " *" : ""}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">* Required. All other columns are optional.</p>
        </div>

        {/* File upload */}
        <label className="block">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? "border-[#CC0000] bg-red-50" : "border-gray-300 hover:border-[#CC0000] hover:bg-red-50"}`}>
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">{file ? file.name : "Click to upload CSV file"}</p>
            <p className="text-xs text-gray-400 mt-1">CSV format only</p>
          </div>
        </label>

        {/* Parse error */}
        {parseError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {preview && !parseError && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Preview — <span className="text-[#CC0000]">{preview.length} rows</span> ready to import
              </p>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Part No.</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Description</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Brand</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium whitespace-nowrap">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono font-semibold text-[#CC0000] whitespace-nowrap">{row.part_number}</td>
                      <td className="px-3 py-2 text-gray-800">{row.description}</td>
                      <td className="px-3 py-2 text-gray-500">{row.brand || "—"}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.pump_model || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 20 && (
                <p className="text-xs text-gray-400 px-3 py-2 border-t">+ {preview.length - 20} more rows not shown</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-11"
              >
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : `Import ${preview.length} Parts`}
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-4 flex gap-3 ${result.failed === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${result.failed === 0 ? "text-green-500" : "text-amber-500"}`} />
            <div>
              <p className="text-sm font-semibold text-gray-800">Import complete</p>
              <p className="text-xs text-gray-600 mt-0.5">{result.success} imported · {result.failed} failed</p>
              {result.success > 0 && (
                <Link to="/Admin" className="text-xs text-[#CC0000] font-semibold mt-1 block hover:underline">← Back to Admin</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}