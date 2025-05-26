#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { BridgeService } from './services/bridgeService';

async function main() {
  const bridgeService = new BridgeService();

  program
    .name('bridge')
    .description('Bridge USDC tokens from Base to Arbitrum using OKX')
    .version('1.0.0');

  program
    .command('execute')
    .description('Execute bridge transaction from Base to Arbitrum')
    .argument('<amount>', 'Amount of USDC to bridge')
    .option('-s, --slippage <slippage>', 'Slippage tolerance (default: 0.01)', '0.01')
    .option('-r, --referrer <address>', 'Referrer address')
    .option('-f, --fee <percent>', 'Fee percentage')
    .action(async (amount: string, options: any) => {
      try {
        console.log('🌉 Starting USDC Bridge from Base to Arbitrum');
        console.log(`Amount: ${amount} USDC`);
        
        const result = await bridgeService.bridgeUSDC(
          amount,
          options.slippage,
          options.referrer,
          options.fee
        );
        
        console.log('\n✅ Bridge transaction completed!');
        console.log(`Transaction Hash: ${result.txHash}`);
        console.log(`From: ${result.fromChain} (${result.amount} ${result.fromToken})`);
        console.log(`To: ${result.toChain} (${result.toToken})`);
        console.log(`Status: ${result.status}`);
        
      } catch (error: any) {
        console.error('❌ Bridge failed:', error.message);
        process.exit(1);
      }
    });

  program
    .command('execute-bsc')
    .description('Execute bridge transaction from Base to BSC')
    .argument('<amount>', 'Amount of USDC to bridge')
    .option('-s, --slippage <slippage>', 'Slippage tolerance (default: 0.30)', '0.30')
    .option('-r, --referrer <address>', 'Referrer address')
    .option('-f, --fee <percent>', 'Fee percentage')
    .action(async (amount: string, options: any) => {
      try {
        console.log('🌉 Starting USDC Bridge from Base to BSC');
        console.log(`Amount: ${amount} USDC`);
        
        const result = await bridgeService.bridgeUSDCToBSC(
          amount,
          options.slippage,
          options.referrer,
          options.fee
        );
        
        console.log('\n✅ Bridge transaction completed!');
        console.log(`Transaction Hash: ${result.txHash}`);
        console.log(`From: ${result.fromChain} (${result.amount} ${result.fromToken})`);
        console.log(`To: ${result.toChain} (${result.toToken})`);
        console.log(`Status: ${result.status}`);
        
      } catch (error: any) {
        console.error('❌ Bridge failed:', error.message);
        process.exit(1);
      }
    });

  program
    .command('execute-polygon')
    .description('Execute bridge transaction from Base to Polygon')
    .argument('<amount>', 'Amount of USDC to bridge')
    .option('-s, --slippage <slippage>', 'Slippage tolerance (default: 0.30)', '0.30')
    .option('-r, --referrer <address>', 'Referrer address')
    .option('-f, --fee <percent>', 'Fee percentage')
    .action(async (amount: string, options: any) => {
      try {
        console.log('🌉 Starting USDC Bridge from Base to Polygon');
        console.log(`Amount: ${amount} USDC`);
        
        const result = await bridgeService.bridgeUSDCToPolygon(
          amount,
          options.slippage,
          options.referrer,
          options.fee
        );
        
        console.log('\n✅ Bridge transaction completed!');
        console.log(`Transaction Hash: ${result.txHash}`);
        console.log(`From: ${result.fromChain} (${result.amount} ${result.fromToken})`);
        console.log(`To: ${result.toChain} (${result.toToken})`);
        console.log(`Status: ${result.status}`);
        
      } catch (error: any) {
        console.error('❌ Bridge failed:', error.message);
        process.exit(1);
      }
    });

  program
    .command('balance')
    .description('Check USDC balances on both chains')
    .action(async () => {
      try {
        console.log(chalk.blue('💰 Checking USDC Balances'));
        
        const baseBalance = await bridgeService.getUSDCBalance();
        const arbitrumBalance = await bridgeService.getArbitrumUSDCBalance();
        
        console.log(chalk.green(`Base USDC Balance: ${baseBalance} USDC`));
        console.log(chalk.green(`Arbitrum USDC Balance: ${arbitrumBalance} USDC`));
        
      } catch (error: any) {
        console.error(chalk.red('❌ Failed to check balances:'), error?.message || error);
        process.exit(1);
      }
    });

  program
    .command('status')
    .description('Check bridge transaction status')
    .argument('<txHash>', 'Transaction hash to check')
    .action(async (txHash) => {
      try {
        console.log(chalk.blue('📊 Checking transaction status'));
        
        const status = await bridgeService.checkTransactionStatus(txHash);
        
        console.log(chalk.cyan('Transaction Status:'));
        console.log(JSON.stringify(status, null, 2));
        
      } catch (error: any) {
        console.error(chalk.red('❌ Failed to check status:'), error?.message || error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

if (require.main === module) {
  main().catch((error: any) => {
    console.error(chalk.red('❌ Unexpected error:'), error?.message || error);
    process.exit(1);
  });
} 