import { useState, useEffect } from "react";
import { Info, ExternalLink, MessageCircle, Star, WifiOff, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";
import { base44 } from "@/api/base44Client";
import PartCard from "../components/parts/PartCard";
import { getFavorites } from "../lib/favorites";
import { getQueue } from "../lib/pendingQueue";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("about");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(getQueue());
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites());

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

  useEffect(() => {
    const handler = () => setFavoriteIds(getFavorites());
    window.addEventListener('favorites-changed', handler);
    return () => window.removeEventListener('favorites-changed', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(getQueue());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date", 2000),
    initialData: [],
  });

  const favoriteParts = parts.filter(p => favoriteIds.includes(p.id));
  const queueCount = queue.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <PageHeader title="Profile" subtitle="Account & settings" />

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "bg-[#CC0000] text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "favorites"
                ? "bg-[#CC0000] text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Star className="w-4 h-4" />
            Favorites ({favoriteParts.length})
          </button>
          <button
            onClick={() => setActiveTab("offline")}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "offline"
                ? "bg-[#CC0000] text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <WifiOff className="w-4 h-4" />
            Offline ({queueCount})
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* About Tab */}
        {activeTab === "about" && (
        <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-4">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <Info className="w-4 h-4 text-[#CC0000]" />
            <span className="text-sm font-semibold text-gray-700">About</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Version</span>
              <span className="text-sm font-medium text-gray-800">1.0.0</span>
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Developed by</span>
              <a
                href="https://www.linkedin.com/in/daniel-calvo-westcott"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-[#CC0000] hover:underline"
              >
                Daniel Calvo-Westcott
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="border-t border-gray-100" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Made for</span>
              <span className="text-sm font-medium text-gray-800">TSG UK Solutions Ltd</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Parts Finder — disabled after Base44 migration */}

        {/* Logo */}
        <div className="flex justify-center pt-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <span className="text-xs font-semibold text-[#CC0000]">FSE</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 font-medium">FSE FieldPro v1.0.0</p>
        </>
        )}

        {/* Favorites Tab */}
        {activeTab === "favorites" && (
          <>
            {favoriteParts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-base font-semibold text-gray-700 mb-1">No favourites yet</p>
                <p className="text-sm text-gray-400">
                  Tap the star icon on any part in the Parts Finder to save it here for quick access on the job.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteParts.map(part => (
                  <PartCard key={part.id} part={part} allParts={parts} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Offline Tab */}
        {activeTab === "offline" && (
          <>
            {/* Connection status */}
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
                    <p className="text-xs text-amber-700">{queueCount} change{queueCount !== 1 ? 's' : ''} queued — will sync when online</p>
                  </div>
                </>
              )}
            </div>

            {queueCount === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-800 mb-1">Queue Empty</p>
                <p className="text-sm text-gray-500">All changes have been synced</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((action, idx) => (
                  <div key={action.id || idx} className="bg-white rounded-lg border border-gray-200 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm capitalize">
                          {action.type} {action.entityName}
                        </p>
                        <p className="text-xs text-gray-500">{action.timestamp || "Just now"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        action.conflict ? "bg-red-100 text-red-700" :
                        action.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {action.conflict ? "⚠ Conflict" : action.status === "failed" ? "✗ Failed" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}