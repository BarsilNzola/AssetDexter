import lighthouse from '@lighthouse-web3/sdk';

export interface StoredAsset {
  id: string;
  assetData: {
    // Core required fields with defaults
    name: string;
    symbol: string;
    assetType: number;
    rarity: number;
    risk: number;
    rarityScore: number;
    predictionScore: number;
    
    // Optional fields from scanning
    assetId?: string;
    rarityTier?: any;
    riskTier?: any;
    marketPrediction?: 'Bullish' | 'Neutral' | 'Bearish';
    predictionConfidence?: number;
    healthScore?: number;
    metrics?: {
      liquidityDepth: number;
      holderDistribution: number;
      yield: number;
      volatility: number;
      age: number;
    };
    tokenInfo?: {
      address: string;
      chainId: number;
      name: string;
    };
    
    // Allow additional fields
    [key: string]: any;
  };
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
    } else {
      console.log('Lighthouse storage initialized with API key');
    }
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Add a new scanned asset to user's collection
   */
  async addScannedAsset(userAddress: string, scanResult: any, tokenInfo?: any): Promise<string> {
    const normalizedAsset = this.createStoredAsset(scanResult, tokenInfo);
    
    const existingAssets = await this.getUserCollection(userAddress);
    const updatedAssets = [...existingAssets, normalizedAsset];

    return await this.storeUserCollection(userAddress, updatedAssets);
  }

  /**
   * Update an asset when it's minted
   */
  async markAssetAsMinted(userAddress: string, assetId: string, txHash: string, contractData: any): Promise<string> {
    const existingAssets = await this.getUserCollection(userAddress);
    
    const updatedAssets = existingAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          isMinted: true,
          mintedTxHash: txHash,
          mintedAt: new Date(),
          contractData: this.normalizeContractData(contractData)
        };
      }
      return asset;
    });

    return await this.storeUserCollection(userAddress, updatedAssets);
  }

  /**
   * Remove an asset from collection
   */
  async removeAssetFromCollection(userAddress: string, assetId: string): Promise<string> {
    const existingAssets = await this.getUserCollection(userAddress);
    const updatedAssets = existingAssets.filter(asset => asset.id !== assetId);

    return await this.storeUserCollection(userAddress, updatedAssets);
  }

  /**
   * Get user's complete collection
   */
  async getUserCollection(userAddress: string): Promise<StoredAsset[]> {
    try {
      let collectionData: UserCollection | null = null;

      // Try Lighthouse first
      if (this.apiKey) {
        collectionData = await this.fetchFromLighthouse(userAddress);
      }

      // Fallback to localStorage
      if (!collectionData) {
        collectionData = await this.fetchFromLocalStorage(userAddress);
      }

      if (collectionData) {
        // Migrate old data format if needed
        const migratedAssets = this.migrateAssets(collectionData.assets);
        return this.deserializeDates(migratedAssets);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch user collection:', error);
      return [];
    }
  }

  /**
   * Clear entire collection
   */
  async clearCollection(userAddress: string): Promise<string> {
    return await this.storeUserCollection(userAddress, []);
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Create a properly normalized stored asset from scan results
   */
  private createStoredAsset(scanResult: any, tokenInfo?: any): StoredAsset {
    const now = new Date();
    
    // Extract and normalize all data
    const normalizedAssetData = this.normalizeAssetData(scanResult, tokenInfo);
    
    return {
      id: `asset_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      assetData: normalizedAssetData,
      scannedAt: now,
      addedToCollectionAt: now,
      isMinted: false
    };
  }

  /**
   * Normalize asset data with proper fallbacks
   */
  private normalizeAssetData(scanResult: any, tokenInfo?: any): StoredAsset['assetData'] {
    // Get name and symbol from tokenInfo first, then scanResult, then defaults
    const name = tokenInfo?.name || 
                scanResult.name || 
                scanResult.assetName || 
                this.getDefaultAssetName(scanResult.assetType);
    
    const symbol = tokenInfo?.symbol || 
                  scanResult.symbol || 
                  scanResult.assetSymbol || 
                  this.getDefaultAssetSymbol(scanResult.assetType);

    return {
      // Core required fields
      name,
      symbol,
      assetType: scanResult.assetType || 0,
      rarity: scanResult.rarity || scanResult.rarityTier || 1,
      risk: scanResult.risk || scanResult.riskTier || 1,
      rarityScore: scanResult.rarityScore || 50,
      predictionScore: scanResult.predictionScore || scanResult.predictionConfidence || 50,
      
      // Preserve all scan result data
      ...scanResult,
      
      // Add token info if available
      ...(tokenInfo && { tokenInfo })
    };
  }

  /**
   * Normalize contract data for minted assets
   */
  private normalizeContractData(contractData: any) {
    return {
      assetType: contractData.assetType || 0,
      rarity: contractData.rarity || 1,
      risk: contractData.risk || 1,
      rarityScore: contractData.rarityScore || 50,
      predictionScore: contractData.predictionScore || 50,
      assetAddress: contractData.assetAddress || '',
      assetName: contractData.assetName || 'Minted Asset',
      assetSymbol: contractData.assetSymbol || 'MINT',
      currentValue: contractData.currentValue || 0,
      yieldRate: contractData.yieldRate || 0,
      tokenURI: contractData.tokenURI || ''
    };
  }

  /**
   * Default asset names by type
   */
  private getDefaultAssetName(assetType: number): string {
    const defaultNames = [
      'Tokenized Treasury',
      'Real Estate Asset', 
      'Fine Art Piece',
      'Luxury Collectible',
      'Private Credit'
    ];
    return defaultNames[assetType] || 'Digital RWA';
  }

  /**
   * Default asset symbols by type
   */
  private getDefaultAssetSymbol(assetType: number): string {
    const defaultSymbols = ['TBILL', 'REAL', 'ART', 'LUX', 'CREDIT'];
    return defaultSymbols[assetType] || 'RWA';
  }

  /**
   * Store collection to Lighthouse or localStorage
   */
  public async storeUserCollection(userAddress: string, assets: StoredAsset[]): Promise<string> {
    const collection: UserCollection = {
      userAddress,
      assets: this.serializeDates(assets),
      updatedAt: new Date().toISOString(),
      version: '2.0.0' // New version with normalized data
    };

    try {
      if (this.apiKey) {
        const cid = await this.uploadToLighthouse(collection, userAddress);
        
        // Also store locally as backup
        this.storeToLocalStorage(userAddress, collection);
        
        return cid;
      } else {
        // Lighthouse not available, use localStorage only
        return this.storeToLocalStorage(userAddress, collection);
      }
    } catch (error) {
      console.error('Storage failed, using localStorage fallback:', error);
      return this.storeToLocalStorage(userAddress, collection);
    }
  }

  /**
   * Upload to Lighthouse
   */
  private async uploadToLighthouse(collection: UserCollection, userAddress: string): Promise<string> {
    const uploadResponse = await lighthouse.uploadText(
      JSON.stringify(collection),
      this.apiKey,
      `assetdexter_${userAddress}_collection`
    );

    if (uploadResponse.data?.Hash) {
      const cid = uploadResponse.data.Hash;
      console.log(`Collection uploaded to Lighthouse with CID: ${cid}`);
      
      // Store CID reference
      localStorage.setItem(`lighthouse_cid_${userAddress}`, cid);
      return cid;
    } else {
      throw new Error('Invalid upload response from Lighthouse');
    }
  }

  /**
   * Store to localStorage
   */
  private storeToLocalStorage(userAddress: string, collection: UserCollection): string {
    const storageKey = `assetdexter_collection_${userAddress}`;
    localStorage.setItem(storageKey, JSON.stringify(collection));
    console.log('Collection stored to localStorage');
    return storageKey;
  }

  /**
   * Fetch from Lighthouse
   */
  private async fetchFromLighthouse(userAddress: string): Promise<UserCollection | null> {
    try {
      const storedCID = localStorage.getItem(`lighthouse_cid_${userAddress}`);
      if (!storedCID) return null;

      console.log(`Fetching collection from Lighthouse with CID: ${storedCID}`);
      const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${storedCID}`);
      
      if (response.ok) {
        const collectionData = await response.json();
        console.log('Successfully fetched collection from Lighthouse');
        return collectionData;
      }
    } catch (error) {
      console.warn('Failed to fetch from Lighthouse:', error);
    }
    
    return null;
  }

  /**
   * Fetch from localStorage
   */
  private fetchFromLocalStorage(userAddress: string): UserCollection | null {
    const storageKey = `assetdexter_collection_${userAddress}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      console.log('Loading collection from localStorage');
      return JSON.parse(stored);
    }
    
    return null;
  }

  /**
   * Migrate old data formats to new format
   */
  private migrateAssets(assets: any[]): any[] {
    return assets.map(asset => {
      // If asset is in old format without proper assetData, migrate it
      if (!asset.assetData || typeof asset.assetData !== 'object') {
        console.log('Migrating old asset format:', asset);
        
        return {
          ...asset,
          assetData: this.normalizeAssetData(asset)
        };
      }
      
      // Ensure assetData has required fields
      if (!asset.assetData.name || !asset.assetData.symbol) {
        return {
          ...asset,
          assetData: this.normalizeAssetData(asset.assetData)
        };
      }
      
      return asset;
    });
  }

  /**
   * Serialize dates for storage
   */
  private serializeDates(assets: StoredAsset[]): any[] {
    return assets.map(asset => ({
      ...asset,
      scannedAt: asset.scannedAt.toISOString(),
      addedToCollectionAt: asset.addedToCollectionAt.toISOString(),
      mintedAt: asset.mintedAt ? asset.mintedAt.toISOString() : undefined
    }));
  }

  /**
   * Deserialize dates after retrieval
   */
  private deserializeDates(assets: any[]): StoredAsset[] {
    return assets.map(asset => ({
      ...asset,
      scannedAt: new Date(asset.scannedAt),
      addedToCollectionAt: new Date(asset.addedToCollectionAt),
      mintedAt: asset.mintedAt ? new Date(asset.mintedAt) : undefined
    }));
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get storage statistics
   */
  async getStorageStats(userAddress: string): Promise<{
    totalAssets: number;
    mintedAssets: number;
    scannedAssets: number;
    lastUpdated: Date | null;
  }> {
    const assets = await this.getUserCollection(userAddress);
    
    return {
      totalAssets: assets.length,
      mintedAssets: assets.filter(a => a.isMinted).length,
      scannedAssets: assets.filter(a => !a.isMinted).length,
      lastUpdated: assets.length > 0 ? 
        new Date(Math.max(...assets.map(a => a.addedToCollectionAt.getTime()))) : 
        null
    };
  }

  /**
   * Force sync to Lighthouse
   */
  async syncToLighthouse(userAddress: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('No Lighthouse API key available for sync');
      return false;
    }

    try {
      const assets = await this.getUserCollection(userAddress);
      await this.storeUserCollection(userAddress, assets);
      return true;
    } catch (error) {
      console.error('Lighthouse sync failed:', error);
      return false;
    }
  }
}