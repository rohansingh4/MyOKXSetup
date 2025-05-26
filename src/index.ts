import { BridgeService } from './services/bridgeService';
import { OKXApi } from './services/okxApi';
import { env } from './config/environment';
import { NETWORKS, TOKENS } from './config/constants';

// Export all services and types
export { BridgeService } from './services/bridgeService';
export { OKXApi } from './services/okxApi';
export * from './types';
export * from './config/constants';

// Main function for demonstration
async function main() {
  try {
    console.log('🌉 OKX USDC Bridge - Base to Arbitrum');
    console.log('=====================================\n');

    const bridgeService = new BridgeService();

    // Check balances
    console.log('💰 Current Balances:');
    const baseBalance = await bridgeService.getUSDCBalance();
    const arbitrumBalance = await bridgeService.getArbitrumUSDCBalance();
    console.log(`Base USDC: ${baseBalance} USDC`);
    console.log(`Arbitrum USDC: ${arbitrumBalance} USDC\n`);

    // Example: Get estimate for 1 USDC (the amount you have)
    console.log('📊 Getting estimate for 1 USDC bridge...');
    const estimate = await bridgeService.estimateBridgeUSDC('1');
    
    console.log(`Bridge: ${estimate.bridgeName}`);
    console.log(`From Amount: 1 USDC (Base)`);
    console.log(`To Amount: ${(parseFloat(estimate.toAmount) / 1000000).toFixed(6)} USDC (Arbitrum)`);
    console.log(`Estimated Time: ${estimate.estimatedTime}`);
    console.log(`Cross-chain Fee: ${estimate.fees.crossChainFee}`);
    
    console.log('\n🚀 To execute your 1 USDC bridge, use:');
    console.log('npm run bridge execute 1');
    console.log('\n📊 To get detailed estimates, use:');
    console.log('npm run estimate quote 1');

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
    
    if (error?.message?.includes('Missing required environment variables')) {
      console.log('\n💡 Setup Instructions:');
      console.log('1. Copy env.example to .env');
      console.log('2. Fill in your OKX API credentials and wallet details');
      console.log('3. Ensure you have USDC on Base chain');
    }
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
} 