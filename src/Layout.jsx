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
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 shadow-lg">
        <div className="max-w-4xl mx-auto flex">
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center justify-center py-3 ${
              isChat
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Chat</span>
          </Link>
          <Link
            to="/manuals"
            className={`flex-1 flex flex-col items-center justify-center py-3 ${
              isManuals
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <BookOpen className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Manuals</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}