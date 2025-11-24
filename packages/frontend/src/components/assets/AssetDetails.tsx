import React, { useState } from 'react';
import { RWA, RWAAnalysis, RarityTier, RiskTier } from '../../../../shared/src/types/rwa';
import { Button } from '../ui/Button';
import { useMint } from '../../hooks/useMint';
import { useAccount } from 'wagmi';
import { Users, DollarSign, TrendingUp, Shield, Plus, Package } from 'lucide-react';

interface AssetDetailsProps {
  asset: RWA;
  analysis: RWAAnalysis;
  onMintSuccess: () => void;
  onBack: () => void;
  onAddToCollection?: () => void;
  isAddingToCollection?: boolean;
}

const RarityDisplay: React.FC<{ rarity: RarityTier }> = ({ rarity }) => {
  const config = {
    [RarityTier.COMMON]: { color: 'from-gray-400 to-gray-600', label: 'Common' },
    [RarityTier.UNCOMMON]: { color: 'from-green-400 to-green-600', label: 'Uncommon' },
    [RarityTier.RARE]: { color: 'from-blue-400 to-blue-600', label: 'Rare' },
    [RarityTier.EPIC]: { color: 'from-purple-400 to-purple-600', label: 'Epic' },
    [RarityTier.LEGENDARY]: { color: 'from-yellow-400 to-orange-600', label: 'Legendary' },
  };

  const { color, label } = config[rarity];

  return (
    <div className={`bg-gradient-to-r ${color} text-white px-4 py-2 rounded-full font-bold text-sm`}>
      {label}
    </div>
  );
};

const RiskDisplay: React.FC<{ risk: RiskTier }> = ({ risk }) => {
  const config = {
    [RiskTier.LOW]: { color: 'bg-green-100 text-green-800', label: 'Low Risk', icon: Shield },
    [RiskTier.MEDIUM]: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk', icon: Shield },
    [RiskTier.HIGH]: { color: 'bg-orange-100 text-orange-800', label: 'High Risk', icon: Shield },
    [RiskTier.SPECULATIVE]: { color: 'bg-red-100 text-red-800', label: 'Speculative', icon: Shield },
  };

  const { color, label, icon: Icon } = config[risk];

  return (
    <div className={`${color} px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1`}>
      <Icon size={14} />
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
    <div className="flex items-center gap-2">
      <Icon size={20} className={color} />
      <span className={`font-bold ${color}`}>{label}</span>
      <span className="text-gray-600 text-sm">({confidence}% confidence)</span>
    </div>
  );
};

export const AssetDetails: React.FC<AssetDetailsProps> = ({
  asset,
  analysis,
  onMintSuccess,
  onBack,
  onAddToCollection,
  isAddingToCollection = false,
}) => {
  const { address } = useAccount();
  const { mintDiscoveryCard, isMinting, isConfirmed } = useMint();
  const [mintError, setMintError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!address) {
      setMintError('Please connect your wallet first');
      return;
    }

    try {
      setMintError(null);
      
      // Convert analysis data to mint parameters
      await mintDiscoveryCard({
        assetAddress: asset.address,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        assetType: 0, 
        rarity: analysis.rarityTier as number, 
        risk: analysis.riskTier as number, 
        rarityScore: Math.round(analysis.rarityScore),
        predictionScore: Math.round(analysis.predictionConfidence),
        currentValue: BigInt(Math.round(asset.price * 100)), // Convert to cents/wei
        yieldRate: BigInt(Math.round((analysis.metrics.yield || 0) * 100)),
        tokenURI: '' 
      });

      if (isConfirmed) {
        onMintSuccess();
      }
    } catch (error) {
      setMintError(error instanceof Error ? error.message : 'Minting failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
            {asset.symbol.slice(0, 3)}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{asset.name}</h3>
            <p className="text-gray-600">{asset.symbol}</p>
          </div>
        </div>
        <RarityDisplay rarity={analysis.rarityTier} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <DollarSign size={24} className="mx-auto text-primary mb-2" />
          <div className="text-lg font-bold">${asset.price.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Price</div>
        </div>
        <div className="card text-center">
          <Users size={24} className="mx-auto text-secondary mb-2" />
          <div className="text-lg font-bold">{asset.holders.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Holders</div>
        </div>
        <div className="card text-center">
          <TrendingUp size={24} className="mx-auto text-accent mb-2" />
          <div className="text-lg font-bold">{analysis.healthScore}%</div>
          <div className="text-sm text-gray-600">Health Score</div>
        </div>
        <div className="card text-center">
          <Shield size={24} className="mx-auto text-gray-600 mb-2" />
          <div className="text-lg font-bold">{analysis.metrics.volatility}%</div>
          <div className="text-sm text-gray-600">Volatility</div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="card">
        <h4 className="text-lg font-bold mb-4">Analysis Results</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Risk Assessment:</span>
            <RiskDisplay risk={analysis.riskTier} />
          </div>
          <div className="flex justify-between items-center">
            <span>Market Prediction:</span>
            <MovementDisplay 
              movement={analysis.marketPrediction} 
              confidence={analysis.predictionConfidence} 
            />
          </div>
          <div className="flex justify-between items-center">
            <span>Rarity Score:</span>
            <span className="font-bold">{Math.round(analysis.rarityScore)}/100</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Yield Rate:</span>
            <span className="font-bold text-green-600">
              {((analysis.metrics.yield || 0) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Add to Collection Button (only show if onAddToCollection is provided) */}
        {onAddToCollection && (
          <Button 
            onClick={onAddToCollection}
            loading={isAddingToCollection}
            variant="primary"
            className="w-full"
            icon={Package}
          >
            {isAddingToCollection ? 'Adding to Collection...' : 'Add to Collection'}
          </Button>
        )}

        {/* Mint Button */}
        <Button 
          variant="accent" 
          onClick={handleMint}
          loading={isMinting}
          disabled={!address || isMinting}
          className="w-full"
          icon={Plus}
        >
          {isMinting ? 'Minting...' : isConfirmed ? 'Minted!' : 'Mint Discovery Card'}
        </Button>

        {/* Back Button */}
        <Button variant="secondary" onClick={onBack} className="w-full">
          Back to Scanner
        </Button>
      </div>

      {/* Status Messages */}
      {mintError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {mintError}
        </div>
      )}

      {isConfirmed && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Successfully minted discovery card! Check your collection.
        </div>
      )}
    </div>
  );
};