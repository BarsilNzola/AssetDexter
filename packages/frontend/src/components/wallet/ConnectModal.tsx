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

  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log('🎯 Backdrop clicked');
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Simple connector list
  const simpleConnectors = connectors.filter(conn => conn.ready);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-300" // Red background to see the area
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg w-96 shadow-xl border-2 border-green-500"> {/* Green border to see container */}
        <h2 className="text-xl font-bold mb-4 text-center">DEBUG MODAL</h2>
        
        {simpleConnectors.map((connector, index) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            className="w-full p-4 mb-2 bg-blue-500 text-white rounded-lg font-bold text-lg border-2 border-yellow-500" // Yellow border to see button area
            style={{ cursor: 'pointer' }}
          >
            {index + 1}. CLICK ME - {connector.name}
          </button>
        ))}
        
        <button 
          onClick={onClose}
          className="w-full p-3 bg-gray-500 text-white rounded mt-4"
          style={{ cursor: 'pointer' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};