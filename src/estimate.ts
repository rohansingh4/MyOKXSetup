#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { BridgeService } from './services/bridgeService';

async function main() {
  const bridgeService = new BridgeService();

  program
    .name('estimate')
    .description('Estimate bridge costs and time for USDC from Base to Arbitrum')
    .version('1.0.0');

  program
    .command('quote')
    .description('Get bridge quote and estimation')
    .argument('<amount>', 'Amount of USDC to estimate')
    .action(async (amount) => {
      try {
        console.log(chalk.blue('📊 Getting Bridge Estimate'));
        console.log(chalk.gray(`Estimating bridge for ${amount} USDC from Base to Arbitrum\n`));
        
        const estimate = await bridgeService.estimateBridgeUSDC(amount);
        
        console.log(chalk.cyan('🔍 Bridge Estimate:'));
        console.log(chalk.white(`From Amount:     ${amount} USDC (Base)`));
        console.log(chalk.white(`To Amount:       ${(parseFloat(estimate.toAmount) / 1000000).toFixed(6)} USDC (Arbitrum)`));
        console.log(chalk.white(`Minimum Receive: ${(parseFloat(estimate.minimumReceive) / 1000000).toFixed(6)} USDC`));
        console.log(chalk.white(`Bridge:          ${estimate.bridgeName}`));
        console.log(chalk.white(`Estimated Time:  ${estimate.estimatedTime}`));
        
        console.log(chalk.yellow('\n💰 Fees Breakdown:'));
        console.log(chalk.white(`Cross-chain Fee: ${estimate.fees.crossChainFee}`));
        console.log(chalk.white(`Native Fee:      ${estimate.fees.otherNativeFee}`));
        
        const outputAmount = parseFloat(estimate.toAmount) / 1000000;
        const inputAmount = parseFloat(amount);
        const slippage = ((inputAmount - outputAmount) / inputAmount * 100).toFixed(4);
        
        console.log(chalk.magenta('\n📈 Price Impact:'));
        console.log(chalk.white(`Price Impact:    ${slippage}%`));
        
        const exchangeRate = (outputAmount / inputAmount).toFixed(6);
        console.log(chalk.white(`Exchange Rate:   1 USDC (Base) = ${exchangeRate} USDC (Arbitrum)`));
        
      } catch (error: any) {
        console.error(chalk.red('❌ Failed to get estimate:'), error?.message || error);
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