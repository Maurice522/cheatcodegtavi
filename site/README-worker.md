# Deploying the API Worker

`worker/index.ts` backs two features: the "notify me at launch" email signup
and the per-cheat "did this work?" vote counters. It's not live until you run
these one-time steps — until then, every `/api/*` request 404s and the
frontend for both features degrades gracefully (the signup form shows a
"coming soon" state, vote buttons hide their counts).

## One-time setup

```bash
npx wrangler login
npx wrangler kv namespace create CHEATCODEGTAVI_KV
```

That prints an `id`. Paste it into `wrangler.jsonc`, replacing
`REPLACE_WITH_KV_NAMESPACE_ID`:

```jsonc
"kv_namespaces": [{ "binding": "CHEATCODEGTAVI_KV", "id": "<the id you just got>" }]
```

## Deploy

```bash
npm run build
npx wrangler deploy
```

This is the same command used for every future deploy — `wrangler.jsonc` now
points at `worker/index.ts` instead of serving `./dist` as plain static
assets, so one `wrangler deploy` ships both the site and the API together.

## What's stored

- `subscriber:<email>` — JSON `{ subscribedAt }`. No sending logic exists yet;
  when GTA6 launches, list keys with `wrangler kv key list` (or a small
  script) and send through whatever email tool you pick then. This Worker
  only captures the list.
- `vote:<slug>:<platform>:up` / `:down` — plain integer counters, incremented
  per click. There's no per-user identity, just a `localStorage` flag on the
  frontend so the same browser can't double-vote — treat counts as
  directional signal, not an audited poll.
