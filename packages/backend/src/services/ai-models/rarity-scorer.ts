import { RarityScoreInput } from '../../../../shared/src/types/analysis';
import { normalizeValue, calculateGiniCoefficient } from '../../../../shared/src/utils/helpers';

export class RarityScorer {
  calculateRarityScore(input: RarityScoreInput): number {
    const {
      totalSupply,
      holderCount,
      holderDistribution,
      age,
      uniqueness,
      marketCap
    } = input;

    // Normalize inputs
    const supplyScore = this.calculateSupplyScore(totalSupply);
    const distributionScore = this.calculateDistributionScore(holderDistribution);
    const ageScore = this.calculateAgeScore(age);
    const uniquenessScore = uniqueness;
    const marketCapScore = this.calculateMarketCapScore(marketCap);

    // Weighted combination
    const weights = {
      supply: 0.35,
      distribution: 0.25,
      age: 0.15,
      uniqueness: 0.15,
      marketCap: 0.10
    };

    const totalScore = 
      supplyScore * weights.supply +
      distributionScore * weights.distribution +
      ageScore * weights.age +
      uniquenessScore * weights.uniqueness +
      marketCapScore * weights.marketCap;

    return Math.min(100, Math.max(0, totalScore * 100));
  }

  private calculateSupplyScore(supply: number): number {
    if (supply <= 1000) return 1.0;
    if (supply <= 10000) return 0.8;
    if (supply <= 100000) return 0.6;
    if (supply <= 1000000) return 0.4;
    return 0.2;
  }

  private calculateDistributionScore(giniCoefficient: number): number {
    // Lower Gini = more equal distribution = higher score
    return 1 - giniCoefficient;
  }

  private calculateAgeScore(ageInDays: number): number {
    if (ageInDays >= 365) return 1.0;
    if (ageInDays >= 180) return 0.8;
    if (ageInDays >= 90) return 0.6;
    if (ageInDays >= 30) return 0.4;
    return 0.2;
  }

  private calculateMarketCapScore(marketCap: number): number {
    if (marketCap >= 1000000000) return 1.0;
    if (marketCap >= 100000000) return 0.8;
    if (marketCap >= 10000000) return 0.6;
    if (marketCap >= 1000000) return 0.4;
    return 0.2;
  }

  getRarityTier(score: number): string {
    if (score >= 90) return 'Legendary';
    if (score >= 75) return 'Epic';
    if (score >= 60) return 'Rare';
    if (score >= 40) return 'Uncommon';
    return 'Common';
  }
}