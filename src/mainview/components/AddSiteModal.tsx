import React, { useState } from "react";
import { Globe, Plus, Sparkles, X } from "lucide-react";
import type { CreateSiteInput } from "../../shared/types";

interface AddSiteModalProps {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSiteInput) => Promise<void>;
}

export const AddSiteModal: React.FC<AddSiteModalProps> = ({
  open,
  connected,
  onClose,
  onSubmit,
}) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [note, setNote] = useState("");
  const [pushToMymind, setPushToMymind] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const tags = tagsRaw
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);
      await onSubmit({
        url: url.trim(),
        title: title.trim() || undefined,
        summary: summary.trim() || undefined,
        tags,
        note: note.trim() || undefined,
        pushToMymind: connected && pushToMymind,
      });
      setUrl("");
      setTitle("");
      setSummary("");
      setTagsRaw("");
      setNote("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#E05A47]" />
            <h2 className="text-[14px] font-semibold text-[#18181B]">
              Save New Site to Mind
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
              Site URL *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://refto.one"
              className="w-full rounded-[9px] border border-black/[0.11] px-3 py-2 text-[13px] outline-none focus:border-[#18181B]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="자동으로 도메인 또는 mymind 제목 사용"
              className="w-full rounded-[9px] border border-black/[0.11] px-3 py-2 text-[13px] outline-none focus:border-[#18181B]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
              Summary / Description
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="사이트에 대한 간단한 설명 (검색 및 유사 사이트 추천에 활용)"
              className="w-full rounded-[9px] border border-black/[0.11] px-3 py-2 text-[13px] outline-none focus:border-[#18181B]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
              Tags (space or comma separated)
            </label>
            <input
              type="text"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="design, typography, ai, macos"
              className="w-full rounded-[9px] border border-black/[0.11] px-3 py-2 text-[13px] outline-none focus:border-[#18181B]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
              Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="이 사이트를 저장한 이유나 메모..."
              className="w-full resize-none rounded-[9px] border border-black/[0.11] px-3 py-2 text-[13px] outline-none focus:border-[#18181B]"
            />
          </div>

          {connected && (
            <label className="flex items-center gap-2 text-[12px] text-[#52525B] cursor-pointer">
              <input
                type="checkbox"
                checked={pushToMymind}
                onChange={(e) => setPushToMymind(e.target.checked)}
                className="rounded border-black/20"
              />
              <span>mymind 계정에도 함께 저장 (POST /objects)</span>
            </label>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#71717A]">
              <Sparkles className="h-3 w-3 text-[#E05A47]" />
              저장 즉시 자동 분류 & 검색 인덱싱
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[8px] px-3 py-1.5 text-[12.5px] text-[#71717A] hover:bg-black/[0.05] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !url.trim()}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#18181B] px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#27272A] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {submitting ? "Saving..." : "Save Site"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
