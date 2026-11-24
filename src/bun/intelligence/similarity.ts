import type { SimilarCardResult, SiteCard } from "../../shared/types";
import { tokenizeText } from "./categorizer";

export interface SimilarityCandidate {
  card: SiteCard;
  embedding?: number[] | null;
}

function buildWeightedTermMap(card: SiteCard): Map<string, number> {
  const weights = new Map<string, number>();

  const add = (text: string, weight: number) => {
    const tokens = tokenizeText(text);
    for (const tok of tokens) {
      weights.set(tok, (weights.get(tok) ?? 0) + weight);
      // Add Korean/CJK character bigrams so morphologically related Korean words match
      if (/[\uAC00-\uD7A3]/.test(tok) && tok.length >= 2) {
        for (let i = 0; i < tok.length - 1; i++) {
          const bg = `bg:${tok.slice(i, i + 2)}`;
          weights.set(bg, (weights.get(bg) ?? 0) + weight * 0.45);
        }
      }
    }
  };

  add(card.title, 3.2);
  add(card.tags.map((t) => t.name).join(" "), 2.8);
  add(card.autoKeywords.join(" "), 2.2);
  add(card.summary, 1.8);
  add(card.notes.map((n) => n.content).join(" "), 1.5);
  add(card.content.slice(0, 1200), 0.9);
  add(card.domain.replace(/\./g, " "), 1.4);

  return weights;
}

function cosineSimilarityVector(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB))));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function colorSimilarity(hexA: string, hexB: string): number {
  const rgbA = hexToRgb(hexA);
  const rgbB = hexToRgb(hexB);
  if (!rgbA || !rgbB) return 0;
  const dr = rgbA[0] - rgbB[0];
  const dg = rgbA[1] - rgbB[1];
  const db = rgbA[2] - rgbB[2];
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxDist = Math.sqrt(255 * 255 * 3);
  return Math.max(0, 1 - dist / maxDist);
}

/**
 * Computes hybrid similarity recommendations for a selected site card against the user's library.
 * Combines:
 *  1. mymind Embedding Cosine Similarity (when embeddings are present)
 *  2. TF-IDF Weighted Content Cosine Similarity (title, tags, keywords, summary, notes, domain)
 *  3. Tag Jaccard Overlap
 *  4. Auto-Category & Card-Type Affinity
 *  5. Visual Color Palette Proximity
 */
export function computeSimilarCards(
  target: SimilarityCandidate,
  corpus: SimilarityCandidate[],
  limit = 8
): SimilarCardResult[] {
  const others = corpus.filter((item) => item.card.id !== target.card.id);
  if (others.length === 0) return [];

  // Build IDF across entire corpus (target + others)
  const allDocs = [target, ...others];
  const termMaps = new Map<string, Map<string, number>>();
  const docFreq = new Map<string, number>();

  for (const item of allDocs) {
    const tMap = buildWeightedTermMap(item.card);
    termMaps.set(item.card.id, tMap);
    for (const term of tMap.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  const N = allDocs.length;
  const idf = (term: string): number => {
    const df = docFreq.get(term) ?? 1;
    return Math.log(1 + N / (1 + df)) + 0.5;
  };

  const toTfIdf = (tMap: Map<string, number>): { vec: Map<string, number>; norm: number } => {
    const vec = new Map<string, number>();
    let sumSq = 0;
    for (const [term, tf] of tMap.entries()) {
      const w = Math.log1p(tf) * idf(term);
      vec.set(term, w);
      sumSq += w * w;
    }
    return { vec, norm: Math.sqrt(sumSq) };
  };

  const targetTfIdf = toTfIdf(termMaps.get(target.card.id)!);
  const targetTags = new Set(target.card.tags.map((t) => t.name.toLowerCase()));
  const targetCat = (target.card.categoryOverride || target.card.autoCategory).toLowerCase();

  const results: SimilarCardResult[] = [];

  for (const cand of others) {
    const candTfIdf = toTfIdf(termMaps.get(cand.card.id)!);

    // 1. TF-IDF Content Similarity + shared high-value terms
    let dot = 0;
    const sharedTerms: Array<{ term: string; weight: number }> = [];
    for (const [term, wA] of targetTfIdf.vec.entries()) {
      const wB = candTfIdf.vec.get(term);
      if (wB !== undefined) {
        const prod = wA * wB;
        dot += prod;
        if (!term.startsWith("bg:")) {
          sharedTerms.push({ term, weight: prod });
        }
      }
    }
    const contentSim =
      targetTfIdf.norm > 0 && candTfIdf.norm > 0
        ? Math.min(1, dot / (targetTfIdf.norm * candTfIdf.norm))
        : 0;

    // 2. Semantic Embedding Similarity (from mymind API include=embeddings)
    const hasBothEmbeddings = Boolean(
      target.embedding &&
        target.embedding.length > 0 &&
        cand.embedding &&
        cand.embedding.length > 0
    );
    const semanticSim = hasBothEmbeddings
      ? cosineSimilarityVector(target.embedding!, cand.embedding!)
      : 0;

    // 3. Tag Jaccard Similarity
    const candTags = new Set(cand.card.tags.map((t) => t.name.toLowerCase()));
    const sharedTags: string[] = [];
    for (const t of targetTags) {
      if (candTags.has(t)) sharedTags.push(t);
    }
    const unionSize = new Set([...targetTags, ...candTags]).size;
    const tagSim = unionSize > 0 ? sharedTags.length / unionSize : 0;

    // 4. Category + Domain + Type Affinity
    const candCat = (cand.card.categoryOverride || cand.card.autoCategory).toLowerCase();
    const sameCategory = targetCat !== "uncategorized" && targetCat === candCat;
    const sameDomain =
      Boolean(target.card.domain) && target.card.domain === cand.card.domain;
    const sameType = target.card.type === cand.card.type;
    const categorySim = Math.min(
      1,
      (sameCategory ? 0.65 : 0) + (sameDomain ? 0.25 : 0) + (sameType ? 0.15 : 0)
    );

    // 5. Visual Color Similarity
    const visualSim = colorSimilarity(
      target.card.dominantColor,
      cand.card.dominantColor
    );

    // Weighted fusion
    const score = hasBothEmbeddings
      ? semanticSim * 0.45 +
        contentSim * 0.24 +
        tagSim * 0.16 +
        categorySim * 0.1 +
        visualSim * 0.05
      : contentSim * 0.5 +
        tagSim * 0.24 +
        categorySim * 0.18 +
        visualSim * 0.08;

    // Build human-readable reasons
    const reasons: string[] = [];
    if (hasBothEmbeddings && semanticSim >= 0.65) {
      reasons.push(`Semantic ${Math.round(semanticSim * 100)}%`);
    }
    if (sharedTags.length > 0) {
      reasons.push(`#${sharedTags.slice(0, 2).join(" #")}`);
    }
    if (sameCategory) {
      reasons.push(cand.card.categoryOverride || cand.card.autoCategory);
    }
    if (sameDomain) {
      reasons.push(cand.card.domain);
    }
    if (reasons.length < 2 && sharedTerms.length > 0) {
      const topShared = sharedTerms
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 2)
        .map((s) => s.term);
      reasons.push(`Keywords: ${topShared.join(", ")}`);
    }
    if (reasons.length === 0 && visualSim > 0.82) {
      reasons.push("Similar palette");
    }

    if (score >= 0.08) {
      results.push({
        card: cand.card,
        score: Number(Math.min(0.99, score).toFixed(3)),
        reasons: reasons.slice(0, 3),
        breakdown: {
          semantic: Number(semanticSim.toFixed(3)),
          content: Number(contentSim.toFixed(3)),
          tags: Number(tagSim.toFixed(3)),
          category: Number(categorySim.toFixed(3)),
          visual: Number(visualSim.toFixed(3)),
        },
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
