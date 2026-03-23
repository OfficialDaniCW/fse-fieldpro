import { useState } from "react";
import DriveUploadManual from "./DriveUploadManual";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FolderPlus, Play, RefreshCw, FolderOpen, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DriveSyncManager() {
  const queryClient = useQueryClient();
  const [creatingFolders, setCreatingFolders] = useState(false);
  const [running, setRunning] = useState(false);

  const { data: statusList = [], refetch } = useQuery({
    queryKey: ["crawl-status"],
    queryFn: () => base44.entities.CrawlStatus.list(),
    refetchInterval: 8000,
  });

  const status = statusList[0] || null;

  const handleCreateFolders = async () => {
    setCreatingFolders(true);
    const res = await base44.functions.invoke("createDriveFolders", {});
    setCreatingFolders(false);
    if (res.data?.success) {
      toast.success(`Drive folders created! ${res.data.folders_created} folders ready.`);
      queryClient.invalidateQueries({ queryKey: ["crawl-status"] });
    } else {
      toast.error("Failed: " + (res.data?.error || "Unknown error"));
    }
  };

  const handleRunCrawler = async () => {
    setRunning(true);
    const res = await base44.functions.invoke("driveManualCrawler", {});
    setRunning(false);
    refetch();
    if (res.data?.error) {
      toast.error("Crawler error: " + res.data.error);
    } else {
      toast.success(`Processed ${res.data?.processed ?? 0} manuals. ${res.data?.remaining ?? 0} remaining.`);
    }
  };

  const toggleCrawler = async (enabled) => {
    if (!status) return;
    await base44.entities.CrawlStatus.update(status.id, { crawl_enabled: enabled });
    queryClient.invalidateQueries({ queryKey: ["crawl-status"] });
    toast.success(enabled ? "Crawler enabled — will run every 5 minutes" : "Crawler disabled");
  };

  const StatusBadge = ({ s }) => {
    const map = {
      idle:     { icon: Clock,        color: "text-gray-500 bg-gray-100",   label: "Idle" },
      running:  { icon: Loader2,      color: "text-blue-600 bg-blue-50",    label: "Running", spin: true },
      complete: { icon: CheckCircle2, color: "text-green-600 bg-green-50",  label: "Complete" },
      error:    { icon: AlertCircle,  color: "text-red-600 bg-red-50",      label: "Error" },
    };
    const cfg = map[s] || map.idle;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
        <Icon className={`w-3 h-3 ${cfg.spin ? "animate-spin" : ""}`} />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Drive Folder Setup */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="w-4 h-4 text-[#CC0000]" />
          <h3 className="font-semibold text-sm text-gray-900">Drive Folder Structure</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Creates <strong>FSE_FieldPro_Manuals</strong> with brand/model subfolders in your Google Drive. Run once to set up.
        </p>

        {status?.folders_created ? (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Folders created. Root ID: <code className="font-mono">{status.drive_folder_id}</code></span>
          </div>
        ) : (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            ⚠ Folders not yet created in Drive.
          </div>
        )}

        <Button
          onClick={handleCreateFolders}
          disabled={creatingFolders}
          size="sm"
          className="bg-[#CC0000] hover:bg-[#aa0000] gap-1.5"
        >
          {creatingFolders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
          {status?.folders_created ? "Re-create Folders" : "Create Drive Folders"}
        </Button>
      </div>

      {/* Crawler Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#CC0000]" />
            <h3 className="font-semibold text-sm text-gray-900">Drive Crawler</h3>
          </div>
          {status && <StatusBadge s={status.status} />}
        </div>

        {status ? (
          <div className="space-y-2 text-xs text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Files imported</span>
              <strong className="text-gray-900">{status.total_files_imported ?? 0}</strong>
            </div>
            {status.last_sync_time && (
              <div className="flex justify-between">
                <span>Last sync</span>
                <strong className="text-gray-900">{new Date(status.last_sync_time).toLocaleString()}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span>Auto-crawl (every 5 min)</span>
              <strong className={status.crawl_enabled ? "text-green-600" : "text-gray-400"}>
                {status.crawl_enabled ? "Enabled" : "Disabled"}
              </strong>
            </div>
            {status.last_error && (
              <div className="text-red-600 bg-red-50 rounded px-2 py-1.5 text-xs">
                ⚠ {status.last_error}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-4">No crawl status found. Create folders first.</p>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleRunCrawler}
            disabled={running || !status?.folders_created}
            size="sm"
            className="bg-[#CC0000] hover:bg-[#aa0000] gap-1.5"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run Now
          </Button>

          {status && (
            <Button
              onClick={() => toggleCrawler(!status.crawl_enabled)}
              size="sm"
              variant="outline"
              className="gap-1.5"
            >
              {status.crawl_enabled ? "Disable Auto-crawl" : "Enable Auto-crawl"}
            </Button>
          )}
        </div>
      </div>

      {/* Upload Manual */}
      {status?.folders_created && (
        <DriveUploadManual onUploaded={() => refetch()} />
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
        <p className="font-semibold">How to add a manual:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Use the <strong>Upload Manual to Drive</strong> panel above — select the folder and upload your <code className="font-mono bg-blue-100 px-1 rounded">manual_data.json</code></li>
          <li>Optionally add the PDF in the same upload</li>
          <li>Press <strong>Run Now</strong> or wait for auto-crawl to import it</li>
        </ol>
      </div>
    </div>
  );
}