import React from 'react';
import { useConnect } from 'wagmi';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  const handleConnect = (connector: any) => {
    console.log('✅ BUTTON CLICKED - Connecting with:', connector?.name);
    connect({ connector });
    onClose();
  };

  // Use the exact same approach that worked
  const simpleConnectors = connectors.filter(conn => conn.ready);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Connect Wallet</h2>
        
        {simpleConnectors.map((connector, index) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            className="w-full p-4 mb-2 bg-blue-500 text-white rounded-lg font-bold"
          >
            {connector.name}
          </button>
        ))}
        
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