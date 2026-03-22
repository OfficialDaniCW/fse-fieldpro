import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

const ACTION_COLORS = {
  create: "bg-green-50 border-green-200",
  update: "bg-blue-50 border-blue-200",
  delete: "bg-red-50 border-red-200",
};

const ACTION_BADGES = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
};

export default function ActivityLogViewer() {
  const [filters, setFilters] = useState({
    entity_type: "all",
    action: "all",
    search: "",
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const allLogs = await base44.entities.ActivityLog.list("-created_date", 100);
      return allLogs || [];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    if (filters.entity_type !== "all" && log.entity_type !== filters.entity_type) return false;
    if (filters.action !== "all" && log.action !== filters.action) return false;
    if (filters.search && !log.user_email?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  const entityTypes = [...new Set(logs?.map((log) => log.entity_type) || [])].sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 block mb-1">Search by User</label>
          <Input
            placeholder="Search email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="h-8"
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-gray-600 block mb-1">Entity Type</label>
          <Select value={filters.entity_type} onValueChange={(val) => setFilters({ ...filters, entity_type: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <label className="text-xs font-medium text-gray-600 block mb-1">Action</label>
          <Select value={filters.action} onValueChange={(val) => setFilters({ ...filters, action: val })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No activity logs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id} className={`p-3 border ${ACTION_COLORS[log.action]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${ACTION_BADGES[log.action]}`}>
                      {log.action.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{log.entity_type}</span>
                    <span className="text-xs text-gray-500">ID: {log.entity_id}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>
                      <strong>User:</strong> {log.user_email}
                    </p>
                    <p>
                      <strong>Time:</strong> {log.timestamp ? format(new Date(log.timestamp), "PPpp") : "N/A"}
                    </p>
                  </div>
                  {log.changes && (
                    <div className="mt-2 text-xs text-gray-600 bg-black bg-opacity-5 p-2 rounded">
                      <strong>Changes:</strong>
                      <pre className="text-xs overflow-x-auto mt-1">{JSON.stringify(log.changes, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}