import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, BookOpen } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const isChat = currentPageName === "Chat";
  const isManuals = currentPageName === "Manuals";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 fixed bottom-0 left-0 right-0">
        <div className="max-w-4xl mx-auto flex">
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center justify-center py-3 ${
              isChat
                ? "text-blue-400 border-t-2 border-blue-500"
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Assistant</span>
          </Link>
          <Link
            to="/manuals"
            className={`flex-1 flex flex-col items-center justify-center py-3 ${
              isManuals
                ? "text-blue-400 border-t-2 border-blue-500"
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Database</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}