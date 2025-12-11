import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { AssetType, RarityTier, RiskTier } from '../../../shared/src/types/rwa';
import { CONTRACT_ADDRESSES } from '../lib/utils/constants';
import RWADiscoveryCardABI from '../../../contracts/artifacts/contracts/RWADiscoveryCard.sol/RWADiscoveryCard.json';

interface DiscoveryParams {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  assetType: AssetType;
  rarity: RarityTier;
  risk: RiskTier;
  rarityScore: number;
  predictionScore: number;
  currentValue: bigint;
  yieldRate: bigint;
  tokenURI: string;
}

interface DiscoveryResult {
  total: number;
  valid: number;
  saved: number;
  failed: number;
  transactionHashes: string[];
  assets: DiscoveryParams[];
}

export const useDiscovery = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash
  });
  
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [existingAssets, setExistingAssets] = useState<any[]>([]);
  const [results, setResults] = useState<DiscoveryResult>({ 
    total: 0, 
    valid: 0, 
    saved: 0, 
    failed: 0, 
    transactionHashes: [], 
    assets: [] 
  });

  useEffect(() => {
    const fetchExistingAssets = async () => {
      try {
        // Use the working endpoint
        const response = await fetch('/api/contracts/debug-contract');
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle the response format
          if (data.discoveries && Array.isArray(data.discoveries)) {
            setExistingAssets(data.discoveries);
            console.log(` Loaded ${data.discoveries.length} existing assets from contract`);
            
            // Log the asset addresses for debugging
            data.discoveries.forEach((asset: any, index: number) => {
              console.log(`Asset ${index + 1}:`, {
                tokenId: asset.tokenId,
                address: asset.assetAddress,
                name: asset.assetName,
                symbol: asset.assetSymbol
              });
            });
          } else {
            console.warn('Unexpected response format from debug-contract:', data);
            setExistingAssets([]);
          }
        } else {
          console.error('Failed to fetch from debug-contract:', response.status);
          setExistingAssets([]);
        }
      } catch (error) {
        console.error('Failed to fetch existing assets:', error);
        setExistingAssets([]);
      }
    };
    
    fetchExistingAssets();
  }, []);

  // Single asset discovery with better error handling
  const discoverAsset = useCallback(async (params: DiscoveryParams): Promise<string> => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    // Validate required fields
    if (!params.assetAddress || !params.assetName || !params.assetSymbol) {
      throw new Error('Missing required asset fields: address, name, or symbol');
    }

    console.log('Attempting to discover asset:', {
      name: params.assetName,
      address: params.assetAddress,
      symbol: params.assetSymbol
    });

    // Convert values to BigInt if needed
    const processedParams = {
      ...params,
      currentValue: BigInt(params.currentValue),
      yieldRate: BigInt(params.yieldRate)
    };

    return new Promise((resolve, reject) => {
      try {
        writeContract({
          address: CONTRACT_ADDRESSES.DISCOVERY_CARD as `0x${string}`,
          abi: RWADiscoveryCardABI.abi,
          functionName: 'discoverAsset',
          args: [
            address,                          
            processedParams.assetType,        
            processedParams.rarity,           
            processedParams.risk,             
            processedParams.rarityScore,      
            processedParams.predictionScore,  
            processedParams.assetAddress,     
            processedParams.assetName,        
            processedParams.assetSymbol,      
            processedParams.currentValue,     
            processedParams.yieldRate,        
            processedParams.tokenURI          
          ],
        }, {
          onSuccess: (hash) => {
            console.log('Transaction submitted successfully:', hash);
            resolve(hash);
          },
          onError: (error) => {
            console.error('Transaction failed in writeContract:', error);
            // Provide more specific error messages
            let errorMessage = 'Transaction failed';
            if (error.message.includes('user rejected')) {
              errorMessage = 'Transaction rejected by user';
            } else if (error.message.includes('insufficient funds')) {
              errorMessage = 'Insufficient LineaETH for gas fees';
            } else if (error.message.includes('revert')) {
              errorMessage = 'Contract execution reverted - check asset parameters';
            } else if (error.message.includes('nonce')) {
              errorMessage = 'Transaction nonce issue - try again';
            }
            reject(new Error(errorMessage));
          }
        });

      } catch (error) {
        console.error('Error in discoverAsset promise:', error);
        reject(error instanceof Error ? error : new Error('Unknown transaction error'));
      }
    });
  }, [address, writeContract]);

  // Batch discovery from external sources
  const discoverFromSources = async (
    options?: {
      batchSize?: number;
      batchNumber?: number;
      skipExisting?: boolean;
    }
  ): Promise<DiscoveryResult> => {
    setIsDiscovering(true);
    
    try {
      console.log('Starting auto-discovery from sources...', options);
      
      const response = await fetch('/api/scan/discover-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to discover assets from sources');
      }

      const { assets } = await response.json();
      
      console.log(`Discovered ${assets.length} assets from sources`);
      
      const validAssets: DiscoveryParams[] = [];

      // Get existing asset addresses to skip duplicates
      const existingAssetAddresses = new Set<string>();
      if (options?.skipExisting !== false && existingAssets) {
        existingAssets.forEach((asset: any) => {
          if (asset.assetAddress) {
            existingAssetAddresses.add(asset.assetAddress.toLowerCase());
          }
        });
        console.log(`Found ${existingAssetAddresses.size} existing assets in contract`);
      }

      // Calculate batch range
      const batchSize = options?.batchSize || 10; // Default 10 per batch
      const batchNumber = options?.batchNumber || 1; // Start from batch 1
      const startIndex = (batchNumber - 1) * batchSize;
      const endIndex = startIndex + batchSize;
      
      console.log(`Processing batch ${batchNumber}: assets ${startIndex + 1} to ${Math.min(endIndex, assets.length)}`);

      // Process assets in the current batch
      let processedCount = 0;
      for (let i = startIndex; i < Math.min(endIndex, assets.length); i++) {
        const asset = assets[i];
        
        // Skip if already in contract and skipExisting is true
        if (options?.skipExisting !== false && 
            asset.address && 
            existingAssetAddresses.has(asset.address.toLowerCase())) {
          console.log(`Skipping already discovered asset: ${asset.name}`);
          continue;
        }
        
        if (asset.address && asset.name && asset.symbol) {
          const mappedAsset: DiscoveryParams = {
            assetAddress: asset.address,
            assetName: asset.name,
            assetSymbol: asset.symbol,
            assetType: asset.assetType || AssetType.TOKENIZED_TREASURY,
            rarity: asset.rarity || RarityTier.COMMON,
            risk: asset.risk || RiskTier.MEDIUM,
            rarityScore: asset.rarityScore || 50,
            predictionScore: asset.predictionScore || 60,
            currentValue: asset.currentValue || BigInt(1000000),
            yieldRate: asset.yieldRate || BigInt(50000),
            tokenURI: asset.tokenURI || `data:application/json;base64,${Buffer.from(JSON.stringify({
              name: `${asset.name} Discovery Card`,
              description: `Real World Asset Discovery Card for ${asset.name}`,
              image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzNCODJGNiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5SV0E8L3RleHQ+PC9zdmc+"
            })).toString('base64')}`
          };
          validAssets.push(mappedAsset);
          processedCount++;
        } else {
          console.warn('Skipping invalid asset - missing required fields:', asset);
        }
      }

      const discoveryResult = {
        total: assets.length,
        valid: validAssets.length,
        saved: 0,
        failed: 0,
        transactionHashes: [],
        assets: validAssets
      };

      setResults(discoveryResult);
      console.log(`Batch ${batchNumber}: Found ${validAssets.length} new valid assets (${processedCount} processed from this batch)`);
      
      return discoveryResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Auto-discovery failed:', errorMessage);
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  };

  // Batch save with progress updates
  const saveDiscoveredAssets = async (
    assets: DiscoveryParams[],
    options?: {
      delayBetweenTx?: number;
      onProgress?: (progress: { saved: number; failed: number; total: number }) => void;
    }
  ): Promise<DiscoveryResult> => {
    setIsDiscovering(true);
    
    let savedCount = 0;
    let errorCount = 0;
    const transactionHashes: string[] = [];

    try {
      console.log(`Saving ${assets.length} assets to contract...`);

      const delayBetweenTx = options?.delayBetweenTx || 3000; // 3 seconds default

      // Process assets sequentially
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        try {
          console.log(`Processing asset ${i + 1}/${assets.length}:`, {
            name: asset.assetName,
            address: asset.assetAddress,
            symbol: asset.assetSymbol
          });

          // Add delay between transactions (except first)
          if (i > 0) {
            console.log(`Waiting ${delayBetweenTx}ms before next transaction...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenTx));
          }

          const txHash = await discoverAsset(asset);
          transactionHashes.push(txHash);
          savedCount++;
          
          // Update results state
          setResults(prev => ({ 
            ...prev, 
            saved: savedCount,
            failed: errorCount,
            transactionHashes 
          }));
          
          // Call progress callback if provided
          if (options?.onProgress) {
            options.onProgress({
              saved: savedCount,
              failed: errorCount,
              total: assets.length
            });
          }
          
          console.log(` Transaction submitted for: ${asset.assetName} (${txHash})`);

          // Wait a bit for the transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(` Failed to save asset ${asset.assetName}:`, errorMessage);
          
          // Update results state
          setResults(prev => ({ ...prev, failed: errorCount }));
          
          // Call progress callback if provided
          if (options?.onProgress) {
            options.onProgress({
              saved: savedCount,
              failed: errorCount,
              total: assets.length
            });
          }
          
          // If it's a nonce or replacement error, we should stop
          if (errorMessage.includes('nonce') || 
              errorMessage.includes('replaced') || 
              errorMessage.includes('dropped')) {
            console.error(' Stopping batch due to transaction sequencing error');
            break;
          }
          
          // For other errors, continue with next asset
          console.log('Skipping to next asset...');
        }
      }

      const finalResults = {
        total: assets.length,
        valid: assets.length,
        saved: savedCount,
        failed: errorCount,
        transactionHashes,
        assets
      };

      setResults(finalResults);
      console.log(` Batch save completed: ${savedCount} saved, ${errorCount} failed`);
      
      return finalResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(' Batch save failed:', errorMessage);
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  };

  // Helper function to process all assets in sequential batches
  const discoverAllAssetsInBatches = async (
    batchSize: number = 5,
    delayBetweenBatches: number = 10000
  ): Promise<DiscoveryResult> => {
    try {
      console.log(`Starting to discover ALL assets in batches of ${batchSize}...`);
      
      // First, get all assets from sources
      const scanResponse = await fetch('/api/scan/discover-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!scanResponse.ok) {
        throw new Error('Failed to discover assets from sources');
      }
  
      const { assets } = await scanResponse.json();
      console.log(`Total assets available: ${assets.length}`);
      
      // Get existing assets from contract - USE DEBUG-CONTRACT
      let existingAssetsData: any[] = [];
      try {
        const existingAssetsResponse = await fetch('/api/contracts/debug-contract');
        if (existingAssetsResponse.ok) {
          const data = await existingAssetsResponse.json();
          // Handle both response formats
          existingAssetsData = data.discoveries || data.assets || [];
          console.log(`API response:`, {
            totalDiscoveries: data.totalDiscoveries,
            discoveriesCount: data.discoveries?.length,
            hasDiscoveries: !!data.discoveries
          });
        }
      } catch (error) {
        console.warn('Failed to fetch from debug-contract, trying fallback:', error);
        
        // Fallback: Try to fetch each token individually
        try {
          // First get total count
          const totalResponse = await fetch('/api/contracts/total-discoveries');
          if (totalResponse.ok) {
            const totalData = await totalResponse.json();
            const total = parseInt(totalData.totalDiscoveries) || 0;
            console.log(`Fallback: Found ${total} total discoveries`);
            
            // Fetch each token
            for (let i = 1; i <= total; i++) {
              try {
                const tokenResponse = await fetch(`/api/contracts/discovery-card/${i}`);
                if (tokenResponse.ok) {
                  const tokenData = await tokenResponse.json();
                  existingAssetsData.push(tokenData);
                }
              } catch (tokenError) {
                console.log(`Failed to fetch token ${i}`);
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      const existingAssetAddresses = new Set(
        existingAssetsData
          .filter((asset: any) => asset.assetAddress)
          .map((asset: any) => asset.assetAddress.toLowerCase())
      );
      
      console.log(`Found ${existingAssetAddresses.size} existing assets in contract`);
      console.log('Existing addresses:', Array.from(existingAssetAddresses));
      
      let totalSaved = 0;
      let totalFailed = 0;
      const allTransactionHashes: string[] = [];
      
      const newAssetsCount = assets.length - existingAssetAddresses.size;
      console.log(`New assets to discover: ${newAssetsCount}`);
      
      // Filter out assets already in contract
      const newAssets = assets.filter((asset: any) => 
        !existingAssetAddresses.has(asset.address?.toLowerCase())
      );
      
      console.log(`Filtered to ${newAssets.length} new assets (after removing duplicates)`);
      
      // Process in batches
      const totalBatches = Math.ceil(newAssets.length / batchSize);
      
      for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
        console.log(`\n=== Processing Batch ${batchNum}/${totalBatches} ===`);
        
        const startIndex = (batchNum - 1) * batchSize;
        const endIndex = Math.min(startIndex + batchSize, newAssets.length);
        
        // Map assets for this batch
        const batchAssets: DiscoveryParams[] = [];
        for (let i = startIndex; i < endIndex; i++) {
          const asset = newAssets[i];
          
          if (asset.address && asset.name && asset.symbol) {
            const mappedAsset: DiscoveryParams = {
              assetAddress: asset.address,
              assetName: asset.name,
              assetSymbol: asset.symbol,
              assetType: asset.assetType || AssetType.TOKENIZED_TREASURY,
              rarity: asset.rarity || RarityTier.COMMON,
              risk: asset.risk || RiskTier.MEDIUM,
              rarityScore: asset.rarityScore || 50,
              predictionScore: asset.predictionScore || 60,
              currentValue: asset.currentValue || BigInt(1000000),
              yieldRate: asset.yieldRate || BigInt(50000),
              tokenURI: asset.tokenURI || `data:application/json;base64,${Buffer.from(JSON.stringify({
                name: `${asset.name} Discovery Card`,
                description: `Real World Asset Discovery Card for ${asset.name}`,
                image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzNCODJGNiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5SV0E8L3RleHQ+PC9zdmc+"
              })).toString('base64')}`
            };
            batchAssets.push(mappedAsset);
          }
        }
        
        if (batchAssets.length === 0) {
          console.log(`No new assets to add in batch ${batchNum}`);
          continue;
        }
        
        console.log(`Batch ${batchNum}: Processing ${batchAssets.length} assets`);
        
        // Save this batch
        const batchResult = await saveDiscoveredAssets(batchAssets, {
          delayBetweenTx: 4000,
          onProgress: (progress) => {
            console.log(`Batch ${batchNum} progress: ${progress.saved}/${batchAssets.length}`);
          }
        });
        
        // Update totals
        totalSaved += batchResult.saved;
        totalFailed += batchResult.failed;
        allTransactionHashes.push(...batchResult.transactionHashes);
        
        // Wait between batches (except after last batch)
        if (batchNum < totalBatches) {
          console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }
      
      const finalResult: DiscoveryResult = {
        total: assets.length,
        valid: newAssets.length,
        saved: totalSaved,
        failed: totalFailed,
        transactionHashes: allTransactionHashes,
        assets: []
      };
      
      console.log(`\n ALL BATCHES COMPLETE!`);
      console.log(`Total scanned: ${assets.length}`);
      console.log(`New assets found: ${newAssets.length}`);
      console.log(`Successfully saved: ${totalSaved}`);
      console.log(`Failed: ${totalFailed}`);
      
      return finalResult;
      
    } catch (error) {
      console.error('Failed to process all assets in batches:', error);
      throw error;
    }
  };

  return {
    // Single asset operations
    discoverAsset,
    
    // Batch operations
    discoverFromSources,
    saveDiscoveredAssets,
    discoverAllAssetsInBatches, 
    
    // State
    isPending,
    isConfirming,
    isConfirmed,
    isDiscovering,
    results,
    error,
    hash
  };
};