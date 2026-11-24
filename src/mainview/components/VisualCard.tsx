import React, { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Cpu,
  Globe,
  Palette,
  Pin,
  Sparkles,
  Wrench,
  Film,
  FileText,
} from "lucide-react";
import type { SiteCard } from "../../shared/types";

interface VisualCardProps {
  card: SiteCard;
  selected: boolean;
  showCaptions: boolean;
  categoryColor: string;
  onSelect: (card: SiteCard) => void;
  onFindSimilar: (card: SiteCard) => void;
  onTogglePin: (card: SiteCard) => void;
  onOpenExternal: (url: string) => void;
}

const TYPE_META: Record<
  SiteCard["type"],
  { label: string; accent: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  repo: { label: "GITHUB", accent: "#10B981", Icon: Code2 },
  model: { label: "MODEL", accent: "#10B981", Icon: Cpu },
  article: { label: "ARTICLE", accent: "#3B82F6", Icon: BookOpen },
  design: { label: "DESIGN", accent: "#E05A47", Icon: Palette },
  tool: { label: "TOOL", accent: "#0EA5E9", Icon: Wrench },
  video: { label: "VIDEO", accent: "#F97316", Icon: Film },
  image: { label: "VISUAL", accent: "#8B5CF6", Icon: Palette },
  note: { label: "NOTE", accent: "#F59E0B", Icon: FileText },
  website: { label: "SITE", accent: "#64748B", Icon: Globe },
};

export const VisualCard: React.FC<VisualCardProps> = ({
  card,
  selected,
  showCaptions,
  categoryColor,
  onSelect,
  onFindSimilar,
  onTogglePin,
  onOpenExternal,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = !imgFailed ? card.thumbnailUrl || card.screenshotUrl : null;
  const meta = TYPE_META[card.type] ?? TYPE_META.website;
  const TypeIcon = meta.Icon;

  const isCleanAccentCard = !imageSrc;
  const accentColor =
    card.dominantColor && card.dominantColor !== "#E8ECF2" && card.dominantColor !== "#FFFFFF"
      ? card.dominantColor
      : meta.accent;

  return (
    <div className="group mb-3.5 break-inside-avoid">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(card);
          }
        }}
        className={`visual-card relative overflow-hidden rounded-[13px] bg-white cursor-pointer border transition-all ${
          selected
            ? "border-[#18181B] ring-2 ring-[#18181B]/15 shadow-md"
            : "border-black/[0.07] hover:border-black/[0.15] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        }`}
      >
        {imageSrc ? (
          /* Visual-First Hero Image Card (refto.one style) */
          <div className="relative w-full overflow-hidden bg-[#F1F2F4]">
            <img
              src={imageSrc}
              alt={card.title}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="block w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />

            {/* Subtle top-left pin badge if pinned */}
            {card.pinned && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">
                <Pin className="h-2.5 w-2.5 fill-current" />
                <span>Pinned</span>
              </div>
            )}

            {/* Floating Hover Chrome — minimal, translucent */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 transition-all duration-150 group-hover:opacity-100">
              <button
                type="button"
                title="Find Similar Sites"
                onClick={(e) => {
                  e.stopPropagation();
                  onFindSimilar(card);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#18181B] shadow-sm backdrop-blur-md hover:bg-white hover:scale-105 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title={card.pinned ? "Unpin from Top of Mind" : "Pin to Top of Mind"}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(card);
                }}
                className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur-md hover:scale-105 transition cursor-pointer ${
                  card.pinned
                    ? "bg-[#18181B] text-white"
                    : "bg-white/92 text-[#18181B] hover:bg-white"
                }`}
              >
                <Pin className={`h-3.5 w-3.5 ${card.pinned ? "fill-current" : ""}`} />
              </button>
              {card.url && (
                <button
                  type="button"
                  title="Open Website"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenExternal(card.url);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/92 text-[#18181B] shadow-sm backdrop-blur-md hover:bg-white hover:scale-105 transition cursor-pointer"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Bottom hover metadata strip */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white drop-shadow-sm">
                  {card.title}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/85">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="truncate">{card.domain || card.autoCategory}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Crafted Editorial Fallback Card (mymind official app style — Screenshot 2!) */
          <div className="relative flex min-h-[210px] flex-col justify-between bg-white">
            {/* Signature Colored Top Accent Bar */}
            <div
              className="h-[3.5px] w-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />

            <div className="flex flex-1 flex-col justify-between p-4">
              {/* Top row: site icon / monogram + hover actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F5F7] text-[#3F3F46] border border-black/[0.05]">
                  <TypeIcon className="h-4 w-4" />
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <button
                    type="button"
                    title="Find Similar Sites"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFindSimilar(card);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F5F7] text-[#3F3F46] hover:bg-[#E4E4E7] transition cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title={card.pinned ? "Unpin" : "Pin"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(card);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition cursor-pointer ${
                      card.pinned
                        ? "bg-[#18181B] text-white"
                        : "bg-[#F4F5F7] text-[#3F3F46] hover:bg-[#E4E4E7]"
                    }`}
                  >
                    <Pin className={`h-3 w-3 ${card.pinned ? "fill-current" : ""}`} />
                  </button>
                  {card.url && (
                    <button
                      type="button"
                      title="Open Website"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExternal(card.url);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F5F7] text-[#3F3F46] hover:bg-[#E4E4E7] transition cursor-pointer"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Center Editorial Serif Title + Summary */}
              <div className="my-5">
                <h3 className="font-editorial text-[21px] leading-[1.22] tracking-[-0.015em] text-[#18181B] line-clamp-3">
                  {card.title}
                </h3>
                {card.summary && (
                  <p className="mt-2 text-[12px] leading-[1.45] text-[#71717A] line-clamp-2">
                    {card.summary}
                  </p>
                )}
              </div>

              {/* Bottom bar: domain + mymind-style boxed type pill */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <span className="truncate text-[11px] font-medium text-[#71717A]">
                    {card.domain || card.autoCategory}
                  </span>
                </div>
                <span className="shrink-0 rounded-[5px] border border-black/[0.12] bg-[#FAFAFB] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.06em] text-[#3F3F46]">
                  {meta.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal caption underneath (optional, mimics mymind's subtle label below visual cards) */}
      {showCaptions && !isCleanAccentCard && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
          <p className="truncate text-[11.5px] font-medium text-[#52525B] group-hover:text-[#18181B] transition-colors">
            {card.title}
          </p>
          <span className="shrink-0 text-[10px] text-[#A1A1AA]">
            {card.domain?.replace(/^www\./, "")}
          </span>
        </div>
      )}
    </div>
  );
};
