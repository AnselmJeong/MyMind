import type { RPCSchema } from "electrobun/rpc";
import type { RefMindBunRequests, SyncStatus } from "./types";

export type RefMindRPC = {
  bun: RPCSchema<{
    requests: RefMindBunRequests;
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: {
      syncStatusUpdated: SyncStatus;
    };
  }>;
};
