import { ethers } from 'ethers';
import RWADiscoveryCardABI from '../../../../contracts/artifacts/contracts/RWADiscoveryCard.sol/RWADiscoveryCard.json';
import AssetDexterFactoryABI from '../../../../contracts/artifacts/contracts/AssetDexterFactory.sol/AssetDexterFactory.json';
import { config } from '../../utils/config';
import dotenv from 'dotenv';


dotenv.config();

export interface DiscoveryCardData {
  tokenId: bigint;
  discoverer: string;
  discoveryTimestamp: bigint;
  assetType: number;
  rarity: number;
  risk: number;
  rarityScore: bigint;
  predictionScore: bigint;
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  currentValue: bigint;
  yieldRate: bigint;
}

export interface UserStats {
  totalScore: bigint;
  discoveryCount: bigint;
  averageRarity: bigint;
}

export interface LeaderboardEntry {
  address: string;
  totalScore: bigint;
  discoveryCount: bigint;
  averageRarity: bigint;
  rank: number;
}

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private discoveryCardContract: ethers.Contract | null = null;
  private factoryContract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.mantle.rpcUrl);
    this.initializeContracts();
  }

  private initializeContracts(): void {
    try {
      const discoveryCardAddress = process.env.DISCOVERY_CARD_ADDRESS;
      const factoryAddress = process.env.FACTORY_ADDRESS;
      const privateKey = process.env.PRIVATE_KEY;

      console.log('Environment variables:', {
        discoveryCardAddress: discoveryCardAddress ? 'Set' : 'Missing',
        factoryAddress: factoryAddress ? 'Set' : 'Missing',
        privateKey: privateKey ? 'Set' : 'Missing'
      });

      if (!discoveryCardAddress || !factoryAddress || !privateKey) {
        console.warn('Contract addresses or private key not configured. Read-only mode enabled.');
        return;
      }

      this.discoveryCardContract = new ethers.Contract(
        discoveryCardAddress,
        RWADiscoveryCardABI.abi,
        this.provider
      );

      this.factoryContract = new ethers.Contract(
        factoryAddress,
        AssetDexterFactoryABI.abi,
        this.provider
      );

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.isInitialized = true;

      console.log('Contract service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Contract service not initialized. Check environment variables.');
    }
  }

  async getDiscoveryCard(tokenId: bigint): Promise<DiscoveryCardData> {
    this.ensureInitialized();
    try {
      const cardData = await this.discoveryCardContract!.getDiscoveryCard(tokenId);
      
      return {
        tokenId: cardData.tokenId,
        discoverer: cardData.discoverer,
        discoveryTimestamp: cardData.discoveryTimestamp,
        assetType: cardData.assetType,
        rarity: cardData.rarity,
        risk: cardData.risk,
        rarityScore: cardData.rarityScore,
        predictionScore: cardData.predictionScore,
        assetAddress: cardData.assetAddress,
        assetName: cardData.assetName,
        assetSymbol: cardData.assetSymbol,
        currentValue: cardData.currentValue,
        yieldRate: cardData.yieldRate
      };
    } catch (error) {
      throw new Error(`Failed to fetch discovery card: ${error}`);
    }
  }

  async getUserDiscoveryCards(userAddress: string): Promise<bigint[]> {
    this.ensureInitialized();
    try {
      return await this.discoveryCardContract!.getDiscovererCards(userAddress);
    } catch (error) {
      throw new Error(`Failed to fetch user discovery cards: ${error}`);
    }
  }

  async isAssetDiscovered(assetAddress: string): Promise<boolean> {
    this.ensureInitialized();
    try {
      return await this.discoveryCardContract!.isAssetDiscovered(assetAddress);
    } catch (error) {
      throw new Error(`Failed to check if asset is discovered: ${error}`);
    }
  }

  async getTotalDiscoveries(): Promise<bigint> {
    this.ensureInitialized();
    try {
      return await this.discoveryCardContract!.totalDiscoveries();
    } catch (error) {
      throw new Error(`Failed to fetch total discoveries: ${error}`);
    }
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    this.ensureInitialized();
    try {
      return await this.factoryContract!.getUserStats(userAddress);
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error}`);
    }
  }

  async getMintingFee(): Promise<bigint> {
    this.ensureInitialized();
    try {
      return await this.factoryContract!.mintingFee();
    } catch (error) {
      throw new Error(`Failed to fetch minting fee: ${error}`);
    }
  }

  async getContractBalance(): Promise<bigint> {
    this.ensureInitialized();
    try {
      return await this.factoryContract!.getContractBalance();
    } catch (error) {
      throw new Error(`Failed to fetch contract balance: ${error}`);
    }
  }

  // Mint discovery card with proper typing
  async mintDiscoveryCard(
    userAddress: string,
    assetType: number,
    rarity: number,
    risk: number,
    rarityScore: number,
    predictionScore: number,
    assetAddress: string,
    assetName: string,
    assetSymbol: string,
    currentValue: bigint,
    yieldRate: bigint,
    tokenURI: string
  ): Promise<{ txHash: string; tokenId: bigint }> {
    this.ensureInitialized();
    try {
      const mintingFee = await this.getMintingFee();
      
      const factoryWithSigner = this.factoryContract!.connect(this.wallet!) as ethers.Contract;
      
      const tx = await factoryWithSigner.discoverRWA(
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
        tokenURI,
        { value: mintingFee }
      );

      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction failed');
      }

      // Get the token ID from the event
      let tokenId: bigint = BigInt(0);
      
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.factoryContract!.interface.parseLog(log as any);
          if (parsedLog && parsedLog.name === 'NewDiscovery') {
            tokenId = parsedLog.args.tokenId;
            break;
          }
        } catch {
          continue;
        }
      }

      // Fallback: get the latest token ID for the user
      if (tokenId === BigInt(0)) {
        const userCards = await this.getUserDiscoveryCards(userAddress);
        if (userCards.length > 0) {
          tokenId = userCards[userCards.length - 1];
        }
      }

      return {
        txHash: tx.hash,
        tokenId
      };
    } catch (error) {
      throw new Error(`Minting failed: ${error}`);
    }
  }

  // Get leaderboard data with proper event handling
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    this.ensureInitialized();
    
    try {
      // Since we don't have a built-in getAllUsers function, we'll track users from events
      // But only from a reasonable block range to avoid the 50k block limit
      
      const currentBlock = await this.provider.getBlockNumber();
      const RECENT_BLOCKS = 20000; // Last 20k blocks should be safe
      
      // Get recent events to find active users
      const filter = this.factoryContract!.filters.NewDiscovery();
      const events = await this.factoryContract!.queryFilter(
        filter,
        Math.max(0, currentBlock - RECENT_BLOCKS),
        'latest'
      ) as ethers.EventLog[];
      
      // Extract unique users from recent events
      const uniqueUsers = new Set<string>();
      for (const event of events) {
        if (event.args && event.args[0]) { // discoverer is first arg
          uniqueUsers.add(event.args[0] as string);
        }
      }
      
      // Get stats for each user
      const userStatsPromises = Array.from(uniqueUsers).map(async (userAddress) => {
        try {
          const stats = await this.factoryContract!.getUserStats(userAddress);
          return {
            address: userAddress,
            totalScore: stats[0], // totalScore
            discoveryCount: stats[1], // discoveryCount
            averageRarity: stats[2] // averageRarity
          };
        } catch (error) {
          console.warn(`Failed to get stats for ${userAddress}:`, error);
          return null;
        }
      });
      
      const userStatsResults = await Promise.all(userStatsPromises);
      
      // Filter out failed requests and users with no discoveries
      let entries = userStatsResults
        .filter((entry): entry is NonNullable<typeof entry> => 
          entry !== null && Number(entry.discoveryCount) > 0
        )
        .map(entry => ({
          ...entry,
          rank: 0 // Will be set after sorting
        }));
      
      // Sort by totalScore (descending)
      entries.sort((a, b) => {
        if (a.totalScore > b.totalScore) return -1;
        if (a.totalScore < b.totalScore) return 1;
        return 0;
      });
      
      // Assign ranks
      return entries.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
      
    } catch (error) {
      console.error('Leaderboard fetch failed:', error);
      
      // Ultimate fallback - return empty array
      return [];
    }
  }
  
  // Alternative leaderboard implementation using contract state
  private async getLeaderboardFromState(limit: number = 10): Promise<LeaderboardEntry[]> {
    // This would require tracking user addresses in your contract
    // For now, return empty array as fallback
    console.warn('Using fallback leaderboard implementation');
    return [];
  }

  async getUserRank(userAddress: string): Promise<number> {
    this.ensureInitialized();
    try {
      const leaderboard = await this.getLeaderboard(100);
      const userEntry = leaderboard.find(entry => 
        entry.address.toLowerCase() === userAddress.toLowerCase()
      );
      
      return userEntry ? userEntry.rank : -1;
    } catch (error) {
      throw new Error(`Failed to fetch user rank: ${error}`);
    }
  }

  // Check if service is properly initialized
  isReady(): boolean {
    return this.isInitialized;
  }

  // Get initialization status
  getStatus(): { initialized: boolean; hasContracts: boolean; hasWallet: boolean } {
    return {
      initialized: this.isInitialized,
      hasContracts: !!(this.discoveryCardContract && this.factoryContract),
      hasWallet: !!this.wallet
    };
  }
}