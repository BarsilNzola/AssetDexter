import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Scanner } from '../components/ui/Scanner';
import { AssetCard } from '../components/assets/AssetCard';
import { Dialog } from '../components/ui/Dialog';
import { AssetDetails } from '../components/assets/AssetDetails';
import { DiscoveryForm } from '../components/assets/DiscoveryForm';
import { useScanner } from '../hooks/useScanner';
import { useMint } from '../hooks/useMint';
import { LighthouseStorageService } from '../services/lighthouse-storage';
import { getConfig } from '../lib/utils/constants';
import { RWAAnalysis, RWA, AssetType, RarityTier, RiskTier } from '../../../shared/src/types/rwa';
import { Plus, Radar, Crown, Check } from 'lucide-react';

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
  scannedAt?: string;
  
  tokenInfo?: {
    address: string;
    chainId: number;
    name: string;
  };
}

const ADMIN_ADDRESS = getConfig('VITE_ADMIN_ADDRESS');

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

export const Home: React.FC = () => {
  const [scannedAssets, setScannedAssets] = useState<ScannedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ScannedAsset | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState({
    isActive: false,
    foundCount: 0,
    totalToScan: 0,
    percentage: 0
  });

  const [storageService] = useState(() => new LighthouseStorageService());

  const [alreadyCollectedAssets, setAlreadyCollectedAssets] = useState<Set<string>>(new Set());
  
  const { isScanning } = useScanner();
  const { address } = useAccount();
  const { addToCollection } = useMint();
  const isAdmin = ADMIN_ADDRESS && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    if (address) {
      // Use LighthouseStorageService instead of localStorage
      const loadCollectedAssets = async () => {
        try {
          const collection = await storageService.getUserCollection(address);
          
          // Create a Set of asset identifiers already in collection
          const collectedSet = new Set<string>();
          
          collection.forEach((asset: any) => {
            // Extract asset identifier
            const assetKey = asset.assetData?.tokenInfo?.address || 
                            asset.assetData?.assetId || 
                            asset.id;
            if (assetKey) {
              collectedSet.add(assetKey);
            }
          });
          
          setAlreadyCollectedAssets(collectedSet);
        } catch (error) {
          console.error('Failed to load collection from Lighthouse:', error);
          
          // Fallback to localStorage
          const savedCollected = localStorage.getItem(`collected_assets_${address}`);
          if (savedCollected) {
            try {
              const collected = JSON.parse(savedCollected);
              setAlreadyCollectedAssets(new Set(collected));
            } catch (error) {
              console.error('Failed to load collected assets from localStorage:', error);
            }
          }
        }
      };
      
      loadCollectedAssets();
    }
  }, [address, storageService]);

  const getGridColumns = () => {
    const count = scannedAssets.length;
    if (count >= 100) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
    if (count >= 50) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    if (count >= 20) return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  };

  // Handle scan start
  const handleScanStart = (totalAssets: number) => {
    console.log('Scan started, total to scan:', totalAssets);
    setScanProgress({
      isActive: true,
      foundCount: 0,
      totalToScan: totalAssets,
      percentage: 0
    });
    setScannedAssets([]); // Clear previous results
  };

  // Handle individual asset found in real-time
  const handleAssetFound = (asset: ScannedAsset) => {
    console.log('REAL-TIME: Asset found:', asset.tokenInfo?.name);
    
    setScannedAssets(prev => {
      // Check if asset already exists
      const exists = prev.some(a => 
        a.assetId === asset.assetId || 
        a.tokenInfo?.address === asset.tokenInfo?.address
      );
      if (!exists) {
        console.log(`Adding asset ${prev.length + 1} to display:`, asset.tokenInfo?.name);
        return [...prev, asset];
      }
      return prev;
    });
    
    // Update progress counter
    setScanProgress(prev => ({
      ...prev,
      foundCount: prev.foundCount + 1,
      percentage: Math.round(((prev.foundCount + 1) / prev.totalToScan) * 100)
    }));
  };

  // Handle scan completion
  const handleScanComplete = (assets: ScannedAsset[]) => {
    console.log('Scan complete, total assets:', assets.length);
    
    // Final update if any assets weren't already displayed
    setScannedAssets(prev => {
      const existingIds = new Set(prev.map(a => a.assetId || a.tokenInfo?.address));
      const newAssets = assets.filter(a => 
        !existingIds.has(a.assetId || a.tokenInfo?.address)
      );
      return [...prev, ...newAssets];
    });
    
    setScanProgress({
      isActive: false,
      foundCount: assets.length,
      totalToScan: assets.length,
      percentage: 100
    });
  };

  const handleAssetClick = (asset: ScannedAsset) => {
    setSelectedAsset(asset);
    setShowDetails(true);
  };

  const handleAddToCollection = async (scannedAsset: ScannedAsset) => {
    if (!address) return;
    
    const assetKey = scannedAsset.assetId || scannedAsset.tokenInfo?.address;
    if (!assetKey) {
      console.error('Cannot add asset without identifier');
      return;
    }
    
    // Check if already collected
    if (alreadyCollectedAssets.has(assetKey)) {
      console.log('Asset already in collection');
      return;
    }
    
    setAddingToCollection(assetKey);
    try {
      // Use useMint hook's addToCollection instead
      const success = await addToCollection(scannedAsset);
      
      if (success) {
        console.log('Successfully added to collection');
        
        // Update already collected assets locally
        const updatedCollected = new Set(alreadyCollectedAssets);
        updatedCollected.add(assetKey);
        setAlreadyCollectedAssets(updatedCollected);
        
        // Also store a quick reference in localStorage for fast lookup
        localStorage.setItem(
          `collected_assets_${address}`, 
          JSON.stringify([...updatedCollected])
        );
        
        // Remove from scanned assets
        setScannedAssets(prev => prev.filter(asset => 
          (asset.assetId || asset.tokenInfo?.address) !== assetKey
        ));
      } else {
        console.error('Failed to add to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
    } finally {
      setAddingToCollection(null);
    }
  };

  // Check if an asset is already collected
  const isAssetAlreadyCollected = (scannedAsset: ScannedAsset): boolean => {
    const assetKey = scannedAsset.assetId || scannedAsset.tokenInfo?.address;
    if (!assetKey) return false;
    
    // Check both local state and localStorage for quick lookup
    return alreadyCollectedAssets.has(assetKey);
  };

  const handleMintSuccess = () => {
    setShowDetails(false);
    setSelectedAsset(null);
  };

  const mapToAssetCardProps = (scannedAsset: ScannedAsset, compact = false) => {
    return {
      id: scannedAsset.assetId || scannedAsset.tokenInfo?.address || 'unknown',
      name: scannedAsset.tokenInfo?.name || 'Unknown Asset',
      symbol: (scannedAsset.tokenInfo?.name?.substring(0, 4) || 'UNKN').toUpperCase(),
      type: getAssetTypeLabel(scannedAsset.tokenInfo?.name || ''),
      rarity: scannedAsset.rarityTier || RarityTier.UNCOMMON,
      riskTier: scannedAsset.riskTier || RiskTier.MEDIUM,
      movement: scannedAsset.marketPrediction || 'Neutral',
      confidence: scannedAsset.predictionConfidence || 50,
      compact
    };
  };

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
          className="bg-gradient-to-br from-purple-50 to-white border-4 border-purple-300 p-6 rounded-2xl shadow-lg"
        >
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mr-3 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel - Asset Discovery</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Add new RWA assets to the discovery contract. Only visible to contract deployer.
          </p>
          <DiscoveryForm />
        </motion.div>
      )}

      {/* Scanner Section - UPDATED with new callbacks */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Scanner
          onScanStart={handleScanStart}
          onAssetFound={handleAssetFound}
          onScanComplete={handleScanComplete}
          isScanning={isScanning}
          setIsScanning={() => {}}
        />
      </motion.div>

      {/* Scanning Progress Indicator */}
      {scanProgress.isActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-white border-4 border-blue-300 p-4 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center animate-pulse">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Scanning Assets...</h3>
                <p className="text-sm text-gray-600">
                  Found {scanProgress.foundCount} of {scanProgress.totalToScan} assets
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{scanProgress.foundCount}</div>
              <div className="text-sm text-gray-600">Found</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Scanning from DeFi Llama and AI agents...
          </div>
        </motion.div>
      )}

      {/* Scanned Assets Grid */}
      {scannedAssets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Scanned Assets <span className="text-blue-500">({scannedAssets.length})</span>
              </h2>
              <p className="text-gray-600">
                {scanProgress.isActive ? 'Assets appearing in real-time...' : 'Add assets to your collection'}
              </p>
            </div>
            {scanProgress.isActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-700">Live Scanning...</span>
              </div>
            )}
          </div>
          
          {/* Dynamic Grid */}
          <div className={`grid gap-4 ${getGridColumns()}`}>
            {scannedAssets.map((scannedAsset, index) => {
              const isCompact = scannedAssets.length >= 50;
              const isNew = scannedAsset.scannedAt && 
                Date.now() - new Date(scannedAsset.scannedAt).getTime() < 10000; // Last 10 seconds
              const isAlreadyCollected = isAssetAlreadyCollected(scannedAsset);
              
              return (
                <motion.div
                  key={scannedAsset.assetId || scannedAsset.tokenInfo?.address || index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className="relative group"
                >
                  <div className={`
                    ${isCompact ? 'p-3' : 'p-5'}
                    bg-white rounded-xl border-3 border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative
                    ${isAlreadyCollected ? 'opacity-70' : ''}
                  `}>
                    <AssetCard
                      asset={mapToAssetCardProps(scannedAsset, isCompact)}
                      onClick={() => handleAssetClick(scannedAsset)}
                    />
                    
                    {/* Add to Collection Button or Already Collected Badge */}
                    {isAlreadyCollected ? (
                      <div className="absolute top-2 right-2 p-2 bg-green-500 text-white rounded-full shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCollection(scannedAsset);
                        }}
                        disabled={addingToCollection === (scannedAsset.assetId || scannedAsset.tokenInfo?.address)}
                        className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                          addingToCollection === (scannedAsset.assetId || scannedAsset.tokenInfo?.address)
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {addingToCollection === (scannedAsset.assetId || scannedAsset.tokenInfo?.address) ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    
                    {/* Scanned Badge */}
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                      SCANNED
                    </div>
                    
                    {/* Already Collected Badge */}
                    {isAlreadyCollected && (
                      <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        IN COLLECTION
                      </div>
                    )}
                    
                    {/* New Badge for recently found */}
                    {isNew && !isAlreadyCollected && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2"
                      >
                        <div className="bg-gradient-to-r from-red-500 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                          NEW
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Already Collected Counter */}
          {alreadyCollectedAssets.size > 0 && (
            <div className="text-center mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {alreadyCollectedAssets.size} assets already in your collection
                </span>
              </div>
            </div>
          )}
          
          {/* Load More Button */}
          {scannedAssets.length >= 50 && !scanProgress.isActive && (
            <div className="text-center mt-6">
              <button 
                onClick={() => {/* Implement pagination */}}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
              >
                Load More Assets ({scannedAssets.length} shown)
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {scannedAssets.length === 0 && !scanProgress.isActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-12"
        >
          <div className="max-w-md mx-auto">
            <motion.div 
              className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-8 border-gray-300 flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Radar className="w-16 h-16 text-gray-400" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Scan!</h3>
            <p className="text-gray-600 mb-6">
              Click the scanner above to discover RWA assets from DeFi Llama and AI agents.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-white border-4 border-blue-200 rounded-xl p-4 text-left">
              <p className="font-bold text-gray-800 mb-2">How it works:</p>
              <ol className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</div>
                  <span>Scan for assets using the scanner</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">2</div>
                  <span>Watch assets appear in real-time</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">3</div>
                  <span>Add to collection and mint as NFTs</span>
                </li>
              </ol>
            </div>
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
            onAddToCollection={() => handleAddToCollection(selectedAsset)}
            isAddingToCollection={addingToCollection === selectedAsset.assetId}
            isAlreadyCollected={isAssetAlreadyCollected(selectedAsset)}
          />
        )}
      </Dialog>
    </div>
  );
};