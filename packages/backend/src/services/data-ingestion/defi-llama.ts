import axios from 'axios';
import { DeFiLlamaPool } from '../../../../shared/src/types/rwa';
import { config } from '../../utils/config';

export class DeFiLlamaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.apis.defiLlama;
  }

  async fetchRWAPools(): Promise<DeFiLlamaPool[]> {
    try {
      console.log(`Fetching DeFi Llama data from: ${this.baseUrl}`);
      const response = await axios.get(this.baseUrl);
      const pools = response.data.data;
  
      console.log(`Total pools from DeFi Llama: ${pools.length}`);
  
      const filteredPools = pools.filter((pool: any) => {
        const isRWA = this.isRWAPool(pool.project);
        
        // Broaden chain filter to include more chains with RWA presence
        const isValidChain = [
          'Ethereum',
          'Base', 
          'Linea',
          'Solana',
          'Avalanche',
          'Polygon',
          'Arbitrum'
        ].includes(pool.chain);
        
        if (isRWA) {
          console.log(`Found RWA pool: ${pool.project} on ${pool.chain} - TVL: ${pool.tvlUsd}`);
        }
        
        return isRWA && isValidChain;
      });
  
      console.log(`Filtered RWA pools: ${filteredPools.length}`);
  
      const result = filteredPools.map((pool: any) => ({
        id: pool.pool,
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol,
        tvl: pool.tvlUsd,
        apy: pool.apy || 0
      }));
  
      console.log('Final RWA pools result:', result.length);
      return result;
    } catch (error) {
      console.error('Failed to fetch DeFi Llama data:', error);
      throw new Error(`Failed to fetch DeFi Llama data: ${error}`);
    }
  }

  private isRWAPool(project: string): boolean {
    const rwaProjects = [
      'ondo',
      'maple',
      'centrifuge',
      'goldfinch',
      'truefi',
      'credix',
      'ribbon',
      'clearpool',
      'morpho',
      'compound',
      'aave',
      'mellow',
      'usdbc',
      'usdt',
      'usdc',
      'dai'
    ];
    
    const isRWA = rwaProjects.some(rwaProject => 
      project.toLowerCase().includes(rwaProject)
    );
    
    if (isRWA) {
      console.log(`Identified as RWA: ${project}`);
    }
    
    return isRWA;
  }

  async getPoolTVL(poolId: string): Promise<number> {
    const pools = await this.fetchRWAPools();
    const pool = pools.find(p => p.id === poolId);
    return pool?.tvl || 0;
  }

  async getPoolAPY(poolId: string): Promise<number> {
    const pools = await this.fetchRWAPools();
    const pool = pools.find(p => p.id === poolId);
    return pool?.apy || 0;
  }
}