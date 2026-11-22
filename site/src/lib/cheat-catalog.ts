import { readFileSync } from 'node:fs';
import { getDb } from './leaks';
import { outletName } from './gta6-cheats';
import type { Button } from './gta5-cheats';

// The full GTA 6 cheat list (~61 cheats), merged hourly from the big guides by
// automation/src/cheats/catalog.js. Unlike gta6_cheats, a catalog code is NOT
// verified: pages must show each code's status and the outlets behind it.
export type CatalogStatus = 'confirmed' | 'two-outlets' | 'one-outlet' | 'conflict' | 'no-code';

export interface CatalogCode {
  key: string;
  ps5: Button[];
  outlets: string[];
}

export interface CatalogCheat {
  key: string;
  name: string;
  category: string;
  effect: string;
  unlock: string;
  codes: CatalogCode[];
  sources: { outlet: string; url: string }[];
  status: CatalogStatus;
  confirmedSlug?: string;
  updatedAt?: string;
}

export const CATEGORY_ORDER = ['Player', 'Combat', 'Spawn Vehicle', 'Environment', 'Screen Filters'];

export const STATUS_LABEL: Record<CatalogStatus, string> = {
  confirmed: 'Confirmed',
  'two-outlets': 'Two outlets agree',
  'one-outlet': 'One outlet only',
  conflict: 'Outlets disagree',
  'no-code': 'No code yet',
};

export const outletList = (outlets: string[]) => {
  const names = outlets.map(outletName);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '');
};

let cache: Promise<CatalogCheat[]> | null = null;

export function getCheatCatalog(): Promise<CatalogCheat[]> {
  cache ??= (async () => {
    const fixture = process.env.CHEAT_CATALOG_FIXTURE;
    if (fixture) return JSON.parse(readFileSync(fixture, 'utf-8')) as CatalogCheat[];
    try {
      const db = await getDb();
      const docs = await db.collection('cheat_catalog').find({}, { projection: { _id: 0 } }).toArray();
      const list = JSON.parse(JSON.stringify(docs)) as CatalogCheat[];
      return list.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    } catch (err) {
      console.warn(`[cheat-catalog] Skipping, could not load: ${(err as Error).message}`);
      return [];
    }
  })();
  return cache;
}

export function byCategory(list: CatalogCheat[]) {
  return CATEGORY_ORDER.map((category) => ({ category, cheats: list.filter((c) => c.category === category) })).filter((g) => g.cheats.length);
}
