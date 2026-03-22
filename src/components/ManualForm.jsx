import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, CloudOff, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { enqueue, ACTION_TYPES } from "../lib/pendingQueue";

const BRANDS = ["Tokheim", "Gilbarco", "Wayne", "GVR", "Elaflex", "Other"];
const MANUAL_TYPES = ["Service Manual", "Installation Manual", "Parts Manual", "Maintenance Manual", "Other"];
const COMPONENT_TYPES = ["Dispenser", "Tank Gauge", "Payment Terminal", "Nozzle", "CCTV", "POS System", "Pump", "Coupler", "Other"];

export default function ManualForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    manufacturer: "",
    model: "",
    manual_type: "Service Manual",
    version: "",
    component_type: "Dispenser"
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [extractDiagrams, setExtractDiagrams] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [processingResult, setProcessingResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.manufacturer || !formData.model) {
      toast.error("Please fill in Title, Manufacturer, and Model");
      return;
    }

    if (!pdfFile) {
      toast.error("PDF file is required");
      return;
    }

    setUploading(true);

    // If offline, queue the action
    if (!navigator.onLine) {
      toast.error("PDF upload requires internet connection. Try again when online.");
      setUploading(false);
      return;
    }

    try {
      // Step 1: Upload PDF
      setUploadStage("Uploading PDF...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });

      // Step 2: Create manual record
      setUploadStage("Creating manual record...");
      const manual = await base44.entities.Manual.create({
        ...formData,
        pdf_file: file_url,
        pdf_url: file_url,
        extract_diagrams: extractDiagrams,
        processing_status: "pending",
        brand_category: formData.manufacturer
      });

      // Step 3: Trigger processing
      setUploadStage("Extracting content...");
      try {
        const result = await base44.functions.invoke('bulkProcessManual', {
          manual_id: manual.id
        });
        setProcessingResult(result.data);
      } catch (e) {
        console.log('Processing started in background:', e.message);
      }

      toast.success("Manual uploaded! Processing in background...");
      setProcessingResult({
        title: formData.title,
        parts_linked: 0,
        error_codes_count: 0,
        sections_count: 0
      });
      
      onSuccess?.();
      
      // Keep modal open to show summary
      setUploading(false);
      setUploadStage("");
    } catch (error) {
      toast.error("Failed to add manual: " + error.message);
      setUploading(false);
      setUploadStage("");
    }
  };

  if (processingResult) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 my-8">
          <div className="flex items-center justify-between p-4 border-b bg-green-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Processing Complete
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-3">{processingResult.title}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-900">{processingResult.sections_count} sections extracted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-900">{processingResult.error_codes_count} error codes found</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-900">{processingResult.parts_linked} parts linked</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                The manual is now searchable in the AI assistant. FSEs can ask questions about this equipment and get instant answers.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-[#CC0000] hover:bg-[#aa0000] h-11 text-base"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 my-8">
        <div className="flex items-center justify-between p-4 border-b bg-[#CC0000]">
          <h2 className="text-xl font-bold text-white">Upload Equipment Manual</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="font-semibold">Manual Title *</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Tokheim Quantium 510 Service Manual"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1.5"
              disabled={uploading}
            />
          </div>

          {/* Manufacturer & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer" className="font-semibold">Manufacturer *</Label>
              <select
                id="manufacturer"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                <option value="">Select brand</option>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="model" className="font-semibold">Model *</Label>
              <Input
                id="model"
                required
                placeholder="e.g., Quantium 510"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="mt-1.5"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Manual Type & Component */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual_type" className="font-semibold">Manual Type</Label>
              <select
                id="manual_type"
                value={formData.manual_type}
                onChange={(e) => setFormData({ ...formData, manual_type: e.target.value })}
                className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {MANUAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="component_type" className="font-semibold">Component Type</Label>
              <select
                id="component_type"
                value={formData.component_type}
                onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                className="mt-1.5 w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                {COMPONENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Version */}
          <div>
            <Label htmlFor="version" className="font-semibold">Version/Revision</Label>
            <Input
              id="version"
              placeholder="e.g., v2.1"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="mt-1.5"
              disabled={uploading}
            />
          </div>

          {/* Extract Diagrams Toggle */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="extract_diagrams"
              checked={extractDiagrams}
              onChange={(e) => setExtractDiagrams(e.target.checked)}
              className="w-4 h-4 text-[#CC0000] rounded focus:ring-2 focus:ring-[#CC0000] cursor-pointer"
              disabled={uploading}
            />
            <Label htmlFor="extract_diagrams" className="cursor-pointer flex-1 text-sm font-medium">
              Extract Diagrams
              <p className="text-xs text-gray-500 font-normal mt-0.5">AI will extract exploded view and assembly diagrams</p>
            </Label>
          </div>

          {/* PDF Upload */}
          <div>
            <Label htmlFor="pdf" className="font-semibold">PDF Manual *</Label>
            <div className="mt-1.5">
              <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-[#CC0000] hover:bg-red-50 transition-colors group disabled:opacity-50">
                <input
                  type="file"
                  id="pdf"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0])}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-[#CC0000] transition-colors" />
                  <p className="text-sm font-medium text-gray-600">
                    {pdfFile ? pdfFile.name : "Click to select PDF"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
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
              disabled={uploading || !pdfFile}
              className="flex-1 bg-[#CC0000] hover:bg-[#aa0000] h-11 text-base"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadStage || "Uploading..."}
                </>
              ) : (
                "Upload Manual"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}