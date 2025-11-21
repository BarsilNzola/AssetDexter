/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_RPC_URL: string
  readonly VITE_DISCOVERY_CARD_ADDRESS: string
  readonly VITE_FACTORY_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}