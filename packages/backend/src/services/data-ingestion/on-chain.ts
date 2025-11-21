import { ethers } from 'ethers';
import { BlockchainService } from '../../utils/blockchain';
import { RWA, OnChainData } from '../../../../shared/src/types/rwa';

export class OnChainDataService {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async fetchTokenData(contractAddress: string, chainId: number): Promise<Partial<RWA>> {
    try {
      // Basic ERC20 ABI with only the essential functions
      const erc20Abi = [
        'function symbol() view returns (string)',
        'function name() view returns (string)',
        'function totalSupply() view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address) view returns (uint256)'
      ];

      const provider = this.blockchainService.getProvider(chainId);
      const contract = new ethers.Contract(contractAddress, erc20Abi, provider);

      // Use Promise.allSettled to handle individual function failures gracefully
      const [symbol, name, totalSupply] = await Promise.allSettled([
        contract.symbol().catch(() => 'UNKNOWN'),
        contract.name().catch(() => 'Unknown Token'),
        contract.totalSupply().catch(() => ethers.toBigInt(0))
      ]);

      // Get holder count with error handling
      let holderCount = 0;
      try {
        holderCount = await this.blockchainService.getHolderCount(contractAddress, chainId);
      } catch (error) {
        console.warn(`Could not fetch holder count for ${contractAddress}:`, error);
      }

      return {
        address: contractAddress,
        chainId,
        symbol: symbol.status === 'fulfilled' ? symbol.value : 'UNKNOWN',
        name: name.status === 'fulfilled' ? name.value : 'Unknown Token',
        totalSupply: totalSupply.status === 'fulfilled' ? totalSupply.value.toString() : '0',
        holders: holderCount
      };
    } catch (error) {
      console.error(`Failed to fetch on-chain data for ${contractAddress}:`, error);
      
      // Return minimal data instead of throwing
      return {
        address: contractAddress,
        chainId,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        totalSupply: '0',
        holders: 0
      };
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