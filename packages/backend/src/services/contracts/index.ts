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
  private discoveryCardContract: ethers.Contract;
  private factoryContract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.linea.rpcUrl);
    
    const discoveryCardAddress = process.env.DISCOVERY_CARD_ADDRESS;
    const factoryAddress = process.env.FACTORY_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;

    if (!discoveryCardAddress || !factoryAddress || !privateKey) {
      throw new Error('Contract addresses or private key not configured');
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
  }

  async getDiscoveryCard(tokenId: bigint): Promise<DiscoveryCardData> {
    try {
      const cardData = await this.discoveryCardContract.getDiscoveryCard(tokenId);
      
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
    try {
      return await this.discoveryCardContract.getDiscovererCards(userAddress);
    } catch (error) {
      throw new Error(`Failed to fetch user discovery cards: ${error}`);
    }
  }

  async isAssetDiscovered(assetAddress: string): Promise<boolean> {
    try {
      return await this.discoveryCardContract.isAssetDiscovered(assetAddress);
    } catch (error) {
      throw new Error(`Failed to check if asset is discovered: ${error}`);
    }
  }

  async getTotalDiscoveries(): Promise<bigint> {
    try {
      return await this.discoveryCardContract.totalDiscoveries();
    } catch (error) {
      throw new Error(`Failed to fetch total discoveries: ${error}`);
    }
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    try {
      return await this.factoryContract.getUserStats(userAddress);
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error}`);
    }
  }

  async getMintingFee(): Promise<bigint> {
    try {
      return await this.factoryContract.mintingFee();
    } catch (error) {
      throw new Error(`Failed to fetch minting fee: ${error}`);
    }
  }

  async getContractBalance(): Promise<bigint> {
    try {
      return await this.factoryContract.getContractBalance();
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
    try {
      const mintingFee = await this.getMintingFee();
      
      const factoryWithSigner = this.factoryContract.connect(this.wallet) as ethers.Contract;
      
      // Use the function name from ABI
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

      // Get the token ID from the event - null check
      let tokenId: bigint = BigInt(0);
      
      // Look for NewDiscovery event
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.factoryContract.interface.parseLog(log as any);
          if (parsedLog && parsedLog.name === 'NewDiscovery') {
            tokenId = parsedLog.args.tokenId;
            break;
          }
        } catch {
          // Continue checking other logs
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
    try {
      // Get all discovery events to build leaderboard
      const filter = this.factoryContract.filters.NewDiscovery();
      const events = await this.factoryContract.queryFilter(filter, 0, 'latest');
      
      // Group by user and calculate stats
      const userStats = new Map<string, { totalScore: bigint; count: bigint; totalRarity: bigint }>();
      
      for (const event of events) {
        // FIXED: Proper event args handling with type guards
        if ('args' in event && event.args) {
          const eventArgs = event.args as any;
          if (eventArgs.discoverer && eventArgs.rarityScore) {
            const user = eventArgs.discoverer as string;
            const rarityScore = eventArgs.rarityScore as bigint;
            
            const current = userStats.get(user) || { 
              totalScore: BigInt(0), 
              count: BigInt(0), 
              totalRarity: BigInt(0) 
            };
            
            userStats.set(user, {
              totalScore: current.totalScore + rarityScore,
              count: current.count + BigInt(1),
              totalRarity: current.totalRarity + rarityScore
            });
          }
        }
      }
      
      // Convert to array and sort by total score
      let entries = Array.from(userStats.entries()).map(([address, stats]) => ({
        address,
        totalScore: stats.totalScore,
        discoveryCount: stats.count,
        averageRarity: stats.count > 0 ? stats.totalRarity / stats.count : BigInt(0)
      }));
      
      // Sort by total score (descending)
      entries.sort((a, b) => {
        if (a.totalScore > b.totalScore) return -1;
        if (a.totalScore < b.totalScore) return 1;
        return 0;
      });
      
      // Add ranks and limit results
      return entries.slice(0, limit).map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
    } catch (error) {
      throw new Error(`Failed to fetch leaderboard: ${error}`);
    }
  }

  // Get user's rank
  async getUserRank(userAddress: string): Promise<number> {
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
}