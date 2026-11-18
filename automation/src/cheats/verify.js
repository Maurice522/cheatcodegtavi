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

// --- Page text ---------------------------------------------------------------
// Block elements become line breaks so a heading ("Invincibility cheat in
// GTA 6") never fuses with the code line under it into one "sentence".
export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|li|h[1-6]|td|th|tr|div|section|article|header|footer|blockquote|dt|dd|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/ *\n[\n ]*/g, "\n")
    .trim();
}

export const splitSentences = (text) =>
  text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

// A page that says, anywhere, that its codes are unconfirmed or untested is
// a "might work" roundup. Nothing on it counts.
const PAGE_DISCLAIMER = /\b(not (yet )?(been )?confirmed|unconfirmed|unverified|yet to be (confirmed|tested)|have(n'?t| not) (yet )?(been )?tested|has(n'?t| not) (yet )?(been )?tested|may not work|might not work|we('| wi)ll (be )?test(ing)?|will update (this|the) (guide|list|page|article) (once|when)|cheats? (that )?(could|might|may) (return|work)|do gta (5|v) cheats work)\b/i;

export const pageDisclaims = (text) => PAGE_DISCLAIMER.test(text.toLowerCase().replace(/[’]/g, "'"));

// --- Does the article actually say it works in GTA 6? -----------------------
// "Do GTA 5 cheats work in GTA 6?" round-ups contain every GTA V code
// literally, so a text match alone proves nothing. The quoted evidence must be
// in the page verbatim, near the code, mention GTA 6, and read as a plain
// positive statement (not a question, no hedging).
const HEDGES = /\b(not|no|never|doesn'?t|don'?t|isn'?t|aren'?t|won'?t|can'?t|cannot|unconfirmed|unverified|may|might|could|would|should|expected|expect|likely|possibly|probably|rumou?red|rumou?r|predicted|prediction|speculat\w*|leak(ed)?|fake|hoax|hopefully|if|whether)\b/i;
const OTHER_GAME = /\b(gta\s?(5|v|iv|4|san andreas|vice city stories)|grand theft auto (5|v|iv)|gta online)\b/i;
// A GTA 5 mention is fine only alongside a plain statement that it carries over.
const CARRIES_OVER = /\b(still works?|still active|carr(y|ies) over|carried over|confirmed (working|to work)|(works?|working) in (gta\s?(6|vi)|grand theft auto (6|vi)))\b/i;
const QUESTION_START = /^(do|does|did|will|can|could|are|is|would|should|which|what|how)\b/i;
const GTA6_RE = /\b(gta\s?(6|vi)|grand theft auto (6|vi))\b/i;

const squash = (s) => s.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
export const MAX_EVIDENCE_GAP = 500;

function codeIndex(code, flat) {
  if (code.ps5?.length) {
    const alt = { x: "(?:x|cross|✕|×)", circle: "(?:circle|○)", triangle: "(?:triangle|△)", square: "(?:square|□)" };
    const parts = code.ps5.map((b) => alt[b.toLowerCase()] ?? b.toLowerCase());
    const m = new RegExp(`\\b${parts.join("[^a-z0-9]{1,8}")}\\b`).exec(flat);
    return m ? m.index : -1;
  }
  if (code.phone) {
    const re = /\d[\d\s().\-]{5,24}\d/g;
    for (let m; (m = re.exec(flat)); ) if (m[0].replace(/\D/g, "") === code.phone) return m.index;
  }
  return -1;
}

export function evidenceOk(evidence, text, code = null) {
  if (typeof evidence !== "string") return false;
  const ev = squash(evidence).replace(/[.!:]$/, "");
  if (ev.length < 20 || ev.length > 400) return false;
  const flat = squash(text);
  const at = flat.indexOf(ev);
  if (at < 0) return false;
  if (ev.endsWith("?") || flat[at + ev.length] === "?" || QUESTION_START.test(ev)) return false;
  if (!GTA6_RE.test(ev) || HEDGES.test(ev)) return false;
  if (OTHER_GAME.test(ev) && !CARRIES_OVER.test(ev)) return false;
  if (code) {
    const ci = codeIndex(code, flat);
    if (ci < 0) return false;
    const gap = ci < at ? at - ci : ci - (at + ev.length);
    if (gap > MAX_EVIDENCE_GAP) return false;
  }
  return true;
}

// --- Rule-based extraction (used when Gemini is unavailable) ---------------
const BTN = "(?:Up|Down|Left|Right|Triangle|Circle|Square|Cross|X|L1|L2|R1|R2)";
const SEQ_RE = new RegExp(String.raw`\b${BTN}(?:\s*[,>\-–]\s*${BTN}){3,}\b`, "g");
const PHONE_RE = /\b1[-\s]?999[-\s\d]{4,16}\d\b/g;
const NAME_STOP = new Set(["The", "A", "An", "In", "On", "To", "For", "And", "Or", "Press", "Enter", "Dial", "You", "We", "It", "This", "That"]);

export function extractRegex(text) {
  const out = [];
  for (const sentence of splitSentences(text)) {
    if (sentence.endsWith("?")) continue;
    const seqs = sentence.match(SEQ_RE) ?? [];
    const phones = sentence.match(PHONE_RE) ?? [];
    if (!seqs.length && !phones.length) continue;
    const words = sentence.match(/^(?:(?:The|A|An)\s+)?((?:[A-Z][\w'’-]+\s+){0,3}[A-Z][\w'’-]+)\s*(?:cheat|works|is|code|:)/);
    const name = words?.[1]?.split(/\s+/).filter((w) => !NAME_STOP.has(w)).join(" ");
    if (!name || /\b(GTA|Grand)\b/.test(name)) continue;
    out.push({
      name,
      effect: "",
      ps5: seqs[0] ? seqs[0].split(/\s*[,>\-–]\s*/) : [],
      phone: phones[0] ?? "",
      evidence: sentence.replace(/[.!?]$/, ""),
    });
  }
  return out;
}
