export const config = {
  port: process.env.PORT || 3001,
  mantle: {
    rpcUrl: process.env.LINEA_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
    chainId: 5003
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
    discoveryCard: process.env.DISCOVERY_CARD_ADDRESS || '0x319A206621251f7b2582E5fa8c9E084D1371d09B',
    factory: process.env.FACTORY_ADDRESS || '0xEBBf602115Ccb466B4831777A5C7854dcC7c8283'
  },
  apis: {
    defiLlama: 'https://yields.llama.fi/pools',
    creatorBid: 'https://creator.bid/api',
    covalent: process.env.COVALENT_API_KEY
  }
};