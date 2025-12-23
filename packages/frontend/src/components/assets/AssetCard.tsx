import React from 'react';
import { motion } from 'framer-motion';
import { RarityTier, RiskTier } from '../../../../shared/src/types/rwa';
import { Card } from '../ui/Card';
import { Check, Coins, Package } from 'lucide-react';

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
  status?: 'scanned' | 'in-collection' | 'minted' | 'ready-to-mint';
  showStatusBadge?: boolean;
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

const StatusBadge: React.FC<{ status: AssetCardProps['status']; compact?: boolean }> = ({ status, compact = false }) => {
  const statusConfig = {
    'scanned': { 
      color: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white', 
      label: 'SCANNED',
      icon: null 
    },
    'in-collection': { 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', 
      label: 'IN COLLECTION',
      icon: Package 
    },
    'ready-to-mint': { 
      color: 'bg-gradient-to-r from-orange-500 to-orange-400 text-white', 
      label: 'READY TO MINT',
      icon: Coins 
    },
    'minted': { 
      color: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white', 
      label: 'MINTED',
      icon: Check 
    },
  };

  const config = statusConfig[status || 'scanned'];
  const Icon = config.icon;
  
  return (
    <span className={`${config.color} ${compact ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} font-bold rounded-full flex items-center gap-1`}>
      {Icon && <Icon size={compact ? 10 : 12} />}
      {config.label}
    </span>
  );
};

export const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  onClick,
  status = 'scanned',
  showStatusBadge = true 
}) => {
  const isCompact = asset.compact || false;
  
  return (
    <motion.div
      whileHover={{ scale: isCompact ? 1.02 : 1.05 }}
      whileTap={{ scale: isCompact ? 0.98 : 0.95 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card hover className={`text-center ${isCompact ? 'p-3' : 'p-4'} relative`}>
        {/* Status Badge - Top Left */}
        {showStatusBadge && status !== 'scanned' && (
          <div className="absolute top-2 left-2">
            <StatusBadge status={status} compact={isCompact} />
          </div>
        )}
        
        {/* SCANNED badge (shown for all scanned assets) */}
        {showStatusBadge && status === 'scanned' && (
          <div className="absolute top-2 left-2">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
              SCANNED
            </span>
          </div>
        )}
        
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
        
        {/* Collection status indicator for compact view */}
        {isCompact && status !== 'scanned' && (
          <div className="mt-2 flex justify-center">
            <div className={`w-2 h-2 rounded-full ${
              status === 'in-collection' ? 'bg-blue-500' :
              status === 'ready-to-mint' ? 'bg-orange-500' :
              status === 'minted' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
        )}
      </Card>
    </motion.div>
  );
};