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
    
    for (let i = 0; i < Math.min(total, 10); i++) {
      try {
        const card = await contractService.getDiscoveryCard(BigInt(i));
        discoveries.push({
          tokenId: i,
          assetName: card.assetName,
          assetAddress: card.assetAddress,
          assetSymbol: card.assetSymbol
        });
      } catch (error) {
        console.warn(`Failed to fetch discovery card ${i}:`, error);
      }
    }
    
    res.json({
      totalDiscoveries: totalDiscoveries.toString(),
      discoveries,
      contractAddress: '0x6c49D2b8d7B200777F819d3aC5cb740D68b5E4fA'
    });
  } catch (error) {
    console.error('Contract debug error:', error);
    res.status(500).json({ 
      error: 'Failed to debug contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/discovery-card/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const cacheKey = `discovery-card:${tokenId}`;
    
    const cardData = await cache.getOrSet(
      cacheKey,
      async () => {
        const data = await contractService.getDiscoveryCard(BigInt(tokenId));
        // Convert ALL BigInt values to string for JSON serialization
        return {
          ...data,
          tokenId: data.tokenId.toString(),
          discoveryTimestamp: data.discoveryTimestamp.toString(),
          rarityScore: data.rarityScore.toString(),
          predictionScore: data.predictionScore.toString(),
          currentValue: data.currentValue.toString(),
          yieldRate: data.yieldRate.toString()
        };
      },
      300
    );

    res.json(cardData);
  } catch (error) {
    console.error('Contract data fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discovery card',
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
      600 // 10 minutes cache
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
        return {
          totalScore: data.totalScore.toString(),
          discoveryCount: data.discoveryCount.toString(),
          averageRarity: data.averageRarity.toString()
        };
      },
      300 // 5 minutes cache
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

export default router;