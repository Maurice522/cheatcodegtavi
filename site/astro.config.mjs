// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

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
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
