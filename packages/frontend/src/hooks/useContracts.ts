import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { API_ENDPOINTS } from '../lib/utils/constants';

export const useContracts = () => {
  const scanAsset = async (contractAddress: string, chainId: number) => {
    const response = await fetch(API_ENDPOINTS.SCAN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contractAddress, chainId }),
    });
    
    if (!response.ok) {
      throw new Error('Scan failed');
    }
    
    return response.json();
  };

  return {
    scanAsset,
  };
};

export const useUserCards = () => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['user-cards', address],
    queryFn: async () => {
      if (!address) return [];

      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/user/${address}/cards`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user cards');
      }

      const data = await response.json();
      return data.cards || [];
    },
    enabled: !!address,
  });
};

export const useUserStats = () => {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['user-stats', address],
    queryFn: async () => {
      if (!address) return null;

      console.log(`Fetching user stats for address: ${address}`);
      
      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/user/${address}/stats`);
      
      if (!response.ok) {
        console.error(`Failed to fetch user stats: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch user stats');
      }

      const data = await response.json();
      console.log('User stats response:', data);
      
      return data;
    },
    enabled: !!address,
  });
};

export const useDiscoveryCard = (tokenId: string) => {
  return useQuery({
    queryKey: ['discovery-card', tokenId],
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/discovery-card/${tokenId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch discovery card');
      }

      return response.json();
    },
    enabled: !!tokenId,
  });
};