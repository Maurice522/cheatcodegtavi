/// <reference types="@cloudflare/workers-types" />
import { DurableObject } from 'cloudflare:workers';
import cheats from '../src/data/gta5-cheats.json';
import { EARLIEST_UNLOCK_MS } from '../src/lib/launch';

// Combined API + static-asset Worker. Static site requests fall through to
// ASSETS (the `./dist` build output); everything under /api/* is handled here.
//
// State lives in one SQLite-backed Durable Object (SiteStore) rather than KV:
// KV's free tier allows only 1,000 writes/day, which launch-day votes and
// signups would blow through, and KV counters can't be incremented atomically.

export interface Env {
  ASSETS: Fetcher;
  STORE: DurableObjectNamespace<SiteStore>;
  /** Bearer token for /api/admin/*. Set with `wrangler secret put ADMIN_TOKEN`. */
  ADMIN_TOKEN?: string;
  /** Optional salt for hashing voter IPs. Set with `wrangler secret put VOTE_SALT`. */
  VOTE_SALT?: string;
}

const VALID_SLUGS = new Set((cheats as { slug: string }[]).map((c) => c.slug));

export class SiteStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    sql.exec(
      `CREATE TABLE IF NOT EXISTS votes (
         slug TEXT NOT NULL, voter TEXT NOT NULL, direction TEXT NOT NULL, created_at INTEGER NOT NULL,
         PRIMARY KEY (slug, voter))`,
    );
    sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (
         id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, name TEXT, email TEXT,
         message TEXT NOT NULL, created_at INTEGER NOT NULL)`,
    );
    sql.exec(
      `CREATE TABLE IF NOT EXISTS subscribers (
         email TEXT PRIMARY KEY, token TEXT NOT NULL, created_at INTEGER NOT NULL)`,
    );
  }

  /** One vote per voter per cheat; voting again changes it. */
  vote(slug: string, voter: string, direction: 'up' | 'down') {
    this.ctx.storage.sql.exec(
      `INSERT INTO votes (slug, voter, direction, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(slug, voter) DO UPDATE SET direction = excluded.direction, created_at = excluded.created_at`,
      slug,
      voter,
      direction,
      Date.now(),
    );
    return this.counts()[slug] ?? { up: 0, down: 0 };
  }

  counts(): Record<string, { up: number; down: number }> {
    const rows = this.ctx.storage.sql
      .exec<{ slug: string; up: number; down: number }>(
        `SELECT slug,
                SUM(CASE WHEN direction = 'up' THEN 1 ELSE 0 END) AS up,
                SUM(CASE WHEN direction = 'down' THEN 1 ELSE 0 END) AS down
         FROM votes GROUP BY slug`,
      )
      .toArray();
    const out: Record<string, { up: number; down: number }> = {};
    for (const r of rows) out[r.slug] = { up: r.up, down: r.down };
    return out;
  }

  subscribe(email: string): { created: boolean } {
    const existing = this.ctx.storage.sql.exec(`SELECT 1 FROM subscribers WHERE email = ?`, email).toArray();
    if (existing.length > 0) return { created: false };
    const token = crypto.randomUUID().replace(/-/g, '');
    this.ctx.storage.sql.exec(
      `INSERT INTO subscribers (email, token, created_at) VALUES (?, ?, ?)`,
      email,
      token,
      Date.now(),
    );
    return { created: true };
  }

  unsubscribe(email: string, token: string): boolean {
    const row = this.ctx.storage.sql
      .exec<{ token: string }>(`SELECT token FROM subscribers WHERE email = ?`, email)
      .toArray()[0];
    if (!row || row.token !== token) return false;
    this.ctx.storage.sql.exec(`DELETE FROM subscribers WHERE email = ?`, email);
    return true;
  }

  /** Stores a contact-form message. Returns false when this sender is over the hourly limit. */
  addMessage(sender: string, name: string, email: string, message: string): boolean {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recent = this.ctx.storage.sql
      .exec<{ n: number }>(`SELECT COUNT(*) AS n FROM messages WHERE sender = ? AND created_at > ?`, sender, hourAgo)
      .one().n;
    if (recent >= 5) return false;
    this.ctx.storage.sql.exec(
      `INSERT INTO messages (sender, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`,
      sender,
      name,
      email,
      message,
      Date.now(),
    );
    return true;
  }

  listMessages(): { id: number; name: string; email: string; message: string; createdAt: number }[] {
    return this.ctx.storage.sql
      .exec<{ id: number; name: string; email: string; message: string; created_at: number }>(
        `SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC LIMIT 200`,
      )
      .toArray()
      .map((r) => ({ id: r.id, name: r.name, email: r.email, message: r.message, createdAt: r.created_at }));
  }

  listSubscribers(): { email: string; token: string; createdAt: number }[] {
    return this.ctx.storage.sql
      .exec<{ email: string; token: string; created_at: number }>(
        `SELECT email, token, created_at FROM subscribers ORDER BY created_at`,
      )
      .toArray()
      .map((r) => ({ email: r.email, token: r.token, createdAt: r.created_at }));
  }
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers ?? {}) },
  });
}

function isValidEmail(email: string): boolean {
  // Deliberately loose; real validation is the address actually receiving mail.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

const store = (env: Env) => env.STORE.get(env.STORE.idFromName('main'));

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) return json({ error: 'Enter a valid email address' }, { status: 400 });
  await store(env).subscribe(email);
  return json({ ok: true });
}

async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const token = typeof body.token === 'string' ? body.token : '';
  if (!isValidEmail(email) || !token) return json({ error: 'Invalid unsubscribe link' }, { status: 400 });
  const ok = await store(env).unsubscribe(email, token);
  return ok ? json({ ok: true }) : json({ error: 'This unsubscribe link is invalid or already used' }, { status: 400 });
}

async function hashVoter(request: Request, env: Env): Promise<string> {
  // A one-way hash of the IP so the same person can't stuff the ballot. The raw
  // address is never stored.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const data = new TextEncoder().encode(`${env.VOTE_SALT ?? 'cheatcodegtavi'}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });
  // Hidden "website" field: real visitors never fill it in, bots usually do.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length < 10 || message.length > 4000) {
    return json({ error: 'Please write a message between 10 and 4000 characters' }, { status: 400 });
  }
  if (email && !isValidEmail(email)) return json({ error: 'That email address looks wrong' }, { status: 400 });
  const ok = await store(env).addMessage(await hashVoter(request, env), name, email, message);
  return ok ? json({ ok: true }) : json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
}

async function handleAdminMessages(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) return new Response('Not found', { status: 404 });
  return json(await store(env).listMessages());
}

async function handlePostVote(request: Request, env: Env): Promise<Response> {
  if (Date.now() < EARLIEST_UNLOCK_MS) {
    return json({ error: 'Player reports open when GTA 6 launches' }, { status: 403 });
  }
  const body = await readBody(request);
  if (!body) return json({ error: 'Invalid request body' }, { status: 400 });
  const slug = typeof body.slug === 'string' ? body.slug : '';
  const direction = body.direction === 'up' || body.direction === 'down' ? body.direction : null;
  if (!VALID_SLUGS.has(slug) || !direction) {
    return json({ error: 'Unknown cheat or direction' }, { status: 400 });
  }
  const counts = await store(env).vote(slug, await hashVoter(request, env), direction);
  return json(counts);
}

async function handleGetVotes(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // One cheap shared read for every cheat on the page, cached at the edge so a
  // traffic spike doesn't turn into one Durable Object call per visitor.
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/votes', request.url).toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const response = json(await store(env).counts(), { headers: { 'cache-control': 'public, max-age=60' } });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function handleAdminSubscribers(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('authorization') ?? '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return new Response('Not found', { status: 404 });
  }
  return json(await store(env).listSubscribers());
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/subscribe' && request.method === 'POST') return handleSubscribe(request, env);
    if (pathname === '/api/unsubscribe' && request.method === 'POST') return handleUnsubscribe(request, env);
    if (pathname === '/api/votes' && request.method === 'GET') return handleGetVotes(request, env, ctx);
    if (pathname === '/api/vote' && request.method === 'POST') return handlePostVote(request, env);
    if (pathname === '/api/contact' && request.method === 'POST') return handleContact(request, env);
    if (pathname === '/api/admin/subscribers' && request.method === 'GET') return handleAdminSubscribers(request, env);
    if (pathname === '/api/admin/messages' && request.method === 'GET') return handleAdminMessages(request, env);

    return env.ASSETS.fetch(request);
  },
};
