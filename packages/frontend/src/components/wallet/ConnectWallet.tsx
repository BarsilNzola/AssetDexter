import React, { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Wallet, LogOut, User, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { ConnectModal } from './ConnectModal';

export const ConnectWallet: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Connected Wallet Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-full pl-4 pr-2 py-2"
        >
          {/* User Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          
          {/* Address */}
          <button
            onClick={copyAddress}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
          >
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          {/* Disconnect Button */}
          <Button
            onClick={handleDisconnect}
            variant="secondary"
            size="sm"
            className="!p-1 !h-8 !w-8 rounded-full"
            icon={LogOut}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="primary"
        size="lg"
        icon={Wallet}
        className="min-w-[160px]"
      >
        Connect Wallet
      </Button>

      <ConnectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};