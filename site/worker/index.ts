/// <reference types="@cloudflare/workers-types" />

// Combined API + static-asset Worker. Static site requests fall through to
// ASSETS (the `./dist` build output); everything under /api/* is handled
// here. Backs the "notify me at launch" signup (KV: subscriber:<email>) and
// the per-cheat "did this work?" vote counters (KV: vote:<slug>:<platform>:<up|down>).
//
// Not deployed by default — see README-worker.md for the one-time setup
// (`wrangler kv namespace create`, paste the id into wrangler.jsonc, `wrangler
// deploy`). Until then every /api/* request 404s, same as the existing
// /api/track beacon already did, and the frontend degrades gracefully.

export interface Env {
  ASSETS: Fetcher;
  CHEATCODEGTAVI_KV: KVNamespace;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers ?? {}) },
  });
}

function isValidEmail(email: string): boolean {
  // Deliberately loose — real validation happens by the email actually
  // bouncing or not; this just filters obvious junk before it hits KV.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isValidEmail(email)) {
    return json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  const key = `subscriber:${email}`;
  const existing = await env.CHEATCODEGTAVI_KV.get(key);
  if (!existing) {
    await env.CHEATCODEGTAVI_KV.put(key, JSON.stringify({ subscribedAt: new Date().toISOString() }));
  }
  return json({ ok: true });
}

const VALID_PLATFORMS = new Set(['ps5', 'xbox', 'pc']);

function voteKeys(slug: string, platform: string) {
  return {
    up: `vote:${slug}:${platform}:up`,
    down: `vote:${slug}:${platform}:down`,
  };
}

async function readVoteCounts(env: Env, slug: string, platform: string) {
  const keys = voteKeys(slug, platform);
  const [up, down] = await Promise.all([
    env.CHEATCODEGTAVI_KV.get(keys.up),
    env.CHEATCODEGTAVI_KV.get(keys.down),
  ]);
  return { up: Number(up ?? '0'), down: Number(down ?? '0') };
}

async function handleGetVotes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const platform = url.searchParams.get('platform') ?? 'ps5';
  if (!slug || !VALID_PLATFORMS.has(platform)) {
    return json({ error: 'Missing or invalid slug/platform' }, { status: 400 });
  }
  return json(await readVoteCounts(env, slug, platform));
}

async function handlePostVote(request: Request, env: Env): Promise<Response> {
  let body: { slug?: unknown; platform?: unknown; direction?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug : '';
  const platform = typeof body.platform === 'string' ? body.platform : 'ps5';
  const direction = body.direction === 'up' || body.direction === 'down' ? body.direction : null;

  if (!slug || !VALID_PLATFORMS.has(platform) || !direction) {
    return json({ error: 'Missing slug, platform, or direction' }, { status: 400 });
  }

  const key = voteKeys(slug, platform)[direction];
  const current = Number((await env.CHEATCODEGTAVI_KV.get(key)) ?? '0');
  await env.CHEATCODEGTAVI_KV.put(key, String(current + 1));
  return json(await readVoteCounts(env, slug, platform));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/subscribe' && request.method === 'POST') {
      return handleSubscribe(request, env);
    }
    if (url.pathname === '/api/vote' && request.method === 'GET') {
      return handleGetVotes(request, env);
    }
    if (url.pathname === '/api/vote' && request.method === 'POST') {
      return handlePostVote(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
