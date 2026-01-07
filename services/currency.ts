// Currency conversion rates (approximate, should be updated periodically)
// Base currency is USD
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  CAD: 1.35,  // 1 USD = ~1.35 CAD
  EUR: 0.92,  // 1 USD = ~0.92 EUR
  GBP: 0.79,  // 1 USD = ~0.79 GBP
};

/**
 * Converts a price from USD to the target currency
 */
export const convertCurrency = (priceUSD: number, targetCurrency: string): number => {
  if (targetCurrency === 'USD' || !priceUSD) return priceUSD;
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  return priceUSD * rate;
};

/**
 * Converts a price from source currency to target currency
 */
export const convertPrice = (price: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency || !price) return price;
  
  // First convert to USD if needed
  let priceUSD = price;
  if (fromCurrency !== 'USD') {
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
    priceUSD = price / fromRate;
  }
  
  // Then convert to target currency
  if (toCurrency === 'USD') return priceUSD;
  const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
  return priceUSD * toRate;
};

