import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../lib/utils/constants';

interface MintParams {
  assetAddress: string;
  assetName: string;
  assetSymbol: string;
  assetType: number;
  rarityScore: number;
  riskTier: number;
  predictionScore: number;
  currentValue: bigint;
  yieldRate: bigint;
}

export const useMint = () => {
  const [isMinting, setIsMinting] = useState(false);
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const mintMutation = useMutation({
    mutationFn: async (params: MintParams) => {
      // Since your backend handles all contract interactions,
      // we'll call a backend endpoint to handle minting
      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          userAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mint failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });

  const mintDiscoveryCard = async (params: MintParams) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsMinting(true);
    try {
      const result = await mintMutation.mutateAsync(params);
      return result;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    mintDiscoveryCard,
    isMinting: isMinting || mintMutation.isPending,
    isConfirmed: mintMutation.isSuccess,
    error: mintMutation.error,
    data: mintMutation.data,
  };
};