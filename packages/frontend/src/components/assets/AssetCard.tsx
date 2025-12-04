import React from 'react';
import { motion } from 'framer-motion';
import { RarityTier, RiskTier } from '../../../../shared/src/types/rwa';
import { Card } from '../ui/Card';

interface AssetCardProps {
  asset: {
    id: string;
    name: string;
    symbol: string;
    type: string;
    rarity: RarityTier;
    riskTier: RiskTier;
    movement: 'Bullish' | 'Neutral' | 'Bearish';
    confidence: number;
    imageUrl?: string;
    compact?: boolean;
  };
  onClick?: () => void;
}

const RarityBadge: React.FC<{ rarity: RarityTier; compact?: boolean }> = ({ rarity, compact = false }) => {
  const rarityConfig = {
    [RarityTier.COMMON]: { color: 'bg-gray-500', label: 'Common' },
    [RarityTier.UNCOMMON]: { color: 'bg-green-500', label: 'Uncommon' },
    [RarityTier.RARE]: { color: 'bg-blue-500', label: 'Rare' },
    [RarityTier.EPIC]: { color: 'bg-purple-500', label: 'Epic' },
    [RarityTier.LEGENDARY]: { color: 'bg-yellow-500', label: 'Legendary' },
  };

  const config = rarityConfig[rarity];

  return (
    <span className={`${config.color} text-white ${compact ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} font-bold rounded-full`}>
      {config.label}
    </span>
  );
};

const RiskBadge: React.FC<{ risk: RiskTier; compact?: boolean }> = ({ risk, compact = false }) => {
  const riskConfig = {
    [RiskTier.LOW]: { color: 'bg-green-100 text-green-800', label: 'Low Risk' },
    [RiskTier.MEDIUM]: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' },
    [RiskTier.HIGH]: { color: 'bg-orange-100 text-orange-800', label: 'High Risk' },
    [RiskTier.SPECULATIVE]: { color: 'bg-red-100 text-red-800', label: 'Speculative' },
  };

  const config = riskConfig[risk];

  return (
    <span className={`${config.color} ${compact ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} font-bold rounded-full`}>
      {config.label}
    </span>
  );
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick }) => {
  const isCompact = asset.compact || false;
  
  return (
    <motion.div
      whileHover={{ scale: isCompact ? 1.02 : 1.05 }}
      whileTap={{ scale: isCompact ? 0.98 : 0.95 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card hover className={`text-center ${isCompact ? 'p-3' : 'p-4'}`}>
        <div className={`${isCompact ? 'w-12 h-12 text-xs' : 'w-16 h-16 text-sm'} mx-auto mb-3 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold`}>
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="w-full h-full rounded-full" />
          ) : (
            asset.symbol
          )}
        </div>
        
        <h3 className={`font-bold ${isCompact ? 'text-base mb-1 truncate' : 'text-lg mb-2'}`}>
          {asset.name}
        </h3>
        <p className={`text-gray-600 ${isCompact ? 'text-xs mb-3' : 'text-sm mb-4'}`}>
          {asset.type}
        </p>
        
        <div className="flex flex-wrap gap-1 justify-center mb-3">
          <RarityBadge rarity={asset.rarity} compact={isCompact} />
          <RiskBadge risk={asset.riskTier} compact={isCompact} />
        </div>
        
        {!isCompact && (
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Movement:</span>
              <span className={`font-bold ${
                asset.movement === 'Bullish' ? 'text-green-600' :
                asset.movement === 'Bearish' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {asset.movement}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">Confidence:</span>
              <span className="font-bold">{asset.confidence}%</span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};