export interface RarityScoreInput {
  totalSupply: number;
  holderCount: number;
  holderDistribution: number;
  age: number;
  uniqueness: number;
  marketCap: number;
}

export interface RiskAssessmentInput {
  auditStatus: boolean;
  centralization: number;
  liquidityDepth: number;
  regulatoryClarity: number;
  volatility: number;
}

export interface MarketPredictionInput {
  priceHistory: number[];
  volume: number[];
  yieldChanges: number[];
  marketCap: number;
  sentiment: number;
}