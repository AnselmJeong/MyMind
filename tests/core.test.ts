import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHmac } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { maskKeyId, signMymindJwt } from "../src/bun/mymind/auth";
import { classifySite } from "../src/bun/intelligence/categorizer";
import { RefMindDatabase } from "../src/bun/db/database";

describe("mymind HS256 JWT Authentication", () => {
  test("signs valid HS256 JWT stripping query strings per mymind spec", () => {
    const rawSecret = Buffer.from("0123456789abcdef0123456789abcdef", "utf8");
    const base64Secret = rawSecret.toString("base64");
    const fixedNow = 1760000000;

    const jwt = signMymindJwt(
      { keyId: "kid_test_12345", secret: base64Secret },
      "get",
      "/objects?limit=50&include=embeddings",
      fixedNow,
      300
    );

    const parts = jwt.split(".");
    expect(parts.length).toBe(3);
    // No base64url padding allowed
    for (const part of parts) {
      expect(part.includes("=")).toBe(false);
      expect(part.includes("+")).toBe(false);
      expect(part.includes("/")).toBe(false);
    }

    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));

    expect(header).toEqual({ alg: "HS256", kid: "kid_test_12345" });
    expect(payload).toEqual({
      method: "GET",
      path: "/objects",
      iat: fixedNow,
      exp: fixedNow + 300,
    });

    // Independent HMAC verification
    const expectedSig = createHmac("sha256", rawSecret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");
    expect(parts[2]).toBe(expectedSig);
  });

  test("masks key IDs safely for display", () => {
    expect(maskKeyId("mk_live_9876543210")).toBe("mk_l••••3210");
    expect(maskKeyId(null)).toBeNull();
  });
});

describe("Auto-Categorization Engine", () => {
  test("classifies design, AI, dev, typography, and Korean sites accurately", () => {
    const design = classifySite({
      title: "Swiss Poster Archive — Graphic Reference",
      url: "https://refto.one/posters/swiss",
      tags: ["poster", "minimal"],
    });
    expect(design.category).toBe("Design & Visual");
    expect(design.confidence).toBeGreaterThan(0.6);

    const ai = classifySite({
      title: "MemT-1.0-Flash",
      summary: "Lightweight memory-augmented LLM transformer model",
      url: "https://huggingface.co/models/memt-1-0-flash",
      tags: ["huggingface", "llm"],
    });
    expect(ai.category).toBe("AI & Machine Learning");

    const dev = classifySite({
      title: "Electrobun v2",
      summary: "TypeScript desktop runtime powered by Bun",
      url: "https://github.com/blackboardsh/electrobun",
      tags: ["typescript", "bun"],
    });
    expect(dev.category).toBe("Dev & Engineering");

    const korean = classifySite({
      title: "에디토리얼 타이포그래피와 한글 서체 디자인 가이드",
      summary: "세리프 폰트와 브랜딩 로고 작업 참고",
      url: "https://example.kr/type-guide",
    });
    expect(korean.category).toBe("Typography & Brand");
  });
});

describe("SQLite FTS5 Store, Search & Similar Site Recommendations", () => {
  let tmpDir: string;
  let db: RefMindDatabase;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "refmind-test-"));
    db = new RefMindDatabase(tmpDir);
    db.seedDemoIfEmpty();
  });

  afterAll(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("seeds visual demo library and produces category & sidebar stats", () => {
    const stats = db.getLibraryStats();
    expect(stats.total).toBeGreaterThanOrEqual(20);
    expect(stats.demoMode).toBe(true);
    expect(stats.connected).toBe(false);
    expect(stats.categories.length).toBeGreaterThanOrEqual(4);
    expect(stats.smartFolders.length).toBeGreaterThanOrEqual(3);
  });

  test("supports keyword, Korean, and operator search (#tag, domain:, cat:)", () => {
    const byTag = db.queryCards({ q: "#poster" });
    expect(byTag.total).toBeGreaterThanOrEqual(4);

    const byDomain = db.queryCards({ q: "domain:huggingface.co" });
    expect(byDomain.total).toBe(2);

    const byKoreanNote = db.queryCards({ q: "스위스" });
    expect(byKoreanNote.total).toBeGreaterThanOrEqual(1);
    expect(byKoreanNote.cards[0].id).toBe("demo-swiss-pavilion");

    const byCat = db.queryCards({ q: "cat:ai" });
    expect(byCat.total).toBeGreaterThanOrEqual(3);
  });

  test("recommends truly similar sites using content, tags, category, and embeddings", () => {
    // 1. Poster site should recommend other poster/typography sites at the top
    const similarPosters = db.getSimilarCards("demo-blue-note", 5);
    expect(similarPosters.length).toBeGreaterThan(0);
    const topIds = similarPosters.slice(0, 3).map((r) => r.card.id);
    expect(
      topIds.some((id) =>
        [
          "demo-swiss-pavilion",
          "demo-ontype-monolith",
          "demo-reverse-poster",
          "demo-talk-gradient",
        ].includes(id)
      )
    ).toBe(true);

    // 2. Hugging Face model should recommend the other Hugging Face model
    const similarAi = db.getSimilarCards("demo-memt-flash", 5);
    expect(similarAi[0].card.id).toBe("demo-ocria-nano");

    // 3. Embedding vector cosine similarity test
    db.upsertCard({
      id: "vec-a",
      title: "Alpha",
      url: "https://a.example.com",
      embedding: [1, 0, 0, 0],
    });
    db.upsertCard({
      id: "vec-b",
      title: "Beta",
      url: "https://b.example.com",
      embedding: [0.98, 0.19, 0, 0],
    });
    db.upsertCard({
      id: "vec-c",
      title: "Gamma",
      url: "https://c.example.com",
      embedding: [0, 0, 1, 0],
    });

    const vecSimilar = db.getSimilarCards("vec-a", 3);
    expect(vecSimilar[0].card.id).toBe("vec-b");
    expect(vecSimilar[0].breakdown.semantic).toBeGreaterThan(0.95);
  });

  test("stores and clears deferred mymind credentials cleanly", () => {
    const status1 = db.saveCredentials(
      { keyId: "kid_abc123456", secret: "c2VjcmV0X2tleV8zMl9ieXRlc19sb25nX2hlcmU=" },
      30
    );
    expect(status1.configured).toBe(true);
    expect(status1.autoSyncIntervalMinutes).toBe(30);
    expect(status1.keyIdMasked).toBe("kid_••••3456");

    const status2 = db.clearCredentials(true);
    expect(status2.configured).toBe(false);
    expect(status2.keyIdMasked).toBeNull();
  });
});
