import type { APIRoute } from 'astro';
import { allCheats, cheatGroups, getGroup, groupPath } from '../lib/gta5-cheats';
import { getAllLeaks } from '../lib/leaks';
import characters from '../data/characters.json';
import locations from '../data/locations.json';

// Static index behind /search/. Kept small: title, one-line description, url
// and a kind label per entry.
interface Entry {
  t: string;
  d: string;
  u: string;
  k: string;
}

const pages: Entry[] = [
  { t: 'GTA 6 cheat codes (PS5)', d: '35 GTA V cheats most likely to return in GTA 6, with PS5 inputs. All unconfirmed until tested.', u: '/cheats/', k: 'Page' },
  { t: 'GTA 5 vs GTA 6 cheat codes', d: 'Every GTA V cheat and its GTA 6 status, plus how cheat input changed across games.', u: '/cheats/gta5-vs-gta6/', k: 'Page' },
  { t: 'Printable PS5 cheat sheet', d: 'All 35 PS5 cheat inputs on one printable page.', u: '/cheats/cheat-sheet/', k: 'Page' },
  { t: 'GTA 6 release time', d: 'What is known about the GTA 6 unlock time on November 19, 2026, and what it means in your time zone.', u: '/gta-6-release-time/', k: 'Page' },
  { t: 'Leaks and news', d: 'GTA 6 leaks, rumors and official updates, labeled by how solid the source is.', u: '/leaks/', k: 'Page' },
  { t: 'Characters', d: 'Who is who in GTA 6.', u: '/characters/', k: 'Page' },
  { t: 'Locations and map', d: 'The regions of Leonida.', u: '/locations/', k: 'Page' },
  { t: 'Trailers', d: 'Official GTA 6 trailers from Rockstar.', u: '/trailers/', k: 'Page' },
  { t: 'FAQ', d: 'Common questions about GTA 6 cheat codes, trophies, online play and PC.', u: '/faq/', k: 'Page' },
  { t: 'Editorial policy', d: 'How we label sources and test cheat codes.', u: '/editorial-policy/', k: 'Page' },
  { t: 'About us', d: 'What CheatCodeGTAVI.com is.', u: '/about/', k: 'Page' },
  { t: 'Contact us', d: 'Report a correction or send a tip.', u: '/contact/', k: 'Page' },
];

export const GET: APIRoute = async () => {
  const leaks = (await getAllLeaks()).slice(0, 80);

  const entries: Entry[] = [
    ...pages,
    ...cheatGroups.map((g) => ({ t: `${g.name} (PS5)`, d: g.seoDescription, u: groupPath(g.slug), k: 'Cheat category' })),
    ...allCheats.map((c) => ({
      t: c.title,
      d: `${c.effect} (${getGroup(c.group)?.name ?? 'Cheat'}, GTA V code, unconfirmed in GTA 6)`,
      u: `${groupPath(c.group)}#${c.slug}`,
      k: 'Cheat',
    })),
    ...characters.map((c) => ({ t: c.name, d: c.description, u: `/characters/${c.slug}/`, k: 'Character' })),
    ...locations.map((l) => ({ t: l.name, d: l.description, u: `/locations/${l.slug}/`, k: 'Location' })),
    ...leaks.map((l) => ({ t: l.title, d: l.summary.slice(0, 180), u: `/leaks/${l.slug}/`, k: 'News' })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
};
