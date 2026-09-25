// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://cheatcodegtavi.com',

  integrations: [
    sitemap({
      // Individual leak articles are noindex'd (auto-rewritten, no editorial
      // review yet — see Content Quality & Pre-Launch Plan, T3) and
      // /favorites is a personal-state page with nothing to index. A sitemap
      // should only list pages worth a reviewer's or crawler's time.
      filter: (page) => {
        const url = new URL(page);
        if (url.pathname === '/favorites/') return false;
        if (/^\/leaks\/.+\/$/.test(url.pathname)) return false;
        return true;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
