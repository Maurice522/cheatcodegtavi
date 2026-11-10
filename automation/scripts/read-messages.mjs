// Prints messages sent through the site's contact form, newest first.
// Needs SITE_ADMIN_TOKEN in automation/.env.   Usage (from automation/): node scripts/read-messages.mjs
import "dotenv/config";

const SITE = process.env.SITE_URL ?? "https://cheatcodegtavi.com";
const token = process.env.SITE_ADMIN_TOKEN;
if (!token) throw new Error("SITE_ADMIN_TOKEN is not set");

const res = await fetch(`${SITE}/api/admin/messages`, { headers: { authorization: `Bearer ${token}` } });
if (!res.ok) throw new Error(`Could not load messages (${res.status})`);
const messages = await res.json();
console.log(`${messages.length} message(s)\n`);
for (const m of messages) {
  console.log(`#${m.id}  ${new Date(m.createdAt).toISOString()}  ${m.name || "(no name)"}  ${m.email || "(no email)"}`);
  console.log(m.message.trim());
  console.log("-".repeat(60));
}
