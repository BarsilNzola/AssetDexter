export enum AssetType {
  TOKENIZED_TREASURY = 0,
  REAL_ESTATE = 1,
  ART = 2,
  LUXURY_GOODS = 3,
  PRIVATE_CREDIT = 4
}

export enum RarityTier {
  COMMON = 0,
  UNCOMMON = 1,
  RARE = 2,
  EPIC = 3,
  LEGENDARY = 4
}

export enum RiskTier {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  SPECULATIVE = 3
}

export interface RWA {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chainId: number;
  type: AssetType;
  totalSupply: string;
  price: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RWAAnalysis {
  assetId: string;
  rarityScore: number;
  rarityTier: RarityTier;
  riskTier: RiskTier;
  marketPrediction: 'Bullish' | 'Neutral' | 'Bearish';
  predictionConfidence: number;
  healthScore: number;
  metrics: {
    liquidityDepth: number;
    holderDistribution: number;
    yield: number;
    volatility: number;
    age: number;
  };
  timestamp: Date;
}

export interface DeFiLlamaPool {
  id: string;
  chain: string;
  project: string;
  symbol: string;
  tvl: number;
  apy: number;
}

export interface OnChainData {
  totalSupply: string;
  holders: string[];
  transfers: any[];
  price: number;
  liquidity: number;
}