import React, { useState, useEffect } from "react";
import { WifiOff, CheckCircle2, AlertCircle, Clock, Trash2, RefreshCw, Star, Info } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getQueue, dequeue, resolveConflict, saveQueue } from "@/lib/pendingQueue";
import { getFavorites } from "@/lib/favorites";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PartCard from "@/components/parts/PartCard";

export default function OfflineModePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(getQueue());
  const [favorites, setFavorites] = useState(getFavorites());
  const [activeTab, setActiveTab] = useState("queue"); // "queue", "favorites"

  // Listen for online/offline changes
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

  // Refresh queue periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(getQueue());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch favorited parts
  const { data: allParts = [] } = useQuery({
    queryKey: ['parts'],
    queryFn: () => base44.entities.Part.list(),
  });

  const favoritedParts = allParts.filter(p => favorites.includes(p.id));

  const queueStats = {
    total: queue.length,
    pending: queue.filter(a => a.status === "pending").length,
    failed: queue.filter(a => a.status === "failed").length,
    conflicts: queue.filter(a => a.conflict).length,
  };

  const handleRemove = (id) => {
    dequeue(id);
    setQueue(getQueue());
  };

  const handleRetry = (id) => {
    // Reset retry count to allow retry
    const queue = getQueue().map(a => 
      a.id === id ? { ...a, retries: 0, lastError: null } : a
    );
    saveQueue(queue);
    setQueue(getQueue());
  };

  const handleResolve = (id, choice) => {
    resolveConflict(id, choice);
    setQueue(getQueue());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader 
        title="Offline Mode"
        subtitle={isOnline ? "Online — all changes synced" : "Offline — changes queued for sync"}
      />

      {/* Connection status card */}
      <div className="max-w-2xl mx-auto p-4 mb-4">
        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
          isOnline 
            ? "bg-green-50 border-green-200" 
            : "bg-amber-50 border-amber-200"
        }`}>
          {isOnline ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Connected</p>
                <p className="text-xs text-green-700">All queued changes have been synced</p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900">Offline Mode Active</p>
                <p className="text-xs text-amber-700">{queueStats.total} change{queueStats.total !== 1 ? 's' : ''} queued — will sync when online</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeTab === "queue"
                ? "bg-[#CC0000] text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Queue ({queueStats.total})
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeTab === "favorites"
                ? "bg-[#CC0000] text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Favorites ({favoritedParts.length})
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Queue Tab */}
        {activeTab === "queue" && (
          <>
            {queueStats.total === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-800 mb-1">Queue Empty</p>
                <p className="text-sm text-gray-500">All changes have been synced</p>
              </div>
            ) : (
              <>
                {/* Queue stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{queueStats.pending}</p>
                    <p className="text-xs text-gray-500 mt-1">Pending</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
                    <p className="text-xs text-gray-500 mt-1">Failed</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{queueStats.conflicts}</p>
                    <p className="text-xs text-gray-500 mt-1">Conflicts</p>
                  </div>
                </div>

                {/* Queue items */}
                <div className="space-y-2">
                  {queue.map((action, idx) => (
                    <div key={action.id || idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-3">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-shrink-0 mt-1">
                            {action.conflict ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : action.status === "failed" ? (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm capitalize">
                              {action.type} {action.entityName}
                            </p>
                            <p className="text-xs text-gray-500">{action.timestamp || "Just now"}</p>
                          </div>
                          <button
                            onClick={() => handleRemove(action.id || idx)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status badge */}
                        <div className="flex gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            action.conflict ? "bg-red-100 text-red-700" :
                            action.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {action.conflict ? "⚠ Conflict" : action.status === "failed" ? "✗ Failed" : "⏳ Pending"}
                          </span>
                          {action.retryCount > 0 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Retried {action.retryCount}x
                            </span>
                          )}
                        </div>

                        {/* Error message */}
                        {action.error && (
                          <p className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded">
                            {action.error}
                          </p>
                        )}

                        {/* Conflict resolution UI */}
                        {action.conflict && (
                          <div className="bg-red-50 border border-red-200 rounded p-2 mb-2 text-xs space-y-2">
                            <p className="font-medium text-red-900">Data conflict — choose version to keep:</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResolve(action.id || idx, 'local')}
                                className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                              >
                                Keep Local
                              </button>
                              <button
                                onClick={() => handleResolve(action.id || idx, 'server')}
                                className="flex-1 px-2 py-1 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700"
                              >
                                Use Server
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {action.status === "failed" && (
                          <button
                            onClick={() => handleRetry(action.id || idx)}
                            className="w-full px-2 py-1.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-xs font-medium rounded flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </button>
                        )}

                        {/* Data preview */}
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="font-mono text-gray-500 break-words">
                            {JSON.stringify(action.data).slice(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <>
            {favoritedParts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-800 mb-1">No Favorites Yet</p>
                <p className="text-sm text-gray-500">Mark parts as favorites to view them offline</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    {favoritedParts.length} part{favoritedParts.length !== 1 ? 's' : ''} saved for offline access
                  </p>
                </div>
                {favoritedParts.map(part => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}