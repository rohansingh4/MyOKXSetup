import { ethers } from 'ethers';
import { env } from './config/environment';
import { TOKENS } from './config/constants';

async function checkAllowances() {
  console.log('🔍 Checking USDC allowances...\n');
  
  const baseProvider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/uJipjYqhcDH3BvREibYkA_cw5BJpgw4S');
  
  const usdcAbi = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)'
  ];

  const usdcContract = new ethers.Contract(
    TOKENS.USDC.BASE.address,
    usdcAbi,
    baseProvider
  );

  // Check balance
  const balance = await usdcContract.balanceOf(env.EVM_WALLET_ADDRESS);
  console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)} USDC\n`);

  // Check allowance to OKX aggregator
  const okxAggregator = '0x997aAb9324e9fE456Cc0E64AF510D770707c8d78';
  const okxAllowance = await usdcContract.allowance(env.EVM_WALLET_ADDRESS, okxAggregator);
  console.log(`📋 Allowances:`);
  console.log(`  OKX Aggregator (${okxAggregator}): ${ethers.formatUnits(okxAllowance, 6)} USDC`);

  // Check allowance to Stargate contract
  const stargateContract = '0x57df6092665eb6058DE53939612413ff4B09114E';
  const stargateAllowance = await usdcContract.allowance(env.EVM_WALLET_ADDRESS, stargateContract);
  console.log(`  Stargate Contract (${stargateContract}): ${ethers.formatUnits(stargateAllowance, 6)} USDC`);
  
  console.log('\n✅ Allowance check complete');
}

checkAllowances().catch(console.error); 