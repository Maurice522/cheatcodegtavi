// Deterministic checks that decide whether a GTA 6 cheat is published.
// The LLM only proposes codes it read in an article; nothing it says is
// trusted. A code goes live only when its exact digits or button sequence
// appear in the raw text of an official Rockstar page, or of articles from at
// least two different outlets on the allowlist below, all published after
// GTA 6 unlocked. Fetched pages are data, never instructions.

export const EARLIEST_UNLOCK_MS = Date.UTC(2026, 10, 18, 10, 0, 0);

export const OFFICIAL_DOMAINS = ["rockstargames.com", "support.rockstargames.com"];

// Established outlets with editorial standards. SEO cheat-list sites are
// deliberately absent: they published "GTA 6 cheats" before the game existed.
export const TRUSTED_DOMAINS = [
  "ign.com",
  "gamespot.com",
  "eurogamer.net",
  "polygon.com",
  "pcgamer.com",
  "gamesradar.com",
  "videogameschronicle.com",
  "kotaku.com",
  "vg247.com",
  "rockpapershotgun.com",
  "pcgamesn.com",
  "dexerto.com",
  "gamerant.com",
  "thegamer.com",
  "pushsquare.com",
  "purexbox.com",
  "theverge.com",
  "forbes.com",
];

export const MIN_TRUSTED_SOURCES = 2;

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

// Collapses subdomains (uk.ign.com -> ign.com) so one outlet can't count twice.
export function outletOf(url) {
  const host = domainOf(url);
  const all = [...OFFICIAL_DOMAINS, ...TRUSTED_DOMAINS].sort((a, b) => b.length - a.length);
  return all.find((d) => host === d || host.endsWith(`.${d}`)) ?? null;
}

export const isOfficial = (url) => {
  const o = outletOf(url);
  return o !== null && OFFICIAL_DOMAINS.includes(o);
};
export const isTrusted = (url) => {
  const o = outletOf(url);
  return o !== null && TRUSTED_DOMAINS.includes(o);
};

// --- Code normalisation -----------------------------------------------------

const BUTTON_ALIASES = {
  up: "Up", down: "Down", left: "Left", right: "Right",
  triangle: "Triangle", "△": "Triangle",
  circle: "Circle", o: "Circle", "○": "Circle",
  x: "X", cross: "X", "✕": "X", "×": "X",
  square: "Square", "□": "Square",
  l1: "L1", l2: "L2", r1: "R1", r2: "R2",
};

export function normalizeButtons(list) {
  if (!Array.isArray(list) || list.length < 4) return null;
  const out = [];
  for (const raw of list) {
    const b = BUTTON_ALIASES[String(raw).trim().toLowerCase()];
    if (!b) return null;
    out.push(b);
  }
  return out;
}

export function normalizePhone(raw) {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export function codeKey({ phone, ps5 }) {
  if (ps5?.length) return `ps5:${ps5.join("-")}`;
  if (phone) return `phone:${phone}`;
  return null;
}

// --- Does the code really appear in the page? -------------------------------

export function phoneAppearsIn(digits, text) {
  // Every run of digits with common separators, e.g. "1-999-5299-3787".
  const runs = text.match(/\d[\d\s().\-]{5,24}\d/g) ?? [];
  return runs.some((r) => r.replace(/\D/g, "") === digits);
}

export function buttonsAppearIn(seq, text) {
  const tokens = (text.match(/[A-Za-z]+\d?|[△○✕×□]/g) ?? [])
    .map((t) => BUTTON_ALIASES[t.toLowerCase()])
    .filter(Boolean);
  // Contiguous match, but allow tokens between codes from other cheats.
  for (let i = 0; i + seq.length <= tokens.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) {
      if (tokens[i + j] !== seq[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

export function codeAppearsIn(code, text) {
  if (code.ps5?.length && !buttonsAppearIn(code.ps5, text)) return false;
  if (code.phone && !phoneAppearsIn(code.phone, text)) return false;
  return Boolean(code.ps5?.length || code.phone);
}

// --- The publish decision ---------------------------------------------------

/**
 * sources: [{ url, publishedAt, textMatched }]
 * Returns { pass, qualifying, reason }.
 */
export function decide(sources, now = Date.now()) {
  const qualifying = sources.filter((s) => {
    if (!s.textMatched) return false;
    const t = Date.parse(s.publishedAt);
    if (Number.isNaN(t) || t > now + 60 * 60 * 1000) return false;
    if (isOfficial(s.url)) return true;
    return isTrusted(s.url) && t >= EARLIEST_UNLOCK_MS;
  });

  const official = qualifying.filter((s) => isOfficial(s.url));
  if (official.length > 0) return { pass: true, qualifying: official, reason: "official Rockstar source" };

  const byOutlet = new Map();
  for (const s of qualifying) if (!byOutlet.has(outletOf(s.url))) byOutlet.set(outletOf(s.url), s);
  if (byOutlet.size >= MIN_TRUSTED_SOURCES) {
    return { pass: true, qualifying: [...byOutlet.values()], reason: `${byOutlet.size} independent outlets` };
  }
  return { pass: false, qualifying: [...byOutlet.values()], reason: `${byOutlet.size} of ${MIN_TRUSTED_SOURCES} outlets needed` };
}
