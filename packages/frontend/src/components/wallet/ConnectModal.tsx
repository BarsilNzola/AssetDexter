import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, ExternalLink } from 'lucide-react';
import { useConnect } from 'wagmi';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  connector: any;
  name: string;
  description: string;
  icon: any;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect } = useConnect();

  const walletOptions: WalletOption[] = [
    {
      connector: connectors.find(c => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')),
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: Wallet,
    },
    {
      connector: connectors.find(c => c.id === 'walletConnect'),
      name: 'WalletConnect',
      description: 'Scan QR code with any WalletConnect-compatible wallet',
      icon: QrCode,
    },
    {
      connector: connectors.find(c => c.id === 'injected' && !c.name.toLowerCase().includes('metamask')),
      name: 'Browser Wallet',
      description: 'Connect using your browser wallet',
      icon: ExternalLink,
    }
  ].filter((option): option is WalletOption => 
    option.connector !== undefined
  );

  const handleConnect = (connector: any) => {
    connect({ connector });
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* REPLACED Card with simple div */}
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Wallet size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Wallet
          </h2>
          <p className="text-gray-600">
            Choose your preferred wallet to connect to AssetDexter
          </p>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3">
          {walletOptions.map((option) => (
            <button
              key={option.connector.id}
              onClick={() => handleConnect(option.connector)}
              disabled={!option.connector.ready}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left bg-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <option.icon size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {option.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};