import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scanner } from '../components/ui/Scanner';
import { AssetCard } from '../components/assets/AssetCard';
import { Dialog } from '../components/ui/Dialog';
import { AssetDetails } from '../components/assets/AssetDetails';
import { useScanner } from '../hooks/useScanner';
import { RWAAnalysis, RWA } from '../../../shared/src/types/rwa';

interface HomeProps {
  onAssetSelect: (asset: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onAssetSelect }) => {
  const [scannedAsset, setScannedAsset] = useState<{ analysis: RWAAnalysis; asset: RWA } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { scanAsset, isScanning, data: scanResult } = useScanner();

  const handleScanComplete = async (scanData: any) => {
    // For demo purposes, we'll create a mock asset from scan data
    // In real implementation, this would come from your backend
    const mockAsset: RWA = {
      id: scanData.assetId || 'demo-asset',
      name: 'Tokenized Treasury Bond',
      symbol: 'OUSG',
      address: '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92',
      chainId: 1,
      type: 'TOKENIZED_TREASURY' as any,
      totalSupply: '1000000',
      price: 102.5,
      marketCap: 102500000,
      liquidity: 5000000,
      holders: 1500,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const assetWithAnalysis = {
      analysis: scanData,
      asset: mockAsset,
    };

    setScannedAsset(assetWithAnalysis);
    setShowDetails(true);
  };

  const handleMintSuccess = () => {
    setShowDetails(false);
    setScannedAsset(null);
    // You could show a success message or redirect to Dex
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

      {/* Scanner Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Scanner
          onScanComplete={handleScanComplete}
          isScanning={isScanning}
          setIsScanning={() => {}} // Managed by hook
        />
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary">150+</div>
          <div className="text-gray-600">Assets Discovered</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-secondary">45</div>
          <div className="text-gray-600">Active Collectors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-accent">12</div>
          <div className="text-gray-600">Rare Finds</div>
        </div>
      </motion.div>

      {/* Asset Details Dialog */}
      <Dialog
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Asset Discovered!"
      >
        {scannedAsset && (
          <AssetDetails
            asset={scannedAsset.asset}
            analysis={scannedAsset.analysis}
            onMintSuccess={handleMintSuccess}
            onBack={() => setShowDetails(false)}
          />
        )}
      </Dialog>
    </div>
  );
};