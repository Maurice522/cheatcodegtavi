// Client-only favorites store (localStorage). Shared by FavoriteButton.astro,
// the /favorites page, and the nav badge — anything that needs to read or
// change the saved list imports from here rather than duplicating the
// storage logic per component.

const FAVORITES_KEY = 'cheatcodegtavi:favorites';

export interface FavoriteEntry {
  slug: string;
  title: string;
  category: string;
  savedAt: string;
}

export function readFavorites(): FavoriteEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeFavorites(entries: FavoriteEntry[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private browsing, blocked storage) — skip silently
  }
  window.dispatchEvent(new CustomEvent('favorites:change', { detail: entries }));
}

export function toggleFavorite(entry: Omit<FavoriteEntry, 'savedAt'>): boolean {
  const entries = readFavorites();
  const idx = entries.findIndex((e) => e.slug === entry.slug);
  if (idx >= 0) {
    entries.splice(idx, 1);
    writeFavorites(entries);
    return false;
  }
  entries.unshift({ ...entry, savedAt: new Date().toISOString() });
  writeFavorites(entries);
  return true;
}

export function removeFavorite(slug: string) {
  writeFavorites(readFavorites().filter((e) => e.slug !== slug));
}

export function isFavorited(slug: string): boolean {
  return readFavorites().some((e) => e.slug === slug);
}
