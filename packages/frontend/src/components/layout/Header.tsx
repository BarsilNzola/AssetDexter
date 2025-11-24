import React from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ConnectWallet } from '../wallet/ConnectWallet'; 
import { User, Scan, BookOpen } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const { isConnected } = useAccount();

  const navItems = [
    { id: 'home', label: 'Scanner', icon: Scan },
    { id: 'dex', label: 'My Dex', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
              AD
            </div>
            <h1 className="text-2xl font-bold font-pokemon text-primary">
              ASSETDEXTER
            </h1>
          </motion.div>

          {/* Navigation - Only show when connected */}
          {isConnected && (
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'primary' : 'secondary'}
                    size="sm"
                    icon={Icon}
                    onClick={() => onPageChange(item.id)}
                    className="font-pokemon text-xs"
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          )}

          {/* Wallet Connect - New single button */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
};