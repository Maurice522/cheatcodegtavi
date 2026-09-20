import rawCheats from '../data/cheats.json';

export type Confidence = 'verified' | 'rumored';
export type InputType = 'controller' | 'phone';

export interface Source {
  title: string;
  url: string;
}

export interface PlatformDetail {
  inputType: InputType;
  input: string;
  effect: string;
  confidence: Confidence;
  sources: Source[];
}

export interface Cheat {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  platforms: {
    ps5: PlatformDetail | null;
    xbox: PlatformDetail | null;
    pc: null; // always null — GTA6 has no PC release yet
  };
  images: {
    controllerDiagram: string | null;
    videoEmbedUrl: string | null;
  };
  viewCount: number;
  updatedAt: string;
}

// TODO(Phase 3): swap this module's data source for a MongoDB query
// (see PLAN.md §5 for the target schema) once the automation pipeline exists.
// Every function below keeps the same signature so that swap touches one file.
const cheats = rawCheats as Cheat[];

export function getAllCheats(): Cheat[] {
  return cheats;
}

export function getCheatBySlug(slug: string): Cheat | undefined {
  return cheats.find((c) => c.slug === slug);
}

export function getTrendingCheats(limit = 6): Cheat[] {
  return [...cheats].sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);
}

export function getSimilarCheats(cheat: Cheat, limit = 4): Cheat[] {
  return cheats
    .filter((c) => c.slug !== cheat.slug)
    .map((c) => ({
      cheat: c,
      score: c.tags.filter((t) => cheat.tags.includes(t)).length + (c.category === cheat.category ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.cheat);
}

export function getCategories(): string[] {
  return [...new Set(cheats.map((c) => c.category))];
}

export type CheatIconName = 'player' | 'weapons' | 'vehicles' | 'wanted' | 'weather' | 'gameplay' | 'combat';

const CATEGORY_ICONS: Record<string, CheatIconName> = {
  player: 'player',
  weapons: 'weapons',
  vehicles: 'vehicles',
  wanted: 'wanted',
  weather: 'weather',
  gameplay: 'gameplay',
  combat: 'combat',
};

export function getCheatIcon(category: string): CheatIconName {
  return CATEGORY_ICONS[category] ?? 'gameplay';
}
