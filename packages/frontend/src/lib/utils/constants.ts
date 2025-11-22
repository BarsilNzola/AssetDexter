export const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  SCAN: `${API_BASE_URL}/api/scan`,
  DISCOVER: `${API_BASE_URL}/api/scan/discover`,
  DISCOVER_ASSETS: `${API_BASE_URL}/api/scan/discover-assets`,
  SCAN_DISCOVERED: `${API_BASE_URL}/api/scan/scan-discovered`,
  ASSETS: `${API_BASE_URL}/api/assets`,
  ANALYSIS: `${API_BASE_URL}/api/analysis`,
  CONTRACTS: `${API_BASE_URL}/api/contracts`,
  TEST: `${API_BASE_URL}/api/test`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;

export const RPC_URL = 'https://linea-sepolia-rpc.publicnode.com';

export const CONTRACT_ADDRESSES = {
  DISCOVERY_CARD: '0x6c49D2b8d7B200777F819d3aC5cb740D68b5E4fA', 
  FACTORY: '0x9A0E3e7960e3439F897015772e6EcaE7B632Ad9f', 
} as const;

export const getDiscoveredAssets = async (): Promise<Array<{address: string, chainId: number, name: string}>> => {
  try {
    const response = await fetch(API_ENDPOINTS.DISCOVER);
    const data = await response.json();
    
    if (data.assets && data.assets.length > 0) {
      console.log(`Found ${data.assets.length} discovered assets`);
      return data.assets.map((asset: any) => ({
        address: asset.address,
        chainId: asset.chainId,
        name: asset.name
      }));
    }
    
    console.log('No assets discovered in contract yet');
    return [];
  } catch (error) {
    console.error('Failed to fetch discovered assets:', error);
    return [];
  }
};

export const scanDiscoveredAssets = async (): Promise<any[]> => {
  try {
    const response = await fetch(API_ENDPOINTS.SCAN_DISCOVERED, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data.assets || [];
  } catch (error) {
    console.error('Failed to scan discovered assets:', error);
    return [];
  }
};

export const getRandomRWAToken = () => {
  const fallbackTokens = [
    { address: '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92', chainId: 1, name: 'OUSG' },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: 1, name: 'USDC' }
  ];
  const randomIndex = Math.floor(Math.random() * fallbackTokens.length);
  return fallbackTokens[randomIndex];
};