import React from "react";
import { Pin } from "lucide-react";
import type { SiteCard } from "../../shared/types";

interface TopOfMindStripProps {
  cards: SiteCard[];
  selectedId: string | null;
  onSelect: (card: SiteCard) => void;
}

export const TopOfMindStrip: React.FC<TopOfMindStripProps> = ({
  cards,
  selectedId,
  onSelect,
}) => {
  if (cards.length === 0) return null;

  return (
    <div className="mb-5 flex items-stretch gap-3 rounded-[14px] border border-black/[0.05] bg-[#EBEEF3]/75 p-3">
      <div className="thin-scroll flex flex-1 items-center gap-2.5 overflow-x-auto pb-0.5">
        {cards.map((card) => {
          const thumb = card.thumbnailUrl || card.screenshotUrl;
          const active = selectedId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelect(card)}
              className={`group relative h-[92px] w-[144px] shrink-0 overflow-hidden rounded-[10px] border bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                active
                  ? "border-[#18181B] ring-2 ring-[#18181B]/15"
                  : "border-black/[0.08]"
              }`}
            >
              {thumb ? (
                <>
                  <img
                    src={thumb}
                    alt={card.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute inset-x-2 bottom-1.5 truncate text-[10.5px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {card.title}
                  </p>
                </>
              ) : (
                <div className="flex h-full flex-col justify-between p-2.5">
                  <div
                    className="h-1 w-7 rounded-full"
                    style={{ backgroundColor: card.dominantColor || "#2563EB" }}
                  />
                  <p className="font-editorial text-[13.5px] leading-tight text-[#18181B] line-clamp-2">
                    {card.title}
                  </p>
                  <span className="truncate text-[9.5px] text-[#71717A]">
                    {card.domain}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Vertical "TOP OF MIND" label inspired directly by mymind official app */}
      <div className="hidden sm:flex flex-col items-center justify-center rounded-[9px] bg-white/75 px-2 py-2 text-[#8E8E93]">
        <Pin className="mb-1.5 h-3 w-3" />
        <span
          className="text-[9px] font-semibold tracking-[0.16em] uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          Top of Mind
        </span>
      </div>
    </div>
  );
};
