import { useState, useCallback } from 'react';
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
  const [results, setResults] = useState<DiscoveryResult>({ 
    total: 0, 
    valid: 0, 
    saved: 0, 
    failed: 0, 
    transactionHashes: [], 
    assets: [] 
  });

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
  const discoverFromSources = async (): Promise<DiscoveryResult> => {
    setIsDiscovering(true);
    
    try {
      console.log('Starting auto-discovery from sources...');
      
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

      // Map backend fields to contract expected fields
      for (const asset of assets.slice(0, 5)) {
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
      console.log(`Found ${validAssets.length} valid assets out of ${assets.length} total`);
      
      return discoveryResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Auto-discovery failed:', errorMessage);
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  };

  // Batch save discovered assets to contract with better transaction sequencing
  const saveDiscoveredAssets = async (assets: DiscoveryParams[]): Promise<DiscoveryResult> => {
    setIsDiscovering(true);
    
    let savedCount = 0;
    let errorCount = 0;
    const transactionHashes: string[] = [];

    try {
      console.log(`Saving ${assets.length} assets to contract...`);

      // Process assets sequentially with proper delays
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        try {
          console.log(`Processing asset ${i + 1}/${assets.length}:`, {
            name: asset.assetName,
            address: asset.assetAddress,
            symbol: asset.assetSymbol
          });

          // Add increasing delay between transactions to avoid nonce conflicts
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000 + (i * 1000))); // 3s, 4s, 5s, etc.
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
          
          console.log(`Transaction submitted for: ${asset.assetName} (${txHash})`);

          // Wait a bit for the transaction to be processed
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Failed to save asset ${asset.assetName}:`, errorMessage);
          
          // Update results state
          setResults(prev => ({ ...prev, failed: errorCount }));
          
          // If it's a nonce or replacement error, we should stop
          if (errorMessage.includes('nonce') || errorMessage.includes('replaced') || errorMessage.includes('dropped')) {
            console.error('Stopping batch due to transaction sequencing error');
            break;
          }
          
          // For other errors, continue with next asset
          console.log('Skipping to next asset due to transaction failure');
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
      console.log(`Batch save completed: ${savedCount} saved, ${errorCount} failed`);
      
      return finalResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Batch save failed:', errorMessage);
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  };

  return {
    // Single asset operations
    discoverAsset,
    
    // Batch operations
    discoverFromSources,
    saveDiscoveredAssets,
    
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