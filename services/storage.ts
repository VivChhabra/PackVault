
import { AppState } from "../types";

const STORAGE_KEY = 'packvault_data_v2';

export const saveState = (state: AppState) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadState = (): AppState => {
  const data = sessionStorage.getItem(STORAGE_KEY);
  if (!data) return { collection: [], binders: [], trades: [], currency: 'USD' };
  try {
    const parsed = JSON.parse(data);
    // Migrate old trades to include givenCards if missing
    const migratedTrades = (parsed.trades || []).map((trade: any) => {
      if (!trade.givenCards && trade.givenCardIds) {
        // Try to find cards in collection (may not work for old trades)
        return {
          ...trade,
          givenCards: [] // Will be populated from collection if available
        };
      }
      return trade;
    });
    
    return {
      collection: parsed.collection || [],
      binders: parsed.binders || [],
      trades: migratedTrades,
      currency: parsed.currency || 'USD'
    };
  } catch {
    return { collection: [], binders: [], trades: [], currency: 'USD' };
  }
};
