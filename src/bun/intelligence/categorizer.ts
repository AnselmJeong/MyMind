import type { CardType } from "../../shared/types";

export interface CategoryDefinition {
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string;
  domains: string[];
  keywords: string[];
}

export const CATEGORY_TAXONOMY: CategoryDefinition[] = [
  {
    name: "Design & Visual",
    slug: "design-visual",
    color: "#E05A47",
    icon: "palette",
    description: "UI/UX, posters, editorial layout, visual references & art direction",
    domains: [
      "dribbble.com",
      "behance.net",
      "awwwards.com",
      "refto.one",
      "mobbin.com",
      "godly.website",
      "layers.to",
      "read.cv",
      "cosmos.so",
      "are.na",
      "savee.it",
      "siteinspire.com",
      "minimal.gallery",
      "figma.com",
      "framer.com",
      "pinterest.com",
      "itsnicethat.com",
      "brandnew",
      "underconsideration.com",
    ],
    keywords: [
      "design",
      "ui",
      "ux",
      "interface",
      "poster",
      "editorial",
      "layout",
      "grid",
      "visual",
      "moodboard",
      "reference",
      "art direction",
      "illustration",
      "minimal",
      "swiss",
      "graphic",
      "portfolio",
      "aesthetic",
      "figma",
      "framer",
      "interaction",
      "motion",
      "디자인",
      "포스터",
      "레퍼런스",
      "인터페이스",
      "무드보드",
      "시각",
      "그래픽",
    ],
  },
  {
    name: "AI & Machine Learning",
    slug: "ai-ml",
    color: "#6366F1",
    icon: "sparkles",
    description: "LLMs, vision models, agents, papers, datasets & AI labs",
    domains: [
      "huggingface.co",
      "openai.com",
      "anthropic.com",
      "deepmind.google",
      "arxiv.org",
      "paperswithcode.com",
      "replicate.com",
      "ollama.com",
      "kaggle.com",
      "mistral.ai",
      "together.ai",
      "perplexity.ai",
      "midjourney.com",
      "runwayml.com",
    ],
    keywords: [
      "ai",
      "llm",
      "gpt",
      "claude",
      "gemini",
      "agent",
      "agentic",
      "neural",
      "transformer",
      "diffusion",
      "embedding",
      "vector",
      "rag",
      "ocr",
      "fine-tune",
      "huggingface",
      "dataset",
      "model",
      "inference",
      "benchmark",
      "machine learning",
      "deep learning",
      "vision",
      "multimodal",
      "인공지능",
      "에이전트",
      "모델",
      "머신러닝",
      "딥러닝",
      "임베딩",
    ],
  },
  {
    name: "Dev & Engineering",
    slug: "dev-engineering",
    color: "#10B981",
    icon: "code",
    description: "Open-source repos, APIs, frameworks, databases & systems",
    domains: [
      "github.com",
      "gitlab.com",
      "npmjs.com",
      "bun.sh",
      "electrobun.dev",
      "developer.mozilla.org",
      "stackoverflow.com",
      "news.ycombinator.com",
      "vercel.com",
      "cloudflare.com",
      "supabase.com",
      "datasette.io",
      "sqlite.org",
      "rust-lang.org",
      "typescriptlang.org",
      "react.dev",
      "tailwindcss.com",
      "vitejs.dev",
    ],
    keywords: [
      "github",
      "repo",
      "open source",
      "api",
      "sdk",
      "cli",
      "framework",
      "library",
      "typescript",
      "javascript",
      "rust",
      "python",
      "swift",
      "bun",
      "react",
      "css",
      "sql",
      "sqlite",
      "database",
      "backend",
      "frontend",
      "compiler",
      "runtime",
      "docker",
      "kubernetes",
      "datatable",
      "component",
      "개발",
      "라이브러리",
      "프레임워크",
      "오픈소스",
      "코드",
      "데이터베이스",
    ],
  },
  {
    name: "Typography & Brand",
    slug: "typography-brand",
    color: "#D97706",
    icon: "type",
    description: "Type foundries, serif & display fonts, logos & brand systems",
    domains: [
      "fonts.google.com",
      "typewolf.com",
      "fontshare.com",
      "pangrampangram.com",
      "dinamo.xyz",
      "klim.co.nz",
      "colophon-foundry.org",
      "grillitype.com",
      "futurefonts.xyz",
      "myfonts.com",
      "fontsinuse.com",
    ],
    keywords: [
      "typography",
      "typeface",
      "font",
      "serif",
      "sans-serif",
      "monospace",
      "foundry",
      "lettering",
      "branding",
      "brand identity",
      "logo",
      "wordmark",
      "editorial type",
      "kerning",
      "타이포그래피",
      "폰트",
      "서체",
      "브랜딩",
      "로고",
    ],
  },
  {
    name: "Tools & Productivity",
    slug: "tools-productivity",
    color: "#0EA5E9",
    icon: "wrench",
    description: "macOS utilities, note-taking, spatial apps & workflow tools",
    domains: [
      "raycast.com",
      "linear.app",
      "notion.so",
      "obsidian.md",
      "arc.net",
      "mymind.com",
      "access.mymind.com",
      "cleanshot.com",
      "craft.do",
      "cron.com",
      "things.app",
      "1password.com",
      "setapp.com",
    ],
    keywords: [
      "macos",
      "mac app",
      "desktop app",
      "menu bar",
      "utility",
      "productivity",
      "workflow",
      "workspace",
      "window manager",
      "notes",
      "bookmark",
      "second brain",
      "knowledge",
      "spatial",
      "shortcut",
      "automation",
      "생산성",
      "도구",
      "유틸리티",
      "워크플로우",
      "메모",
      "북마크",
    ],
  },
  {
    name: "Research & Reading",
    slug: "research-reading",
    color: "#8B5CF6",
    icon: "book",
    description: "Long-form essays, papers, scientific viewers, books & newsletters",
    domains: [
      "substack.com",
      "medium.com",
      "stratechery.com",
      "paulgraham.com",
      "nature.com",
      "science.org",
      "pubmed.ncbi.nlm.nih.gov",
      "wikipedia.org",
      "archive.org",
      "goodreads.com",
      "theatlantic.com",
      "newyorker.com",
      "aeon.co",
    ],
    keywords: [
      "article",
      "essay",
      "paper",
      "research",
      "study",
      "journal",
      "book",
      "reading",
      "newsletter",
      "documentation",
      "guide",
      "handbook",
      "neuroscience",
      "eeg",
      "edf",
      "brain",
      "science",
      "analysis",
      "아티클",
      "논문",
      "리서치",
      "에세이",
      "독서",
      "가이드",
      "문서",
    ],
  },
  {
    name: "Products & SaaS",
    slug: "products-saas",
    color: "#EC4899",
    icon: "layers",
    description: "Startups, landing pages, pricing pages, hardware & consumer tech",
    domains: [
      "producthunt.com",
      "stripe.com",
      "apple.com",
      "teenage.engineering",
      "nothing.tech",
      "ycombinator.com",
      "crunchbase.com",
      "shopify.com",
    ],
    keywords: [
      "saas",
      "startup",
      "pricing",
      "landing page",
      "launch",
      "product",
      "hardware",
      "industrial design",
      "store",
      "checkout",
      "subscription",
      "marketplace",
      "스타트업",
      "프로덕트",
      "랜딩페이지",
      "서비스",
    ],
  },
  {
    name: "Architecture & Space",
    slug: "architecture-space",
    color: "#78716C",
    icon: "building",
    description: "Architecture, exhibitions, interior spaces & furniture",
    domains: [
      "archdaily.com",
      "dezeen.com",
      "divisare.com",
      "wallpaper.com",
      "yellowtrace.com.au",
      "domusweb.it",
    ],
    keywords: [
      "architecture",
      "pavilion",
      "biennale",
      "exhibition",
      "interior",
      "furniture",
      "spatial design",
      "concrete",
      "gallery",
      "museum",
      "건축",
      "전시",
      "인테리어",
      "공간",
      "가구",
    ],
  },
  {
    name: "Media & Culture",
    slug: "media-culture",
    color: "#F97316",
    icon: "film",
    description: "Music, jazz, photography, cinema, podcasts & creative culture",
    domains: [
      "youtube.com",
      "youtu.be",
      "vimeo.com",
      "spotify.com",
      "soundcloud.com",
      "bandcamp.com",
      "letterboxd.com",
      "mubi.com",
      "unsplash.com",
      "magnumphotos.com",
    ],
    keywords: [
      "music",
      "jazz",
      "festival",
      "album",
      "film",
      "cinema",
      "video",
      "photography",
      "photo",
      "podcast",
      "concert",
      "culture",
      "art",
      "음악",
      "영화",
      "사진",
      "영상",
      "문화",
      "예술",
    ],
  },
];

export const UNCATEGORIZED_DEF: CategoryDefinition = {
  name: "Uncategorized",
  slug: "uncategorized",
  color: "#94A3B8",
  icon: "inbox",
  description: "Sites awaiting categorization or general web saves",
  domains: [],
  keywords: [],
};

export function getCategoryMeta(name: string): CategoryDefinition {
  return (
    CATEGORY_TAXONOMY.find((c) => c.name.toLowerCase() === name.toLowerCase()) ??
    UNCATEGORIZED_DEF
  );
}

export function extractDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const u = new URL(withProtocol);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function inferCardType(input: {
  url?: string;
  domain?: string;
  title?: string;
  summary?: string;
  tags?: string[];
  rawType?: string;
  hasBlobImage?: boolean;
}): CardType {
  const domain = (input.domain || extractDomain(input.url || "")).toLowerCase();
  const text = `${input.title ?? ""} ${input.summary ?? ""} ${(input.tags ?? []).join(" ")}`.toLowerCase();

  if (domain.includes("github.com") || domain.includes("gitlab.com")) return "repo";
  if (domain.includes("huggingface.co") || /\b(model|weights|checkpoint|llm)\b/.test(text)) {
    return "model";
  }
  if (
    domain.includes("youtube.com") ||
    domain.includes("youtu.be") ||
    domain.includes("vimeo.com")
  ) {
    return "video";
  }
  if (
    domain.includes("dribbble.com") ||
    domain.includes("behance.net") ||
    domain.includes("awwwards.com") ||
    domain.includes("refto.one") ||
    domain.includes("cosmos.so") ||
    domain.includes("are.na") ||
    /\b(poster|moodboard|typography|ui kit)\b/.test(text)
  ) {
    return "design";
  }
  if (
    domain.includes("substack.com") ||
    domain.includes("medium.com") ||
    domain.includes("arxiv.org") ||
    domain.includes("wikipedia.org") ||
    /\b(article|essay|guide|documentation|reference|paper)\b/.test(text)
  ) {
    return "article";
  }
  if (
    domain.includes("raycast.com") ||
    domain.includes("linear.app") ||
    domain.includes("figma.com") ||
    /\b(app|tool|utility|cli|extension|plugin|macos)\b/.test(text)
  ) {
    return "tool";
  }
  if (!input.url && input.hasBlobImage) return "image";
  if (!input.url) return "note";
  return "website";
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  keywords: string[];
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "have", "are", "was", "were",
  "will", "into", "about", "more", "some", "what", "when", "where", "which", "while", "how",
  "all", "can", "you", "our", "out", "new", "use", "using", "used", "make", "made", "best",
  "free", "open", "app", "web", "site", "page", "home", "index", "http", "https", "www",
  "com", "org", "net", "io", "dev", "ai", "co", "kr", "html", "php", "utm", "ref", "blog",
  "docs", "doc", "get", "set", "one", "two", "via", "not", "but", "they", "their", "them",
  "been", "being", "than", "then", "also", "just", "only", "very", "here", "there", "over",
  "such", "into", "most", "other", "after", "before", "between", "through", "during", "under",
  "및", "등", "수", "것", "있는", "하는", "위한", "대한", "통해", "에서", "으로", "입니다",
]);

export function tokenizeText(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, " ")
    .replace(/[^\p{L}\p{N}\-+#]+/gu, " ");

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];

  for (const tok of rawTokens) {
    const clean = tok.replace(/^[-+]+|[-+]+$/g, "");
    if (clean.length < 2 || STOPWORDS.has(clean)) continue;
    if (/^\d+$/.test(clean)) continue;
    tokens.push(clean);
  }
  return tokens;
}

export function extractAutoKeywords(input: {
  title?: string;
  summary?: string;
  url?: string;
  tags?: string[];
  notes?: string;
  content?: string;
}): string[] {
  const freq = new Map<string, number>();

  const addTokens = (text: string, weight: number) => {
    for (const tok of tokenizeText(text)) {
      freq.set(tok, (freq.get(tok) ?? 0) + weight);
    }
  };

  // Tags and title carry strongest signal
  if (input.tags) addTokens(input.tags.join(" "), 3.0);
  if (input.title) addTokens(input.title, 2.5);

  // URL path segments often contain clean topical slugs
  if (input.url) {
    try {
      const u = new URL(/^https?:\/\//i.test(input.url) ? input.url : `https://${input.url}`);
      const slug = u.pathname.replace(/[-_/]+/g, " ");
      addTokens(slug, 1.5);
    } catch {
      // ignore
    }
  }

  if (input.summary) addTokens(input.summary, 1.4);
  if (input.notes) addTokens(input.notes, 1.3);
  if (input.content) addTokens(input.content.slice(0, 1200), 0.8);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export function classifySite(input: {
  title?: string;
  summary?: string;
  url?: string;
  domain?: string;
  tags?: string[];
  notes?: string;
  content?: string;
}): CategorizationResult {
  const domain = (input.domain || extractDomain(input.url || "")).toLowerCase();
  const titleText = (input.title ?? "").toLowerCase();
  const tagsText = (input.tags ?? []).join(" ").toLowerCase();
  const bodyText = `${input.summary ?? ""} ${input.notes ?? ""} ${(input.content ?? "").slice(0, 1500)}`.toLowerCase();
  const urlPath = (input.url ?? "").toLowerCase();

  let bestCategory = UNCATEGORIZED_DEF.name;
  let bestScore = 0;
  let secondScore = 0;

  for (const cat of CATEGORY_TAXONOMY) {
    let score = 0;

    // 1. Domain match (high precision signal)
    for (const dom of cat.domains) {
      if (domain === dom || domain.endsWith(`.${dom}`) || domain.includes(dom)) {
        score += 6.0;
        break;
      }
    }

    // 2. Keyword matches across title, tags, URL, and body
    for (const kw of cat.keywords) {
      const kwLower = kw.toLowerCase();
      const isShort = kwLower.length <= 3 && /^[a-z0-9]+$/.test(kwLower);
      const matchIn = (haystack: string): boolean => {
        if (!haystack) return false;
        if (isShort) {
          const re = new RegExp(`(?:^|[^a-z0-9])${kwLower}(?:$|[^a-z0-9])`, "i");
          return re.test(haystack);
        }
        return haystack.includes(kwLower);
      };

      if (matchIn(tagsText)) score += 3.2;
      if (matchIn(titleText)) score += 2.6;
      if (matchIn(urlPath)) score += 1.4;
      if (matchIn(bodyText)) score += 1.2;
    }

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestCategory = cat.name;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  const keywords = extractAutoKeywords(input);

  if (bestScore < 1.8) {
    return {
      category: UNCATEGORIZED_DEF.name,
      confidence: 0.25,
      keywords,
    };
  }

  const margin = bestScore - secondScore;
  const confidence = Math.min(0.98, Math.max(0.45, 0.55 + (bestScore / 14) * 0.28 + (margin / 8) * 0.15));

  return {
    category: bestCategory,
    confidence: Number(confidence.toFixed(2)),
    keywords,
  };
}
