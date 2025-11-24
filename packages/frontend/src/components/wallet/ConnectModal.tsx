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

  // DEBUG: Log all connectors
  console.log('All connectors:', connectors);

  const handleConnect = (connector: any) => {
    console.log('Connecting with:', connector.name);
    connect({ connector });
    onClose();
  };

  // Show ALL connectors for now
  const availableConnectors = connectors;

  // Map connector to display info
  const getConnectorInfo = (connector: any) => {
    const connectorId = connector.id?.toString() || '';
    const connectorName = connector.name?.toString() || '';
    
    if (connectorId.includes('metaMask') || connectorName.toLowerCase().includes('metamask')) {
      return { 
        name: 'MetaMask', 
        icon: Wallet, 
        bgColor: 'bg-orange-500 hover:bg-orange-600',
        textColor: 'text-white'
      };
    }
    if (connectorId.includes('walletConnect')) {
      return { 
        name: 'WalletConnect', 
        icon: QrCode, 
        bgColor: 'bg-blue-500 hover:bg-blue-600',
        textColor: 'text-white'
      };
    }
    return { 
      name: connectorName || 'Browser Wallet', 
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

        {/* DEBUG INFO */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Found {availableConnectors.length} connector(s)
          </p>
        </div>

        {/* Wallet Options - Show ALL connectors */}
        <div className="space-y-3">
          {availableConnectors.length > 0 ? (
            availableConnectors.map((connector: any) => {
              const info = getConnectorInfo(connector);
              const isReady = connector.ready !== false; // Handle unknown type
              
              return (
                <button
                  key={connector.id || connector.name}
                  onClick={() => handleConnect(connector)}
                  disabled={isReady === false}
                  className={`w-full p-4 rounded-lg font-semibold flex items-center gap-4 transition-colors duration-200 ${info.bgColor} ${info.textColor} ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <info.icon size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">
                      {info.name} {!isReady && '(Not available)'}
                    </div>
                    <div className="text-sm opacity-90">
                      ID: {connector.id} | Ready: {isReady.toString()}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">No wallet connectors found!</p>
            </div>
          )}
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