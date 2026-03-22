import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Search, BookOpen, User, Star, Shield, BarChart2, RefreshCw } from "lucide-react";
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
    ] : []),
    ...(isManager && !isAdmin ? [{ name: "Stats", label: "Stats", icon: BarChart2, to: "/Stats" }] : []),
    { name: "Profile", label: "Profile", icon: User, to: "/Profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {children}
      </main>

      {/* Connection status bar — fixed top, full width */}
      <div className={`fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold shadow-sm transition-all duration-500 ${
        isOffline
          ? "bg-amber-100 text-amber-700 border-b border-amber-300"
          : "bg-green-100 text-green-700 border-b border-green-300"
      }`}>
        <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-green-500 animate-pulse"}`} />
        {isOffline
          ? pendingCount > 0 ? `Offline · ${pendingCount} queued` : "Offline · cached"
          : "Online"}
      </div>

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