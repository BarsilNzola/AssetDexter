import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useUserCards, useUserStats, useDiscoveryCard } from '../hooks/useContracts';
import { useMint } from '../hooks/useMint';
import { useQuery } from '@tanstack/react-query';
import { AssetCard } from '../components/assets/AssetCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trophy, Users, Star, Zap, Coins, Package, Crown, X } from 'lucide-react';
import { RarityTier, RiskTier } from '../../../shared/src/types/rwa';

interface DexProps {
  onAssetSelect: (asset: any) => void;
}

export const Dex: React.FC<DexProps> = ({ onAssetSelect }) => {
  const { address, isConnected } = useAccount();
  const { data: userCards = [], isLoading: cardsLoading } = useUserCards();
  const { data: userStats, isLoading: statsLoading } = useUserStats();
  const { 
    mintDiscoveryCard, 
    removeFromCollection, 
    isMinting,
    loadCollection 
  } = useMint();

  const { data: collection = [], isLoading: collectionLoading } = useQuery({
    queryKey: ['user-collection'],
    queryFn: loadCollection,
    enabled: !!address && !!loadCollection
  });

  const [activeTab, setActiveTab] = useState<'minted' | 'unminted' | 'collection'>('minted');

  useEffect(() => {
    if (address) {
      loadCollection();
    }
  }, [address, loadCollection]);

  const isLoading = cardsLoading || statsLoading || collectionLoading;
  
  // Separate assets by status
  const unmintedAssets = collection.filter((asset: any) => !asset.isMinted);

  const handleMint = async (asset: any) => {
    if (!asset.contractData) {
      console.error('No contract data found for asset:', asset);
      return;
    }
  
    console.log('Minting asset with contractData:', asset.contractData);
  
    // Ensure assetSymbol has a value
    const assetSymbol = asset.contractData.assetSymbol || 
                       (asset.contractData.assetName?.substring(0, 4) || 'UNKN').toUpperCase();
  
    const mintParams = {
      assetAddress: asset.contractData.assetAddress || '0x0',
      assetName: asset.contractData.assetName || 'Unknown Asset',
      assetSymbol: assetSymbol, // Use the ensured symbol
      assetType: asset.contractData.assetType || 0,
      rarity: asset.contractData.rarity || 1,
      risk: asset.contractData.risk || 1,
      rarityScore: asset.contractData.rarityScore || 50,
      predictionScore: asset.contractData.predictionScore || 50,
      currentValue: BigInt(asset.contractData.currentValue || 1000000),
      yieldRate: BigInt(asset.contractData.yieldRate || 500),
      tokenURI: asset.contractData.tokenURI || ''
    };
  
    console.log('Final mint params:', mintParams);
  
    try {
      await mintDiscoveryCard(mintParams, asset.id);
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };

  const handleRemove = async (assetId: string) => {
    try {
      await removeFromCollection(assetId);
    } catch (error) {
      console.error('Failed to remove asset:', error);
    }
  };

  const mintedNFTsCount = userStats?.discoveryCount || 0;

  const totalCollectionValue = collection.reduce((sum: number, asset: any) => {
    return sum + (asset.assetData.metrics?.liquidityDepth || 0);
  }, 0);

  if (!isConnected || !address) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
          <Users size={32} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-500 mb-6">
          Connect your wallet to view your AssetDexter collection.
        </p>
        <Button variant="primary" size="lg">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-4 font-pokemon text-primary">MY ASSETDEX</h1>
        <p className="text-gray-600">Your collection of discovered RWA assets</p>
      </motion.div>

      {/* Collection Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="text-center p-6">
          <Trophy className="mx-auto text-yellow-500 mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {mintedNFTsCount}
          </div>
          <div className="text-gray-600">Minted NFTs</div>
        </Card>
        
        <Card className="text-center p-6">
          <Package className="mx-auto text-blue-500 mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {collection.length}
          </div>
          <div className="text-gray-600">In Collection</div>
        </Card>
        
        <Card className="text-center p-6">
          <Star className="mx-auto text-purple-500 mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {userStats?.averageRarity || 'N/A'}
          </div>
          <div className="text-gray-600">Avg Rarity</div>
        </Card>
        
        <Card className="text-center p-6">
          <Users className="mx-auto text-green-500 mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            ${(totalCollectionValue / 1000000).toFixed(1)}M
          </div>
          <div className="text-gray-600">Collection Value</div>
        </Card>
      </motion.div>

      {/* Collection Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={activeTab === 'minted' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('minted')}
            className="flex-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Minted NFTs ({userStats?.discoveryCount.length})
          </Button>
          <Button
            variant={activeTab === 'unminted' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('unminted')}
            className="flex-1"
          >
            <Package className="w-4 h-4 mr-2" />
            Ready to Mint ({unmintedAssets.length})
          </Button>
          <Button
            variant={activeTab === 'collection' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('collection')}
            className="flex-1"
          >
            <Coins className="w-4 h-4 mr-2" />
            My Collection ({collection.length})
          </Button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'minted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Only show the first N cards based on discoveryCount */}
            {userCards.slice(0, Number(mintedNFTsCount)).map((cardId: string, index: number) => (
              <ContractCard 
                key={cardId} 
                tokenId={cardId} 
                onSelect={onAssetSelect}
                delay={index * 0.1}
              />
            ))}
            {mintedNFTsCount === 0 && (
              <div className="col-span-full text-center py-12">
                <Zap size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No minted NFTs yet!</h3>
                <p className="text-gray-500">Mint assets from your collection to see them here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'unminted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unmintedAssets.map((asset: any, index: number) => (
              <UnmintedCard 
                key={asset.id}
                asset={asset}
                onMint={() => handleMint(asset)}
                onRemove={() => handleRemove(asset.id)}
                isMinting={isMinting}
                delay={index * 0.1}
              />
            ))}
            {unmintedAssets.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No assets ready to mint</h3>
                <p className="text-gray-500">Add scanned assets to your collection first</p>
                <Button 
                  className="mt-4"
                  onClick={() => window.location.hash = '#home'}
                >
                  Scan Assets
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collection' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.map((asset: any, index: number) => (
              <CollectionCard 
                key={asset.id}
                asset={asset}
                delay={index * 0.1}
              />
            ))}
            {collection.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Coins size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Collection is empty</h3>
                <p className="text-gray-500">Scan assets and add them to your collection</p>
                <Button 
                  className="mt-4"
                  onClick={() => window.location.hash = '#home'}
                >
                  Start Scanning
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Contract Cards using AssetCard component
const ContractCard: React.FC<{ tokenId: string; onSelect: (card: any) => void; delay: number }> = ({ 
  tokenId, 
  onSelect, 
  delay 
}) => {
  const { data: cardData, isLoading } = useDiscoveryCard(tokenId);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
      >
        <Card className="animate-pulse p-6">
          <div className="h-16 w-16 mx-auto mb-4 bg-gray-300 rounded-full"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
        </Card>
      </motion.div>
    );
  }

  if (!cardData) return null;

  const assetCardProps = {
    id: cardData.tokenId,
    name: cardData.assetName,
    symbol: cardData.assetSymbol,
    type: getAssetTypeLabel(cardData.assetType),
    rarity: cardData.rarity,
    riskTier: cardData.risk,
    movement: 'Bullish' as const,
    confidence: Number(cardData.predictionScore) || 50
  };

  return (
    <AssetCard 
      asset={assetCardProps}
      onClick={() => onSelect(cardData)}
    />
  );
};

// Helper function for asset type
function getAssetTypeLabel(assetType: number): string {
  const types = [
    'Tokenized Treasury',
    'Real Estate', 
    'Art',
    'Luxury Goods',
    'Private Credit'
  ];
  return types[assetType] || 'Tokenized Asset';
}

// Unminted Card Component
const UnmintedCard: React.FC<{ 
  asset: any; 
  onMint: () => void;
  onRemove: () => void;
  isMinting: boolean;
  delay: number;
}> = ({ asset, onMint, onRemove, isMinting, delay }) => {
  const data = asset.assetData;
  
  const assetCardProps = {
    id: data.assetId,
    name: data.name,
    symbol: data.symbol,
    type: getAssetTypeLabel(data.assetType || 0),
    rarity: data.rarityTier || RarityTier.UNCOMMON,
    riskTier: data.riskTier || RiskTier.MEDIUM,
    movement: data.marketPrediction || 'Neutral',
    confidence: data.predictionConfidence || 50
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="relative">
        <AssetCard asset={assetCardProps} />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button 
            onClick={onRemove}
            variant="secondary"
            size="sm"
            className="!p-1 !h-6"
            icon={X}
          />
          <Button 
            onClick={onMint}
            loading={isMinting}
            variant="primary"
            size="sm"
            className="!p-1 !h-6"
            icon={Coins}
          />
        </div>
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          READY TO MINT
        </div>
      </div>
    </motion.div>
  );
};

// Collection Card Component (shows all collection items)
const CollectionCard: React.FC<{ 
  asset: any;
  delay: number;
}> = ({ asset, delay }) => {
  const data = asset.assetData;
  
  const assetCardProps = {
    id: data.assetId,
    name: data.name,
    symbol: data.symbol,
    type: getAssetTypeLabel(data.assetType || 0),
    rarity: data.rarityTier || RarityTier.UNCOMMON,
    riskTier: data.riskTier || RiskTier.MEDIUM,
    movement: data.marketPrediction || 'Neutral',
    confidence: data.predictionConfidence || 50
  };

  const status = asset.isMinted ? 'MINTED' : 'IN COLLECTION';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative"
    >
      <AssetCard asset={assetCardProps} />
      <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full ${
        asset.isMinted ? 'bg-green-500' : 'bg-blue-500'
      }`}>
        {status}
      </div>
    </motion.div>
  );
};