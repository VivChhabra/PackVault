import { PokemonCard } from "../types";
import { convertCurrency } from "./currency";
import { searchCardsWithRemoteBackup } from "./localCards";

// Use Vite's dev proxy (/api -> https://api.pokemontcg.io)
// so the browser doesn't hit CORS/network issues.
const API_BASE = "/api/v2";

type PokemonTcgApiCard = {
  id: string;
  name: string;
  number?: string;
  rarity?: string;
  set?: { name?: string };
  images?: { small?: string; large?: string };
  tcgplayer?: { prices?: Record<string, any> };
  cardmarket?: { prices?: Record<string, any> };
};

// Store last-known USD prices so the UI can still show something during
// temporary API outages.
const PRICE_CACHE_KEY = "packvault_price_cache_v1";

function readPriceCache(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PRICE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePriceCache(map: Record<string, number>) {
  try {
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function cacheUsdPrice(cardId: string, usd: number) {
  if (!cardId || !(usd > 0)) return;
  const cache = readPriceCache();
  // keep it small-ish
  cache[cardId] = usd;
  writePriceCache(cache);
}

function getCachedUsdPrice(cardId: string): number | null {
  const cache = readPriceCache();
  const v = cache[cardId];
  return typeof v === "number" && v > 0 ? v : null;
}

// Deterministic demo fallback when we have no pricing at all (e.g. local dataset).
function pseudoUsdPrice(card: { id: string; rarity?: string }): number {
  const id = card.id || "";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;

  const rarity = (card.rarity || "").toLowerCase();
  let base = 0.25;
  if (rarity.includes("common")) base = 0.25;
  else if (rarity.includes("uncommon")) base = 0.5;
  else if (rarity.includes("rare")) base = 1.5;
  if (rarity.includes("ultra")) base = 6;
  if (rarity.includes("secret")) base = 12;

  // Add a small deterministic spread (0..~8)
  const spread = (h % 800) / 100;
  const price = Math.max(0.1, base + spread);
  // round to cents
  return Math.round(price * 100) / 100;
}

export type SearchResult = { cards: PokemonCard[]; hasMore: boolean; total: number };

function abortableTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timer) };
}

function pickBestUsdPrice(card: PokemonTcgApiCard): number | null {
  // Many cards include a pricing block with market/mid/low etc, grouped by finish.
  const prices = card.tcgplayer?.prices;
  if (prices && typeof prices === "object") {
    // Prefer market, then mid
    const finishes = Object.values(prices).filter((v) => v && typeof v === "object") as any[];
    const market = finishes.map((f) => f.market).find((v) => typeof v === "number" && v > 0);
    if (typeof market === "number") return market;

    const mid = finishes.map((f) => f.mid).find((v) => typeof v === "number" && v > 0);
    if (typeof mid === "number") return mid;

    const low = finishes.map((f) => f.low).find((v) => typeof v === "number" && v > 0);
    if (typeof low === "number") return low;
  }

  // Fallback: Cardmarket (often EUR, but still useful for a demo)
  const cm = card.cardmarket?.prices;
  if (cm && typeof cm === "object") {
    const avg = cm.averageSellPrice;
    if (typeof avg === "number" && avg > 0) return avg;
  }

  return null;
}

function buildQuery(userQuery: string) {
  // Simple & reliable: name prefix search.
  // Examples:
  //  - charizard -> name:charizard*
  //  - pikachu v -> name:"pikachu v"*
  const q = userQuery.trim();
  if (!q) return "";
  if (q.includes(" ")) return `name:\"${q}\"*`;
  return `name:${q}*`;
}

export async function searchPokemonCard(
  query: string,
  currency: string = "USD",
  page: number = 1,
  pageSize: number = 50
): Promise<SearchResult> {
  const clean = query.trim();
  if (!clean) return { cards: [], hasMore: false, total: 0 };

  const url = new URL(`${API_BASE}/cards`, window.location.origin);
  url.searchParams.set("q", buildQuery(clean));
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("orderBy", "-set.releaseDate");

  const { controller, clear } = abortableTimeout(8000);

  let data: PokemonTcgApiCard[] = [];
  let total = 0;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const key = import.meta.env.VITE_POKEMON_TCG_API_KEY;
    if (key && String(key).trim()) headers["X-Api-Key"] = String(key).trim();

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Pokémon TCG API error ${res.status}: ${text || res.statusText}`);
    }

    const json = await res.json();
    data = json?.data ?? [];
    total = json?.totalCount ?? data.length;
  } catch (_err) {
    // ✅ FALLBACK: local mini dataset + remote GitHub backup when the live API is down (e.g., 504)
    const local = await searchCardsWithRemoteBackup(clean, pageSize);
    data = local as any;
    total = local.length;
  } finally {
    clear();
  }

  const cards: PokemonCard[] = data.map((c) => {
    // 1) Try live price blocks (if API response had them)
    let usd = pickBestUsdPrice(c);

    // 2) If we got a real price, cache it for future offline usage
    if (usd && usd > 0) cacheUsdPrice(c.id, usd);

    // 3) If no live price, try cached last-known price
    if (!usd || usd <= 0) {
      const cachedUsd = getCachedUsdPrice(c.id);
      if (cachedUsd) usd = cachedUsd;
    }

    // 4) As a last resort (e.g., local/remote dataset has no prices),
    // generate a deterministic demo estimate so the UI isn't all zeros.
    if (!usd || usd <= 0) usd = pseudoUsdPrice({ id: c.id, rarity: c.rarity });

    const value = usd ? convertCurrency(usd, currency) : 0;

    // Match the app's PokemonCard shape (types.ts)
    return {
      id: c.id,
      name: c.name,
      set: c.set?.name || "",
      number: c.number || "",
      rarity: c.rarity || "",
      price: Number.isFinite(value) ? value : 0,
      imageUrl: c.images?.small || c.images?.large || "",
      lastUpdated: new Date().toISOString(),
      condition: "NM",
    };
  });

  const hasMore = page * pageSize < total;
  return { cards, hasMore, total };
}

