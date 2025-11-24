import React from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { lineaSepolia } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '../lib/utils/constants';

const queryClient = new QueryClient();

const walletConnectProjectId = getConfig('VITE_WALLETCONNECT_PROJECT_ID');

export const config = createConfig({
  chains: [lineaSepolia],
  connectors: [
    // Use metaMask connector first
    metaMask({
      dappMetadata: {
        name: 'AssetDexter',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://assetdexter.xyz',
      },
    }),
    // Then use injected as fallback
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: false,
    }),
  ],
  transports: {
    [lineaSepolia.id]: http('https://linea-sepolia-rpc.publicnode.com'),
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