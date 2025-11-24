import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, QrCode, ExternalLink } from 'lucide-react';
import { useConnect } from 'wagmi';
import { Card } from '../ui/Card';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect, error, isPending } = useConnect();

  const walletOptions = [
    {
      connector: connectors.find(c => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')),
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: Wallet,
      type: 'extension' as const
    },
    {
      connector: connectors.find(c => c.id === 'walletConnect'),
      name: 'WalletConnect',
      description: 'Scan QR code with any WalletConnect-compatible wallet',
      icon: QrCode,
      type: 'qr' as const
    },
    {
      connector: connectors.find(c => c.id === 'injected' && !c.name.toLowerCase().includes('metamask')),
      name: 'Browser Wallet',
      description: 'Connect using your browser wallet',
      icon: ExternalLink,
      type: 'injected' as const
    }
  ].filter(option => option.connector) as {
    connector: any;
    name: string;
    description: string;
    icon: any;
    type: 'extension' | 'qr' | 'injected';
  }[];

  const handleConnect = (connector: any) => {
    connect({ connector }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md"
            >
              <Card className="p-6 relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
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
                <div className="space-y-3 mb-6">
                  {walletOptions.map((option, index) => (
                    <motion.button
                      key={option.connector.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleConnect(option.connector)}
                      disabled={!option.connector.ready || isPending}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group text-left"
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
                        {isPending && (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <p className="text-sm text-red-800 text-center">
                      {error.message}
                    </p>
                  </motion.div>
                )}

                {/* Footer */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By connecting, you agree to our Terms of Service
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};