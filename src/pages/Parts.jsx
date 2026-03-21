import React from "react";
import { Search } from "lucide-react";

export default function PartsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-[#CC0000] text-white px-4 py-4 shadow-lg">
        <h1 className="text-xl font-bold">Parts Finder</h1>
        <p className="text-xs text-red-100 mt-1">Search for equipment parts</p>
      </div>

      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center justify-center mt-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-[#CC0000]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          The Parts Finder will let you search and identify replacement parts for fuel dispensing equipment.
        </p>
      </div>
    </div>
  );
}