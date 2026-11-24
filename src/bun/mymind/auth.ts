import { createHmac } from "crypto";

export interface MymindCredentials {
  keyId: string;
  secret: string; // Base64-encoded 256-bit secret from access.mymind.com/extensions
}

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSecret(secret: string): Buffer {
  const cleaned = secret.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (cleaned.length % 4)) % 4;
  const padded = cleaned + "=".repeat(padLen);
  return Buffer.from(padded, "base64");
}

/**
 * Creates a fresh per-request HS256 JWT signed according to the official mymind API spec:
 * https://access.mymind.com/api/authentication
 *
 * - Header: { alg: "HS256", kid: "<keyId>" }
 * - Payload: { method: "GET"|"POST"|..., path: "/objects" (no query string), iat, exp }
 * - Signature: HMAC-SHA256 over base64url(header) + "." + base64url(payload)
 */
export function signMymindJwt(
  creds: MymindCredentials,
  method: string,
  pathWithOptionalQuery: string,
  nowSec = Math.floor(Date.now() / 1000),
  ttlSec = 300
): string {
  const cleanMethod = method.trim().toUpperCase();
  const pathOnly = pathWithOptionalQuery.split("?")[0] || "/";
  const normalizedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  const header = {
    alg: "HS256",
    kid: creds.keyId.trim(),
  };

  const payload = {
    method: cleanMethod,
    path: normalizedPath,
    iat: nowSec,
    exp: nowSec + ttlSec,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const secretKey = decodeSecret(creds.secret);
  const signature = createHmac("sha256", secretKey).update(signingInput).digest();

  return `${signingInput}.${toBase64Url(signature)}`;
}

export function maskKeyId(keyId: string | null | undefined): string | null {
  if (!keyId) return null;
  const trimmed = keyId.trim();
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}••••`;
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
