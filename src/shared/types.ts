export type CardType =
  | "website"
  | "article"
  | "repo"
  | "model"
  | "design"
  | "tool"
  | "video"
  | "image"
  | "note";

export interface TagItem {
  id?: string;
  name: string;
  flags?: number;
  isAuto?: boolean;
}

export interface SpaceItem {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

export interface NoteItem {
  id: string;
  content: string;
}

export interface ColorSwatch {
  hex: string;
  weight: number;
}

export interface SiteCard {
  id: string;
  title: string;
  summary: string;
  url: string;
  domain: string;
  type: CardType;
  content: string;
  notes: NoteItem[];
  tags: TagItem[];
  spaces: string[];
  autoCategory: string;
  categoryConfidence: number;
  categoryOverride?: string | null;
  autoKeywords: string[];
  thumbnailUrl: string | null;
  screenshotUrl: string | null;
  aspectRatio: number; // width / height (e.g. 0.75 portrait, 1.33 landscape, 1.0 square)
  dominantColor: string;
  palette: ColorSwatch[];
  pinned: boolean;
  isDemo: boolean;
  hasEmbedding: boolean;
  created: string;
  modified: string;
  bumped: string;
  matchSnippet?: string;
  matchScore?: number;
}

export interface SimilarCardResult {
  card: SiteCard;
  score: number; // 0..1
  reasons: string[];
  breakdown: {
    semantic: number;
    content: number;
    tags: number;
    category: number;
    visual: number;
  };
}

export interface CategorySummary {
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  count: number;
}

export interface SmartFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  query: string;
  count: number;
  isSystem?: boolean;
}

export interface SearchQuery {
  q?: string;
  view?:
    | "all"
    | "pinned"
    | "uncategorized"
    | "untagged"
    | "recent"
    | "random"
    | "duplicates";
  category?: string;
  spaceId?: string;
  tag?: string;
  domain?: string;
  type?: CardType;
  colorHex?: string;
  sort?: "recent" | "created" | "title" | "domain" | "random";
  limit?: number;
}

export interface LibraryStats {
  total: number;
  pinned: number;
  uncategorized: number;
  untagged: number;
  recent: number;
  duplicates: number;
  demoMode: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
  autoSyncIntervalMinutes: number;
  keyIdMasked: string | null;
  categories: CategorySummary[];
  smartFolders: SmartFolder[];
  spaces: SpaceItem[];
  topTags: Array<{ name: string; count: number }>;
  topDomains: Array<{ domain: string; count: number }>;
}

export interface SyncStatus {
  state: "idle" | "syncing" | "success" | "error";
  message: string;
  fetched?: number;
  added?: number;
  updated?: number;
  lastSyncedAt?: string | null;
  error?: string;
}

export interface CredentialsInput {
  keyId: string;
  secret: string;
  autoSyncIntervalMinutes?: number;
}

export interface CredentialsStatus {
  configured: boolean;
  keyIdMasked: string | null;
  autoSyncIntervalMinutes: number;
  lastSyncedAt: string | null;
  demoMode: boolean;
}

export interface CreateSiteInput {
  url: string;
  title?: string;
  summary?: string;
  tags?: string[];
  note?: string;
  pushToMymind?: boolean;
}

export interface AppSettings {
  autoSyncIntervalMinutes: number;
  demoMode: boolean;
  showTopOfMind: boolean;
}

// Shared Electrobun RPC schema contract
export type RefMindBunRequests = {
  getLibraryStats: { params: Record<string, never>; response: LibraryStats };
  queryCards: { params: SearchQuery; response: { cards: SiteCard[]; total: number } };
  getCardById: { params: { id: string }; response: SiteCard | null };
  getSimilarCards: {
    params: { id: string; limit?: number };
    response: SimilarCardResult[];
  };
  togglePin: { params: { id: string }; response: SiteCard | null };
  setCardCategory: {
    params: { id: string; category: string | null };
    response: SiteCard | null;
  };
  updateCardTags: {
    params: { id: string; tags: string[] };
    response: SiteCard | null;
  };
  addCard: { params: CreateSiteInput; response: { card: SiteCard; pushedToMymind: boolean; warning?: string } };
  deleteCard: { params: { id: string; deleteRemote?: boolean }; response: { ok: boolean } };
  recategorizeAll: { params: Record<string, never>; response: { updated: number } };
  getCredentialsStatus: { params: Record<string, never>; response: CredentialsStatus };
  saveCredentials: {
    params: CredentialsInput;
    response: { ok: boolean; status: CredentialsStatus; error?: string };
  };
  clearCredentials: {
    params: { keepData?: boolean };
    response: { ok: boolean; status: CredentialsStatus };
  };
  testConnection: {
    params: { keyId?: string; secret?: string };
    response: { ok: boolean; message: string; objectSampleCount?: number };
  };
  syncNow: { params: Record<string, never>; response: SyncStatus };
  getSyncStatus: { params: Record<string, never>; response: SyncStatus };
  loadDemoData: { params: Record<string, never>; response: { ok: boolean; count: number } };
  createSmartFolder: {
    params: { name: string; query: string; color?: string; icon?: string };
    response: SmartFolder;
  };
  deleteSmartFolder: { params: { id: string }; response: { ok: boolean } };
  openExternalUrl: { params: { url: string }; response: { ok: boolean } };
}
