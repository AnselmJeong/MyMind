import {
  ApplicationMenu,
  BrowserView,
  BrowserWindow,
  Utils,
} from "electrobun/bun";
import type { RefMindRPC } from "../shared/rpcSchema";
import { RefMindDatabase } from "./db/database";
import { MymindSyncService } from "./mymind/sync";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function resolveMainViewUrl(): Promise<string> {
  if (process.env.REFMIND_USE_HMR === "1") {
    try {
      const res = await fetch(DEV_SERVER_URL, { method: "HEAD" });
      if (res.ok) {
        return DEV_SERVER_URL;
      }
    } catch {
      // fall through to bundled views:// URL
    }
  }
  return "views://mainview/index.html";
}

// Initialize local SQLite database + seed visual demo cards on very first launch
const db = new RefMindDatabase();
db.seedDemoIfEmpty();

let mainWindow: BrowserWindow<ReturnType<typeof BrowserView.defineRPC<RefMindRPC>>> | null =
  null;

const syncService = new MymindSyncService(db, (status) => {
  try {
    mainWindow?.webview.rpc?.send.syncStatusUpdated(status);
  } catch {
    // webview may not be mounted yet
  }
});

syncService.startMediaServer();
syncService.configureAutoSync();

// If user already configured credentials from a previous session, sync in background
if (db.getCredentials()) {
  setTimeout(() => {
    void syncService.syncNow();
  }, 1500);
}

const rpc = BrowserView.defineRPC<RefMindRPC>({
  maxRequestTime: 60000,
  handlers: {
    requests: {
      getLibraryStats: () => db.getLibraryStats(),
      queryCards: (params) => db.queryCards(params),
      getCardById: ({ id }) => db.getCardById(id),
      getSimilarCards: ({ id, limit }) => db.getSimilarCards(id, limit ?? 8),
      togglePin: ({ id }) => db.togglePin(id),
      setCardCategory: ({ id, category }) => db.setCardCategory(id, category),
      updateCardTags: ({ id, tags }) => db.updateCardTags(id, tags),
      addCard: async (input) => syncService.createSite(input),
      deleteCard: async ({ id, deleteRemote }) => {
        const ok = await syncService.deleteCard(id, Boolean(deleteRemote));
        return { ok };
      },
      recategorizeAll: () => ({ updated: db.recategorizeAll() }),
      getCredentialsStatus: () => db.getCredentialsStatus(),
      saveCredentials: ({ keyId, secret, autoSyncIntervalMinutes }) => {
        if (!keyId?.trim() || !secret?.trim()) {
          return {
            ok: false,
            status: db.getCredentialsStatus(),
            error: "Key ID와 Secret을 모두 입력해 주세요.",
          };
        }
        const status = db.saveCredentials(
          { keyId: keyId.trim(), secret: secret.trim() },
          autoSyncIntervalMinutes ?? 15
        );
        syncService.configureAutoSync();
        return { ok: true, status };
      },
      clearCredentials: ({ keepData }) => {
        const status = db.clearCredentials(Boolean(keepData));
        syncService.stopAutoSync();
        if (!keepData) {
          db.seedDemoIfEmpty();
        }
        return { ok: true, status };
      },
      testConnection: async ({ keyId, secret }) =>
        syncService.testConnection({ keyId, secret }),
      syncNow: async () => syncService.syncNow(),
      getSyncStatus: () => syncService.getSyncStatus(),
      loadDemoData: () => ({ ok: true, count: db.loadDemoData() }),
      createSmartFolder: (input) => db.createSmartFolder(input),
      deleteSmartFolder: ({ id }) => ({ ok: db.deleteSmartFolder(id) }),
      openExternalUrl: ({ url }) => {
        if (!url) return { ok: false };
        const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const ok = Utils.openExternal(normalized);
        return { ok };
      },
    },
    messages: {},
  },
});

// Native macOS Application Menu (enables standard ⌘C/⌘V/⌘A/⌘Q/⌘W inside WKWebView!)
ApplicationMenu.setApplicationMenu([
  {
    submenu: [
      { label: "About RefMind", role: "about" },
      { type: "separator" },
      { label: "Hide RefMind", role: "hide" },
      { label: "Hide Others", role: "hideOthers" },
      { label: "Show All", role: "showAll" },
      { type: "separator" },
      { label: "Quit RefMind", role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "toggleFullScreen" },
    ],
  },
  {
    label: "Window",
    submenu: [
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "close" },
    ],
  },
]);

const url = await resolveMainViewUrl();

mainWindow = new BrowserWindow({
  title: "RefMind",
  url,
  frame: {
    width: 1380,
    height: 880,
    x: 120,
    y: 80,
  },
  titleBarStyle: "hiddenInset",
  trafficLightOffset: {
    x: 16,
    y: 15,
  },
  rpc,
});

mainWindow.on("close", () => {
  syncService.stop();
  db.close();
});
