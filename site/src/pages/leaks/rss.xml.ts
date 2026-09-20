import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllLeaks } from '../../lib/leaks';

export async function GET(context: APIContext) {
  const leaks = await getAllLeaks();
  return rss({
    title: 'CheatCodeGTAVI — Leaks & Updates',
    description: 'GTA6 leaks and official updates, cross-referenced and rewritten.',
    site: context.site ?? 'https://cheatcodegtavi.com',
    items: leaks.map((leak) => ({
      title: leak.title,
      description: leak.summary,
      pubDate: new Date(leak.publishedAt),
      link: `/leaks/${leak.slug}/`,
      categories: [leak.credibility, ...leak.tags],
    })),
    customData: '<language>en-us</language>',
  });
}
