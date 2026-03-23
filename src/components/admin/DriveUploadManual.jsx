import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, CheckCircle2, Loader2, FileJson } from "lucide-react";
import { toast } from "sonner";

export default function DriveUploadManual({ onUploaded }) {
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [jsonFile, setJsonFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  // Load ManualFolders that have a drive_folder_id
  const { data: folders = [] } = useQuery({
    queryKey: ["manual-folders-drive"],
    queryFn: () => base44.entities.ManualFolder.list(),
  });

  const driveFolders = folders.filter(f => f.drive_folder_id);

  // Group by brand for display
  const grouped = driveFolders.reduce((acc, f) => {
    const brand = f.brand || "Other";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(f);
    return acc;
  }, {});

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleUpload = async () => {
    if (!selectedFolderId || !jsonFile) {
      toast.error("Please select a folder and a manual_data.json file");
      return;
    }

    setUploading(true);
    setDone(false);

    try {
      // Upload JSON
      const jsonBase64 = await readFileAsBase64(jsonFile);
      const jsonRes = await base44.functions.invoke("uploadFileToDrive", {
        folder_id: selectedFolderId,
        filename: "manual_data.json",
        file_content_base64: jsonBase64,
        mime_type: "application/json"
      });

      if (jsonRes.data?.error) throw new Error(jsonRes.data.error);

      // Upload PDF if provided
      if (pdfFile) {
        const pdfBase64 = await readFileAsBase64(pdfFile);
        const pdfRes = await base44.functions.invoke("uploadFileToDrive", {
          folder_id: selectedFolderId,
          filename: pdfFile.name,
          file_content_base64: pdfBase64,
          mime_type: "application/pdf"
        });
        if (pdfRes.data?.error) {
          toast.warning("JSON uploaded but PDF failed: " + pdfRes.data.error);
        }
      }

      setDone(true);
      setJsonFile(null);
      setPdfFile(null);
      toast.success("Files uploaded to Drive! Run the crawler to import.");
      onUploaded?.();
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-[#CC0000]" />
        <h3 className="font-semibold text-sm text-gray-900">Upload Manual to Drive</h3>
      </div>
      <p className="text-xs text-gray-500">
        Upload your <code className="font-mono bg-gray-100 px-1 rounded">manual_data.json</code> directly into the correct Drive folder so the crawler can process it.
      </p>

      {/* Folder picker */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Target folder</label>
        {driveFolders.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
            No Drive folders found. Create Drive folders first.
          </p>
        ) : (
          <select
            value={selectedFolderId}
            onChange={e => setSelectedFolderId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
          >
            <option value="">— Select a model folder —</option>
            {Object.entries(grouped).map(([brand, items]) => (
              <optgroup key={brand} label={brand}>
                {items.map(f => (
                  <option key={f.id} value={f.drive_folder_id}>
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </div>

      {/* JSON file */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">
          manual_data.json <span className="text-red-500">*</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-[#CC0000]/50 transition-colors">
          <FileJson className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            {jsonFile ? jsonFile.name : "Click to select manual_data.json"}
          </span>
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={e => setJsonFile(e.target.files[0] || null)}
          />
        </label>
      </div>

      {/* PDF file */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">PDF manual (optional)</label>
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-[#CC0000]/50 transition-colors">
          <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate">
            {pdfFile ? pdfFile.name : "Click to select PDF (optional)"}
          </span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => setPdfFile(e.target.files[0] || null)}
          />
        </label>
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || !jsonFile || !selectedFolderId}
        size="sm"
        className="bg-[#CC0000] hover:bg-[#aa0000] gap-1.5 w-full"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading to Drive...</>
        ) : done ? (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded — Run Crawler to import</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Upload to Drive</>
        )}
      </Button>
    </div>
  );
}