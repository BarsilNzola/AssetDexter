import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../lib/utils/constants';
import { LighthouseStorageService, StoredAsset } from '../services/lighthouse-storage';

interface MintParams {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  assetType: number;
  rarityScore: number;
  rarity: number;        
  risk: number;    
  predictionScore: number;
  currentValue: bigint;
  yieldRate: bigint;
  tokenURI?: string;
}

export const useMint = () => {
  const [isMinting, setIsMinting] = useState(false);
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const storageService = new LighthouseStorageService();

  // Load user collection
  const loadCollection = useCallback(async (): Promise<StoredAsset[]> => {
    if (!address) return [];
    return await storageService.getUserCollection(address);
  }, [address]);

  // Add to collection
  const addToCollection = useCallback(async (scannedAsset: any): Promise<boolean> => {
    if (!address) return false;
  
    // Ensure we have a proper symbol
    const assetSymbol = scannedAsset.tokenInfo?.symbol || 
                       scannedAsset.symbol || 
                       (scannedAsset.tokenInfo?.name?.substring(0, 4) || 'UNKN').toUpperCase();
  
    const newAsset: StoredAsset = {
      id: `${scannedAsset.assetId}_${Date.now()}`,
      assetData: scannedAsset,
      scannedAt: new Date(),
      addedToCollectionAt: new Date(),
      isMinted: false,
      contractData: {
        assetType: scannedAsset.assetType || 0,
        rarity: scannedAsset.rarityTier || 1,
        risk: scannedAsset.riskTier || 1,
        rarityScore: scannedAsset.rarityScore || 75,
        predictionScore: scannedAsset.predictionScore || 50,
        assetAddress: scannedAsset.tokenInfo?.address || scannedAsset.assetId,
        assetName: scannedAsset.tokenInfo?.name || scannedAsset.name,
        assetSymbol: assetSymbol, // Use the properly formatted symbol
        currentValue: scannedAsset.metrics?.liquidityDepth || 1000000,
        yieldRate: Math.floor((scannedAsset.metrics?.yield || 0.05) * 10000),
        tokenURI: scannedAsset.tokenURI || ''
      }
    };
  
    try {
      const currentCollection = await loadCollection();
      const updatedCollection = [...currentCollection, newAsset];
      await storageService.storeUserCollection(address, updatedCollection);
      queryClient.invalidateQueries({ queryKey: ['user-collection'] });
      return true;
    } catch (error) {
      console.error('Failed to add to collection:', error);
      return false;
    }
  }, [address, loadCollection, queryClient]);

  // Remove from collection
  const removeFromCollection = useCallback(async (collectionId: string): Promise<void> => {
    if (!address) return;

    const currentCollection = await loadCollection();
    const updatedCollection = currentCollection.filter(item => item.id !== collectionId);
    await storageService.storeUserCollection(address, updatedCollection);
    queryClient.invalidateQueries({ queryKey: ['user-collection'] });
  }, [address, loadCollection, queryClient]);

  // Mint asset
  const mintMutation = useMutation({
    mutationFn: async (params: { mintParams: MintParams; collectionId?: string }) => {
      // Convert BigInt values to strings for JSON serialization
      const serializedParams = {
        ...params.mintParams,
        currentValue: params.mintParams.currentValue.toString(),
        yieldRate: params.mintParams.yieldRate.toString()
      };
    
      console.log('Sending mint request:', {
        ...serializedParams,
        userAddress: address,
      });
    
      try {
        const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/mint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...serializedParams,
            userAddress: address,
          }),
        });
    
        if (!response.ok) {
          let errorDetails = '';
          try {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData);
          } catch {
            errorDetails = await response.text();
          }
          console.error('Mint failed with details:', {
            status: response.status,
            statusText: response.statusText,
            details: errorDetails
          });
          throw new Error(`Mint failed: ${response.status} ${response.statusText} - ${errorDetails}`);
        }
    
        const result = await response.json();
        console.log('Mint successful:', result);
    
        // Update collection if collectionId provided
        if (params.collectionId && address) {
          const currentCollection = await loadCollection();
          const updatedCollection = currentCollection.map(item =>
            item.id === params.collectionId
              ? { 
                  ...item, 
                  isMinted: true, 
                  mintedTxHash: result.txHash,
                  mintedAt: new Date()
                }
              : item
          );
          await storageService.storeUserCollection(address, updatedCollection);
        }
    
        return result;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      queryClient.invalidateQueries({ queryKey: ['user-collection'] });
    },
  });

  const mintDiscoveryCard = async (mintParams: MintParams, collectionId?: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsMinting(true);
    try {
      const result = await mintMutation.mutateAsync({ mintParams, collectionId });
      return result;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    // Minting functions
    mintDiscoveryCard,
    isMinting: isMinting || mintMutation.isPending,
    isConfirmed: mintMutation.isSuccess,
    error: mintMutation.error,
    data: mintMutation.data,
    
    // Collection functions
    loadCollection,
    addToCollection,
    removeFromCollection,
  };
};