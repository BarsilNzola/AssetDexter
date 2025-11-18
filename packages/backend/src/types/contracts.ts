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

export interface DiscoveryCardMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface MintDiscoveryParams {
  assetType: AssetType;
  rarity: RarityTier;
  risk: RiskTier;
  rarityScore: number;
  predictionScore: number;
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  currentValue: number;
  yieldRate: number;
  tokenURI: string;
}