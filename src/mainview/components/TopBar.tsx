import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { CardType, LibraryStats, SearchQuery } from "../../shared/types";

const COLOR_SWATCHES = [
  "#E05A47",
  "#F24E1E",
  "#F59E0B",
  "#10B981",
  "#0EA5E9",
  "#2563EB",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#111113",
  "#7D8082",
  "#F5F4F0",
];

const CARD_TYPES: Array<{ id: CardType; label: string }> = [
  { id: "design", label: "Design" },
  { id: "website", label: "Website" },
  { id: "article", label: "Article" },
  { id: "repo", label: "GitHub Repo" },
  { id: "model", label: "AI Model" },
  { id: "tool", label: "Tool" },
  { id: "video", label: "Video" },
];

interface TopBarProps {
  title: string;
  subtitle?: string;
  itemCount: number;
  searchQuery: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sort: NonNullable<SearchQuery["sort"]>;
  columns: number;
  showCaptions: boolean;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  activeTag: string | null;
  activeDomain: string | null;
  activeType: CardType | null;
  activeColor: string | null;
  stats: LibraryStats | null;
  onSearchChange: (val: string) => void;
  onSortChange: (sort: NonNullable<SearchQuery["sort"]>) => void;
  onColumnsChange: (cols: number) => void;
  onToggleCaptions: () => void;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onFilterTag: (tag: string | null) => void;
  onFilterDomain: (domain: string | null) => void;
  onFilterType: (type: CardType | null) => void;
  onFilterColor: (hex: string | null) => void;
  onClearAllFilters: () => void;
  onOpenAddSite: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  itemCount,
  searchQuery,
  searchInputRef,
  sort,
  columns,
  showCaptions,
  sidebarOpen,
  inspectorOpen,
  canGoBack,
  canGoForward,
  activeTag,
  activeDomain,
  activeType,
  activeColor,
  stats,
  onSearchChange,
  onSortChange,
  onColumnsChange,
  onToggleCaptions,
  onToggleSidebar,
  onToggleInspector,
  onGoBack,
  onGoForward,
  onFilterTag,
  onFilterDomain,
  onFilterType,
  onFilterColor,
  onClearAllFilters,
  onOpenAddSite,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const hasFilters = Boolean(activeTag || activeDomain || activeType || activeColor);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [filterOpen]);

  return (
    <header className="app-drag relative z-20 flex h-[48px] shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] bg-white/85 px-3.5 backdrop-blur-md">
      {/* Left: Sidebar Toggle + History + Current Title */}
      <div
        className={`app-no-drag flex items-center gap-1.5 min-w-0 ${
          !sidebarOpen ? "pl-[66px]" : ""
        }`}
      >
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Toggle Sidebar (⌘\\)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] transition cursor-pointer"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={onGoBack}
            className="flex h-7 w-6 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] disabled:opacity-30 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            onClick={onGoForward}
            className="flex h-7 w-6 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] disabled:opacity-30 transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-1 flex items-baseline gap-2 min-w-0">
          <h1 className="truncate text-[14px] font-semibold tracking-[-0.015em] text-[#18181B]">
            {title}
          </h1>
          <span className="shrink-0 text-[11.5px] tabular-nums text-[#A1A1AA]">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      {/* Center: Smart Keyword & Operator Search Bar */}
      <div className="app-no-drag relative flex-1 max-w-[380px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A1A1AA]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search keywords, #tag, domain:, cat:..."
          className="h-[30px] w-full rounded-[8px] border border-black/[0.08] bg-[#F5F5F7]/85 pl-8 pr-7 text-[12.5px] text-[#18181B] placeholder:text-[#A1A1AA] outline-none transition focus:border-black/[0.22] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,24,27,0.06)]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#A1A1AA] hover:bg-black/[0.06] hover:text-[#18181B] cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Right: Refto-style View Density Slider + Sort + Filter + Inspector Toggle */}
      <div className="app-no-drag flex items-center gap-1.5">
        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as NonNullable<SearchQuery["sort"]>)}
          title="Sort order"
          className="h-7 rounded-md border border-transparent bg-transparent px-1.5 text-[11.5px] font-medium text-[#52525B] outline-none hover:bg-black/[0.05] hover:text-[#18181B] cursor-pointer"
        >
          <option value="recent">Recent</option>
          <option value="created">Newest</option>
          <option value="title">Title A–Z</option>
          <option value="domain">Domain</option>
          <option value="random">Shuffle</option>
        </select>

        {/* Density / Card Size Slider (refto.one signature) */}
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-md px-2 py-1"
          title={`Grid density: ${columns} columns`}
        >
          <SlidersHorizontal className="h-3 w-3 text-[#A1A1AA]" />
          <input
            type="range"
            min={2}
            max={6}
            step={1}
            value={8 - columns}
            onChange={(e) => onColumnsChange(8 - Number(e.target.value))}
            className="density-slider w-[68px]"
          />
        </div>

        {/* Visual-only vs captions toggle */}
        <button
          type="button"
          onClick={onToggleCaptions}
          title={showCaptions ? "Pure Visual Mode (Hide Captions)" : "Show Captions"}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition cursor-pointer ${
            !showCaptions
              ? "bg-black/[0.07] text-[#18181B]"
              : "text-[#71717A] hover:bg-black/[0.05] hover:text-[#18181B]"
          }`}
        >
          {showCaptions ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>

        {/* Filter Popover Trigger */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            title="Filter by Color, Type, Tag, or Domain"
            className={`relative flex h-7 w-7 items-center justify-center rounded-md transition cursor-pointer ${
              filterOpen || hasFilters
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:bg-black/[0.05] hover:text-[#18181B]"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {hasFilters && !filterOpen && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#E05A47]" />
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-9 z-40 w-[300px] rounded-[13px] border border-black/[0.09] bg-white p-3.5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#18181B]">
                  Visual & Metadata Filters
                </span>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={onClearAllFilters}
                    className="text-[11px] font-medium text-[#E05A47] hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Color Swatches */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
                  Color Palette
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_SWATCHES.map((hex) => {
                    const active = activeColor === hex;
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => onFilterColor(active ? null : hex)}
                        className={`h-5 w-5 rounded-full border transition cursor-pointer ${
                          active
                            ? "scale-110 ring-2 ring-[#18181B] ring-offset-1 border-transparent"
                            : "border-black/15 hover:scale-110"
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Card Types */}
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
                  Type
                </div>
                <div className="flex flex-wrap gap-1">
                  {CARD_TYPES.map((t) => {
                    const active = activeType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onFilterType(active ? null : t.id)}
                        className={`rounded-md px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                          active
                            ? "bg-[#18181B] text-white"
                            : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E4E4E7]"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Tags */}
              {(stats?.topTags?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
                    Popular Tags
                  </div>
                  <div className="flex max-h-[100px] flex-wrap gap-1 overflow-y-auto thin-scroll">
                    {stats!.topTags.slice(0, 16).map((t) => {
                      const active = activeTag === t.name;
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => onFilterTag(active ? null : t.name)}
                          className={`rounded-full px-2 py-0.5 text-[11px] transition cursor-pointer ${
                            active
                              ? "bg-[#18181B] text-white"
                              : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E4E4E7]"
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top Domains */}
              {(stats?.topDomains?.length ?? 0) > 0 && (
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]">
                    Top Domains
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stats!.topDomains.slice(0, 8).map((d) => {
                      const active = activeDomain === d.domain;
                      return (
                        <button
                          key={d.domain}
                          type="button"
                          onClick={() => onFilterDomain(active ? null : d.domain)}
                          className={`rounded-md px-2 py-0.5 text-[11px] transition cursor-pointer ${
                            active
                              ? "bg-[#18181B] text-white"
                              : "bg-[#F4F4F5] text-[#52525B] hover:bg-[#E4E4E7]"
                          }`}
                        >
                          {d.domain}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Site quick button */}
        <button
          type="button"
          onClick={onOpenAddSite}
          title="Save New Site (⌘N)"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.05] hover:text-[#18181B] transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Inspector Panel Toggle */}
        <button
          type="button"
          onClick={onToggleInspector}
          title="Toggle Inspector & Similar Sites"
          className={`flex h-7 w-7 items-center justify-center rounded-md transition cursor-pointer ${
            inspectorOpen
              ? "bg-black/[0.075] text-[#18181B]"
              : "text-[#71717A] hover:bg-black/[0.05] hover:text-[#18181B]"
          }`}
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
