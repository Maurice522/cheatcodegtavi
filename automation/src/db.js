import dns from "node:dns";
import { MongoClient } from "mongodb";

// Some networks (notably Windows behind certain routers/VPNs) refuse SRV
// record lookups, which mongodb+srv:// requires. Prefer public resolvers
// that support them, falling back to whatever was already configured.
dns.setServers(["1.1.1.1", "8.8.8.8", ...dns.getServers()]);

export async function connectDb(uri) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("cheatcodegtavi");
  const leaks = db.collection("leaks");
  await leaks.createIndex({ sourceUrl: 1 }, { unique: true });
  await leaks.createIndex({ slug: 1 }, { unique: true });
  return { client, leaks };
}

export async function alreadyExists(leaks, sourceUrl) {
  const existing = await leaks.findOne({ sourceUrl }, { projection: { _id: 1 } });
  return Boolean(existing);
}

const TOPIC_COOLDOWN_MS = 2 * 60 * 60 * 1000;

// Avoid publishing near-duplicate coverage: skip if any of this item's tags
// were already covered by a leak we inserted within the cooldown window.
export async function recentTopicExists(leaks, tags, windowMs = TOPIC_COOLDOWN_MS) {
  if (!tags || tags.length === 0) return false;
  const since = new Date(Date.now() - windowMs).toISOString();
  const existing = await leaks.findOne(
    { tags: { $in: tags }, createdAt: { $gte: since } },
    { projection: { _id: 1 } },
  );
  return Boolean(existing);
}
