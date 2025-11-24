import React from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet, QrCode, ExternalLink } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  const handleConnect = (connector: any) => {
    console.log('✅ Connecting with:', connector.name);
    connect({ connector });
    onClose();
  };

  const simpleConnectors = connectors.filter(conn => conn.ready);

  // Map connector to display info
  const getConnectorInfo = (connector: any) => {
    if (connector.id === 'metaMask' || connector.name.toLowerCase().includes('metamask')) {
      return { 
        name: 'MetaMask', 
        icon: Wallet, 
        bgColor: 'bg-orange-500 hover:bg-orange-600',
        textColor: 'text-white'
      };
    }
    if (connector.id === 'walletConnect') {
      return { 
        name: 'WalletConnect', 
        icon: QrCode, 
        bgColor: 'bg-blue-500 hover:bg-blue-600',
        textColor: 'text-white'
      };
    }
    return { 
      name: 'Browser Wallet', 
      icon: ExternalLink, 
      bgColor: 'bg-gray-500 hover:bg-gray-600',
      textColor: 'text-white'
    };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white p-6 rounded-lg w-96 relative max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Wallet size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Wallet
          </h2>
          <p className="text-gray-600">
            Choose your preferred wallet to connect to AssetDexter
          </p>
        </div>

        {/* Wallet Options - USING SOLID BACKGROUNDS THAT WORK */}
        <div className="space-y-3">
          {simpleConnectors.map((connector) => {
            const info = getConnectorInfo(connector);
            return (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                className={`w-full p-4 rounded-lg font-semibold flex items-center gap-4 transition-colors duration-200 ${info.bgColor} ${info.textColor}`}
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <info.icon size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">
                    {info.name}
                  </div>
                  <div className="text-sm opacity-90">
                    {connector.id === 'walletConnect' 
                      ? 'Scan QR code to connect' 
                      : 'Click to connect directly'}
                  </div>
                </div>
              </button>
            );
          })}
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