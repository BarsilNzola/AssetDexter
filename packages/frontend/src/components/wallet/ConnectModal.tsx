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
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  // Build wallet options with proper type safety
  const walletOptions: WalletOption[] = [];
  
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

  const handleConnect = (connector: any) => {
    console.log('Connecting with:', connector.name);
    connect({ connector });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
            <Wallet size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Wallet
          </h2>
          <p className="text-gray-600">
            Choose your preferred wallet to connect to AssetDexter
          </p>
        </div>

        {/* Wallet Options - SIMPLE STYLING THAT WORKS */}
        <div>
          {walletOptions.map((option) => (
            <button
              key={option.connector.id}
              onClick={() => handleConnect(option.connector)}
              disabled={!option.connector.ready}
              className="w-full p-4 mb-3 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <option.icon size={24} className="text-gray-600" />
                </div>
                <div>
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
      </div>
    </div>
  );
};