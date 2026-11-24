import { Database } from "bun:sqlite";
import fs from "fs";
import os from "os";
import path from "path";
import type {
  CardType,
  CategorySummary,
  ColorSwatch,
  CredentialsStatus,
  LibraryStats,
  NoteItem,
  SearchQuery,
  SimilarCardResult,
  SiteCard,
  SmartFolder,
  SpaceItem,
  TagItem,
} from "../../shared/types";
import { maskKeyId, type MymindCredentials } from "../mymind/auth";
import {
  CATEGORY_TAXONOMY,
  classifySite,
  extractDomain,
  getCategoryMeta,
  inferCardType,
  UNCATEGORIZED_DEF,
} from "../intelligence/categorizer";
import { computeSimilarCards, type SimilarityCandidate } from "../intelligence/similarity";
import { DEMO_CARDS, DEMO_SPACES } from "../demo/seedData";

export interface UpsertCardInput {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  domain?: string;
  type?: CardType;
  content?: string;
  notes?: NoteItem[];
  tags?: TagItem[];
  spaces?: string[];
  thumbnailUrl?: string | null;
  screenshotUrl?: string | null;
  aspectRatio?: number;
  dominantColor?: string;
  palette?: ColorSwatch[];
  embedding?: number[] | null;
  pinned?: boolean;
  isDemo?: boolean;
  created?: string;
  modified?: string;
  bumped?: string;
  categoryOverride?: string | null;
}

interface CardRow {
  id: string;
  title: string;
  summary: string;
  url: string;
  domain: string;
  type: string;
  content: string;
  notes_json: string;
  tags_json: string;
  spaces_json: string;
  auto_category: string;
  category_confidence: number;
  category_override: string | null;
  auto_keywords_json: string;
  thumbnail_url: string | null;
  screenshot_url: string | null;
  aspect_ratio: number;
  dominant_color: string;
  palette_json: string;
  embedding_blob: Uint8Array | null;
  has_embedding: number;
  pinned: number;
  is_demo: number;
  created: string;
  modified: string;
  bumped: string;
}

function defaultDataDir(): string {
  if (process.env.REFMIND_DATA_DIR) {
    return process.env.REFMIND_DATA_DIR;
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "RefMind");
  }
  return path.join(os.homedir(), ".refmind");
}

function encodeFloat32(vec: number[] | null | undefined): Uint8Array | null {
  if (!vec || vec.length === 0) return null;
  const f32 = new Float32Array(vec);
  return new Uint8Array(f32.buffer, f32.byteOffset, f32.byteLength);
}

function decodeFloat32(blob: Uint8Array | null | undefined): number[] | null {
  if (!blob || blob.byteLength === 0 || blob.byteLength % 4 !== 0) return null;
  const copy = new Uint8Array(blob);
  const f32 = new Float32Array(copy.buffer);
  return Array.from(f32);
}

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function rowToCard(row: CardRow): SiteCard {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    url: row.url,
    domain: row.domain,
    type: (row.type as CardType) || "website",
    content: row.content,
    notes: parseJsonSafe<NoteItem[]>(row.notes_json, []),
    tags: parseJsonSafe<TagItem[]>(row.tags_json, []),
    spaces: parseJsonSafe<string[]>(row.spaces_json, []),
    autoCategory: row.auto_category,
    categoryConfidence: row.category_confidence,
    categoryOverride: row.category_override,
    autoKeywords: parseJsonSafe<string[]>(row.auto_keywords_json, []),
    thumbnailUrl: row.thumbnail_url,
    screenshotUrl: row.screenshot_url,
    aspectRatio: row.aspect_ratio || 1.25,
    dominantColor: row.dominant_color || "#E8ECF2",
    palette: parseJsonSafe<ColorSwatch[]>(row.palette_json, []),
    pinned: Boolean(row.pinned),
    isDemo: Boolean(row.is_demo),
    hasEmbedding: Boolean(row.has_embedding),
    created: row.created,
    modified: row.modified,
    bumped: row.bumped,
  };
}

function hexDistance(a: string, b: string): number {
  const pa = a.replace("#", "");
  const pb = b.replace("#", "");
  if (pa.length !== 6 || pb.length !== 6) return 999;
  const dr = parseInt(pa.slice(0, 2), 16) - parseInt(pb.slice(0, 2), 16);
  const dg = parseInt(pa.slice(2, 4), 16) - parseInt(pb.slice(4, 6), 16);
  const db = parseInt(pa.slice(4, 6), 16) - parseInt(pb.slice(4, 6), 16);
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

interface ParsedSearch {
  freeTerms: string[];
  tags: string[];
  domains: string[];
  categories: string[];
  types: string[];
  flags: Set<string>;
}

export function parseSearchInput(raw: string): ParsedSearch {
  const result: ParsedSearch = {
    freeTerms: [],
    tags: [],
    domains: [],
    categories: [],
    types: [],
    flags: new Set(),
  };

  const trimmed = raw.trim();
  if (!trimmed) return result;

  // Match quoted phrases or non-whitespace tokens
  const matches = trimmed.match(/"[^"]+"|\S+/g) ?? [];
  for (const token of matches) {
    if (token.startsWith('"') && token.endsWith('"') && token.length > 2) {
      result.freeTerms.push(token.slice(1, -1).toLowerCase());
      continue;
    }

    const lower = token.toLowerCase();
    if (lower.startsWith("#") && lower.length > 1) {
      result.tags.push(lower.slice(1));
      continue;
    }

    const colonIdx = lower.indexOf(":");
    if (colonIdx > 0 && colonIdx < lower.length - 1) {
      const key = lower.slice(0, colonIdx);
      const val = lower.slice(colonIdx + 1);
      if (key === "tag" || key === "t") {
        result.tags.push(val);
        continue;
      }
      if (key === "domain" || key === "site" || key === "host") {
        result.domains.push(val);
        continue;
      }
      if (key === "cat" || key === "category") {
        result.categories.push(val);
        continue;
      }
      if (key === "type") {
        result.types.push(val);
        continue;
      }
      if (key === "is") {
        result.flags.add(val);
        continue;
      }
    }

    result.freeTerms.push(lower);
  }

  return result;
}

export class RefMindDatabase {
  readonly dataDir: string;
  readonly mediaCacheDir: string;
  private db: Database;

  constructor(customDataDir?: string) {
    this.dataDir = customDataDir ?? defaultDataDir();
    this.mediaCacheDir = path.join(this.dataDir, "media-cache");
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.mkdirSync(this.mediaCacheDir, { recursive: true });

    const dbPath = path.join(this.dataDir, "refmind.db");
    this.db = new Database(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.initSchema();
  }

  close(): void {
    this.db.close();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS smart_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'folder-search',
        color TEXT NOT NULL DEFAULT '#6366F1',
        query TEXT NOT NULL,
        is_system INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        url TEXT NOT NULL DEFAULT '',
        domain TEXT NOT NULL DEFAULT '',
        type TEXT NOT NULL DEFAULT 'website',
        content TEXT NOT NULL DEFAULT '',
        notes_json TEXT NOT NULL DEFAULT '[]',
        tags_json TEXT NOT NULL DEFAULT '[]',
        spaces_json TEXT NOT NULL DEFAULT '[]',
        auto_category TEXT NOT NULL DEFAULT 'Uncategorized',
        category_confidence REAL NOT NULL DEFAULT 0,
        category_override TEXT,
        auto_keywords_json TEXT NOT NULL DEFAULT '[]',
        thumbnail_url TEXT,
        screenshot_url TEXT,
        aspect_ratio REAL NOT NULL DEFAULT 1.25,
        dominant_color TEXT NOT NULL DEFAULT '#E8ECF2',
        palette_json TEXT NOT NULL DEFAULT '[]',
        embedding_blob BLOB,
        has_embedding INTEGER NOT NULL DEFAULT 0,
        pinned INTEGER NOT NULL DEFAULT 0,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created TEXT NOT NULL,
        modified TEXT NOT NULL,
        bumped TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(auto_category);
      CREATE INDEX IF NOT EXISTS idx_cards_domain ON cards(domain);
      CREATE INDEX IF NOT EXISTS idx_cards_modified ON cards(modified DESC);
      CREATE INDEX IF NOT EXISTS idx_cards_pinned ON cards(pinned);

      CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
        card_id UNINDEXED,
        title,
        summary,
        url,
        domain,
        tags_text,
        notes_text,
        content,
        category_text,
        keywords_text,
        tokenize = 'unicode61'
      );
    `);

    this.ensureDefaultSmartFolders();
  }

  private ensureDefaultSmartFolders(): void {
    const countRow = this.db
      .query<{ c: number }, []>("SELECT COUNT(*) as c FROM smart_folders")
      .get();
    if ((countRow?.c ?? 0) > 0) return;

    const defaults = [
      {
        id: "sf-dark-interfaces",
        name: "Dark Interfaces",
        icon: "moon",
        color: "#6366F1",
        query: "dark interface",
      },
      {
        id: "sf-serif-type",
        name: "Serif & Posters",
        icon: "type",
        color: "#D97706",
        query: "poster serif typography",
      },
      {
        id: "sf-ai-models",
        name: "AI & Agents",
        icon: "sparkles",
        color: "#8B5CF6",
        query: "cat:ai",
      },
      {
        id: "sf-macos-tools",
        name: "macOS Craft",
        icon: "laptop",
        color: "#0EA5E9",
        query: "macos",
      },
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO smart_folders (id, name, icon, color, query, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `);
    const now = new Date().toISOString();
    for (const sf of defaults) {
      stmt.run(sf.id, sf.name, sf.icon, sf.color, sf.query, now);
    }
  }

  // --- Settings & Credentials ---

  getSetting(key: string): string | null {
    const row = this.db
      .query<{ value: string }, [string]>("SELECT value FROM settings WHERE key = ?")
      .get(key);
    return row?.value ?? null;
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, value);
  }

  deleteSetting(key: string): void {
    this.db.prepare("DELETE FROM settings WHERE key = ?").run(key);
  }

  getCredentials(): MymindCredentials | null {
    const keyId = this.getSetting("mymind_key_id");
    const secret = this.getSetting("mymind_secret");
    if (!keyId || !secret) return null;
    return { keyId, secret };
  }

  saveCredentials(creds: MymindCredentials, autoSyncIntervalMinutes = 15): CredentialsStatus {
    this.setSetting("mymind_key_id", creds.keyId.trim());
    this.setSetting("mymind_secret", creds.secret.trim());
    this.setSetting(
      "auto_sync_interval_minutes",
      String(Math.max(0, Math.min(240, autoSyncIntervalMinutes)))
    );
    return this.getCredentialsStatus();
  }

  clearCredentials(keepData = false): CredentialsStatus {
    this.deleteSetting("mymind_key_id");
    this.deleteSetting("mymind_secret");
    this.deleteSetting("last_synced_at");
    if (!keepData) {
      this.db.exec("DELETE FROM cards WHERE is_demo = 0;");
      this.rebuildFtsIndex();
    }
    return this.getCredentialsStatus();
  }

  getCredentialsStatus(): CredentialsStatus {
    const creds = this.getCredentials();
    const interval = Number(this.getSetting("auto_sync_interval_minutes") ?? "15");
    const lastSyncedAt = this.getSetting("last_synced_at");
    const realCount =
      this.db
        .query<{ c: number }, []>("SELECT COUNT(*) as c FROM cards WHERE is_demo = 0")
        .get()?.c ?? 0;

    return {
      configured: Boolean(creds),
      keyIdMasked: maskKeyId(creds?.keyId),
      autoSyncIntervalMinutes: Number.isFinite(interval) ? interval : 15,
      lastSyncedAt,
      demoMode: !creds && realCount === 0,
    };
  }

  // --- Spaces ---

  upsertSpaces(spaces: SpaceItem[]): void {
    const stmt = this.db.prepare(
      "INSERT OR REPLACE INTO spaces (id, name, color) VALUES (?, ?, ?)"
    );
    const tx = this.db.transaction((items: SpaceItem[]) => {
      for (const s of items) {
        stmt.run(s.id, s.name, s.color ?? null);
      }
    });
    tx(spaces);
  }

  // --- Cards CRUD & Indexing ---

  upsertCard(input: UpsertCardInput): SiteCard {
    const existing = this.db
      .query<CardRow, [string]>("SELECT * FROM cards WHERE id = ?")
      .get(input.id);

    const url = input.url ?? existing?.url ?? "";
    const domain = input.domain || extractDomain(url) || existing?.domain || "";
    const title = (input.title || existing?.title || domain || "Untitled Site").trim();
    const summary = input.summary ?? existing?.summary ?? "";
    const content = input.content ?? existing?.content ?? "";
    const notes: NoteItem[] = input.notes ?? parseJsonSafe<NoteItem[]>(existing?.notes_json, []);
    const tags: TagItem[] = input.tags ?? parseJsonSafe<TagItem[]>(existing?.tags_json, []);
    const spaces: string[] = input.spaces ?? parseJsonSafe<string[]>(existing?.spaces_json, []);

    const tagNames = tags.map((t) => t.name);
    const notesText = notes.map((n) => n.content).join(" ");

    const classification = classifySite({
      title,
      summary,
      url,
      domain,
      tags: tagNames,
      notes: notesText,
      content,
    });

    const cardType =
      input.type ??
      inferCardType({
        url,
        domain,
        title,
        summary,
        tags: tagNames,
        hasBlobImage: Boolean(input.thumbnailUrl || input.screenshotUrl),
      });

    const now = new Date().toISOString();
    const created = input.created ?? existing?.created ?? now;
    const modified = input.modified ?? now;
    const bumped = input.bumped ?? existing?.bumped ?? modified;

    const categoryOverride =
      input.categoryOverride !== undefined
        ? input.categoryOverride
        : existing?.category_override ?? null;

    const pinned = input.pinned !== undefined ? (input.pinned ? 1 : 0) : existing?.pinned ?? 0;
    const isDemo = input.isDemo !== undefined ? (input.isDemo ? 1 : 0) : existing?.is_demo ?? 0;

    const embeddingBlob =
      input.embedding !== undefined
        ? encodeFloat32(input.embedding)
        : existing?.embedding_blob ?? null;
    const hasEmbedding = embeddingBlob && embeddingBlob.byteLength > 0 ? 1 : 0;

    const thumbnailUrl =
      input.thumbnailUrl !== undefined ? input.thumbnailUrl : existing?.thumbnail_url ?? null;
    const screenshotUrl =
      input.screenshotUrl !== undefined ? input.screenshotUrl : existing?.screenshot_url ?? null;

    const aspectRatio = input.aspectRatio ?? existing?.aspect_ratio ?? 1.25;
    const dominantColor = input.dominantColor ?? existing?.dominant_color ?? "#E8ECF2";
    const palette = input.palette ?? parseJsonSafe<ColorSwatch[]>(existing?.palette_json, []);

    this.db
      .prepare(
        `
      INSERT OR REPLACE INTO cards (
        id, title, summary, url, domain, type, content,
        notes_json, tags_json, spaces_json,
        auto_category, category_confidence, category_override, auto_keywords_json,
        thumbnail_url, screenshot_url, aspect_ratio, dominant_color, palette_json,
        embedding_blob, has_embedding, pinned, is_demo, created, modified, bumped
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `
      )
      .run(
        input.id,
        title,
        summary,
        url,
        domain,
        cardType,
        content,
        JSON.stringify(notes),
        JSON.stringify(tags),
        JSON.stringify(spaces),
        classification.category,
        classification.confidence,
        categoryOverride,
        JSON.stringify(classification.keywords),
        thumbnailUrl,
        screenshotUrl,
        aspectRatio,
        dominantColor,
        JSON.stringify(palette),
        embeddingBlob,
        hasEmbedding,
        pinned,
        isDemo,
        created,
        modified,
        bumped
      );

    this.syncFtsForCard(input.id, {
      title,
      summary,
      url,
      domain,
      tagsText: tagNames.join(" "),
      notesText,
      content,
      categoryText: categoryOverride || classification.category,
      keywordsText: classification.keywords.join(" "),
    });

    return this.getCardById(input.id)!;
  }

  private syncFtsForCard(
    cardId: string,
    fields: {
      title: string;
      summary: string;
      url: string;
      domain: string;
      tagsText: string;
      notesText: string;
      content: string;
      categoryText: string;
      keywordsText: string;
    }
  ): void {
    this.db.prepare("DELETE FROM cards_fts WHERE card_id = ?").run(cardId);
    this.db
      .prepare(
        `
      INSERT INTO cards_fts (
        card_id, title, summary, url, domain,
        tags_text, notes_text, content, category_text, keywords_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        cardId,
        fields.title,
        fields.summary,
        fields.url,
        fields.domain,
        fields.tagsText,
        fields.notesText,
        fields.content.slice(0, 4000),
        fields.categoryText,
        fields.keywordsText
      );
  }

  rebuildFtsIndex(): void {
    this.db.exec("DELETE FROM cards_fts;");
    const rows = this.db.query<CardRow, []>("SELECT * FROM cards").all();
    const tx = this.db.transaction((allRows: CardRow[]) => {
      for (const row of allRows) {
        const card = rowToCard(row);
        this.syncFtsForCard(card.id, {
          title: card.title,
          summary: card.summary,
          url: card.url,
          domain: card.domain,
          tagsText: card.tags.map((t) => t.name).join(" "),
          notesText: card.notes.map((n) => n.content).join(" "),
          content: card.content,
          categoryText: card.categoryOverride || card.autoCategory,
          keywordsText: card.autoKeywords.join(" "),
        });
      }
    });
    tx(rows);
  }

  clearDemoCards(): void {
    this.db.exec("DELETE FROM cards WHERE is_demo = 1;");
    this.rebuildFtsIndex();
  }

  seedDemoIfEmpty(): number {
    const countRow = this.db
      .query<{ c: number }, []>("SELECT COUNT(*) as c FROM cards")
      .get();
    if ((countRow?.c ?? 0) > 0) return 0;
    return this.loadDemoData();
  }

  loadDemoData(): number {
    this.upsertSpaces(DEMO_SPACES);
    const nowMs = Date.now();
    for (const seed of DEMO_CARDS) {
      const ts = new Date(nowMs - seed.daysAgo * 86400 * 1000).toISOString();
      this.upsertCard({
        id: seed.id,
        title: seed.title,
        summary: seed.summary,
        url: seed.url,
        type: seed.type,
        tags: seed.tags.map((name) => ({ name })),
        spaces: seed.spaces,
        notes: (seed.notes ?? []).map((content, idx) => ({
          id: `${seed.id}-n-${idx}`,
          content,
        })),
        content: seed.content ?? "",
        thumbnailUrl: seed.visualSvg ?? null,
        screenshotUrl: seed.visualSvg ?? null,
        aspectRatio: seed.aspectRatio,
        dominantColor: seed.dominantColor,
        palette: seed.palette,
        pinned: Boolean(seed.pinned),
        isDemo: true,
        created: ts,
        modified: ts,
        bumped: ts,
      });
    }
    return DEMO_CARDS.length;
  }

  getCardById(id: string): SiteCard | null {
    const row = this.db
      .query<CardRow, [string]>("SELECT * FROM cards WHERE id = ?")
      .get(id);
    return row ? rowToCard(row) : null;
  }

  togglePin(id: string): SiteCard | null {
    const existing = this.getCardById(id);
    if (!existing) return null;
    this.db
      .prepare("UPDATE cards SET pinned = ? WHERE id = ?")
      .run(existing.pinned ? 0 : 1, id);
    return this.getCardById(id);
  }

  setCardCategory(id: string, category: string | null): SiteCard | null {
    const existing = this.getCardById(id);
    if (!existing) return null;
    this.db
      .prepare("UPDATE cards SET category_override = ?, modified = ? WHERE id = ?")
      .run(category, new Date().toISOString(), id);
    const updated = this.getCardById(id)!;
    this.syncFtsForCard(updated.id, {
      title: updated.title,
      summary: updated.summary,
      url: updated.url,
      domain: updated.domain,
      tagsText: updated.tags.map((t) => t.name).join(" "),
      notesText: updated.notes.map((n) => n.content).join(" "),
      content: updated.content,
      categoryText: updated.categoryOverride || updated.autoCategory,
      keywordsText: updated.autoKeywords.join(" "),
    });
    return updated;
  }

  updateCardTags(id: string, tags: string[]): SiteCard | null {
    const existing = this.getCardById(id);
    if (!existing) return null;
    const cleaned = Array.from(
      new Set(tags.map((t) => t.trim().replace(/^#/, "")).filter(Boolean))
    );
    return this.upsertCard({
      id: existing.id,
      title: existing.title,
      tags: cleaned.map((name) => ({ name })),
      modified: new Date().toISOString(),
    });
  }

  deleteCard(id: string): boolean {
    const res = this.db.prepare("DELETE FROM cards WHERE id = ?").run(id);
    this.db.prepare("DELETE FROM cards_fts WHERE card_id = ?").run(id);
    return res.changes > 0;
  }

  recategorizeAll(): number {
    const rows = this.db.query<CardRow, []>("SELECT * FROM cards").all();
    let updated = 0;
    const tx = this.db.transaction((allRows: CardRow[]) => {
      for (const row of allRows) {
        const card = rowToCard(row);
        const res = classifySite({
          title: card.title,
          summary: card.summary,
          url: card.url,
          domain: card.domain,
          tags: card.tags.map((t) => t.name),
          notes: card.notes.map((n) => n.content).join(" "),
          content: card.content,
        });
        this.db
          .prepare(
            "UPDATE cards SET auto_category = ?, category_confidence = ?, auto_keywords_json = ? WHERE id = ?"
          )
          .run(res.category, res.confidence, JSON.stringify(res.keywords), card.id);
        this.syncFtsForCard(card.id, {
          title: card.title,
          summary: card.summary,
          url: card.url,
          domain: card.domain,
          tagsText: card.tags.map((t) => t.name).join(" "),
          notesText: card.notes.map((n) => n.content).join(" "),
          content: card.content,
          categoryText: card.categoryOverride || res.category,
          keywordsText: res.keywords.join(" "),
        });
        updated++;
      }
    });
    tx(rows);
    return updated;
  }

  // --- Search & Query ---

  queryCards(query: SearchQuery): { cards: SiteCard[]; total: number } {
    const allRows = this.db.query<CardRow, []>("SELECT * FROM cards").all();
    let cards = allRows.map(rowToCard);

    // Precompute duplicate URL set if needed
    let duplicateIds: Set<string> | null = null;
    if (query.view === "duplicates") {
      const byUrl = new Map<string, string[]>();
      for (const c of cards) {
        const key = (c.url || c.title).trim().toLowerCase().replace(/\/+$/, "");
        if (!key) continue;
        const arr = byUrl.get(key) ?? [];
        arr.push(c.id);
        byUrl.set(key, arr);
      }
      duplicateIds = new Set<string>();
      for (const ids of byUrl.values()) {
        if (ids.length > 1) ids.forEach((id) => duplicateIds!.add(id));
      }
    }

    // FTS5 rank map for free-text queries
    const parsed = parseSearchInput(query.q ?? "");
    const ftsScores = new Map<string, number>();

    if (parsed.freeTerms.length > 0) {
      const ftsQueryParts = parsed.freeTerms
        .map((t) => t.replace(/["'*:^()]/g, "").trim())
        .filter((t) => t.length > 0)
        .map((t) => `"${t}"*`);

      if (ftsQueryParts.length > 0) {
        try {
          const ftsRows = this.db
            .query<{ card_id: string; rank: number }, [string]>(
              `SELECT card_id, bm25(cards_fts, 4.0, 2.0, 1.5, 2.0, 3.0, 1.8, 1.0, 2.5, 2.2) as rank
               FROM cards_fts WHERE cards_fts MATCH ?`
            )
            .all(ftsQueryParts.join(" OR "));
          for (const r of ftsRows) {
            ftsScores.set(r.card_id, Math.abs(r.rank));
          }
        } catch {
          // fallback to substring scoring below
        }
      }
    }

    const recentCutoffMs = Date.now() - 7 * 86400 * 1000;

    cards = cards.filter((card) => {
      const effectiveCategory = card.categoryOverride || card.autoCategory;

      // View filter
      if (query.view === "pinned" && !card.pinned) return false;
      if (query.view === "uncategorized" && effectiveCategory !== UNCATEGORIZED_DEF.name) {
        return false;
      }
      if (query.view === "untagged" && card.tags.length > 0) return false;
      if (query.view === "recent" && new Date(card.created).getTime() < recentCutoffMs) {
        return false;
      }
      if (query.view === "duplicates" && (!duplicateIds || !duplicateIds.has(card.id))) {
        return false;
      }

      // Structured sidebar/toolbar filters
      if (query.category && effectiveCategory.toLowerCase() !== query.category.toLowerCase()) {
        return false;
      }
      if (query.spaceId && !card.spaces.includes(query.spaceId)) return false;
      if (
        query.tag &&
        !card.tags.some((t) => t.name.toLowerCase() === query.tag!.toLowerCase())
      ) {
        return false;
      }
      if (query.domain && !card.domain.toLowerCase().includes(query.domain.toLowerCase())) {
        return false;
      }
      if (query.type && card.type !== query.type) return false;
      if (query.colorHex) {
        const candidates = [card.dominantColor, ...card.palette.map((p) => p.hex)];
        const close = candidates.some((hex) => hexDistance(hex, query.colorHex!) < 95);
        if (!close) return false;
      }

      // Parsed query operators
      for (const tagOp of parsed.tags) {
        if (!card.tags.some((t) => t.name.toLowerCase().includes(tagOp))) return false;
      }
      for (const domOp of parsed.domains) {
        if (!card.domain.toLowerCase().includes(domOp)) return false;
      }
      for (const catOp of parsed.categories) {
        if (!effectiveCategory.toLowerCase().includes(catOp)) return false;
      }
      for (const typeOp of parsed.types) {
        if (card.type.toLowerCase() !== typeOp) return false;
      }
      if (parsed.flags.has("pinned") && !card.pinned) return false;
      if (parsed.flags.has("untagged") && card.tags.length > 0) return false;
      if (parsed.flags.has("uncategorized") && effectiveCategory !== UNCATEGORIZED_DEF.name) {
        return false;
      }

      // Free text matching (FTS5 + substring fallback for Korean & partial terms)
      if (parsed.freeTerms.length > 0) {
        const haystack = [
          card.title,
          card.summary,
          card.url,
          card.domain,
          effectiveCategory,
          card.tags.map((t) => t.name).join(" "),
          card.autoKeywords.join(" "),
          card.notes.map((n) => n.content).join(" "),
          card.content.slice(0, 2000),
        ]
          .join(" ")
          .toLowerCase();

        let matchedTerms = 0;
        let score = ftsScores.get(card.id) ?? 0;

        for (const term of parsed.freeTerms) {
          if (haystack.includes(term)) {
            matchedTerms++;
            if (card.title.toLowerCase().includes(term)) score += 6;
            if (card.tags.some((t) => t.name.toLowerCase().includes(term))) score += 4.5;
            if (card.autoKeywords.some((k) => k.toLowerCase().includes(term))) score += 3;
            if (card.domain.toLowerCase().includes(term)) score += 3;
            if (card.summary.toLowerCase().includes(term)) score += 2;
          }
        }

        if (matchedTerms === 0 && !ftsScores.has(card.id)) return false;
        // Require at least half of terms to match when multiple terms are entered
        if (parsed.freeTerms.length > 1 && matchedTerms < Math.ceil(parsed.freeTerms.length * 0.5) && !ftsScores.has(card.id)) {
          return false;
        }
        card.matchScore = score;
      }

      return true;
    });

    // Sorting
    const sortMode = query.view === "random" ? "random" : query.sort ?? "recent";
    if (parsed.freeTerms.length > 0 && (!query.sort || query.sort === "recent")) {
      cards.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    } else if (sortMode === "random") {
      // Deterministic-per-call Fisher-Yates shuffle
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
    } else if (sortMode === "title") {
      cards.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === "domain") {
      cards.sort((a, b) => a.domain.localeCompare(b.domain));
    } else if (sortMode === "created") {
      cards.sort((a, b) => b.created.localeCompare(a.created));
    } else {
      cards.sort((a, b) => b.bumped.localeCompare(a.bumped));
    }

    const total = cards.length;
    if (query.limit && query.limit > 0) {
      cards = cards.slice(0, query.limit);
    }

    return { cards, total };
  }

  // --- Similar Sites Recommendations ---

  getSimilarCards(cardId: string, limit = 8): SimilarCardResult[] {
    const rows = this.db.query<CardRow, []>("SELECT * FROM cards").all();
    const candidates: SimilarityCandidate[] = rows.map((row) => ({
      card: rowToCard(row),
      embedding: decodeFloat32(row.embedding_blob),
    }));

    const target = candidates.find((c) => c.card.id === cardId);
    if (!target) return [];

    return computeSimilarCards(target, candidates, limit);
  }

  // --- Smart Folders ---

  createSmartFolder(input: {
    name: string;
    query: string;
    color?: string;
    icon?: string;
  }): SmartFolder {
    const id = `sf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const color = input.color ?? "#6366F1";
    const icon = input.icon ?? "folder-search";
    const now = new Date().toISOString();
    this.db
      .prepare(
        "INSERT INTO smart_folders (id, name, icon, color, query, is_system, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
      )
      .run(id, input.name.trim(), icon, color, input.query.trim(), now);

    const count = this.queryCards({ q: input.query }).total;
    return {
      id,
      name: input.name.trim(),
      icon,
      color,
      query: input.query.trim(),
      count,
      isSystem: false,
    };
  }

  deleteSmartFolder(id: string): boolean {
    const res = this.db.prepare("DELETE FROM smart_folders WHERE id = ?").run(id);
    return res.changes > 0;
  }

  // --- Library Stats for Sidebar ---

  getLibraryStats(): LibraryStats {
    const rows = this.db.query<CardRow, []>("SELECT * FROM cards").all();
    const cards = rows.map(rowToCard);
    const credStatus = this.getCredentialsStatus();

    const recentCutoffMs = Date.now() - 7 * 86400 * 1000;
    const catCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const domainCounts = new Map<string, number>();
    const spaceCounts = new Map<string, number>();
    const urlCounts = new Map<string, number>();

    let pinned = 0;
    let uncategorized = 0;
    let untagged = 0;
    let recent = 0;

    for (const c of cards) {
      if (c.pinned) pinned++;
      const effCat = c.categoryOverride || c.autoCategory;
      catCounts.set(effCat, (catCounts.get(effCat) ?? 0) + 1);
      if (effCat === UNCATEGORIZED_DEF.name) uncategorized++;
      if (c.tags.length === 0) untagged++;
      if (new Date(c.created).getTime() >= recentCutoffMs) recent++;

      for (const t of c.tags) {
        const key = t.name.toLowerCase();
        tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
      }
      if (c.domain) {
        domainCounts.set(c.domain, (domainCounts.get(c.domain) ?? 0) + 1);
      }
      for (const sid of c.spaces) {
        spaceCounts.set(sid, (spaceCounts.get(sid) ?? 0) + 1);
      }
      const normUrl = (c.url || c.title).trim().toLowerCase().replace(/\/+$/, "");
      if (normUrl) {
        urlCounts.set(normUrl, (urlCounts.get(normUrl) ?? 0) + 1);
      }
    }

    let duplicates = 0;
    for (const count of urlCounts.values()) {
      if (count > 1) duplicates += count;
    }

    const categories: CategorySummary[] = CATEGORY_TAXONOMY.map((def) => ({
      name: def.name,
      slug: def.slug,
      color: def.color,
      icon: def.icon,
      description: def.description,
      count: catCounts.get(def.name) ?? 0,
    }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    // Include any custom override categories outside built-in taxonomy
    for (const [name, count] of catCounts.entries()) {
      if (
        name !== UNCATEGORIZED_DEF.name &&
        !CATEGORY_TAXONOMY.some((d) => d.name === name)
      ) {
        const meta = getCategoryMeta(name);
        categories.push({
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          color: meta.color,
          icon: "folder",
          description: "Custom category",
          count,
        });
      }
    }

    const sfRows = this.db
      .query<
        { id: string; name: string; icon: string; color: string; query: string; is_system: number },
        []
      >("SELECT id, name, icon, color, query, is_system FROM smart_folders ORDER BY is_system DESC, created_at ASC")
      .all();

    const smartFolders: SmartFolder[] = sfRows.map((sf) => ({
      id: sf.id,
      name: sf.name,
      icon: sf.icon,
      color: sf.color,
      query: sf.query,
      isSystem: Boolean(sf.is_system),
      count: this.queryCards({ q: sf.query }).total,
    }));

    const spaceRows = this.db
      .query<{ id: string; name: string; color: string | null }, []>(
        "SELECT id, name, color FROM spaces ORDER BY name ASC"
      )
      .all();

    const spaces: SpaceItem[] = spaceRows.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color ?? undefined,
      count: spaceCounts.get(s.id) ?? 0,
    }));

    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([name, count]) => ({ name, count }));

    const topDomains = [...domainCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([domain, count]) => ({ domain, count }));

    return {
      total: cards.length,
      pinned,
      uncategorized,
      untagged,
      recent,
      duplicates,
      demoMode: credStatus.demoMode,
      connected: credStatus.configured,
      lastSyncedAt: credStatus.lastSyncedAt,
      autoSyncIntervalMinutes: credStatus.autoSyncIntervalMinutes,
      keyIdMasked: credStatus.keyIdMasked,
      categories,
      smartFolders,
      spaces,
      topTags,
      topDomains,
    };
  }
}
