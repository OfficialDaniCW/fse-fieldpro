import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Loader2, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { enqueue, ACTION_TYPES } from "../lib/pendingQueue";

const FIELD = (label, key, placeholder, required = false) => ({ label, key, placeholder, required });

const TEXT_FIELDS = [
  FIELD("Part Number *", "part_number", "e.g. 140852556 or SK700-A", true),
  FIELD("Description *", "description", "e.g. Vapour Recovery Hose Assembly", true),
  FIELD("Brand / Manufacturer", "brand", "e.g. Gilbarco"),
  FIELD("Manufacturer Part Ref", "manufacturer_part_ref", "Optional — manufacturer's catalogue reference only"),
  FIELD("Compatible Pump Model", "pump_model", "e.g. Encore 700S"),
  FIELD("System Area", "system_area", "e.g. Hydraulic, Electrical, Mechanical"),
  FIELD("Component Type", "component_type", "e.g. Hose, Seal, Valve, PCB"),
  FIELD("Variant / Spec", "variant_spec", "e.g. 4m length, 3/4\" BSP"),
];

export default function PartForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    part_number: "", description: "", brand: "", manufacturer_part_ref: "", pump_model: "",
    system_area: "", component_type: "", variant_spec: "",
    what_it_does: "", installation_step_1: "", installation_step_2: "",
    installation_step_3: "", safety_warning: "", image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("image_url", file_url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v.trim() !== "")
    );

    if (!navigator.onLine) {
      enqueue({ type: ACTION_TYPES.CREATE_PART, payload });
      toast.success("Saved offline — will sync when you reconnect.", {
        icon: <CloudOff className="w-4 h-4" />, duration: 5000,
      });
      onSuccess?.();
      onClose();
      setSaving(false);
      return;
    }

    await base44.entities.Part.create(payload);
    toast.success("Part added successfully!");
    onSuccess?.();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Add Part</h2>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Core fields */}
          {TEXT_FIELDS.map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                required={required}
                placeholder={placeholder}
                value={formData[key]}
                onChange={e => set(key, e.target.value)}
                className="mt-1"
              />
            </div>
          ))}

          <div>
            <Label>What it does</Label>
            <Textarea
              placeholder="Plain-English description of the part's function..."
              value={formData.what_it_does}
              onChange={e => set("what_it_does", e.target.value)}
              className="mt-1 h-20 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Installation Steps (optional)</Label>
            {[1, 2, 3].map(n => (
              <Input
                key={n}
                placeholder={`Step ${n}`}
                value={formData[`installation_step_${n}`]}
                onChange={e => set(`installation_step_${n}`, e.target.value)}
                className="text-sm"
              />
            ))}
          </div>

          <div>
            <Label>Safety Warning</Label>
            <Input
              placeholder="e.g. ⚠️ Isolate power before work."
              value={formData.safety_warning}
              onChange={e => set("safety_warning", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Part Image</Label>
            <div className="mt-1 flex items-center gap-2">
              {formData.image_url && (
                <div className="flex-shrink-0">
                  <img src={formData.image_url} alt="Part" className="h-12 w-12 rounded object-cover border" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="flex-1 text-sm"
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-[#CC0000] hover:bg-[#aa0000]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Add Part"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}