import type { APIRoute } from 'astro';
import { getReportedGta6Cheats, gta6CheatPath, reportedBy } from '../lib/gta6-cheats';

// A plain-text map of the site for AI assistants and answer engines
// (llmstxt.org). Generated at build time so the confirmed cheat list is current.
const SITE = 'https://cheatcodegtavi.com';

export const GET: APIRoute = async () => {
  const cheats = await getReportedGta6Cheats();
  const lines = [
    '# CheatCodeGTAVI.com',
    '',
    '> GTA 6 (GTA VI) cheat codes for PS5, checked hourly. A GTA 6 code is listed only when its exact input appears on an official Rockstar page or in articles from at least two independent major outlets published after the November 19, 2026 launch. Every source is linked. Codes are labeled "reported" until tested by us. GTA V codes are listed separately and labeled as GTA V.',
    '',
    'Key facts (as reported by Polygon and Eurogamer): GTA 6 has about 61 cheats in five groups (Player, Combat, Spawn Vehicle, Environment, Screen Filters). Cheats unlock only after the main story is finished, and each has its own unlock requirement. To enter one on PS5, take out the phone (D-pad Up), hold L1 and R1 on the home screen, then press the D-pad code. Using a cheat disables saving and trophies for that session. There are no GTA 6 phone-number cheats; 1-999 numbers are GTA V codes.',
    '',
    '## GTA 6 cheats',
    `- [Confirmed GTA 6 cheat codes](${SITE}/cheats/gta-6/): every confirmed code with its unlock requirement and sources`,
    `- [GTA 6 cheat unlock tracker](${SITE}/cheats/gta-6/tracker/): checklist of confirmed cheats and their requirements`,
    ...cheats.map(
      (c) =>
        `- [GTA 6 ${c.title} cheat](${SITE}${gta6CheatPath(c.slug)}): ${c.ps5?.join(', ') ?? 'code not reported'}${c.unlock ? `; unlock: ${c.unlock}` : ''} (reported by ${reportedBy(c)})`,
    ),
    '',
    '## GTA V cheats and comparison',
    `- [All cheat codes hub](${SITE}/cheats/): confirmed GTA 6 cheats plus all 35 GTA V cheats with PS5 inputs`,
    `- [GTA 5 vs GTA 6 cheat codes](${SITE}/cheats/gta5-vs-gta6/): how the two games' cheat systems differ`,
    `- [Cheat codes FAQ](${SITE}/faq/)`,
    '',
    '## News and guides',
    `- [GTA 6 leaks and news](${SITE}/leaks/): sourced news, labeled official, confirmed or rumor`,
    `- [GTA 6 release time](${SITE}/gta-6-release-time/)`,
    `- [Characters](${SITE}/characters/) and [locations](${SITE}/locations/)`,
    '',
    '## About',
    `- [About](${SITE}/about/), [Editorial policy](${SITE}/editorial-policy/), [Contact](${SITE}/contact/)`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
