// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

// <lastmod> only where we know when content really changed (Google ignores
// sitemaps whose dates are obviously fake): guides carry an `updated` date;
// character/location pages were rewritten 2026-11-22; pages rebuilt from live
// cheat data change on every rebuild that the watcher triggers.
const BUILD_DATE = new Date().toISOString();
const LASTMOD = new Map();
for (const [, slug, date] of readFileSync(new URL('./src/data/guides.ts', import.meta.url), 'utf-8').matchAll(/slug: '([^']+)'[\s\S]*?updated: '([^']+)'/g)) LASTMOD.set(`/guides/${slug}/`, date);
const LIVE_PAGES = ['/', '/cheats/gta-6/', '/cheats/gta-6/tracker/', '/cheats/'];

// https://astro.build/config
export default defineConfig({
  site: 'https://cheatcodegtavi.com',

  // Self-hosted at build time with metric-matched fallbacks: no render-blocking
  // Google Fonts request and no layout shift when the web fonts swap in.
  fonts: [
    { provider: fontProviders.google(), name: 'Anton', cssVariable: '--font-anton', weights: [400], subsets: ['latin'], fallbacks: ['Archivo Black', 'sans-serif'] },
    { provider: fontProviders.google(), name: 'Manrope', cssVariable: '--font-manrope', weights: [600, 700, 800], subsets: ['latin'], fallbacks: ['system-ui', 'sans-serif'] },
    { provider: fontProviders.google(), name: 'Inter', cssVariable: '--font-inter', weights: [400, 500], subsets: ['latin'], fallbacks: ['system-ui', 'sans-serif'] },
  ],

  integrations: [
    sitemap({
      // Individual leak articles are noindex'd (auto-rewritten, no editorial
      // review yet — see Content Quality & Pre-Launch Plan, T3) and
      // /favorites is a personal-state page with nothing to index. A sitemap
      // should only list pages worth a reviewer's or crawler's time.
      filter: (page) => {
        const { pathname } = new URL(page);
        // personal-state, tool, or noindexed pages
        if (['/favorites/', '/search/', '/missions/', '/cheats/cheat-sheet/', '/unsubscribe/', '/shared/', '/characters/dwnply/'].includes(pathname)) return false;
        // individual leak articles and paginated leak lists are noindexed
        if (/^\/leaks\/.+\/$/.test(pathname)) return false;
        return true;
      },
      serialize(item) {
        const { pathname } = new URL(item.url);
        const lastmod = LASTMOD.get(pathname)
          ?? (LIVE_PAGES.includes(pathname) ? BUILD_DATE : null)
          ?? (/^\/(characters|locations)\//.test(pathname) || pathname === '/guides/' ? '2026-11-22' : null);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
