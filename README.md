# OKX USDC Bridge: Base to Arbitrum

A TypeScript application for bridging USDC tokens from Base to Arbitrum using the OKX DEX API. This project provides estimation of fees, transaction times, and seamless cross-chain token transfers.

## Features

- 🌉 **Cross-chain Bridge**: Bridge USDC from Base to Arbitrum using OKX's optimized routes
- 💰 **Fee Estimation**: Get detailed breakdowns of bridge fees and gas costs
- ⏱️ **Time Estimation**: Estimate bridge completion times
- 📊 **Balance Tracking**: Check USDC balances on both chains
- 🔄 **Transaction Status**: Monitor bridge transaction progress
- 🛡️ **Secure**: Uses your private keys locally, never transmitted to external services

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OKX API credentials (API Key, Secret Key, Passphrase)
- EVM wallet with private key
- USDC tokens on Base chain
- ETH on Base for gas fees

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd okx-usdc-bridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp env.example .env
   ```

4. **Configure your .env file**
   ```bash
   # OKX API Configuration
   OKX_API_KEY=your_okx_api_key_here
   OKX_SECRET_KEY=your_okx_secret_key_here
   OKX_PASSPHRASE=your_okx_passphrase_here

   # Wallet Configuration
   EVM_WALLET_ADDRESS=0x1234567890123456789012345678901234567890
   EVM_PRIVATE_KEY=0x1234567890123456789012345678901234567890123456789012345678901234

   # Bridge Configuration (Optional - has defaults)
   DEFAULT_SLIPPAGE=0.01
   FEE_PERCENT=0.5
   ```

## Getting OKX API Credentials

1. Visit [OKX API Management](https://www.okx.com/account/my-api)
2. Create a new API key with the following permissions:
   - Trading
   - Wallet (if needed)
3. Note down your API Key, Secret Key, and Passphrase
4. Add these to your `.env` file

## Usage

### 1. Check Your Setup
```bash
npm start
```
This will show your current balances and get a sample estimate.

### 2. Get Bridge Estimates
```bash
# Get estimate for bridging 10 USDC
npm run estimate quote 10

# Get estimate for different amounts
npm run estimate quote 50
npm run estimate quote 100
```

### 3. Execute Bridge Transaction
```bash
# Bridge 10 USDC with default settings
npm run bridge execute 10

# Bridge with custom slippage
npm run bridge execute 10 --slippage 0.02

# Bridge with referrer address for fees
npm run bridge execute 10 --referrer 0x1234567890123456789012345678901234567890

# Bridge with custom fee percentage
npm run bridge execute 10 --fee 1.0
```

### 4. Check Balances
```bash
npm run bridge balance
```

### 5. Monitor Transaction Status
```bash
# Check status of your bridge transaction
npm run bridge status 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Example Output

### Bridge Estimate
```
📊 Getting Bridge Estimate
Estimating bridge for 10 USDC from Base to Arbitrum

🔍 Bridge Estimate:
From Amount:     10 USDC (Base)
To Amount:       9.985000 USDC (Arbitrum)
Minimum Receive: 9.875000 USDC
Bridge:          Stargate
Estimated Time:  5-15 minutes

💰 Fees Breakdown:
Cross-chain Fee: 0.015000
Native Fee:      0.000000

📈 Price Impact:
Price Impact:    0.1500%
Exchange Rate:   1 USDC (Base) = 0.998500 USDC (Arbitrum)
```

### Bridge Execution
```
🌉 Starting USDC Bridge from Base to Arbitrum
Amount: 10 USDC

Fetching transaction data from OKX...
Bridge: Stargate
Expected to receive: 9.985000 USDC on Arbitrum
USDC allowance already sufficient
Executing bridge transaction...
Transaction submitted: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
View on Base Explorer: https://basescan.org/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
Waiting for transaction confirmation...
Transaction confirmed in block 12345678

✅ Bridge transaction submitted successfully!
Transaction Hash: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
⏳ Your tokens are being bridged. This may take 10-30 minutes.
```

## API Integration

You can also use this as a library in your own projects:

```typescript
import { BridgeService, OKXApi } from 'okx-usdc-bridge';

const bridgeService = new BridgeService();

// Get estimate
const estimate = await bridgeService.estimateBridgeUSDC('10');
console.log(`Bridge via ${estimate.bridgeName} will take ${estimate.estimatedTime}`);

// Execute bridge
const transaction = await bridgeService.bridgeUSDC('10');
console.log(`Bridge transaction: ${transaction.txHash}`);

// Check status
const status = await bridgeService.checkTransactionStatus(transaction.txHash);
console.log('Transaction status:', status);
```

## Project Structure

```
src/
├── config/
│   ├── constants.ts      # Network and token configurations
│   └── environment.ts    # Environment variable validation
├── services/
│   ├── okxApi.ts        # OKX API client
│   └── bridgeService.ts # Main bridge orchestration
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   └── auth.ts          # OKX API authentication
├── bridge.ts            # CLI for bridge operations
├── estimate.ts          # CLI for estimates
└── index.ts             # Main entry point
```

## Supported Networks

- **Source**: Base (Chain ID: 8453)
- **Destination**: Arbitrum One (Chain ID: 42161)
- **Token**: USDC (6 decimals)

## Error Handling

The application includes comprehensive error handling for:
- Invalid API credentials
- Insufficient balances
- Network connectivity issues
- Transaction failures
- Invalid parameters

## Security Notes

- Private keys are used locally and never transmitted
- All API requests are signed securely
- Always verify transaction details before execution
- Keep your `.env` file secure and never commit it

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required fields in `.env` are filled
   - Check that your `.env` file is in the project root

2. **"Insufficient USDC balance"**
   - Verify you have enough USDC on Base chain
   - Check your wallet address is correct

3. **"Failed to get estimate"**
   - Verify your OKX API credentials
   - Check your internet connection
   - Ensure the bridge amount meets minimum requirements

4. **Transaction fails**
   - Ensure you have enough ETH on Base for gas fees
   - Check that you've approved USDC spending
   - Verify the bridge route is available

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Disclaimer

This software is provided as-is. Always verify transactions and test with small amounts first. Cross-chain bridges involve risks including potential loss of funds. Use at your own risk. # MyOKXSetup
