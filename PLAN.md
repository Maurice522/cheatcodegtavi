# CheatCodeGTAVI.com — Build Plan

## 0. One-paragraph summary

A GTA6 cheat-codes website (domain already owned: `cheatcodegtavi.com`) with a dark
Vice-City neon-noir visual identity, heavy animation/interaction polish, and a fully
automated content pipeline: a scheduled job searches the web for GTA6 cheat codes and
leaks, cross-references multiple sources, rewrites the content with Gemini 2.5 Flash,
dedupes against what's already published, and writes to MongoDB Atlas — which triggers
a rebuild of the static Astro frontend. Hard constraint: **$0 ongoing cost**, so every
service choice must fit inside a free tier. GTA6 itself hasn't launched yet (Rockstar-
confirmed for **November 19, 2026**, PS5/Xbox only, no PC date) — the site goes live
*before* that, with a countdown + "coming soon" states, and flips to real cheat data at
launch.

## 1. Key decisions (locked 2026-09-19)

- **Launch phasing:** ship now, don't wait for the game. Homepage gets a stylized
  countdown to Nov 19, 2026. Individual cheat-code pages show a "coming soon" state
  until the pipeline finds real data. **GTA V cheats are used as placeholder/test data
  during development only** — never published as real GTA6 content.
- **Content sourcing:** "aggregate & rewrite." Pipeline pulls facts from competitor
  cheat sites, Reddit, GTA news/forums, and Rockstar Newswire; cross-references 2+
  sources; Gemini 2.5 Flash rewrites fully in original wording. Every cheat gets a
  `confidence` field — `verified` (2+ sources or official) vs `rumored` (1 source) —
  which doubles as the Cheats-vs-Leaks distinction in the UI.
- **Images:** avoid copying competitor screenshots directly (legal risk + inconsistent
  look). Primary approach: generate an original branded controller-input diagram per
  cheat. Secondary: embed YouTube demo videos rather than downloading frames. Tertiary
  (post-launch): the site's own gameplay footage.
- **Figma:** skipped for now (Starter-plan MCP rate limits made it slow going — see
  below). Building directly in code instead; UI changes come from user feedback on the
  running site rather than a design-first Figma pass.
- **Design system**, before the Figma detour, was locked as: dark near-black base,
  neon accents pulled from the GTA6 trailer palette (hot pink/magenta, cyan, purple,
  gold), Anton for display type, Manrope for headings/labels, Inter for body/UI text,
  glassy elevated cards, colored glow effects instead of generic drop shadows. This is
  now implemented directly as Tailwind v4 tokens in `site/src/styles/global.css`
  (see §7) rather than as Figma variables.

### Aside: the Figma attempt

A design-system Figma file was created (team "test", file
`CheatCodeGTAVI — Design System`, https://www.figma.com/design/8pGmqa6jyZ1V34EBjswWHL)
and got through full color/spacing/radius/typography/effect-style token creation plus a
Colors and Typography foundations page before hitting Figma's Starter-plan MCP rate
limit (200 calls/day for a Full seat) and the Starter 3-pages-per-file cap (worked
around with Sections). Since the daily cap doesn't reset fast and Professional doesn't
raise it (only Organization at $55/mo does, via 600/day), we decided it wasn't worth
paying for and switched to building directly in code. The Figma file is still there and
can be resumed later if a design-first pass is ever wanted again — see the state ledger
at the (session-local) scratchpad `gta6-design-system-state.json` for exact node/
variable IDs if resuming.

## 2. Architecture overview

```
[Scheduled scraper: GitHub Actions cron]
   -> search competitor sites / Reddit / GTA news / Rockstar Newswire
   -> Gemini 2.5 Flash: extract structured facts (JSON)
   -> dedup check against MongoDB Atlas
   -> Gemini 2.5 Flash: rewrite in original wording
   -> image step (generate controller-diagram, or embed video)
   -> upsert into MongoDB Atlas (M0 free)
   -> if content actually changed -> hit Cloudflare deploy hook / re-run wrangler deploy
        -> rebuild Astro site -> publish

[Cloudflare Workers, always-on]
   -> /track endpoint: logs page views (KV counters, flushed to Mongo hourly)
   -> receives/forwards the deploy webhook

[Astro frontend, static output] -> Cloudflare (Workers static assets, via wrangler) -> cheatcodegtavi.com
```

This mirrors the working pattern already proven in the sibling `digital-drama-blog`
project (RSS -> GitHub Actions -> filter -> Gemini rewrite -> MongoDB Atlas -> Astro
static build -> `wrangler deploy`), swapping RSS-feed ingestion for the multi-source
cheat-code scraper described below.

## 3. Repo / folder layout

```
cheatcodegtavi.com/
  PLAN.md              <- this file
  site/                <- Astro frontend, static output, deployed via wrangler
  automation/          <- Node.js pipeline: scrape -> extract -> dedup -> rewrite -> Mongo
  .github/workflows/   <- cron workflow(s) that run automation then redeploy site
```

## 4. Stack, mapped to the $0-cost requirement

| Piece | Service | Free-tier ceiling |
|---|---|---|
| Frontend hosting | Cloudflare (Workers static assets via `wrangler deploy`) | generous free tier, unlimited bandwidth |
| Pipeline compute | GitHub Actions (cron) | Unlimited (public repo) / 2,000 min/mo (private) |
| Always-on API | Cloudflare Workers | 100k req/day, cron triggers capped at ~10ms CPU (too little for the pipeline itself — that's why the pipeline runs on GH Actions, not Workers cron) |
| Database | MongoDB Atlas M0 | 512MB storage, 500 connections, no backups |
| Image storage | Cloudflare R2 | 10GB storage, free egress |
| AI (extract/rewrite/embed) | Gemini 2.5 Flash | ~10-15 RPM, up to ~1,500 req/day (verify live in AI Studio — published numbers drift) |
| DNS | Cloudflare | free |

Netlify was considered but is likely redundant given Cloudflare covers hosting, compute,
and storage — only add it back if a separate staging/preview environment is wanted.

## 5. MongoDB schema (draft)

```jsonc
// collection: cheats
{
  slug: "infinite-ammo",              // canonical, human-readable
  title: "Infinite Ammo",
  category: "weapons",                 // weapons | vehicles | wanted | weather | gameplay | ...
  tags: ["combat", "weapons", "survival"],
  platforms: {
    ps5: {
      inputType: "controller" | "phone-in",
      input: "L1, R1, Triangle, ...",  // or phone number string
      effect: "Grants infinite ammunition for all weapons.",
      confidence: "verified" | "rumored",
      sources: [{ url, title, fetchedAt }],
    },
    xbox: { /* same shape, or null if not yet found */ },
    pc: null,                          // literal null until Rockstar ships PC
  },
  images: {
    controllerDiagram: "r2://cheats/infinite-ammo/controller.svg", // generated, always present
    videoEmbedUrl: "https://youtube.com/embed/...",                // optional
  },
  viewCount: 0,                        // updated by the hourly KV-flush job
  updatedAt: ISODate,
  createdAt: ISODate,
}

// collection: leaks
{
  slug: "leonida-map-size-leak",
  title: "...",
  summary: "...",                      // rewritten, not copied
  credibility: "rumor" | "confirmed" | "official",
  tags: ["map", "leonida"],
  sourceLinks: [{ url, title }],
  publishedAt: ISODate,
}
```

Dedup key: `{platform + normalized input string}` for cheats with a literal code
(most GTA cheats); falls back to embedding similarity (~0.85 cosine threshold) for
prose-only leaks with no fixed code string.

## 6. Source list for the scraper

- Reddit (r/GTA6, r/GTAVI, r/gtaonline) — public JSON endpoints; confirm current API
  terms before relying on it at scale (Reddit tightened free API access in 2023)
- Rockstar Newswire (official, highest trust)
- Established GTA fan/news sites (GTAForums, GTANet, IGN/GameSpot GTA6 tags)
- YouTube (creator demo videos — also the embed source for §4/images)
- Competitor cheat-code databases, purely as fact-check/cross-reference input, never
  copied verbatim

## 7. Design tokens (implemented directly in `site/src/styles/global.css`)

- **Neutrals (ink scale):** `ink-950` `#05060A` (page bg) down to `ink-50` `#F1F2F8`
- **Neon accents:** pink `#FF2E9E`, cyan `#21E6E6`, purple `#8B3EF5`, gold `#FFC94A`
  (each with a /400 lighter and /600 darker step)
- **Status:** verified = green `#2FE88A`, rumored = amber `#FFB020`, error red `#FF4D4D`
- **Type:** Anton (Display XL/L/M), Manrope ExtraBold/Bold (Heading L/M/S + Label),
  Inter Regular/Medium (Body L/M/S + Caption)
- **Spacing:** `2xs`(2) `xs`(4) `sm`(8) `md`(12) `lg`(16) `xl`(24) `2xl`(32) `3xl`(48)
  `4xl`(64) `5xl`(96)
- **Radius:** `sm`(6) `md`(10) `lg`(16) `xl`(24) `full`(999)
- **Effects:** Elevation/sm, Elevation/md (dark drop shadows), Glow/pink, Glow/cyan
  (colored glow instead of generic shadow — used on buttons, active tabs, cards)

## 8. Page structure

**Homepage:** cinematic hero with animated countdown to Nov 19, 2026 -> trending
cheats -> Leaks & Updates latest feed -> category browse.

**Cheat Code page** (`/cheats/[slug]`): hero -> platform tabs (PS5 default, Xbox,
**PC = permanent "Coming Soon"**) -> generated controller-diagram + literal input ->
effect description + how-to steps -> confidence badge (Verified/Rumored) -> embedded
video if available -> Similar cheats (tag query) -> Previously viewed (localStorage,
no backend round-trip) -> if the server has no data yet for a slug, render the
coming-soon placeholder state.

**Leaks & Updates** (`/leaks`): chronological feed, filterable by credibility/tag.

## 9. View tracking -> "popular cheats"

`navigator.sendBeacon` fires `{slug, timestamp}` to a Workers `/track` endpoint on
page load -> increment in Workers KV -> hourly cron flushes aggregated counts into
MongoDB -> pipeline reads those counts each rebuild to power a "Trending Cheats"
module. "Previously viewed" stays entirely client-side (localStorage) — no server
round-trip, no privacy concern.

## 10. Animation direction

- GSAP for orchestrated transitions/scroll effects.
- The GTA "character-switch"-style page transition: recreate the *effect* (zoom/spin/
  film-grain flash) as an original overlay component rather than using ripped GTA6
  trailer footage — keeps it copyright-clean while still capturing the game's
  identity. Must respect `prefers-reduced-motion`.

## 11. Build phases

- [x] **Phase 0 — Plan.** This document + architecture agreed.
- [~] **Phase 1 — Design system.** Attempted in Figma, blocked by Starter-plan MCP
      rate limits; pivoted to implementing tokens directly in code (§7).
- [ ] **Phase 2 — Astro frontend skeleton.** Scaffolded (`site/`, Astro + Tailwind v4 +
      wrangler), building out layout/pages/components now, populated with **GTA V
      cheats as test data** to validate layout before real GTA6 content exists.
- [ ] **Phase 3 — Content pipeline v1.** `automation/`: scrape -> extract -> dedup ->
      rewrite -> Mongo, run manually first.
- [ ] **Phase 4 — Image pipeline.** Controller-diagram generator + opportunistic real
      media attachment.
- [ ] **Phase 5 — Webhook + scheduling.** GitHub Actions cron wired to redeploy.
- [ ] **Phase 6 — View tracking + trending module.**
- [ ] **Phase 7 — Animation/polish pass**, accessibility, mobile.
- [ ] **Phase 8 — Go live** with countdown + Leaks/Updates + coming-soon cheat pages;
      pipeline auto-flips to real GTA6 data at/after Nov 19, 2026.

## 12. Open items / caveats

- Search step for the scraper needs either a free search API or a curated list of
  target domains/subreddits to crawl directly — decide when building Phase 3.
- Reddit's free API terms should be re-checked before the pipeline leans on it at
  scale.
- Gemini 2.5 Flash free-tier RPM/RPD numbers should be re-verified live in AI Studio
  before assuming headroom, since published numbers vary by source and drift over
  time.
- MongoDB free tier (512MB) should comfortably hold the cheat catalog (expected
  50-150 entries even at full scale); watch storage growth from `leaks` articles as
  they accumulate over time.
