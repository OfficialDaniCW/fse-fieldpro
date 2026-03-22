import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

export default function ExtractionMonitor() {
  const { data: manuals = [], isLoading } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list("-created_date", 100),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const pending = manuals.filter(m => m.extracted_parts_status === "pending").length;
  const processing = manuals.filter(m => m.extracted_parts_status === "processing").length;
  const done = manuals.filter(m => m.extracted_parts_status === "done").length;

  if (isLoading) return null;

  if (pending === 0 && processing === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        <span className="text-xs text-green-700 font-medium">All manuals processed</span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
        <span className="text-xs font-medium text-blue-900">Extraction Queue Status</span>
      </div>
      <div className="flex items-center gap-4 ml-6 text-xs text-blue-800">
        {pending > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{pending} queued</span>
          </div>
        )}
        {processing > 0 && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{processing} processing</span>
          </div>
        )}
        {done > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{done} done</span>
          </div>
        )}
      </div>
      <p className="text-xs text-blue-700 ml-6">Queue processes every 10 minutes</p>
    </div>
  );
}