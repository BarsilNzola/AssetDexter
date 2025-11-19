import { RarityTier, RiskTier, AssetType } from '../types/rwa';
export declare function calculateGiniCoefficient(holdings: number[]): number;
export declare function normalizeValue(value: number, min: number, max: number): number;
export declare function calculateVolatility(prices: number[]): number;
export declare function generateAssetId(chainId: number, address: string): string;
export declare function formatRarityTier(tier: RarityTier): string;
export declare function formatRiskTier(tier: RiskTier): string;
export declare function formatAssetType(type: AssetType): string;
export declare function formatLargeNumber(num: number): string;
export declare function calculateHealthScore(rarityScore: number, riskScore: number): number;
export declare function calculateTrend(data: number[]): number;
export declare function calculateSupplyScore(supply: number): number;
export declare function calculateDistributionScore(giniCoefficient: number): number;
export declare function calculateAgeScore(ageInDays: number): number;
export declare function calculateMarketCapScore(marketCap: number): number;
export declare function calculateLiquidityScore(liquidity: number): number;
//# sourceMappingURL=helpers.d.ts.map