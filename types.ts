
export interface PokemonCard {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  price: number;
  imageUrl: string;
  lastUpdated: string;
  condition: 'M' | 'NM' | 'LP' | 'MP' | 'HP' | 'D';
}

export interface Binder {
  id: string;
  name: string;
  cardIds: string[];
  color: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface Trade {
  id: string;
  date: string;
  givenCardIds: string[];
  givenCards: PokemonCard[]; // Store full card data for cards that were traded away
  receivedCards: PokemonCard[]; // Cards entering the system
  cashGiven: number;
  cashReceived: number;
  partnerName: string;
  notes: string;
  currency: string;
}

export interface AppState {
  collection: PokemonCard[];
  binders: Binder[];
  trades: Trade[];
  currency: 'USD' | 'CAD' | 'EUR' | 'GBP';
}