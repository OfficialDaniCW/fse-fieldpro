import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Package, FileText, Users, BarChart2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useCurrentUser } from "../lib/useCurrentUser";

export default function StatsPage() {
  const { isAdmin, isManager, loading } = useCurrentUser();

  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("-created_date", 500),
  });

  const { data: manuals = [] } = useQuery({
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list("-created_date"),
  });

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#CC0000] rounded-full animate-spin" /></div>;

  if (!isAdmin && !isManager) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-500">
        <BarChart2 className="w-12 h-12 text-gray-300" />
        <p className="font-medium">Management access only</p>
      </div>
    );
  }

  // Compute brand distribution from parts
  const brandCounts = parts.reduce((acc, p) => {
    const brand = p.brand || "Unknown";
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});
  const brandData = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Compute manufacturer distribution from manuals
  const mfrCounts = manuals.reduce((acc, m) => {
    const mfr = m.equipment_manufacturer || "Unknown";
    acc[mfr] = (acc[mfr] || 0) + 1;
    return acc;
  }, {});
  const mfrData = Object.entries(mfrCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // System area breakdown
  const systemCounts = parts.reduce((acc, p) => {
    const area = p.system_area || "Unclassified";
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});
  const systemData = Object.entries(systemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const stats = [
    { label: "Total Parts", value: parts.length, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Manuals", value: manuals.length, icon: FileText, color: "text-[#CC0000]", bg: "bg-red-50" },
    { label: "Manufacturers", value: Object.keys(mfrCounts).length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Brands", value: Object.keys(brandCounts).length, icon: BarChart2, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Library Stats" subtitle="Parts & manuals overview" />

      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
              <div className={`${bg} rounded-lg p-2.5`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Parts by Brand */}
        {brandData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Parts by Brand</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={brandData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#CC0000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Parts by System Area */}
        {systemData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Parts by System Area</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={systemData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Manuals by Manufacturer */}
        {mfrData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Manuals by Manufacturer</h3>
            <div className="space-y-2">
              {mfrData.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-32 truncate">{name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#CC0000] h-2 rounded-full"
                      style={{ width: `${(count / Math.max(...mfrData.map(d => d.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}