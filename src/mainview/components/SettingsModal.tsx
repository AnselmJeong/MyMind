import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import type { CredentialsStatus, SyncStatus } from "../../shared/types";

interface SettingsModalProps {
  open: boolean;
  credentialsStatus: CredentialsStatus | null;
  syncStatus: SyncStatus;
  onClose: () => void;
  onTestConnection: (keyId?: string, secret?: string) => Promise<{ ok: boolean; message: string }>;
  onSaveAndSync: (input: {
    keyId: string;
    secret: string;
    autoSyncIntervalMinutes: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  onClearCredentials: (keepData: boolean) => Promise<void>;
  onRecategorizeAll: () => Promise<number>;
  onLoadDemoData: () => Promise<void>;
  onOpenExternal: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  credentialsStatus,
  syncStatus,
  onClose,
  onTestConnection,
  onSaveAndSync,
  onClearCredentials,
  onRecategorizeAll,
  onLoadDemoData,
  onOpenExternal,
}) => {
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [intervalMin, setIntervalMin] = useState(15);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (open && credentialsStatus) {
      setIntervalMin(credentialsStatus.autoSyncIntervalMinutes ?? 15);
      setFeedback(null);
    }
  }, [open, credentialsStatus]);

  if (!open) return null;

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await onTestConnection(
        keyId.trim() || undefined,
        secret.trim() || undefined
      );
      setFeedback({ kind: res.ok ? "ok" : "err", text: res.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyId.trim() || !secret.trim()) {
      setFeedback({
        kind: "err",
        text: "Key ID (kid)와 Secret을 모두 입력해 주세요.",
      });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await onSaveAndSync({
        keyId: keyId.trim(),
        secret: secret.trim(),
        autoSyncIntervalMinutes: intervalMin,
      });
      if (res.ok) {
        setFeedback({
          kind: "ok",
          text: "API 키가 저장되었고 mymind 동기화가 완료되었습니다!",
        });
        setKeyId("");
        setSecret("");
      } else {
        setFeedback({
          kind: "err",
          text: res.error || "저장 중 오류가 발생했습니다.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRecategorize = async () => {
    const count = await onRecategorizeAll();
    setFeedback({
      kind: "info",
      text: `${count}개 사이트의 자동 카테고리와 키워드를 재분석했습니다.`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#18181B] text-white">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[14.5px] font-semibold text-[#18181B]">
                mymind API Connection & Settings
              </h2>
              <p className="text-[11.5px] text-[#71717A]">
                HS256 JWT 서명 인증 · 로컬 SQLite 캐시
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#71717A] hover:bg-black/[0.06] hover:text-[#18181B] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[76vh] overflow-y-auto px-5 py-4 space-y-5 thin-scroll">
          {/* Current Status Banner */}
          <div
            className={`flex items-center justify-between rounded-[11px] border px-3.5 py-2.5 ${
              credentialsStatus?.configured
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                : "border-amber-200 bg-amber-50/70 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2 text-[12.5px]">
              <span
                className={`h-2 w-2 rounded-full ${
                  credentialsStatus?.configured ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {credentialsStatus?.configured ? (
                <span>
                  연결됨 · Key ID:{" "}
                  <code className="rounded bg-white/70 px-1.5 py-0.5 text-[11px]">
                    {credentialsStatus.keyIdMasked}
                  </code>
                </span>
              ) : (
                <span>아직 API Secret이 입력되지 않았습니다 (현재 Demo 모드)</span>
              )}
            </div>
            {credentialsStatus?.configured && (
              <button
                type="button"
                onClick={() => onClearCredentials(false)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100/70 transition cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Disconnect
              </button>
            )}
          </div>

          {/* Step-by-step instructions */}
          <div className="rounded-[11px] border border-black/[0.07] bg-[#FAFAFB] p-3.5 text-[12px] leading-relaxed text-[#52525B]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#18181B]">
                mymind Access Key 발급 방법
              </span>
              <button
                type="button"
                onClick={() => onOpenExternal("https://access.mymind.com/extensions")}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#E05A47] hover:underline cursor-pointer"
              >
                <span>access.mymind.com/extensions</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <ol className="mt-2 list-decimal pl-4 space-y-1">
              <li>mymind Extensions 페이지에서 새 API Access Key를 생성합니다.</li>
              <li>
                발급된 <strong className="text-[#18181B]">Key ID (kid)</strong>와{" "}
                <strong className="text-[#18181B]">Base64 Secret</strong>을 아래에 입력합니다.
              </li>
              <li>
                RefMind는 매 요청마다 공식 스펙대로 짧은 수명의 HS256 JWT를 생성해{" "}
                <code>api.mymind.com</code>에 안전하게 접속합니다.
              </li>
            </ol>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
                Access Key ID (<code>kid</code>)
              </label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder={
                  credentialsStatus?.keyIdMasked
                    ? `현재: ${credentialsStatus.keyIdMasked} (변경 시 새로 입력)`
                    : "예: mk_live_..."
                }
                className="w-full rounded-[9px] border border-black/[0.11] bg-white px-3 py-2 text-[13px] text-[#18181B] outline-none focus:border-[#18181B]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
                Base64 Secret (256-bit)
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Base64로 인코딩된 mymind API secret 붙여넣기"
                  className="w-full rounded-[9px] border border-black/[0.11] bg-white px-3 py-2 pr-9 text-[13px] font-mono text-[#18181B] outline-none focus:border-[#18181B]"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#18181B] cursor-pointer"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#3F3F46]">
                향후 저장될 사이트 자동 동기화 주기
              </label>
              <select
                value={intervalMin}
                onChange={(e) => setIntervalMin(Number(e.target.value))}
                className="w-full rounded-[9px] border border-black/[0.11] bg-white px-3 py-2 text-[13px] text-[#18181B] outline-none focus:border-[#18181B]"
              >
                <option value={0}>수동 동기화만 사용</option>
                <option value={5}>매 5분마다 자동 동기화</option>
                <option value={15}>매 15분마다 자동 동기화 (권장)</option>
                <option value={30}>매 30분마다 자동 동기화</option>
                <option value={60}>매 1시간마다 자동 동기화</option>
              </select>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div
                className={`flex items-start gap-2 rounded-[9px] px-3 py-2 text-[12px] ${
                  feedback.kind === "ok"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : feedback.kind === "err"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                }`}
              >
                {feedback.kind === "ok" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                ) : feedback.kind === "err" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || saving}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-black/[0.12] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#18181B] hover:bg-[#F4F4F5] disabled:opacity-50 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
                Test Connection
              </button>

              <button
                type="submit"
                disabled={saving || syncStatus.state === "syncing"}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#18181B] px-4 py-2 text-[12.5px] font-medium text-white shadow-xs hover:bg-[#27272A] disabled:opacity-50 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {saving ? "Saving & Syncing..." : "Save & Sync Now"}
              </button>
            </div>
          </form>

          {/* Local Maintenance Tools */}
          <div className="border-t border-black/[0.06] pt-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#71717A]">
              Local Intelligence Tools
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRecategorize}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-black/[0.09] bg-[#FAFAFB] px-3 py-1.5 text-[12px] font-medium text-[#3F3F46] hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#E05A47]" />
                Re-run Auto-Categorizer
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onLoadDemoData();
                  setFeedback({
                    kind: "info",
                    text: "시각적 데모 사이트 24개를 불러왔습니다.",
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-black/[0.09] bg-[#FAFAFB] px-3 py-1.5 text-[12px] font-medium text-[#3F3F46] hover:bg-[#F4F4F5] transition cursor-pointer"
              >
                Load Visual Demo Cards
              </button>
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="flex items-start gap-2 rounded-[10px] bg-[#F5F5F7] px-3 py-2.5 text-[11px] text-[#71717A]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#52525B]" />
            <span>
              API Secret은 사용자의 Mac 로컬(<code>~/Library/Application Support/RefMind</code>)에만
              저장되며, 외부 서버로 전송되지 않습니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
