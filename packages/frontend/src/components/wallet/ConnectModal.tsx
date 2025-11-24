import React from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet, QrCode, ExternalLink } from 'lucide-react';

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
  const { connectors, connect, isPending } = useConnect();

  if (!isOpen) return null;

  // Build wallet options with proper type safety
  const walletOptions: WalletOption[] = [];
  
  // Add each connector individually with null checks
  const metaMaskConnector = connectors.find(c => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask'));
  if (metaMaskConnector) {
    walletOptions.push({
      connector: metaMaskConnector,
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: Wallet,
    });
  }

  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
  if (walletConnectConnector) {
    walletOptions.push({
      connector: walletConnectConnector,
      name: 'WalletConnect',
      description: 'Scan QR code with any WalletConnect-compatible wallet',
      icon: QrCode,
    });
  }

  const injectedConnector = connectors.find(c => c.id === 'injected' && !c.name.toLowerCase().includes('metamask'));
  if (injectedConnector) {
    walletOptions.push({
      connector: injectedConnector,
      name: 'Browser Wallet',
      description: 'Connect using your browser wallet',
      icon: ExternalLink,
    });
  }

  const handleConnect = async (connector: any) => {
    console.log('Attempting to connect with:', connector.name);
    try {
      await connect({ connector });
      console.log('Connection successful');
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border-2 border-primary/20 relative">
        {/* Close Button - FIXED: Remove modal-button class */}
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
              disabled={!option.connector.ready || isPending}
              className="w-full p-4 border border-gray-200 rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
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
            </button>
          ))}
        </div>

        {/* Connection Status */}
        {isPending && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              Connecting to wallet...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};