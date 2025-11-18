import { ethers } from 'ethers';
import RWADiscoveryCardABI from '../../../../contracts/artifacts/contracts/RWADiscoveryCard.sol/RWADiscoveryCard.json';
import AssetDexterFactoryABI from '../../../../contracts/artifacts/contracts/AssetDexterFactory.sol/AssetDexterFactory.json';
import { config } from '../../utils/config';

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

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private discoveryCardContract: ethers.Contract;
  private factoryContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.linea.rpcUrl);
    
    const discoveryCardAddress = process.env.DISCOVERY_CARD_ADDRESS;
    const factoryAddress = process.env.FACTORY_ADDRESS;

    if (!discoveryCardAddress || !factoryAddress) {
      throw new Error('Contract addresses not configured');
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

  async getUserStats(userAddress: string): Promise<{
    totalScore: bigint;
    discoveryCount: bigint;
    averageRarity: bigint;
  }> {
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
}