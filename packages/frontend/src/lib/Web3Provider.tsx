import React from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { lineaSepolia } from 'wagmi/chains';
import { injected, walletConnect, metaMask } from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const config = createConfig({
  chains: [lineaSepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    metaMask({
      dappMetadata: {
        name: 'AssetDexter',
        url: 'https://assetdexter.xyz',
      },
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
      {children}
    </WagmiProvider>
  );
};