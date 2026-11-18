// Sends one notification per newly verified GTA 6 cheat, after the deploy.
// Published cheats: waits until the page is live, then notifies with its link.
// Held cheats (AUTO_PUBLISH off): notifies that a code passed verification.
//
// Channels: a GitHub issue (uses the workflow's own GITHUB_TOKEN; GitHub emails
// the repo owner) and, when RESEND_API_KEY + NOTIFY_EMAIL secrets exist, an email.
import "dotenv/config";
import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8", ...dns.getServers()]);

const SITE = "https://cheatcodegtavi.com";
const { MONGODB_URI, GITHUB_TOKEN, GITHUB_REPOSITORY, RESEND_API_KEY, NOTIFY_EMAIL } = process.env;
const FROM = process.env.MAIL_FROM || "CheatCodeGTAVI <hello@cheatcodegtavi.com>";
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");

async function isLive(url) {
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) return true;
    } catch {}
    await new Promise((res) => setTimeout(res, 15000));
  }
  return false;
}

const codeLine = (c) =>
  [c.ps5?.length ? `PS5: ${c.ps5.join(", ")}` : null, c.phone ? `Phone: ${c.phone}` : null].filter(Boolean).join(" · ");

function message(c, url) {
  const sources = c.sources.map((s) => `- ${s.outlet}: ${s.url}`).join("\n");
  const head = c.published
    ? `New GTA 6 cheat verified and published: ${c.title}`
    : `GTA 6 cheat passed verification (not published, AUTO_PUBLISH is off): ${c.title}`;
  const body = [
    head,
    "",
    `${c.effect}`,
    codeLine(c),
    "",
    `Verified by: ${c.reason}`,
    sources,
    "",
    c.published ? `Live on the site: ${url}` : "Turn on the AUTO_PUBLISH repo variable to publish verified cheats automatically.",
    `All GTA 6 cheats: ${SITE}/cheats/gta-6/`,
  ].join("\n");
  return { subject: head, body };
}

async function githubIssue({ subject, body }) {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) return false;
  const r = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues`, {
    method: "POST",
    headers: { authorization: `Bearer ${GITHUB_TOKEN}`, accept: "application/vnd.github+json", "content-type": "application/json" },
    body: JSON.stringify({ title: subject, body }),
  });
  if (!r.ok) console.log(`GitHub issue failed: ${r.status} ${await r.text()}`);
  return r.ok;
}

async function email({ subject, body }) {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) return false;
  const html = body
    .split("\n")
    .map((l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/(https:\/\/\S+)/g, '<a href="$1">$1</a>'))
    .join("<br>");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [NOTIFY_EMAIL], subject, text: body, html }),
  });
  if (!r.ok) console.log(`Email failed: ${r.status} ${await r.text()}`);
  return r.ok;
}

if (process.env.TEST_NOTIFY === "true") {
  const msg = {
    subject: "Test: GTA 6 cheat watcher notifications work",
    body: `This is a test from the hourly GTA 6 cheat watcher. When a new GTA 6 cheat passes verification you will get a message like this with a link to its page on ${SITE}/cheats/gta-6/\n\nYou can close this issue.`,
  };
  console.log(`Test notification: issue ${await githubIssue(msg)}, email ${await email(msg)}`);
  process.exit(0);
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
try {
  const cheats = client.db("cheatcodegtavi").collection("gta6_cheats");
  const pending = await cheats.find({ notified: false }).toArray();
  console.log(`${pending.length} cheat(s) to notify about.`);
  for (const c of pending) {
    const url = `${SITE}/cheats/gta-6/${c.slug}/`;
    if (c.published && !(await isLive(url))) {
      console.log(`${url} is not live yet; will notify after the next deploy.`);
      process.exitCode = 1;
      continue;
    }
    const msg = message(c, url);
    const sent = [await githubIssue(msg), await email(msg)];
    if (sent.some(Boolean)) {
      await cheats.updateOne({ key: c.key }, { $set: { notified: true, notifiedAt: new Date().toISOString() } });
      console.log(`Notified: ${c.title} (issue: ${sent[0]}, email: ${sent[1]})`);
    } else {
      console.log(`No notification channel worked for ${c.title}; retrying next run.`);
      process.exitCode = 1;
    }
  }
} finally {
  await client.close();
}
