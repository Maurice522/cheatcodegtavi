import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCode, parseTables, parseLines, mergeCatalog, nameKey } from "./catalog.js";

test("parseCode reads guide formats and ignores placeholders", () => {
  assert.deepEqual(parseCode("[ps5: Up + Right + Down + Left]"), ["Up", "Right", "Down", "Left"]);
  assert.deepEqual(parseCode("UP, RIGHT, DOWN, LEFT, UP"), ["Up", "Right", "Down", "Left", "Up"]);
  for (const blank of ["TBA", "TBD", "Coming Soon!", "???", ""]) assert.equal(parseCode(blank), null);
});

test("parseTables maps columns by header, not position", () => {
  const html = `<h2>Combat cheats</h2><table><tr><th>Cheat</th><th>Code</th><th>Challenge</th></tr>
    <tr><td>Max Ammo</td><td>Down, Up, Right, Down</td><td>Win 25 bronze medals.</td></tr>
    <tr><td>No Reload</td><td>Coming Soon!</td><td>Win 25 gold medals.</td></tr></table>`;
  const rows = parseTables(html);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { name: "Max Ammo", category: "Combat", effect: "", unlock: "Win 25 bronze medals", ps5: ["Down", "Up", "Right", "Down"] });
  assert.equal(rows[1].ps5, null);
});

test("parseLines reads Radio Times style lists, including split lines", () => {
  const rows = parseLines("Player\n$250,000: UP, RIGHT, DOWN, LEFT To unlock: Make $250,000 from fenced goods.\nDrunk:\nTo unlock: Spend $2,500 on alcohol.\nCombat\nNo Reload: To unlock: X");
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0].ps5, ["Up", "Right", "Down", "Left"]);
  assert.equal(rows[1].name, "Drunk");
  assert.equal(rows[1].unlock, "Spend $2,500 on alcohol");
  assert.equal(rows[2].category, "Combat");
  assert.equal(rows[2].unlock, "");
});

test("mergeCatalog counts outlets per code and sets status", () => {
  const A = ["Down", "Up", "Left", "Right"], B = ["Up", "Up", "Down", "Down"], C = ["Left", "Up", "Left", "Up"], D = ["Right", "Down", "Right", "Down"], E = ["Up", "Left", "Down", "Right"];
  const row = (name, ps5) => ({ name, category: "Player", effect: "", unlock: "", ps5 });
  const merged = mergeCatalog(
    [
      { outlet: "polygon.com", url: "p", rows: [row("Agreed", A), row("Single", C), row("Split", D), row("None", null), row("Live", B)] },
      { outlet: "eurogamer.net", url: "e", rows: [row("agreed", A), row("Split", E), row("Live", B)] },
    ],
    new Map([["ps5:Up-Up-Down-Down", { slug: "live", name: "Live" }]]),
  );
  const s = Object.fromEntries(merged.map((e) => [e.key, e.status]));
  assert.deepEqual(s, { agreed: "two-outlets", single: "one-outlet", split: "conflict", none: "no-code", live: "confirmed" });
  assert.equal(merged.find((e) => e.key === "live").confirmedSlug, "live");
  assert.equal(nameKey("$250,000"), "250000");
});

test("mergeCatalog distrusts codes reused across cheat names", () => {
  const MAX = ["Down", "Up", "Right", "Down"], REL = ["Up", "Down", "Up", "Down"], INF = ["Left", "Left", "Right", "Right"];
  const row = (name, ps5) => ({ name, category: "Combat", effect: "", unlock: "", ps5 });
  const merged = mergeCatalog([
    { outlet: "polygon.com", url: "p", rows: [row("Max Ammo", MAX), row("No Reload", REL)] },
    { outlet: "rockpapershotgun.com", url: "r", rows: [row("Max Ammo", MAX), row("Infinite Ammo", INF), row("No Reload", REL)] },
    // Radio Times-style errors: same code twice on one page, and Max Ammo's code under Infinite Ammo.
    { outlet: "radiotimes.com", url: "t", rows: [row("Max Ammo", REL), row("No Reload", REL), row("Infinite Ammo", MAX)] },
  ]);
  const by = Object.fromEntries(merged.map((e) => [e.key, e]));
  assert.deepEqual(by.maxammo.codes.map((c) => c.outlets), [["polygon.com", "rockpapershotgun.com"]]);
  assert.equal(by.maxammo.status, "two-outlets");
  assert.deepEqual(by.noreload.codes.map((c) => c.outlets), [["polygon.com", "rockpapershotgun.com"]]);
  assert.equal(by.infiniteammo.status, "conflict");
  assert.deepEqual(by.infiniteammo.codes.map((c) => c.outlets), [["rockpapershotgun.com"]]);
});
