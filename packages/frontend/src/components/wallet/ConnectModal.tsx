import React from 'react';
import { useConnect } from 'wagmi';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  connector: any;
  name: string;
  description: string;
}

export const FixedConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectors, connect } = useConnect();

  if (!isOpen) return null;

  // Create wallet options with proper type safety
  const walletOptions: WalletOption[] = [];
  
  // Manually find and add each connector with null checks
  const metaMaskConnector = connectors.find(c => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask'));
  if (metaMaskConnector) {
    walletOptions.push({
      connector: metaMaskConnector,
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
    });
  }

  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
  if (walletConnectConnector) {
    walletOptions.push({
      connector: walletConnectConnector,
      name: 'WalletConnect',
      description: 'Scan QR code with any WalletConnect-compatible wallet',
    });
  }

  const injectedConnector = connectors.find(c => c.id === 'injected' && !c.name.toLowerCase().includes('metamask'));
  if (injectedConnector) {
    walletOptions.push({
      connector: injectedConnector,
      name: 'Browser Wallet',
      description: 'Connect using your browser wallet',
    });
  }

  const handleConnect = (connector: any) => {
    connect({ connector });
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '28rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            padding: '0.5rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#6B7280" strokeWidth="2"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem auto',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '0.5rem' }}>
            Connect Wallet
          </h2>
          <p style={{ color: '#6B7280' }}>
            Choose your preferred wallet to connect to AssetDexter
          </p>
        </div>

        {/* Wallet Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {walletOptions.map((option) => (
            <button
              key={option.connector.id}
              onClick={() => handleConnect(option.connector)}
              disabled={!option.connector.ready}
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                textAlign: 'left',
                cursor: option.connector.ready ? 'pointer' : 'not-allowed',
                opacity: option.connector.ready ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (option.connector.ready) {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                }
              }}
              onMouseOut={(e) => {
                if (option.connector.ready) {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: '#6B7280', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>
                    {option.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #E5E7EB' 
        }}>
          <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};