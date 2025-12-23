import React from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '../lib/utils/constants';

const queryClient = new QueryClient();

const walletConnectProjectId = getConfig('VITE_WALLETCONNECT_PROJECT_ID');

export const config = createConfig({
  chains: [mantleSepoliaTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'AssetDexter',
        url: 'https://assetdexter.xyz',
      },
    }),
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true, // Enable WalletConnect's built-in modal
    }),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
  },
});

interface Web3ProviderProps {
  children: React.ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};