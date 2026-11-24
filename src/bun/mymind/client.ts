import { signMymindJwt, type MymindCredentials } from "./auth";

export const MYMIND_API_BASE = "https://api.mymind.com";
export const MYMIND_USER_AGENT = "RefMind/1.0.0 (macOS; Electrobun)";

export interface MymindBlob {
  path?: string;
  type?: string;
  url?: string;
  width?: number;
  height?: number;
  palette?: Record<string, number> | Array<{ color?: string; hex?: string; weight?: number }>;
}

export interface MymindTag {
  id?: string;
  name: string;
  flags?: number;
}

export interface MymindSpaceRef {
  id: string;
  name?: string;
  color?: string;
}

export interface MymindNote {
  id?: string;
  content?: string | { text?: string; markdown?: string; html?: string };
}

export interface MymindObject {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
  description?: string;
  completed?: boolean;
  content?: string | { text?: string; markdown?: string; html?: string };
  blob?: MymindBlob;
  screenshot?: MymindBlob;
  spaces?: MymindSpaceRef[];
  tags?: MymindTag[];
  notes?: MymindNote[];
  source?: {
    url?: string;
    title?: string;
    domain?: string;
  };
  url?: string;
  embeddings?: number[] | Array<{ vector?: number[]; values?: number[] }>;
  bumped?: string;
  created?: string;
  modified?: string;
  deleted?: string;
}

export interface MymindSpace {
  id: string;
  name: string;
  color?: string;
}

export class MymindApiError extends Error {
  status: number;
  title?: string;
  detail?: string;

  constructor(status: number, message: string, title?: string, detail?: string) {
    super(message);
    this.name = "MymindApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
  }
}

export class MymindClient {
  private creds: MymindCredentials;
  private baseUrl: string;

  constructor(creds: MymindCredentials, baseUrl = MYMIND_API_BASE) {
    this.creds = creds;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request(
    method: string,
    pathWithQuery: string,
    options?: {
      body?: unknown;
      accept?: string;
      redirect?: RequestRedirect;
      timeoutMs?: number;
    }
  ): Promise<Response> {
    const normalized = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
    const token = signMymindJwt(this.creds, method, normalized);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "User-Agent": MYMIND_USER_AGENT,
      Accept: options?.accept ?? "application/json",
    };

    let bodyStr: string | undefined;
    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyStr = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 25000);

    try {
      const res = await fetch(`${this.baseUrl}${normalized}`, {
        method: method.toUpperCase(),
        headers,
        body: bodyStr,
        redirect: options?.redirect ?? "follow",
        signal: controller.signal,
      });

      if (!res.ok) {
        let title: string | undefined;
        let detail: string | undefined;
        let fallbackMsg = `mymind API error (${res.status})`;

        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("json")) {
          try {
            const problem = (await res.json()) as {
              title?: string;
              detail?: string;
              message?: string;
            };
            title = problem.title;
            detail = problem.detail ?? problem.message;
            if (detail || title) {
              fallbackMsg = [title, detail].filter(Boolean).join(": ");
            }
          } catch {
            // ignore JSON parse errors
          }
        } else {
          try {
            const text = (await res.text()).slice(0, 240);
            if (text) fallbackMsg = `${fallbackMsg} - ${text}`;
          } catch {
            // ignore
          }
        }
        throw new MymindApiError(res.status, fallbackMsg, title, detail);
      }

      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  async testConnection(): Promise<{ ok: boolean; sampleCount: number }> {
    const res = await this.request("GET", "/objects?limit=5");
    const data = (await res.json()) as MymindObject[];
    return {
      ok: true,
      sampleCount: Array.isArray(data) ? data.length : 0,
    };
  }

  async listObjects(options?: {
    limit?: number;
    includeEmbeddings?: boolean;
    q?: string;
    spaceId?: string;
  }): Promise<MymindObject[]> {
    const params = new URLSearchParams();
    params.set("limit", String(options?.limit ?? 10000));
    if (options?.q) params.set("q", options.q);
    if (options?.spaceId) params.set("spaceId", options.spaceId);
    if (options?.includeEmbeddings) params.set("include", "embeddings");

    const queryStr = params.toString();
    const path = queryStr ? `/objects?${queryStr}` : "/objects";

    try {
      const res = await this.request("GET", path, { timeoutMs: 45000 });
      const data = (await res.json()) as MymindObject[];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // If include=embeddings isn't permitted on the user's tier, gracefully retry without embeddings
      if (
        options?.includeEmbeddings &&
        err instanceof MymindApiError &&
        (err.status === 400 || err.status === 403 || err.status === 422)
      ) {
        return this.listObjects({ ...options, includeEmbeddings: false });
      }
      throw err;
    }
  }

  async listSpaces(): Promise<MymindSpace[]> {
    try {
      const res = await this.request("GET", "/spaces");
      const data = (await res.json()) as MymindSpace[];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async createUrlObject(payload: {
    url: string;
    title?: string;
    tags?: string[];
    note?: string;
  }): Promise<MymindObject> {
    const body: Record<string, unknown> = {
      url: payload.url,
    };
    if (payload.title) body.title = payload.title;
    if (payload.tags && payload.tags.length > 0) {
      body.tags = payload.tags.map((name) => ({ name }));
    }
    if (payload.note) {
      body.notes = [{ content: payload.note }];
    }

    const res = await this.request("POST", "/objects", { body });
    return (await res.json()) as MymindObject;
  }

  async deleteObject(id: string): Promise<void> {
    await this.request("DELETE", `/objects/${encodeURIComponent(id)}`);
  }

  async fetchMedia(
    id: string,
    kind: "thumbnail" | "screenshot",
    size = "800x800"
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    const encodedId = encodeURIComponent(id);
    const path =
      kind === "thumbnail"
        ? `/objects/${encodedId}/thumbnail?size=${encodeURIComponent(size)}`
        : `/objects/${encodedId}/screenshot`;

    try {
      const res = await this.request("GET", path, {
        accept: "image/*,*/*",
        redirect: "follow",
        timeoutMs: 15000,
      });
      const arrayBuf = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      return {
        buffer: Buffer.from(arrayBuf),
        contentType,
      };
    } catch (err) {
      if (err instanceof MymindApiError && (err.status === 404 || err.status === 422)) {
        return null;
      }
      throw err;
    }
  }
}

export function extractTextContent(
  input: string | { text?: string; markdown?: string; html?: string } | undefined | null
): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  return input.markdown ?? input.text ?? input.html?.replace(/<[^>]+>/g, " ") ?? "";
}

export function extractEmbeddingVector(
  raw: MymindObject["embeddings"]
): number[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  if (typeof raw[0] === "number") {
    return raw as number[];
  }
  const first = raw[0] as { vector?: number[]; values?: number[] };
  if (Array.isArray(first.vector) && first.vector.length > 0) return first.vector;
  if (Array.isArray(first.values) && first.values.length > 0) return first.values;
  return null;
}
