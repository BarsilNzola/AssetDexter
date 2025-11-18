import { Router } from 'express';
import { OnChainDataService } from '../services/data-ingestion/on-chain';
import { DeFiLlamaService } from '../services/data-ingestion/defi-llama';
import { RarityScorer } from '../services/ai-models/rarity-scorer';
import { RiskAssessor } from '../services/ai-models/risk-assessor';
import { MarketPredictor } from '../services/ai-models/market-predictor';
import { SimpleCache } from '../services/cache/simple-cache';
import { RWA, RWAAnalysis } from '../types/rwa';
import { AssetType, RarityTier, RiskTier } from '../types/contracts';

const router = Router();
const onChainService = new OnChainDataService();
const defiLlamaService = new DeFiLlamaService();
const rarityScorer = new RarityScorer();
const riskAssessor = new RiskAssessor();
const marketPredictor = new MarketPredictor();
const cache = new SimpleCache();

router.post('/', async (req, res) => {
  try {
    const { contractAddress, chainId } = req.body;

    if (!contractAddress || !chainId) {
      return res.status(400).json({ 
        error: 'contractAddress and chainId are required' 
      });
    }

    const cacheKey = `scan:${chainId}:${contractAddress}`;
    
    const analysis = await cache.getOrSet<RWAAnalysis>(
      cacheKey,
      async () => await performAnalysis(contractAddress, chainId),
      600 // 10 minutes cache
    );

    res.json(analysis);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      error: 'Failed to scan asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to map chain ID to chain name
function getChainName(chainId: number): string {
  const chainMap: { [key: number]: string } = {
    1: 'Ethereum',
    8453: 'Base', 
    59141: 'Linea',
    137: 'Polygon',
    42161: 'Arbitrum'
  };
  return chainMap[chainId] || 'Ethereum';
}

// Helper to map string rarity to enum
function mapRarityTier(tier: string): RarityTier {
  const tierMap: { [key: string]: RarityTier } = {
    'Common': RarityTier.COMMON,
    'Uncommon': RarityTier.UNCOMMON,
    'Rare': RarityTier.RARE,
    'Epic': RarityTier.EPIC,
    'Legendary': RarityTier.LEGENDARY
  };
  return tierMap[tier] || RarityTier.COMMON;
}

// Helper to map string risk to enum  
function mapRiskTier(tier: string): RiskTier {
  const tierMap: { [key: string]: RiskTier } = {
    'Low': RiskTier.LOW,
    'Medium': RiskTier.MEDIUM,
    'High': RiskTier.HIGH,
    'Speculative': RiskTier.SPECULATIVE
  };
  return tierMap[tier] || RiskTier.MEDIUM;
}

async function performAnalysis(contractAddress: string, chainId: number): Promise<RWAAnalysis> {
  // Fetch data from multiple sources
  const [onChainData, defiData] = await Promise.all([
    onChainService.fetchTokenData(contractAddress, chainId),
    defiLlamaService.fetchRWAPools()
  ]);

  const chainName = getChainName(chainId);
  const assetData = defiData.find(pool => 
    pool.chain === chainName && 
    pool.symbol?.toLowerCase().includes(onChainData.symbol?.toLowerCase() || '')
  );

  // Determine asset type based on characteristics
  let assetType = AssetType.TOKENIZED_TREASURY;
  if (onChainData.symbol?.toLowerCase().includes('art') || onChainData.name?.toLowerCase().includes('art')) {
    assetType = AssetType.ART;
  } else if (onChainData.symbol?.toLowerCase().includes('real') || onChainData.name?.toLowerCase().includes('real estate')) {
    assetType = AssetType.REAL_ESTATE;
  } else if (onChainData.symbol?.toLowerCase().includes('luxury') || onChainData.name?.toLowerCase().includes('luxury')) {
    assetType = AssetType.LUXURY_GOODS;
  } else if (onChainData.symbol?.toLowerCase().includes('credit') || onChainData.name?.toLowerCase().includes('credit')) {
    assetType = AssetType.PRIVATE_CREDIT;
  }

  // Calculate rarity score with improved inputs
  const rarityInput = {
    totalSupply: parseFloat(onChainData.totalSupply || '0'),
    holderCount: onChainData.holders || 0,
    holderDistribution: this.calculateHolderDistribution(onChainData.holders || 0, parseFloat(onChainData.totalSupply || '1')),
    age: await this.calculateContractAge(contractAddress, chainId) || 30,
    uniqueness: this.calculateUniqueness(assetType, onChainData.symbol),
    marketCap: assetData?.tvl || parseFloat(onChainData.totalSupply || '0') * 1 // Rough estimate
  };

  const rarityScore = rarityScorer.calculateRarityScore(rarityInput);
  const rarityTier = rarityScorer.getRarityTier(rarityScore);
  const rarityTierEnum = mapRarityTier(rarityTier);

  // Calculate risk assessment with improved inputs
  const riskInput = {
    auditStatus: await this.checkAuditStatus(contractAddress),
    centralization: this.calculateCentralization(rarityInput.holderDistribution),
    liquidityDepth: assetData?.tvl || this.estimateLiquidity(parseFloat(onChainData.totalSupply || '0')),
    regulatoryClarity: this.calculateRegulatoryClarity(assetType),
    volatility: await this.calculateVolatility(contractAddress, chainId) || 0.2
  };

  const riskAssessment = riskAssessor.assessRisk(riskInput);
  const riskTierEnum = mapRiskTier(riskAssessment.tier);

  // Market prediction with improved data
  const priceHistory = await this.fetchPriceHistory(contractAddress, chainId);
  const volumeHistory = await this.fetchVolumeHistory(contractAddress, chainId);
  
  const predictionInput = {
    priceHistory: priceHistory.length > 0 ? priceHistory : [100, 105, 102, 108, 110],
    volume: volumeHistory.length > 0 ? volumeHistory : [1000000, 1200000, 800000, 1500000, 1300000],
    yieldChanges: assetData?.apy ? [assetData.apy * 0.95, assetData.apy, assetData.apy * 1.05] : [0.05, 0.052, 0.048, 0.055, 0.057],
    marketCap: assetData?.tvl || rarityInput.marketCap,
    sentiment: await this.fetchSentiment(onChainData.symbol || contractAddress) || 0.7
  };

  const marketPrediction = marketPredictor.predictMarketMovement(predictionInput);

  const analysis: RWAAnalysis = {
    assetId: `${chainId}_${contractAddress}`,
    rarityScore,
    rarityTier: rarityTierEnum, // Use enum instead of any
    riskTier: riskTierEnum, // Use enum instead of any
    marketPrediction: marketPrediction.direction as 'Bullish' | 'Neutral' | 'Bearish',
    predictionConfidence: marketPrediction.confidence,
    healthScore: Math.round((rarityScore + riskAssessment.score) / 2),
    metrics: {
      liquidityDepth: assetData?.tvl || riskInput.liquidityDepth,
      holderDistribution: rarityInput.holderDistribution,
      yield: assetData?.apy || 0,
      volatility: riskInput.volatility,
      age: rarityInput.age
    },
    timestamp: new Date()
  };

  return analysis;
}

// Helper methods for improved analysis
function calculateHolderDistribution(holders: number, totalSupply: number): number {
  if (holders === 0 || totalSupply === 0) return 0.5;
  // Simple Gini coefficient approximation
  const concentration = holders / (totalSupply || 1);
  return Math.max(0, Math.min(1, 1 - concentration / 100));
}

function calculateUniqueness(assetType: AssetType, symbol?: string): number {
  const baseUniqueness = {
    [AssetType.TOKENIZED_TREASURY]: 0.3,
    [AssetType.REAL_ESTATE]: 0.6,
    [AssetType.ART]: 0.8,
    [AssetType.LUXURY_GOODS]: 0.9,
    [AssetType.PRIVATE_CREDIT]: 0.5
  }[assetType];

  // Adjust based on symbol uniqueness
  const symbolUniqueness = symbol && symbol.length > 8 ? 0.2 : 0;
  return Math.min(1, baseUniqueness + symbolUniqueness);
}

function calculateCentralization(holderDistribution: number): number {
  return 1 - holderDistribution; // Inverse of distribution
}

function calculateRegulatoryClarity(assetType: AssetType): number {
  const clarityScores = {
    [AssetType.TOKENIZED_TREASURY]: 0.7, // Fairly regulated
    [AssetType.REAL_ESTATE]: 0.8, // Well regulated
    [AssetType.ART]: 0.4, // Less regulated
    [AssetType.LUXURY_GOODS]: 0.3, // Minimal regulation
    [AssetType.PRIVATE_CREDIT]: 0.6 // Moderately regulated
  };
  return clarityScores[assetType] || 0.5;
}

function estimateLiquidity(totalSupply: number): number {
  // Rough liquidity estimate based on supply
  if (totalSupply > 1000000) return totalSupply * 0.1;
  if (totalSupply > 100000) return totalSupply * 0.05;
  if (totalSupply > 10000) return totalSupply * 0.02;
  return totalSupply * 0.01;
}

// Placeholder async methods (would be implemented with real data sources)
async function calculateContractAge(contractAddress: string, chainId: number): Promise<number> {
  // Would fetch contract creation timestamp from blockchain
  return 30; // Default 30 days
}

async function checkAuditStatus(contractAddress: string): Promise<boolean> {
  // Would check audit databases
  return true; // Assume audited for demo
}

async function calculateVolatility(contractAddress: string, chainId: number): Promise<number> {
  // Would calculate from price history
  return 0.2; // Default 20% volatility
}

async function fetchPriceHistory(contractAddress: string, chainId: number): Promise<number[]> {
  // Would fetch from price oracles/DEXs
  return [];
}

async function fetchVolumeHistory(contractAddress: string, chainId: number): Promise<number[]> {
  // Would fetch from DEXs
  return [];
}

async function fetchSentiment(symbolOrAddress: string): Promise<number> {
  // Would fetch from sentiment analysis APIs
  return 0.7; // Default neutral-positive sentiment
}

export default router;