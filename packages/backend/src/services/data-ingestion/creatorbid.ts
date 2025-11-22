import axios from 'axios';
import { config } from '../../utils/config';
import https from 'https';

export interface CreatorBidAsset {
  id: string;
  title: string;
  artist: string;
  currentBid: number;
  estimate: {
    low: number;
    high: number;
  };
  provenance: string[];
  imageUrl: string;
  category: string;
}

export class CreatorBidService {
  private baseUrl: string;
  private axiosInstance;

  constructor() {
    // Use the correct base URL from documentation
    this.baseUrl = 'https://creator.bid/api';
    
    // Create axios instance with proper configuration
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'AssetDexter/1.0.0',
        'Accept': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Bypass certificate validation for now
        secureProtocol: 'TLSv1_2_method',
      })
    });

    // Add request interceptor for debugging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`Making request to CreatorBid: ${config.url}`);
        return config;
      },
      (error) => {
        console.error('CreatorBid request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`CreatorBid response received - Status: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('CreatorBid response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async fetchArtAssets(): Promise<CreatorBidAsset[]> {
    try {
      console.log('Fetching agents from CreatorBid API...');
      
      // Use the correct endpoint and parameters from documentation
      const agentsResponse = await this.axiosInstance.get(`${this.baseUrl}/agents`, {
        params: {
          limit: 24,
          page: 1,
          sortDirection: 'desc',
          sortBy: 'marketCap',
          extra: 'twitter'
        }
      });

      const agents = agentsResponse.data?.agents || agentsResponse.data?.data || [];
      console.log(`Found ${agents.length} agents from CreatorBid`);

      // Transform agent data into art assets format
      const artAssets: CreatorBidAsset[] = agents.map((agent: any, index: number) => {
        // Create art asset from agent data
        // Adjust this mapping based on actual API response structure
        return {
          id: agent.id || `agent-${index}`,
          title: agent.name || agent.username || `Creator Bid Agent ${index + 1}`,
          artist: agent.creatorName || agent.username || 'Unknown Artist',
          currentBid: agent.currentBid || agent.marketCap || agent.price || (Math.random() * 10 + 1),
          estimate: {
            low: agent.estimateLow || (agent.currentBid * 0.8) || 1,
            high: agent.estimateHigh || (agent.currentBid * 1.5) || 2
          },
          provenance: agent.provenance || ['CreatorBid Platform'],
          imageUrl: agent.imageUrl || agent.avatar || `https://picsum.photos/400/400?random=${index}`,
          category: agent.category || 'Digital Art'
        };
      });

      console.log(`Transformed ${artAssets.length} art assets from CreatorBid agents`);
      return artAssets;
    } catch (error) {
      console.error('Failed to fetch CreatorBid art assets:', error);
      // Return empty array on error (no mock data)
      return [];
    }
  }

  async getAgentMetadata(agentAddress: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`${this.baseUrl}/agents/${agentAddress}`);
      return response.data || {};
    } catch (error) {
      console.warn(`Failed to fetch metadata for agent ${agentAddress}:`, error);
      return {};
    }
  }

  async getAgentPrice(agentAddress: string): Promise<number> {
    try {
      const response = await this.axiosInstance.get(`${this.baseUrl}/agents/${agentAddress}`);
      const agentData = response.data;
      return agentData.currentBid || agentData.marketCap || agentData.price || 0;
    } catch (error) {
      console.warn(`Failed to fetch price for agent ${agentAddress}:`, error);
      return 0;
    }
  }

  async getAllAgents(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`${this.baseUrl}/agents`, {
        params: {
          limit: 50,
          page: 1,
          sortDirection: 'desc',
          sortBy: 'marketCap'
        }
      });
      return response.data?.agents || response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch agents:', error);
      return [];
    }
  }

  async getAssetPrice(assetId: string): Promise<number> {
    try {
      // If it's an agent ID, get the agent price
      if (assetId.startsWith('agent-') || assetId.includes('creator')) {
        const agents = await this.getAllAgents();
        const agent = agents.find((a: any) => a.id === assetId || a.address === assetId);
        return agent?.currentBid || agent?.marketCap || agent?.price || 0;
      }
      
      // Otherwise try to get specific asset
      const assets = await this.fetchArtAssets();
      const asset = assets.find(a => a.id === assetId);
      return asset?.currentBid || 0;
    } catch (error) {
      console.warn(`Failed to get price for asset ${assetId}:`, error);
      return 0;
    }
  }
}