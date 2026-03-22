import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TEXT_FIELDS = [
  { label: "Part Number *", key: "part_number", required: true },
  { label: "Description *", key: "description", required: true },
  { label: "Brand / Manufacturer", key: "brand" },
  { label: "Compatible Pump Model", key: "pump_model" },
  { label: "System Area", key: "system_area" },
  { label: "Component Type", key: "component_type" },
  { label: "Variant / Spec", key: "variant_spec" },
];

export default function PartEditModal({ part, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    part_number: part.part_number || "",
    description: part.description || "",
    brand: part.brand || "",
    pump_model: part.pump_model || "",
    system_area: part.system_area || "",
    component_type: part.component_type || "",
    variant_spec: part.variant_spec || "",
    what_it_does: part.what_it_does || "",
    installation_step_1: part.installation_step_1 || "",
    installation_step_2: part.installation_step_2 || "",
    installation_step_3: part.installation_step_3 || "",
    safety_warning: part.safety_warning || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v.trim()])
    );
    await base44.entities.Part.update(part.id, payload);
    toast.success("Part updated successfully!");
    onSuccess?.();
    onClose();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Edit Part</h2>
            <p className="text-xs text-gray-400 font-mono">{part.part_number}</p>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {TEXT_FIELDS.map(({ label, key, required }) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                required={required}
                value={formData[key]}
                onChange={e => set(key, e.target.value)}
                className="mt-1"
              />
            </div>
          ))}

          <div>
            <Label>What it does</Label>
            <Textarea
              value={formData.what_it_does}
              onChange={e => set("what_it_does", e.target.value)}
              className="mt-1 h-20 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Installation Steps</Label>
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
              value={formData.safety_warning}
              onChange={e => set("safety_warning", e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-[#CC0000] hover:bg-[#aa0000]">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}