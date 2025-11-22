import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Zap } from 'lucide-react';
import { Button } from './Button';
import { API_ENDPOINTS, getDiscoveredAssets } from '../../lib/utils/constants';

interface ScannerProps {
  onScanComplete: (assets: any[]) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
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

export const Scanner: React.FC<ScannerProps> = ({
  onScanComplete,
  isScanning,
  setIsScanning,
}) => {
  const [progress, setProgress] = useState(0);

  const handleScan = async () => {
    setIsScanning(true);
    setProgress(0);
    
    try {
      // Get discovered assets (will be empty if none discovered)
      const discoveredAssets = await getDiscoveredAssets();
      console.log('Discovered assets to scan:', discoveredAssets);
      
      if (discoveredAssets.length === 0) {
        // Show error message - no assets to scan
        setTimeout(() => {
          onScanComplete([]);
          setIsScanning(false);
          setProgress(0);
          
          // You can show a toast or message here
          alert('No assets discovered yet! Use the discovery feature to add assets to the contract first.');
        }, 500);
        return;
      }
      
      const allAssets: ScannedAsset[] = [];
      
      // Scan discovered addresses
      for (let i = 0; i < discoveredAssets.length; i++) {
        const token = discoveredAssets[i];
        setProgress(Math.round((i / discoveredAssets.length) * 100));
        
        try {
          const scanParams = {
            contractAddress: token.address,
            chainId: token.chainId
          };
  
          console.log(`Scanning ${token.name} at ${token.address} on chain ${token.chainId}`);
  
          const response = await fetch(API_ENDPOINTS.SCAN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scanParams),
          });
          
          if (response.ok) {
            const scanResult = await response.json();
            allAssets.push({
              ...scanResult,
              tokenInfo: token
            });
            console.log(`Successfully scanned ${token.name}:`, scanResult);
          } else {
            console.warn(`Scan failed for ${token.name}:`, response.status);
          }
        } catch (error) {
          console.error(`Failed to scan ${token.name}:`, error);
        }
      }
      
      setProgress(100);
      
      setTimeout(() => {
        onScanComplete(allAssets);
        setIsScanning(false);
        setProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative">
      <div className="relative bg-gradient-to-br from-secondary to-primary rounded-2xl p-8 text-center scanner-glow">
        <motion.div
          className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center border-4 border-primary"
          animate={{ scale: isScanning ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 2, repeat: isScanning ? Infinity : 0 }}
        >
          <Scan size={48} className="text-primary" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-4 font-pokemon">
          ASSET SCANNER
        </h2>
        
        <p className="text-white/90 mb-6">
          Discover tokenized real-world assets and add them to your collection
        </p>

        <Button
          onClick={handleScan}
          disabled={isScanning}
          size="lg"
          icon={Zap}
          className="mx-auto"
        >
          {isScanning ? 'SCANNING...' : 'SCAN FOR ASSETS'}
        </Button>

        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                <motion.div
                  className="bg-accent h-full rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-white text-sm mt-2">
                Analyzing blockchain data... {progress}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scanning animation lines */}
      <AnimatePresence>
        {isScanning && (
          <>
            <motion.div
              className="absolute inset-0 border-2 border-secondary rounded-2xl scan-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-secondary rounded-2xl scan-animation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ animationDelay: '1s' }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};