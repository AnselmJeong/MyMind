import React, { useState } from "react";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Hash,
  Layers,
  Pin,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { SimilarCardResult, SiteCard } from "../../shared/types";

const ALL_CATEGORIES = [
  "Design & Visual",
  "AI & Machine Learning",
  "Dev & Engineering",
  "Typography & Brand",
  "Tools & Productivity",
  "Research & Reading",
  "Products & SaaS",
  "Architecture & Space",
  "Media & Culture",
  "Uncategorized",
];

interface InspectorPanelProps {
  card: SiteCard | null;
  similarCards: SimilarCardResult[];
  loadingSimilar: boolean;
  onClose: () => void;
  onSelectCard: (card: SiteCard) => void;
  onTogglePin: (card: SiteCard) => void;
  onChangeCategory: (cardId: string, category: string | null) => void;
  onUpdateTags: (cardId: string, tags: string[]) => void;
  onDeleteCard: (card: SiteCard) => void;
  onFilterByTag: (tag: string) => void;
  onFilterByKeyword: (keyword: string) => void;
  onFilterByColor: (hex: string) => void;
  onOpenExternal: (url: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  card,
  similarCards,
  loadingSimilar,
  onClose,
  onSelectCard,
  onTogglePin,
  onChangeCategory,
  onUpdateTags,
  onDeleteCard,
  onFilterByTag,
  onFilterByKeyword,
  onFilterByColor,
  onOpenExternal,
}) => {
  const [newTag, setNewTag] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!card) {
    return (
      <aside className="flex h-full w-[348px] shrink-0 flex-col items-center justify-center border-l border-black/[0.07] bg-white/95 px-8 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F4F5] text-[#71717A]">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[13.5px] font-medium text-[#18181B]">
          Select a site card
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#71717A]">
          카드를 클릭하면 상세 정보, 자동 분류, 그리고 저장된 사이트 중 가장 유사한 사이트 추천을 확인할 수 있습니다.
        </p>
      </aside>
    );
  }

  const effectiveCategory = card.categoryOverride || card.autoCategory;
  const heroImage = card.screenshotUrl || card.thumbnailUrl;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newTag.trim().replace(/^#/, "");
    if (!cleaned) return;
    const next = Array.from(new Set([...card.tags.map((t) => t.name), cleaned]));
    onUpdateTags(card.id, next);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const next = card.tags
      .map((t) => t.name)
      .filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onUpdateTags(card.id, next);
  };

  return (
    <aside className="flex h-full w-[356px] shrink-0 flex-col border-l border-black/[0.07] bg-white">
      {/* Header */}
      <div className="app-drag flex h-[48px] shrink-0 items-center justify-between border-b border-black/[0.06] px-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[12px] font-semibold text-[#71717A]">
            Inspector
          </span>
          {card.hasEmbedding && (
            <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
              AI Vector
            </span>
          )}
        </div>
        <div className="app-no-drag flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePin(card)}
            title={card.pinned ? "Unpin" : "Pin to Top of Mind"}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition cursor-pointer ${
              card.pinned
                ? "bg-[#18181B] text-white"
                : "text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B]"
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${card.pinned ? "fill-current" : ""}`} />
          </button>
          {card.url && (
            <button
              type="button"
              onClick={() => onOpenExternal(card.url)}
              title="Open in Browser"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] transition cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close Inspector (Esc)"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="thin-scroll flex-1 overflow-y-auto p-4 space-y-5">
        {/* Visual Preview */}
        {heroImage ? (
          <div
            onClick={() => card.url && onOpenExternal(card.url)}
            className="group relative overflow-hidden rounded-[12px] border border-black/[0.08] bg-[#F4F4F6] cursor-pointer"
          >
            <img
              src={heroImage}
              alt={card.title}
              className="max-h-[250px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {card.url && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                <span>Visit Site</span>
                <ArrowUpRight className="h-3 w-3" />
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-[12px] border border-black/[0.08] p-4"
            style={{
              background: `linear-gradient(135deg, ${card.dominantColor}18 0%, #FFFFFF 100%)`,
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#71717A]">
              {card.type} · {card.domain || "saved item"}
            </div>
            <p className="font-editorial mt-2 text-[22px] leading-snug text-[#18181B]">
              {card.title}
            </p>
          </div>
        )}

        {/* Title & URL */}
        <div>
          <h2
            data-selectable="true"
            className="font-editorial text-[21px] leading-[1.25] tracking-[-0.015em] text-[#18181B]"
          >
            {card.title}
          </h2>
          {card.url && (
            <button
              type="button"
              onClick={() => onOpenExternal(card.url)}
              className="mt-1.5 inline-flex max-w-full items-center gap-1 text-[12px] text-[#52525B] hover:text-[#18181B] underline decoration-black/20 underline-offset-2 transition cursor-pointer"
            >
              <span className="truncate">{card.url.replace(/^https?:\/\//, "")}</span>
              <ArrowUpRight className="h-3 w-3 shrink-0" />
            </button>
          )}
          {card.summary && (
            <p
              data-selectable="true"
              className="mt-2.5 text-[12.5px] leading-[1.55] text-[#52525B]"
            >
              {card.summary}
            </p>
          )}
        </div>

        {/* Auto-Category Selector */}
        <div className="rounded-[10px] border border-black/[0.07] bg-[#FAFAFB] p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              <Layers className="h-3 w-3" />
              Category
            </span>
            {!card.categoryOverride && card.categoryConfidence > 0 && (
              <span className="text-[10.5px] text-[#71717A]">
                Auto · {Math.round(card.categoryConfidence * 100)}%
              </span>
            )}
            {card.categoryOverride && (
              <button
                type="button"
                onClick={() => onChangeCategory(card.id, null)}
                className="text-[10.5px] text-[#E05A47] hover:underline cursor-pointer"
              >
                Reset to Auto
              </button>
            )}
          </div>
          <select
            value={effectiveCategory}
            onChange={(e) => onChangeCategory(card.id, e.target.value)}
            className="mt-2 w-full rounded-[7px] border border-black/[0.09] bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-[#18181B] outline-none focus:border-[#18181B]"
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              Tags
            </span>
            <span className="text-[10.5px] text-[#A1A1AA]">{card.tags.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {card.tags.map((t) => (
              <span
                key={t.name}
                className="group/tag inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-[#F5F5F7] px-2.5 py-0.5 text-[11.5px] font-medium text-[#3F3F46] hover:border-black/[0.18] transition"
              >
                <button
                  type="button"
                  onClick={() => onFilterByTag(t.name)}
                  className="inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <Hash className="h-2.5 w-2.5 text-[#A1A1AA]" />
                  {t.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t.name)}
                  className="ml-0.5 rounded-full text-[#A1A1AA] hover:text-[#18181B] cursor-pointer"
                  title="Remove tag"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 rounded-[7px] border border-black/[0.08] bg-[#FAFAFB] px-2.5 py-1 text-[12px] text-[#18181B] outline-none focus:border-[#18181B] focus:bg-white"
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-black/[0.08] bg-white text-[#52525B] hover:bg-[#18181B] hover:text-white transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Auto Keywords */}
        {card.autoKeywords.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              Extracted Keywords
            </div>
            <div className="flex flex-wrap gap-1">
              {card.autoKeywords.slice(0, 8).map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onFilterByKeyword(kw)}
                  className="rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] text-[#52525B] hover:bg-[#18181B] hover:text-white transition cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette */}
        {card.palette.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              Visual Palette
            </div>
            <div className="flex items-center gap-2">
              {card.palette.map((swatch, idx) => (
                <button
                  key={`${swatch.hex}-${idx}`}
                  type="button"
                  title={`Filter by ${swatch.hex}`}
                  onClick={() => onFilterByColor(swatch.hex)}
                  className="h-6 w-6 rounded-full border border-black/15 shadow-xs transition hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {card.notes.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              Notes
            </div>
            <div className="space-y-1.5">
              {card.notes.map((n) => (
                <div
                  key={n.id}
                  data-selectable="true"
                  className="rounded-[9px] bg-[#FEFCE8] border border-amber-200/70 px-3 py-2 text-[12px] leading-relaxed text-[#422006]"
                >
                  {n.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMILAR SITES RECOMMENDATIONS (Core Feature!) */}
        <div className="border-t border-black/[0.07] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#E05A47]" />
              <span className="text-[12px] font-semibold text-[#18181B]">
                Similar Sites in Your Mind
              </span>
            </div>
            <span className="text-[11px] text-[#A1A1AA]">
              {loadingSimilar ? "..." : `${similarCards.length}`}
            </span>
          </div>

          {loadingSimilar ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[68px] animate-pulse rounded-[10px] bg-[#F4F4F5]"
                />
              ))}
            </div>
          ) : similarCards.length === 0 ? (
            <p className="rounded-[10px] bg-[#FAFAFB] px-3 py-4 text-center text-[12px] text-[#71717A]">
              아직 유사한 사이트가 발견되지 않았습니다. 사이트를 더 동기화하면 추천 정확도가 높아집니다.
            </p>
          ) : (
            <div className="space-y-2">
              {similarCards.map((sim) => {
                const simThumb = sim.card.thumbnailUrl || sim.card.screenshotUrl;
                const matchPct = Math.round(sim.score * 100);
                return (
                  <button
                    key={sim.card.id}
                    type="button"
                    onClick={() => onSelectCard(sim.card)}
                    className="group flex w-full items-center gap-2.5 rounded-[10px] border border-black/[0.06] bg-[#FAFAFB] p-2 text-left hover:border-black/[0.16] hover:bg-white hover:shadow-xs transition cursor-pointer"
                  >
                    {/* Mini visual preview */}
                    <div
                      className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[8px] border border-black/[0.06] flex items-center justify-center"
                      style={{
                        backgroundColor: simThumb
                          ? "#F1F2F4"
                          : `${sim.card.dominantColor}22`,
                      }}
                    >
                      {simThumb ? (
                        <img
                          src={simThumb}
                          alt={sim.card.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-editorial text-[16px] font-medium text-[#3F3F46]">
                          {sim.card.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Title + match % + reasons */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="truncate text-[12.5px] font-medium text-[#18181B] group-hover:text-black">
                          {sim.card.title}
                        </p>
                        <span className="shrink-0 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-700">
                          {matchPct}%
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-[#71717A]">
                        {sim.card.domain || sim.card.autoCategory}
                      </p>
                      {sim.reasons.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {sim.reasons.slice(0, 2).map((reason) => (
                            <span
                              key={reason}
                              className="truncate max-w-[140px] rounded bg-black/[0.045] px-1.5 py-0.2 text-[10px] text-[#52525B]"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer metadata + delete */}
        <div className="border-t border-black/[0.06] pt-3 flex items-center justify-between text-[11px] text-[#A1A1AA]">
          <span>Saved {new Date(card.created).toLocaleDateString()}</span>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1 text-[#A1A1AA] hover:text-red-600 transition cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDeleteCard(card);
                }}
                className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10.5px] font-medium text-white hover:bg-red-700 cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded px-1.5 py-0.5 text-[10.5px] text-[#71717A] hover:bg-black/[0.05] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
