import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Scanner } from '../components/ui/Scanner';
import { AssetCard } from '../components/assets/AssetCard';
import { Dialog } from '../components/ui/Dialog';
import { AssetDetails } from '../components/assets/AssetDetails';
import { DiscoveryForm } from '../components/assets/DiscoveryForm';
import { useScanner } from '../hooks/useScanner';
import { RWAAnalysis, RWA, AssetType } from '../../../shared/src/types/rwa';

interface HomeProps {
  onAssetSelect?: (asset: any) => void;
}

interface ScannedAsset {
  assetId: string;
  rarityScore: number;
  rarityTier: any;
  riskTier: any;
  marketPrediction: 'Bullish' | 'Neutral' | 'Bearish';
  predictionConfidence: number;
  healthScore: number;
  metrics: {
    liquidityDepth: number;
    holderDistribution: number;
    yield: number;
    volatility: number;
    age: number;
  };
  timestamp: string;
  
  tokenInfo?: {
    address: string;
    chainId: number;
    name: string;
  };
}

// Admin address from environment variable
const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || '';

export const Home: React.FC<HomeProps> = ({ onAssetSelect }) => {
  const [scannedAssets, setScannedAssets] = useState<ScannedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ScannedAsset | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { isScanning } = useScanner();
  const { address } = useAccount();

  const isAdmin = ADMIN_ADDRESS && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const handleScanComplete = async (scannedAssetsArray: ScannedAsset[]) => {
    console.log('Scan complete, received assets:', scannedAssetsArray);
    setScannedAssets(scannedAssetsArray);
  };

  const handleAssetClick = (asset: ScannedAsset) => {
    setSelectedAsset(asset);
    setShowDetails(true);
  };

  const handleMintSuccess = () => {
    setShowDetails(false);
    setSelectedAsset(null);
  };

  // Map scanned data to AssetCard props
  const mapToAssetCardProps = (scannedAsset: ScannedAsset) => {
    return {
      id: scannedAsset.assetId || scannedAsset.tokenInfo?.address || 'unknown',
      name: scannedAsset.tokenInfo?.name || 'Unknown Asset',
      symbol: (scannedAsset.tokenInfo?.name?.substring(0, 4) || 'UNKN').toUpperCase(),
      type: getAssetTypeLabel(scannedAsset.tokenInfo?.name || ''),
      rarity: scannedAsset.rarityTier || 0,
      riskTier: scannedAsset.riskTier || 1,
      movement: scannedAsset.marketPrediction || 'Neutral',
      confidence: scannedAsset.predictionConfidence || 50,
    };
  };

  // Helper to determine asset type label for display
  const getAssetTypeLabel = (name: string): string => {
    if (!name) return 'Tokenized Asset';
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('art') || lowerName.includes('nft')) return 'Digital Art';
    if (lowerName.includes('real') || lowerName.includes('estate')) return 'Real Estate';
    if (lowerName.includes('treasury') || lowerName.includes('bond')) return 'Tokenized Treasury';
    if (lowerName.includes('credit') || lowerName.includes('loan')) return 'Private Credit';
    if (lowerName.includes('luxury') || lowerName.includes('collectible')) return 'Luxury Goods';
    return 'Tokenized Asset';
  };

  // Helper to determine AssetType enum value
  const getAssetTypeEnum = (name: string): AssetType => {
    if (!name) return AssetType.TOKENIZED_TREASURY;
    
    const lowerName = name.toLowerCase();
    if (lowerName.includes('art') || lowerName.includes('nft')) return AssetType.ART;
    if (lowerName.includes('real') || lowerName.includes('estate')) return AssetType.REAL_ESTATE;
    if (lowerName.includes('treasury') || lowerName.includes('bond')) return AssetType.TOKENIZED_TREASURY;
    if (lowerName.includes('credit') || lowerName.includes('loan')) return AssetType.PRIVATE_CREDIT;
    if (lowerName.includes('luxury') || lowerName.includes('collectible')) return AssetType.LUXURY_GOODS;
    return AssetType.TOKENIZED_TREASURY;
  };

  // Create RWA asset for AssetDetails
  const createRwaAsset = (scannedAsset: ScannedAsset): RWA => {
    return {
      id: scannedAsset.assetId || scannedAsset.tokenInfo?.address || 'unknown',
      name: scannedAsset.tokenInfo?.name || 'Unknown Asset',
      symbol: (scannedAsset.tokenInfo?.name?.substring(0, 4) || 'UNKN').toUpperCase(),
      address: scannedAsset.tokenInfo?.address || '0x0',
      chainId: scannedAsset.tokenInfo?.chainId || 1,
      type: getAssetTypeEnum(scannedAsset.tokenInfo?.name || ''),
      totalSupply: '0',
      price: 0,
      marketCap: scannedAsset.metrics?.liquidityDepth || 0,
      liquidity: scannedAsset.metrics?.liquidityDepth || 0,
      holders: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  // Create analysis data for AssetDetails
  const createAnalysisData = (scannedAsset: ScannedAsset): RWAAnalysis => {
    return {
      assetId: scannedAsset.assetId,
      rarityScore: scannedAsset.rarityScore,
      rarityTier: scannedAsset.rarityTier,
      riskTier: scannedAsset.riskTier,
      marketPrediction: scannedAsset.marketPrediction,
      predictionConfidence: scannedAsset.predictionConfidence,
      healthScore: scannedAsset.healthScore,
      metrics: scannedAsset.metrics,
      timestamp: new Date(scannedAsset.timestamp),
    };
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-pokemon text-primary">
          ASSETDEXTER
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover, analyze, and collect tokenized real-world assets. 
          Gotta catch 'em all in the world of RWAs!
        </p>
      </motion.div>

      {/* Admin Discovery Section */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center mb-4">
            <div className="w-2 h-8 bg-purple-500 rounded-full mr-3"></div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel - Asset Discovery</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Add new RWA assets to the discovery contract. Only visible to contract deployer.
          </p>
          <DiscoveryForm />
        </motion.div>
      )}

      {/* Scanner Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Scanner
          onScanComplete={handleScanComplete}
          isScanning={isScanning}
          setIsScanning={() => {}}
        />
      </motion.div>

      {/* Scanned Assets Grid */}
      {scannedAssets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            Discovered Assets ({scannedAssets.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scannedAssets.map((scannedAsset, index) => (
              <motion.div
                key={scannedAsset.assetId || scannedAsset.tokenInfo?.address || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <AssetCard
                  asset={mapToAssetCardProps(scannedAsset)}
                  onClick={() => handleAssetClick(scannedAsset)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State - Show when no assets scanned yet */}
      {scannedAssets.length === 0 && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Assets Discovered Yet</h3>
            <p className="text-gray-600 mb-6">
              The discovery contract doesn't have any assets yet. Assets must be discovered first before scanning.
            </p>
            {!isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold">Note:</p>
                <p className="mt-1">Only the contract deployer can add new assets to the discovery contract.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Asset Details Dialog */}
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={selectedAsset ? `Asset Details - ${selectedAsset.tokenInfo?.name || 'Unknown'}` : 'Asset Details'}
      >
        {selectedAsset && (
          <AssetDetails
            asset={createRwaAsset(selectedAsset)}
            analysis={createAnalysisData(selectedAsset)}
            onMintSuccess={handleMintSuccess}
            onBack={() => setShowDetails(false)}
          />
        )}
      </Dialog>
    </div>
  );
};