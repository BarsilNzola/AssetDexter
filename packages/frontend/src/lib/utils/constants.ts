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
  ASSETS: `${API_BASE_URL}/api/assets`,
  ANALYSIS: `${API_BASE_URL}/api/analysis`,
  CONTRACTS: `${API_BASE_URL}/api/contracts`,
  TEST: `${API_BASE_URL}/api/test`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;

// RPC Configuration
export const RPC_URL = 'https://sepolia.base.org';

// Contract Addresses 
export const CONTRACT_ADDRESSES = {
  DISCOVERY_CARD: '0x...', 
  FACTORY: '0x...', 
} as const;