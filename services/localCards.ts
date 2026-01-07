export type LocalCard = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  set?: { name?: string; releaseDate?: string };
  images?: { small?: string; large?: string };
  // These pricing blocks exist on the official pokemontcg.io API.
  // The open-source dataset repo does not always include prices.
  tcgplayer?: { prices?: Record<string, any> };
  cardmarket?: { prices?: Record<string, any> };
};

let localCached: LocalCard[] | null = null;

export async function loadLocalCards(): Promise<LocalCard[]> {
  if (localCached) return localCached;
  const res = await fetch('/data/cards-mini.json');
  if (!res.ok) throw new Error('Failed to load local card dataset');
  localCached = await res.json();
  return localCached!;
}

function rankNameMatch(name: string, q: string): number {
  // Lower is better.
  if (name.startsWith(q)) return 0;
  const idx = name.indexOf(q);
  if (idx >= 0) return 10 + idx;
  return 9999;
}

export async function localSearchByName(query: string, limit = 50): Promise<LocalCard[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const cards = await loadLocalCards();
  const matches = cards
    .filter((c) => (c.name || '').toLowerCase().includes(q))
    .sort(
      (a, b) =>
        rankNameMatch((a.name || '').toLowerCase(), q) -
        rankNameMatch((b.name || '').toLowerCase(), q)
    )
    .slice(0, limit);

  return matches;
}

// --- Optional remote backup dataset (GitHub CDN) ---
// If the official API is down, we can still fetch card JSON from the open-source
// repo. We only download a handful of set files to keep this lightweight.
// Served via jsDelivr for reliable CORS:
//   https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/<setId>.json

const REMOTE_SET_FILES = [
  // Base / classic
  'base1',
  'base2',
  'base3',
  'base4',
  // Sword & Shield
  'swsh1',
  'swsh4',
  'swsh7',
  'swsh11',
  // Scarlet & Violet
  'sv1',
  'sv3',
];

let remoteCached: LocalCard[] | null = null;

async function loadRemoteCards(): Promise<LocalCard[]> {
  if (remoteCached) return remoteCached;
  const all: LocalCard[] = [];

  for (const setId of REMOTE_SET_FILES) {
    const url = `https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/${setId}.json`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (Array.isArray(json)) all.push(...(json as LocalCard[]));
    } catch {
      // best effort
    }
  }

  remoteCached = all;
  return all;
}

export async function searchCardsWithRemoteBackup(query: string, limit = 50): Promise<LocalCard[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const local = await localSearchByName(query, limit);
  if (local.length >= Math.min(10, limit)) return local;

  const remote = await loadRemoteCards();
  const remoteMatches = remote
    .filter((c) => (c.name || '').toLowerCase().includes(q))
    .sort(
      (a, b) =>
        rankNameMatch((a.name || '').toLowerCase(), q) -
        rankNameMatch((b.name || '').toLowerCase(), q)
    )
    .slice(0, limit);

  // Merge + de-dupe by id
  const seen = new Set<string>();
  const merged: LocalCard[] = [];
  for (const c of [...local, ...remoteMatches]) {
    if (!c?.id) continue;
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    merged.push(c);
    if (merged.length >= limit) break;
  }
  return merged;
}
