import React, { useState, useCallback, useEffect } from "react";
import { RefreshCw, Trash2, AlertTriangle, CheckCircle2, Clock, WifiOff, Loader2, Info, Upload, TrendingUp } from "lucide-react";
import { getQueue, dequeue, clearQueue, resolveConflict } from "../lib/pendingQueue";
import { replayAction, checkForConflict } from "../lib/useSyncManager";
import { useCurrentUser } from "../lib/useCurrentUser";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import ConflictResolver from "../components/ConflictResolver";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const ACTION_LABELS = {
  CREATE_MANUAL: "Create Manual",
  CREATE_PART: "Create Part",
  UPDATE_MANUAL: "Update Manual",
  UPDATE_PART: "Update Part",
};

export default function SyncManagerPage() {
  const { isAdmin, loading } = useCurrentUser();
  const [queue, setQueue] = useState(() => getQueue());
  const [retrying, setRetrying] = useState({});
  const [resolving, setResolving] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pushingAll, setPushingAll] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refresh = useCallback(() => setQueue(getQueue()), []);

  const handleRetry = async (action) => {
    setRetrying(r => ({ ...r, [action.id]: true }));
    setUploadProgress(p => ({ ...p, [action.id]: 0 }));
    try {
      // Simulate progress updates
      setUploadProgress(p => ({ ...p, [action.id]: 30 }));
      await replayAction(action);
      setUploadProgress(p => ({ ...p, [action.id]: 100 }));
      dequeue(action.id);
      toast.success("Action synced successfully.");
    } catch (err) {
      toast.error("Retry failed: " + (err?.message || "Unknown error"));
    } finally {
      setRetrying(r => ({ ...r, [action.id]: false }));
      setTimeout(() => setUploadProgress(p => ({ ...p, [action.id]: undefined })), 500);
      refresh();
    }
  };

  const handlePushAll = async () => {
    if (queue.length === 0) return;
    setPushingAll(true);
    const conflictingActions = queue.filter(a => a.hasConflict);
    const syncActions = queue.filter(a => !a.hasConflict);
    
    if (conflictingActions.length > 0) {
      toast.error(`Please resolve ${conflictingActions.length} conflict(s) first.`);
      setPushingAll(false);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < syncActions.length; i++) {
      const action = syncActions[i];
      setRetrying(r => ({ ...r, [action.id]: true }));
      setUploadProgress(p => ({ ...p, [action.id]: 0 }));
      
      try {
        setUploadProgress(p => ({ ...p, [action.id]: 50 }));
        await replayAction(action);
        setUploadProgress(p => ({ ...p, [action.id]: 100 }));
        dequeue(action.id);
        successCount++;
      } catch (err) {
        failureCount++;
      } finally {
        setRetrying(r => ({ ...r, [action.id]: false }));
        setTimeout(() => setUploadProgress(p => ({ ...p, [action.id]: undefined })), 300);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} action${successCount !== 1 ? "s" : ""} synced successfully.`);
    }
    if (failureCount > 0) {
      toast.error(`${failureCount} action${failureCount !== 1 ? "s" : ""} failed to sync.`);
    }

    setPushingAll(false);
    refresh();
  };

  const handleRemove = (id) => {
    dequeue(id);
    toast("Action removed from queue.");
    refresh();
  };

  const handleClearAll = () => {
    clearQueue();
    toast("All queued actions cleared.");
    refresh();
  };

  const handleResolveConflict = async (action, resolution) => {
    setResolving(r => ({ ...r, [action.id]: true }));
    try {
      if (resolution === "local") {
        // Use local version - force update with local data
        await replayAction(action);
        dequeue(action.id);
        toast.success("Conflict resolved: your changes applied.");
      } else if (resolution === "server") {
        // Discard local changes, accept server version
        resolveConflict(action.id, "server");
        dequeue(action.id);
        toast.success("Conflict resolved: server version kept.");
      }
    } catch (err) {
      toast.error("Resolution failed: " + (err?.message || "Unknown error"));
    } finally {
      setResolving(r => ({ ...r, [action.id]: false }));
      refresh();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <PageHeader title="Sync Manager" subtitle="Offline Queue" />
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <AlertTriangle className="w-10 h-10" />
          <p className="text-sm font-medium">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Sync Manager" subtitle="Offline Queue Dashboard" />

      {/* Status bar */}
      <div className={`px-4 py-3 flex items-center gap-2 text-sm font-medium ${isOnline ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
        {isOnline
          ? <><CheckCircle2 className="w-4 h-4" /> Online — sync available</>
          : <><WifiOff className="w-4 h-4" /> Offline — retries will be queued</>
        }
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{queue.length}</span> pending action{queue.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {queue.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg bg-white hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <CheckCircle2 className="w-12 h-12 text-green-300" />
            <p className="text-sm font-medium text-gray-500">All caught up — no pending actions</p>
          </div>
        )}

        {/* Conflicts section */}
        {queue.some(a => a.hasConflict) && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">⚠️ Conflicts Detected</p>
            {queue
              .filter(a => a.hasConflict)
              .map(action => (
                <ConflictResolver
                  key={action.id}
                  conflict={action.conflict}
                  onResolve={(resolution) => handleResolveConflict(action, resolution)}
                  onRemove={() => handleRemove(action.id)}
                  isResolving={resolving[action.id]}
                />
              ))}
          </div>
        )}

        {/* Queue items */}
        {queue
          .filter(a => !a.hasConflict)
          .map(action => {
            const hasError = !!action.lastError;
            const isRetrying = retrying[action.id];
            return (
              <div
                key={action.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${hasError ? "border-red-200" : "border-gray-200"}`}
              >
              {/* Top row */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hasError ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {ACTION_LABELS[action.type] || action.type}
                    </span>
                    {action.retries > 0 && (
                      <span className="text-xs text-gray-400">{action.retries} retr{action.retries === 1 ? "y" : "ies"}</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {action.payload?.title || action.payload?.description || action.id}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Queued {formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRetry(action)}
                    disabled={isRetrying || !isOnline}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#CC0000] text-white disabled:opacity-40 hover:bg-[#aa0000]"
                  >
                    {isRetrying
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <RefreshCw className="w-3.5 h-3.5" />
                    }
                    Retry
                  </button>
                  <button
                    onClick={() => handleRemove(action.id)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Error reason */}
              {hasError && (
                <div className="mx-4 mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-red-700 mb-0.5">Last error</p>
                    <p className="text-xs text-red-600 break-words">{action.lastError}</p>
                    {action.lastAttempt && (
                      <p className="text-xs text-red-400 mt-0.5">
                        {formatDistanceToNow(new Date(action.lastAttempt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Payload preview */}
              <details className="border-t border-gray-100">
                <summary className="px-4 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-600 flex items-center gap-1.5 list-none">
                  <Info className="w-3 h-3" /> View payload
                </summary>
                <pre className="px-4 pb-3 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(action.payload, null, 2)}
                </pre>
              </details>
              </div>
            );
          })}
      </div>
    </div>
  );
}