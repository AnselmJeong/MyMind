import fs from "fs";
import path from "path";
import type { ColorSwatch, NoteItem, SiteCard, SyncStatus, TagItem } from "../../shared/types";
import { RefMindDatabase, type UpsertCardInput } from "../db/database";
import { extractDomain } from "../intelligence/categorizer";
import {
  extractEmbeddingVector,
  extractTextContent,
  MymindClient,
  type MymindBlob,
  type MymindObject,
} from "./client";

const NAMED_COLORS: Record<string, string> = {
  red: "#EF4444",
  crimson: "#DC2626",
  coral: "#F97316",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  lime: "#84CC16",
  green: "#10B981",
  emerald: "#059669",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  sky: "#0EA5E9",
  blue: "#3B82F6",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  purple: "#A855F7",
  fuchsia: "#D946EF",
  pink: "#EC4899",
  rose: "#F43F5E",
  brown: "#92400E",
  beige: "#D6C7B2",
  cream: "#F5F0E6",
  white: "#F8FAFC",
  gray: "#64748B",
  grey: "#64748B",
  silver: "#94A3B8",
  charcoal: "#27272A",
  black: "#111827",
};

function normalizeHex(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(cleaned)) return cleaned.toUpperCase();
  if (/^[0-9a-f]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`;
  if (/^#[0-9a-f]{3}$/.test(cleaned)) {
    const r = cleaned[1];
    const g = cleaned[2];
    const b = cleaned[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return NAMED_COLORS[cleaned] ?? "#64748B";
}

function parsePalette(blob?: MymindBlob): { dominant: string; palette: ColorSwatch[] } {
  if (!blob?.palette) {
    return { dominant: "#E8ECF2", palette: [] };
  }

  const swatches: ColorSwatch[] = [];
  if (Array.isArray(blob.palette)) {
    for (const item of blob.palette) {
      const hex = normalizeHex(item.hex ?? item.color ?? "");
      swatches.push({ hex, weight: Number(item.weight ?? 0.2) });
    }
  } else if (typeof blob.palette === "object") {
    for (const [colorKey, weight] of Object.entries(blob.palette)) {
      swatches.push({ hex: normalizeHex(colorKey), weight: Number(weight ?? 0.2) });
    }
  }

  swatches.sort((a, b) => b.weight - a.weight);
  const top = swatches.slice(0, 5);
  return {
    dominant: top[0]?.hex ?? "#E8ECF2",
    palette: top,
  };
}

function safeCacheFileName(id: string, kind: "thumbnail" | "screenshot"): string {
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
  return `${safe}-${kind}`;
}

export class MymindSyncService {
  private db: RefMindDatabase;
  private status: SyncStatus = {
    state: "idle",
    message: "Ready",
  };
  private mediaServer: ReturnType<typeof Bun.serve> | null = null;
  private mediaBaseUrl = "";
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private onSyncUpdate?: (status: SyncStatus) => void;

  constructor(db: RefMindDatabase, onSyncUpdate?: (status: SyncStatus) => void) {
    this.db = db;
    this.onSyncUpdate = onSyncUpdate;
    const last = db.getSetting("last_synced_at");
    if (last) {
      this.status.lastSyncedAt = last;
    }
  }

  startMediaServer(): string {
    if (this.mediaServer) return this.mediaBaseUrl;

    this.mediaServer = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: async (req) => {
        const url = new URL(req.url);
        const match = url.pathname.match(/^\/media\/([^/]+)\/(thumbnail|screenshot)$/);
        if (!match) {
          return new Response("Not Found", { status: 404 });
        }

        const id = decodeURIComponent(match[1]);
        const kind = match[2] as "thumbnail" | "screenshot";
        return this.handleMediaRequest(id, kind);
      },
    });

    this.mediaBaseUrl = `http://127.0.0.1:${this.mediaServer.port}`;
    return this.mediaBaseUrl;
  }

  stop(): void {
    this.stopAutoSync();
    if (this.mediaServer) {
      this.mediaServer.stop(true);
      this.mediaServer = null;
    }
  }

  getMediaBaseUrl(): string {
    if (!this.mediaBaseUrl) return this.startMediaServer();
    return this.mediaBaseUrl;
  }

  private async handleMediaRequest(
    id: string,
    kind: "thumbnail" | "screenshot"
  ): Promise<Response> {
    const baseName = safeCacheFileName(id, kind);
    const binPath = path.join(this.db.mediaCacheDir, `${baseName}.bin`);
    const metaPath = path.join(this.db.mediaCacheDir, `${baseName}.json`);
    const missPath = path.join(this.db.mediaCacheDir, `${baseName}.miss`);

    // 1. Serve from local disk cache
    if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as {
          contentType: string;
        };
        const file = Bun.file(binPath);
        return new Response(file, {
          headers: {
            "Content-Type": meta.contentType || "image/jpeg",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch {
        // fall through to re-fetch
      }
    }

    // Short-circuit recent 404/422 misses (retry after 30 minutes)
    if (fs.existsSync(missPath)) {
      const stat = fs.statSync(missPath);
      if (Date.now() - stat.mtimeMs < 30 * 60 * 1000) {
        return new Response("No media", { status: 404 });
      }
    }

    // 2. Fetch via signed mymind API request
    const creds = this.db.getCredentials();
    if (!creds) {
      return new Response("Not authenticated", { status: 404 });
    }

    try {
      const client = new MymindClient(creds);
      const media = await client.fetchMedia(id, kind, "900x900");
      if (!media) {
        fs.writeFileSync(missPath, String(Date.now()));
        return new Response("No media", { status: 404 });
      }

      fs.writeFileSync(binPath, media.buffer);
      fs.writeFileSync(metaPath, JSON.stringify({ contentType: media.contentType }));
      if (fs.existsSync(missPath)) fs.unlinkSync(missPath);

      return new Response(new Uint8Array(media.buffer), {
        headers: {
          "Content-Type": media.contentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new Response("Media fetch failed", { status: 502 });
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.status };
  }

  private setStatus(next: SyncStatus): void {
    this.status = next;
    this.onSyncUpdate?.(this.status);
  }

  configureAutoSync(): void {
    this.stopAutoSync();
    const status = this.db.getCredentialsStatus();
    if (!status.configured || status.autoSyncIntervalMinutes <= 0) return;

    const intervalMs = status.autoSyncIntervalMinutes * 60 * 1000;
    this.autoSyncTimer = setInterval(() => {
      if (this.status.state !== "syncing") {
        void this.syncNow();
      }
    }, intervalMs);
  }

  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  async testConnection(override?: {
    keyId?: string;
    secret?: string;
  }): Promise<{ ok: boolean; message: string; objectSampleCount?: number }> {
    const creds =
      override?.keyId && override?.secret
        ? { keyId: override.keyId.trim(), secret: override.secret.trim() }
        : this.db.getCredentials();

    if (!creds || !creds.keyId || !creds.secret) {
      return {
        ok: false,
        message: "Key ID와 Secret을 먼저 입력해 주세요.",
      };
    }

    try {
      const client = new MymindClient(creds);
      const res = await client.testConnection();
      return {
        ok: true,
        message: `mymind API 연결 성공! (샘플 ${res.sampleCount}개 확인됨)`,
        objectSampleCount: res.sampleCount,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `연결 실패: ${msg}`,
      };
    }
  }

  mapMymindObject(obj: MymindObject): UpsertCardInput {
    const mediaBase = this.getMediaBaseUrl();
    const url = obj.source?.url ?? obj.url ?? "";
    const domain = obj.source?.domain || extractDomain(url);
    const content = extractTextContent(obj.content);
    const notes: NoteItem[] = (obj.notes ?? [])
      .map((n, idx) => ({
        id: n.id ?? `${obj.id}-note-${idx}`,
        content: extractTextContent(n.content),
      }))
      .filter((n) => n.content.trim().length > 0);

    const tags: TagItem[] = (obj.tags ?? [])
      .filter((t) => Boolean(t.name))
      .map((t) => ({
        id: t.id,
        name: t.name,
        flags: t.flags,
        isAuto: typeof t.flags === "number" ? (t.flags & 1) === 1 : false,
      }));

    const spaces = (obj.spaces ?? []).map((s) => s.id).filter(Boolean);
    const { dominant, palette } = parsePalette(obj.blob ?? obj.screenshot);

    let aspectRatio = 1.25;
    if (obj.blob?.width && obj.blob?.height && obj.blob.height > 0) {
      aspectRatio = Math.max(0.55, Math.min(2.1, obj.blob.width / obj.blob.height));
    } else if (obj.screenshot?.width && obj.screenshot?.height && obj.screenshot.height > 0) {
      aspectRatio = Math.max(0.55, Math.min(2.1, obj.screenshot.width / obj.screenshot.height));
    }

    const encodedId = encodeURIComponent(obj.id);
    const hasVisual = Boolean(obj.blob || obj.screenshot || url);
    const thumbnailUrl = hasVisual
      ? `${mediaBase}/media/${encodedId}/thumbnail`
      : null;
    const screenshotUrl =
      obj.screenshot || url
        ? `${mediaBase}/media/${encodedId}/screenshot`
        : null;

    const title =
      obj.title?.trim() ||
      obj.source?.title?.trim() ||
      domain ||
      content.split("\n")[0]?.slice(0, 80) ||
      "Untitled";

    const summary =
      obj.summary?.trim() ||
      obj.description?.trim() ||
      notes[0]?.content.slice(0, 180) ||
      content.slice(0, 180) ||
      "";

    return {
      id: obj.id,
      title,
      summary,
      url,
      domain,
      content,
      notes,
      tags,
      spaces,
      thumbnailUrl,
      screenshotUrl,
      aspectRatio,
      dominantColor: dominant,
      palette,
      embedding: extractEmbeddingVector(obj.embeddings),
      isDemo: false,
      created: obj.created,
      modified: obj.modified,
      bumped: obj.bumped,
    };
  }

  async syncNow(): Promise<SyncStatus> {
    if (this.status.state === "syncing") {
      return this.getSyncStatus();
    }

    const creds = this.db.getCredentials();
    if (!creds) {
      const errStatus: SyncStatus = {
        state: "error",
        message: "mymind API 키가 설정되지 않았습니다.",
        error: "NOT_CONFIGURED",
        lastSyncedAt: this.status.lastSyncedAt ?? null,
      };
      this.setStatus(errStatus);
      return errStatus;
    }

    this.setStatus({
      state: "syncing",
      message: "mymind에서 저장된 사이트와 임베딩을 동기화하는 중...",
      lastSyncedAt: this.status.lastSyncedAt ?? null,
    });

    try {
      const client = new MymindClient(creds);
      const [objects, spaces] = await Promise.all([
        client.listObjects({ includeEmbeddings: true, limit: 10000 }),
        client.listSpaces(),
      ]);

      if (spaces.length > 0) {
        this.db.upsertSpaces(spaces);
      }

      const activeObjects = objects.filter((o) => !o.deleted);
      if (activeObjects.length > 0) {
        this.db.clearDemoCards();
      }

      let added = 0;
      let updated = 0;

      for (const obj of activeObjects) {
        const existed = Boolean(this.db.getCardById(obj.id));
        const mapped = this.mapMymindObject(obj);
        this.db.upsertCard(mapped);
        if (existed) updated++;
        else added++;
      }

      const now = new Date().toISOString();
      this.db.setSetting("last_synced_at", now);

      const doneStatus: SyncStatus = {
        state: "success",
        message: `총 ${activeObjects.length}개 동기화 완료 (신규 ${added}, 업데이트 ${updated})`,
        fetched: activeObjects.length,
        added,
        updated,
        lastSyncedAt: now,
      };
      this.setStatus(doneStatus);
      return doneStatus;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const failStatus: SyncStatus = {
        state: "error",
        message: `동기화 실패: ${msg}`,
        error: msg,
        lastSyncedAt: this.status.lastSyncedAt ?? null,
      };
      this.setStatus(failStatus);
      return failStatus;
    }
  }

  async createSite(input: {
    url: string;
    title?: string;
    summary?: string;
    tags?: string[];
    note?: string;
    pushToMymind?: boolean;
  }): Promise<{ card: SiteCard; pushedToMymind: boolean; warning?: string }> {
    const cleanUrl = /^https?:\/\//i.test(input.url.trim())
      ? input.url.trim()
      : `https://${input.url.trim()}`;
    const creds = this.db.getCredentials();

    if (creds && input.pushToMymind !== false) {
      try {
        const client = new MymindClient(creds);
        const created = await client.createUrlObject({
          url: cleanUrl,
          title: input.title,
          tags: input.tags,
          note: input.note,
        });
        const mapped = this.mapMymindObject(created);
        if (input.summary && !mapped.summary) mapped.summary = input.summary;
        const card = this.db.upsertCard(mapped);
        return { card, pushedToMymind: true };
      } catch (err) {
        const warning =
          err instanceof Error
            ? `mymind 업로드 실패 (로컬에만 저장됨): ${err.message}`
            : "mymind 업로드 실패 (로컬에만 저장됨)";
        const localCard = this.createLocalCard(cleanUrl, input);
        return { card: localCard, pushedToMymind: false, warning };
      }
    }

    const localCard = this.createLocalCard(cleanUrl, input);
    return { card: localCard, pushedToMymind: false };
  }

  private createLocalCard(
    cleanUrl: string,
    input: {
      title?: string;
      summary?: string;
      tags?: string[];
      note?: string;
    }
  ): SiteCard {
    const domain = extractDomain(cleanUrl);
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    return this.db.upsertCard({
      id,
      title: input.title?.trim() || domain || cleanUrl,
      summary: input.summary?.trim() || "",
      url: cleanUrl,
      domain,
      tags: (input.tags ?? []).filter(Boolean).map((name) => ({ name })),
      notes: input.note?.trim()
        ? [{ id: `${id}-n1`, content: input.note.trim() }]
        : [],
      isDemo: false,
      created: now,
      modified: now,
      bumped: now,
    });
  }

  async deleteCard(id: string, deleteRemote = false): Promise<boolean> {
    if (deleteRemote) {
      const creds = this.db.getCredentials();
      if (creds && !id.startsWith("demo-") && !id.startsWith("local-")) {
        try {
          const client = new MymindClient(creds);
          await client.deleteObject(id);
        } catch {
          // still remove locally
        }
      }
    }
    return this.db.deleteCard(id);
  }
}
