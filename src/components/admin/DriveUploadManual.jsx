import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, CheckCircle2, Loader2, FileJson, FolderPlus } from "lucide-react";
import { toast } from "sonner";

export default function DriveUploadManual({ onUploaded }) {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [jsonFile, setJsonFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [done, setDone] = useState(false);

  // New subfolder creation state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const { data: folders = [] } = useQuery({
    queryKey: ["manual-folders-drive"],
    queryFn: () => base44.entities.ManualFolder.list(),
  });

  const driveFolders = folders.filter(f => f.drive_folder_id);
  const modelFolders = driveFolders.filter(f => f.folder_type === 'model');

  const grouped = modelFolders.reduce((acc, f) => {
    const brand = f.brand || "Other";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(f);
    return acc;
  }, {});

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadFileToDrive = async (folderId, filename, base64, mimeType) => {
    const res = await base44.functions.invoke("uploadFileToDrive", {
      folder_id: folderId,
      filename,
      file_content_base64: base64,
      mime_type: mimeType
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };


  const handleCreateSubfolder = async () => {
    if (!newFolderParentId || !newFolderName.trim()) {
      toast.error("Select a parent folder and enter a name");
      return;
    }
    setCreatingFolder(true);
    const parent = driveFolders.find(f => f.drive_folder_id === newFolderParentId);
    const res = await base44.functions.invoke("createDriveSubfolder", {
      parent_folder_id: newFolderParentId,
      folder_name: newFolderName.trim(),
      brand: parent?.brand || parent?.name || ""
    });
    setCreatingFolder(false);
    if (res.data?.error) { toast.error("Failed: " + res.data.error); return; }
    toast.success(`Folder "${newFolderName}" created in Drive`);
    setNewFolderName("");
    setNewFolderParentId("");
    setShowNewFolder(false);
    queryClient.invalidateQueries({ queryKey: ["manual-folders-drive"] });
    setSelectedFolderId(res.data.drive_folder_id);
  };

  const handleUpload = async () => {
    if (!selectedFolderId || !jsonFile) {
      toast.error("Please select a folder and a manual_data.json file");
      return;
    }
    setUploading(true);
    setDone(false);
    try {
      // Upload JSON
      setUploadProgress("Uploading manual_data.json...");
      const jsonBase64 = await readFileAsBase64(jsonFile);
      await uploadFileToDrive(selectedFolderId, "manual_data.json", jsonBase64, "application/json");

      // Upload PDF
      if (pdfFile) {
        setUploadProgress("Uploading PDF...");
        const pdfBase64 = await readFileAsBase64(pdfFile);
        await uploadFileToDrive(selectedFolderId, pdfFile.name, pdfBase64, "application/pdf").catch(e => {
          toast.warning("PDF upload failed: " + e.message);
        });
      }

      setDone(true);
      setJsonFile(null);
      setPdfFile(null);
      setUploadProgress("");
      toast.success("All files uploaded! Run the crawler to import.");
      onUploaded?.();
    } catch (err) {
      toast.error("Upload failed: " + err.message);
      setUploadProgress("");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#CC0000]" />
          <h3 className="font-semibold text-sm text-gray-900">Upload Manual to Drive</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => setShowNewFolder(!showNewFolder)}>
          <FolderPlus className="w-3.5 h-3.5" />
          New Folder
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Upload your <code className="font-mono bg-gray-100 px-1 rounded">manual_data.json</code> and the original PDF. No images needed — zero integration credits used.
      </p>

      {/* Create new subfolder */}
      {showNewFolder && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Create a new model folder in Drive</p>
          <select
            value={newFolderParentId}
            onChange={e => setNewFolderParentId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
          >
            <option value="">— Select parent folder —</option>
            {driveFolders.map(f => (
              <option key={f.id} value={f.drive_folder_id}>
                {f.brand ? `${f.brand} / ` : ""}{f.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="e.g. SK700_2"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
          />
          <Button
            size="sm"
            className="bg-[#CC0000] hover:bg-[#aa0000] gap-1.5 w-full"
            onClick={handleCreateSubfolder}
            disabled={creatingFolder || !newFolderName.trim() || !newFolderParentId}
          >
            {creatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
            {creatingFolder ? "Creating..." : "Create Folder"}
          </Button>
        </div>
      )}

      {/* Folder picker */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Target folder</label>
        {modelFolders.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
            No model folders found. Use "New Folder" above to create one.
          </p>
        ) : (
          <select
            value={selectedFolderId}
            onChange={e => {
              setSelectedFolderId(e.target.value);
            }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
          >
            <option value="">— Select a model folder —</option>
            {Object.entries(grouped).map(([brand, items]) => (
              <optgroup key={brand} label={brand}>
                {items.map(f => (
                  <option key={f.id} value={f.drive_folder_id}>{f.name}</option>
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
          <span className="text-xs text-gray-500 truncate">{jsonFile ? jsonFile.name : "Click to select manual_data.json"}</span>
          <input type="file" accept=".json" className="hidden" onChange={e => setJsonFile(e.target.files[0] || null)} />
        </label>
      </div>

      {/* PDF file */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">PDF manual (optional)</label>
        <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-lg px-3 py-2.5 hover:border-[#CC0000]/50 transition-colors">
          <FolderOpen className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 truncate">{pdfFile ? pdfFile.name : "Click to select PDF (optional)"}</span>
          <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files[0] || null)} />
        </label>
      </div>


      {uploading && uploadProgress && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded px-3 py-2">{uploadProgress}</p>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || !jsonFile || !selectedFolderId}
        size="sm"
        className="bg-[#CC0000] hover:bg-[#aa0000] gap-1.5 w-full"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
        ) : done ? (
          <><CheckCircle2 className="w-3.5 h-3.5" /> Uploaded — Run Crawler to import</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Upload All Files to Drive</>
        )}
      </Button>
    </div>
  );
}