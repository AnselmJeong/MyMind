import { Electroview } from "electrobun/view";
import type { RefMindRPC } from "../../shared/rpcSchema";
import type {
  CreateSiteInput,
  CredentialsInput,
  SearchQuery,
  SyncStatus,
} from "../../shared/types";

type SyncListener = (status: SyncStatus) => void;
const syncListeners = new Set<SyncListener>();

const rpc = Electroview.defineRPC<RefMindRPC>({
  maxRequestTime: 60000,
  handlers: {
    requests: {},
    messages: {
      syncStatusUpdated: (status) => {
        for (const listener of syncListeners) {
          listener(status);
        }
      },
    },
  },
});

const electroview = new Electroview({ rpc });

export function subscribeSyncStatus(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

function req() {
  if (!electroview.rpc?.request) {
    throw new Error("Electrobun RPC bridge is not initialized.");
  }
  return electroview.rpc.request;
}

export const rpcClient = {
  getLibraryStats: () => req().getLibraryStats({}),
  queryCards: (query: SearchQuery) => req().queryCards(query),
  getCardById: (params: { id: string }) => req().getCardById(params),
  getSimilarCards: (params: { id: string; limit?: number }) =>
    req().getSimilarCards(params),
  togglePin: (params: { id: string }) => req().togglePin(params),
  setCardCategory: (params: { id: string; category: string | null }) =>
    req().setCardCategory(params),
  updateCardTags: (params: { id: string; tags: string[] }) =>
    req().updateCardTags(params),
  addCard: (input: CreateSiteInput) => req().addCard(input),
  deleteCard: (params: { id: string; deleteRemote?: boolean }) =>
    req().deleteCard(params),
  recategorizeAll: () => req().recategorizeAll({}),
  getCredentialsStatus: () => req().getCredentialsStatus({}),
  saveCredentials: (input: CredentialsInput) => req().saveCredentials(input),
  clearCredentials: (params: { keepData?: boolean }) =>
    req().clearCredentials(params),
  testConnection: (params: { keyId?: string; secret?: string }) =>
    req().testConnection(params),
  syncNow: () => req().syncNow({}),
  getSyncStatus: () => req().getSyncStatus({}),
  loadDemoData: () => req().loadDemoData({}),
  createSmartFolder: (params: {
    name: string;
    query: string;
    color?: string;
    icon?: string;
  }) => req().createSmartFolder(params),
  deleteSmartFolder: (params: { id: string }) => req().deleteSmartFolder(params),
  openExternalUrl: (params: { url: string }) => req().openExternalUrl(params),
};
