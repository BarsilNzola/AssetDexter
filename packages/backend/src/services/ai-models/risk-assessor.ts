import { RiskAssessmentInput } from '../../../../shared/src/types/analysis';

export class RiskAssessor {
  assessRisk(input: RiskAssessmentInput): { tier: string; score: number } {
    const {
      auditStatus,
      centralization,
      liquidityDepth,
      regulatoryClarity,
      volatility
    } = input;

    // Calculate individual risk scores
    const auditScore = auditStatus ? 1.0 : 0.3;
    const centralizationScore = 1 - centralization; // Lower centralization = better
    const liquidityScore = this.calculateLiquidityScore(liquidityDepth);
    const regulatoryScore = regulatoryClarity;
    const volatilityScore = 1 - Math.min(volatility, 1);

    // Weighted combination
    const weights = {
      audit: 0.25,
      centralization: 0.20,
      liquidity: 0.25,
      regulatory: 0.15,
      volatility: 0.15
    };

    const totalScore = 
      auditScore * weights.audit +
      centralizationScore * weights.centralization +
      liquidityScore * weights.liquidity +
      regulatoryScore * weights.regulatory +
      volatilityScore * weights.volatility;

    const riskScore = Math.min(100, Math.max(0, totalScore * 100));
    
    return {
      tier: this.getRiskTier(riskScore),
      score: riskScore
    };
  }

  private calculateLiquidityScore(liquidity: number): number {
    if (liquidity >= 10000000) return 1.0;
    if (liquidity >= 1000000) return 0.8;
    if (liquidity >= 100000) return 0.6;
    if (liquidity >= 10000) return 0.4;
    return 0.2;
  }

  private getRiskTier(score: number): string {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Speculative';
  }
}