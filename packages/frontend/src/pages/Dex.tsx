import React from 'react';
import { motion } from 'framer-motion';
import { useUserCards, useUserStats, useDiscoveryCard } from '../hooks/useContracts';
import { Card } from '../components/ui/Card';
import { AssetCard } from '../components/assets/AssetCard';
import { Button } from '../components/ui/Button';
import { Trophy, Users, Star, Zap } from 'lucide-react';
import { RarityTier, RiskTier } from '../../../shared/src/types/rwa';

interface DexProps {
  onAssetSelect: (asset: any) => void;
}

export const Dex: React.FC<DexProps> = ({ onAssetSelect }) => {
  const { data: userCards = [], isLoading: cardsLoading } = useUserCards();
  const { data: userStats, isLoading: statsLoading } = useUserStats();

  const isLoading = cardsLoading || statsLoading;

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

      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="text-center">
          <Trophy className="mx-auto text-yellow-500 mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {userStats?.discoveryCount || 0}
          </div>
          <div className="text-gray-600">Total Discoveries</div>
        </Card>
        
        <Card className="text-center">
          <Star className="mx-auto text-secondary mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {userStats?.averageRarity || 0}
          </div>
          <div className="text-gray-600">Avg Rarity Score</div>
        </Card>
        
        <Card className="text-center">
          <Users className="mx-auto text-accent mb-2" size={32} />
          <div className="text-2xl font-bold text-primary">
            {userStats?.totalScore || 0}
          </div>
          <div className="text-gray-600">Collection Score</div>
        </Card>
      </motion.div>

      {/* Collection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Collection</h2>
          <span className="text-gray-600">
            {userCards.length} {userCards.length === 1 ? 'card' : 'cards'}
          </span>
        </div>

        {userCards.length === 0 ? (
          <Card className="text-center py-12">
            <Zap size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No cards yet!</h3>
            <p className="text-gray-500 mb-4">Scan discovered assets to build your collection</p>
            <Button onClick={() => window.location.hash = '#home'}>
              Start Scanning
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCards.map((cardId: string, index: number) => (
              <DiscoveryCard 
                key={cardId} 
                tokenId={cardId} 
                onSelect={onAssetSelect}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Helper component for discovery cards
const DiscoveryCard: React.FC<{ tokenId: string; onSelect: (card: any) => void; delay: number }> = ({ 
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
        <Card className="animate-pulse">
          <div className="h-48 bg-gray-300 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </Card>
      </motion.div>
    );
  }

  if (!cardData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      className="cursor-pointer"
      onClick={() => onSelect(cardData)}
    >
      <Card hover>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
            {cardData.assetSymbol?.slice(0, 3) || 'RWA'}
          </div>
          <h3 className="font-bold text-lg mb-2">{cardData.assetName}</h3>
          <p className="text-gray-600 text-sm mb-4">{cardData.assetSymbol}</p>
          <div className="flex justify-between text-sm">
            <span>Rarity:</span>
            <span className="font-bold">{cardData.rarityScore}/100</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};