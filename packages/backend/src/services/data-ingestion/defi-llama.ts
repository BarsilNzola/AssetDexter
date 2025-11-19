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
      const response = await axios.get(this.baseUrl);
      const pools = response.data.data;

      return pools.filter((pool: any) => 
        this.isRWAPool(pool.project) &&
        (pool.chain === 'Ethereum' || pool.chain === 'Base' || pool.chain === 'Linea')
      ).map((pool: any) => ({
        id: pool.pool,
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol,
        tvl: pool.tvlUsd,
        apy: pool.apy || 0
      }));
    } catch (error) {
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
      'ribbon'
    ];
    
    return rwaProjects.some(rwaProject => 
      project.toLowerCase().includes(rwaProject)
    );
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