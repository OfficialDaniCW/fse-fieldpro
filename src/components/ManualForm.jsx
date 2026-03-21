import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, CloudOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { enqueue, ACTION_TYPES } from "../lib/pendingQueue";

export default function ManualForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    equipment_manufacturer: "",
    equipment_model: "",
    error_codes: "",
    troubleshooting_steps: ""
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // If offline, queue the action for later sync (PDF upload requires connectivity)
    if (!navigator.onLine) {
      if (pdfFile) {
        toast.error("PDF upload requires an internet connection. Add the manual without a PDF, or try again when online.");
        setUploading(false);
        return;
      }
      enqueue({ type: ACTION_TYPES.CREATE_MANUAL, payload: { ...formData, pdf_file: null } });
      toast.success("Saved offline — will sync automatically when you reconnect.", {
        icon: <CloudOff className="w-4 h-4" />,
        duration: 5000,
      });
      onSuccess?.();
      onClose();
      setUploading(false);
      return;
    }

    try {
      let pdf_file = null;
      let manual_text = null;
      let summary = null;

      if (pdfFile) {
        setUploadStage("Uploading PDF...");
        const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
        pdf_file = file_url;

        setUploadStage("Extracting text from PDF...");
        try {
          const extracted = await base44.functions.invoke("extractPdfText", { pdf_url: pdf_file });
          manual_text = extracted.data?.manual_text || null;
          summary = extracted.data?.summary || null;
        } catch (extractErr) {
          console.warn("PDF text extraction failed:", extractErr);
          toast("PDF uploaded but text extraction failed. Manual will still be saved.", { icon: "⚠️" });
        }
      }

      setUploadStage("Saving manual...");
      await base44.entities.Manual.create({ ...formData, pdf_file, manual_text, summary });
      toast.success("Manual added successfully!" + (manual_text ? " Text extracted for AI search." : ""));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to add manual: " + error.message);
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Add Equipment Manual</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label htmlFor="title">Manual Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Gilbarco Encore 700S Service Manual"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                required
                placeholder="e.g., Gilbarco"
                value={formData.equipment_manufacturer}
                onChange={(e) => setFormData({ ...formData, equipment_manufacturer: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                required
                placeholder="e.g., Encore 700S"
                value={formData.equipment_model}
                onChange={(e) => setFormData({ ...formData, equipment_model: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="error_codes">Error Codes</Label>
            <Textarea
              id="error_codes"
              placeholder="E47 - Flow Meter Malfunction&#10;Meaning: Flow meter not detecting fuel flow..."
              value={formData.error_codes}
              onChange={(e) => setFormData({ ...formData, error_codes: e.target.value })}
              className="mt-1 h-32 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">List error codes with meanings and solutions</p>
          </div>

          <div>
            <Label htmlFor="troubleshooting">Troubleshooting Procedures</Label>
            <Textarea
              id="troubleshooting"
              placeholder="Step-by-step troubleshooting instructions..."
              value={formData.troubleshooting_steps}
              onChange={(e) => setFormData({ ...formData, troubleshooting_steps: e.target.value })}
              className="mt-1 h-32 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Detailed step-by-step procedures</p>
          </div>

          <div>
            <Label htmlFor="pdf">PDF Manual (Optional)</Label>
            <div className="mt-1">
              <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#CC0000] hover:bg-red-50 transition-colors">
                <input
                  type="file"
                  id="pdf"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {pdfFile ? pdfFile.name : "Click to upload PDF"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-[#CC0000] hover:bg-[#aa0000]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Add Manual"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}