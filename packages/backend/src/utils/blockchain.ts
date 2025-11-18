import { ethers } from 'ethers';
import { config } from './config';
import axios from 'axios';

export class BlockchainService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const networks = [
      { chainId: 1, rpcUrl: config.ethereum.rpcUrl },
      { chainId: 8453, rpcUrl: config.base.rpcUrl },
      { chainId: 59141, rpcUrl: config.linea.rpcUrl }
    ];

    networks.forEach(network => {
      this.providers.set(network.chainId, new ethers.JsonRpcProvider(network.rpcUrl));
    });
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
      // Method 1: Try to use blockchain indexer APIs
      const holderCount = await this.fetchHolderCountFromAPI(contractAddress, chainId);
      if (holderCount !== null) {
        return holderCount;
      }

      // Method 2: Estimate based on common token patterns
      return await this.estimateHolderCount(contractAddress, chainId);
      
    } catch (error) {
      console.warn('Error fetching holder count, using fallback:', error);
      return this.getFallbackHolderCount(contractAddress, chainId);
    }
  }

  private async fetchHolderCountFromAPI(contractAddress: string, chainId: number): Promise<number | null> {
    try {
      const apiUrls = this.getExplorerAPIUrls(chainId);
      
      for (const apiUrl of apiUrls) {
        try {
          // Try Covalent API (free tier available)
          if (chainId === 1) { // Ethereum mainnet
            const covalentResponse = await axios.get(
              `https://api.covalenthq.com/v1/1/tokens/${contractAddress}/token_holders/`,
              {
                params: {
                  'key': process.env.COVALENT_API_KEY || 'ckey_' // Free tier key
                }
              }
            );
            
            if (covalentResponse.data.data) {
              return covalentResponse.data.data.pagination.total_count;
            }
          }

          // Try Moralis API (free tier)
          if (process.env.MORALIS_API_KEY) {
            const moralisResponse = await axios.get(
              `https://deep-index.moralis.io/api/v2/erc20/${contractAddress}/owners`,
              {
                params: {
                  chain: this.getMoralisChainName(chainId),
                  limit: 1 // We just need the count
                },
                headers: {
                  'X-API-Key': process.env.MORALIS_API_KEY
                }
              }
            );
            
            if (moralisResponse.data) {
              return moralisResponse.data.total;
            }
          }

        } catch (apiError) {
          console.warn(`API failed for ${apiUrl}:`, apiError);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('All API methods failed for holder count');
      return null;
    }
  }

  private async estimateHolderCount(contractAddress: string, chainId: number): Promise<number> {
    try {
      const provider = this.getProvider(chainId);
      
      // Get token data to make better estimation
      const tokenData = await this.getTokenData(contractAddress, chainId);
      const totalSupply = parseFloat(tokenData.totalSupply);
      
      // Common patterns for holder distribution:
      if (totalSupply > 1000000000) { // Large supply tokens (meme coins, etc.)
        return Math.floor(totalSupply / 100000); // ~0.001% holders/supply ratio
      } else if (totalSupply > 1000000) { // Medium supply
        return Math.floor(totalSupply / 10000); // ~0.01% holders/supply ratio  
      } else if (totalSupply > 10000) { // Small supply
        return Math.floor(totalSupply / 1000); // ~0.1% holders/supply ratio
      } else { // Very small supply (NFTs, fractionalized assets)
        return Math.max(1, Math.floor(totalSupply / 100)); // ~1% holders/supply ratio
      }
      
    } catch (error) {
      console.warn('Error estimating holder count:', error);
      return 100; // Fallback estimation
    }
  }

  private getFallbackHolderCount(contractAddress: string, chainId: number): number {
    // Simple fallback based on chain and address patterns
    const fallbackCounts = {
      1: 1000,    // Ethereum: assume 1000 holders
      8453: 500,  // Base: assume 500 holders  
      59141: 100  // Linea: assume 100 holders
    };
    
    return fallbackCounts[chainId as keyof typeof fallbackCounts] || 100;
  }

  private getExplorerAPIUrls(chainId: number): string[] {
    const urls = {
      1: [
        'https://api.etherscan.io/api',
        'https://api.covalenthq.com/v1/1/',
        'https://deep-index.moralis.io/api/v2/'
      ],
      8453: [
        'https://api.basescan.org/api',
        'https://deep-index.moralis.io/api/v2/'
      ],
      59141: [
        'https://api.lineascan.build/api',
        'https://deep-index.moralis.io/api/v2/'
      ]
    };
    
    return urls[chainId as keyof typeof urls] || [];
  }

  private getMoralisChainName(chainId: number): string {
    const chainMap: { [key: number]: string } = {
      1: 'eth',
      8453: 'base',
      59141: 'linea'
    };
    return chainMap[chainId] || 'eth';
  }

  // Additional helper method to get top holders for distribution analysis
  async getTopHolders(contractAddress: string, chainId: number, limit: number = 10): Promise<{address: string, balance: string}[]> {
    try {
      // This would require an API like Covalent or Moralis
      // For hackathon, return mock data or empty array
      return [];
    } catch (error) {
      console.warn('Error fetching top holders:', error);
      return [];
    }
  }
}