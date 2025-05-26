export interface OKXHeaders {
  'OK-ACCESS-KEY': string;
  'OK-ACCESS-SIGN': string;
  'OK-ACCESS-TIMESTAMP': string;
  'OK-ACCESS-PASSPHRASE': string;
  'Content-Type': string;
  [key: string]: string;
}

export interface CrossChainQuoteParams {
  fromChainIndex: string;
  toChainIndex: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  slippage: string;
  userWalletAddress: string;
  sort?: number;
  feePercent?: string;
  referrerAddress?: string;
  [key: string]: string | number | undefined;
}

export interface CrossChainBuildParams extends CrossChainQuoteParams {
  fromChainId: string;
  toChainId: string;
}

export interface BridgeRouter {
  bridgeId: number;
  bridgeName: string;
  crossChainFee: string;
  otherNativeFee: string;
  crossChainFeeTokenAddress: string;
}

export interface TransactionData {
  data: string;
  from: string;
  to: string;
  value: string;
  gasLimit: string;
  gasPrice: string;
  maxPriorityFeePerGas?: string;
}

export interface CrossChainQuoteResponse {
  code: string;
  msg: string;
  data: Array<{
    fromTokenAmount: string;
    toTokenAmount?: string;
    minimumReceive?: string;
    router?: BridgeRouter;
    estimateTime?: string;
    routerList?: Array<{
      toTokenAmount: string;
      minimumReceived: string;
      estimateTime: string;
      router: BridgeRouter;
    }>;
  }>;
}

export interface CrossChainBuildResponse {
  code: string;
  msg: string;
  data: Array<{
    fromTokenAmount: string;
    toTokenAmount: string;
    minimumReceive: string;
    router: BridgeRouter;
    tx: TransactionData;
  }>;
}

export interface CrossChainStatusParams {
  chainId: string;
  txHash: string;
  [key: string]: string | number | undefined;
}

export interface CrossChainStatusResponse {
  code: string;
  msg: string;
  data: Array<{
    chainId: string;
    txHash: string;
    status: string;
    crossChainResult?: {
      toChainTxHash: string;
      toChainId: string;
      status: string;
    };
  }>;
}

export interface BridgeEstimate {
  fromAmount: string;
  toAmount: string;
  minimumReceive: string;
  bridgeName: string;
  estimatedTime: string;
  fees: {
    crossChainFee: string;
    otherNativeFee: string;
    gasFee: string;
    totalFeeUSD: string;
  };
  priceImpact: string;
}

export interface BridgeTransaction {
  txHash: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
} 