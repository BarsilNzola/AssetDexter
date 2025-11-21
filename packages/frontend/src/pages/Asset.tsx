import React from 'react';
import { motion } from 'framer-motion';
import { useAsset } from '../hooks/useAssetDex';
import { useDiscoveryCard } from '../hooks/useContracts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, ExternalLink, Users, DollarSign, TrendingUp, Shield, Clock } from 'lucide-react';
import { RarityTier, RiskTier } from '../../../shared/src/types/rwa';

interface AssetProps {
  asset?: any;
  onBack: () => void;
}

// Helper to get asset ID from URL hash
const useAssetIdFromHash = (): string => {
  const hash = window.location.hash;
  if (hash.startsWith('#asset/')) {
    return hash.replace('#asset/', '');
  }
  return '';
};

const RarityBadge: React.FC<{ rarity: RarityTier }> = ({ rarity }) => {
  const rarityConfig = {
    [RarityTier.COMMON]: { color: 'from-gray-400 to-gray-600', label: 'Common' },
    [RarityTier.UNCOMMON]: { color: 'from-green-400 to-green-600', label: 'Uncommon' },
    [RarityTier.RARE]: { color: 'from-blue-400 to-blue-600', label: 'Rare' },
    [RarityTier.EPIC]: { color: 'from-purple-400 to-purple-600', label: 'Epic' },
    [RarityTier.LEGENDARY]: { color: 'from-yellow-400 to-orange-600', label: 'Legendary' },
  };

  const { color, label } = rarityConfig[rarity];

  return (
    <div className={`bg-gradient-to-r ${color} text-white px-4 py-2 rounded-full font-bold`}>
      {label}
    </div>
  );
};

const RiskBadge: React.FC<{ risk: RiskTier }> = ({ risk }) => {
  const riskConfig = {
    [RiskTier.LOW]: { color: 'bg-green-100 text-green-800', label: 'Low Risk', icon: Shield },
    [RiskTier.MEDIUM]: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk', icon: Shield },
    [RiskTier.HIGH]: { color: 'bg-orange-100 text-orange-800', label: 'High Risk', icon: Shield },
    [RiskTier.SPECULATIVE]: { color: 'bg-red-100 text-red-800', label: 'Speculative', icon: Shield },
  };

  const { color, label, icon: Icon } = riskConfig[risk];

  return (
    <div className={`${color} px-4 py-2 rounded-full font-bold flex items-center gap-2`}>
      <Icon size={16} />
      {label}
    </div>
  );
};

const MovementDisplay: React.FC<{ movement: 'Bullish' | 'Neutral' | 'Bearish'; confidence: number }> = ({ 
  movement, 
  confidence 
}) => {
  const config = {
    'Bullish': { color: 'text-green-600', label: 'Bullish', icon: TrendingUp },
    'Neutral': { color: 'text-yellow-600', label: 'Neutral', icon: TrendingUp },
    'Bearish': { color: 'text-red-600', label: 'Bearish', icon: TrendingUp },
  };

  const { color, label, icon: Icon } = config[movement];

  return (
    <div className="flex items-center gap-3">
      <Icon size={24} className={color} />
      <div>
        <span className={`font-bold text-lg ${color}`}>{label}</span>
        <div className="text-gray-600 text-sm">{confidence}% confidence</div>
      </div>
    </div>
  );
};

export const Asset: React.FC<AssetProps> = ({ asset: propAsset, onBack }) => {
  const id = useAssetIdFromHash();
  
  const { data: fetchedAsset, isLoading } = useAsset(id || '');
  const { data: discoveryCard } = useDiscoveryCard(id || '');

  const asset = propAsset || fetchedAsset;
  const isDiscoveryCard = !!discoveryCard;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!asset && !discoveryCard) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Asset Not Found</h2>
        <Button onClick={onBack} icon={ArrowLeft}>
          Back to Scanner
        </Button>
      </div>
    );
  }

  const displayData = isDiscoveryCard ? discoveryCard : asset;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={onBack} icon={ArrowLeft}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{displayData.assetName || displayData.name}</h1>
            <p className="text-gray-600 text-lg">{displayData.assetSymbol || displayData.symbol}</p>
          </div>
        </div>
        {displayData.rarityScore && (
          <RarityBadge rarity={displayData.rarityTier || RarityTier.COMMON} />
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Asset Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Asset Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <DollarSign className="mx-auto text-primary mb-2" size={24} />
                <div className="text-lg font-bold">
                  ${displayData.currentValue || displayData.price?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Current Value</div>
              </div>
              <div className="text-center">
                <Users className="mx-auto text-secondary mb-2" size={24} />
                <div className="text-lg font-bold">
                  {displayData.holders?.toLocaleString() || '1'}
                </div>
                <div className="text-sm text-gray-600">Holders</div>
              </div>
              <div className="text-center">
                <TrendingUp className="mx-auto text-accent mb-2" size={24} />
                <div className="text-lg font-bold">
                  {displayData.yieldRate ? `${displayData.yieldRate}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Yield Rate</div>
              </div>
              <div className="text-center">
                <Clock className="mx-auto text-gray-600 mb-2" size={24} />
                <div className="text-lg font-bold">
                  {displayData.age || '30'}d
                </div>
                <div className="text-sm text-gray-600">Age</div>
              </div>
            </div>
          </Card>

          {/* Analysis Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Risk Assessment:</span>
                <RiskBadge risk={displayData.riskTier || RiskTier.MEDIUM} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Market Prediction:</span>
                <MovementDisplay 
                  movement={displayData.marketPrediction || 'Neutral'} 
                  confidence={displayData.predictionConfidence || displayData.predictionScore || 50} 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Rarity Score:</span>
                <span className="font-bold text-lg">{displayData.rarityScore || 'N/A'}/100</span>
              </div>
            </div>
          </Card>

          {/* Contract Details */}
          {displayData.assetAddress && (
            <Card>
              <h2 className="text-xl font-bold mb-4">Contract Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract Address:</span>
                  <span className="font-mono text-sm">
                    {displayData.assetAddress.slice(0, 8)}...{displayData.assetAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chain:</span>
                  <span>Base Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Asset Type:</span>
                  <span>{displayData.assetType || 'Tokenized Treasury'}</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="space-y-6">
          {/* Asset Image/Icon */}
          <Card className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {(displayData.assetSymbol || displayData.symbol)?.slice(0, 3)}
            </div>
            <h3 className="font-bold text-lg mb-2">{displayData.assetName || displayData.name}</h3>
            <p className="text-gray-600 mb-4">{displayData.assetSymbol || displayData.symbol}</p>
            
            {isDiscoveryCard && (
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="text-sm text-primary font-bold">Discovery Card #{displayData.tokenId}</div>
                <div className="text-xs text-gray-600">
                  Discovered on {new Date(displayData.discoveryTimestamp * 1000).toLocaleDateString()}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="font-bold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full" icon={ExternalLink}>
                View on Explorer
              </Button>
              {!isDiscoveryCard && (
                <Button variant="accent" className="w-full">
                  Scan for Analysis
                </Button>
              )}
              {isDiscoveryCard && (
                <Button variant="secondary" className="w-full">
                  Share Discovery
                </Button>
              )}
            </div>
          </Card>

          {/* Stats Summary */}
          <Card>
            <h3 className="font-bold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Health Score:</span>
                <span className="font-bold">{displayData.healthScore || '85'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Volatility:</span>
                <span className="font-bold">{displayData.volatility || '15'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Liquidity:</span>
                <span className="font-bold">${(displayData.liquidity || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Market Cap:</span>
                <span className="font-bold">${(displayData.marketCap || 0).toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};