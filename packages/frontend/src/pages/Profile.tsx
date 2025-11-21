import React from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useUserStats, useUserCards } from '../hooks/useContracts';
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
  ExternalLink
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { data: userStats } = useUserStats();
  const { data: userCards = [] } = useUserCards();

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

  const stats = [
    {
      icon: Trophy,
      label: 'Total Discoveries',
      value: userStats?.discoveryCount || '0',
      color: 'text-yellow-500',
    },
    {
      icon: Star,
      label: 'Average Rarity',
      value: userStats?.averageRarity || '0',
      color: 'text-purple-500',
    },
    {
      icon: Award,
      label: 'Collection Score',
      value: userStats?.totalScore || '0',
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Rank',
      value: '#1', // This would come from your backend
      color: 'text-green-500',
    },
  ];

  const achievements = [
    { name: 'First Discovery', earned: true, icon: Zap },
    { name: 'Rare Collector', earned: userCards.length >= 5, icon: Star },
    { name: 'Dex Master', earned: userCards.length >= 20, icon: Trophy },
    { name: 'Risk Taker', earned: false, icon: Shield },
    { name: 'Early Adopter', earned: true, icon: Clock },
  ];

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
        <div className="mt-4 text-sm text-gray-500 font-mono">
          {address.slice(0, 8)}...{address.slice(-6)}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="text-center" hover>
              <Icon className={`mx-auto mb-3 ${stat.color}`} size={32} />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Collection Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2 className="text-xl font-bold mb-4">Collection Overview</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Cards:</span>
                <span className="font-bold">{userCards.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unique Assets:</span>
                <span className="font-bold">{userCards.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold">$0</span> {/* Would calculate from assets */}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last Discovery:</span>
                <span className="font-bold">2 days ago</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button variant="primary" className="w-full" icon={ExternalLink}>
                View Full Collection
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h2 className="text-xl font-bold mb-4">Achievements</h2>
            <div className="space-y-3">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.name}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      achievement.earned
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        achievement.earned ? 'text-green-500' : 'text-gray-400'
                      }
                    />
                    <span
                      className={
                        achievement.earned ? 'text-green-800 font-semibold' : 'text-gray-600'
                      }
                    >
                      {achievement.name}
                    </span>
                    {achievement.earned && (
                      <div className="ml-auto text-green-500 text-sm font-bold">
                        EARNED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {userCards.length > 0 ? (
              userCards.slice(0, 5).map((cardId: string, index: number) => (
                <div
                  key={cardId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xs font-bold">
                      #{cardId}
                    </div>
                    <div>
                      <div className="font-semibold">Discovery Card #{cardId}</div>
                      <div className="text-sm text-gray-600">
                        Minted {index + 1} day{index + 1 === 1 ? '' : 's'} ago
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap size={32} className="mx-auto mb-3 text-gray-400" />
                <p>No activity yet. Start scanning to discover assets!</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};