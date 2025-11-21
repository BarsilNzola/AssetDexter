import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RWAAnalysis } from '../../../shared/src/types/rwa';
import { API_ENDPOINTS } from '../lib/utils/constants';

interface ScanParams {
  contractAddress?: string;
  chainId?: number;
}

export const useScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (params?: ScanParams): Promise<RWAAnalysis> => {
      const response = await fetch(API_ENDPOINTS.SCAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
    },
  });

  const scanAsset = async (params?: ScanParams) => {
    setIsScanning(true);
    try {
      const result = await scanMutation.mutateAsync(params);
      return result;
    } finally {
      setIsScanning(false);
    }
  };

  return {
    scanAsset,
    isScanning: isScanning || scanMutation.isPending,
    error: scanMutation.error,
    data: scanMutation.data,
  };
};