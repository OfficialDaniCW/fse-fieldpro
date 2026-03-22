import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Search, Plus, List, FolderOpen, Eye, FileText, WifiOff } from "lucide-react";
import ManualWikiViewer from "@/components/ManualWikiViewer";
import ManualForm from "@/components/ManualForm";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { useOfflineCache, useCacheMetadata } from "@/hooks/useOfflineCache";

export default function Manuals() {
  const [search, setSearch] = useState("");
  const [selectedManual, setSelectedManual] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("folder"); // "folder" or "list"
  const [breadcrumb, setBreadcrumb] = useState([]); // for folder navigation
  const queryClient = useQueryClient();
  const { isAdmin } = useCurrentUser();

  const { data: manuals = [], isOfflineData } = useOfflineCache('manuals', {
    queryKey: ["manuals"],
    queryFn: () => base44.entities.Manual.list(),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: () => base44.entities.ManualFolder.list(),
  });

  const cacheMetadata = useCacheMetadata();
  const cacheAge = cacheMetadata?.manuals_cached_at 
    ? Math.round((Date.now() - cacheMetadata.manuals_cached_at) / 1000 / 60) 
    : null;

  // Auto-open a manual if ?manual=<id> is in the URL
  useEffect(() => {
    if (manuals.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const manualId = params.get("manual");
    if (manualId && !selectedManual) {
      const found = manuals.find(m => m.id === manualId);
      if (found) setSelectedManual(found);
    }
  }, [manuals]);

  // Search across title, manufacturer, model, manual_text
  const filtered = manuals.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.manufacturer?.toLowerCase().includes(q) ||
      m.model?.toLowerCase().includes(q) ||
      m.manual_text?.toLowerCase().includes(q)
    );
  });

  // Get root folders
  const rootFolders = folders.filter(f => !f.parent_folder_id);

  // Get current folder contents (for breadcrumb navigation)
  const getCurrentFolderContents = () => {
    if (breadcrumb.length === 0) {
      return rootFolders;
    }
    const currentFolderId = breadcrumb[breadcrumb.length - 1];
    return folders.filter(f => f.parent_folder_id === currentFolderId);
  };

  // Get manuals in current folder
  const getManualsInFolder = () => {
    if (breadcrumb.length === 0) return [];
    const currentFolderId = breadcrumb[breadcrumb.length - 1];
    return filtered.filter(m => m.folder_id === currentFolderId);
  };

  const handleFolderClick = (folderId) => {
    setBreadcrumb([...breadcrumb, folderId]);
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setBreadcrumb([]);
    } else {
      setBreadcrumb(breadcrumb.slice(0, index + 1));
    }
  };

  if (selectedManual) {
    return <ManualWikiViewer manual={selectedManual} onBack={() => setSelectedManual(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Offline indicator */}
      {isOfflineData && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm">
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span className="text-amber-800 font-medium">Offline mode</span>
          {cacheAge !== null && <span className="text-amber-700 text-xs">• Cached {cacheAge}m ago</span>}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#CC0000] shadow-md px-4 pt-10 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-[#CC0000]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">Manuals Library</h1>
              <p className="text-xs text-red-200 font-normal">{manuals.length} manuals</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:bg-white/40 transition-colors"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search title, brand, model, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-12 rounded-xl text-sm bg-white border-0 outline-none text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setViewMode("folder")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              viewMode === "folder"
                ? "bg-white text-[#CC0000]"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <FolderOpen className="w-4 h-4 inline mr-1" />
            Folders
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              viewMode === "list"
                ? "bg-white text-[#CC0000]"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <List className="w-4 h-4 inline mr-1" />
            List
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Folder View */}
        {viewMode === "folder" && (
          <div>
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleBreadcrumbClick(-1)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Library
                </button>
                {breadcrumb.map((folderId, idx) => {
                  const folder = folders.find(f => f.id === folderId);
                  return (
                    <div key={folderId} className="flex items-center gap-2">
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => handleBreadcrumbClick(idx)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {folder?.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-4">
              {/* Folders */}
              {getCurrentFolderContents().length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Folders</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getCurrentFolderContents().map(folder => {
                      const manualCount = manuals.filter(m => m.folder_id === folder.id).length;
                      return (
                        <button
                          key={folder.id}
                          onClick={() => handleFolderClick(folder.id)}
                          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-[#CC0000] hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">{folder.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">{manualCount} manuals</p>
                            </div>
                            <FolderOpen className="w-5 h-5 text-[#CC0000] flex-shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Manuals in current folder */}
              {getManualsInFolder().length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-600 mb-2">Manuals</h2>
                  <div className="space-y-2">
                    {getManualsInFolder().map(manual => (
                      <div
                        key={manual.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 line-clamp-2">{manual.title}</h3>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {manual.manufacturer}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {manual.model}
                              </span>
                              {manual.manual_type && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {manual.manual_type}
                                </span>
                              )}
                            </div>
                            {manual.parts_linked > 0 && (
                              <p className="text-xs text-green-600 mt-1 font-medium">
                                {manual.parts_linked} parts linked
                              </p>
                            )}
                            {manual.processing_status === 'processing' && (
                              <p className="text-xs text-amber-600 mt-1 font-medium">
                                Processing…
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {manual.pdf_file && (
                              <a
                                href={manual.pdf_file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                title="Open PDF"
                              >
                                <FileText className="w-4 h-4 text-gray-600" />
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedManual(manual)}
                              className="w-9 h-9 rounded-lg bg-[#CC0000] hover:bg-[#aa0000] flex items-center justify-center transition-colors text-white"
                              title="Open Wiki"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breadcrumb.length === 0 && getCurrentFolderContents().length === 0 && getManualsInFolder().length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No manuals yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isAdmin ? "Upload your first manual to get started." : "Manuals will appear here."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No manuals found</p>
              </div>
            ) : (
              filtered
                .sort((a, b) => (a.manufacturer || "").localeCompare(b.manufacturer || ""))
                .map(manual => (
                  <div
                    key={manual.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-2">{manual.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {manual.manufacturer}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {manual.model}
                          </span>
                        </div>
                        {manual.parts_linked > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            {manual.parts_linked} parts linked
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {manual.pdf_file && (
                          <a
                            href={manual.pdf_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            title="Open PDF"
                          >
                            <FileText className="w-4 h-4 text-gray-600" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedManual(manual)}
                          className="w-9 h-9 rounded-lg bg-[#CC0000] hover:bg-[#aa0000] flex items-center justify-center transition-colors text-white"
                          title="Open Wiki"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Upload Form Modal */}
      {showForm && (
        <ManualForm
          onClose={() => setShowForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["manuals"] })}
        />
      )}
    </div>
  );
}