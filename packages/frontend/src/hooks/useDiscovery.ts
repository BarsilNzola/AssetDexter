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

export const useDiscoverAsset = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash
  });

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
      symbol: params.assetSymbol,
      type: params.assetType,
      contract: CONTRACT_ADDRESSES.DISCOVERY_CARD
    });

    // Ensure currentValue and yieldRate are BigInt
    const processedParams = {
      ...params,
      currentValue: typeof params.currentValue === 'string' ? 
        BigInt(params.currentValue) : params.currentValue,
      yieldRate: typeof params.yieldRate === 'string' ? 
        BigInt(params.yieldRate) : params.yieldRate
    };

    return new Promise((resolve, reject) => {
      // Set up a one-time listener for the next hash
      let hashResolved = false;
      
      const checkHash = () => {
        if (hash && !hashResolved) {
          hashResolved = true;
          console.log('Transaction submitted:', hash);
          resolve(hash);
          return true;
        }
        return false;
      };

      // Check immediately in case hash is already set
      if (checkHash()) {
        return;
      }

      // Set up interval to check for hash
      const intervalId = setInterval(() => {
        if (checkHash()) {
          clearInterval(intervalId);
        }
      }, 100);

      // Timeout after 30 seconds
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (!hashResolved) {
          hashResolved = true;
          reject(new Error('Transaction submission timeout - no hash received'));
        }
      }, 30000);

      try {
        // Trigger the contract write
        writeContract({
          address: CONTRACT_ADDRESSES.DISCOVERY_CARD as `0x${string}`,
          abi: RWADiscoveryCardABI.abi,
          functionName: 'discoverAsset',
          args: [
            processedParams.assetAddress,
            processedParams.assetName,
            processedParams.assetSymbol,
            processedParams.assetType,
            processedParams.rarity,
            processedParams.risk,
            processedParams.rarityScore,
            processedParams.predictionScore,
            processedParams.currentValue,
            processedParams.yieldRate,
            processedParams.tokenURI
          ],
        });
      } catch (error) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        console.error('Transaction failed:', error);
        reject(error instanceof Error ? error : new Error('Unknown transaction error'));
      }
    });
  }, [address, writeContract, hash]);

  return {
    discoverAsset,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash
  };
};

export const useAutoDiscovery = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { discoverAsset } = useDiscoverAsset();

  const discoverFromSources = async () => {
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
      
      console.log(`Discovered ${assets.length} assets from sources, now saving to contract...`);
      
      let savedCount = 0;
      let errorCount = 0;
      const validAssets = [];
      const transactionHashes: string[] = [];

      // Map backend fields to contract expected fields
      for (const asset of assets.slice(0, 5)) { // TEST: Only process first 5 assets
        if (asset.address && asset.name && asset.symbol) {
          const mappedAsset = {
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

      console.log(`TEST: Processing first ${validAssets.length} valid assets out of ${assets.length} total`);

      // Save each valid asset to the contract
      for (const asset of validAssets) {
        try {
          console.log('Processing asset:', {
            name: asset.assetName,
            address: asset.assetAddress,
            symbol: asset.assetSymbol
          });

          const txHash = await discoverAsset(asset);
          transactionHashes.push(txHash);
          savedCount++;
          console.log(`Transaction submitted for: ${asset.assetName} (${txHash})`);

          // Wait longer between transactions to avoid nonce issues
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Failed to save asset ${asset.assetName}:`, errorMessage);
          
          // If we get a timeout, stop the process entirely
          if (errorMessage.includes('timeout')) {
            console.error('Stopping auto-discovery due to transaction timeout');
            break;
          }
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Auto-discovery completed: ${savedCount} saved, ${errorCount} failed`);
      console.log('Transaction hashes:', transactionHashes);
      
      return {
        total: assets.length,
        valid: validAssets.length,
        saved: savedCount,
        failed: errorCount,
        transactionHashes,
        assets: validAssets
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Auto-discovery failed:', errorMessage);
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  };

  return {
    discoverFromSources,
    isDiscovering
  };
};