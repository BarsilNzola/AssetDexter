import React from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useUserStats, useUserCards } from '../hooks/useContracts';
import { useMint } from '../hooks/useMint';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Trophy, 
  Star, 
  Users, 
  Zap, 
  Award, 
  TrendingUp, 
  Shield,
  Clock,
  ExternalLink,
  DollarSign,
  Package,
  Crown
} from 'lucide-react';

const MintingLeaderboard: React.FC = () => {
  const { address } = useAccount();
  const { data: userStats } = useUserStats();
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['minting-leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/contracts/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500" size={16} />;
    if (rank === 2) return <Trophy className="text-gray-400" size={16} />;
    if (rank === 3) return <Award className="text-orange-500" size={16} />;
    return `#${rank}`;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={24} />
        Minting Leaderboard
      </h2>
      
      <div className="space-y-3">
        {/* Header - Better grid distribution */}
        <div className="grid grid-cols-12 gap-2 px-2 font-semibold text-sm text-gray-600 pb-2 border-b">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-5">Collector</div>
          <div className="col-span-2 text-center">Minted</div>
          <div className="col-span-3 text-center">Score</div>
        </div>
        
        {leaderboardData?.map((entry: any) => (
          <div
            key={entry.address}
            className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg ${
              entry.address === address 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Rank */}
            <div className="col-span-2 flex justify-center">
              <div className="font-bold flex items-center justify-center min-w-[30px]">
                {getRankIcon(entry.rank)}
              </div>
            </div>
            
            {/* Collector - Better address handling */}
            <div className="col-span-5">
              <div className="font-semibold truncate">
                {entry.address === address ? (
                  <span className="text-primary font-bold">You</span>
                ) : (
                  <span className="font-mono text-sm">
                    {`${entry.address.slice(0, 8)}...${entry.address.slice(-6)}`}
                  </span>
                )}
              </div>
            </div>
            
            {/* Minted Count */}
            <div className="col-span-2 text-center">
              <div className="font-bold text-primary">
                {entry.discoveryCount}
              </div>
            </div>
            
            {/* Score */}
            <div className="col-span-3 text-center">
              <div className="font-bold text-purple-500">
                {typeof entry.totalScore === 'string' 
                  ? parseInt(entry.totalScore).toLocaleString()
                  : entry.totalScore.toLocaleString()
                }
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {leaderboardData?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy size={32} className="mx-auto mb-3 text-gray-400" />
          <p>No leaderboard data available yet</p>
          <p className="text-sm text-gray-400 mt-1">Mint some assets to appear here!</p>
        </div>
      )}
    </Card>
  );
};

export const Profile: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: userStats } = useUserStats();
  const { data: userCards = [] } = useUserCards();
  const { loadCollection } = useMint();

  const { data: collection = [] } = useQuery({
    queryKey: ['user-collection'],
    queryFn: loadCollection,
    enabled: !!address && !!loadCollection
  });

  // Calculate real stats - Use actual minted count from userStats
  const calculatedStats = React.useMemo(() => {
    const totalDiscoveries = Number(userStats?.discoveryCount) || 0; // Use actual minted count
    const collectionSize = collection.length;
    
    // Calculate average rarity from collection
    const avgRarity = collection.length > 0 
      ? Math.round(collection.reduce((sum: number, asset: any) => {
          return sum + (asset.assetData.rarityScore || 75);
        }, 0) / collection.length)
      : 75;

    // Calculate collection score
    const collectionScore = totalDiscoveries * 25 + avgRarity;

    return {
      discoveryCount: totalDiscoveries,
      averageRarity: avgRarity,
      totalScore: collectionScore,
      collectionSize
    };
  }, [userStats, collection]);

  // Use contract stats if available, otherwise use calculated stats
  const displayStats = userStats || calculatedStats;

  // Use actual minted count for achievements
  const actualMintedCount = Number(userStats?.discoveryCount) || 0;
  
  // Calculate achievements based on ACTUAL minted data
  const achievements = React.useMemo(() => [
    { 
      name: 'First Discovery', 
      earned: actualMintedCount >= 1, 
      icon: Zap,
      description: 'Mint your first RWA asset'
    },
    { 
      name: 'Rare Collector', 
      earned: actualMintedCount >= 3, 
      icon: Star,
      description: 'Mint 3 different RWA assets'
    },
    { 
      name: 'Dex Master', 
      earned: actualMintedCount >= 5, 
      icon: Trophy,
      description: 'Mint a collection of 5+ assets'
    },
    { 
      name: 'Risk Taker', 
      earned: collection.length > 0, // Based on collection, not minted
      icon: Shield,
      description: 'Hold assets with speculative risk'
    },
    { 
      name: 'Early Adopter', 
      earned: actualMintedCount > 0, 
      icon: Clock,
      description: 'Join AssetDexter during early stages'
    },
    { 
      name: 'Portfolio Builder', 
      earned: collection.length >= 2, // Based on collection diversity
      icon: Package,
      description: 'Diversify with multiple asset types'
    },
  ], [actualMintedCount, collection.length]);

  // Calculate collection value from actual asset data
  const collectionValue = React.useMemo(() => {
    return collection.reduce((sum: number, asset: any) => {
      return sum + (asset.assetData.metrics?.liquidityDepth || 2500);
    }, 0);
  }, [collection]);

  // Get last discovery time
  const lastDiscovery = React.useMemo(() => {
    if (collection.length === 0) return 'Never';
    
    const latestAsset = collection.reduce((latest: any, asset: any) => {
      return new Date(asset.scannedAt) > new Date(latest.scannedAt) ? asset : latest;
    }, collection[0]);
    
    const daysAgo = Math.floor((new Date().getTime() - new Date(latestAsset.scannedAt).getTime()) / (1000 * 60 * 60 * 24));
    return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  }, [collection]);

  // Get unique asset types count
  const uniqueAssetTypes = React.useMemo(() => {
    const types = new Set(collection.map((asset: any) => asset.assetData.assetType));
    return types.size;
  }, [collection]);

  // Stats for display - Use correct counts
  const stats = [
    {
      icon: Trophy,
      label: 'Minted NFTs',
      value: displayStats?.discoveryCount || '0', // Use actual minted count
      color: 'text-yellow-500',
      description: 'Assets minted on blockchain'
    },
    {
      icon: Package,
      label: 'In Collection',
      value: collection.length, // Collection items
      color: 'text-blue-500',
      description: 'Assets in your collection'
    },
    {
      icon: Star,
      label: 'Average Rarity',
      value: displayStats?.averageRarity ? `${displayStats.averageRarity}/100` : 'N/A',
      color: 'text-purple-500',
      description: 'Average rarity score of your collection'
    },
    {
      icon: TrendingUp,
      label: 'Collection Value',
      value: `$${(collectionValue / 1000000).toFixed(1)}M`,
      color: 'text-green-500',
      description: 'Estimated total value'
    },
  ];

  if (!isConnected || !address) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
          <Users size={32} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-500 mb-6">
          Connect your wallet to view your AssetDexter profile and collection stats.
        </p>
        <Button variant="primary" size="lg">
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white">
          <Users size={48} />
        </div>
        <h1 className="text-4xl font-bold mb-2 font-pokemon text-primary">PROFILE</h1>
        <p className="text-gray-600 text-lg">Master Collector of Real-World Assets</p>
        <div className="mt-4 text-sm text-gray-500 font-mono bg-gray-100 rounded-lg py-2 px-4 inline-block">
          {address.slice(0, 8)}...{address.slice(-6)}
        </div>
        
        {/* Quick Stats - Use correct counts */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-primary">{actualMintedCount}</div>
            <div className="text-gray-600">Minted</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-500">{collection.length}</div>
            <div className="text-gray-600">In Collection</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-500">
              {achievements.filter(a => a.earned).length}
            </div>
            <div className="text-gray-600">Achievements</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Updated labels and values */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="text-center p-6" hover>
              <Icon className={`mx-auto mb-3 ${stat.color}`} size={32} />
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600 font-semibold">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-2">{stat.description}</div>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Collection Overview - Updated counts */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package className="text-primary" size={24} />
                Collection Overview
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Trophy size={16} />
                    Minted NFTs:
                  </span>
                  <span className="font-bold text-primary">{actualMintedCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Package size={16} />
                    In Collection:
                  </span>
                  <span className="font-bold text-blue-500">{collection.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Star size={16} />
                    Unique Assets:
                  </span>
                  <span className="font-bold text-purple-500">{uniqueAssetTypes}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign size={16} />
                    Total Value:
                  </span>
                  <span className="font-bold text-green-500">${(collectionValue / 1000000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock size={16} />
                    Last Discovery:
                  </span>
                  <span className="font-bold text-orange-500">{lastDiscovery}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button 
                  variant="primary" 
                  className="w-full" 
                  icon={ExternalLink}
                  onClick={() => window.location.hash = '#dex'}
                >
                  View Full Collection
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity -  Show collection activity instead of userCards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-orange-500" size={24} />
                Recent Activity
              </h2>
              <div className="space-y-3">
                {collection.length > 0 ? (
                  collection.slice(0, 5).map((asset: any) => {
                    // Proper data extraction with comprehensive fallbacks
                    const assetData = asset.assetData || asset.contractData || asset;
                    const assetName = assetData.name || assetData.assetName || 'Unknown Asset';
                    const assetSymbol = assetData.symbol || assetData.assetSymbol || 'ASSET';
                    
                    return (
                      <div
                        key={asset.id || asset.tokenId}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {assetSymbol.substring(0, 4)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {assetName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {asset.isMinted ? 'Minted' : 'Added to collection'} • {new Date(asset.scannedAt || asset.discoveryTimestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                          asset.isMinted ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {asset.isMinted ? 'MINTED' : 'IN COLLECTION'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap size={32} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg mb-2">No activity yet</p>
                    <p className="text-sm">Start scanning to discover your first RWA asset!</p>
                    <Button 
                      variant="primary" 
                      className="mt-4"
                      onClick={() => window.location.hash = '#home'}
                    >
                      Start Scanning
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
        
        {/* Leaderboard & Achievements */}
        <div className="space-y-8">
          <MintingLeaderboard />
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} />
                Achievements
                <span className="text-sm font-normal text-gray-500 ml-auto">
                  {achievements.filter(a => a.earned).length}/{achievements.length}
                </span>
              </h2>
              <div className="space-y-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.name}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        achievement.earned
                          ? 'bg-green-50 border border-green-200 shadow-sm'
                          : 'bg-gray-50 border border-gray-200 opacity-75'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          achievement.earned ? 'text-green-500' : 'text-gray-400'
                        }
                      />
                      <div className="flex-1">
                        <div className={
                          achievement.earned ? 'text-green-800 font-semibold' : 'text-gray-600'
                        }>
                          {achievement.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {achievement.description}
                        </div>
                      </div>
                      {achievement.earned ? (
                        <div className="ml-auto text-green-500 text-sm font-bold bg-green-100 px-2 py-1 rounded">
                          EARNED
                        </div>
                      ) : (
                        <div className="ml-auto text-gray-400 text-sm">
                          LOCKED
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};