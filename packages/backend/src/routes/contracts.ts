import { Router } from 'express';
import { ContractService } from '../services/contracts';
import { SimpleCache } from '../services/cache/simple-cache';

const router = Router();
const contractService = new ContractService();
const cache = new SimpleCache();

router.get('/verify-discovery/:assetAddress', async (req, res) => {
  try {
    const { assetAddress } = req.params;
    
    const isDiscovered = await contractService.isAssetDiscovered(assetAddress);
    
    console.log(`Asset ${assetAddress} discovery status:`, isDiscovered);
    
    res.json({ 
      discovered: isDiscovered,
      assetAddress 
    });
  } catch (error) {
    console.error('Discovery verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify asset discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/debug-contract', async (req, res) => {
  try {
    const totalDiscoveries = await contractService.getTotalDiscoveries();
    console.log('Total discoveries in contract:', totalDiscoveries.toString());
    
    const discoveries = [];
    const total = Number(totalDiscoveries);
    
    for (let i = 1; i <= Math.min(total, 10); i++) {
      try {
        const card = await contractService.getDiscoveryCard(BigInt(i));
        
        // Properly serialize ALL values
        const serializedCard = {
          tokenId: Number(card.tokenId).toString(),
          discoverer: card.discoverer,
          discoveryTimestamp: Number(card.discoveryTimestamp).toString(),
          assetType: Number(card.assetType),
          rarity: Number(card.rarity),
          risk: Number(card.risk),
          rarityScore: Number(card.rarityScore),
          predictionScore: Number(card.predictionScore),
          assetAddress: card.assetAddress,
          assetName: card.assetName,
          assetSymbol: card.assetSymbol,
          currentValue: Number(card.currentValue).toString(),
          yieldRate: Number(card.yieldRate).toString()
        };
        discoveries.push(serializedCard);
      } catch (error) {
        console.warn(`Failed to fetch discovery card ${i}:`, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
    
    res.json({
      totalDiscoveries: totalDiscoveries.toString(),
      discoveries,
      contractAddress: '0x6c49D2b8d7B200777F819d3aC5cb740D68b5E4fA'
    });
  } catch (error) {
    console.error('Contract debug error:', error);
    
    // Handle BigInt serialization explicitly
    const errorResponse = {
      error: 'Failed to debug contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    // Safe JSON stringify
    res.status(500).json(JSON.parse(JSON.stringify(errorResponse, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )));
  }
});

router.get('/discovery-card/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    console.log(`=== FETCHING DISCOVERY CARD ${tokenId} ===`);
    
    const cacheKey = `discovery-card:${tokenId}`;
    
    const cardData = await cache.getOrSet(
      cacheKey,
      async () => {
        const data = await contractService.getDiscoveryCard(BigInt(tokenId));
        
        console.log(`Raw data for token ${tokenId}:`, {
          tokenId: data.tokenId,
          tokenIdType: typeof data.tokenId,
          rarityScore: data.rarityScore,
          rarityScoreType: typeof data.rarityScore,
          predictionScore: data.predictionScore,
          predictionScoreType: typeof data.predictionScore,
          currentValue: data.currentValue,
          currentValueType: typeof data.currentValue,
          yieldRate: data.yieldRate,
          yieldRateType: typeof data.yieldRate
        });
        
        // Create a completely new object with explicit serialization
        const serializedData = {
          tokenId: data.tokenId.toString(),
          discoverer: data.discoverer,
          discoveryTimestamp: data.discoveryTimestamp.toString(),
          assetType: Number(data.assetType),
          rarity: Number(data.rarity),
          risk: Number(data.risk),
          rarityScore: Number(data.rarityScore), // Convert to number, not string
          predictionScore: Number(data.predictionScore), // Convert to number
          assetAddress: data.assetAddress,
          assetName: data.assetName,
          assetSymbol: data.assetSymbol,
          currentValue: data.currentValue.toString(),
          yieldRate: data.yieldRate.toString()
        };
        
        console.log(`Serialized data for token ${tokenId}:`, serializedData);
        
        return serializedData;
      },
      300
    );

    // Final safety check
    const finalCheck = JSON.stringify(cardData);
    console.log(`Final JSON stringify successful for token ${tokenId}`);
    
    res.json(cardData);
  } catch (error) {
    console.error('Contract data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discovery card',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/get-assets', async (req, res) => {
  try {
    const totalDiscoveries = await contractService.getTotalDiscoveries();
    console.log('Total discoveries in contract:', totalDiscoveries.toString());
    
    const discoveries = [];
    const total = Number(totalDiscoveries);
    
    for (let i = 0; i < total; i++) {
      try {
        const card = await contractService.getDiscoveryCard(BigInt(i));
        
        const serializedCard = {
          tokenId: card.tokenId.toString(),
          discoverer: card.discoverer,
          discoveryTimestamp: card.discoveryTimestamp.toString(),
          assetType: card.assetType,
          rarity: card.rarity,
          risk: card.risk,
          rarityScore: card.rarityScore.toString(),
          predictionScore: card.predictionScore.toString(),
          assetAddress: card.assetAddress,
          assetName: card.assetName,
          assetSymbol: card.assetSymbol,
          currentValue: card.currentValue.toString(),
          yieldRate: card.yieldRate.toString()
        };
        discoveries.push(serializedCard);
      } catch (error) {
        console.warn(`Failed to fetch discovery card ${i}:`, error);
        break; // Stop if we hit an error
      }
    }
    
    res.json(discoveries);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ 
      error: 'Failed to get contract assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/user/:address/cards', async (req, res) => {
  try {
    const { address } = req.params;
    
    const cacheKey = `user-cards:${address}`;
    
    const cardIds = await cache.getOrSet(
      cacheKey,
      async () => {
        const ids = await contractService.getUserDiscoveryCards(address);
        return ids.map(id => id.toString());
      },
      600
    );

    res.json({ cards: cardIds });
  } catch (error) {
    console.error('User cards fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user cards',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/user/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    
    const cacheKey = `user-stats:${address}`;
    
    const stats = await cache.getOrSet(
      cacheKey,
      async () => {
        const data = await contractService.getUserStats(address);
        // Explicitly convert ALL BigInt properties
        return {
          totalScore: data.totalScore.toString(),
          discoveryCount: data.discoveryCount.toString(),
          averageRarity: data.averageRarity.toString()
        };
      },
      300
    );

    res.json(stats);
  } catch (error) {
    console.error('User stats fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/asset-discovered/:assetAddress', async (req, res) => {
  try {
    const { assetAddress } = req.params;
    
    const isDiscovered = await contractService.isAssetDiscovered(assetAddress);
    
    res.json({ discovered: isDiscovered });
  } catch (error) {
    console.error('Asset discovery check error:', error);
    res.status(500).json({ 
      error: 'Failed to check asset discovery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/total-discoveries', async (req, res) => {
  try {
    const total = await contractService.getTotalDiscoveries();
    
    res.json({ totalDiscoveries: total.toString() });
  } catch (error) {
    console.error('Total discoveries fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch total discoveries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/minting-fee', async (req, res) => {
  try {
    const fee = await contractService.getMintingFee();
    
    res.json({ mintingFee: fee.toString() });
  } catch (error) {
    console.error('Minting fee fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch minting fee',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/mint', async (req, res) => {
  try {
    if (!contractService.isReady()) {
      return res.status(503).json({ 
        error: 'Minting service unavailable',
        details: 'Contract service not initialized. Check PRIVATE_KEY and contract addresses in environment variables.'
      });
    }

    const {
      userAddress,
      assetType,
      rarity,
      risk,
      rarityScore,
      predictionScore,
      assetAddress,
      assetName,
      assetSymbol,
      currentValue, // This will be a string now
      yieldRate,    // This will be a string now
      tokenURI = ''
    } = req.body;

    // Validate required fields
    if (!userAddress || assetType === undefined || rarity === undefined || 
        risk === undefined || rarityScore === undefined || predictionScore === undefined ||
        !assetAddress || !assetName || !assetSymbol || currentValue === undefined || 
        yieldRate === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: [
          'userAddress', 'assetType', 'rarity', 'risk', 'rarityScore', 
          'predictionScore', 'assetAddress', 'assetName', 'assetSymbol', 
          'currentValue', 'yieldRate'
        ]
      });
    }

    console.log('Minting request received:', {
      userAddress,
      assetType,
      rarity,
      risk,
      rarityScore,
      predictionScore,
      assetAddress,
      assetName,
      assetSymbol,
      currentValue,
      yieldRate,
      tokenURI
    });

    // Convert string values back to BigInt for contract call
    const result = await contractService.mintDiscoveryCard(
      userAddress,
      Number(assetType),
      Number(rarity),
      Number(risk),
      Number(rarityScore),
      Number(predictionScore),
      assetAddress,
      assetName,
      assetSymbol,
      BigInt(currentValue), // Convert string back to BigInt
      BigInt(yieldRate),    // Convert string back to BigInt
      tokenURI
    );

    console.log('Minting successful:', result);

    // Invalidate relevant caches
    cache.invalidate(`user-cards:${userAddress}`);
    cache.invalidate(`user-stats:${userAddress}`);
    cache.invalidate('leaderboard');

    res.json({
      success: true,
      txHash: result.txHash,
      tokenId: result.tokenId.toString(),
      message: 'Asset successfully minted'
    });
  } catch (error) {
    console.error('Minting error:', error);
    res.status(500).json({ 
      error: 'Failed to mint asset',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get leaderboard endpoint
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const cacheKey = `leaderboard:${limit}`;
    
    const leaderboard = await cache.getOrSet(
      cacheKey,
      async () => {
        const data = await contractService.getLeaderboard(Number(limit));
        
        // Explicitly convert ALL BigInt properties
        return data.map(entry => ({
          address: entry.address,
          totalScore: entry.totalScore.toString(),
          discoveryCount: entry.discoveryCount.toString(),
          averageRarity: entry.averageRarity.toString(),
          rank: entry.rank
        }));
      },
      300 // Cache for 5 minutes
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user rank endpoint
router.get('/user/:address/rank', async (req, res) => {
  try {
    const { address } = req.params;
    
    const cacheKey = `user-rank:${address}`;
    
    const rank = await cache.getOrSet(
      cacheKey,
      async () => {
        return await contractService.getUserRank(address);
      },
      300
    );

    res.json({ rank });
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user rank',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch mint endpoint
router.post('/batch-mint', async (req, res) => {
  try {
    const { userAddress, assets } = req.body;

    if (!userAddress || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: userAddress and assets array'
      });
    }

    console.log(`Batch minting ${assets.length} assets for ${userAddress}`);

    const results = [];
    
    for (const asset of assets) {
      try {
        const result = await contractService.mintDiscoveryCard(
          userAddress,
          Number(asset.assetType),
          Number(asset.rarity),
          Number(asset.risk),
          Number(asset.rarityScore),
          Number(asset.predictionScore),
          asset.assetAddress,
          asset.assetName,
          asset.assetSymbol,
          BigInt(asset.currentValue),
          BigInt(asset.yieldRate),
          asset.tokenURI || ''
        );
        
        results.push({
          success: true,
          assetAddress: asset.assetAddress,
          txHash: result.txHash,
          tokenId: result.tokenId.toString()
        });
      } catch (error) {
        results.push({
          success: false,
          assetAddress: asset.assetAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Invalidate caches
    cache.invalidate(`user-cards:${userAddress}`);
    cache.invalidate(`user-stats:${userAddress}`);
    cache.invalidate('leaderboard');

    res.json({
      success: true,
      results,
      message: `Processed ${assets.length} assets`
    });
  } catch (error) {
    console.error('Batch minting error:', error);
    res.status(500).json({ 
      error: 'Failed to batch mint assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;