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
  private apiKey: string;

  constructor() {
    this.baseUrl = config.apis.creatorBid || 'https://api.creatorbid.com/v1';
    this.apiKey = process.env.CREATORBID_API_KEY || '';
  }

  async fetchArtAssets(): Promise<CreatorBidAsset[]> {
    if (!this.apiKey) {
      throw new Error('CreatorBid API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/assets`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.assets.map((asset: any) => ({
        id: asset.id,
        title: asset.title,
        artist: asset.artist,
        currentBid: asset.current_bid,
        estimate: {
          low: asset.estimate_low,
          high: asset.estimate_high
        },
        provenance: asset.provenance || [],
        imageUrl: asset.image_url,
        category: asset.category
      }));
    } catch (error) {
      throw new Error(`Failed to fetch CreatorBid data: ${error}`);
    }
  }

  async getAssetPrice(assetId: string): Promise<number> {
    const assets = await this.fetchArtAssets();
    const asset = assets.find(a => a.id === assetId);
    return asset?.currentBid || 0;
  }
}