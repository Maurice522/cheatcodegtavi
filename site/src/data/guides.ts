// GTA 6 guides built from what players are searching for after launch (Google
// Trends, Nov 2026). Every fact is attributed to a source page we read; we have
// not played these sections ourselves. Strings use backticks so apostrophes
// can't break the build. Bump `updated` by hand when a guide's facts change.

export interface GuideSource { name: string; url: string }
export interface Guide {
  slug: string;
  title: string; // <title> and H1
  short: string; // card / nav label
  description: string; // meta description
  answer: string; // answer-first paragraph quoted by search and AI
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  faq: { q: string; a: string }[];
  sources: GuideSource[];
  related: string[]; // internal paths
  updated: string;
}

const IGN = (page: string, name = 'IGN') => ({ name, url: `https://www.ign.com/wikis/gta-6/${page}` });

export const guides: Guide[] = [
  {
    slug: 'can-jason-and-lucia-cheat-on-each-other',
    title: 'Can Jason and Lucia Cheat on Each Other in GTA 6?',
    short: 'Can Jason and Lucia cheat?',
    description: `No: in GTA 6 Jason and Lucia can't date or sleep with anyone else, and you can't end their relationship. What you can do at strip clubs, and how romance works.`,
    answer: `No. According to IGN, GTA 6 has no other characters Jason or Lucia can start a relationship or have sex with: romance is reserved for the two of them. You can make their relationship closer or more distant, but you can't break them up, and there are no sex workers in Leonida to solicit.`,
    sections: [
      {
        heading: `Does Lucia cheat on Jason (or Jason on Lucia)?`,
        paragraphs: [
          `Not in the way earlier GTA games allowed. IGN reports that intimacy in GTA 6 is limited to Jason and Lucia's own relationship, and how close they are is up to how you play their interactions. The story keeps them in each other's lives either way.`,
        ],
      },
      {
        heading: `What you can do instead`,
        bullets: [
          `Both can visit strip clubs, together or alone, and pay for VIP lap dances.`,
          `Throwing most of your money at one dancer makes them remove some clothing. IGN says that is as intimate as those interactions get.`,
          `There are no sex workers in Leonida, unlike previous GTA games.`,
        ],
      },
      {
        heading: `Looking for GTA 6 cheat codes instead?`,
        paragraphs: [
          `If you searched "GTA 6 cheats" for the game's actual cheat codes, they unlock after the story and are entered on the phone while holding L1 + R1 (LB + RB on Xbox).`,
        ],
      },
    ],
    faq: [
      { q: `Can Lucia cheat on Jason in GTA 6?`, a: `No. IGN reports there are no other characters Lucia can start a relationship or have sex with; romance is reserved for Jason and Lucia.` },
      { q: `Can Jason cheat on Lucia in GTA 6?`, a: `No. The same applies to Jason: there are no other romance options, and the pair stay in each other's lives whatever you choose.` },
      { q: `Can Jason and Lucia break up in GTA 6?`, a: `No. You can lean into or away from the romance, but you can't make them stop being part of each other's lives, according to IGN.` },
      { q: `Are there strip clubs in GTA 6?`, a: `Yes. Jason and Lucia can visit strip clubs together or separately and buy VIP lap dances.` },
      { q: `Are there sex workers in GTA 6?`, a: `No. IGN notes that, unlike previous GTA games, there are no sex workers in Leonida you can solicit.` },
    ],
    sources: [IGN('Can_Jason_and_Lucia_Cheat_on_Each_Other%3F', 'IGN: Can Jason and Lucia Cheat on Each Other?')],
    related: ['/cheats/gta-6/', '/cheats/gta-6/how-to-activate-cheats/', '/characters/'],
    updated: '2026-11-22',
  },
  {
    slug: 'how-to-make-money-fast',
    title: 'GTA 6 Money: Fastest Ways to Make Money, the Money Cheat and Glitches',
    short: 'Make money fast',
    description: `How to make money fast in GTA 6: the $250,000 money cheat (and why you can't keep it), the best early money methods, safes and robberies, and whether a money glitch works.`,
    answer: `The quickest legitimate money in GTA 6 comes from Illegal Operations, robberies with safes, and selling every stolen item to a fence. The $250,000 money cheat (Up, Right, Down, Left, Up, Left, Down, Right) only unlocks after the story, and because cheats disable saving you can't keep the cash. We haven't found a money glitch verified by a major outlet.`,
    sections: [
      {
        heading: `The GTA 6 money cheat`,
        paragraphs: [
          `The $250,000 cheat is Up, Right, Down, Left, Up, Left, Down, Right. It unlocks after you finish the main story and make $250,000 from fenced goods. Rock Paper Shotgun reports it can be repeated, but Eurogamer notes cheats disable saving, so the money doesn't stick.`,
        ],
      },
      {
        heading: `Best ways to make money early (Chapter 1)`,
        bullets: [
          `Clear Illegal Operations and loot them fully. IGN says the Kingfishers fishing-shack camp north-west of Key Lento pays close to $2,000 if you pick every pocket and bag every stash.`,
          `Sell everything you steal to a fence instead of holding on to product.`,
          `Open a BuckMe account and bank your cash, then chase the savings goals.`,
          `Do the optional recoveries and small side jobs, and loot the crashed plane IGN points out.`,
        ],
      },
      {
        heading: `Safes and robberies`,
        paragraphs: [
          `Robberies with safes pay the most. PC Gamer explains you can find a safe code written somewhere on site or force an employee to give it up, and IGN, PowerPyx and GTABase all recommend Sticky Bombs from Ammu-Nation to blow safes open. IGN lists $2,313 in the Nova Auto Junkyard safe.`,
        ],
      },
      {
        heading: `Is there a GTA 6 money glitch?`,
        paragraphs: [
          `We haven't seen a GTA 6 money glitch confirmed by a major outlet. Methods shared online are unverified and may be patched, so we don't list them. GTA Online money glitches are a different game.`,
        ],
      },
    ],
    faq: [
      { q: `Is there a money cheat in GTA 6?`, a: `Yes. The $250,000 cheat is Up, Right, Down, Left, Up, Left, Down, Right. It unlocks after the story once you make $250,000 from fenced goods, and since cheats disable saving you can't keep the money.` },
      { q: `What is the fastest way to make money in GTA 6?`, a: `Illegal Operations and robberies with safes, then selling everything you steal to a fence. IGN says one early camp near Key Lento pays close to $2,000 if looted fully.` },
      { q: `Is there a GTA 6 money glitch?`, a: `We haven't found one verified by a major outlet. Unverified methods circulate online and may be patched.` },
      { q: `How do I open safes in GTA 6?`, a: `Find the code on site, make an employee tell you, or blow the safe with Sticky Bombs bought at Ammu-Nation. See our GTA 6 safe codes guide.` },
      { q: `Can you keep money from cheats in GTA 6?`, a: `No. Using any cheat disables saving for that session, so money from the $250,000 cheat is lost when you reload.` },
    ],
    sources: [
      IGN('Best_Ways_to_Make_Money_Early', 'IGN: Best Ways to Make Money Early'),
      IGN('Nova_Auto_Junkyard', 'IGN: Nova Auto Junkyard'),
      { name: 'PC Gamer: GTA 6 safe codes', url: 'https://www.pcgamer.com/games/grand-theft-auto/gta-6-safe-codes-combinations/' },
      { name: 'Rock Paper Shotgun: GTA 6 cheats', url: 'https://www.rockpapershotgun.com/gta-6-cheats-list' },
      { name: 'Eurogamer: All GTA 6 cheats', url: 'https://www.eurogamer.net/all-gta-6-cheats' },
    ],
    related: ['/cheats/gta-6/250-000/', '/guides/safe-codes/', '/cheats/gta-6/how-to-activate-cheats/'],
    updated: '2026-11-22',
  },
  {
    slug: 'safe-codes',
    title: 'GTA 6 Safe Codes and Door Codes (Lab Code, Brian’s Lockup)',
    short: 'Safe & door codes',
    description: `GTA 6 safe and door codes: the Lab Fees acid lab code (0420), Brian's Lockup (7700), how to find any safe code, and how to blow a safe with Sticky Bombs.`,
    answer: `In the Lab Fees mission the acid lab door code is 0420 and Brian's Lockup is 7700, as reported by GTABase, PowerPyx and Beebom. For other safes, look for the code written on site, force an employee to tell you, or blow the safe open with Sticky Bombs from Ammu-Nation. PC Gamer notes many codes are fixed but some appear to be random.`,
    sections: [
      {
        heading: `Known GTA 6 door and safe codes`,
        bullets: [
          `Moonstone Boutique acid lab door (Lab Fees): 0420. The clerk tells you, or it's on a notepad in the room. Reported by GTABase, PowerPyx and Beebom.`,
          `Brian's Lockup door (Lab Fees): 7700. Reported by GTABase, PowerPyx and Beebom. The two codes aren't interchangeable.`,
          `Nova Auto Junkyard safe: 7777, reported by Beebom only, so treat it as unconfirmed. IGN says the safe holds $2,313.`,
        ],
      },
      {
        heading: `How to find any safe code`,
        bullets: [
          `Search the location: PC Gamer says codes are often written on notes, boards or pictures. Use Focus (L3 + R3) to spot them.`,
          `Interrogate staff: aim at an employee and use the Threaten or "Safe Code?" prompt.`,
          `Check maps and notes: IGN says the map in the Brooks Boatworks side building shows three codes, which also lead to the La Cascara Motel safe.`,
          `Main story safes give you the code automatically.`,
        ],
      },
      {
        heading: `No code? Use Sticky Bombs`,
        paragraphs: [
          `IGN, PowerPyx and GTABase all say you can skip the code by blowing the safe with Sticky Bombs bought at Ammu-Nation. The Kingpin Bowling safe is in the small north-east office. Beebom warns that explosives can hurt your criminal profile.`,
        ],
      },
    ],
    faq: [
      { q: `What is the lab code in GTA 6?`, a: `0420. In the Lab Fees mission, the Moonstone Boutique's back room (acid lab) opens with 0420, according to GTABase, PowerPyx and Beebom.` },
      { q: `What is the code to Brian's lockup in GTA 6?`, a: `7700, according to GTABase, PowerPyx and Beebom.` },
      { q: `What is the Kingpin Bowling safe code in GTA 6?`, a: `We haven't confirmed a code from two outlets. IGN, PowerPyx and GTABase recommend blowing the safe in the north-east office with Sticky Bombs.` },
      { q: `Are GTA 6 safe codes random?`, a: `Some are. PC Gamer reports many robbery safe codes are fixed but some appear to be random, so check the clue in your own game if a listed code fails.` },
      { q: `How do you open a safe without the code in GTA 6?`, a: `Blow it open with Sticky Bombs from Ammu-Nation.` },
    ],
    sources: [
      { name: 'GTABase: Lab Fees', url: 'https://www.gtabase.com/gta-6/missions/lab-fees' },
      { name: 'PowerPyx: Lab Fees', url: 'https://www.powerpyx.com/?p=369723' },
      { name: 'Beebom: GTA 6 safe codes', url: 'https://beebom.com/gta-6-safe-codes/' },
      { name: 'PC Gamer: GTA 6 safe codes', url: 'https://www.pcgamer.com/games/grand-theft-auto/gta-6-safe-codes-combinations/' },
      IGN('Kingpin_Bowling', 'IGN: Kingpin Bowling'),
      IGN('Brooks_Boatworks', 'IGN: Brooks Boatworks'),
      IGN('Nova_Auto_Junkyard', 'IGN: Nova Auto Junkyard'),
      { name: 'GTABase: Hit Kingpin Bowling', url: 'https://www.gtabase.com/gta-6/missions/hit-kingpin-bowling' },
    ],
    related: ['/guides/how-to-make-money-fast/', '/cheats/gta-6/', '/cheats/gta-6/250-000/'],
    updated: '2026-11-22',
  },
  {
    slug: 'how-long-is-gta-6',
    title: 'How Long Is GTA 6? Chapters, Missions and When Cheats Unlock',
    short: 'How long is GTA 6?',
    description: `How long is GTA 6: five chapters, about 91 story missions, roughly 80 hours for a Rockstar developer's playthrough. Cheats unlock only after the story ends.`,
    answer: `GTA 6 has five chapters and about 91 main story missions (Dexerto and Rock Paper Shotgun count 91; Insider Gaming counts 93). Rockstar North's Rob Nelson said his playthrough of the story plus optional objectives took around 80 hours, as reported by Stevivor. Cheats only unlock once you finish the story.`,
    sections: [
      {
        heading: `How many chapters are in GTA 6?`,
        paragraphs: [`Five, according to Insider Gaming and Dexerto, in a chapter structure similar to Red Dead Redemption 2. Chapter 1 is called Just Like Paradise and IGN counts 23 story missions in it.`],
      },
      {
        heading: `How many missions are in GTA 6?`,
        paragraphs: [`About 91 main story missions (Dexerto, Rock Paper Shotgun). Insider Gaming counts 93, likely because it treats some required story activities as separate missions. There are many optional missions on top.`],
      },
      {
        heading: `How long does it take to beat GTA 6?`,
        bullets: [
          `Around 80 hours: Rob Nelson's own playthrough of the main story plus optional objectives (via Stevivor).`,
          `Stevivor estimates 45 to 55 hours for the main story alone and 120+ hours for full completion.`,
        ],
      },
      {
        heading: `When do cheats unlock?`,
        paragraphs: [`Only after the final story mission. Then a Cheats option appears in the Progress menu and each cheat unlocks through its own challenge. See how to activate cheats.`],
      },
    ],
    faq: [
      { q: `How many chapters are in GTA 6?`, a: `Five, according to Insider Gaming and Dexerto.` },
      { q: `How many missions are in GTA 6?`, a: `About 91 main story missions according to Dexerto and Rock Paper Shotgun; Insider Gaming counts 93.` },
      { q: `How long is the GTA 6 story?`, a: `Rockstar North's Rob Nelson said his playthrough of the story plus optional objectives took about 80 hours (Stevivor). Stevivor estimates 45 to 55 hours for the main story only.` },
      { q: `How many missions are in Chapter 1 of GTA 6?`, a: `23 story missions, according to IGN's walkthrough.` },
      { q: `Do you need to finish GTA 6 to use cheats?`, a: `Yes. Cheats unlock only after you complete the main story, then each needs its own requirement.` },
    ],
    sources: [
      { name: 'Insider Gaming: every chapter and mission', url: 'https://insider-gaming.com/every-chapter-story-mission-in-gta-6-game-length-explained/' },
      { name: 'Dexerto: GTA 6 mission list', url: 'https://www.dexerto.com/wikis/gta-6/mission-list/' },
      { name: 'Rock Paper Shotgun: GTA 6 cheats', url: 'https://www.rockpapershotgun.com/gta-6-cheats-list' },
      { name: 'Stevivor: How long is GTA 6?', url: 'https://stevivor.com/guides/how-long-is-gta-6/' },
      IGN('Walkthrough', 'IGN: GTA 6 walkthrough'),
    ],
    related: ['/cheats/gta-6/how-to-activate-cheats/', '/cheats/gta-6/tracker/', '/guides/how-to-save/'],
    updated: '2026-11-22',
  },
  {
    slug: 'how-to-save',
    title: 'How to Save in GTA 6 (Manual Saves, Autosave and Cheats)',
    short: 'How to save',
    description: `How to save in GTA 6: pause menu, Game, Save Game in free roam. 15 manual slots, no saving during missions, why autosave isn't enough, and saving before cheats.`,
    answer: `To save in GTA 6, pause in free roam, open the Game tab and choose Save Game, then pick one of 15 manual slots (Dexerto). Saving is greyed out during missions. The game also autosaves, but Kotaku warns it doesn't happen as often as you might think, so save manually before quitting, and always before using cheats, which disable saving.`,
    sections: [
      {
        heading: `How to make a manual save`,
        bullets: [`Be in free roam, not a mission.`, `Pause, open the Game tab, select Save Game.`, `Pick an empty slot or overwrite one. There are 15 slots.`],
      },
      {
        heading: `Autosave and replaying missions`,
        paragraphs: [`GTA 6 autosaves at points in the story, but not constantly. Dexerto notes there is no mission replay menu: loading an older save is the only way to replay a mission, so it suggests a new slot per chapter.`],
      },
      {
        heading: `Saving and cheats`,
        paragraphs: [`Using any cheat disables saving and trophies for the session. Save to a slot first, then reload it to return to normal play.`],
      },
    ],
    faq: [
      { q: `How do you save in GTA 6?`, a: `Pause in free roam, open the Game tab and choose Save Game, then pick a slot.` },
      { q: `Does GTA 6 autosave?`, a: `Yes, at points in the game, but Kotaku warns it doesn't autosave as often as you might think. Save manually before quitting.` },
      { q: `How many save slots does GTA 6 have?`, a: `15 manual save slots, according to Dexerto.` },
      { q: `Can you save during a mission in GTA 6?`, a: `No. The save option is greyed out until you're back in free roam.` },
      { q: `Can you replay missions in GTA 6?`, a: `Not from a menu. Dexerto says loading an older save is the only way, so keep one save per chapter.` },
      { q: `Can you save after using cheats in GTA 6?`, a: `No. Cheats disable saving for that session, so save before you use one.` },
    ],
    sources: [
      { name: 'Dexerto: How to save in GTA 6', url: 'https://www.dexerto.com/wikis/gta-6/how-to-save/' },
      { name: 'Kotaku: Be careful with auto saving in GTA 6', url: 'https://kotaku.com/be-careful-with-auto-saving-in-gta-6-it-doesnt-happen-as-often-as-you-think-2000758487' },
      { name: 'Eurogamer: All GTA 6 cheats', url: 'https://www.eurogamer.net/all-gta-6-cheats' },
    ],
    related: ['/cheats/gta-6/how-to-activate-cheats/', '/guides/how-long-is-gta-6/'],
    updated: '2026-11-22',
  },
  {
    slug: 'first-person-mode',
    title: 'Does GTA 6 Have First Person Mode? How to Switch Camera Views',
    short: 'First person mode',
    description: `GTA 6 has no full first-person mode. How to get a first-person view on foot and on your phone, and how to change camera height and cinematic view.`,
    answer: `No, GTA 6 doesn't have a full first-person mode. Engadget reports you can get a first-person look on foot by holding the left trigger and clicking the right stick, and turn on a first-person view when looking at your phone in the Camera settings. In vehicles, hold Down on the D-pad to change camera height or switch to the cinematic camera.`,
    sections: [
      {
        heading: `Limited first-person views`,
        bullets: [
          `On foot: hold the left trigger (L2/LT) and click the right stick to look around up close.`,
          `Phone: enable first-person when using the phone in Settings, Camera. It also applies while driving.`,
        ],
      },
      {
        heading: `Other camera options`,
        bullets: [
          `Hold Down on the D-pad in a vehicle to pick one of three camera heights or the cinematic camera.`,
          `The Camera settings tab adjusts on-foot height and follow speeds for each vehicle type.`,
        ],
      },
    ],
    faq: [
      { q: `Does GTA 6 have first person mode?`, a: `Not a full one. You get limited first-person views on foot and when using the phone (Engadget).` },
      { q: `How do you go first person in GTA 6?`, a: `On foot, hold the left trigger and click the right stick. For the phone, enable first-person in the Camera settings.` },
      { q: `How do you change the camera in GTA 6?`, a: `In a vehicle, hold Down on the D-pad to choose a camera height or the cinematic camera.` },
    ],
    sources: [{ name: 'Engadget: How to switch camera views in GTA 6', url: 'https://www.engadget.com/2321960/gta-6-how-to-switch-camera-views/' }],
    related: ['/cheats/gta-6/', '/guides/how-to-save/'],
    updated: '2026-11-22',
  },
  {
    slug: 'how-to-get-car-from-impound',
    title: 'How to Get Your Car Back From the Impound in GTA 6',
    short: 'Car impound',
    description: `How to get an impounded car back in GTA 6: the Scooter Bros app (free daily retrieval with Premium) or breaking into the police impound. Plus how to register a car.`,
    answer: `If police impound your personal vehicle in GTA 6, IGN says you can get it back legally through the Scooter Bros phone app, whose Premium tier includes one free impound retrieval per day, or illegally by hopping the fence at the police impound and smashing through the gate. Anything stored in the car is impounded with it.`,
    sections: [
      {
        heading: `The legal way: Scooter Bros`,
        bullets: [
          `You get the Scooter Bros app early in Chapter 2, after registering your first vehicle with Moses.`,
          `Scooter Bros Premium gives three free deliveries a day (five with GTA+) and one free impound retrieval a day.`,
          `Retrieving an impounded car uses up your remaining free deliveries for that day.`,
        ],
      },
      {
        heading: `The illegal way: break into the impound`,
        paragraphs: [`Hop the police impound fence, take your car and smash through the gate.`],
      },
    ],
    faq: [
      { q: `How do I get my car out of impound in GTA 6?`, a: `Use the Scooter Bros app (Premium includes one free impound retrieval a day) or break into the police impound and drive out through the gate.` },
      { q: `How do you register a car in GTA 6?`, a: `IGN says you register your first vehicle with Moses early in Chapter 2, which also unlocks the Scooter Bros app.` },
      { q: `Do you lose items in an impounded car in GTA 6?`, a: `They're impounded with the car, so you get them back when you recover it.` },
    ],
    sources: [IGN('How_to_Get_Car_From_Impound', 'IGN: How to Get Car From Impound')],
    related: ['/guides/how-to-make-money-fast/', '/cheats/gta-6/mtl-pumper/'],
    updated: '2026-11-22',
  },
];

export const guidePath = (slug: string) => `/guides/${slug}/`;
