import React from "react";
import { Info, ExternalLink } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="FSE FieldPro" subtitle="Profile & Settings" />

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* About Section */}
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
              <span className="text-sm font-medium text-gray-800">TSG Solutions</span>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center pt-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
            <span className="text-lg font-bold text-[#CC0000] tracking-tight">FSE</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400">FSE FieldPro</p>
      </div>
    </div>
  );
}