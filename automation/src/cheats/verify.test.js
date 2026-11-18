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
