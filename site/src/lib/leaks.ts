import dns from 'node:dns';
import { MongoClient, type Db } from 'mongodb';
import rawLeaks from '../data/leaks.json';

export type Credibility = 'official' | 'confirmed' | 'rumor';

export interface LeakSource {
  title: string;
  url: string;
}

export interface Leak {
  slug: string;
  title: string;
  summary: string;
  credibility: Credibility;
  tags: string[];
  image?: string | null;
  sourceName?: string;
  sourceLinks: LeakSource[];
  publishedAt: string;
}

// Some networks refuse SRV record lookups, which mongodb+srv:// requires.
// Prefer public resolvers that support them.
dns.setServers(['1.1.1.1', '8.8.8.8', ...dns.getServers()]);

const uri = import.meta.env.MONGODB_URI ?? process.env.MONGODB_URI;

let client: MongoClient | null = null;
let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;
  if (!uri) throw new Error('MONGODB_URI is not set');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db('cheatcodegtavi');
  return db;
}

// The pipeline in automation/ writes live leaks to MongoDB. The hand-written
// entries in data/leaks.json are curated launch-day seed content (verified
// facts from Rockstar's own announcements) and are always shown; pipeline
// leaks are merged in on top, deduped by slug so a live leak can supersede a
// seed entry with the same slug.
// Pipeline images are stored in Mongo as data: URIs (self-hosted, no
// hotlinking). Inlining them in the HTML made /leaks/ over 65 MiB, past
// Cloudflare's 25 MiB per-asset limit, so they're split out here: the leak's
// `image` becomes a short /leak-images/<file> path, and the bytes are served
// as real static files by pages/leak-images/[file].ts.
const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const leakImageFiles = new Map<string, { mime: string; data: Buffer }>();

export function getLeakImageFiles() {
  return leakImageFiles;
}

function externalizeImage(leak: Leak): Leak {
  const match = typeof leak.image === 'string' ? leak.image.match(/^data:([^;,]+);base64,(.+)$/s) : null;
  if (!match) return leak;
  const ext = MIME_EXT[match[1]];
  if (!ext) return { ...leak, image: null };
  const file = `${leak.slug}.${ext}`;
  leakImageFiles.set(file, { mime: match[1], data: Buffer.from(match[2], 'base64') });
  return { ...leak, image: `/leak-images/${file}` };
}

async function getMongoLeaks(): Promise<Leak[]> {
  try {
    const database = await getDb();
    const docs = await database.collection<Leak>('leaks').find({}).toArray();
    const leaks: Leak[] = JSON.parse(JSON.stringify(docs));
    return leaks.map(externalizeImage);
  } catch (err) {
    console.warn(`[leaks] Skipping MongoDB leaks, could not connect: ${(err as Error).message}`);
    return [];
  }
}

// Every leak article page calls getLeakBySlug() independently at build time
// (on top of getAllLeaks() from the homepage, the leaks index, and the RSS
// feed), which without caching means one full collection scan per generated
// page — dozens today, growing by one per build as the pipeline publishes
// more leaks. Memoize the merged result so the whole build does exactly one
// Mongo query and every caller reuses it.
let mergedLeaksPromise: Promise<Leak[]> | null = null;

async function getMergedLeaks(): Promise<Leak[]> {
  if (mergedLeaksPromise) return mergedLeaksPromise;
  mergedLeaksPromise = (async () => {
    const seed = rawLeaks as Leak[];
    const live = await getMongoLeaks();
    const bySlug = new Map<string, Leak>();
    for (const leak of seed) bySlug.set(leak.slug, leak);
    for (const leak of live) bySlug.set(leak.slug, leak);
    return [...bySlug.values()];
  })();
  return mergedLeaksPromise;
}

// The /leaks/ listing is paginated so its HTML stays a fixed size no matter
// how many leaks the pipeline has published (it adds ~12 a day).
export const LEAKS_PER_PAGE = 24;

export async function getAllLeaks(): Promise<Leak[]> {
  const leaks = await getMergedLeaks();
  return leaks.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export async function getLatestLeaks(limit = 4): Promise<Leak[]> {
  return (await getAllLeaks()).slice(0, limit);
}

export async function getLeakBySlug(slug: string): Promise<Leak | undefined> {
  const leaks = await getMergedLeaks();
  return leaks.find((l) => l.slug === slug);
}
