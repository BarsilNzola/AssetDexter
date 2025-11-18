export function calculateGiniCoefficient(holdings: number[]): number {
  if (holdings.length === 0) return 0;

  const sortedHoldings = holdings.slice().sort((a, b) => a - b);
  const n = sortedHoldings.length;
  const sum = sortedHoldings.reduce((a, b) => a + b, 0);
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sortedHoldings[i];
  }
  
  return numerator / (n * sum);
}

export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

export function generateAssetId(chainId: number, address: string): string {
  return `${chainId}_${address.toLowerCase()}`;
}