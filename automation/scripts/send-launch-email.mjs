// Sends one email to everyone on the "notify me" list, with a per-person
// unsubscribe link. Dry run by default.
//
// Setup (once):
//   1. Create a Resend account (resend.com) and verify cheatcodegtavi.com as a sending domain.
//   2. Put these in automation/.env (never commit it):
//        RESEND_API_KEY=re_...
//        MAIL_FROM=CheatCodeGTAVI <hello@cheatcodegtavi.com>
//        SITE_ADMIN_TOKEN=...   (already set if the admin token was created for you)
//
// Usage (from automation/):
//   node scripts/send-launch-email.mjs --subject "GTA 6 cheats are live" --body body.html          # dry run
//   node scripts/send-launch-email.mjs --subject "GTA 6 cheats are live" --body body.html --send   # really send
import "dotenv/config";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const SITE = process.env.SITE_URL ?? "https://cheatcodegtavi.com";
const ADMIN_TOKEN = process.env.SITE_ADMIN_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.MAIL_FROM;
const subject = value("subject");
const bodyFile = value("body");
const send = flag("send");

if (!ADMIN_TOKEN) throw new Error("SITE_ADMIN_TOKEN is not set");
if (!subject || !bodyFile) throw new Error('Usage: --subject "..." --body path/to/body.html [--send]');
if (send && (!RESEND_API_KEY || !FROM)) throw new Error("RESEND_API_KEY and MAIL_FROM are required with --send");

const body = readFileSync(bodyFile, "utf-8");
const res = await fetch(`${SITE}/api/admin/subscribers`, { headers: { authorization: `Bearer ${ADMIN_TOKEN}` } });
if (!res.ok) throw new Error(`Could not load subscribers (${res.status})`);
const subscribers = await res.json();
console.log(`${subscribers.length} subscriber(s). ${send ? "SENDING" : "Dry run, nothing will be sent."}`);

let sent = 0;
for (const { email, token } of subscribers) {
  const unsubscribeUrl = `${SITE}/unsubscribe/?e=${encodeURIComponent(email)}&t=${token}`;
  if (!send) {
    console.log(`  would send to ${email}`);
    continue;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject,
      html: `${body}<hr><p style="font-size:12px;color:#666">You asked to be told when GTA 6 cheat codes go live on CheatCodeGTAVI.com. <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>`,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    }),
  });
  if (r.ok) sent++;
  else console.error(`  failed for ${email}: ${r.status} ${await r.text()}`);
  await new Promise((resolve) => setTimeout(resolve, 600)); // stay under Resend's rate limit
}
if (send) console.log(`Sent ${sent} of ${subscribers.length}.`);
