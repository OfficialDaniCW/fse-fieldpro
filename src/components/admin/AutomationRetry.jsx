import React, { useState } from "react";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AutomationRetry({ automation }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const hasFailures = automation.failed_runs > 0 || automation.consecutive_failures > 0;
  const isProcessing = automation.last_run_status === "running";

  if (!hasFailures && !isProcessing) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Call the automation's function directly
      await base44.functions.invoke(automation.function_name, automation.function_args || {});
      // Trigger a refresh (parent component would handle this)
      window.dispatchEvent(new CustomEvent('automation-retry-success', { detail: { automation_id: automation.id } }));
    } catch (error) {
      console.error("Retry failed:", error);
    }
    setIsRetrying(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-900">
          {isProcessing ? "Running..." : `${automation.consecutive_failures || automation.failed_runs} failed run${automation.failed_runs !== 1 ? "s" : ""}`}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Last: {automation.last_run_status || "unknown"}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRetry}
        disabled={isRetrying || isProcessing}
        className="flex-shrink-0 h-7 px-2 text-amber-700 border-amber-200 hover:bg-amber-100"
      >
        {isRetrying || isProcessing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <RefreshCw className="w-3 h-3" />
        )}
        <span className="text-xs ml-1">Retry</span>
      </Button>
    </div>
  );
}