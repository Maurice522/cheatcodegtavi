import { readFileSync } from 'node:fs';
import { getDb } from './leaks';
import type { Button } from './gta5-cheats';

// GTA 6 cheats found by the hourly watcher (automation/src/cheats). Each one
// passed automated checks: the exact code appears in an official Rockstar page
// or in articles from 2+ allowlisted outlets, published after launch. We have
// not tested them ourselves, so pages must say "reported", never "tested".
export interface Gta6Source {
  url: string;
  outlet: string;
  title: string;
  publishedAt: string;
}

export interface Gta6Cheat {
  key: string;
  slug: string;
  title: string;
  effect: string;
  /** In-game requirement that unlocks the cheat, as reported by the sources. */
  unlock?: string | null;
  phone: string | null;
  ps5: Button[] | null;
  status: 'reported';
  sources: Gta6Source[];
  reason: string;
  gta5Slug: string | null;
  verifiedAt: string;
}

let cache: Promise<Gta6Cheat[]> | null = null;

export function getReportedGta6Cheats(): Promise<Gta6Cheat[]> {
  cache ??= (async () => {
    // Local preview only: render from a JSON file instead of MongoDB.
    const fixture = process.env.GTA6_CHEATS_FIXTURE;
    if (fixture) return JSON.parse(readFileSync(fixture, 'utf-8')) as Gta6Cheat[];
    try {
      const db = await getDb();
      const docs = await db
        .collection('gta6_cheats')
        .find({ published: true }, { projection: { _id: 0 } })
        .sort({ verifiedAt: -1 })
        .toArray();
      return JSON.parse(JSON.stringify(docs)) as Gta6Cheat[];
    } catch (err) {
      console.warn(`[gta6-cheats] Skipping, could not load: ${(err as Error).message}`);
      return [];
    }
  })();
  return cache;
}

const OUTLET_NAMES: Record<string, string> = {
  'rockstargames.com': 'Rockstar Games',
  'support.rockstargames.com': 'Rockstar Support',
  'ign.com': 'IGN',
  'gamespot.com': 'GameSpot',
  'eurogamer.net': 'Eurogamer',
  'polygon.com': 'Polygon',
  'pcgamer.com': 'PC Gamer',
  'gamesradar.com': 'GamesRadar+',
  'videogameschronicle.com': 'VGC',
  'kotaku.com': 'Kotaku',
  'vg247.com': 'VG247',
  'rockpapershotgun.com': 'Rock Paper Shotgun',
  'pcgamesn.com': 'PCGamesN',
  'dexerto.com': 'Dexerto',
  'gamerant.com': 'Game Rant',
  'thegamer.com': 'TheGamer',
  'pushsquare.com': 'Push Square',
  'purexbox.com': 'Pure Xbox',
  'theverge.com': 'The Verge',
  'forbes.com': 'Forbes',
  'radiotimes.com': 'Radio Times',
  'redbull.com': 'Red Bull Gaming',
};

export const outletName = (outlet: string) => OUTLET_NAMES[outlet] ?? outlet;

export function reportedBy(cheat: Gta6Cheat): string {
  const names = [...new Set(cheat.sources.map((s) => outletName(s.outlet)))];
  return names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

export const gta6CheatPath = (slug: string) => `/cheats/gta-6/${slug}/`;
