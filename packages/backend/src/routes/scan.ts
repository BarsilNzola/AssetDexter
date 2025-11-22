// src/routes/scan.ts
import { Router } from 'express';
import { OnChainDataService } from '../services/data-ingestion/on-chain';
import { DeFiLlamaService } from '../services/data-ingestion/defi-llama';
import { CreatorBidService } from '../services/data-ingestion/creatorbid';
import { DiscoveryService } from '../services/data-ingestion/discovery-service';
import { RarityScorer } from '../services/ai-models/rarity-scorer';
import { RiskAssessor } from '../services/ai-models/risk-assessor';
import { MarketPredictor } from '../services/ai-models/market-predictor';
import { SimpleCache } from '../services/cache/simple-cache';
import { RWA, RWAAnalysis } from '../../../shared/src/types/rwa';
import { AssetType, RarityTier, RiskTier } from '../types/contracts';

const router = Router();
const onChainService = new OnChainDataService();
const defiLlamaService = new DeFiLlamaService();
const creatorBidService = new CreatorBidService();
const discoveryService = new DiscoveryService();
const rarityScorer = new RarityScorer();
const riskAssessor = new RiskAssessor();
const marketPredictor = new MarketPredictor();
const cache = new SimpleCache();

// Discover assets from all sources
router.post('/discover-assets', async (req, res) => {
  try {
    console.log('Starting asset discovery from all sources...');
    const discoveredAssets = await discoveryService.discoverAssetsFromSources();
    
    console.log(`Discovered ${discoveredAssets.length} assets from sources`);
    
    // Convert BigInt values to strings for JSON serialization
    const serializedAssets = discoveredAssets.map(asset => ({
      ...asset,
      currentValue: asset.currentValue.toString(),
      yieldRate: asset.yieldRate.toString()
    }));
    
    res.json({
      total: serializedAssets.length,
      assets: serializedAssets,
      message: `Discovered ${serializedAssets.length} assets from data sources`
    });
  } catch (error) {
    console.error('Asset discovery error:', error);
    res.status(500).json({ 
      error: 'Failed to discover assets from sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get discovered assets from contract
router.get('/discover', async (req, res) => {
  try {
    console.log('Fetching discovered assets from contract...');
    const discoveredAssets = await discoveryService.getAllDiscoveredAssets();
    
    res.json({
      total: discoveredAssets.length,
      assets: discoveredAssets,
      message: discoveredAssets.length === 0 ? 
        'No assets discovered in contract yet' : 
        'Assets retrieved successfully from contract'
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discovered assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scan a specific asset
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
      600
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

// Scan all discovered assets
router.post('/scan-discovered', async (req, res) => {
  try {
    console.log('Scanning all discovered assets...');
    const discoveredAssets = await discoveryService.getAllDiscoveredAssets();
    
    if (discoveredAssets.length === 0) {
      return res.json({
        totalScanned: 0,
        assets: [],
        message: 'No assets to scan - contract has no discovered assets yet'
      });
    }
    
    const scanResults = [];
    for (const asset of discoveredAssets) {
      try {
        const analysis = await performAnalysis(asset.address, asset.chainId);
        scanResults.push({
          asset,
          analysis
        });
      } catch (error) {
        console.error(`Failed to scan ${asset.name}:`, error);
      }
    }
    
    res.json({
      totalScanned: scanResults.length,
      assets: scanResults
    });
  } catch (error) {
    console.error('Bulk scan error:', error);
    res.status(500).json({ 
      error: 'Failed to scan discovered assets',
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

// Helper methods for analysis
function calculateHolderDistribution(holders: number, totalSupply: number): number {
  if (holders === 0 || totalSupply === 0) return 0.5;
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

  const symbolUniqueness = symbol && symbol.length > 8 ? 0.2 : 0;
  return Math.min(1, baseUniqueness + symbolUniqueness);
}

function calculateCentralization(holderDistribution: number): number {
  return 1 - holderDistribution;
}

function calculateRegulatoryClarity(assetType: AssetType): number {
  const clarityScores = {
    [AssetType.TOKENIZED_TREASURY]: 0.7,
    [AssetType.REAL_ESTATE]: 0.8,
    [AssetType.ART]: 0.4,
    [AssetType.LUXURY_GOODS]: 0.3,
    [AssetType.PRIVATE_CREDIT]: 0.6
  };
  return clarityScores[assetType] || 0.5;
}

function estimateLiquidity(totalSupply: number): number {
  if (totalSupply > 1000000) return totalSupply * 0.1;
  if (totalSupply > 100000) return totalSupply * 0.05;
  if (totalSupply > 10000) return totalSupply * 0.02;
  return totalSupply * 0.01;
}

function calculateArtYield(artAsset: any): number {
  const bid = artAsset.currentBid || 0;
  const estimateHigh = artAsset.estimate?.high || bid * 1.5;
  const potentialGain = estimateHigh - bid;
  return potentialGain > 0 ? potentialGain / bid : 0;
}

// Placeholder async methods
async function calculateContractAge(contractAddress: string, chainId: number): Promise<number> {
  return 30;
}

async function checkAuditStatus(contractAddress: string): Promise<boolean> {
  return true;
}

async function calculateVolatility(contractAddress: string, chainId: number): Promise<number> {
  return 0.2;
}

async function fetchPriceHistory(contractAddress: string, chainId: number): Promise<number[]> {
  return [];
}

async function fetchVolumeHistory(contractAddress: string, chainId: number): Promise<number[]> {
  return [];
}

async function fetchSentiment(symbolOrAddress: string): Promise<number> {
  return 0.7;
}

async function performAnalysis(contractAddress: string, chainId: number): Promise<RWAAnalysis> {
  const [onChainData, defiData, artAssets] = await Promise.all([
    onChainService.fetchTokenData(contractAddress, chainId),
    defiLlamaService.fetchRWAPools(),
    creatorBidService.fetchArtAssets().catch(() => [])
  ]);

  const chainName = getChainName(chainId);
  
  const assetData = defiData.find(pool => 
    pool.chain === chainName && 
    (pool.symbol?.toLowerCase().includes(onChainData.symbol?.toLowerCase() || '') ||
     pool.project?.toLowerCase().includes(onChainData.name?.toLowerCase() || ''))
  );

  const artAsset = artAssets.find(art => 
    art.title?.toLowerCase().includes(onChainData.name?.toLowerCase() || '') ||
    art.artist?.toLowerCase().includes(onChainData.name?.toLowerCase() || '')
  );

  let assetType = AssetType.TOKENIZED_TREASURY;
  
  if (artAsset) {
    assetType = AssetType.ART;
  } else if (onChainData.symbol?.toLowerCase().includes('real') || onChainData.name?.toLowerCase().includes('real estate')) {
    assetType = AssetType.REAL_ESTATE;
  } else if (onChainData.symbol?.toLowerCase().includes('luxury') || onChainData.name?.toLowerCase().includes('luxury')) {
    assetType = AssetType.LUXURY_GOODS;
  } else if (onChainData.symbol?.toLowerCase().includes('credit') || onChainData.name?.toLowerCase().includes('credit')) {
    assetType = AssetType.PRIVATE_CREDIT;
  } else if (assetData?.project?.toLowerCase().includes('art') || assetData?.symbol?.toLowerCase().includes('art')) {
    assetType = AssetType.ART;
  }

  const artPrice = artAsset?.currentBid || 0;
  const artYield = artAsset ? calculateArtYield(artAsset) : 0;

  const rarityInput = {
    totalSupply: parseFloat(onChainData.totalSupply || '0'),
    holderCount: onChainData.holders || 0,
    holderDistribution: calculateHolderDistribution(onChainData.holders || 0, parseFloat(onChainData.totalSupply || '1')),
    age: await calculateContractAge(contractAddress, chainId) || 30,
    uniqueness: calculateUniqueness(assetType, onChainData.symbol),
    marketCap: assetData?.tvl || artPrice || parseFloat(onChainData.totalSupply || '0') * 1
  };

  const rarityScore = rarityScorer.calculateRarityScore(rarityInput);
  const rarityTier = rarityScorer.getRarityTier(rarityScore);
  const rarityTierEnum = mapRarityTier(rarityTier);

  const riskInput = {
    auditStatus: await checkAuditStatus(contractAddress),
    centralization: calculateCentralization(rarityInput.holderDistribution),
    liquidityDepth: assetData?.tvl || artPrice || estimateLiquidity(parseFloat(onChainData.totalSupply || '0')),
    regulatoryClarity: calculateRegulatoryClarity(assetType),
    volatility: await calculateVolatility(contractAddress, chainId) || 0.2
  };

  const riskAssessment = riskAssessor.assessRisk(riskInput);
  const riskTierEnum = mapRiskTier(riskAssessment.tier);

  const priceHistory = await fetchPriceHistory(contractAddress, chainId);
  const volumeHistory = await fetchVolumeHistory(contractAddress, chainId);
  
  const predictionInput = {
    priceHistory: priceHistory.length > 0 ? priceHistory : [100, 105, 102, 108, 110],
    volume: volumeHistory.length > 0 ? volumeHistory : [1000000, 1200000, 800000, 1500000, 1300000],
    yieldChanges: artYield > 0 ? [artYield * 0.95, artYield, artYield * 1.05] : 
                   assetData?.apy ? [assetData.apy * 0.95, assetData.apy, assetData.apy * 1.05] : 
                   [0.05, 0.052, 0.048, 0.055, 0.057],
    marketCap: assetData?.tvl || artPrice || rarityInput.marketCap,
    sentiment: await fetchSentiment(onChainData.symbol || contractAddress) || 0.7
  };

  const marketPrediction = marketPredictor.predictMarketMovement(predictionInput);

  const analysis: RWAAnalysis = {
    assetId: `${chainId}_${contractAddress}`,
    rarityScore,
    rarityTier: rarityTierEnum,
    riskTier: riskTierEnum,
    marketPrediction: marketPrediction.direction as 'Bullish' | 'Neutral' | 'Bearish',
    predictionConfidence: marketPrediction.confidence,
    healthScore: Math.round((rarityScore + riskAssessment.score) / 2),
    metrics: {
      liquidityDepth: assetData?.tvl || artPrice || riskInput.liquidityDepth,
      holderDistribution: rarityInput.holderDistribution,
      yield: artYield || assetData?.apy || 0,
      volatility: riskInput.volatility,
      age: rarityInput.age
    },
    timestamp: new Date()
  };

  console.log(`Analysis complete for ${onChainData.name}:`, {
    assetType: AssetType[assetType],
    rarity: RarityTier[rarityTierEnum],
    risk: RiskTier[riskTierEnum]
  });

  return analysis;
}

export default router;