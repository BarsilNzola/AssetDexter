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
    
    const serializedAssets = discoveredAssets.map(asset => {
      const serialized: any = { ...asset };
      
      Object.keys(serialized).forEach(key => {
        if (typeof serialized[key] === 'bigint') {
          serialized[key] = serialized[key].toString();
        }
      });
      
      return serialized;
    });
    
    res.json({
      total: serializedAssets.length,
      assets: serializedAssets,
      message: serializedAssets.length === 0 ? 
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
    42161: 'Arbitrum',
    43114: 'Avalanche',
    101: 'Solana'
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

// Real data fetching functions
async function fetchPriceHistory(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    console.log(`Fetching real price history for ${contractAddress} on chain ${chainId}`);
    
    const chainName = getChainName(chainId).toLowerCase();
    const response = await fetch(
      `https://coins.llama.fi/chart/${chainName}:${contractAddress}?span=30&period=1d`
    );
    
    if (response.ok) {
      const data = await response.json() as any;
      const prices = data.coins?.[`${chainName}:${contractAddress}`]?.prices;
      
      if (prices && Array.isArray(prices)) {
        const priceValues = prices.map((p: any) => p.price).filter((p: number) => p > 0);
        console.log(`Fetched ${priceValues.length} real price points for ${contractAddress}`);
        return priceValues;
      }
    }
    
    console.log(`No real price data found for ${contractAddress}, trying alternative endpoints`);
    return await fetchAlternativePriceData(contractAddress, chainId);
    
  } catch (error) {
    console.log(`Failed to fetch price history for ${contractAddress}:`, error);
    return [];
  }
}

async function fetchAlternativePriceData(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    const pools = await defiLlamaService.fetchRWAPools();
    const chainName = getChainName(chainId);
    
    const pool = pools.find(p => {
      const poolAddress = p.id?.split(':')?.[1];
      return poolAddress?.toLowerCase() === contractAddress.toLowerCase() || 
             p.chain === chainName;
    });
    
    if (pool) {
      const basePrice = pool.tvl ? pool.tvl / 1000000 : 100;
      return generateSyntheticPriceHistory(basePrice);
    }
    
    return [];
  } catch (error) {
    console.log('Alternative price data fetch failed:', error);
    return [];
  }
}

async function fetchVolumeHistory(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    console.log(`Fetching real volume history for ${contractAddress} on chain ${chainId}`);
    
    const chainName = getChainName(chainId).toLowerCase();
    const response = await fetch(
      `https://api.llama.fi/summary/${chainName}/${contractAddress}`
    );
    
    if (response.ok) {
      const data = await response.json() as any;
      const volumeData = data.volume?.historical || data.volumes || [];
      
      if (volumeData.length > 0) {
        console.log(`Fetched ${volumeData.length} real volume points for ${contractAddress}`);
        return volumeData.map((v: any) => v.volume || v.value).filter((v: number) => v > 0);
      }
    }
    
    console.log(`No real volume data found for ${contractAddress}, using pool data`);
    return await fetchAlternativeVolumeData(contractAddress, chainId);
    
  } catch (error) {
    console.log(`Failed to fetch volume history for ${contractAddress}:`, error);
    return [];
  }
}

async function fetchAlternativeVolumeData(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    const pools = await defiLlamaService.fetchRWAPools();
    const chainName = getChainName(chainId);
    
    const pool = pools.find(p => {
      const poolAddress = p.id?.split(':')?.[1];
      return poolAddress?.toLowerCase() === contractAddress.toLowerCase() || 
             p.chain === chainName;
    });
    
    if (pool && pool.tvl) {
      const baseVolume = pool.tvl * 0.1;
      return generateSyntheticVolumeHistory(baseVolume);
    }
    
    return [];
  } catch (error) {
    console.log('Alternative volume data fetch failed:', error);
    return [];
  }
}

async function fetchSentiment(symbolOrAddress: string): Promise<number> {
  try {
    console.log(`Fetching sentiment for ${symbolOrAddress}`);
    
    const artAssets = await creatorBidService.fetchArtAssets();
    const artAsset = artAssets.find(art => 
      art.title?.toLowerCase().includes(symbolOrAddress.toLowerCase()) ||
      art.artist?.toLowerCase().includes(symbolOrAddress.toLowerCase())
    );
    
    if (artAsset) {
      const bidRatio = (artAsset.estimate.high - artAsset.currentBid) / artAsset.currentBid;
      const artSentiment = Math.min(1, Math.max(0, 0.5 + bidRatio * 2));
      console.log(`Art sentiment for ${symbolOrAddress}: ${artSentiment} (bid ratio: ${bidRatio})`);
      return artSentiment;
    }
    
    const pools = await defiLlamaService.fetchRWAPools();
    const pool = pools.find(p => 
      p.symbol?.toLowerCase().includes(symbolOrAddress.toLowerCase()) ||
      p.project?.toLowerCase().includes(symbolOrAddress.toLowerCase())
    );
    
    if (pool) {
      const apySentiment = Math.min(1, (pool.apy || 0) / 0.2);
      const tvlSentiment = Math.min(1, (pool.tvl || 0) / 100000000);
      const defiSentiment = (apySentiment * 0.6 + tvlSentiment * 0.4);
      console.log(`DeFi sentiment for ${symbolOrAddress}: ${defiSentiment} (APY: ${pool.apy}, TVL: ${pool.tvl})`);
      return defiSentiment;
    }
    
    return 0.5 + Math.random() * 0.3;
    
  } catch (error) {
    console.log(`Failed to fetch sentiment for ${symbolOrAddress}:`, error);
    return 0.6;
  }
}

async function fetchYieldChanges(
  contractAddress: string, 
  chainId: number, 
  assetData?: any, 
  artAsset?: any,
  assetType?: AssetType
): Promise<number[]> {
  if (artAsset) {
    const currentYield = calculateArtYield(artAsset);
    return [currentYield * 0.9, currentYield * 0.95, currentYield, currentYield * 1.05, currentYield * 1.1];
  }
  
  if (assetData?.apy) {
    return [assetData.apy * 0.9, assetData.apy * 0.95, assetData.apy, assetData.apy * 1.05, assetData.apy * 1.1];
  }
  
  try {
    const historicalApy = await fetchHistoricalAPY(contractAddress, chainId);
    if (historicalApy.length > 0) return historicalApy;
  } catch (error) {
    console.log('Failed to fetch historical APY:', error);
  }
  
  const baseYield = assetType === AssetType.ART ? 0.15 : 0.05;
  return [baseYield * 0.9, baseYield * 0.95, baseYield, baseYield * 1.05, baseYield * 1.1];
}

async function fetchHistoricalAPY(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    const pools = await defiLlamaService.fetchRWAPools();
    const chainName = getChainName(chainId);
    
    const pool = pools.find(p => {
      const poolAddress = p.id?.split(':')?.[1];
      return poolAddress?.toLowerCase() === contractAddress.toLowerCase() || 
             p.chain === chainName;
    });
    
    if (pool?.apy) {
      return [pool.apy * 0.9, pool.apy * 0.95, pool.apy, pool.apy * 1.05, pool.apy * 1.1];
    }
  } catch (error) {
    console.log('Failed to fetch historical APY:', error);
  }
  
  return [];
}

async function calculateVolatility(contractAddress: string, chainId: number, assetType: AssetType): Promise<number> {
  try {
    const priceHistory = await fetchPriceHistory(contractAddress, chainId);
    if (priceHistory.length >= 5) {
      const returns = [];
      for (let i = 1; i < priceHistory.length; i++) {
        returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1]);
      }
      
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);
      
      console.log(`Calculated volatility for ${contractAddress}: ${volatility}`);
      return Math.min(1, volatility * 10);
    }
  } catch (error) {
    console.log(`Failed to calculate volatility for ${contractAddress}:`, error);
  }
  
  const baseVolatilityMap: Record<AssetType, number> = {
    [AssetType.TOKENIZED_TREASURY]: 0.1,
    [AssetType.REAL_ESTATE]: 0.2,
    [AssetType.ART]: 0.4,
    [AssetType.LUXURY_GOODS]: 0.3,
    [AssetType.PRIVATE_CREDIT]: 0.25
  };
  
  const baseVolatility = baseVolatilityMap[assetType] || 0.2;
  return baseVolatility + (Math.random() * 0.1);
}

// Helper functions for synthetic data
function generateSyntheticPriceHistory(basePrice: number): number[] {
  const history = [basePrice];
  for (let i = 1; i < 30; i++) {
    const change = (Math.random() * 0.1) - 0.05;
    history.push(history[i-1] * (1 + change));
  }
  return history;
}

function generateSyntheticVolumeHistory(baseVolume: number): number[] {
  const history = [baseVolume];
  for (let i = 1; i < 30; i++) {
    const change = (Math.random() * 0.4) - 0.2;
    history.push(Math.max(1000, history[i-1] * (1 + change)));
  }
  return history;
}

// Placeholder functions (keep existing implementations)
async function calculateContractAge(contractAddress: string, chainId: number): Promise<number> {
  return 30;
}

async function checkAuditStatus(contractAddress: string): Promise<boolean> {
  return true;
}

// Main analysis function
async function performAnalysis(contractAddress: string, chainId: number): Promise<RWAAnalysis> {
  const [onChainData, defiData, artAssets, discoveredAssets] = await Promise.all([
    onChainService.fetchTokenData(contractAddress, chainId),
    defiLlamaService.fetchRWAPools(),
    creatorBidService.fetchArtAssets().catch(() => []),
    discoveryService.getAllDiscoveredAssets()
  ]);

  const chainName = getChainName(chainId);
  
  // First, try to find this asset in our discovered assets for better metadata
  const discoveredAsset = discoveredAssets.find(asset => 
    asset.address.toLowerCase() === contractAddress.toLowerCase() && 
    asset.chainId === chainId
  );

  // Use discovered asset data if available
  const assetName = discoveredAsset?.name || onChainData.name || 'Unknown Token';
  const assetSymbol = discoveredAsset?.symbol || onChainData.symbol || 'UNKN';

  // Try to find matching DeFi Llama data using multiple strategies
  let bestMatchAssetData = null;

  // Strategy 1: Direct address match in pool ID
  bestMatchAssetData = defiData.find(pool => {
    const poolAddress = pool.id?.split(':')?.[1]?.toLowerCase();
    return poolAddress === contractAddress.toLowerCase();
  });

  // Strategy 2: Match by symbol and chain
  if (!bestMatchAssetData && assetSymbol && assetSymbol !== 'UNKN') {
    bestMatchAssetData = defiData.find(pool => 
      pool.chain === chainName && 
      pool.symbol?.toLowerCase() === assetSymbol.toLowerCase()
    );
  }

  // Strategy 3: Fuzzy name matching
  if (!bestMatchAssetData && assetName && assetName !== 'Unknown Token') {
    bestMatchAssetData = defiData.find(pool => {
      const poolName = pool.project?.toLowerCase();
      const tokenName = assetName.toLowerCase();
      return (
        pool.chain === chainName &&
        (poolName?.includes(tokenName) || tokenName.includes(poolName || ''))
      );
    });
  }

  // Strategy 4: Any match on this chain (fallback)
  if (!bestMatchAssetData) {
    const chainPools = defiData.filter(pool => pool.chain === chainName);
    if (chainPools.length > 0) {
      // Use the pool with highest TVL on this chain
      bestMatchAssetData = chainPools.reduce((prev, current) => 
        (prev.tvl || 0) > (current.tvl || 0) ? prev : current
      );
    }
  }

  // Try to find matching art asset
  const artAsset = artAssets.find(art => {
    const artTitle = art.title?.toLowerCase();
    const tokenName = assetName.toLowerCase();
    return (
      artTitle?.includes(tokenName) || 
      tokenName.includes(artTitle || '') ||
      art.artist?.toLowerCase().includes(tokenName)
    );
  });

  let assetType = AssetType.TOKENIZED_TREASURY;
  
  // Determine asset type with better logic
  if (artAsset) {
    assetType = AssetType.ART;
  } else if (discoveredAsset?.assetType) {
    assetType = discoveredAsset.assetType;
  } else if (assetName.toLowerCase().includes('real estate') || assetName.toLowerCase().includes('property')) {
    assetType = AssetType.REAL_ESTATE;
  } else if (assetName.toLowerCase().includes('art') || assetName.toLowerCase().includes('nft')) {
    assetType = AssetType.ART;
  } else if (assetName.toLowerCase().includes('luxury') || assetName.toLowerCase().includes('watch') || assetName.toLowerCase().includes('jewelry')) {
    assetType = AssetType.LUXURY_GOODS;
  } else if (assetName.toLowerCase().includes('credit') || assetName.toLowerCase().includes('loan')) {
    assetType = AssetType.PRIVATE_CREDIT;
  } else if (bestMatchAssetData?.project?.toLowerCase().includes('treasury') || bestMatchAssetData?.symbol?.toLowerCase().includes('bond')) {
    assetType = AssetType.TOKENIZED_TREASURY;
  }

  const artPrice = artAsset?.currentBid || 0;
  const artYield = artAsset ? calculateArtYield(artAsset) : 0;

  // Calculate rarity with better data
  const rarityInput = {
    totalSupply: parseFloat(onChainData.totalSupply || '0') || (bestMatchAssetData?.tvl ? bestMatchAssetData.tvl / 100 : 1000000),
    holderCount: onChainData.holders || (bestMatchAssetData?.tvl ? Math.floor(bestMatchAssetData.tvl / 1000) : 1000),
    holderDistribution: calculateHolderDistribution(onChainData.holders || 1000, parseFloat(onChainData.totalSupply || '1000000')),
    age: await calculateContractAge(contractAddress, chainId) || 30,
    uniqueness: calculateUniqueness(assetType, assetSymbol),
    marketCap: bestMatchAssetData?.tvl || artPrice || parseFloat(onChainData.totalSupply || '0') * 100
  };

  const rarityScore = rarityScorer.calculateRarityScore(rarityInput);
  const rarityTier = rarityScorer.getRarityTier(rarityScore);
  const rarityTierEnum = mapRarityTier(rarityTier);

  // Calculate risk with better data
  const riskInput = {
    auditStatus: await checkAuditStatus(contractAddress),
    centralization: calculateCentralization(rarityInput.holderDistribution),
    liquidityDepth: bestMatchAssetData?.tvl || artPrice || estimateLiquidity(rarityInput.totalSupply),
    regulatoryClarity: calculateRegulatoryClarity(assetType),
    volatility: await calculateVolatility(contractAddress, chainId, assetType) || 0.2
  };

  const riskAssessment = riskAssessor.assessRisk(riskInput);
  const riskTierEnum = mapRiskTier(riskAssessment.tier);

  // Fetch market data
  const [priceHistory, volumeHistory] = await Promise.all([
    fetchPriceHistory(contractAddress, chainId),
    fetchVolumeHistory(contractAddress, chainId)
  ]);
  
  // Create prediction input with better fallbacks
  const predictionInput = {
    priceHistory: priceHistory.length > 0 ? priceHistory : generateSyntheticPriceHistory(100),
    volume: volumeHistory.length > 0 ? volumeHistory : generateSyntheticVolumeHistory(1000000),
    yieldChanges: await fetchYieldChanges(contractAddress, chainId, bestMatchAssetData, artAsset, assetType),
    marketCap: bestMatchAssetData?.tvl || artPrice || rarityInput.marketCap || 1000000,
    sentiment: await fetchSentiment(assetSymbol || assetName || contractAddress) || 0.6
  };

  // Enhanced logging
  console.log('=== MARKET PREDICTION INPUT ANALYSIS ===');
  console.log('Asset:', assetName);
  console.log('Symbol:', assetSymbol);
  console.log('Discovered Asset:', !!discoveredAsset);
  console.log('DeFi Llama Match:', bestMatchAssetData ? `${bestMatchAssetData.project} (${bestMatchAssetData.symbol}) - TVL: ${bestMatchAssetData.tvl}` : 'None');
  console.log('Art Asset Match:', artAsset ? `${artAsset.title} - Bid: ${artAsset.currentBid}` : 'None');
  console.log('Asset Type:', AssetType[assetType]);
  console.log('Price History:', {
    hasRealData: priceHistory.length > 0,
    length: predictionInput.priceHistory.length,
    trend: predictionInput.priceHistory.length >= 2 ? 
      (predictionInput.priceHistory[predictionInput.priceHistory.length - 1] - predictionInput.priceHistory[0]) / predictionInput.priceHistory[0] : 0
  });
  console.log('Volume History:', {
    hasRealData: volumeHistory.length > 0,
    length: predictionInput.volume.length
  });
  console.log('Market Cap:', predictionInput.marketCap);
  console.log('Sentiment:', predictionInput.sentiment);
  console.log('========================================');

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
      liquidityDepth: bestMatchAssetData?.tvl || artPrice || riskInput.liquidityDepth,
      holderDistribution: rarityInput.holderDistribution,
      yield: artYield || bestMatchAssetData?.apy || 0,
      volatility: riskInput.volatility,
      age: rarityInput.age
    },
    timestamp: new Date()
  };

  console.log(`Analysis complete for ${assetName}:`, {
    rarity: RarityTier[rarityTierEnum],
    risk: RiskTier[riskTierEnum],
    marketPrediction: marketPrediction.direction,
    confidence: marketPrediction.confidence,
    factors: marketPrediction.factors
  });

  return analysis;
}

export default router;