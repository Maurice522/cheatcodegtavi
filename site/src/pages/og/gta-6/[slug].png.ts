import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { getReportedGta6Cheats, reportedBy, unlockClause, type Gta6Cheat } from '../../../lib/gta6-cheats';

// 1200x630 share card per confirmed GTA 6 cheat (Discord, X, Reddit, WhatsApp
// previews), plus one for the full list. Drawn as SVG and rasterised with sharp
// at build time. Arrows are drawn as shapes so they don't depend on fonts.
const W = 1200;
const H = 630;
const FONT = "'DejaVu Sans', 'Segoe UI', Arial, Helvetica, sans-serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

function arrow(dir: string, cx: number, cy: number, r: number) {
  const pts: Record<string, [number, number][]> = {
    Up: [[0, -1], [0.85, 0.6], [-0.85, 0.6]],
    Down: [[0, 1], [0.85, -0.6], [-0.85, -0.6]],
    Left: [[-1, 0], [0.6, -0.85], [0.6, 0.85]],
    Right: [[1, 0], [-0.6, -0.85], [-0.6, 0.85]],
  };
  const p = pts[dir];
  if (p) return `<polygon points="${p.map(([x, y]) => `${cx + x * r},${cy + y * r}`).join(' ')}" fill="#ffffff"/>`;
  return `<text x="${cx}" y="${cy + r * 0.45}" font-family="${FONT}" font-size="${r * 1.2}" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(dir)}</text>`;
}

function buttons(seq: string[], y: number) {
  const size = Math.min(92, Math.floor((W - 160 - (seq.length - 1) * 14) / seq.length));
  const total = seq.length * size + (seq.length - 1) * 14;
  let x = (W - total) / 2;
  return seq
    .map((b) => {
      const g = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.22}" fill="#1c1c2e" stroke="#ff2e9e" stroke-width="3"/>${arrow(b, x + size / 2, y + size / 2, size * 0.26)}`;
      x += size + 14;
      return g;
    })
    .join('');
}

function card({ eyebrow, title, seq, line1, line2 }: { eyebrow: string; title: string; seq: string[] | null; line1: string; line2: string }) {
  const titleSize = title.length > 26 ? 62 : 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="p" cx="15%" cy="10%" r="70%"><stop offset="0" stop-color="#ff2e9e" stop-opacity="0.45"/><stop offset="1" stop-color="#ff2e9e" stop-opacity="0"/></radialGradient>
    <radialGradient id="c" cx="90%" cy="95%" r="65%"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.35"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0b0b14"/>
  <rect width="${W}" height="${H}" fill="url(#p)"/>
  <rect width="${W}" height="${H}" fill="url(#c)"/>
  <text x="80" y="92" font-family="${FONT}" font-size="30" font-weight="700" fill="#ffffff">CHEATCODE<tspan fill="#ff2e9e">GTA</tspan>VI.COM</text>
  <text x="80" y="160" font-family="${FONT}" font-size="26" font-weight="700" fill="#22d3ee" letter-spacing="2">${esc(eyebrow.toUpperCase())}</text>
  <text x="80" y="${160 + titleSize + 10}" font-family="${FONT}" font-size="${titleSize}" font-weight="700" fill="#ffffff">${esc(clip(title, 34))}</text>
  ${seq?.length ? buttons(seq, 300) : ''}
  <text x="80" y="${seq?.length ? 470 : 360}" font-family="${FONT}" font-size="30" fill="#e5e7eb">${esc(clip(line1, 64))}</text>
  <text x="80" y="${seq?.length ? 520 : 410}" font-family="${FONT}" font-size="26" fill="#9ca3af">${esc(clip(line2, 72))}</text>
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#ff2e9e"/>
</svg>`;
}

export const getStaticPaths = (async () => {
  const cheats = await getReportedGta6Cheats();
  return [{ params: { slug: 'all' }, props: { cheat: null } }, ...cheats.map((cheat) => ({ params: { slug: cheat.slug }, props: { cheat } }))];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const cheat = (props as { cheat: Gta6Cheat | null }).cheat;
  const svg = cheat
    ? card({
        eyebrow: 'GTA 6 cheat code · PS5 & Xbox',
        title: `${cheat.title} cheat`,
        seq: cheat.ps5,
        line1: cheat.unlock ? `Unlock: ${unlockClause(cheat.unlock)}` : 'Unlocks after the main story',
        line2: `Hold L1 + R1 on the phone · Reported by ${reportedBy(cheat)}`,
      })
    : card({
        eyebrow: 'GTA 6 · GTA VI',
        title: 'All 61 GTA 6 cheats',
        seq: null,
        line1: 'Every cheat, its unlock requirement and every reported code',
        line2: 'Confirmed codes checked against major outlets every hour',
      });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
