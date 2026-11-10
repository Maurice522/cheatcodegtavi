// GTA 6 launches November 19, 2026. Reports say unlock times are staggered by
// region, with New Zealand first (Nov 19 midnight NZDT is Nov 18 11:00 UTC).
// The earliest possible moment, used to gate anything that should only open
// once the game is playable somewhere, is Nov 18 10:00 UTC (UTC+14 midnight).
export const LAUNCH_DATE_LABEL = 'November 19, 2026';
export const EARLIEST_UNLOCK_MS = Date.UTC(2026, 10, 18, 10, 0, 0);

/** Build-time check. The site rebuilds on a schedule, so this flips after launch. */
export function hasLaunched(now: number = Date.now()): boolean {
  return now >= EARLIEST_UNLOCK_MS;
}
