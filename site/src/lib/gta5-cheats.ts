import rawCheats from '../data/gta5-cheats.json';

// These are GTA V cheat codes. GTA 6 has its own cheats (see gta6-cheats.ts);
// none of these are tested in GTA 6 and every page that renders them must say
// so. PS5 inputs only, by design.
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

// Every cheat starts "unconfirmed". After launch, set status to "works" or
// "broken" in src/data/gta5-cheats.json only once we have tested it in the
// released game on a PS5, and record the date in testedAt (YYYY-MM-DD).
export type CheatStatus = 'unconfirmed' | 'works' | 'broken';

export interface Gta5Cheat {
  slug: string;
  title: string;
  group: GroupSlug;
  effect: string;
  ps5?: Button[];
  phone: string;
  note?: string;
  status?: CheatStatus;
  testedAt?: string;
}

export const STATUS_LABELS: Record<CheatStatus, string> = {
  unconfirmed: 'GTA V code, untested in GTA 6',
  works: 'Tested: works in GTA 6',
  broken: "Tested: doesn't work in GTA 6",
};

export function statusOf(cheat: Gta5Cheat): CheatStatus {
  return cheat.status ?? 'unconfirmed';
}

export function formatTestedDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
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
    seoTitle: 'GTA 5 Wanted Level Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 wanted level cheats for PS5: lower or raise your stars. GTA 6 has its own cheat list; see which GTA 6 cheats are confirmed.',
    intro: [
      'Wanted level cheats are the most-used cheats in the series: one clears a star of police attention, the other adds one. In GTA V each entry changes your wanted level by exactly one star, so you stack the code to clear a full five-star chase or to start one on purpose.',
      "These are GTA V's PS5 inputs. GTA 6 has its own cheats, which unlock after the story and are entered through the phone with a D-pad code, so these GTA V sequences are a reference rather than GTA 6 codes. We haven't tested whether any of them carry over.",
    ],
    faq: [
      {
        q: 'Is there a wanted level cheat in GTA 6?',
        a: "Polygon and Eurogamer list a Raise Wanted Level cheat in GTA 6, but its code hadn't been found when they published. Confirmed GTA 6 codes are on our Confirmed GTA 6 Cheats page; the codes here are GTA V's.",
      },
      {
        q: 'Do GTA 5 wanted level cheats work on PS5?',
        a: 'Yes, in GTA V on PS5 you enter the button sequence during normal gameplay or dial the phone number. We have not tested them in GTA 6.',
      },
    ],
  },
  {
    slug: 'weapons-and-ammo',
    name: 'Weapon & Ammo Cheats',
    seoTitle: 'GTA 5 Weapon & Ammo Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 weapon and ammo cheats for PS5: give weapons, explosive ammo, flaming bullets and more, plus where to find confirmed GTA 6 combat cheats.',
    intro: [
      'This group covers cheats that change what your weapons do: a full loadout in one input, rounds that explode or ignite, melee hits that detonate, and a slow-motion aim mode. They are the cheats most players reach for when they want chaos in the open world.',
      "These are GTA V's PS5 inputs. GTA 6 has its own combat cheats, such as Attack Force and Exploding Balls, with different codes and unlock requirements. See the Confirmed GTA 6 Cheats page for those.",
    ],
    faq: [
      {
        q: 'Is there an infinite ammo cheat in GTA 6?',
        a: "Polygon and Eurogamer list Infinite Ammo and Max Ammo cheats in GTA 6, each unlocked through shooting range medals. We publish a GTA 6 code once two major outlets report the same one. In GTA V, the closest equivalent is the Give Weapons cheat listed here.",
      },
      {
        q: 'Do weapon cheats disable trophies?',
        a: 'Yes in both games: in GTA V a cheat disables trophies for the session, and Polygon and Eurogamer report that GTA 6 cheats disable saving and trophies too.',
      },
    ],
  },
  {
    slug: 'jump-run-swim',
    name: 'Jump, Run & Swim Cheats',
    seoTitle: 'GTA 5 Movement & Jump Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 movement cheats for PS5: super jump, fast run, fast swim, skyfall, parachute and moon gravity. GTA 6 has its own cheat list.',
    intro: [
      'Movement cheats change how your character gets around: higher jumps, faster sprinting and swimming, a parachute on demand, a freefall launch into the sky, and low gravity that makes everything float.',
      "These are GTA V's PS5 inputs. GTA 6 has its own cheats with their own codes, so check the Confirmed GTA 6 Cheats page before trying these in the new game. We haven't tested whether any carry over.",
    ],
    faq: [
      {
        q: 'Is there a super jump cheat in GTA 6?',
        a: "We haven't seen a Super Jump cheat confirmed for GTA 6. GTA 6's own cheats are on our Confirmed GTA 6 Cheats page; Super Jump here is GTA V's.",
      },
      {
        q: 'What does the Skyfall cheat do?',
        a: 'In GTA V it teleports you high into the air and drops you in freefall, which pairs with the parachute cheat. Polygon and Eurogamer list a separate Parachute cheat in GTA 6.',
      },
    ],
  },
  {
    slug: 'weather-and-physics',
    name: 'Weather & Physics Cheats',
    seoTitle: 'GTA 5 Weather & Physics Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 weather and physics cheats for PS5: change weather, slippery cars, slow motion and drunk mode. GTA 6 has its own environment cheats.',
    intro: [
      'Weather and physics cheats change how the world feels rather than what you carry. You can cycle the weather, make every car slide like it is on ice, slow the whole game down, or stumble around in drunk mode.',
      "These are GTA V's PS5 inputs. GTA 6 has its own Environment and Screen Filter cheats with different codes; see the Confirmed GTA 6 Cheats page.",
    ],
    faq: [
      {
        q: 'Can you change the weather with a cheat in GTA 6?',
        a: "Polygon and Eurogamer list Environment cheats in GTA 6 for time and weather. We publish each code once two major outlets report the same one. GTA V's Change Weather code is listed here.",
      },
    ],
  },
  {
    slug: 'health-and-armor',
    name: 'Health, Armor & Ability Cheats',
    seoTitle: 'GTA 5 Health & Armor Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 invincibility, max health and armor, and special ability cheats for PS5, plus GTA 6 body armor and focus cheats.',
    intro: [
      'Survival cheats: a limited-time invincibility mode, a full refill of health and body armor, and a recharge for your character special ability meter. They are the cheats most people think of first when they search for GTA cheat codes.',
      "The inputs below are GTA V's PS5 button sequences. GTA 6 has its own survival cheats, such as Body Armor, No Fall Damage and Unlimited Focus, with different codes and unlock requirements.",
    ],
    faq: [
      {
        q: 'Is there an invincibility cheat in GTA 6?',
        a: "We haven't seen an invincibility cheat confirmed for GTA 6. Polygon and Eurogamer list No Fall Damage and Body Armor cheats instead. The Invincibility code here is GTA V's.",
      },
      {
        q: 'Do invincibility cheats disable trophies?',
        a: 'In GTA V any cheat disables trophies for the session. Polygon and Eurogamer report that GTA 6 cheats disable saving and trophies too.',
      },
    ],
  },
  {
    slug: 'vehicle-spawn',
    name: 'Vehicle Spawn Cheats',
    seoTitle: 'GTA 5 Vehicle Spawn Cheats (PS5) and GTA 6',
    seoDescription:
      'GTA 5 vehicle spawn cheats for PS5: helicopters, sports cars, bikes, planes and more. GTA 6 has its own vehicle spawn cheats.',
    intro: [
      'Vehicle spawn cheats drop a car, bike, boat or aircraft in front of you. This list is GTA V vehicles: a Buzzard attack helicopter, sports cars, dirt bikes, a BMX, a stunt plane and a golf cart.',
      "GTA 6 has a different vehicle roster and its own Spawn Vehicle cheats, which Polygon and Eurogamer say you unlock by finding each vehicle. The GTA V spawn codes here can't return GTA 6's cars.",
    ],
    faq: [
      {
        q: 'Will GTA V vehicle spawn cheats work in GTA 6?',
        a: "GTA 6 has a different vehicle roster, so GTA V spawn codes can't return GTA 6's vehicles. GTA 6 has its own Spawn Vehicle cheats; confirmed ones are on our Confirmed GTA 6 Cheats page.",
      },
      {
        q: 'How do you unlock vehicle cheats in GTA 6?',
        a: 'According to Polygon, each GTA 6 vehicle spawn cheat unlocks after you find that vehicle in the world, and all cheats need the main story finished first.',
      },
    ],
  },
  {
    slug: 'phone-only',
    name: 'Phone-Only Cheats',
    seoTitle: 'GTA 5 Phone Cheat Numbers (PS5) and GTA 6',
    seoDescription:
      "GTA 5 phone-only cheat numbers for PS5: Dodo, Duke O'Death, Kraken and Director Mode. GTA 6 cheats use the phone with a D-pad code instead.",
    intro: [
      'A few GTA V cheats never had a button sequence: you can only trigger them by dialing a number on the in-game phone.',
      "The four below are GTA V numbers. In GTA V three of them only work after you unlock the vehicle in the story. GTA 6 also uses the phone, but differently: Polygon reports that you open the phone, hold L1 and R1, and enter a D-pad code.",
    ],
    faq: [
      {
        q: 'How do phone cheats work in GTA 6?',
        a: 'According to Polygon, you take out the phone with Up on the D-pad, hold L1 and R1 on the home screen, then enter the D-pad code. There are no phone numbers to dial as in GTA V.',
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
