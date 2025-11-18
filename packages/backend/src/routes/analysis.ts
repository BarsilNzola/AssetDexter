import { Router } from 'express';
import { RarityScorer } from '../services/ai-models/rarity-scorer';
import { RiskAssessor } from '../services/ai-models/risk-assessor';
import { MarketPredictor } from '../services/ai-models/market-predictor';

const router = Router();
const rarityScorer = new RarityScorer();
const riskAssessor = new RiskAssessor();
const marketPredictor = new MarketPredictor();

router.post('/rarity', async (req, res) => {
  try {
    const input = req.body;
    
    const score = rarityScorer.calculateRarityScore(input);
    const tier = rarityScorer.getRarityTier(score);

    res.json({
      score: Math.round(score),
      tier,
      breakdown: {
        supply: input.totalSupply,
        holders: input.holderCount,
        distribution: input.holderDistribution,
        age: input.age,
        uniqueness: input.uniqueness
      }
    });
  } catch (error) {
    console.error('Rarity analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate rarity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/risk', async (req, res) => {
  try {
    const input = req.body;
    
    const assessment = riskAssessor.assessRisk(input);

    res.json({
      tier: assessment.tier,
      score: Math.round(assessment.score),
      factors: {
        audit: input.auditStatus,
        centralization: input.centralization,
        liquidity: input.liquidityDepth,
        regulatory: input.regulatoryClarity,
        volatility: input.volatility
      }
    });
  } catch (error) {
    console.error('Risk analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to assess risk',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/market', async (req, res) => {
  try {
    const input = req.body;
    
    const prediction = marketPredictor.predictMarketMovement(input);

    res.json({
      direction: prediction.direction,
      confidence: prediction.confidence,
      factors: prediction.factors,
      technicals: {
        trend: input.priceHistory.length >= 2 ? 
          (input.priceHistory[input.priceHistory.length - 1] - input.priceHistory[0]) / input.priceHistory[0] : 0,
        volatility: input.priceHistory.length >= 2 ? 
          Math.sqrt(input.priceHistory.reduce((acc: number, val: number, idx: number, arr: number[]) => {
            if (idx === 0) return 0;
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            return acc + Math.pow(val - mean, 2);
          }, 0) / input.priceHistory.length) : 0
      }
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to predict market',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;