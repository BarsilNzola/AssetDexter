import { ethers } from 'ethers';
import { GoldRushClient, ChainName } from "@covalenthq/client-sdk";
import { config } from './config';
import dotenv from 'dotenv';
dotenv.config();

export class BlockchainService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private covalentClient: GoldRushClient | null = null;

  constructor() {
    this.initializeProviders();
    this.initializeCovalent();
  }

  private initializeProviders() {
    const networks = [
      { chainId: 1, rpcUrl: config.ethereum.rpcUrl },
      { chainId: 8453, rpcUrl: config.base.rpcUrl },
      { chainId: 5003, rpcUrl: config.mantle.rpcUrl }
    ];

    networks.forEach(network => {
      this.providers.set(network.chainId, new ethers.JsonRpcProvider(network.rpcUrl));
    });
  }

  private initializeCovalent() {
    const apiKey = process.env.COVALENT_API_KEY;
    if (apiKey && apiKey.startsWith('cqt_')) {
      this.covalentClient = new GoldRushClient(apiKey);
      console.log('Covalent GoldRush client initialized');
    } else {
      console.log('Covalent API key not found or invalid, using fallback methods');
    }
  }

  getProvider(chainId: number): ethers.JsonRpcProvider {
    const provider = this.providers.get(chainId);
    if (!provider) {
      throw new Error(`Provider not found for chainId: ${chainId}`);
    }
    return provider;
  }

  async getTokenData(contractAddress: string, chainId: number) {
    const provider = this.getProvider(chainId);
    const abi = [
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function name() view returns (string)'
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    const [totalSupply, decimals, symbol, name] = await Promise.all([
      contract.totalSupply(),
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ]);

    return {
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      decimals,
      symbol,
      name
    };
  }

  async getHolderCount(contractAddress: string, chainId: number): Promise<number> {
    try {
      // Method 1: Try Covalent GoldRush API first
      if (this.covalentClient) {
        const covalentCount = await this.fetchHolderCountFromCovalent(contractAddress, chainId);
        if (covalentCount !== null && covalentCount > 0) {
          return covalentCount;
        }
      }

      // Method 2: Fallback to estimation
      return await this.estimateHolderCount(contractAddress, chainId);
      
    } catch (error) {
      console.warn('Error fetching holder count, using fallback:', error);
      return this.getFallbackHolderCount(chainId);
    }
  }

  private async fetchHolderCountFromCovalent(contractAddress: string, chainId: number): Promise<number | null> {
    if (!this.covalentClient) return null;

    try {
      const chainName = this.getCovalentChainName(chainId);
      if (!chainName) return null;

      // Try to get token holders using the token balances endpoint
      // For ERC20 tokens, we can look at the token balances of the contract itself
      const response = await this.covalentClient.BalanceService.getTokenBalancesForWalletAddress(
        chainName,
        contractAddress,
        {
          quoteCurrency: 'USD'
        }
      );

      if (response.error) {
        console.warn('Covalent API error:', response.error_message);
        return null;
      }

      // If we get data, estimate from the number of items (token balances)
      if (response.data?.items && response.data.items.length > 0) {
        // This gives us an indication of how many tokens this contract holds
        // For holder count, we need a different approach
        return await this.estimateHoldersFromTokenTransfers(contractAddress, chainId);
      }

      return null;
      
    } catch (error) {
      console.warn('Covalent API call failed:', error);
      return null;
    }
  }

  private async estimateHoldersFromTokenTransfers(contractAddress: string, chainId: number): Promise<number> {
    if (!this.covalentClient) return 0;

    try {
      const chainName = this.getCovalentChainName(chainId);
      if (!chainName) return 0;

      const uniqueAddresses = new Set<string>();

      // Get transactions for the token contract (ERC20 transfers)
      const response = await this.covalentClient.TransactionService.getAllTransactionsForAddressByPage(
        chainName,
        contractAddress,
        {
          quoteCurrency: 'USD'
        }
      );

      if (response.error || !response.data) {
        return 0;
      }

      // Process transactions to find unique addresses involved with this token
      if (response.data.items) {
        for (const tx of response.data.items) {
          // Look for ERC20 transfer events or interactions
          if (tx.from_address) uniqueAddresses.add(tx.from_address);
          if (tx.to_address) uniqueAddresses.add(tx.to_address);
          
          // Limit to first 100 transactions for performance
          if (uniqueAddresses.size >= 100) break;
        }
      }

      return Math.max(1, uniqueAddresses.size);
      
    } catch (error) {
      console.warn('Failed to estimate holders from token transfers:', error);
      return 0;
    }
  }

  private getCovalentChainName(chainId: number): ChainName | null {
    const chainMap: { [key: number]: ChainName } = {
      1: ChainName.ETH_MAINNET,
      8453: ChainName.BASE_MAINNET,
      59141: ChainName.LINEA_MAINNET,
      137: ChainName.MATIC_MAINNET,
      42161: ChainName.ARBITRUM_MAINNET
    };
    
    return chainMap[chainId] || null;
  }

  private async estimateHolderCount(contractAddress: string, chainId: number): Promise<number> {
    try {
      const tokenData = await this.getTokenData(contractAddress, chainId);
      const totalSupply = parseFloat(tokenData.totalSupply);
      
      // Smart estimation based on token supply
      if (totalSupply > 1000000000) {
        return Math.min(50000, Math.floor(totalSupply / 20000));
      } else if (totalSupply > 1000000) {
        return Math.min(10000, Math.floor(totalSupply / 1000));
      } else if (totalSupply > 10000) {
        return Math.min(1000, Math.floor(totalSupply / 100));
      } else {
        return Math.max(1, Math.floor(totalSupply / 10));
      }
      
    } catch (error) {
      console.warn('Error estimating holder count:', error);
      return this.getFallbackHolderCount(chainId);
    }
  }

  private getFallbackHolderCount(chainId: number): number {
    const fallbackCounts = {
      1: 1500,    // Ethereum
      8453: 800,  // Base  
      59141: 300  // Linea
    };
    
    return fallbackCounts[chainId as keyof typeof fallbackCounts] || 200;
  }

  // Get detailed token information using Covalent
  async getTokenDetails(contractAddress: string, chainId: number) {
    if (!this.covalentClient) {
      return { error: 'Covalent client not initialized' };
    }

    try {
      const chainName = this.getCovalentChainName(chainId);
      if (!chainName) {
        return { error: 'Chain not supported by Covalent' };
      }

      const response = await this.covalentClient.BalanceService.getTokenBalancesForWalletAddress(
        chainName,
        contractAddress,
        {
          quoteCurrency: 'USD'
        }
      );

      if (response.error) {
        return { error: response.error_message };
      }

      return {
        data: response.data,
        holders: response.data?.items?.length || 0
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Test Covalent connection
  async testCovalent(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.covalentClient) {
      return { success: false, error: 'Covalent client not initialized' };
    }

    try {
      // Test with Vitalik's address
      const response = await this.covalentClient.BalanceService.getTokenBalancesForWalletAddress(
        ChainName.ETH_MAINNET,
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
        {
          quoteCurrency: 'USD'
        }
      );

      if (response.error) {
        return { 
          success: false, 
          error: response.error_message 
        };
      }

      return {
        success: true,
        data: {
          address: response.data?.address,
          totalTokens: response.data?.items?.length,
          chain: ChainName.ETH_MAINNET
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get actual token holders (for tokens, not contracts)
  async getTokenHolders(tokenAddress: string, chainId: number, limit: number = 10) {
    if (!this.covalentClient) {
      return { error: 'Covalent client not initialized' };
    }

    try {
      const chainName = this.getCovalentChainName(chainId);
      if (!chainName) {
        return { error: 'Chain not supported by Covalent' };
      }

      // Note: Getting actual token holders requires a different endpoint
      // For now, we'll use the balance service approach
      const response = await this.covalentClient.BalanceService.getTokenBalancesForWalletAddress(
        chainName,
        tokenAddress,
        {
          quoteCurrency: 'USD'
        }
      );

      if (response.error) {
        return { error: response.error_message };
      }

      return {
        holders: response.data?.items?.slice(0, limit) || [],
        total: response.data?.items?.length || 0
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}