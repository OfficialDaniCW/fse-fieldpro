import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Search, BookOpen, User, Star, Shield, BarChart2, WifiOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueue } from "./lib/pendingQueue";
import { useAuth } from "./lib/AuthContext";
import { ConnectionBannerContext } from "./lib/ConnectionBannerContext";

export default function Layout({ children, currentPageName }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(() => getQueue().length);
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setShowOnlineBanner(false);
    };
    const goOnline = () => {
      setIsOffline(false);
      setPendingCount(getQueue().length);
      setShowOnlineBanner(true);
      setTimeout(() => setShowOnlineBanner(false), 5000);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["manuals"] });
  }, [queryClient]);

  const tabs = [
    { name: "Chat", label: "Assistant", icon: MessageSquare, to: "/" },
    { name: "Parts", label: "Parts", icon: Search, to: "/Parts" },
    { name: "Favorites", label: "Favourites", icon: Star, to: "/Favorites" },
    { name: "Manuals", label: "Manuals", icon: BookOpen, to: "/Manuals" },
    { name: "OfflineMode", label: "Offline", icon: WifiOff, to: "/OfflineMode" },
    ...(isAdmin ? [{ name: "Admin", label: "Admin", icon: Shield, to: "/Admin" }] : []),
    ...(isManager && !isAdmin ? [{ name: "Stats", label: "Stats", icon: BarChart2, to: "/Stats" }] : []),
    { name: "Profile", label: "Profile", icon: User, to: "/Profile" },
  ];

  const bannerNode = (isOffline || showOnlineBanner) ? (
    <div className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold ${
      isOffline
        ? "bg-amber-100 text-amber-700 border-t border-amber-300"
        : "bg-green-100 text-green-700 border-t border-green-300"
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOffline ? "bg-amber-500" : "bg-green-500 animate-pulse"}`} />
      {isOffline
        ? pendingCount > 0 ? `Offline · ${pendingCount} queued` : "Offline · cached"
        : "Online"}
    </div>
  ) : null;

  return (
    <ConnectionBannerContext.Provider value={bannerNode}>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
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
    </ConnectionBannerContext.Provider>
  );
}