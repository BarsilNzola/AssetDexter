import axios from 'axios';
import { config } from '../../utils/config';

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

  constructor() {
    this.baseUrl = config.apis.creatorBid;
  }

  async fetchArtAssets(): Promise<CreatorBidAsset[]> {
    try {
      // Get all agents first
      const agentsResponse = await axios.get(`${this.baseUrl}/agents`);
      const agents = agentsResponse.data.agents || [];

      // For each agent, get their art/collectibles data
      const artAssets: CreatorBidAsset[] = [];

      for (const agent of agents.slice(0, 10)) { // Limit to first 10 agents for demo
        try {
          // Get agent metadata which may include art/collectibles
          const agentMetadata = await this.getAgentMetadata(agent.address);
          if (agentMetadata.artAssets) {
            artAssets.push(...agentMetadata.artAssets);
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for agent ${agent.address}:`, error);
        }
      }

      // If no art assets found, return mock data for demo
      if (artAssets.length === 0) {
        return this.getMockArtAssets();
      }

      return artAssets;
    } catch (error) {
      console.warn('Failed to fetch CreatorBid art assets, using mock data:', error);
      return this.getMockArtAssets();
    }
  }

  private async getAgentMetadata(agentAddress: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/agents/${agentAddress}/metadata`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch metadata for agent ${agentAddress}:`, error);
      return {};
    }
  }

  private getMockArtAssets(): CreatorBidAsset[] {
    // Return mock art data for demo purposes
    return [
      {
        id: 'art-1',
        title: 'Digital Dreams',
        artist: 'CryptoPainter',
        currentBid: 2.5,
        estimate: { low: 1.5, high: 3.0 },
        provenance: ['Minted 2023', 'First sale: 1.2 ETH'],
        imageUrl: 'https://example.com/art1.jpg',
        category: 'Digital Art'
      },
      {
        id: 'art-2', 
        title: 'Neural Networks',
        artist: 'AI_Artist',
        currentBid: 1.8,
        estimate: { low: 1.0, high: 2.5 },
        provenance: ['AI Generated', 'Limited edition of 100'],
        imageUrl: 'https://example.com/art2.jpg',
        category: 'AI Art'
      },
      {
        id: 'art-3',
        title: 'Blockchain Blues',
        artist: 'DeFi_DaVinci',
        currentBid: 3.2,
        estimate: { low: 2.0, high: 4.0 },
        provenance: ['Inspired by Ethereum', 'Charity auction'],
        imageUrl: 'https://example.com/art3.jpg',
        category: 'Crypto Art'
      }
    ];
  }

  async getAgentPrice(agentAddress: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/agents/${agentAddress}/price`);
      return response.data.price || 0;
    } catch (error) {
      console.warn(`Failed to fetch price for agent ${agentAddress}:`, error);
      return 0;
    }
  }

  async getAllAgents(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/agents`);
      return response.data.agents || [];
    } catch (error) {
      console.warn('Failed to fetch agents:', error);
      return [];
    }
  }

  async getAssetPrice(assetId: string): Promise<number> {
    const assets = await this.fetchArtAssets();
    const asset = assets.find(a => a.id === assetId);
    return asset?.currentBid || 0;
  }
}