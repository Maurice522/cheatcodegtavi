// Compact "24.1k" style count formatting. A precise five-digit view count on a
// pre-launch site reads as suspiciously fake — compact ones don't. Mirrored by
// the client-side formatCompactCount() in Layout.astro's count-up animation;
// keep the two in sync if this changes.
export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}
