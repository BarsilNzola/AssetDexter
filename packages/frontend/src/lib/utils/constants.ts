class AppConfig {
  private static instance: AppConfig;
  private config: { [key: string]: string } = {};

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  private loadConfig() {
    // Get config from window.APP_CONFIG (injected by config.js) or environment variables
    const windowConfig = typeof window !== 'undefined' ? (window as any).APP_CONFIG : null;
    
    this.config = {
      VITE_LIGHTHOUSE_API_KEY: 
        windowConfig?.VITE_LIGHTHOUSE_API_KEY ||
        import.meta.env.VITE_LIGHTHOUSE_API_KEY ||
        '',
      
      VITE_WALLETCONNECT_PROJECT_ID:
        windowConfig?.VITE_WALLETCONNECT_PROJECT_ID ||
        import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
        '',
      
      VITE_ADMIN_ADDRESS:
        windowConfig?.VITE_ADMIN_ADDRESS ||
        import.meta.env.VITE_ADMIN_ADDRESS ||
        '',

      VITE_APP_ENV: 
        windowConfig?.VITE_APP_ENV ||
        import.meta.env.VITE_APP_ENV ||
        'development'
    };

    console.log('AppConfig loaded:', {
      hasWindowConfig: !!windowConfig,
      configKeys: Object.keys(this.config),
      lighthouseKeyPreview: this.config.VITE_LIGHTHOUSE_API_KEY ? 
        `${this.config.VITE_LIGHTHOUSE_API_KEY.substring(0, 10)}...` : 'empty',
      walletConnectPreview: this.config.VITE_WALLETCONNECT_PROJECT_ID ? 
        `${this.config.VITE_WALLETCONNECT_PROJECT_ID.substring(0, 10)}...` : 'empty'
    });
  }

  public get(key: string): string {
    return this.config[key] || '';
  }

  public require(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Required configuration '${key}' is missing`);
    }
    return value;
  }
}

// Convenience function
export const getConfig = (key: string): string => {
  return AppConfig.getInstance().get(key);
};

export const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '';
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

export { AppConfig };