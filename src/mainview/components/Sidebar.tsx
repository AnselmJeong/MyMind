import React, { useState } from "react";
import {
  BookOpen,
  Building2,
  Clock,
  Code2,
  Copy,
  Film,
  FolderSearch,
  Inbox,
  KeyRound,
  Layers,
  LayoutGrid,
  Palette,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shuffle,
  Sparkles,
  Tag,
  Trash2,
  Type,
  Wrench,
} from "lucide-react";
import type { LibraryStats, SearchQuery, SmartFolder, SyncStatus } from "../../shared/types";

interface SidebarProps {
  stats: LibraryStats | null;
  activeView: SearchQuery["view"];
  activeCategory: string | null;
  activeSpaceId: string | null;
  activeSmartFolderId: string | null;
  searchInput: string;
  syncStatus: SyncStatus;
  onSelectView: (view: SearchQuery["view"]) => void;
  onSelectCategory: (category: string) => void;
  onSelectSpace: (spaceId: string) => void;
  onSelectSmartFolder: (folder: SmartFolder) => void;
  onDeleteSmartFolder: (id: string) => void;
  onCreateSmartFolder: (name: string, query: string) => void;
  onFocusSearch: () => void;
  onOpenSettings: () => void;
  onOpenAddSite: () => void;
  onSyncNow: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  palette: Palette,
  sparkles: Sparkles,
  code: Code2,
  type: Type,
  wrench: Wrench,
  book: BookOpen,
  layers: Layers,
  building: Building2,
  film: Film,
  inbox: Inbox,
};

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Not synced";
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stats,
  activeView,
  activeCategory,
  activeSpaceId,
  activeSmartFolderId,
  syncStatus,
  onSelectView,
  onSelectCategory,
  onSelectSpace,
  onSelectSmartFolder,
  onDeleteSmartFolder,
  onCreateSmartFolder,
  onFocusSearch,
  onOpenSettings,
  onOpenAddSite,
  onSyncNow,
}) => {
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderQuery, setNewFolderQuery] = useState("");

  const isViewActive = (view: SearchQuery["view"]) =>
    !activeCategory && !activeSpaceId && !activeSmartFolderId && activeView === view;

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !newFolderQuery.trim()) return;
    onCreateSmartFolder(newFolderName.trim(), newFolderQuery.trim());
    setNewFolderName("");
    setNewFolderQuery("");
    setAddingFolder(false);
  };

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-black/[0.07] bg-[#F5F5F7]/95 text-[#3F3F46] select-none">
      {/* macOS Traffic Lights Safe Area + Drag Region */}
      <div className="app-drag flex h-[44px] shrink-0 items-center justify-end px-3 pt-1">
        <button
          type="button"
          onClick={onOpenAddSite}
          title="Save New Site (⌘N)"
          className="app-no-drag flex h-6 w-6 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Workspace Header (refto.one inspired) */}
      <div className="px-3 pb-2.5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center justify-between rounded-[9px] px-2 py-1.5 hover:bg-black/[0.045] transition cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#18181B] text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-[13px] font-semibold tracking-[-0.01em] text-[#18181B]">
                RefMind
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              stats?.connected
                ? "bg-emerald-500/12 text-emerald-700"
                : "bg-amber-500/14 text-amber-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                stats?.connected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {stats?.connected ? "Live" : "Demo"}
          </span>
        </button>

        {/* Quick Search Trigger Pill (refto.one style) */}
        <button
          type="button"
          onClick={onFocusSearch}
          className="mt-2 flex w-full items-center justify-between rounded-[8px] border border-black/[0.07] bg-white/85 px-2.5 py-1.5 text-[12px] text-[#71717A] shadow-[0_1px_1px_rgba(0,0,0,0.02)] hover:border-black/[0.13] hover:text-[#3F3F46] transition cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-[#A1A1AA]" />
            <span>Search</span>
          </span>
          <kbd className="rounded bg-[#F4F4F5] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[#71717A]">
            ⌘F
          </kbd>
        </button>
      </div>

      {/* Scrollable Navigation Sections */}
      <div className="thin-scroll flex-1 overflow-y-auto px-2.5 pb-4 space-y-5">
        {/* Core Library Views */}
        <nav className="space-y-0.5">
          {[
            { id: "all" as const, label: "All Sites", icon: LayoutGrid, count: stats?.total ?? 0 },
            { id: "pinned" as const, label: "Top of Mind", icon: Pin, count: stats?.pinned ?? 0 },
            { id: "recent" as const, label: "Recent", icon: Clock, count: stats?.recent ?? 0 },
            { id: "random" as const, label: "Random", icon: Shuffle, count: null },
            {
              id: "uncategorized" as const,
              label: "Uncategorized",
              icon: Inbox,
              count: stats?.uncategorized ?? 0,
            },
            { id: "untagged" as const, label: "Untagged", icon: Tag, count: stats?.untagged ?? 0 },
            {
              id: "duplicates" as const,
              label: "Duplicates",
              icon: Copy,
              count: stats?.duplicates ?? 0,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = isViewActive(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-medium transition cursor-pointer ${
                  active
                    ? "bg-black/[0.075] text-[#18181B]"
                    : "text-[#52525B] hover:bg-black/[0.04] hover:text-[#18181B]"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active ? "text-[#18181B]" : "text-[#71717A]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== null && item.count > 0 && (
                  <span className="text-[11px] tabular-nums text-[#A1A1AA]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Auto Categories Section */}
        <div>
          <div className="mb-1.5 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-semibold tracking-[0.01em] text-[#8E8E93]">
              Auto Categories
            </span>
            <span className="text-[10px] text-[#A1A1AA]">Auto</span>
          </div>
          <div className="space-y-0.5">
            {(stats?.categories ?? []).map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] ?? Layers;
              const active = activeCategory === cat.name;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onSelectCategory(cat.name)}
                  className={`flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-medium transition cursor-pointer ${
                    active
                      ? "bg-black/[0.075] text-[#18181B]"
                      : "text-[#52525B] hover:bg-black/[0.04] hover:text-[#18181B]"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px]"
                      style={{ backgroundColor: `${cat.color}1C`, color: cat.color }}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="text-[11px] tabular-nums text-[#A1A1AA]">{cat.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Folders (refto.one signature) */}
        <div>
          <div className="mb-1.5 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-semibold tracking-[0.01em] text-[#8E8E93]">
              Smart Folders
            </span>
            <button
              type="button"
              onClick={() => setAddingFolder((v) => !v)}
              title="New Smart Folder"
              className="rounded p-0.5 text-[#8E8E93] hover:bg-black/[0.06] hover:text-[#18181B] transition cursor-pointer"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {addingFolder && (
            <form
              onSubmit={handleSaveFolder}
              className="mb-2 space-y-1.5 rounded-[9px] border border-black/[0.08] bg-white p-2 shadow-xs"
            >
              <input
                type="text"
                placeholder="Folder name (e.g. Posters)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full rounded-md border border-black/[0.08] bg-[#FAFAFB] px-2 py-1 text-[11.5px] text-[#18181B] outline-none focus:border-[#18181B]"
                autoFocus
              />
              <input
                type="text"
                placeholder="Query (e.g. #poster OR cat:design)"
                value={newFolderQuery}
                onChange={(e) => setNewFolderQuery(e.target.value)}
                className="w-full rounded-md border border-black/[0.08] bg-[#FAFAFB] px-2 py-1 text-[11.5px] text-[#18181B] outline-none focus:border-[#18181B]"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setAddingFolder(false)}
                  className="rounded px-2 py-0.5 text-[11px] text-[#71717A] hover:bg-black/[0.05] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[#18181B] px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-[#27272A] cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {(stats?.smartFolders ?? []).map((sf) => {
              const active = activeSmartFolderId === sf.id;
              return (
                <div
                  key={sf.id}
                  className={`group flex items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-medium transition ${
                    active
                      ? "bg-black/[0.075] text-[#18181B]"
                      : "text-[#52525B] hover:bg-black/[0.04] hover:text-[#18181B]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSmartFolder(sf)}
                    className="flex flex-1 items-center gap-2 min-w-0 text-left cursor-pointer"
                  >
                    <FolderSearch
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: sf.color }}
                    />
                    <span className="truncate">{sf.name}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    {!sf.isSystem && (
                      <button
                        type="button"
                        onClick={() => onDeleteSmartFolder(sf.id)}
                        className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-[#A1A1AA] hover:text-red-500 cursor-pointer"
                        title="Delete Smart Folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    <span className="text-[11px] tabular-nums text-[#A1A1AA]">{sf.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* mymind Spaces */}
        {(stats?.spaces?.length ?? 0) > 0 && (
          <div>
            <div className="mb-1.5 px-2.5">
              <span className="text-[11px] font-semibold tracking-[0.01em] text-[#8E8E93]">
                mymind Spaces
              </span>
            </div>
            <div className="space-y-0.5">
              {stats!.spaces.map((space) => {
                const active = activeSpaceId === space.id;
                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => onSelectSpace(space.id)}
                    className={`flex w-full items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-medium transition cursor-pointer ${
                      active
                        ? "bg-black/[0.075] text-[#18181B]"
                        : "text-[#52525B] hover:bg-black/[0.04] hover:text-[#18181B]"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: space.color || "#64748B" }}
                      />
                      <span className="truncate">{space.name}</span>
                    </span>
                    <span className="text-[11px] tabular-nums text-[#A1A1AA]">
                      {space.count ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Connection CTA or Sync Status + Settings */}
      <div className="border-t border-black/[0.06] p-2.5 space-y-1.5">
        {!stats?.connected ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#18181B] px-3 py-1.5 text-[12px] font-medium text-white shadow-xs hover:bg-[#27272A] transition cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Connect mymind API</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onSyncNow}
            disabled={syncStatus.state === "syncing"}
            className="flex w-full items-center justify-between rounded-[8px] border border-black/[0.07] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#3F3F46] hover:border-black/[0.15] disabled:opacity-60 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#52525B] ${
                  syncStatus.state === "syncing" ? "animate-spin text-[#E05A47]" : ""
                }`}
              />
              <span>{syncStatus.state === "syncing" ? "Syncing..." : "Sync mymind"}</span>
            </span>
            <span className="text-[10.5px] text-[#A1A1AA]">
              {formatRelativeTime(stats?.lastSyncedAt)}
            </span>
          </button>
        )}

        <div className="flex items-center justify-between px-1 pt-0.5">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] text-[#71717A] hover:bg-black/[0.05] hover:text-[#18181B] transition cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
          <span className="text-[10.5px] text-[#A1A1AA]">⌘,</span>
        </div>
      </div>
    </aside>
  );
};
