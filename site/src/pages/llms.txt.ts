import type { APIRoute } from 'astro';
import { getReportedGta6Cheats, gta6CheatPath, reportedBy } from '../lib/gta6-cheats';
import { guides, guidePath } from '../data/guides';
import { getCheatCatalog, STATUS_LABEL, outletList } from '../lib/cheat-catalog';

// A plain-text map of the site for AI assistants and answer engines
// (llmstxt.org). Generated at build time so the confirmed cheat list is current.
const SITE = 'https://cheatcodegtavi.com';

export const GET: APIRoute = async () => {
  const cheats = await getReportedGta6Cheats();
  const catalog = await getCheatCatalog();
  const lines = [
    '# CheatCodeGTAVI.com',
    '',
    '> GTA 6 (GTA VI) cheat codes for PS5, checked hourly. A GTA 6 code is marked Confirmed only when its exact input appears on an official Rockstar page or in articles from at least two independent major outlets published after the November 19, 2026 launch. Every source is linked. Codes are labeled "reported" until tested by us. GTA V codes are listed separately and labeled as GTA V.',
    '',
    'Key facts (as reported by Polygon and Eurogamer): GTA 6 has about 61 cheats in five groups (Player, Combat, Spawn Vehicle, Environment, Screen Filters). Cheats unlock only after the main story is finished, and each has its own unlock requirement. To activate one, take out the phone (D-pad Up), hold L1 and R1 on PS5 or LB and RB on Xbox Series X|S, then press the D-pad code; codes are the same on both consoles. After the story, a Cheats option appears at the end of the Progress menu. Using a cheat disables saving and trophies/achievements for that session; reloading an earlier save turns cheats off. GTA 5 codes do not work in GTA 6. There are no GTA 6 phone-number cheats; 1-999 numbers are GTA V codes.',
    '',
    '## GTA 6 cheats',
    `- [Confirmed GTA 6 cheat codes](${SITE}/cheats/gta-6/): every confirmed code with its unlock requirement and sources`,
    `- [How to activate cheats in GTA 6](${SITE}/cheats/gta-6/how-to-activate-cheats/): PS5 and Xbox steps, unlocking, cheats menu, trophies, saving, turning cheats off, and why cheats don't work`,
    `- [GTA 6 cheat unlock tracker](${SITE}/cheats/gta-6/tracker/): checklist of confirmed cheats and their requirements`,
    ...cheats.map(
      (c) =>
        `- [GTA 6 ${c.title} cheat](${SITE}${gta6CheatPath(c.slug)}): ${c.ps5?.join(', ') ?? 'code not reported'}${c.unlock ? `; unlock: ${c.unlock}` : ''} (reported by ${reportedBy(c)})`,
    ),
    '',
    `## All ${catalog.length} GTA 6 cheats (full list, ${SITE}/cheats/gta-6/#all-cheats)`,
    'Status: "Confirmed" passed our two-outlet check; other codes show the outlets that reported them and may change.',
    ...catalog.map((c) => `- ${c.category}: ${c.name}${c.effect ? ` (${c.effect})` : ''}; unlock: ${c.unlock || 'not reported'}; code: ${c.codes.length ? c.codes.map((k) => `${k.ps5.join(', ')} [${outletList(k.outlets)}]`).join(' / ') : 'none reported yet'}; status: ${STATUS_LABEL[c.status]}`),
    '',
    '## GTA 6 guides',
    ...guides.map((g) => `- [${g.title}](${SITE}${guidePath(g.slug)}): ${g.answer}`),
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
