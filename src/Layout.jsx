import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Search, BookOpen, User, WifiOff, Star, Shield, BarChart2, RefreshCw } from "lucide-react";
import useSyncManager from "./lib/useSyncManager";
import { useQueryClient } from "@tanstack/react-query";
import { getQueue } from "./lib/pendingQueue";
import { useCurrentUser } from "./lib/useCurrentUser";

export default function Layout({ children, currentPageName }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(() => getQueue().length);
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useCurrentUser();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => { setIsOffline(false); setPendingCount(getQueue().length); };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Sync manager — fires when device reconnects
  useSyncManager({
    onSynced: () => {
      setPendingCount(getQueue().length);
      queryClient.invalidateQueries({ queryKey: ["manuals"] });
    },
  });

  const tabs = [
    { name: "Chat", label: "Assistant", icon: MessageSquare, to: "/" },
    { name: "Parts", label: "Parts", icon: Search, to: "/Parts" },
    { name: "Favorites", label: "Favourites", icon: Star, to: "/Favorites" },
    { name: "Manuals", label: "Manuals", icon: BookOpen, to: "/Manuals" },
    ...(isAdmin ? [
      { name: "Admin", label: "Admin", icon: Shield, to: "/Admin" },
      { name: "SyncManager", label: "Sync", icon: RefreshCw, to: "/SyncManager" },
    ] : []),
    ...(isManager && !isAdmin ? [{ name: "Stats", label: "Stats", icon: BarChart2, to: "/Stats" }] : []),
    { name: "Profile", label: "Profile", icon: User, to: "/Profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 py-1.5">
          <WifiOff className="w-3.5 h-3.5" />
          Offline — cached data{pendingCount > 0 ? ` · ${pendingCount} action${pendingCount > 1 ? "s" : ""} queued` : ""}
        </div>
      )}
      <main className={`flex-1 ${isOffline ? "pt-7" : ""}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map(({ name, label, icon: Icon, to }) => {
            const isActive = currentPageName === name;
            return (
              <Link
                key={name}
                to={to}
                className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                  isActive
                    ? "text-[#CC0000] border-t-2 border-[#CC0000]"
                    : "text-gray-400 hover:text-gray-500 border-t-2 border-transparent"
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}