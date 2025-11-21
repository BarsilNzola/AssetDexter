import { useQuery } from '@tanstack/react-query';
import { RWA } from '../../../shared/src/types/rwa';
import { API_ENDPOINTS } from '../lib/utils/constants';

interface AssetsParams {
  type?: string;
  chain?: string;
  limit?: number;
}

export const useAssetDex = (params: AssetsParams = {}) => {
  const { type, chain, limit = 50 } = params;

  return useQuery({
    queryKey: ['assets', type, chain, limit],
    queryFn: async (): Promise<RWA[]> => {
      const searchParams = new URLSearchParams();
      if (type) searchParams.append('type', type);
      if (chain) searchParams.append('chain', chain);
      if (limit) searchParams.append('limit', limit.toString());

      const url = `${API_ENDPOINTS.ASSETS}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAsset = (id: string) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async (): Promise<RWA> => {
      const response = await fetch(`${API_ENDPOINTS.ASSETS}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!id,
  });
};