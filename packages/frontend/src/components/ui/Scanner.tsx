import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Zap } from 'lucide-react';
import { Button } from './Button';
import { API_ENDPOINTS } from '../../lib/utils/constants';

interface ScannerProps {
  onScanComplete: (asset: any) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
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
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch(API_ENDPOINTS.SCAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const scanResult = await response.json();
      
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        onScanComplete(scanResult);
        setIsScanning(false);
        setProgress(0);
      }, 500);
    } catch (error) {
      console.error('Scan failed:', error);
      clearInterval(interval);
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