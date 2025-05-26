export const NETWORKS = {
  BASE: {
    chainId: '8453',
    chainIndex: '8453',
    name: 'Base',
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/uJipjYqhcDH3BvREibYkA_cw5BJpgw4S',
    explorerUrl: 'https://basescan.org'
  },
  ARBITRUM: {
    chainId: '42161', 
    chainIndex: '42161',
    name: 'Arbitrum One',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/uJipjYqhcDH3BvREibYkA_cw5BJpgw4S',
    explorerUrl: 'https://arbiscan.io'
  },
  BSC: {
    chainId: '56',
    chainIndex: '56', 
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com'
  },
  POLYGON: {
    chainId: '137',
    chainIndex: '137',
    name: 'Polygon',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/uJipjYqhcDH3BvREibYkA_cw5BJpgw4S',
    explorerUrl: 'https://polygonscan.com'
  }
} as const;

export const TOKENS = {
  USDC: {
    BASE: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC on Base
      decimals: 6,
      symbol: 'USDC'
    },
    ARBITRUM: {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Native USDC on Arbitrum
      decimals: 6,
      symbol: 'USDC'
    },
    BSC: {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
      decimals: 18,
      symbol: 'USDC'
    },
    POLYGON: {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      decimals: 6,
      symbol: 'USDC'
    }
  }
} as const;

export const OKX_CONFIG = {
  BASE_URL: 'https://web3.okx.com',
  ENDPOINTS: {
    CROSS_CHAIN_BUILD: '/api/v5/dex/cross-chain/build-tx',
    CROSS_CHAIN_QUOTE: '/api/v5/dex/cross-chain/quote',
    CROSS_CHAIN_STATUS: '/api/v5/dex/cross-chain/status',
    SUPPORTED_CHAINS: '/api/v5/dex/cross-chain/supported/chains',
    SUPPORTED_TOKENS: '/api/v5/dex/cross-chain/supported/tokens',
    SUPPORTED_BRIDGES: '/api/v5/dex/cross-chain/supported/bridges'
  }
} as const;

export const DEFAULT_CONFIG = {
  SLIPPAGE: '0.01', // 1%
  FEE_PERCENT: '0.5', // 0.5%
  SORT: 1, // Optimal route
  TIMEOUT: 30000 // 30 seconds
} as const; 