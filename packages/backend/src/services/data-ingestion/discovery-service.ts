import { ethers } from 'ethers';
import { BlockchainService } from '../../utils/blockchain';
import { OnChainDataService } from './on-chain';
import { DeFiLlamaService } from './defi-llama';
import { CreatorBidService } from './creatorbid';
import RWADiscoveryCardABI from '../../../../contracts/artifacts/contracts/RWADiscoveryCard.sol/RWADiscoveryCard.json';
import { AssetType, RarityTier, RiskTier } from '../../../../shared/src/types/rwa';

export interface DiscoveredAsset {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  assetType: AssetType;
  rarity: RarityTier;
  risk: RiskTier;
  rarityScore: number;
  predictionScore: number;
  currentValue: bigint;
  yieldRate: bigint;
  tokenURI: string;
}

export class DiscoveryService {
  private blockchainService: BlockchainService;
  private onChainService: OnChainDataService;
  private defiLlamaService: DeFiLlamaService;
  private creatorBidService: CreatorBidService;

  constructor() {
    this.blockchainService = new BlockchainService();
    this.onChainService = new OnChainDataService();
    this.defiLlamaService = new DeFiLlamaService();
    this.creatorBidService = new CreatorBidService();
  }

  async discoverAssetsFromSources(): Promise<DiscoveredAsset[]> {
    const discoveredAssets: DiscoveredAsset[] = [];
  
    try {
      console.log('Discovering assets from DeFi Llama...');
      const defiAssets = await this.discoverFromDeFiLlama();
      discoveredAssets.push(...defiAssets);
  
      console.log('Discovering assets from CreatorBid...');
      const artAssets = await this.discoverFromCreatorBid();
      discoveredAssets.push(...artAssets);
  
      console.log('Discovering assets from known RWA tokens...');
      const knownAssets = await this.discoverKnownRWAs();
      discoveredAssets.push(...knownAssets);
  
      console.log(`Total discovered from sources: ${discoveredAssets.length}`);
    } catch (error) {
      console.error('Error discovering assets from sources:', error);
    }
  
    return discoveredAssets;
  }

  private async discoverFromCreatorBid(): Promise<DiscoveredAsset[]> {
    try {
      console.log('Fetching art assets from CreatorBid...');
      const artAssets = await this.creatorBidService.fetchArtAssets();
      
      if (artAssets.length === 0) {
        console.log('No art assets found from CreatorBid');
        return [];
      }
      
      console.log(`Processing ${artAssets.length} art assets from CreatorBid`);
      
      return artAssets.map(art => {
        const currentBid = art.currentBid || 1;
        const estimateHigh = art.estimate?.high || currentBid * 1.5;
        const potentialReturn = (estimateHigh - currentBid) / currentBid;
        
        // More realistic art rarity scoring
        const bidScore = Math.min(40, Math.floor(currentBid / 10000)); // $10K bid = 40 points
        const artistScore = art.artist ? 20 : 0; // Known artist bonus
        const provenanceScore = art.provenance?.length > 2 ? 15 : 0; // Good provenance
        
        const rarityScore = Math.min(100, bidScore + artistScore + provenanceScore + 25);
        const predictionScore = Math.min(100, Math.floor(potentialReturn * 100) + 30);
        
        return {
          address: this.generateAddressFromId(art.id),
          chainId: 1,
          name: art.title,
          symbol: `ART-${art.title.substring(0, 3).toUpperCase()}`,
          assetType: AssetType.ART,
          rarity: this.calculateRarityTier(rarityScore),
          risk: RiskTier.SPECULATIVE, // Art is always speculative
          rarityScore: rarityScore,
          predictionScore: predictionScore,
          currentValue: BigInt(Math.floor(currentBid * 1000000)),
          yieldRate: BigInt(Math.floor(potentialReturn * 10000)),
          tokenURI: this.generateTokenURI(art.title, `ART-${art.title.substring(0, 3).toUpperCase()}`, AssetType.ART)
        };
      });
    } catch (error) {
      console.error('Error discovering from CreatorBid:', error);
      return [];
    }
  }

  private async discoverFromDeFiLlama(): Promise<DiscoveredAsset[]> {
    try {
      console.log('Fetching RWA pools from DeFi Llama...');
      const pools = await this.defiLlamaService.fetchRWAPools();
      
      // Limit to top 100 by TVL for better performance
      const topPools = pools
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 100);
      
      console.log(`Processing top ${topPools.length} RWA pools by TVL (from ${pools.length} total)`);
      
      const result = topPools.map(pool => {
        const chainId = this.getChainId(pool.chain);
        
        // Much more strict rarity score calculation
        const tvl = pool.tvl || 0;
        const apy = pool.apy || 0;
        
        // TVL Score: 0-50 points (needs $200M TVL for max)
        const tvlScore = Math.min(50, Math.floor(tvl / 4000000));
        
        // APY Score: 0-25 points (needs 25% APY for max)
        const apyScore = Math.min(25, Math.floor(apy * 100));
        
        // Project uniqueness score: 0-25 points
        const uniquenessScore = this.calculatePoolUniqueness(pool);
        
        const rarityScore = Math.min(100, tvlScore + apyScore + uniquenessScore);
        
        // More realistic prediction score
        const predictionScore = Math.min(100, Math.floor(
          (apy * 80) + // APY contribution (10% APY = 8 points)
          Math.min(20, tvl / 50000000) // TVL contribution ($50M TVL = 20 points)
        ));
        
        // Better rarity and risk tier calculations
        const rarityTier = this.calculateRarityTier(rarityScore);
        const riskTier = this.calculateRiskTier(tvl, apy);
        
        console.log(`Creating discovery asset: ${pool.project} - Rarity: ${rarityScore}, Prediction: ${predictionScore}, TVL: $${tvl.toLocaleString()}, APY: ${(apy * 100).toFixed(2)}%`);
        
        return {
          address: this.generateAddressFromId(pool.id),
          chainId: chainId,
          name: `${pool.project} ${pool.symbol} Pool`,
          symbol: pool.symbol || pool.project.substring(0, 4).toUpperCase(),
          assetType: AssetType.TOKENIZED_TREASURY,
          rarity: rarityTier,
          risk: riskTier,
          rarityScore: rarityScore,
          predictionScore: predictionScore,
          currentValue: BigInt(Math.floor(tvl || 1000000)),
          yieldRate: BigInt(Math.floor(apy * 10000)),
          tokenURI: this.generateTokenURI(pool.project, pool.symbol || pool.project, AssetType.TOKENIZED_TREASURY)
        };
      });
      
      console.log(`Created ${result.length} discovery assets from DeFi Llama`);
      return result;
    } catch (error) {
      console.error('Error discovering from DeFi Llama:', error);
      return [];
    }
  }
  
  // helper methods
  private calculatePoolUniqueness(pool: any): number {
    let score = 0;
    
    // Rare project bonus
    const rareProjects = ['ondo', 'maple', 'centrifuge', 'goldfinch', 'truefi'];
    if (rareProjects.some(proj => pool.project?.toLowerCase().includes(proj))) {
      score += 15;
    }
    
    // Rare chain bonus
    const rareChains = ['Linea', 'Base', 'Avalanche', 'Arbitrum'];
    if (rareChains.includes(pool.chain)) {
      score += 10;
    }
    
    // Established project bonus
    const establishedProjects = ['aave', 'compound', 'morpho'];
    if (establishedProjects.some(proj => pool.project?.toLowerCase().includes(proj))) {
      score += 5;
    }
    
    return Math.min(25, score);
  }
  
  private calculateRarityTier(score: number): RarityTier {
    if (score >= 85) return RarityTier.LEGENDARY;
    if (score >= 70) return RarityTier.EPIC;
    if (score >= 55) return RarityTier.RARE;
    if (score >= 40) return RarityTier.UNCOMMON;
    return RarityTier.COMMON;
  }
  
  private calculateRiskTier(tvl: number, apy: number): RiskTier {
    // Higher TVL = lower risk, very high APY = higher risk
    if (tvl > 50000000 && apy < 0.15) return RiskTier.LOW; // $50M+ TVL, reasonable APY
    if (tvl > 10000000 && apy < 0.25) return RiskTier.MEDIUM; // $10M+ TVL
    if (tvl > 1000000) return RiskTier.HIGH; // $1M+ TVL
    return RiskTier.SPECULATIVE; // Low TVL or very high APY
  }

  private async discoverKnownRWAs(): Promise<DiscoveredAsset[]> {
    const knownRWAs = [
      {
        address: '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92',
        chainId: 1,
        name: 'Ondo Short-Term U.S. Government Bond Fund',
        symbol: 'OUSG',
        assetType: AssetType.TOKENIZED_TREASURY
      },
      {
        address: '0x9A0E3e7960e3439F897015772e6EcaE7B632Ad9f',
        chainId: 1, 
        name: 'Maple Finance Private Credit',
        symbol: 'MPL',
        assetType: AssetType.PRIVATE_CREDIT
      }
    ];

    const assets: DiscoveredAsset[] = [];

    for (const knownRWA of knownRWAs) {
      try {
        const onChainData = await this.onChainService.fetchTokenData(knownRWA.address, knownRWA.chainId);
        
        assets.push({
          address: knownRWA.address,
          chainId: knownRWA.chainId,
          name: onChainData.name || knownRWA.name,
          symbol: onChainData.symbol || knownRWA.symbol,
          assetType: knownRWA.assetType,
          rarity: RarityTier.COMMON,
          risk: RiskTier.MEDIUM,
          rarityScore: 60,
          predictionScore: 70,
          currentValue: BigInt(Math.floor(parseFloat(onChainData.totalSupply || '0') * 100)),
          yieldRate: BigInt(50000),
          tokenURI: this.generateTokenURI(knownRWA.name, knownRWA.symbol, knownRWA.assetType)
        });
      } catch (error) {
        console.error(`Error fetching data for ${knownRWA.name}:`, error);
      }
    }

    return assets;
  }

  private generateTokenURI(name: string, symbol: string, assetType: AssetType): string {
    const metadata = {
      name: `${name} Discovery Card`,
      description: `Real World Asset Discovery Card for ${name} (${symbol})`,
      image: this.generateImageDataURI(symbol, assetType),
      attributes: [
        { trait_type: "Asset Type", value: AssetType[assetType] },
        { trait_type: "Symbol", value: symbol }
      ]
    };
    
    const jsonString = JSON.stringify(metadata);
    return `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;
  }

  private generateImageDataURI(symbol: string, assetType: AssetType): string {
    const assetTypeColors = {
      [AssetType.TOKENIZED_TREASURY]: '3B82F6',
      [AssetType.REAL_ESTATE]: '10B981', 
      [AssetType.ART]: '8B5CF6',
      [AssetType.LUXURY_GOODS]: 'F59E0B',
      [AssetType.PRIVATE_CREDIT]: 'EF4444'
    };
    
    const color = assetTypeColors[assetType] || '6B7280';
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#${color}"/>
      <text x="200" y="200" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
      <text x="200" y="230" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">RWA</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  private generateAddressFromId(id: string): string {
    const hash = require('crypto').createHash('sha256').update(id).digest('hex');
    return `0x${hash.substring(0, 40)}`;
  }

  private getChainId(chainName: string): number {
    const chainMap: { [key: string]: number } = {
      'Ethereum': 1,
      'Base': 8453,
      'Linea': 59141,
      'Polygon': 137,
      'Arbitrum': 42161,
      'Solana': 101,
      'Avalanche': 43114
    };
    return chainMap[chainName] || 1;
  }

  async getDiscoveredAssets(discoveryContractAddress: string, chainId: number): Promise<DiscoveredAsset[]> {
    try {
      const provider = this.blockchainService.getProvider(chainId);
      const contract = new ethers.Contract(discoveryContractAddress, RWADiscoveryCardABI.abi, provider);
      
      const totalDiscoveries = await contract.totalDiscoveries();
      console.log(`Total discoveries in contract: ${totalDiscoveries}`);
      
      if (Number(totalDiscoveries) === 0) {
        console.log('No assets discovered in contract yet');
        return [];
      }
      
      const discoveredAssets: DiscoveredAsset[] = [];
      
      // Start from token ID 1, not 0
      for (let i = 1; i <= Math.min(Number(totalDiscoveries), 50); i++) {
        try {
          console.log(`Fetching discovery token ${i}...`);
          const discovery = await contract.getDiscoveryCard(i);
          
          discoveredAssets.push({
            address: discovery.assetAddress,
            chainId,
            name: discovery.assetName,
            symbol: discovery.assetSymbol,
            assetType: discovery.assetType,
            rarity: discovery.rarity,
            risk: discovery.risk,
            rarityScore: Number(discovery.rarityScore),
            predictionScore: Number(discovery.predictionScore),
            currentValue: discovery.currentValue,
            yieldRate: discovery.yieldRate,
            tokenURI: discovery.tokenURI
          });
          
          console.log(`Successfully fetched: ${discovery.assetName}`);
        } catch (error) {
          console.warn(`Failed to fetch discovery ${i}:`, error);
          // Continue with next token instead of breaking
          continue;
        }
      }
      
      return discoveredAssets;
    } catch (error) {
      console.error('Discovery service error:', error);
      return [];
    }
  }
  
  async getAllDiscoveredAssets(): Promise<any[]> {
    const discoveryContracts = [
      { address: '0x319A206621251f7b2582E5fa8c9E084D1371d09B', chainId: 5003 },
    ];
  
    const allAssets: any[] = [];
    
    for (const contract of discoveryContracts) {
      console.log(`Discovering assets from contract: ${contract.address} on chain ${contract.chainId}`);
      const assets = await this.getDiscoveredAssets(contract.address, contract.chainId);
      
      // Convert BigInt values to strings for serialization
      const serializedAssets = assets.map(asset => ({
        address: asset.address,
        chainId: asset.chainId,
        name: asset.name,
        symbol: asset.symbol,
        // Convert any remaining BigInt fields
        currentValue: asset.currentValue.toString(),
        yieldRate: asset.yieldRate.toString(),
        // Include other fields as needed
        assetType: asset.assetType,
        rarity: asset.rarity,
        risk: asset.risk,
        rarityScore: asset.rarityScore,
        predictionScore: asset.predictionScore,
        tokenURI: asset.tokenURI
      }));
      
      allAssets.push(...serializedAssets);
    }
    
    console.log(`Total assets discovered from contract: ${allAssets.length}`);
    return allAssets;
  }
}