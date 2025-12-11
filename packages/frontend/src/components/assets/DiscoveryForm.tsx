import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useDiscovery } from '../../hooks/useDiscovery';
import { AssetType, RarityTier, RiskTier } from '../../../../shared/src/types/rwa';
import { useContracts } from '../../hooks/useContracts';
import { useAccount, useSwitchChain, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../../lib/utils/constants';
import RWADiscoveryCardABI from '../../../../contracts/artifacts/contracts/RWADiscoveryCard.sol/RWADiscoveryCard.json';

export const DiscoveryForm: React.FC = () => {
  const [assetAddress, setAssetAddress] = useState('');
  const [batchNumber, setBatchNumber] = useState(1); // Track which batch we're on
  const [batchSize, setBatchSize] = useState(10); // Default batch size
  const [discoveryProgress, setDiscoveryProgress] = useState<{
    current: number; 
    total: number; 
    status: string;
    batch?: number;
    totalBatches?: number;
  } | null>(null);
  
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  // Contract ownership check
  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.DISCOVERY_CARD as `0x${string}`,
    abi: RWADiscoveryCardABI.abi,
    functionName: 'owner',
  });

  const { 
    discoverAsset, 
    discoverFromSources, 
    saveDiscoveredAssets,
    discoverAllAssetsInBatches, // New function!
    isPending, 
    isConfirming, 
    isConfirmed, 
    isDiscovering,
    results,
    error 
  } = useDiscovery();
  
  const { scanAsset } = useContracts();

  // Type-safe ownership check with proper casting
  const ownerAddress = contractOwner as string;
  const isOwner = address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();
  const isCorrectNetwork = chain?.id === 59141;

  const switchToLineaSepolia = async () => {
    try {
      await switchChain({ chainId: 59141 });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const generateImageDataURI = (symbol: string, assetType: AssetType): string => {
    const assetTypeColors: Record<AssetType, string> = {
      [AssetType.TOKENIZED_TREASURY]: '3B82F6',
      [AssetType.REAL_ESTATE]: '10B981', 
      [AssetType.ART]: '8B5CF6',
      [AssetType.LUXURY_GOODS]: 'F59E0B',
      [AssetType.PRIVATE_CREDIT]: 'EF4444'
    };
    
    const color = assetTypeColors[assetType] || '6B7280';
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#${color}"/>
      <text x="200" y="200" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${symbol}</text>
      <text x="200" y="230" font-family="Arial" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">RWA</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  };

  const generateTokenURI = (name: string, symbol: string, assetType: AssetType): string => {
    const metadata = {
      name: `${name} Discovery Card`,
      description: `Real World Asset Discovery Card for ${name} (${symbol})`,
      image: generateImageDataURI(symbol, assetType),
      attributes: [
        { trait_type: "Asset Type", value: AssetType[assetType] },
        { trait_type: "Symbol", value: symbol }
      ]
    };
    
    const jsonString = JSON.stringify(metadata);
    return `data:application/json;base64,${Buffer.from(jsonString).toString('base64')}`;
  };

  // Single asset discovery remains the same...
  const handleSingleDiscover = async () => {
    if (!isCorrectNetwork) {
      alert('Please switch to Linea Sepolia network first');
      await switchToLineaSepolia();
      return;
    }

    if (!isOwner) {
      alert('Only the contract owner can discover assets');
      return;
    }

    setDiscoveryProgress({ current: 0, total: 1, status: 'preparing' });

    try {
      const testAddress = assetAddress || '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92';
      
      const scanResult = await scanAsset(testAddress, 1);
      
      if (!scanResult.tokenInfo) {
        await discoverAsset({
          assetAddress: testAddress,
          assetName: 'Test RWA Asset',
          assetSymbol: 'TEST',
          assetType: AssetType.TOKENIZED_TREASURY,
          rarity: RarityTier.COMMON,
          risk: RiskTier.LOW,
          rarityScore: 50,
          predictionScore: 60,
          currentValue: BigInt(1000000),
          yieldRate: BigInt(50000),
          tokenURI: generateTokenURI('Test RWA Asset', 'TEST', AssetType.TOKENIZED_TREASURY)
        });
      } else {
        await discoverAsset({
          assetAddress: testAddress,
          assetName: scanResult.tokenInfo.name || 'Test Asset',
          assetSymbol: scanResult.tokenInfo.symbol || 'TEST',
          assetType: AssetType.TOKENIZED_TREASURY,
          rarity: RarityTier.COMMON,
          risk: RiskTier.MEDIUM,
          rarityScore: scanResult.rarityScore || 50,
          predictionScore: scanResult.predictionConfidence || 60,
          currentValue: BigInt(1000000),
          yieldRate: BigInt(50000),
          tokenURI: generateTokenURI(
            scanResult.tokenInfo.name || 'Test Asset', 
            scanResult.tokenInfo.symbol || 'TEST', 
            AssetType.TOKENIZED_TREASURY
          )
        });
      }

      setDiscoveryProgress(null);
      
    } catch (err) {
      console.error('Single discovery failed:', err);
      alert('Discovery failed. Check console for details.');
      setDiscoveryProgress(null);
    }
  };

  // NEW: Handle batch discovery with duplicate checking
  const handleBatchDiscover = async () => {
    if (!isCorrectNetwork) {
      alert('Please switch to Linea Sepolia network first');
      await switchToLineaSepolia();
      return;
    }

    if (!isOwner) {
      alert('Only the contract owner can discover assets');
      return;
    }

    setDiscoveryProgress({ 
      current: 0, 
      total: 0, 
      status: 'discovering',
      batch: batchNumber
    });
    
    try {
      // Use the new discoverFromSources with batch parameters and duplicate checking
      const result = await discoverFromSources({
        batchSize,
        batchNumber,
        skipExisting: true  // This skips already added assets!
      });
      
      console.log(`Found ${result.valid} new assets in batch ${batchNumber}`);
      
      if (result.valid === 0) {
        alert('No new assets found to discover. All assets in this batch may already be in the contract.');
        setDiscoveryProgress(null);
        setBatchNumber(batchNumber + 1); // Move to next batch
        return;
      }

      // Process the assets we found
      const assetsToProcess = result.assets;
      
      setDiscoveryProgress({
        current: assetsToProcess.length,
        total: assetsToProcess.length,
        status: 'prepared',
        batch: batchNumber
      });

      const shouldProceed = window.confirm(
        `Ready to discover ${assetsToProcess.length} new assets (Batch ${batchNumber})?\n\n` +
        `This will create ${assetsToProcess.length} transactions.\n` +
        `Assets already in contract will be skipped.\n\nConfirm to proceed.`
      );

      if (!shouldProceed) {
        setDiscoveryProgress(null);
        return;
      }

      setDiscoveryProgress({
        current: 0,
        total: assetsToProcess.length,
        status: 'processing',
        batch: batchNumber
      });

      // Save with progress updates
      const saveResult = await saveDiscoveredAssets(assetsToProcess, {
        delayBetweenTx: 3000,
        onProgress: (progress) => {
          setDiscoveryProgress(prev => prev ? {
            ...prev,
            current: progress.saved
          } : null);
        }
      });

      setDiscoveryProgress(null);
      
      // Update batch number for next time
      setBatchNumber(batchNumber + 1);
      
      if (saveResult.saved > 0) {
        alert(`✅ Successfully discovered ${saveResult.saved} new assets in Batch ${batchNumber}!`);
      } else {
        alert('❌ No assets were successfully discovered. Check console for errors.');
      }
      
    } catch (err) {
      console.error('Batch discovery failed:', err);
      alert('Discovery failed. Check console for details.');
      setDiscoveryProgress(null);
    }
  };

  // NEW: Handle discovering ALL remaining assets
  const handleDiscoverAllRemaining = async () => {
    if (!isCorrectNetwork) {
      alert('Please switch to Linea Sepolia network first');
      await switchToLineaSepolia();
      return;
    }

    if (!isOwner) {
      alert('Only the contract owner can discover assets');
      return;
    }

    const confirm = window.confirm(
      'This will discover ALL remaining assets not yet in the contract.\n\n' +
      'This may take a while and require many transactions.\n\n' +
      'Are you sure you want to proceed?'
    );

    if (!confirm) return;

    try {
      // Show initial progress
      setDiscoveryProgress({
        current: 0,
        total: 100,
        status: 'processing-all',
        batch: 1,
        totalBatches: 0
      });

      // Call the new function to process all in batches
      const result = await discoverAllAssetsInBatches(5, 10000);
      
      setDiscoveryProgress(null);
      
      alert(`🎉 Discovery complete!\n\n` +
            `Total saved: ${result.saved}\n` +
            `Total failed: ${result.failed}\n` +
            `Total available: ${result.total}\n` +
            `Already in contract: ${result.total - result.valid}`);
      
    } catch (err) {
      console.error('Failed to discover all assets:', err);
      alert('Failed to discover all assets. Check console for details.');
      setDiscoveryProgress(null);
    }
  };

  const getStatusMessage = () => {
    if (!discoveryProgress) return null;
    
    const statusMessages = {
      discovering: 'Discovering assets from data sources...',
      preparing: 'Preparing transaction...',
      prepared: `Found ${discoveryProgress.current} new assets. Ready to process.`,
      processing: `Processing Batch ${discoveryProgress.batch}... (${discoveryProgress.current}/${discoveryProgress.total})`,
      'processing-all': 'Processing all remaining assets in batches...'
    };

    return statusMessages[discoveryProgress.status as keyof typeof statusMessages] || 'Processing...';
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      {!isCorrectNetwork && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-yellow-800 font-medium">Wrong Network</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Please switch to Linea Sepolia to discover assets.
              </p>
            </div>
            <Button
              onClick={switchToLineaSepolia}
              size="sm"
            >
              Switch to Linea Sepolia
            </Button>
          </div>
        </div>
      )}

      {/* Ownership Warning */}
      {isCorrectNetwork && !isOwner && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div>
            <h3 className="text-red-800 font-medium">Not Contract Owner</h3>
            <p className="text-red-700 text-sm mt-1">
              Only the contract owner can discover assets.
            </p>
            <p className="text-red-600 text-xs mt-1">
              Connected: {address}<br />
              Contract Owner: {ownerAddress}
            </p>
          </div>
        </div>
      )}

      {/* Ready Status */}
      {isCorrectNetwork && isOwner && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <h3 className="text-green-800 font-medium">
              Contract Owner - Ready to Discover
            </h3>
            <p className="text-green-700 text-sm mt-1">
              Current batch: {batchNumber} | Batch size: {batchSize}
            </p>
          </div>
        </div>
      )}

      {/* Batch Controls */}
      {isCorrectNetwork && isOwner && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Batch Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Number
              </label>
              <input
                type="number"
                min="1"
                value={batchNumber}
                onChange={(e) => setBatchNumber(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Start from 1. Increase after each batch.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of assets per batch (1-20 recommended)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Single Asset Discovery (unchanged) */}
      {isCorrectNetwork && isOwner && (
        <div className="card">
          <h3 className="text-lg font-bold mb-3">Single Asset Discovery</h3>
          <p className="text-gray-600 mb-4">
            Discover a single RWA asset by contract address.
          </p>
          
          {discoveryProgress && discoveryProgress.status !== 'processing-all' && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>{getStatusMessage()}</span>
                {(discoveryProgress.status === 'processing' || discoveryProgress.status === 'processing-all') && (
                  <span>{discoveryProgress.current} / {discoveryProgress.total}</span>
                )}
              </div>
              {(discoveryProgress.status === 'processing' || discoveryProgress.status === 'processing-all') && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(discoveryProgress.current / discoveryProgress.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Contract Address
              </label>
              <input
                type="text"
                value={assetAddress}
                onChange={(e) => setAssetAddress(e.target.value)}
                placeholder="0x1b19c19393e2d034d8ff31ff34c81252fcbbee92"
                className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleSingleDiscover}
              loading={isPending || isConfirming}
              disabled={!!discoveryProgress}
              className="w-full"
            >
              {isConfirmed ? 'Asset Discovered' : 'Discover Single Asset'}
            </Button>
          </div>
        </div>
      )}

      {/* Batch Discovery - UPDATED */}
      {isCorrectNetwork && isOwner && (
        <div className="card">
          <h3 className="text-lg font-bold mb-3">Batch Discovery</h3>
          <p className="text-gray-600 mb-4">
            Discover new RWA assets in batches. Will skip assets already in contract.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={handleBatchDiscover}
              loading={isDiscovering}
              disabled={!!discoveryProgress}
              className="w-full"
              variant="primary"
            >
              Discover Next Batch ({batchSize} assets)
            </Button>

            <div className="text-center text-sm text-gray-500">
              or
            </div>

            <Button
              onClick={handleDiscoverAllRemaining}
              loading={isDiscovering}
              disabled={!!discoveryProgress}
              className="w-full"
              variant="secondary"
            >
              Discover All Remaining Assets
            </Button>
          </div>

          {/* Show results summary */}
          {results.total > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Discovery Results:</h4>
              <div className="text-sm space-y-1">
                <div>Total scanned: {results.total}</div>
                <div>New assets found: {results.valid}</div>
                <div className="text-green-600">Successfully saved: {results.saved}</div>
                <div className="text-red-600">Failed: {results.failed}</div>
                <div className="text-blue-600">Current batch: {batchNumber}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm">
          {error.message}
        </div>
      )}

      {isConfirmed && (
        <div className="text-green-600 text-sm">
          Asset successfully discovered and minted!
        </div>
      )}
    </div>
  );
};