import { Router } from 'express';
import { DeFiLlamaService } from '../services/data-ingestion/defi-llama';
import { CreatorBidService } from '../services/data-ingestion/creatorbid';
import { SimpleCache } from '../services/cache/simple-cache';
import { RWA } from '../../../shared/src/types/rwa';
import { AssetType } from '../types/contracts';

const router = Router();
const defiLlamaService = new DeFiLlamaService();
const creatorBidService = new CreatorBidService();
const cache = new SimpleCache();

router.get('/', async (req, res) => {
  try {
    const { type, chain, limit = '50' } = req.query;
    
    const cacheKey = `assets:${type}:${chain}:${limit}`;
    
    const assets = await cache.getOrSet<RWA[]>(
      cacheKey,
      async () => await fetchAssets(
        type as string, 
        chain as string, 
        parseInt(limit as string)
      ),
      300 // 5 minutes cache
    );

    res.json(assets);
  } catch (error) {
    console.error('Assets fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `asset:${id}`;
    
    const asset = await cache.getOrSet<RWA | null>(
      cacheKey,
      async () => await fetchAssetById(id),
      600 // 10 minutes cache
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Asset fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to map string types to AssetType enum
function mapAssetType(type: string): AssetType {
  const typeMap: { [key: string]: AssetType } = {
    'tokenized-treasury': AssetType.TOKENIZED_TREASURY,
    'real-estate': AssetType.REAL_ESTATE,
    'art': AssetType.ART,
    'luxury-goods': AssetType.LUXURY_GOODS,
    'private-credit': AssetType.PRIVATE_CREDIT
  };
  
  return typeMap[type] || AssetType.TOKENIZED_TREASURY;
}

// Helper function to map AssetType enum back to string for filtering
function assetTypeToString(type: AssetType): string {
  const stringMap: { [key in AssetType]: string } = {
    [AssetType.TOKENIZED_TREASURY]: 'tokenized-treasury',
    [AssetType.REAL_ESTATE]: 'real-estate',
    [AssetType.ART]: 'art',
    [AssetType.LUXURY_GOODS]: 'luxury-goods',
    [AssetType.PRIVATE_CREDIT]: 'private-credit'
  };
  
  return stringMap[type];
}

async function fetchAssets(type?: string, chain?: string, limit: number = 50): Promise<RWA[]> {
  const [defiAssets, artAssets] = await Promise.allSettled([
    defiLlamaService.fetchRWAPools(),
    creatorBidService.fetchArtAssets().catch(() => [])
  ]);

  const assets: RWA[] = [];

  // Process DeFi assets
  if (defiAssets.status === 'fulfilled') {
    defiAssets.value.slice(0, limit).forEach(pool => {
      assets.push({
        id: pool.id,
        name: pool.project,
        symbol: pool.symbol,
        address: '', // Would map from pool data
        chainId: pool.chain === 'Ethereum' ? 1 : 8453,
        type: AssetType.TOKENIZED_TREASURY, // Use enum instead of string
        totalSupply: '0', // Would fetch from contract
        price: 0, // Would calculate from TVL and supply
        marketCap: pool.tvl,
        liquidity: pool.tvl,
        holders: 0, // Would fetch from indexer
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  // Process art assets
  if (artAssets.status === 'fulfilled') {
    artAssets.value.slice(0, Math.floor(limit / 2)).forEach(art => {
      assets.push({
        id: art.id,
        name: art.title,
        symbol: `ART-${art.id.slice(0, 8)}`,
        address: '', // Art assets may not have contract addresses
        chainId: 1, // Most art on Ethereum
        type: AssetType.ART, // Use enum instead of string
        totalSupply: '1', // Typically unique
        price: art.currentBid,
        marketCap: art.currentBid,
        liquidity: art.currentBid,
        holders: 1, // Single owner or fractionalized
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  // Apply filters
  let filteredAssets = assets;

  if (type) {
    const targetType = mapAssetType(type);
    filteredAssets = filteredAssets.filter(asset => asset.type === targetType);
  }

  if (chain) {
    const chainId = chain === 'ethereum' ? 1 : 8453;
    filteredAssets = filteredAssets.filter(asset => asset.chainId === chainId);
  }

  return filteredAssets.slice(0, limit);
}

async function fetchAssetById(id: string): Promise<RWA | null> {
  try {
    // Check if this is a discovery card token ID (numeric)
    if (/^\d+$/.test(id)) {
      const { ContractService } = await import('../services/contracts');
      const contractService = new ContractService();
      
      try {
        const cardData = await contractService.getDiscoveryCard(BigInt(id));
        
        // Map contract asset type to our AssetType enum
        let assetType: AssetType;
        switch (cardData.assetType) {
          case 0: assetType = AssetType.TOKENIZED_TREASURY; break;
          case 1: assetType = AssetType.REAL_ESTATE; break;
          case 2: assetType = AssetType.ART; break;
          case 3: assetType = AssetType.LUXURY_GOODS; break;
          case 4: assetType = AssetType.PRIVATE_CREDIT; break;
          default: assetType = AssetType.TOKENIZED_TREASURY;
        }
        
        return {
          id: id,
          name: cardData.assetName,
          symbol: cardData.assetSymbol,
          address: cardData.assetAddress,
          chainId: 59141,
          type: assetType,
          totalSupply: '1',
          price: Number(cardData.currentValue),
          marketCap: Number(cardData.currentValue),
          liquidity: 0,
          holders: 1,
          createdAt: new Date(Number(cardData.discoveryTimestamp) * 1000),
          updatedAt: new Date()
        };
      } catch (error) {
        console.warn('Not a valid discovery card ID or contract error:', id, error);
        // Continue to try other sources
      }
    }

    // Check if it's a contract address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      const { OnChainDataService } = await import('../services/data-ingestion/on-chain');
      const onChainService = new OnChainDataService();
      
      try {
        // Try Ethereum mainnet first
        const tokenData = await onChainService.fetchTokenData(id, 1);
        
        return {
          id: id,
          name: tokenData.name || 'Unknown Token',
          symbol: tokenData.symbol || 'UNKNOWN',
          address: id,
          chainId: 1,
          type: AssetType.TOKENIZED_TREASURY, // Default type for tokens
          totalSupply: tokenData.totalSupply || '0',
          price: 0, // Would need price oracle integration
          marketCap: 0,
          liquidity: 0,
          holders: tokenData.holders || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (error) {
        console.warn('Failed to fetch on-chain data for address:', id, error);
        // Continue to try other sources
      }
    }

    // Fall back to searching in our asset lists (DeFi Llama, art, etc.)
    const allAssets = await fetchAssets(undefined, undefined, 1000);
    const foundAsset = allAssets.find(asset => asset.id === id);
    
    if (foundAsset) {
      return foundAsset;
    }

    // Last resort: check if it's an asset that's been discovered in our contracts
    try {
      const { ContractService } = await import('../services/contracts');
      const contractService = new ContractService();
      
      // Check if this asset address has been discovered
      const isDiscovered = await contractService.isAssetDiscovered(id);
      if (isDiscovered) {
        // This means the asset exists in our contract but we don't have full details
        // Return a basic asset object
        return {
          id: id,
          name: 'Discovered RWA Asset',
          symbol: 'RWA',
          address: id,
          chainId: 59141, // Linea Sepolia
          type: AssetType.TOKENIZED_TREASURY, // Default type
          totalSupply: '0',
          price: 0,
          marketCap: 0,
          liquidity: 0,
          holders: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.warn('Error checking asset discovery status:', error);
    }

    return null; // Asset not found in any source
    
  } catch (error) {
    console.error('Error fetching asset by ID:', error);
    return null;
  }
}

export default router;