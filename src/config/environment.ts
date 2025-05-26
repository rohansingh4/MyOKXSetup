import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  OKX_API_KEY: string;
  OKX_SECRET_KEY: string;
  OKX_PASSPHRASE: string;
  EVM_WALLET_ADDRESS: string;
  EVM_PRIVATE_KEY: string;
  BASE_CHAIN_ID: string;
  ARBITRUM_CHAIN_ID: string;
  BASE_USDC_ADDRESS: string;
  ARBITRUM_USDC_ADDRESS: string;
  DEFAULT_SLIPPAGE: string;
  FEE_PERCENT: string;
}

function validateEnvironment(): Environment {
  const requiredVars = [
    'OKX_API_KEY',
    'OKX_SECRET_KEY', 
    'OKX_PASSPHRASE',
    'EVM_WALLET_ADDRESS',
    'EVM_PRIVATE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    OKX_API_KEY: process.env.OKX_API_KEY!,
    OKX_SECRET_KEY: process.env.OKX_SECRET_KEY!,
    OKX_PASSPHRASE: process.env.OKX_PASSPHRASE!,
    EVM_WALLET_ADDRESS: process.env.EVM_WALLET_ADDRESS!,
    EVM_PRIVATE_KEY: process.env.EVM_PRIVATE_KEY!,
    BASE_CHAIN_ID: process.env.BASE_CHAIN_ID || '8453',
    ARBITRUM_CHAIN_ID: process.env.ARBITRUM_CHAIN_ID || '42161',
    BASE_USDC_ADDRESS: process.env.BASE_USDC_ADDRESS || '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
    ARBITRUM_USDC_ADDRESS: process.env.ARBITRUM_USDC_ADDRESS || '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    DEFAULT_SLIPPAGE: process.env.DEFAULT_SLIPPAGE || '0.01',
    FEE_PERCENT: process.env.FEE_PERCENT || '0.5'
  };
}

export const env = validateEnvironment(); 