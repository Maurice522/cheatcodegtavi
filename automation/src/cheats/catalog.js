// Full GTA 6 cheat catalog (all ~61 cheats), refreshed by the hourly watcher.
//
// The confirmed list (gta6_cheats, verify.js) only holds codes that pass the
// strict rules. Players also want the full list: every cheat's name, effect and
// unlock requirement, and any code an outlet has reported so far. This script
// reads the big guides' tables, merges them by cheat name, and records which
// outlet reported which code. It never publishes a cheat page; the site shows
// catalog codes with their status ("confirmed", "two outlets", "one outlet",
// "outlets disagree", "no code yet").
//
// Writes `catalog_changed=1` to $GITHUB_OUTPUT when the catalog changed, so the
// workflow rebuilds the site only then.
import "dotenv/config";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import dns from "node:dns";
import { MongoClient } from "mongodb";
import { codeKey, htmlToText, normalizeButtons, outletOf } from "./verify.js";

// Some local resolvers refuse Atlas SRV lookups; same fix as research.js.
dns.setServers(["1.1.1.1", "8.8.8.8", ...dns.getServers()]);

export const CATALOG_SOURCES = [
  "https://www.polygon.com/gta-6-cheat-codes-list-unlock/",
  "https://www.eurogamer.net/all-gta-6-cheats",
  "https://www.rockpapershotgun.com/gta-6-cheats-list",
  "https://www.radiotimes.com/technology/gaming/gta-6-cheats-cheat-codes/",
];

export const CATEGORIES = ["Player", "Combat", "Spawn Vehicle", "Environment", "Screen Filters"];
const CATEGORY_RE = [/\bplayer\b/i, /\bcombat\b/i, /\bspawn|vehicle/i, /\benvironment\b/i, /\bscreen filter|\bfilters?\b/i];

const cell = (h) => htmlToText(h).replace(/\s+/g, " ").trim();
export const nameKey = (name) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");

/** "[ps5: Up + Right + ...]" / "UP, RIGHT, ..." -> ["Up","Right",...], or null for TBA/TBD/Coming Soon. */
export function parseCode(raw) {
  const parts = String(raw ?? "")
    .replace(/\[?\s*ps5\s*:/gi, " ")
    .split(/[\s,>+\-–\[\]]+/)
    .filter(Boolean);
  return normalizeButtons(parts);
}

const blankish = (s) => !s || /^(tb[ad]|coming soon!?|\?+|x|n\/a|-)$/i.test(s.trim());
const clean = (s) => (blankish(s) ? "" : s.trim().replace(/\.$/, "").slice(0, 240));

function categoryBefore(html, index, fallback) {
  const heads = [...html.slice(Math.max(0, index - 6000), index).matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) => cell(m[1]));
  for (let i = heads.length - 1; i >= 0; i--) {
    const c = CATEGORY_RE.findIndex((re) => re.test(heads[i]));
    if (c >= 0) return CATEGORIES[c];
  }
  return fallback;
}

/** Table guides (Polygon, Eurogamer, Rock Paper Shotgun): Cheat | Effect | Unlock | Code, in any column order. */
export function parseTables(html) {
  const out = [];
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)];
  tables.forEach((m, t) => {
    const rows = m[0].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    const header = (rows[0]?.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map(cell).map((c) => c.toLowerCase());
    if (!/cheat/.test(header[0] ?? "")) return;
    const col = (re) => header.findIndex((h) => re.test(h));
    const effectCol = col(/effect|purpose|what it does/);
    const unlockCol = col(/unlock|challenge|requirement/);
    const codeCol = col(/code|control|input|button/);
    const category = categoryBefore(html, m.index, CATEGORIES[t] ?? "Other");
    for (const row of rows.slice(1)) {
      const cells = (row.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? []).map(cell);
      const name = cells[0];
      if (!name || name.length > 60) continue;
      out.push({
        name,
        category,
        effect: effectCol > 0 ? clean(cells[effectCol]) : "",
        unlock: unlockCol > 0 ? clean(cells[unlockCol]) : "",
        ps5: codeCol > 0 ? parseCode(cells[codeCol]) : null,
      });
    }
  });
  return out;
}

/** Radio Times style: "Name: CODE To unlock: requirement." one per line, under category headings. */
export function parseLines(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const out = [];
  let category = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const c = CATEGORIES.findIndex((name) => l.toLowerCase() === name.toLowerCase() || l.toLowerCase() === `${name.toLowerCase()} cheats`);
    if (c >= 0) { category = CATEGORIES[c]; continue; }
    if (!category) continue;
    const m = /^(.*?)\s*to unlock:\s*(.*)$/i.exec(l);
    if (!m) continue;
    let head = m[1];
    if (!head) head = lines[i - 1] ?? "";
    const hm = /^([^:]{2,60}):\s*(.*)$/.exec(head);
    if (!hm) continue;
    out.push({ name: hm[1].trim(), category, effect: "", unlock: clean(m[2]), ps5: parseCode(hm[2]) });
  }
  return out;
}

/**
 * Merge per-outlet rows into one entry per cheat.
 * @param {{outlet: string, url: string, rows: object[]}[]} perSource in preference order
 * @param {Map<string, {slug: string, name: string}>} confirmed codeKey -> published cheat; a code only
 *   confirms an entry with the same cheat name, so a code copied under the wrong name can't.
 */
export function mergeCatalog(perSource, confirmed = new Map()) {
  const byName = new Map();
  let order = 0;
  for (const { outlet, url, rows } of perSource) {
    for (const r of rows) {
      let k = nameKey(r.name);
      if (!k) continue;
      // Outlets misspell names ("Hauners"/"Haunters", "Stanier"/"Stainer"):
      // treat a near-identical long name as the same cheat.
      if (!byName.has(k) && k.length >= 8) k = [...byName.keys()].find((o) => o.length >= 8 && editDistance(o, k) <= 2) ?? k;
      let e = byName.get(k);
      if (!e) {
        e = { key: k, name: r.name, category: r.category, order: order++, effect: "", unlock: "", codes: [], sources: [], names: {} };
        byName.set(k, e);
      }
      e.names[r.name] = (e.names[r.name] ?? 0) + 1;
      if (!e.effect && r.effect) e.effect = r.effect;
      if (!e.unlock && r.unlock) e.unlock = r.unlock;
      if (!e.sources.some((s) => s.outlet === outlet)) e.sources.push({ outlet, url });
      if (r.ps5) {
        const ck = codeKey({ ps5: r.ps5 });
        let code = e.codes.find((c) => c.key === ck);
        if (!code) e.codes.push((code = { key: ck, ps5: r.ps5, outlets: [] }));
        if (!code.outlets.includes(outlet)) code.outlets.push(outlet);
      }
    }
  }
  for (const e of byName.values()) {
    // Display the spelling most outlets use; ties keep the first source's.
    e.name = Object.entries(e.names).sort((a, b) => b[1] - a[1])[0][0];
    delete e.names;
    e.codes.sort((a, b) => b.outlets.length - a.outlets.length);
    const hit = e.codes.find((c) => confirmed.has(c.key) && nameKey(confirmed.get(c.key).name) === e.key);
    if (hit) {
      e.status = "confirmed";
      e.confirmedSlug = confirmed.get(hit.key).slug;
      e.codes = [hit, ...e.codes.filter((c) => c !== hit)];
    } else if (!e.codes.length) e.status = "no-code";
    else if (e.codes.length > 1) e.status = "conflict";
    else e.status = e.codes[0].outlets.length >= 2 ? "two-outlets" : "one-outlet";
  }
  return [...byName.values()].sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.order - b.order);
}

export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36", accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  const perSource = [];
  for (const url of CATALOG_SOURCES) {
    try {
      const html = await fetchHtml(url);
      let rows = parseTables(html);
      if (rows.length < 20) rows = parseLines(htmlToText(html));
      console.log(`${outletOf(url)}: ${rows.length} rows`);
      if (rows.length >= 20) perSource.push({ outlet: outletOf(url), url, rows });
    } catch (err) {
      console.log(`${url}: ${err.message}`);
    }
  }
  const total = new Set(perSource.flatMap((s) => s.rows.map((r) => nameKey(r.name)))).size;
  // Don't overwrite a good catalog with a broken parse (site redesign, 403s).
  if (perSource.length < 2 || total < 40) {
    console.log(`Catalog skipped: ${perSource.length} source(s), ${total} cheats.`);
    return;
  }

  if (process.env.CATALOG_DRY_RUN) {
    const entries = mergeCatalog(perSource);
    console.log(JSON.stringify(entries.map((e) => [e.category, e.name, e.status, e.codes.map((c) => `${c.ps5.join(" ")} <${c.outlets}>`)]), null, 1));
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db("cheatcodegtavi");
    const published = await db.collection("gta6_cheats").find({ published: true }, { projection: { key: 1, slug: 1, title: 1 } }).toArray();
    const entries = mergeCatalog(perSource, new Map(published.map((c) => [c.key, { slug: c.slug, name: c.title }])));
    const hash = createHash("sha256").update(JSON.stringify(entries)).digest("hex");
    const meta = db.collection("cheat_catalog_meta");
    const prev = await meta.findOne({ _id: "catalog" });
    const changed = prev?.hash !== hash;
    if (changed) {
      const coll = db.collection("cheat_catalog");
      const now = new Date().toISOString();
      await coll.deleteMany({});
      await coll.insertMany(entries.map((e) => ({ ...e, updatedAt: now })));
      await meta.updateOne({ _id: "catalog" }, { $set: { hash, updatedAt: now, count: entries.length } }, { upsert: true });
    }
    const counts = entries.reduce((m, e) => ((m[e.status] = (m[e.status] ?? 0) + 1), m), {});
    console.log(`Catalog: ${entries.length} cheats ${JSON.stringify(counts)}${changed ? " (changed)" : " (unchanged)"}`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `catalog_changed=${changed ? 1 : 0}\n`);
  } finally {
    await client.close();
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  main().then(() => process.exit(0), (err) => { console.error(err); process.exit(1); });
}
