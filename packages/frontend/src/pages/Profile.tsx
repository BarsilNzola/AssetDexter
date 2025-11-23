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
        <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-gray-600 pb-2 border-b">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Collector</div>
          <div className="col-span-3">Minted</div>
          <div className="col-span-3">Score</div>
        </div>
        
        {leaderboardData?.map((entry: any) => (
          <div
            key={entry.address}
            className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg ${
              entry.address === address 
                ? 'bg-primary/10 border border-primary/20' 
                : 'bg-gray-50'
            }`}
          >
            <div className="col-span-1 font-bold flex items-center">
              {getRankIcon(entry.rank)}
            </div>
            <div className="col-span-5">
              <div className="font-semibold">
                {entry.address === address ? 'You' : `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
              </div>
            </div>
            <div className="col-span-3 font-bold text-primary">
              {entry.discoveryCount}
            </div>
            <div className="col-span-3 font-bold text-purple-500">
              {entry.totalScore}
            </div>
          </div>
        ))}
      </div>
      
      {leaderboardData?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Trophy size={32} className="mx-auto mb-3 text-gray-400" />
          <p>No leaderboard data available yet</p>
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

  // Calculate real stats from user cards and collection
  const calculatedStats = React.useMemo(() => {
    const totalDiscoveries = userCards.length;
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
  }, [userCards, collection]);

  // Use contract stats if available, otherwise use calculated stats
  const displayStats = userStats || calculatedStats;

  // Calculate achievements based on actual data
  const achievements = React.useMemo(() => [
    { 
      name: 'First Discovery', 
      earned: userCards.length >= 1, 
      icon: Zap,
      description: 'Discover your first RWA asset'
    },
    { 
      name: 'Rare Collector', 
      earned: userCards.length >= 3, 
      icon: Star,
      description: 'Collect 3 different RWA assets'
    },
    { 
      name: 'Dex Master', 
      earned: userCards.length >= 5, 
      icon: Trophy,
      description: 'Build a collection of 5+ assets'
    },
    { 
      name: 'Risk Taker', 
      earned: userCards.length > 0,
      icon: Shield,
      description: 'Hold assets with speculative risk'
    },
    { 
      name: 'Early Adopter', 
      earned: userCards.length > 0, 
      icon: Clock,
      description: 'Join AssetDexter during early stages'
    },
    { 
      name: 'Portfolio Builder', 
      earned: userCards.length >= 2, 
      icon: Package,
      description: 'Diversify with multiple asset types'
    },
  ], [userCards]);

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

  // Stats for display
  const stats = [
    {
      icon: Trophy,
      label: 'Total Discoveries',
      value: displayStats?.discoveryCount || userCards.length || '0',
      color: 'text-yellow-500',
      description: 'Assets discovered and collected'
    },
    {
      icon: Star,
      label: 'Average Rarity',
      value: displayStats?.averageRarity ? `${displayStats.averageRarity}/100` : 'N/A',
      color: 'text-purple-500',
      description: 'Average rarity score of your collection'
    },
    {
      icon: Award,
      label: 'Collection Score',
      value: displayStats?.totalScore || 'N/A',
      color: 'text-primary',
      description: 'Overall collection quality score'
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
        <h1 className="text-4xl font-bold mb-2 font-pokemon text-primary">TRAINER PROFILE</h1>
        <p className="text-gray-600 text-lg">Master Collector of Real-World Assets</p>
        <div className="mt-4 text-sm text-gray-500 font-mono bg-gray-100 rounded-lg py-2 px-4 inline-block">
          {address.slice(0, 8)}...{address.slice(-6)}
        </div>
        
        {/* Quick Stats */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-primary">{userCards.length}</div>
            <div className="text-gray-600">Cards</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-500">{uniqueAssetTypes}</div>
            <div className="text-gray-600">Asset Types</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-500">
              {achievements.filter(a => a.earned).length}
            </div>
            <div className="text-gray-600">Achievements</div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
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
        {/* Collection Overview */}
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
                    <Users size={16} />
                    Total Cards:
                  </span>
                  <span className="font-bold text-primary">{userCards.length}</span>
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

          {/* Recent Activity */}
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
                {userCards.length > 0 ? (
                  userCards.slice(0, 5).map((cardId: string) => (
                    <div
                      key={cardId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          #{cardId}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Discovery Card #{cardId}</div>
                          <div className="text-sm text-gray-600">
                            Added to collection
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => window.location.hash = `#asset-${cardId}`}
                      >
                        View Details
                      </Button>
                    </div>
                  ))
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