import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useDiscoverAsset, useAutoDiscovery } from '../../hooks/useDiscovery';
import { AssetType, RarityTier, RiskTier } from '../../../../shared/src/types/rwa';
import { useContracts } from '../../hooks/useContracts';

export const DiscoveryForm: React.FC = () => {
  const [assetAddress, setAssetAddress] = useState('');
  const [discoveryProgress, setDiscoveryProgress] = useState<{current: number; total: number; saved: number; failed: number} | null>(null);
  
  const { discoverAsset, isPending, isConfirming, isConfirmed, error } = useDiscoverAsset();
  const { discoverFromSources, isDiscovering } = useAutoDiscovery();
  const { scanAsset } = useContracts();

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

  const handleAutoDiscover = async () => {
    setDiscoveryProgress({ current: 0, total: 0, saved: 0, failed: 0 });
    
    try {
      const result = await discoverFromSources();
      
      setDiscoveryProgress({
        current: result.total,
        total: result.total,
        saved: result.saved,
        failed: result.failed
      });

      if (result.saved === 0) {
        alert('No assets were saved to the contract. Check console for errors.');
      } else {
        alert(`Successfully saved ${result.saved} assets to the contract! ${result.failed > 0 ? `${result.failed} failed.` : ''}`);
      }
    } catch (err) {
      console.error('Auto-discovery failed:', err);
      alert('Auto-discovery failed. Check console for details.');
    } finally {
      // Clear progress after a delay
      setTimeout(() => setDiscoveryProgress(null), 5000);
    }
  };

  const handleManualDiscover = async () => {
    if (!assetAddress) {
      alert('Please enter a contract address');
      return;
    }

    try {
      const scanResult = await scanAsset(assetAddress, 1);
      
      if (!scanResult.tokenInfo) {
        throw new Error('Could not fetch token data');
      }

      await discoverAsset({
        assetAddress,
        assetName: scanResult.tokenInfo.name,
        assetSymbol: scanResult.tokenInfo.symbol,
        assetType: AssetType.TOKENIZED_TREASURY,
        rarity: RarityTier.COMMON,
        risk: RiskTier.MEDIUM,
        rarityScore: scanResult.rarityScore || 50,
        predictionScore: scanResult.predictionConfidence || 60,
        currentValue: BigInt(1000000),
        yieldRate: BigInt(50000),
        tokenURI: generateTokenURI(scanResult.tokenInfo.name, scanResult.tokenInfo.symbol, AssetType.TOKENIZED_TREASURY)
      });
    } catch (err) {
      console.error('Manual discovery failed:', err);
      alert('Manual discovery failed. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-bold mb-3">Auto-Discovery</h3>
        <p className="text-gray-600 mb-4">
          Automatically discover RWA assets from DeFi Llama, CreatorBid, and known tokenized assets.
        </p>
        
        {discoveryProgress && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress: {discoveryProgress.saved + discoveryProgress.failed} / {discoveryProgress.total}</span>
              <span>{discoveryProgress.saved} saved, {discoveryProgress.failed} failed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((discoveryProgress.saved + discoveryProgress.failed) / discoveryProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleAutoDiscover}
          loading={isDiscovering}
          className="w-full"
        >
          {isDiscovering ? 'Discovering & Saving Assets...' : 'Discover Assets Automatically'}
        </Button>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-3">Manual Discovery</h3>
        <p className="text-gray-600 mb-4">
          Manually add a specific RWA token by contract address.
        </p>
        
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
            onClick={handleManualDiscover}
            loading={isPending || isConfirming}
            disabled={!assetAddress}
            className="w-full"
          >
            {isConfirmed ? 'Asset Discovered' : 'Discover This Asset'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          Discovery failed: {error.message}
        </div>
      )}

      {isConfirmed && (
        <div className="text-green-600 text-sm">
          Asset successfully discovered
        </div>
      )}
    </div>
  );
};