import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyRound,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type {
  CardType,
  CreateSiteInput,
  CredentialsStatus,
  LibraryStats,
  SearchQuery,
  SimilarCardResult,
  SiteCard,
  SmartFolder,
  SyncStatus,
} from "../shared/types";
import { rpcClient, subscribeSyncStatus } from "./lib/rpc";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { TopOfMindStrip } from "./components/TopOfMindStrip";
import { VisualCard } from "./components/VisualCard";
import { InspectorPanel } from "./components/InspectorPanel";
import { SettingsModal } from "./components/SettingsModal";
import { AddSiteModal } from "./components/AddSiteModal";

interface NavState {
  view: NonNullable<SearchQuery["view"]>;
  category: string | null;
  spaceId: string | null;
  smartFolderId: string | null;
  smartFolderName: string | null;
  searchQuery: string;
  tag: string | null;
  domain: string | null;
  type: CardType | null;
  colorHex: string | null;
}

const INITIAL_NAV: NavState = {
  view: "all",
  category: null,
  spaceId: null,
  smartFolderId: null,
  smartFolderName: null,
  searchQuery: "",
  tag: null,
  domain: null,
  type: null,
  colorHex: null,
};

const VIEW_LABELS: Record<NonNullable<SearchQuery["view"]>, string> = {
  all: "All Sites",
  pinned: "Top of Mind",
  uncategorized: "Uncategorized",
  untagged: "Untagged",
  recent: "Recent Saves",
  random: "Random Discovery",
  duplicates: "Duplicates",
};

export const App: React.FC = () => {
  const [nav, setNav] = useState<NavState>(INITIAL_NAV);
  const [history, setHistory] = useState<NavState[]>([INITIAL_NAV]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [cards, setCards] = useState<SiteCard[]>([]);
  const [pinnedCards, setPinnedCards] = useState<SiteCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const [selectedCard, setSelectedCard] = useState<SiteCard | null>(null);
  const [similarCards, setSimilarCards] = useState<SimilarCardResult[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const [sort, setSort] = useState<NonNullable<SearchQuery["sort"]>>("recent");
  const [columns, setColumns] = useState(4);
  const [showCaptions, setShowCaptions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addSiteOpen, setAddSiteOpen] = useState(false);
  const [credStatus, setCredStatus] = useState<CredentialsStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: "idle",
    message: "Ready",
  });
  const [toast, setToast] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3400);
  }, []);

  // Push navigation state cleanly
  const navigate = useCallback(
    (updater: NavState | ((prev: NavState) => NavState), replace = false) => {
      setNav((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (replace) {
          setHistory((h) => {
            const copy = [...h];
            copy[historyIdx] = next;
            return copy;
          });
        } else {
          setHistory((h) => [...h.slice(0, historyIdx + 1), next]);
          setHistoryIdx((idx) => idx + 1);
        }
        return next;
      });
    },
    [historyIdx]
  );

  const canGoBack = historyIdx > 0;
  const canGoForward = historyIdx < history.length - 1;

  const goBack = () => {
    if (!canGoBack) return;
    const nextIdx = historyIdx - 1;
    setHistoryIdx(nextIdx);
    setNav(history[nextIdx]);
  };

  const goForward = () => {
    if (!canGoForward) return;
    const nextIdx = historyIdx + 1;
    setHistoryIdx(nextIdx);
    setNav(history[nextIdx]);
  };

  // Load stats & credentials status
  const refreshStats = useCallback(async () => {
    try {
      const [libStats, creds, pinnedRes] = await Promise.all([
        rpcClient.getLibraryStats(),
        rpcClient.getCredentialsStatus(),
        rpcClient.queryCards({ view: "pinned", limit: 12 }),
      ]);
      setStats(libStats);
      setCredStatus(creds);
      setPinnedCards(pinnedRes.cards);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  // Query cards whenever nav/sort changes
  const refreshCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const query: SearchQuery = {
        q: nav.searchQuery || undefined,
        view:
          !nav.category && !nav.spaceId && !nav.smartFolderId ? nav.view : undefined,
        category: nav.category ?? undefined,
        spaceId: nav.spaceId ?? undefined,
        tag: nav.tag ?? undefined,
        domain: nav.domain ?? undefined,
        type: nav.type ?? undefined,
        colorHex: nav.colorHex ?? undefined,
        sort,
      };
      const res = await rpcClient.queryCards(query);
      setCards(res.cards);
    } catch (err) {
      console.error("Failed to query cards:", err);
    } finally {
      setLoadingCards(false);
    }
  }, [nav, sort]);

  useEffect(() => {
    void refreshStats();
    const unsub = subscribeSyncStatus((status) => {
      setSyncStatus(status);
      if (status.state === "success") {
        void refreshStats();
        void refreshCards();
        showToast(status.message);
      } else if (status.state === "error" && status.error !== "NOT_CONFIGURED") {
        showToast(status.message);
      }
    });
    return unsub;
  }, [refreshStats, refreshCards, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshCards();
    }, nav.searchQuery ? 90 : 0);
    return () => clearTimeout(timer);
  }, [refreshCards, nav.searchQuery]);

  // Fetch Similar Cards whenever selectedCard changes
  useEffect(() => {
    if (!selectedCard) {
      setSimilarCards([]);
      return;
    }
    let cancelled = false;
    setLoadingSimilar(true);
    rpcClient
      .getSimilarCards({ id: selectedCard.id, limit: 8 })
      .then((res) => {
        if (!cancelled) setSimilarCards(res);
      })
      .catch((err) => {
        console.error("Similar cards error:", err);
        if (!cancelled) setSimilarCards([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSimilar(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCard]);

  // Keyboard shortcuts (macOS native feel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (meta && e.key === ",") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      } else if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setAddSiteOpen(true);
      } else if (meta && e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (meta && e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (stats?.connected) {
          void handleSyncNow();
        } else {
          void refreshCards();
        }
      } else if (e.key === "Escape") {
        if (settingsOpen) setSettingsOpen(false);
        else if (addSiteOpen) setAddSiteOpen(false);
        else if (inspectorOpen) {
          setInspectorOpen(false);
          setSelectedCard(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen, addSiteOpen, inspectorOpen, stats?.connected, refreshCards]);

  // Category color map
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of stats?.categories ?? []) {
      map.set(c.name.toLowerCase(), c.color);
    }
    return map;
  }, [stats]);

  const getCategoryColor = (card: SiteCard) => {
    const eff = (card.categoryOverride || card.autoCategory).toLowerCase();
    return categoryColorMap.get(eff) ?? "#64748B";
  };

  // Handlers
  const handleSelectCard = (card: SiteCard) => {
    setSelectedCard(card);
    setInspectorOpen(true);
  };

  const handleTogglePin = async (card: SiteCard) => {
    const updated = await rpcClient.togglePin({ id: card.id });
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedCard?.id === updated.id) setSelectedCard(updated);
      void refreshStats();
      showToast(updated.pinned ? "Top of Mind에 고정됨" : "고정 해제됨");
    }
  };

  const handleChangeCategory = async (cardId: string, category: string | null) => {
    const updated = await rpcClient.setCardCategory({ id: cardId, category });
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedCard?.id === updated.id) setSelectedCard(updated);
      void refreshStats();
      showToast(`카테고리 변경됨: ${updated.categoryOverride || updated.autoCategory}`);
    }
  };

  const handleUpdateTags = async (cardId: string, tags: string[]) => {
    const updated = await rpcClient.updateCardTags({ id: cardId, tags });
    if (updated) {
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedCard?.id === updated.id) setSelectedCard(updated);
      void refreshStats();
    }
  };

  const handleDeleteCard = async (card: SiteCard) => {
    await rpcClient.deleteCard({ id: card.id, deleteRemote: false });
    setCards((prev) => prev.filter((c) => c.id !== card.id));
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setInspectorOpen(false);
    }
    void refreshStats();
    showToast("카드가 삭제되었습니다.");
  };

  const handleAddSite = async (input: CreateSiteInput) => {
    const res = await rpcClient.addCard(input);
    await Promise.all([refreshStats(), refreshCards()]);
    setSelectedCard(res.card);
    setInspectorOpen(true);
    if (res.warning) {
      showToast(res.warning);
    } else if (res.pushedToMymind) {
      showToast("mymind에 저장되고 자동 분류되었습니다!");
    } else {
      showToast("로컬 라이브러리에 저장 및 자동 분류되었습니다!");
    }
  };

  const handleSyncNow = async () => {
    setSyncStatus({ state: "syncing", message: "동기화 중..." });
    const res = await rpcClient.syncNow();
    setSyncStatus(res);
    await Promise.all([refreshStats(), refreshCards()]);
  };

  const handleCreateSmartFolder = async (name: string, query: string) => {
    const created = await rpcClient.createSmartFolder({ name, query });
    await refreshStats();
    navigate({
      ...INITIAL_NAV,
      smartFolderId: created.id,
      smartFolderName: created.name,
      searchQuery: created.query,
    });
    showToast(`Smart Folder "${created.name}" 생성됨`);
  };

  const handleDeleteSmartFolder = async (id: string) => {
    await rpcClient.deleteSmartFolder({ id });
    if (nav.smartFolderId === id) {
      navigate(INITIAL_NAV);
    }
    await refreshStats();
  };

  const handleOpenExternal = (url: string) => {
    void rpcClient.openExternalUrl({ url });
  };

  // Current view title
  const currentTitle = useMemo(() => {
    if (nav.smartFolderName) return nav.smartFolderName;
    if (nav.category) return nav.category;
    if (nav.spaceId) {
      return stats?.spaces.find((s) => s.id === nav.spaceId)?.name ?? "Space";
    }
    return VIEW_LABELS[nav.view];
  }, [nav, stats]);

  const showTopOfMind =
    nav.view === "all" &&
    !nav.category &&
    !nav.spaceId &&
    !nav.smartFolderId &&
    !nav.searchQuery &&
    !nav.tag &&
    !nav.domain &&
    !nav.type &&
    !nav.colorHex &&
    pinnedCards.length > 0;

  const activeFilterPills: Array<{ label: string; onRemove: () => void }> = [];
  if (nav.tag) {
    activeFilterPills.push({
      label: `#${nav.tag}`,
      onRemove: () => navigate((prev) => ({ ...prev, tag: null })),
    });
  }
  if (nav.domain) {
    activeFilterPills.push({
      label: `domain:${nav.domain}`,
      onRemove: () => navigate((prev) => ({ ...prev, domain: null })),
    });
  }
  if (nav.type) {
    activeFilterPills.push({
      label: `type:${nav.type}`,
      onRemove: () => navigate((prev) => ({ ...prev, type: null })),
    });
  }
  if (nav.colorHex) {
    activeFilterPills.push({
      label: `color:${nav.colorHex}`,
      onRemove: () => navigate((prev) => ({ ...prev, colorHex: null })),
    });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FA] text-[#18181B]">
      {/* Left Sidebar (refto.one layout) */}
      {sidebarOpen && (
        <Sidebar
          stats={stats}
          activeView={nav.view}
          activeCategory={nav.category}
          activeSpaceId={nav.spaceId}
          activeSmartFolderId={nav.smartFolderId}
          searchInput={nav.searchQuery}
          syncStatus={syncStatus}
          onSelectView={(view) =>
            navigate({
              ...INITIAL_NAV,
              view: view ?? "all",
            })
          }
          onSelectCategory={(category) =>
            navigate({
              ...INITIAL_NAV,
              category,
            })
          }
          onSelectSpace={(spaceId) =>
            navigate({
              ...INITIAL_NAV,
              spaceId,
            })
          }
          onSelectSmartFolder={(sf: SmartFolder) =>
            navigate({
              ...INITIAL_NAV,
              smartFolderId: sf.id,
              smartFolderName: sf.name,
              searchQuery: sf.query,
            })
          }
          onDeleteSmartFolder={(id) => void handleDeleteSmartFolder(id)}
          onCreateSmartFolder={(name, query) => void handleCreateSmartFolder(name, query)}
          onFocusSearch={() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAddSite={() => setAddSiteOpen(true)}
          onSyncNow={() => void handleSyncNow()}
        />
      )}

      {/* Main Visual Workspace */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={currentTitle}
          itemCount={cards.length}
          searchQuery={nav.searchQuery}
          searchInputRef={searchInputRef}
          sort={sort}
          columns={columns}
          showCaptions={showCaptions}
          sidebarOpen={sidebarOpen}
          inspectorOpen={inspectorOpen}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          activeTag={nav.tag}
          activeDomain={nav.domain}
          activeType={nav.type}
          activeColor={nav.colorHex}
          stats={stats}
          onSearchChange={(val) =>
            navigate(
              (prev) => ({
                ...prev,
                searchQuery: val,
                smartFolderId: val !== prev.searchQuery ? null : prev.smartFolderId,
                smartFolderName: val !== prev.searchQuery ? null : prev.smartFolderName,
              }),
              true
            )
          }
          onSortChange={setSort}
          onColumnsChange={setColumns}
          onToggleCaptions={() => setShowCaptions((v) => !v)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleInspector={() => setInspectorOpen((v) => !v)}
          onGoBack={goBack}
          onGoForward={goForward}
          onFilterTag={(tag) => navigate((prev) => ({ ...prev, tag }))}
          onFilterDomain={(domain) => navigate((prev) => ({ ...prev, domain }))}
          onFilterType={(type) => navigate((prev) => ({ ...prev, type }))}
          onFilterColor={(colorHex) => navigate((prev) => ({ ...prev, colorHex }))}
          onClearAllFilters={() =>
            navigate((prev) => ({
              ...prev,
              tag: null,
              domain: null,
              type: null,
              colorHex: null,
            }))
          }
          onOpenAddSite={() => setAddSiteOpen(true)}
        />

        {/* Scrollable Masonry Canvas */}
        <main className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
          {/* Gentle Demo Mode Banner (when mymind API Secret isn't entered yet) */}
          {stats?.demoMode && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-black/[0.06] bg-white/90 px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2.5 text-[12.5px] text-[#52525B]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong className="font-semibold text-[#18181B]">Demo Showcase Mode</strong> —
                  시각적 카드, 키워드 검색, 자동 카테고리 및 유사 사이트 추천을 미리 체험해 보세요.
                  mymind API Secret은 원하실 때 입력할 수 있습니다.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#18181B] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#27272A] transition cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>API Secret 입력하기</span>
              </button>
            </div>
          )}

          {/* Editorial mymind-inspired Search Hero on Clean All View */}
          {showTopOfMind && (
            <div className="mb-3 flex items-baseline justify-between">
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                className="font-editorial italic text-[32px] leading-tight tracking-[-0.02em] text-[#B4B9C3] hover:text-[#71717A] transition text-left cursor-text"
              >
                Search my mind...
              </button>
              {stats?.connected && (
                <button
                  type="button"
                  onClick={() => void handleSyncNow()}
                  disabled={syncStatus.state === "syncing"}
                  className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8E8E93] hover:text-[#18181B] transition cursor-pointer"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      syncStatus.state === "syncing" ? "animate-spin" : ""
                    }`}
                  />
                  <span>{syncStatus.state === "syncing" ? "Syncing..." : "Refresh"}</span>
                </button>
              )}
            </div>
          )}

          {/* Top of Mind Pinned Strip (mymind official app signature) */}
          {showTopOfMind && (
            <TopOfMindStrip
              cards={pinnedCards}
              selectedId={selectedCard?.id ?? null}
              onSelect={handleSelectCard}
            />
          )}

          {/* Active Filter Pills Bar */}
          {activeFilterPills.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {activeFilterPills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1 rounded-full bg-[#18181B] px-2.5 py-1 text-[11.5px] font-medium text-white"
                >
                  {pill.label.startsWith("color:") && (
                    <span
                      className="h-2.5 w-2.5 rounded-full border border-white/40"
                      style={{ backgroundColor: pill.label.slice(6) }}
                    />
                  )}
                  <span>{pill.label}</span>
                  <button
                    type="button"
                    onClick={pill.onRemove}
                    className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Visual-First Masonry Grid (refto.one core experience) */}
          {loadingCards && cards.length === 0 ? (
            <div
              className="gap-3.5"
              style={{ columnCount: columns, columnGap: "14px" }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="mb-3.5 break-inside-avoid animate-pulse rounded-[13px] bg-black/[0.05]"
                  style={{ height: `${180 + (i % 3) * 70}px` }}
                />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-black/[0.06] text-[#A1A1AA] shadow-xs">
                <Search className="h-5 w-5" />
              </div>
              <p className="font-editorial mt-4 text-[22px] text-[#18181B]">
                No matching sites found
              </p>
              <p className="mt-1 max-w-sm text-[12.5px] text-[#71717A]">
                검색어나 필터를 조정하거나, 새 사이트를 추가해 보세요.
                <br />
                팁: <code>#poster</code>, <code>domain:github.com</code>, <code>cat:ai</code> 같은 연산자도 지원합니다.
              </p>
              {(nav.searchQuery || activeFilterPills.length > 0) && (
                <button
                  type="button"
                  onClick={() => navigate(INITIAL_NAV)}
                  className="mt-4 rounded-[8px] border border-black/[0.12] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#18181B] hover:bg-[#F4F4F5] transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                columnCount: columns,
                columnGap: "14px",
              }}
            >
              {cards.map((card) => (
                <VisualCard
                  key={card.id}
                  card={card}
                  selected={selectedCard?.id === card.id}
                  showCaptions={showCaptions}
                  categoryColor={getCategoryColor(card)}
                  onSelect={handleSelectCard}
                  onFindSimilar={handleSelectCard}
                  onTogglePin={(c) => void handleTogglePin(c)}
                  onOpenExternal={handleOpenExternal}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Right Inspector & Similar Sites Recommendation Drawer */}
      {inspectorOpen && (
        <InspectorPanel
          card={selectedCard}
          similarCards={similarCards}
          loadingSimilar={loadingSimilar}
          onClose={() => {
            setInspectorOpen(false);
            setSelectedCard(null);
          }}
          onSelectCard={(card) => setSelectedCard(card)}
          onTogglePin={(c) => void handleTogglePin(c)}
          onChangeCategory={(id, cat) => void handleChangeCategory(id, cat)}
          onUpdateTags={(id, tags) => void handleUpdateTags(id, tags)}
          onDeleteCard={(c) => void handleDeleteCard(c)}
          onFilterByTag={(tag) => navigate((prev) => ({ ...prev, tag }))}
          onFilterByKeyword={(kw) =>
            navigate((prev) => ({ ...prev, searchQuery: kw }))
          }
          onFilterByColor={(hex) =>
            navigate((prev) => ({ ...prev, colorHex: hex }))
          }
          onOpenExternal={handleOpenExternal}
        />
      )}

      {/* Deferred mymind API Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        credentialsStatus={credStatus}
        syncStatus={syncStatus}
        onClose={() => setSettingsOpen(false)}
        onTestConnection={(keyId, secret) =>
          rpcClient.testConnection({ keyId, secret })
        }
        onSaveAndSync={async ({ keyId, secret, autoSyncIntervalMinutes }) => {
          const saved = await rpcClient.saveCredentials({
            keyId,
            secret,
            autoSyncIntervalMinutes,
          });
          if (!saved.ok) {
            return { ok: false, error: saved.error };
          }
          setCredStatus(saved.status);
          const syncRes = await rpcClient.syncNow();
          setSyncStatus(syncRes);
          await Promise.all([refreshStats(), refreshCards()]);
          if (syncRes.state === "error") {
            return { ok: false, error: syncRes.message };
          }
          return { ok: true };
        }}
        onClearCredentials={async (keepData) => {
          const res = await rpcClient.clearCredentials({ keepData });
          setCredStatus(res.status);
          await Promise.all([refreshStats(), refreshCards()]);
          showToast("mymind 연결이 해제되었습니다.");
        }}
        onRecategorizeAll={async () => {
          const res = await rpcClient.recategorizeAll();
          await Promise.all([refreshStats(), refreshCards()]);
          return res.updated;
        }}
        onLoadDemoData={async () => {
          await rpcClient.loadDemoData();
          await Promise.all([refreshStats(), refreshCards()]);
        }}
        onOpenExternal={handleOpenExternal}
      />

      {/* Quick Save Site Modal */}
      <AddSiteModal
        open={addSiteOpen}
        connected={Boolean(stats?.connected)}
        onClose={() => setAddSiteOpen(false)}
        onSubmit={handleAddSite}
      />

      {/* Subtle Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#18181B] px-4 py-2 text-[12px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};
