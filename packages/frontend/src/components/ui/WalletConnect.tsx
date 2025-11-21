import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './Button';
import { LogOut, Wallet } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);
  const [pendingConnector, setPendingConnector] = useState<string | null>(null);

  const handleConnect = async (connector: any) => {
    setIsConnecting(true);
    setPendingConnector(connector.id);
    try {
      await connect({ connector });
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
      setPendingConnector(null);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={LogOut}
          onClick={() => disconnect()}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          variant="primary"
          size="sm"
          icon={Wallet}
          loading={isConnecting && connector.id === pendingConnector}
          onClick={() => handleConnect(connector)}
          disabled={!connector.ready || isConnecting}
        >
          {connector.name === 'WalletConnect' ? 'WalletConnect' : 'Connect Wallet'}
        </Button>
      ))}
    </div>
  );
};