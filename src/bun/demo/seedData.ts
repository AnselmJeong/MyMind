import type { CardType, ColorSwatch, NoteItem, SpaceItem, TagItem } from "../../shared/types";

export interface DemoCardSeed {
  id: string;
  title: string;
  summary: string;
  url: string;
  type: CardType;
  tags: string[];
  spaces: string[];
  notes?: string[];
  content?: string;
  dominantColor: string;
  palette: ColorSwatch[];
  aspectRatio: number;
  pinned?: boolean;
  daysAgo: number;
  visualSvg?: string; // Rich vector visual preview for visual-first showcase cards
}

function svgToDataUri(svg: string): string {
  const encoded = Buffer.from(svg.trim(), "utf8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

const POSTER_BLUE_NOTE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560">
  <rect width="420" height="560" fill="#4672C4"/>
  <rect x="20" y="20" width="380" height="520" fill="none" stroke="#0F1C3F" stroke-width="2" opacity="0.25"/>
  <text x="32" y="72" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="3" fill="#0A142E">LIVE AT VILLAGE VANGUARD</text>
  <text x="32" y="156" font-family="Georgia, serif" font-size="68" font-weight="700" fill="#0B1633">BLUE</text>
  <text x="32" y="222" font-family="Georgia, serif" font-size="68" font-weight="700" fill="#0B1633">NOTE</text>
  <text x="32" y="266" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="800" letter-spacing="2" fill="#E8F0FF">JAZZ FESTIVAL</text>
  <circle cx="315" cy="395" r="78" fill="#0B1633"/>
  <circle cx="315" cy="395" r="24" fill="#4672C4"/>
  <rect x="32" y="340" width="160" height="14" fill="#0B1633"/>
  <rect x="32" y="366" width="120" height="14" fill="#E8F0FF"/>
  <rect x="32" y="392" width="145" height="14" fill="#0B1633"/>
  <rect x="32" y="418" width="90" height="14" fill="#0B1633"/>
  <text x="32" y="512" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="#0A142E">ALL AGES · ARCHIVE SERIES 1964</text>
</svg>
`);

const POSTER_SWISS_PAVILION = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 500">
  <rect width="420" height="500" fill="#F5F4F0"/>
  <text x="24" y="52" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#555">Neighbourhood · Karin Sander</text>
  <text x="200" y="72" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">SWISS</text>
  <text x="24" y="118" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">PAVILION 18TH</text>
  <text x="24" y="164" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">IN   TERNA</text>
  <text x="24" y="210" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">TIONAL ARCH</text>
  <text x="148" y="256" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">ITECTURE</text>
  <text x="24" y="302" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#111">EXHIBITION</text>
  <text x="24" y="348" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="#111">LA BIENNALE</text>
  <text x="24" y="394" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="#111">DI VENEZIA</text>
  <text x="24" y="458" font-family="Helvetica, Arial, sans-serif" font-size="38" font-weight="800" fill="#111">2025</text>
  <line x1="24" y1="472" x2="396" y2="472" stroke="#111" stroke-width="2"/>
</svg>
`);

const POSTER_REVERSE_RED = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 440">
  <rect width="420" height="440" fill="#0B0B0D"/>
  <rect x="64" y="32" width="292" height="220" fill="#DC3619"/>
  <rect x="64" y="252" width="292" height="156" fill="#D4D4D0"/>
  <text x="74" y="242" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#EAEAE6">reverse</text>
  <text x="74" y="274" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#DC3619">reverse</text>
  <text x="74" y="322" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#444">SYSTEMS OF CONTRAST &amp; RATIO</text>
  <text x="74" y="340" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#666">ZURICH EDITORIAL ARCHIVE · NO. 04</text>
</svg>
`);

const POSTER_ORANGE_SUN = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 500">
  <rect width="420" height="500" fill="#F24E1E"/>
  <circle cx="210" cy="300" r="145" fill="#141414"/>
  <rect x="206" y="155" width="8" height="145" fill="#F24E1E"/>
  <rect x="206" y="296" width="110" height="8" fill="#F24E1E"/>
  <text x="32" y="56" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2" fill="#141414">DIETER RAMS · TEN PRINCIPLES</text>
  <text x="32" y="84" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#141414" opacity="0.78">LESS, BUT BETTER — INDUSTRIAL DESIGN ARCHIVE</text>
</svg>
`);

const POSTER_GEOMETRIC_GRID = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
  <rect width="420" height="420" fill="#111113"/>
  <g transform="translate(24,24)">
    <rect x="0" y="0" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <path d="M0,0 A116,116 0 0,1 116,116 L0,116 Z" fill="#111113"/>
    <circle cx="58" cy="138" r="32" fill="#111113"/>

    <rect x="128" y="0" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <ellipse cx="186" cy="88" rx="42" ry="68" fill="#FF5A26"/>
    <circle cx="186" cy="60" r="24" fill="#111113"/>

    <rect x="256" y="0" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <rect x="272" y="16" width="84" height="68" rx="34" fill="#111113"/>
    <circle cx="314" cy="134" r="32" fill="#3B82F6"/>

    <rect x="0" y="192" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <circle cx="58" cy="250" r="44" fill="#EF4444"/>
    <circle cx="58" cy="316" r="34" fill="#3B82F6"/>

    <rect x="128" y="192" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <polygon points="186,214 232,348 140,348" fill="#111113"/>
    <circle cx="186" cy="296" r="22" fill="#F59E0B"/>

    <rect x="256" y="192" width="116" height="176" rx="10" fill="#F5F5F2"/>
    <path d="M256,192 L372,192 L372,308 A116,116 0 0,1 256,192 Z" fill="#111113"/>
    <circle cx="294" cy="322" r="28" fill="#10B981"/>
  </g>
</svg>
`);

const POSTER_SERIF_CHAPTER = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 540">
  <rect width="420" height="540" fill="#FAFAFA"/>
  <text x="32" y="112" font-family="Helvetica, Arial, sans-serif" font-size="68" font-weight="900" letter-spacing="-3" fill="#111">18H:24M</text>
  <line x1="32" y1="142" x2="388" y2="142" stroke="#E5E5E5" stroke-width="1.5"/>
  <text x="210" y="242" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#18181B">Chapter</text>
  <text x="210" y="302" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-style="italic" fill="#18181B">One:</text>
  <line x1="32" y1="344" x2="388" y2="344" stroke="#E5E5E5" stroke-width="1.5"/>
  <text x="210" y="424" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#18181B">Editorial</text>
  <text x="210" y="476" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#18181B">Foundry</text>
</svg>
`);

const UI_SPATIAL_AGENT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360">
  <rect width="560" height="360" fill="#F8FAFC"/>
  <rect x="20" y="16" width="520" height="328" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <circle cx="42" cy="36" r="5" fill="#FF5F56"/>
  <circle cx="58" cy="36" r="5" fill="#FFBD2E"/>
  <circle cx="74" cy="36" r="5" fill="#27C93F"/>
  <text x="280" y="88" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0F172A">A spatial environment</text>
  <text x="280" y="114" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#0F172A">to build with your agent</text>
  <rect x="230" y="128" width="100" height="24" rx="12" fill="#2563EB"/>
  <text x="280" y="144" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" font-weight="600" fill="#FFFFFF">Launch Canvas</text>
  <rect x="52" y="172" width="140" height="140" rx="10" fill="#F1F5F9" stroke="#E2E8F0"/>
  <rect x="210" y="172" width="140" height="140" rx="10" fill="#EFF6FF" stroke="#BFDBFE"/>
  <rect x="368" y="172" width="140" height="140" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="228" y="194" width="104" height="14" rx="4" fill="#3B82F6" opacity="0.25"/>
  <rect x="228" y="218" width="84" height="10" rx="3" fill="#94A3B8" opacity="0.4"/>
  <rect x="228" y="236" width="96" height="10" rx="3" fill="#94A3B8" opacity="0.3"/>
  <circle cx="122" cy="242" r="28" fill="#CBD5E1" opacity="0.5"/>
  <rect x="386" y="196" width="104" height="44" rx="6" fill="#1E293B"/>
  <rect x="386" y="250" width="76" height="10" rx="3" fill="#CBD5E1"/>
</svg>
`);

const UI_FLUID_DATATABLE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360">
  <rect width="560" height="360" fill="#F9FAFB"/>
  <rect x="24" y="24" width="512" height="312" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5"/>
  <rect x="24" y="24" width="128" height="312" rx="12" fill="#F3F4F6"/>
  <rect x="44" y="50" width="76" height="10" rx="4" fill="#111827"/>
  <rect x="44" y="76" width="88" height="8" rx="3" fill="#9CA3AF"/>
  <rect x="44" y="96" width="68" height="8" rx="3" fill="#D1D5DB"/>
  <rect x="44" y="116" width="80" height="8" rx="3" fill="#D1D5DB"/>
  <text x="176" y="64" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#111827">DataTable · Fluid Functionalism</text>
  <rect x="176" y="84" width="332" height="28" rx="6" fill="#F9FAFB" stroke="#E5E7EB"/>
  <line x1="176" y1="146" x2="508" y2="146" stroke="#F3F4F6" stroke-width="2"/>
  <line x1="176" y1="184" x2="508" y2="184" stroke="#F3F4F6" stroke-width="2"/>
  <line x1="176" y1="222" x2="508" y2="222" stroke="#F3F4F6" stroke-width="2"/>
  <line x1="176" y1="260" x2="508" y2="260" stroke="#F3F4F6" stroke-width="2"/>
  <rect x="184" y="122" width="110" height="10" rx="3" fill="#374151"/>
  <rect x="330" y="122" width="56" height="14" rx="7" fill="#DCFCE7"/>
  <rect x="184" y="160" width="132" height="10" rx="3" fill="#6B7280"/>
  <rect x="330" y="160" width="56" height="14" rx="7" fill="#DBEAFE"/>
  <rect x="184" y="198" width="96" height="10" rx="3" fill="#6B7280"/>
  <rect x="330" y="198" width="56" height="14" rx="7" fill="#FEF3C7"/>
  <rect x="184" y="236" width="124" height="10" rx="3" fill="#6B7280"/>
  <rect x="330" y="236" width="56" height="14" rx="7" fill="#DCFCE7"/>
</svg>
`);

const UI_SPACEMAN_MAC = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420">
  <rect width="420" height="420" fill="#FFFFFF"/>
  <rect x="0" y="0" width="420" height="6" fill="#2563EB"/>
  <rect x="90" y="88" width="240" height="240" rx="52" fill="#0A0A0C"/>
  <rect x="116" y="124" width="188" height="132" rx="14" fill="#18181B" stroke="#27272A"/>
  <rect x="128" y="138" width="76" height="104" rx="8" fill="#E4E4E7"/>
  <rect x="212" y="138" width="80" height="48" rx="8" fill="#A1A1AA"/>
  <rect x="212" y="194" width="80" height="48" rx="8" fill="#52525B"/>
  <text x="120" y="294" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">Spaceman</text>
  <text x="234" y="294" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#A1A1AA">macOS</text>
</svg>
`);

const UI_CONF_GALLERY = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360">
  <rect width="560" height="360" fill="#FFFFFF"/>
  <rect x="0" y="0" width="560" height="44" fill="#FEF3C7"/>
  <text x="28" y="28" font-family="Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#92400E">Top-Conf Figure Gallery · CVPR / NeurIPS / ICLR</text>
  <rect x="24" y="64" width="160" height="128" rx="10" fill="#EEF2FF" stroke="#C7D2FE"/>
  <rect x="200" y="64" width="160" height="128" rx="10" fill="#ECFDF5" stroke="#A7F3D0"/>
  <rect x="376" y="64" width="160" height="128" rx="10" fill="#FFF1F2" stroke="#FECDD3"/>
  <rect x="24" y="208" width="160" height="128" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <rect x="200" y="208" width="160" height="128" rx="10" fill="#FEFCE8" stroke="#FEF08A"/>
  <rect x="376" y="208" width="160" height="128" rx="10" fill="#F3E8FF" stroke="#E9D5FF"/>
  <path d="M44,164 L84,104 L124,142 L164,88" fill="none" stroke="#4F46E5" stroke-width="3"/>
  <rect x="224" y="130" width="22" height="42" rx="4" fill="#10B981"/>
  <rect x="256" y="102" width="22" height="70" rx="4" fill="#059669"/>
  <rect x="288" y="118" width="22" height="54" rx="4" fill="#34D399"/>
  <circle cx="456" cy="128" r="36" fill="none" stroke="#E11D48" stroke-width="6" stroke-dasharray="140 80"/>
</svg>
`);

const POSTER_MONOLITH_GREY = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 520">
  <rect width="420" height="520" fill="#7D8082"/>
  <rect x="44" y="42" width="332" height="436" rx="4" fill="#D5D7D8"/>
  <path d="M44,240 Q210,130 376,240 L376,340 Q210,230 44,340 Z" fill="#B8BCBE"/>
  <text x="272" y="118" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="900" letter-spacing="-1" fill="#18181B">ONTYPE</text>
  <circle cx="210" cy="260" r="9" fill="none" stroke="#18181B" stroke-width="2"/>
  <text x="64" y="446" font-family="Helvetica, Arial, sans-serif" font-size="11" letter-spacing="2" fill="#3F3F46">SWISS SPECIMEN · ARCHIVE 09</text>
</svg>
`);

const POSTER_TALK_GRADIENT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 460">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#89B4FA"/>
      <stop offset="50%" stop-color="#C8B6FF"/>
      <stop offset="100%" stop-color="#F8C8DC"/>
    </linearGradient>
  </defs>
  <rect width="420" height="460" fill="url(#g1)"/>
  <circle cx="145" cy="185" r="78" fill="#1E3A8A" opacity="0.22"/>
  <circle cx="275" cy="185" r="78" fill="#1E3A8A" opacity="0.22"/>
  <text x="210" y="338" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="#2563EB">TALK TO</text>
  <text x="210" y="384" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="900" fill="#2563EB">YOURSELF</text>
  <text x="210" y="426" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="#1D4ED8">LIKE ART</text>
</svg>
`);

const UI_EEG_VIEWER = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340">
  <rect width="560" height="340" fill="#E8EEF5"/>
  <rect x="28" y="28" width="504" height="284" rx="12" fill="#FFFFFF" stroke="#CBD5E1"/>
  <text x="52" y="72" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#1E3A8A">Brainclinics EDF/BDF Viewer</text>
  <text x="52" y="96" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#64748B">Browser-based clinical EEG &amp; biosignal waveform explorer</text>
  <path d="M52,150 Q72,118 92,150 T132,150 T172,150 T212,150 T252,150 T292,150 T332,150 T372,150 T412,150 T452,150 T504,150" fill="none" stroke="#2563EB" stroke-width="2.2"/>
  <path d="M52,205 Q68,180 84,205 T116,205 T148,205 T180,205 T212,205 T244,205 T276,205 T308,205 T340,205 T372,205 T404,205 T436,205 T504,205" fill="none" stroke="#0EA5E9" stroke-width="2"/>
  <path d="M52,260 Q82,238 112,260 T172,260 T232,260 T292,260 T352,260 T412,260 T504,260" fill="none" stroke="#6366F1" stroke-width="2"/>
</svg>
`);

const POSTER_DARK_INTERFACE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 380">
  <rect width="560" height="380" fill="#09090B"/>
  <rect x="24" y="24" width="512" height="332" rx="14" fill="#121216" stroke="#27272A"/>
  <rect x="44" y="48" width="120" height="12" rx="4" fill="#F4F4F5"/>
  <rect x="44" y="72" width="210" height="8" rx="3" fill="#71717A"/>
  <rect x="44" y="106" width="224" height="110" rx="10" fill="#18181B" stroke="#2E2E34"/>
  <rect x="284" y="106" width="232" height="110" rx="10" fill="#18181B" stroke="#2E2E34"/>
  <circle cx="80" cy="144" r="18" fill="#6366F1"/>
  <rect x="112" y="134" width="120" height="10" rx="3" fill="#E4E4E7"/>
  <rect x="112" y="152" width="84" height="8" rx="3" fill="#71717A"/>
  <rect x="304" y="128" width="192" height="66" rx="8" fill="#09090B"/>
  <path d="M318,176 L358,148 L398,162 L442,138 L480,152" fill="none" stroke="#10B981" stroke-width="2.5"/>
  <rect x="44" y="234" width="472" height="98" rx="10" fill="#18181B" stroke="#2E2E34"/>
  <text x="64" y="274" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="#FAFAFA">Linear · Purpose-built tool for planning and building products</text>
  <text x="64" y="298" font-family="Helvetica, Arial, sans-serif" font-size="11" fill="#A1A1AA">Keyboard-first dark UI craft · Instant local sync engine</text>
</svg>
`);

export const DEMO_SPACES: SpaceItem[] = [
  { id: "space-design", name: "Design Reference", color: "#E05A47" },
  { id: "space-ai", name: "AI Lab & Models", color: "#6366F1" },
  { id: "space-tools", name: "macOS Craft", color: "#0EA5E9" },
  { id: "space-reading", name: "Deep Reading", color: "#8B5CF6" },
];

export const DEMO_CARDS: DemoCardSeed[] = [
  {
    id: "demo-blue-note",
    title: "Blue Note Jazz Festival — Swiss Poster Archive",
    summary: "Classic cobalt-blue jazz festival poster studying bold display serif balance and rhythmic typographic contrast.",
    url: "https://refto.one/posters/blue-note-jazz",
    type: "design",
    tags: ["poster", "jazz", "blue", "typography", "visual-reference"],
    spaces: ["space-design"],
    notes: ["강렬한 코발트 블루와 세리프 타이포그래피 대비 참고"],
    dominantColor: "#4672C4",
    palette: [
      { hex: "#4672C4", weight: 0.62 },
      { hex: "#0B1633", weight: 0.28 },
      { hex: "#E8F0FF", weight: 0.1 },
    ],
    aspectRatio: 0.75,
    pinned: true,
    daysAgo: 1,
    visualSvg: POSTER_BLUE_NOTE,
  },
  {
    id: "demo-swiss-pavilion",
    title: "Swiss Pavilion — 18th International Architecture Exhibition",
    summary: "La Biennale di Venezia Swiss Pavilion typographic poster with asymmetrical Swiss grid alignment.",
    url: "https://divisare.com/projects/swiss-pavilion-venezia",
    type: "design",
    tags: ["swiss-design", "poster", "architecture", "typography", "exhibition"],
    spaces: ["space-design"],
    notes: ["스위스 스타일 포스터 그리드와 여백 처리"],
    dominantColor: "#F5F4F0",
    palette: [
      { hex: "#F5F4F0", weight: 0.72 },
      { hex: "#111111", weight: 0.28 },
    ],
    aspectRatio: 0.84,
    daysAgo: 2,
    visualSvg: POSTER_SWISS_PAVILION,
  },
  {
    id: "demo-mymind-api",
    title: "API Reference — mymind",
    summary: "Official mymind API documentation covering HS256 JWT request signing, /objects endpoints, embeddings, and screenshots.",
    url: "https://access.mymind.com/api/authentication",
    type: "article",
    tags: ["mymind", "api", "jwt", "documentation", "bookmarks"],
    spaces: ["space-tools", "space-reading"],
    notes: ["HS256 JWT per-request signing + include=embeddings 활용"],
    dominantColor: "#2563EB",
    palette: [
      { hex: "#FFFFFF", weight: 0.78 },
      { hex: "#2563EB", weight: 0.22 },
    ],
    aspectRatio: 1.05,
    pinned: true,
    daysAgo: 0,
  },
  {
    id: "demo-reverse-poster",
    title: "Reverse Systems — Graphic Identity Specimen",
    summary: "High-contrast vermilion and matte stone poster exploring figure-ground reversal and minimalist layout.",
    url: "https://fontsinuse.com/uses/reverse-zurich",
    type: "design",
    tags: ["poster", "minimal", "swiss-design", "editorial", "red"],
    spaces: ["space-design"],
    dominantColor: "#DC3619",
    palette: [
      { hex: "#0B0B0D", weight: 0.45 },
      { hex: "#DC3619", weight: 0.35 },
      { hex: "#D4D4D0", weight: 0.2 },
    ],
    aspectRatio: 0.95,
    daysAgo: 3,
    visualSvg: POSTER_REVERSE_RED,
  },
  {
    id: "demo-neueface",
    title: "Neueface — A spatial environment to build with your agent",
    summary: "Spatial canvas workspace for collaborating with autonomous AI coding and research agents visually.",
    url: "https://neueface.ai",
    type: "tool",
    tags: ["ai", "agent", "spatial", "workspace", "interface"],
    spaces: ["space-ai", "space-tools"],
    notes: ["에이전트 협업용 공간 UI 디자인 레퍼런스"],
    dominantColor: "#2563EB",
    palette: [
      { hex: "#F8FAFC", weight: 0.65 },
      { hex: "#2563EB", weight: 0.2 },
      { hex: "#0F172A", weight: 0.15 },
    ],
    aspectRatio: 1.55,
    pinned: true,
    daysAgo: 1,
    visualSvg: UI_SPATIAL_AGENT,
  },
  {
    id: "demo-memt-flash",
    title: "MemT-1.0-Flash",
    summary: "Lightweight memory-augmented transformer model on Hugging Face optimized for fast local retrieval and context compression.",
    url: "https://huggingface.co/models/memt-1-0-flash",
    type: "model",
    tags: ["huggingface", "llm", "memory", "ai", "retrieval"],
    spaces: ["space-ai"],
    notes: ["로컬 메모리 검색 모델 벤치마크 확인 필요"],
    dominantColor: "#10B981",
    palette: [
      { hex: "#FFFFFF", weight: 0.85 },
      { hex: "#10B981", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 2,
  },
  {
    id: "demo-ocria-nano",
    title: "OCRia-nano-1",
    summary: "Compact multilingual vision-OCR model on Hugging Face for fast document and screenshot text extraction.",
    url: "https://huggingface.co/models/ocria-nano-1",
    type: "model",
    tags: ["huggingface", "ocr", "vision", "ai", "multimodal"],
    spaces: ["space-ai"],
    dominantColor: "#10B981",
    palette: [
      { hex: "#FFFFFF", weight: 0.85 },
      { hex: "#10B981", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 4,
  },
  {
    id: "demo-geometric-grid",
    title: "Security Inbox 0 — Modular Geometric System",
    summary: "Six-panel geometric illustration system blending Bauhaus curves with bold primary color accents.",
    url: "https://cosmos.so/e/geometric-system-06",
    type: "design",
    tags: ["illustration", "geometric", "bauhaus", "visual-reference", "grid"],
    spaces: ["space-design"],
    dominantColor: "#111113",
    palette: [
      { hex: "#111113", weight: 0.45 },
      { hex: "#FF5A26", weight: 0.25 },
      { hex: "#3B82F6", weight: 0.15 },
      { hex: "#F5F5F2", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 5,
    visualSvg: POSTER_GEOMETRIC_GRID,
  },
  {
    id: "demo-datatable-fluid",
    title: "DataTable · Fluid Functionalism",
    summary: "Clean data table component patterns balancing dense SaaS information architecture with calm visual hierarchy.",
    url: "https://fluidfunctionalism.design/components/datatable",
    type: "design",
    tags: ["ui", "datatable", "design-system", "component", "minimal"],
    spaces: ["space-design"],
    dominantColor: "#F9FAFB",
    palette: [
      { hex: "#FFFFFF", weight: 0.72 },
      { hex: "#111827", weight: 0.18 },
      { hex: "#DCFCE7", weight: 0.1 },
    ],
    aspectRatio: 1.55,
    daysAgo: 3,
    visualSvg: UI_FLUID_DATATABLE,
  },
  {
    id: "demo-top-conf-gallery",
    title: "Top-Conf Figure Gallery",
    summary: "Curated visual gallery of figures, diagrams, and architecture plots from CVPR, NeurIPS, and ICLR papers.",
    url: "https://figure-gallery.ai/top-conf",
    type: "article",
    tags: ["research", "ai", "visualization", "papers", "diagrams"],
    spaces: ["space-ai", "space-reading"],
    notes: ["논문 다이어그램/차트 스타일 참고할 때 최고"],
    dominantColor: "#FEF3C7",
    palette: [
      { hex: "#FFFFFF", weight: 0.55 },
      { hex: "#4F46E5", weight: 0.2 },
      { hex: "#10B981", weight: 0.15 },
      { hex: "#FEF3C7", weight: 0.1 },
    ],
    aspectRatio: 1.55,
    daysAgo: 4,
    visualSvg: UI_CONF_GALLERY,
  },
  {
    id: "demo-spaceman",
    title: "Spaceman — Window & Space Manager for macOS",
    summary: "Minimal macOS menu bar utility for visualizing Spaces and switching virtual desktops effortlessly.",
    url: "https://spaceman.app",
    type: "tool",
    tags: ["macos", "utility", "window-manager", "productivity", "menu-bar"],
    spaces: ["space-tools"],
    dominantColor: "#0A0A0C",
    palette: [
      { hex: "#FFFFFF", weight: 0.5 },
      { hex: "#0A0A0C", weight: 0.35 },
      { hex: "#2563EB", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 6,
    visualSvg: UI_SPACEMAN_MAC,
  },
  {
    id: "demo-serif-chapter",
    title: "18H:24M Chapter One — Editorial Serif Foundry",
    summary: "Editorial typography showcase pairing condensed grotesk timecodes with high-contrast italic serifs.",
    url: "https://klim.co.nz/specimens/chapter-one",
    type: "design",
    tags: ["serif", "typography", "foundry", "editorial", "specimen"],
    spaces: ["space-design"],
    dominantColor: "#FAFAFA",
    palette: [
      { hex: "#FAFAFA", weight: 0.8 },
      { hex: "#18181B", weight: 0.2 },
    ],
    aspectRatio: 0.78,
    daysAgo: 6,
    visualSvg: POSTER_SERIF_CHAPTER,
  },
  {
    id: "demo-orange-rams",
    title: "Dieter Rams — Ten Principles of Good Design",
    summary: "Visual monograph on Braun industrial design heritage, functional minimalism, and timeless product craft.",
    url: "https://vitsoe.com/gb/about/good-design",
    type: "design",
    tags: ["industrial-design", "minimal", "product", "poster", "orange"],
    spaces: ["space-design"],
    dominantColor: "#F24E1E",
    palette: [
      { hex: "#F24E1E", weight: 0.64 },
      { hex: "#141414", weight: 0.36 },
    ],
    aspectRatio: 0.84,
    daysAgo: 7,
    visualSvg: POSTER_ORANGE_SUN,
  },
  {
    id: "demo-tdbrain",
    title: "TDBRAIN — Clinical EEG Open Dataset",
    summary: "Open-access clinical EEG repository on GitHub with preprocessing pipelines and biomarker benchmarks.",
    url: "https://github.com/brainclinics/TDBRAIN",
    type: "repo",
    tags: ["github", "eeg", "neuroscience", "dataset", "research"],
    spaces: ["space-reading"],
    dominantColor: "#10B981",
    palette: [
      { hex: "#FFFFFF", weight: 0.85 },
      { hex: "#10B981", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 8,
  },
  {
    id: "demo-brainclinics-viewer",
    title: "Brainclinics EDF/BDF Viewer",
    summary: "Zero-install browser tool to inspect multi-channel EDF and BDF biosignal recordings directly offline.",
    url: "https://brainclinics.com/edf-bdf-viewer",
    type: "tool",
    tags: ["eeg", "edf", "neuroscience", "viewer", "science"],
    spaces: ["space-reading", "space-tools"],
    dominantColor: "#2563EB",
    palette: [
      { hex: "#E8EEF5", weight: 0.62 },
      { hex: "#2563EB", weight: 0.24 },
      { hex: "#FFFFFF", weight: 0.14 },
    ],
    aspectRatio: 1.64,
    daysAgo: 8,
    visualSvg: UI_EEG_VIEWER,
  },
  {
    id: "demo-datasette",
    title: "Datasette — Instant SQLite Explorer & API",
    summary: "Open-source tool for exploring and publishing SQLite databases with full-text search and JSON endpoints.",
    url: "https://datasette.io",
    type: "repo",
    tags: ["sqlite", "database", "open-source", "python", "data"],
    spaces: ["space-tools"],
    dominantColor: "#0EA5E9",
    palette: [
      { hex: "#FFFFFF", weight: 0.8 },
      { hex: "#0EA5E9", weight: 0.2 },
    ],
    aspectRatio: 1.25,
    daysAgo: 9,
  },
  {
    id: "demo-electrobun",
    title: "Electrobun v2 — Ultra-Fast Native Desktop Apps with Bun",
    summary: "Build tiny, fast cross-platform desktop apps using TypeScript, Bun, and native macOS WKWebView.",
    url: "https://electrobun.dev",
    type: "repo",
    tags: ["electrobun", "bun", "macos", "desktop", "typescript"],
    spaces: ["space-tools"],
    notes: ["Electron 대신 가벼운 macOS 네이티브 데스크톱 앱 프레임워크"],
    dominantColor: "#F59E0B",
    palette: [
      { hex: "#FFFFFF", weight: 0.8 },
      { hex: "#F59E0B", weight: 0.2 },
    ],
    aspectRatio: 1.15,
    daysAgo: 2,
  },
  {
    id: "demo-ontype-monolith",
    title: "ONTYPE — Swiss Specimen & Spatial Form",
    summary: "Monochromatic typographic poster studying subtle grey tonal layering and architectural curves.",
    url: "https://refto.one/posters/ontype-specimen",
    type: "design",
    tags: ["poster", "typography", "monochrome", "swiss-design", "visual-reference"],
    spaces: ["space-design"],
    dominantColor: "#7D8082",
    palette: [
      { hex: "#D5D7D8", weight: 0.55 },
      { hex: "#7D8082", weight: 0.35 },
      { hex: "#18181B", weight: 0.1 },
    ],
    aspectRatio: 0.81,
    daysAgo: 10,
    visualSvg: POSTER_MONOLITH_GREY,
  },
  {
    id: "demo-talk-gradient",
    title: "Talk to Yourself Like Art — Gradient Poster",
    summary: "Pastel atmospheric blue-to-rose poster combining soft diffusion gradients with oversized geometric type.",
    url: "https://are.na/visual-notes/talk-like-art",
    type: "design",
    tags: ["poster", "gradient", "color", "typography", "art"],
    spaces: ["space-design"],
    dominantColor: "#89B4FA",
    palette: [
      { hex: "#89B4FA", weight: 0.45 },
      { hex: "#C8B6FF", weight: 0.3 },
      { hex: "#F8C8DC", weight: 0.25 },
    ],
    aspectRatio: 0.91,
    daysAgo: 11,
    visualSvg: POSTER_TALK_GRADIENT,
  },
  {
    id: "demo-linear-dark",
    title: "Linear — Dark Interface Craft & Sync Engine",
    summary: "Reference study of dark-mode micro-contrast, keyboard-first command palettes, and local-first architecture.",
    url: "https://linear.app/method",
    type: "tool",
    tags: ["dark-interface", "ui", "productivity", "saas", "local-first"],
    spaces: ["space-design", "space-tools"],
    dominantColor: "#121216",
    palette: [
      { hex: "#09090B", weight: 0.65 },
      { hex: "#6366F1", weight: 0.2 },
      { hex: "#10B981", weight: 0.15 },
    ],
    aspectRatio: 1.47,
    daysAgo: 5,
    visualSvg: POSTER_DARK_INTERFACE,
  },
  {
    id: "demo-infantconnect",
    title: "infantconnect",
    summary: "Open-source neuroimaging connectivity toolkit on GitHub for developmental brain network analysis.",
    url: "https://github.com/neuro-lab/infantconnect",
    type: "repo",
    tags: ["github", "neuroscience", "research", "python"],
    spaces: ["space-reading"],
    dominantColor: "#10B981",
    palette: [
      { hex: "#FFFFFF", weight: 0.85 },
      { hex: "#10B981", weight: 0.15 },
    ],
    aspectRatio: 1.0,
    daysAgo: 12,
  },
  {
    id: "demo-refto",
    title: "Refto — Visual Design Reference Organizer for macOS",
    summary: "Fast local-first desktop moodboard and design reference manager with smart folders and visual density controls.",
    url: "https://refto.one",
    type: "tool",
    tags: ["macos", "moodboard", "visual-reference", "design", "bookmark"],
    spaces: ["space-design", "space-tools"],
    notes: ["사이드바와 매이슨리 밀도 조절 슬라이더 UI 영감"],
    dominantColor: "#E05A47",
    palette: [
      { hex: "#F7F7F8", weight: 0.72 },
      { hex: "#E05A47", weight: 0.28 },
    ],
    aspectRatio: 1.2,
    daysAgo: 1,
  },
  {
    id: "demo-raycast",
    title: "Raycast — Extensible macOS Launcher",
    summary: "Blazingly fast command launcher for macOS with custom extensions, clipboard history, and AI quick actions.",
    url: "https://raycast.com",
    type: "tool",
    tags: ["macos", "productivity", "launcher", "workflow"],
    spaces: ["space-tools"],
    dominantColor: "#FF6363",
    palette: [
      { hex: "#FFFFFF", weight: 0.75 },
      { hex: "#FF6363", weight: 0.25 },
    ],
    aspectRatio: 1.15,
    daysAgo: 14,
  },
  {
    id: "demo-untagged-site",
    title: "Minimal Gallery — Curated Web Architecture",
    summary: "Daily curated showcase of clean, functional websites focusing on typography and whitespace.",
    url: "https://minimal.gallery",
    type: "website",
    tags: [],
    spaces: [],
    dominantColor: "#E5E7EB",
    palette: [
      { hex: "#F8FAFC", weight: 0.8 },
      { hex: "#111827", weight: 0.2 },
    ],
    aspectRatio: 1.3,
    daysAgo: 3,
  },
];
