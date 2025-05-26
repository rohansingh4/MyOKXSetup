import { ethers } from 'ethers';
import { OKXApi } from './okxApi';
import { env } from '../config/environment';
import { NETWORKS, TOKENS, DEFAULT_CONFIG } from '../config/constants';
import {
  CrossChainBuildParams,
  BridgeEstimate,
  BridgeTransaction,
  CrossChainBuildResponse
} from '../types';

export class BridgeService {
  private okxApi: OKXApi;
  private wallet: ethers.Wallet;
  private baseProvider: ethers.JsonRpcProvider;
  private arbitrumProvider: ethers.JsonRpcProvider;

  constructor() {
    this.okxApi = new OKXApi();
    
    // Initialize providers
    this.baseProvider = new ethers.JsonRpcProvider(NETWORKS.BASE.rpcUrl);
    this.arbitrumProvider = new ethers.JsonRpcProvider(NETWORKS.ARBITRUM.rpcUrl);
    
    // Initialize wallet
    this.wallet = new ethers.Wallet(env.EVM_PRIVATE_KEY, this.baseProvider);
  }

  async estimateBridgeUSDC(amount: string): Promise<BridgeEstimate> {
    const amountInWei = ethers.parseUnits(amount, TOKENS.USDC.BASE.decimals);
    
    return await this.okxApi.estimateBridge(
      NETWORKS.BASE.chainIndex,
      NETWORKS.ARBITRUM.chainIndex,
      TOKENS.USDC.BASE.address,
      TOKENS.USDC.ARBITRUM.address,
      amountInWei.toString(),
      env.EVM_WALLET_ADDRESS,
      env.DEFAULT_SLIPPAGE
    );
  }

  async bridgeUSDC(
    amount: string,
    slippage?: string,
    referrerAddress?: string,
    feePercent?: string
  ): Promise<BridgeTransaction> {
    try {
      console.log(`Starting bridge of ${amount} USDC from Base to Arbitrum...`);
      
      // Check ETH balance for gas
      const ethBalance = await this.baseProvider.getBalance(env.EVM_WALLET_ADDRESS);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      console.log(`ETH balance on Base: ${ethBalanceFormatted} ETH`);
      
      // Estimate gas cost before transaction
      const gasPrice = await this.baseProvider.getFeeData();
      const estimatedGasLimit = 200000n; // Conservative estimate for bridge transactions
      const estimatedGasCost = estimatedGasLimit * (gasPrice.gasPrice || 1000000000n);
      const estimatedGasCostEth = ethers.formatEther(estimatedGasCost);
      
      console.log(`⛽ Gas Estimation:`);
      console.log(`  - Gas Limit: ${estimatedGasLimit.toString()} units`);
      console.log(`  - Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} gwei`);
      console.log(`  - Estimated Cost: ${estimatedGasCostEth} ETH`);
      console.log(`  - Available: ${ethBalanceFormatted} ETH`);
      
      if (ethBalance < estimatedGasCost * 2n) { // Safety margin
        throw new Error(`Insufficient ETH for gas fees. Need ~${estimatedGasCostEth} ETH + safety margin, but have ${ethBalanceFormatted} ETH`);
      } else {
        console.log(`✅ Gas check passed!`);
      }
      
      // Convert amount to wei format
      const amountInWei = ethers.parseUnits(amount, TOKENS.USDC.BASE.decimals);
      
      // Prepare build parameters with alternative bridge
      const buildParams: CrossChainBuildParams = {
        fromChainIndex: NETWORKS.BASE.chainIndex,
        toChainIndex: NETWORKS.ARBITRUM.chainIndex,
        fromChainId: NETWORKS.BASE.chainId,
        toChainId: NETWORKS.ARBITRUM.chainId,
        fromTokenAddress: TOKENS.USDC.BASE.address,
        toTokenAddress: TOKENS.USDC.ARBITRUM.address,
        amount: amountInWei.toString(),
        slippage: '0.50', // Very high slippage for testing
        userWalletAddress: env.EVM_WALLET_ADDRESS,
        sort: 1, // Back to optimal route
        feePercent: feePercent || env.FEE_PERCENT,
        referrerAddress: referrerAddress
      };

      // Get transaction data from OKX
      console.log('Fetching transaction data from OKX...');
      
      // 🔍 DEBUG: Add delay to ensure fresh quote
      console.log('⏳ Waiting 2 seconds for fresh quote...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const buildResponse: CrossChainBuildResponse = await this.okxApi.buildCrossChainTransaction(buildParams);
      
      if (!buildResponse.data || buildResponse.data.length === 0) {
        throw new Error('No bridge transaction data received');
      }

      // 🔍 DEBUG: Show all available bridges
      console.log('🔍 Available bridge options:');
      buildResponse.data.forEach((option, index) => {
        const minReceive = option.minimumReceive ? ethers.formatUnits(option.minimumReceive, 6) : 'N/A';
        console.log(`  ${index + 1}. ${option.router.bridgeName} - Min Receive: ${minReceive} USDC`);
      });

      // Try to use a non-Across bridge if available
      let txData = buildResponse.data[0];
      if (buildResponse.data.length > 1) {
        const nonAcrossBridge = buildResponse.data.find(option => 
          !option.router.bridgeName.toLowerCase().includes('across')
        );
        if (nonAcrossBridge) {
          console.log(`🔄 Using alternative bridge: ${nonAcrossBridge.router.bridgeName} instead of ${txData.router.bridgeName}`);
          txData = nonAcrossBridge;
        }
      }
      
      if (!txData) {
        throw new Error('Invalid transaction data received');
      }

      // 🔍 VALIDATION: Check critical parameters
      console.log('🔍 Validating bridge parameters...');
      console.log(`From Chain ID: ${buildParams.fromChainId} (should be 8453 for Base)`);
      console.log(`To Chain ID: ${buildParams.toChainId} (should be 42161 for Arbitrum)`);
      console.log(`From Token: ${buildParams.fromTokenAddress}`);
      console.log(`To Token: ${buildParams.toTokenAddress}`);
      console.log(`Amount in Wei: ${buildParams.amount}`);
      console.log(`Amount in USDC: ${ethers.formatUnits(buildParams.amount, 6)}`);
      console.log(`Slippage: ${buildParams.slippage}`);
      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.ARBITRUM.decimals)} USDC on Arbitrum`);
      
      // Validate chain IDs
      if (buildParams.fromChainId !== '8453') {
        throw new Error(`Invalid fromChainId: ${buildParams.fromChainId}, should be 8453`);
      }
      if (buildParams.toChainId !== '42161') {
        throw new Error(`Invalid toChainId: ${buildParams.toChainId}, should be 42161`);
      }
      
      // Validate amount (should be exactly what we expect)
      const expectedAmount = ethers.parseUnits(amount, 6);
      if (buildParams.amount !== expectedAmount.toString()) {
        throw new Error(`Amount mismatch: got ${buildParams.amount}, expected ${expectedAmount.toString()}`);
      }

      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.ARBITRUM.decimals)} USDC on Arbitrum`);

      // Check USDC allowance and approve if necessary
      console.log('🔍 Analyzing transaction data for actual spender...');
      
      // Decode the transaction data to find the actual bridge contract that needs approval
      // The transaction trace shows the real spender is different from tx.to
      const txInput = txData.tx.data;
      console.log(`Transaction input data: ${txInput.substring(0, 50)}...`);
      
      // For now, let's approve both the aggregator AND a generous amount to likely bridge contracts
      await this.ensureUSDCAllowance(amountInWei, txData.tx.to);
      
      // Also approve to the Across bridge contract that commonly appears in Arbitrum bridges
      // This is the actual spender we found from transaction traces
      const acrossContractAddress = '0x57df6092665eb6058DE53939612413ff4B09114E';
      console.log('🔄 Also approving actual bridge spender contract...');
      await this.ensureUSDCAllowance(amountInWei, acrossContractAddress);

      // Execute the bridge transaction
      console.log('Executing bridge transaction...');
      const transaction = {
        to: txData.tx.to,
        data: txData.tx.data,
        value: txData.tx.value,
        gasLimit: txData.tx.gasLimit,
        ...(txData.tx.maxPriorityFeePerGas ? {
          // EIP-1559 transaction
          maxPriorityFeePerGas: txData.tx.maxPriorityFeePerGas,
          maxFeePerGas: txData.tx.gasPrice // Use gasPrice as maxFeePerGas for EIP-1559
        } : {
          // Legacy transaction
          gasPrice: txData.tx.gasPrice
        })
      };

      console.log('Transaction details:', JSON.stringify(transaction, null, 2));

      const txResponse = await this.wallet.sendTransaction(transaction);
      console.log(`Transaction submitted: ${txResponse.hash}`);
      console.log(`View on Base Explorer: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);

      // Wait for confirmation
      console.log('Waiting for transaction confirmation...');
      const receipt = await txResponse.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error(`Transaction failed. Check: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);
      }

      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: txResponse.hash,
        fromChain: NETWORKS.BASE.name,
        toChain: NETWORKS.ARBITRUM.name,
        fromToken: TOKENS.USDC.BASE.symbol,
        toToken: TOKENS.USDC.ARBITRUM.symbol,
        amount: amount,
        status: 'pending',
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Bridge failed:', error);
      throw error;
    }
  }

  async checkTransactionStatus(txHash: string): Promise<any> {
    return await this.okxApi.getTransactionStatus({
      chainId: NETWORKS.BASE.chainId,
      txHash: txHash
    });
  }

  private async ensureUSDCAllowance(amount: bigint, spender: string): Promise<void> {
    const usdcAbi = [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function balanceOf(address account) view returns (uint256)'
    ];

    const usdcContract = new ethers.Contract(
      TOKENS.USDC.BASE.address,
      usdcAbi,
      this.wallet
    );

    // Check current balance
    const balance = await usdcContract.balanceOf(env.EVM_WALLET_ADDRESS);
    if (balance < amount) {
      throw new Error(`Insufficient USDC balance. Required: ${ethers.formatUnits(amount, 6)}, Available: ${ethers.formatUnits(balance, 6)}`);
    }

    // Always approve a very large amount - 100x the swap amount
    const swapAmount = ethers.formatUnits(amount, 6);
    const approvalAmount = amount * 100n;
    
    console.log(`🔄 Approving large USDC amount for safety...`);
    console.log(`Swap amount: ${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`Approval amount: ${ethers.formatUnits(approvalAmount, 6)} USDC (100x buffer)`);
    
    const approveTx = await usdcContract.approve(spender, approvalAmount);
    console.log(`Approval transaction: ${approveTx.hash}`);
    
    const receipt = await approveTx.wait();
    console.log(`✅ USDC approval confirmed in block ${receipt?.blockNumber}`);
    
    // Verify the new allowance
    const newAllowance = await usdcContract.allowance(env.EVM_WALLET_ADDRESS, spender);
    console.log(`New allowance: ${ethers.formatUnits(newAllowance, 6)} USDC`);
  }

  async getUSDCBalance(): Promise<string> {
    const usdcAbi = ['function balanceOf(address account) view returns (uint256)'];
    const usdcContract = new ethers.Contract(
      TOKENS.USDC.BASE.address,
      usdcAbi,
      this.baseProvider
    );

    const balance = await usdcContract.balanceOf(env.EVM_WALLET_ADDRESS);
    return ethers.formatUnits(balance, TOKENS.USDC.BASE.decimals);
  }

  async getArbitrumUSDCBalance(): Promise<string> {
    const usdcAbi = ['function balanceOf(address account) view returns (uint256)'];
    const usdcContract = new ethers.Contract(
      TOKENS.USDC.ARBITRUM.address,
      usdcAbi,
      this.arbitrumProvider
    );

    const balance = await usdcContract.balanceOf(env.EVM_WALLET_ADDRESS);
    return ethers.formatUnits(balance, TOKENS.USDC.ARBITRUM.decimals);
  }

  async bridgeUSDCToBSC(
    amount: string,
    slippage?: string,
    referrerAddress?: string,
    feePercent?: string
  ): Promise<BridgeTransaction> {
    try {
      console.log(`Starting bridge of ${amount} USDC from Base to BSC...`);
      
      // Check ETH balance for gas
      const ethBalance = await this.baseProvider.getBalance(env.EVM_WALLET_ADDRESS);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      console.log(`ETH balance on Base: ${ethBalanceFormatted} ETH`);
      
      // Estimate gas cost before transaction
      const gasPrice = await this.baseProvider.getFeeData();
      const estimatedGasLimit = 200000n; // Conservative estimate for bridge transactions
      const estimatedGasCost = estimatedGasLimit * (gasPrice.gasPrice || 1000000000n);
      const estimatedGasCostEth = ethers.formatEther(estimatedGasCost);
      
      console.log(`⛽ Gas Estimation:`);
      console.log(`  - Gas Limit: ${estimatedGasLimit.toString()} units`);
      console.log(`  - Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} gwei`);
      console.log(`  - Estimated Cost: ${estimatedGasCostEth} ETH`);
      console.log(`  - Available: ${ethBalanceFormatted} ETH`);
      
      if (ethBalance < estimatedGasCost * 2n) { // Safety margin
        throw new Error(`Insufficient ETH for gas fees. Need ~${estimatedGasCostEth} ETH + safety margin, but have ${ethBalanceFormatted} ETH`);
      } else {
        console.log(`✅ Gas check passed!`);
      }
      
      // Convert amount to wei format (Base USDC has 6 decimals)
      const amountInWei = ethers.parseUnits(amount, TOKENS.USDC.BASE.decimals);
      
      // Prepare build parameters for Base → BSC
      const buildParams: CrossChainBuildParams = {
        fromChainIndex: NETWORKS.BASE.chainIndex,
        toChainIndex: NETWORKS.BSC.chainIndex,
        fromChainId: NETWORKS.BASE.chainId,
        toChainId: NETWORKS.BSC.chainId,
        fromTokenAddress: TOKENS.USDC.BASE.address,
        toTokenAddress: TOKENS.USDC.BSC.address,
        amount: amountInWei.toString(),
        slippage: slippage || '0.30',
        userWalletAddress: env.EVM_WALLET_ADDRESS,
        sort: 1,
        feePercent: feePercent || env.FEE_PERCENT,
        referrerAddress: referrerAddress
      };

      // Get transaction data from OKX
      console.log('Fetching transaction data from OKX...');
      
      // 🔍 DEBUG: Add delay to ensure fresh quote
      console.log('⏳ Waiting 2 seconds for fresh quote...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const buildResponse: CrossChainBuildResponse = await this.okxApi.buildCrossChainTransaction(buildParams);
      
      if (!buildResponse.data || buildResponse.data.length === 0) {
        throw new Error('No bridge transaction data received');
      }

      // 🔍 DEBUG: Show all available bridges
      console.log('🔍 Available bridge options for Base → BSC:');
      buildResponse.data.forEach((option, index) => {
        const minReceive = option.minimumReceive ? ethers.formatUnits(option.minimumReceive, TOKENS.USDC.BSC.decimals) : 'N/A';
        console.log(`  ${index + 1}. ${option.router.bridgeName} - Min Receive: ${minReceive} USDC`);
      });

      // Try to use a non-Across bridge if available
      let txData = buildResponse.data[0];
      if (buildResponse.data.length > 1) {
        const nonAcrossBridge = buildResponse.data.find(option => 
          !option.router.bridgeName.toLowerCase().includes('across')
        );
        if (nonAcrossBridge) {
          console.log(`🔄 Using alternative bridge: ${nonAcrossBridge.router.bridgeName} instead of ${txData.router.bridgeName}`);
          txData = nonAcrossBridge;
        }
      }
      
      if (!txData) {
        throw new Error('Invalid transaction data received');
      }

      // 🔍 VALIDATION: Check critical parameters
      console.log('🔍 Validating bridge parameters...');
      console.log(`From Chain ID: ${buildParams.fromChainId} (should be 8453 for Base)`);
      console.log(`To Chain ID: ${buildParams.toChainId} (should be 56 for BSC)`);
      console.log(`From Token: ${buildParams.fromTokenAddress}`);
      console.log(`To Token: ${buildParams.toTokenAddress}`);
      console.log(`Amount in Wei: ${buildParams.amount}`);
      console.log(`Amount in USDC: ${ethers.formatUnits(buildParams.amount, 6)}`);
      console.log(`Slippage: ${buildParams.slippage}`);
      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.BSC.decimals)} USDC on BSC`);
      
      // Validate chain IDs
      if (buildParams.fromChainId !== '8453') {
        throw new Error(`Invalid fromChainId: ${buildParams.fromChainId}, should be 8453`);
      }
      if (buildParams.toChainId !== '56') {
        throw new Error(`Invalid toChainId: ${buildParams.toChainId}, should be 56`);
      }
      
      // Validate amount (should be exactly what we expect)
      const expectedAmount = ethers.parseUnits(amount, 6);
      if (buildParams.amount !== expectedAmount.toString()) {
        throw new Error(`Amount mismatch: got ${buildParams.amount}, expected ${expectedAmount.toString()}`);
      }

      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.BSC.decimals)} USDC on BSC`);

      // Check USDC allowance and approve if necessary
      console.log('🔍 Analyzing transaction for required approvals...');
      console.log(`Transaction will be sent to OKX aggregator: ${txData.tx.to}`);
      
      // The transaction trace shows the actual spender is the Stargate bridge contract
      // This is the contract that actually needs allowance to transfer your USDC
      const stargateContractAddress = '0x57df6092665eb6058DE53939612413ff4B09114E';
      console.log(`Actual USDC spender (from trace): ${stargateContractAddress}`);
      
      // Approve the aggregator contract (just in case)
      await this.ensureUSDCAllowance(amountInWei, txData.tx.to);

      // Also approve to the Stargate bridge contract that commonly appears in BSC bridges
      // This is the actual spender we found from transaction traces
      console.log('🔄 Approving actual bridge spender contract...');
      await this.ensureUSDCAllowance(amountInWei, stargateContractAddress);

      // Execute the bridge transaction
      console.log('Executing bridge transaction...');
      const transaction = {
        to: txData.tx.to,
        data: txData.tx.data,
        value: txData.tx.value,
        gasLimit: txData.tx.gasLimit,
        ...(txData.tx.maxPriorityFeePerGas ? {
          // EIP-1559 transaction
          maxPriorityFeePerGas: txData.tx.maxPriorityFeePerGas,
          maxFeePerGas: txData.tx.gasPrice // Use gasPrice as maxFeePerGas for EIP-1559
        } : {
          // Legacy transaction
          gasPrice: txData.tx.gasPrice
        })
      };

      console.log('Transaction details:', JSON.stringify(transaction, null, 2));

      const txResponse = await this.wallet.sendTransaction(transaction);
      console.log(`Transaction submitted: ${txResponse.hash}`);
      console.log(`View on Base Explorer: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);

      // Wait for confirmation
      console.log('Waiting for transaction confirmation...');
      const receipt = await txResponse.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error(`Transaction failed. Check: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);
      }

      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: txResponse.hash,
        fromChain: NETWORKS.BASE.name,
        toChain: NETWORKS.BSC.name,
        fromToken: TOKENS.USDC.BASE.symbol,
        toToken: TOKENS.USDC.BSC.symbol,
        amount: amount,
        status: 'pending',
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Bridge failed:', error);
      throw error;
    }
  }

  async bridgeUSDCToPolygon(
    amount: string,
    slippage?: string,
    referrerAddress?: string,
    feePercent?: string
  ): Promise<BridgeTransaction> {
    try {
      console.log(`Starting bridge of ${amount} USDC from Base to Polygon...`);
      
      // Check ETH balance for gas
      const ethBalance = await this.baseProvider.getBalance(env.EVM_WALLET_ADDRESS);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);
      console.log(`ETH balance on Base: ${ethBalanceFormatted} ETH`);
      
      // Estimate gas cost before transaction
      const gasPrice = await this.baseProvider.getFeeData();
      const estimatedGasLimit = 200000n; // Conservative estimate for bridge transactions
      const estimatedGasCost = estimatedGasLimit * (gasPrice.gasPrice || 1000000000n);
      const estimatedGasCostEth = ethers.formatEther(estimatedGasCost);
      
      console.log(`⛽ Gas Estimation:`);
      console.log(`  - Gas Limit: ${estimatedGasLimit.toString()} units`);
      console.log(`  - Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} gwei`);
      console.log(`  - Estimated Cost: ${estimatedGasCostEth} ETH`);
      console.log(`  - Available: ${ethBalanceFormatted} ETH`);
      
      if (ethBalance < estimatedGasCost * 2n) { // Safety margin
        throw new Error(`Insufficient ETH for gas fees. Need ~${estimatedGasCostEth} ETH + safety margin, but have ${ethBalanceFormatted} ETH`);
      } else {
        console.log(`✅ Gas check passed!`);
      }
      
      // Convert amount to wei format (Base USDC has 6 decimals)
      const amountInWei = ethers.parseUnits(amount, TOKENS.USDC.BASE.decimals);
      
      // Prepare build parameters for Base → Polygon
      const buildParams: CrossChainBuildParams = {
        fromChainIndex: NETWORKS.BASE.chainIndex,
        toChainIndex: NETWORKS.POLYGON.chainIndex,
        fromChainId: NETWORKS.BASE.chainId,
        toChainId: NETWORKS.POLYGON.chainId,
        fromTokenAddress: TOKENS.USDC.BASE.address,
        toTokenAddress: TOKENS.USDC.POLYGON.address,
        amount: amountInWei.toString(),
        slippage: slippage || '0.30',
        userWalletAddress: env.EVM_WALLET_ADDRESS,
        sort: 1,
        feePercent: feePercent || env.FEE_PERCENT,
        referrerAddress: referrerAddress
      };

      // Get transaction data from OKX
      console.log('Fetching transaction data from OKX...');
      
      // 🔍 DEBUG: Add delay to ensure fresh quote
      console.log('⏳ Waiting 2 seconds for fresh quote...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const buildResponse: CrossChainBuildResponse = await this.okxApi.buildCrossChainTransaction(buildParams);
      
      if (!buildResponse.data || buildResponse.data.length === 0) {
        throw new Error('No bridge transaction data received');
      }

      // 🔍 DEBUG: Show all available bridges
      console.log('🔍 Available bridge options for Base → Polygon:');
      buildResponse.data.forEach((option, index) => {
        const minReceive = option.minimumReceive ? ethers.formatUnits(option.minimumReceive, TOKENS.USDC.POLYGON.decimals) : 'N/A';
        console.log(`  ${index + 1}. ${option.router.bridgeName} - Min Receive: ${minReceive} USDC`);
      });

      // Use the first available bridge
      let txData = buildResponse.data[0];
      
      if (!txData) {
        throw new Error('Invalid transaction data received');
      }

      // 🔍 VALIDATION: Check critical parameters
      console.log('🔍 Validating bridge parameters...');
      console.log(`From Chain ID: ${buildParams.fromChainId} (should be 8453 for Base)`);
      console.log(`To Chain ID: ${buildParams.toChainId} (should be 137 for Polygon)`);
      console.log(`From Token: ${buildParams.fromTokenAddress}`);
      console.log(`To Token: ${buildParams.toTokenAddress}`);
      console.log(`Amount in Wei: ${buildParams.amount}`);
      console.log(`Amount in USDC: ${ethers.formatUnits(buildParams.amount, 6)}`);
      console.log(`Slippage: ${buildParams.slippage}`);
      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.POLYGON.decimals)} USDC on Polygon`);
      
      // Validate chain IDs
      if (buildParams.fromChainId !== '8453') {
        throw new Error(`Invalid fromChainId: ${buildParams.fromChainId}, should be 8453`);
      }
      if (buildParams.toChainId !== '137') {
        throw new Error(`Invalid toChainId: ${buildParams.toChainId}, should be 137`);
      }
      
      // Validate amount (should be exactly what we expect)
      const expectedAmount = ethers.parseUnits(amount, 6);
      if (buildParams.amount !== expectedAmount.toString()) {
        throw new Error(`Amount mismatch: got ${buildParams.amount}, expected ${expectedAmount.toString()}`);
      }

      console.log(`Bridge: ${txData.router.bridgeName}`);
      console.log(`Expected to receive: ${ethers.formatUnits(txData.toTokenAmount, TOKENS.USDC.POLYGON.decimals)} USDC on Polygon`);

      // Check USDC allowance and approve if necessary
      console.log('🔍 Analyzing transaction for required approvals...');
      console.log(`Transaction will be sent to OKX aggregator: ${txData.tx.to}`);
      
      // Approve the aggregator contract
      await this.ensureUSDCAllowance(amountInWei, txData.tx.to);

      // Also approve to common bridge contracts that might be used
      console.log('🔄 Also approving common bridge contracts...');
      const commonBridgeContracts = [
        '0x57df6092665eb6058DE53939612413ff4B09114E', // Stargate
        '0x41ee28ee05341e7fdddc8d433ba66054cd302ca1'  // Across
      ];
      
      for (const bridgeContract of commonBridgeContracts) {
        await this.ensureUSDCAllowance(amountInWei, bridgeContract);
      }

      // Execute the bridge transaction
      console.log('Executing bridge transaction...');
      const transaction = {
        to: txData.tx.to,
        data: txData.tx.data,
        value: txData.tx.value,
        gasLimit: txData.tx.gasLimit,
        ...(txData.tx.maxPriorityFeePerGas ? {
          // EIP-1559 transaction
          maxPriorityFeePerGas: txData.tx.maxPriorityFeePerGas,
          maxFeePerGas: txData.tx.gasPrice // Use gasPrice as maxFeePerGas for EIP-1559
        } : {
          // Legacy transaction
          gasPrice: txData.tx.gasPrice
        })
      };

      console.log('Transaction details:', JSON.stringify(transaction, null, 2));

      const txResponse = await this.wallet.sendTransaction(transaction);
      console.log(`Transaction submitted: ${txResponse.hash}`);
      console.log(`View on Base Explorer: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);

      // Wait for confirmation
      console.log('Waiting for transaction confirmation...');
      const receipt = await txResponse.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error(`Transaction failed. Check: ${NETWORKS.BASE.explorerUrl}/tx/${txResponse.hash}`);
      }

      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: txResponse.hash,
        fromChain: NETWORKS.BASE.name,
        toChain: NETWORKS.POLYGON.name,
        fromToken: TOKENS.USDC.BASE.symbol,
        toToken: TOKENS.USDC.POLYGON.symbol,
        amount: amount,
        status: 'pending',
        timestamp: Date.now()
      };

    } catch (error: any) {
      console.error('Bridge failed:', error);
      throw error;
    }
  }
} 