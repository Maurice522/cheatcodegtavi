// node --test automation/src/cheats/verify.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { codeAppearsIn, decide, normalizeButtons, normalizePhone, outletOf } from "./verify.js";

const after = "2026-11-18T12:00:00Z";
const before = "2026-11-10T12:00:00Z";
const now = Date.parse("2026-11-19T00:00:00Z");

test("normalises inputs", () => {
  assert.deepEqual(normalizeButtons(["triangle", "R1", "cross", "LEFT"]), ["Triangle", "R1", "X", "Left"]);
  assert.equal(normalizeButtons(["Triangle", "Banana", "X", "Left"]), null);
  assert.equal(normalizeButtons(["X", "X"]), null);
  assert.equal(normalizePhone("1-999-5299-3787"), "199952993787");
  assert.equal(normalizePhone("123"), null);
});

test("code must appear literally in the page", () => {
  const text = "To get invincibility in GTA 6 press Right, X, Right, Left, Right, R1 or dial 1-999-724-654-5537.";
  assert.ok(codeAppearsIn({ ps5: ["Right", "X", "Right", "Left", "Right", "R1"] }, text));
  assert.ok(codeAppearsIn({ phone: "19997246545537" }, text));
  assert.ok(!codeAppearsIn({ ps5: ["Right", "X", "Right", "Left", "Right", "R2"] }, text));
  assert.ok(!codeAppearsIn({ phone: "19990000000" }, text));
});

test("subdomains count as one outlet; SEO sites don't count", () => {
  assert.equal(outletOf("https://uk.ign.com/a"), "ign.com");
  assert.equal(outletOf("https://gta6cheatcodes.com/x"), null);
});

test("one trusted outlet is not enough", () => {
  const r = decide([{ url: "https://www.ign.com/a", publishedAt: after, textMatched: true }], now);
  assert.equal(r.pass, false);
});

test("same outlet twice is not enough", () => {
  const r = decide([
    { url: "https://www.ign.com/a", publishedAt: after, textMatched: true },
    { url: "https://uk.ign.com/b", publishedAt: after, textMatched: true },
  ], now);
  assert.equal(r.pass, false);
});

test("untrusted sites never count", () => {
  const r = decide([
    { url: "https://gta6cheatcodes.com/a", publishedAt: after, textMatched: true },
    { url: "https://allgta6cheats.com/b", publishedAt: after, textMatched: true },
    { url: "https://www.reddit.com/r/GTA6/c", publishedAt: after, textMatched: true },
  ], now);
  assert.equal(r.pass, false);
});

test("articles from before launch don't count", () => {
  const r = decide([
    { url: "https://www.ign.com/a", publishedAt: before, textMatched: true },
    { url: "https://www.gamespot.com/b", publishedAt: before, textMatched: true },
  ], now);
  assert.equal(r.pass, false);
});

test("code missing from page text doesn't count", () => {
  const r = decide([
    { url: "https://www.ign.com/a", publishedAt: after, textMatched: true },
    { url: "https://www.gamespot.com/b", publishedAt: after, textMatched: false },
  ], now);
  assert.equal(r.pass, false);
});

test("two independent trusted outlets after launch pass", () => {
  const r = decide([
    { url: "https://www.ign.com/a", publishedAt: after, textMatched: true },
    { url: "https://www.gamespot.com/b", publishedAt: after, textMatched: true },
  ], now);
  assert.equal(r.pass, true);
  assert.equal(r.qualifying.length, 2);
});

test("an official Rockstar page passes alone", () => {
  const r = decide([{ url: "https://www.rockstargames.com/newswire/article/x", publishedAt: before, textMatched: true }], now);
  assert.equal(r.pass, true);
});

import { evidenceOk } from "./verify.js";
test("evidence must be a verbatim, unhedged GTA 6 statement", () => {
  const page = "We tested it: the invincibility cheat works in GTA 6 on PS5. GTA 5's invincibility code may also work in GTA 6, but it's unconfirmed.";
  assert.ok(evidenceOk("the invincibility cheat works in GTA 6 on PS5", page));
  assert.ok(!evidenceOk("the invincibility cheat definitely works in GTA 6", page), "not verbatim");
  assert.ok(!evidenceOk("GTA 5's invincibility code may also work in GTA 6, but it's unconfirmed", page), "hedged / other game");
  assert.ok(!evidenceOk("works on PS5", "works on PS5"), "too short / no GTA 6");
});

import { extractRegex, htmlToText, pageDisclaims } from "./verify.js";

const accepted = (html) => {
  const text = htmlToText(html);
  if (pageDisclaims(text)) return [];
  return extractRegex(text).filter((p) => {
    const code = { ps5: normalizeButtons(p.ps5), phone: normalizePhone(p.phone) };
    return codeAppearsIn(code, text) && evidenceOk(p.evidence, text, code);
  });
};

test("a heading never fuses with the code line under it", () => {
  const html = "<h2>Invincibility cheat in GTA 6</h2><p>Right, X, Right, Left, Right, R1</p><h2>Super Jump cheat in GTA 6</h2><p>Left, Left, Triangle, Triangle, Right, Right</p>";
  assert.equal(accepted(html).length, 0);
});

test("'might work' roundups are rejected wholesale", () => {
  const html = "<p>These GTA 5 cheats might work in GTA 6.</p><p>The Invincibility cheat works in GTA 6 with Right, X, Right, Left, Right, R1.</p>";
  assert.equal(accepted(html).length, 0);
});

test("questions never count as evidence", () => {
  const page = "Do GTA 5 cheats work in GTA 6? Invincibility is Right, X, Right, Left, Right, R1.";
  assert.ok(!evidenceOk("Do GTA 5 cheats work in GTA 6", page));
});

test("a GTA 5 code that plainly carries over counts", () => {
  const page = "Good news: the GTA 5 invincibility cheat still works in GTA 6. Enter Right, X, Right, Left, Right, R1 on PS5.";
  assert.ok(evidenceOk("the GTA 5 invincibility cheat still works in GTA 6", page, { ps5: ["Right", "X", "Right", "Left", "Right", "R1"] }));
  assert.ok(!evidenceOk("the GTA 5 invincibility cheat is in GTA 6", "the GTA 5 invincibility cheat is in GTA 6 Right, X"));
});

test("evidence far from the code doesn't count", () => {
  const filler = " Lorem ipsum dolor sit amet.".repeat(40);
  const page = `All GTA 6 cheat codes for PS5 are listed below.${filler} Invincibility: Right, X, Right, Left, Right, R1.`;
  assert.ok(!evidenceOk("All GTA 6 cheat codes for PS5 are listed below", page, { ps5: ["Right", "X", "Right", "Left", "Right", "R1"] }));
});

test("a plain positive sentence with the code is accepted", () => {
  const html = "<p>The Explosive Punch cheat works in GTA 6: on PS5 press Left, Left, Square, Circle, R2, L2, Up, Up.</p>";
  assert.equal(accepted(html).length, 1);
});
