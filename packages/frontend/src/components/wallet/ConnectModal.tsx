import React from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet, QrCode } from 'lucide-react';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  const handleConnect = (connector: any) => {
    console.log('Connecting with:', connector.name);
    connect({ connector });
    onClose();
  };

  const simpleConnectors = connectors.filter(conn => conn.ready);

  // Map connector to display info
  const getConnectorInfo = (connector: any) => {
    if (connector.id === 'metaMask' || connector.name.toLowerCase().includes('metamask')) {
      return { name: 'MetaMask', icon: Wallet, color: 'bg-orange-500' };
    }
    if (connector.id === 'walletConnect') {
      return { name: 'WalletConnect', icon: QrCode, color: 'bg-blue-500' };
    }
    return { name: connector.name, icon: Wallet, color: 'bg-gray-500' };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white p-6 rounded-lg w-96 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center">Connect Wallet</h2>
        
        {simpleConnectors.map((connector) => {
          const info = getConnectorInfo(connector);
          return (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              className={`w-full p-4 mb-3 ${info.color} text-white rounded-lg font-bold flex items-center gap-3`}
            >
              <info.icon size={20} />
              <span>{info.name}</span>
            </button>
          );
        })}
        
        <button 
          onClick={onClose}
          className="w-full p-3 bg-gray-500 text-white rounded mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};