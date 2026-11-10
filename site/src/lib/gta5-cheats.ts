import rawCheats from '../data/gta5-cheats.json';

// These are GTA V cheat codes, listed because they are the most likely to
// return in GTA 6. Nothing here is confirmed for GTA 6 and every page that
// renders it must say so. PS5 inputs only, by design.
export type Button =
  | 'Up'
  | 'Down'
  | 'Left'
  | 'Right'
  | 'Triangle'
  | 'Circle'
  | 'X'
  | 'Square'
  | 'L1'
  | 'L2'
  | 'R1'
  | 'R2';

export type GroupSlug =
  | 'wanted-level'
  | 'weapons-and-ammo'
  | 'jump-run-swim'
  | 'weather-and-physics'
  | 'health-and-armor'
  | 'vehicle-spawn'
  | 'phone-only';

export interface Gta5Cheat {
  slug: string;
  title: string;
  group: GroupSlug;
  effect: string;
  ps5?: Button[];
  phone: string;
  note?: string;
}

export interface CheatGroup {
  slug: GroupSlug;
  name: string;
  seoTitle: string;
  seoDescription: string;
  intro: string[];
  faq: { q: string; a: string }[];
}

export const GLYPHS: Record<Button, { glyph: string; label: string }> = {
  Up: { glyph: '↑', label: 'Up' },
  Down: { glyph: '↓', label: 'Down' },
  Left: { glyph: '←', label: 'Left' },
  Right: { glyph: '→', label: 'Right' },
  Triangle: { glyph: '△', label: 'Triangle' },
  Circle: { glyph: '○', label: 'Circle' },
  X: { glyph: '✕', label: 'X' },
  Square: { glyph: '□', label: 'Square' },
  L1: { glyph: 'L1', label: 'L1' },
  L2: { glyph: 'L2', label: 'L2' },
  R1: { glyph: 'R1', label: 'R1' },
  R2: { glyph: 'R2', label: 'R2' },
};

export function sequenceLabel(buttons: Button[]): string {
  return buttons.map((b) => GLYPHS[b].label).join(', ');
}

export const allCheats = rawCheats as Gta5Cheat[];

export const cheatGroups: CheatGroup[] = [
  {
    slug: 'wanted-level',
    name: 'Wanted Level Cheats',
    seoTitle: 'GTA 6 Wanted Level Cheats (PS5)',
    seoDescription:
      'GTA V wanted level cheats for PS5 — lower or raise your stars. Likely to return in GTA 6 but unconfirmed until launch on November 19, 2026.',
    intro: [
      'Wanted level cheats are the most-used cheats in the series: one clears a star of police attention, the other adds one. In GTA V each entry changes your wanted level by exactly one star, so you stack the code to clear a full five-star chase or to start one on purpose.',
      'GTA 6 has not confirmed any cheat codes. These are the GTA V PS5 inputs, listed because a police system that tracks stars is likely to keep a way to change them. Treat them as a starting point to test at launch, not as working GTA 6 codes.',
    ],
    faq: [
      {
        q: 'Will the GTA 6 lower wanted level cheat be the same as GTA V?',
        a: "Nobody outside Rockstar knows yet. The GTA V PS5 input is listed here because it is the most likely candidate to carry over, but Rockstar hasn't published any GTA 6 cheat codes. We'll test it after launch on November 19, 2026 and update this page.",
      },
      {
        q: 'Do wanted level cheats work on PS5?',
        a: 'The inputs on this page are the GTA V PS5 button sequences, entered during normal gameplay. Whether the same sequence works in GTA 6 on PS5 is unconfirmed.',
      },
    ],
  },
  {
    slug: 'weapons-and-ammo',
    name: 'Weapon & Ammo Cheats',
    seoTitle: 'GTA 6 Weapon & Ammo Cheats (PS5)',
    seoDescription:
      'GTA V weapon and ammo cheats for PS5: give weapons, explosive ammo, flaming bullets and more. Unconfirmed for GTA 6 until launch.',
    intro: [
      'This group covers cheats that change what your weapons do: a full loadout in one input, rounds that explode or ignite, melee hits that detonate, and a slow-motion aim mode. They are the cheats most players reach for when they want chaos in the open world.',
      "None of these are confirmed for GTA 6. They are GTA V's PS5 inputs, kept here so you can see what is most likely to return. Each one is marked unconfirmed, and we'll move any that work to a confirmed state only after testing them in the released game.",
    ],
    faq: [
      {
        q: 'Is there an infinite ammo cheat in GTA 6?',
        a: "Not confirmed. GTA V's closest equivalents are the Give Weapons cheat (a full loadout with ammo) and the explosive and flaming ammo cheats listed on this page. Rockstar hasn't published any GTA 6 cheats yet.",
      },
      {
        q: 'Do weapon cheats disable trophies?',
        a: 'In GTA V, activating a cheat disables trophy unlocks for that play session. We expect the same in GTA 6, but that is not confirmed.',
      },
    ],
  },
  {
    slug: 'jump-run-swim',
    name: 'Jump, Run & Swim Cheats',
    seoTitle: 'GTA 6 Movement & Jump Cheats (PS5)',
    seoDescription:
      'GTA V movement cheats for PS5: super jump, fast run, fast swim, skyfall, parachute and moon gravity. Unconfirmed for GTA 6 until launch.',
    intro: [
      'Movement cheats change how your character gets around: higher jumps, faster sprinting and swimming, a parachute on demand, a freefall launch into the sky, and low gravity that makes everything float.',
      "These are GTA V's PS5 inputs. GTA 6 has not confirmed any cheats, so none of these are verified for the new game. They are listed because movement cheats have appeared across the series for years.",
    ],
    faq: [
      {
        q: 'Is there a super jump cheat in GTA 6?',
        a: "Unconfirmed. Super Jump exists in GTA V (PS5 input listed on this page), and we'll test it in GTA 6 after launch on November 19, 2026.",
      },
      {
        q: 'What does the Skyfall cheat do?',
        a: 'In GTA V it teleports you high into the air and drops you in freefall, which pairs with the parachute cheat. Whether GTA 6 has an equivalent is unconfirmed.',
      },
    ],
  },
  {
    slug: 'weather-and-physics',
    name: 'Weather & Physics Cheats',
    seoTitle: 'GTA 6 Weather & Physics Cheats',
    seoDescription:
      'GTA V weather and physics cheats for PS5: change weather, slippery cars, slow motion and drunk mode. Unconfirmed for GTA 6.',
    intro: [
      'Weather and physics cheats change how the world feels rather than what you carry. You can cycle the weather, make every car slide like it is on ice, slow the whole game down, or stumble around in drunk mode.',
      'These are the GTA V PS5 inputs. GTA 6 has not confirmed any cheats, so treat everything here as unconfirmed until we test it in the released game.',
    ],
    faq: [
      {
        q: 'Can you change the weather with a cheat in GTA 6?',
        a: "Unconfirmed. GTA V has a Change Weather cheat that cycles through weather types, and it's the most likely candidate to return. We'll verify after launch.",
      },
    ],
  },
  {
    slug: 'health-and-armor',
    name: 'Health, Armor & Ability Cheats',
    seoTitle: 'GTA 6 Health & Armor Cheats (PS5)',
    seoDescription:
      'GTA V invincibility, max health and armor, and special ability cheats for PS5. Unconfirmed for GTA 6 until launch.',
    intro: [
      'Survival cheats: a limited-time invincibility mode, a full refill of health and body armor, and a recharge for your character special ability meter. They are the cheats most people think of first when they search for GTA cheat codes.',
      "The inputs below are GTA V's PS5 button sequences. GTA 6 has not confirmed its cheats, so none of these are verified for the new game yet.",
    ],
    faq: [
      {
        q: 'Is there an invincibility cheat in GTA 6?',
        a: "Not confirmed. GTA V's Invincibility cheat makes you immune to bullets, explosions, falls and fire for a limited time, and it is a strong candidate to return. We'll test it at launch.",
      },
      {
        q: 'Do invincibility cheats disable trophies?',
        a: 'In GTA V, any cheat disables trophy unlocks for the play session. We expect GTA 6 to follow the same rule, but it has not been confirmed.',
      },
    ],
  },
  {
    slug: 'vehicle-spawn',
    name: 'Vehicle Spawn Cheats',
    seoTitle: 'GTA 6 Vehicle Spawn Cheats (PS5)',
    seoDescription:
      'GTA V vehicle spawn cheats for PS5: helicopters, sports cars, bikes, planes and more. GTA 6 vehicles are unconfirmed until launch.',
    intro: [
      'Vehicle spawn cheats drop a car, bike, boat or aircraft in front of you. This list is GTA V vehicles: a Buzzard attack helicopter, sports cars, dirt bikes, a BMX, a stunt plane and a golf cart.',
      "GTA 6 will have its own vehicle roster, so the GTA V spawn inputs here may not map to the same vehicles, or may not exist at all. They are listed as unconfirmed starting points, and we'll replace them with GTA 6's real vehicle cheats once the game is out and tested.",
    ],
    faq: [
      {
        q: 'Will GTA V vehicle spawn cheats work in GTA 6?',
        a: 'Almost certainly not as written. GTA 6 has a different vehicle roster, so a spawn input for a GTA V vehicle cannot return the same car. Whether the cheat system itself returns is unconfirmed.',
      },
      {
        q: 'Which GTA 6 vehicles have been shown so far?',
        a: "See our Leaks & Updates page for the latest on what Rockstar has shown. The spawn cheats on this page are GTA V vehicles only.",
      },
    ],
  },
  {
    slug: 'phone-only',
    name: 'Phone-Only Cheats',
    seoTitle: 'GTA 6 Phone Cheat Codes (PS5)',
    seoDescription:
      'GTA V phone-only cheat numbers for PS5: Dodo, Duke O\'Death, Kraken and Director Mode. Unconfirmed for GTA 6 until launch.',
    intro: [
      "A few GTA V cheats never had a button sequence: you can only trigger them by dialing a number on the in-game phone. That matters for GTA 6 because Rockstar's marketing has leaned heavily into phones, which makes a dial-in cheat system the most likely carryover.",
      'The four below are GTA V numbers. In GTA V three of them only work after you unlock the vehicle in the story. None are confirmed for GTA 6.',
    ],
    faq: [
      {
        q: 'How do phone cheat codes work on PS5?',
        a: 'In GTA V you open the in-game phone, dial the number and the effect applies. GTA 6 has not confirmed how its cheats are entered.',
      },
    ],
  },
];

export const featuredSlugs = [
  'invincibility',
  'give-weapons',
  'lower-wanted-level',
  'spawn-comet',
  'super-jump',
  'skyfall',
];

export function getGroup(slug: string): CheatGroup | undefined {
  return cheatGroups.find((g) => g.slug === slug);
}

export function cheatsInGroup(slug: GroupSlug): Gta5Cheat[] {
  return allCheats.filter((c) => c.group === slug);
}

export function getFeatured(): Gta5Cheat[] {
  return featuredSlugs
    .map((s) => allCheats.find((c) => c.slug === s))
    .filter((c): c is Gta5Cheat => Boolean(c));
}

export const groupPath = (slug: string) => `/cheats/${slug}/`;
