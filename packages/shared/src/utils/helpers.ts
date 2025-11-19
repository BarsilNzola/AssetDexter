import { RarityTier, RiskTier, AssetType } from '../types/rwa';

export function calculateGiniCoefficient(holdings: number[]): number {
  if (holdings.length === 0) return 0;

  const sortedHoldings = holdings.slice().sort((a, b) => a - b);
  const n = sortedHoldings.length;
  const sum = sortedHoldings.reduce((a: number, b: number) => a + b, 0);
  
  if (sum === 0) return 0;
  
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
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const mean = returns.reduce((a: number, b: number) => a + b, 0) / returns.length;
  const variance = returns.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

export function generateAssetId(chainId: number, address: string): string {
  return `${chainId}_${address.toLowerCase()}`;
}

export function formatRarityTier(tier: RarityTier): string {
  const tiers = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  return tiers[tier] || 'Unknown';
}

export function formatRiskTier(tier: RiskTier): string {
  const tiers = ['Low', 'Medium', 'High', 'Speculative'];
  return tiers[tier] || 'Unknown';
}

export function formatAssetType(type: AssetType): string {
  const types = ['Tokenized Treasury', 'Real Estate', 'Art', 'Luxury Goods', 'Private Credit'];
  return types[type] || 'Unknown';
}

export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toString();
}

export function calculateHealthScore(rarityScore: number, riskScore: number): number {
  return Math.round((rarityScore + (100 - riskScore)) / 2);
}

// AI model helper functions
export function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  
  const first = data[0];
  const last = data[data.length - 1];
  
  return (last - first) / first;
}

export function calculateSupplyScore(supply: number): number {
  if (supply <= 1000) return 1.0;
  if (supply <= 10000) return 0.8;
  if (supply <= 100000) return 0.6;
  if (supply <= 1000000) return 0.4;
  return 0.2;
}

export function calculateDistributionScore(giniCoefficient: number): number {
  return 1 - giniCoefficient;
}

export function calculateAgeScore(ageInDays: number): number {
  if (ageInDays >= 365) return 1.0;
  if (ageInDays >= 180) return 0.8;
  if (ageInDays >= 90) return 0.6;
  if (ageInDays >= 30) return 0.4;
  return 0.2;
}

export function calculateMarketCapScore(marketCap: number): number {
  if (marketCap >= 1000000000) return 1.0;
  if (marketCap >= 100000000) return 0.8;
  if (marketCap >= 10000000) return 0.6;
  if (marketCap >= 1000000) return 0.4;
  return 0.2;
}

export function calculateLiquidityScore(liquidity: number): number {
  if (liquidity >= 10000000) return 1.0;
  if (liquidity >= 1000000) return 0.8;
  if (liquidity >= 100000) return 0.6;
  if (liquidity >= 10000) return 0.4;
  return 0.2;
}