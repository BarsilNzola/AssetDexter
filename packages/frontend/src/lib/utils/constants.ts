export const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  SCAN: `${API_BASE_URL}/api/scan`,
  ASSETS: `${API_BASE_URL}/assets`,
  ANALYSIS: `${API_BASE_URL}/analysis`,
  CONTRACTS: `${API_BASE_URL}/contracts`,
  TEST: `${API_BASE_URL}/test`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;

// RPC Configuration
export const RPC_URL = 'https://linea-sepolia-rpc.publicnode.com';

// Contract Addresses 
export const CONTRACT_ADDRESSES = {
  DISCOVERY_CARD: '0x6c49D2b8d7B200777F819d3aC5cb740D68b5E4fA', 
  FACTORY: '0x9A0E3e7960e3439F897015772e6EcaE7B632Ad9f', 
} as const;

export const RWA_TOKEN_ADDRESSES = [
  { address: '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92', chainId: 1, name: 'OUSG' }, // Ondo USY
  { address: CONTRACT_ADDRESSES.DISCOVERY_CARD, chainId: 59141, name: 'Discovery Card' },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chainId: 1, name: 'USDC' }, // Could be tokenized
  { address: CONTRACT_ADDRESSES.FACTORY, chainId: 59141, name: 'Factory' },
];

// Get a random RWA token to scan
export const getRandomRWAToken = () => {
  const randomIndex = Math.floor(Math.random() * RWA_TOKEN_ADDRESSES.length);
  return RWA_TOKEN_ADDRESSES[randomIndex];
};