import React from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { lineaSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect } from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const config = createConfig({
  chains: [lineaSepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [lineaSepolia.id]: http('https://linea-sepolia-rpc.publicnode.com'), // Linea Sepolia RPC
  },
});

const queryClient = new QueryClient();

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