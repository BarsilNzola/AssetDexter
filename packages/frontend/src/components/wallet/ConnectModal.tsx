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
    console.log('Connecting with:', connector.name);
    connect({ connector });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Connect Wallet - DEBUG</h2>
        
        {/* Test with simple buttons */}
        <button
          onClick={() => handleConnect(connectors[0])}
          className="w-full p-4 bg-blue-500 text-white rounded mb-2"
        >
          Test Button 1 - MetaMask
        </button>
        
        <button
          onClick={() => handleConnect(connectors[1])}
          className="w-full p-4 bg-green-500 text-white rounded mb-2"
        >
          Test Button 2 - WalletConnect
        </button>
        
        <button
          onClick={onClose}
          className="w-full p-4 bg-gray-500 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};