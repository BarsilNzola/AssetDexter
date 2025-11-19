export const config = {
  port: process.env.PORT || 3001,
  linea: {
    rpcUrl: process.env.LINEA_RPC_URL || 'https://linea-sepolia-rpc.publicnode.com',
    chainId: 59141 // Linea Sepolia chain ID
  },
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
    chainId: 1
  },
  base: {
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453
  },
  contracts: {
    discoveryCard: process.env.DISCOVERY_CARD_ADDRESS || '',
    factory: process.env.FACTORY_ADDRESS || ''
  },
  apis: {
    defiLlama: 'https://yields.llama.fi/pools',
    creatorBid: 'https://api.creatorbid.com/v1',
    covalent: process.env.COVALENT_API_KEY
  }
};