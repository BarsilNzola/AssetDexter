import { ethers } from 'ethers';
import { BlockchainService } from '../../utils/blockchain';
import { RWA, OnChainData } from '../../types/rwa';

export class OnChainDataService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async fetchTokenData(contractAddress: string, chainId: number): Promise<Partial<RWA>> {
    try {
      const tokenData = await this.blockchainService.getTokenData(contractAddress, chainId);
      const holderCount = await this.blockchainService.getHolderCount(contractAddress, chainId);

      return {
        address: contractAddress,
        chainId,
        symbol: tokenData.symbol,
        name: tokenData.name,
        totalSupply: tokenData.totalSupply,
        holders: holderCount
      };
    } catch (error) {
      throw new Error(`Failed to fetch on-chain data: ${error}`);
    }
  }

  async getLiquidityData(pairAddress: string, chainId: number): Promise<number> {
    const provider = this.blockchainService.getProvider(chainId);
    const pairAbi = [
      'function getReserves() external view returns (uint112, uint112, uint32)',
      'function token0() external view returns (address)',
      'function token1() external view returns (address)'
    ];

    try {
      const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
      const [reserve0, reserve1] = await pairContract.getReserves();
      
      // Calculate total liquidity in USD (simplified)
      return Number(ethers.formatUnits(reserve0)) + Number(ethers.formatUnits(reserve1));
    } catch (error) {
      console.error('Error fetching liquidity data:', error);
      return 0;
    }
  }
}