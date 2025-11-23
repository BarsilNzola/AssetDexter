import lighthouse from '@lighthouse-web3/sdk';

export interface StoredAsset {
  id: string;
  assetData: any;
  scannedAt: Date;
  addedToCollectionAt: Date;
  isMinted: boolean;
  mintedTxHash?: string;
  mintedAt?: Date;
  contractData?: {
    assetType: number;
    rarity: number;
    risk: number;
    rarityScore: number;
    predictionScore: number;
    assetAddress: string;
    assetName: string;
    assetSymbol: string;
    currentValue: number;
    yieldRate: number;
    tokenURI: string;
  };
}

export interface UserCollection {
  userAddress: string;
  assets: StoredAsset[];
  updatedAt: string;
  version: string;
}

export class LighthouseStorageService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_LIGHTHOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Lighthouse API key not found, using localStorage fallback');
    }
  }

  async storeUserCollection(userAddress: string, assets: StoredAsset[]): Promise<string> {
    const collection: UserCollection = {
      userAddress,
      assets,
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    try {
      if (this.apiKey) {
        // Upload to Lighthouse
        const uploadResponse = await lighthouse.uploadText(
          JSON.stringify(collection),
          this.apiKey,
          `assetdexter_${userAddress}_collection`
        );

        if (uploadResponse.data && uploadResponse.data.Hash) {
          const cid = uploadResponse.data.Hash;
          // Store CID reference locally
          localStorage.setItem(`lighthouse_cid_${userAddress}`, cid);
          return cid;
        }
      }
    } catch (error) {
      console.error('Lighthouse upload failed, using localStorage:', error);
    }

    // Fallback to localStorage
    const storageKey = `assetdexter_collection_${userAddress}`;
    localStorage.setItem(storageKey, JSON.stringify(collection));
    return storageKey;
  }

  async getUserCollection(userAddress: string): Promise<StoredAsset[]> {
    try {
      let collectionData: UserCollection | null = null;

      // Try to fetch from Lighthouse first
      if (this.apiKey) {
        const storedCID = localStorage.getItem(`lighthouse_cid_${userAddress}`);
        if (storedCID) {
          try {
            const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${storedCID}`);
            if (response.ok) {
              collectionData = await response.json();
            }
          } catch (error) {
            console.warn('Failed to fetch from Lighthouse, trying localStorage:', error);
          }
        }
      }

      // Fallback to localStorage
      if (!collectionData) {
        const storageKey = `assetdexter_collection_${userAddress}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          collectionData = JSON.parse(stored);
        }
      }

      return collectionData?.assets || [];
    } catch (error) {
      console.error('Failed to fetch user collection:', error);
      return [];
    }
  }

  async syncCollectionToLighthouse(userAddress: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const storageKey = `assetdexter_collection_${userAddress}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const uploadResponse = await lighthouse.uploadText(
          stored,
          this.apiKey,
          `assetdexter_${userAddress}_collection_sync`
        );

        if (uploadResponse.data && uploadResponse.data.Hash) {
          localStorage.setItem(`lighthouse_cid_${userAddress}`, uploadResponse.data.Hash);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Lighthouse sync failed:', error);
      return false;
    }
  }
}