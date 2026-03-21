import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Search, BookOpen, User } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const tabs = [
    { name: "Chat", label: "Assistant", icon: MessageSquare, to: "/" },
    { name: "Parts", label: "Parts", icon: Search, to: "/parts" },
    { name: "Manuals", label: "Manuals", icon: BookOpen, to: "/Manuals" },
    { name: "Profile", label: "Profile", icon: User, to: "/profile" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
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
                    : "text-gray-400 hover:text-gray-600 border-t-2 border-transparent"
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