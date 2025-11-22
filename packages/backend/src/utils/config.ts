export const config = {
  port: process.env.PORT || 3001,
  linea: {
    rpcUrl: process.env.LINEA_RPC_URL || 'https://linea-sepolia-rpc.publicnode.com',
    chainId: 59141 // Linea Sepolia chain ID
  },
  ethereum: {
    rpcUrl: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com', // Public Ethereum RPC
    chainId: 1
  },
  base: {
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453
  },
  contracts: {
    discoveryCard: process.env.DISCOVERY_CARD_ADDRESS || '0x6c49D2b8d7B200777F819d3aC5cb740D68b5E4fA',
    factory: process.env.FACTORY_ADDRESS || '0x9A0E3e7960e3439F897015772e6EcaE7B632Ad9f'
  },
  apis: {
    defiLlama: 'https://yields.llama.fi/pools',
    creatorBid: 'https://creator.bid/api',
    covalent: process.env.COVALENT_API_KEY
  }
};