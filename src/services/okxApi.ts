import axios, { AxiosResponse } from 'axios';
import { generateOKXHeaders, buildQueryString } from '../utils/auth';
import { OKX_CONFIG } from '../config/constants';
import {
  CrossChainQuoteParams,
  CrossChainBuildParams,
  CrossChainQuoteResponse,
  CrossChainBuildResponse,
  CrossChainStatusParams,
  CrossChainStatusResponse,
  BridgeEstimate
} from '../types';

export class OKXApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = OKX_CONFIG.BASE_URL;
  }

  async getCrossChainQuote(params: CrossChainQuoteParams): Promise<CrossChainQuoteResponse> {
    const endpoint = OKX_CONFIG.ENDPOINTS.CROSS_CHAIN_QUOTE;
    const queryString = buildQueryString(params);
    const headers = generateOKXHeaders('GET', endpoint, queryString);

    try {
      const response: AxiosResponse<CrossChainQuoteResponse> = await axios.get(
        `${this.baseUrl}${endpoint}${queryString}`,
        { headers }
      );

      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching cross-chain quote:', error);
      throw error;
    }
  }

  async buildCrossChainTransaction(params: CrossChainBuildParams): Promise<CrossChainBuildResponse> {
    const endpoint = OKX_CONFIG.ENDPOINTS.CROSS_CHAIN_BUILD;
    const queryString = buildQueryString(params);
    const headers = generateOKXHeaders('GET', endpoint, queryString);

    try {
      const response: AxiosResponse<CrossChainBuildResponse> = await axios.get(
        `${this.baseUrl}${endpoint}${queryString}`,
        { headers }
      );

      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error building cross-chain transaction:', error);
      throw error;
    }
  }

  async getTransactionStatus(params: CrossChainStatusParams): Promise<CrossChainStatusResponse> {
    const endpoint = OKX_CONFIG.ENDPOINTS.CROSS_CHAIN_STATUS;
    const queryString = buildQueryString(params);
    const headers = generateOKXHeaders('GET', endpoint, queryString);

    try {
      const response: AxiosResponse<CrossChainStatusResponse> = await axios.get(
        `${this.baseUrl}${endpoint}${queryString}`,
        { headers }
      );

      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      throw error;
    }
  }

  async getSupportedChains(): Promise<any> {
    const endpoint = OKX_CONFIG.ENDPOINTS.SUPPORTED_CHAINS;
    const headers = generateOKXHeaders('GET', endpoint);

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, { headers });
      
      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      throw error;
    }
  }

  async getSupportedTokens(chainId: string): Promise<any> {
    const endpoint = OKX_CONFIG.ENDPOINTS.SUPPORTED_TOKENS;
    const queryString = buildQueryString({ chainId });
    const headers = generateOKXHeaders('GET', endpoint, queryString);

    try {
      const response = await axios.get(
        `${this.baseUrl}${endpoint}${queryString}`,
        { headers }
      );

      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      throw error;
    }
  }

  async getSupportedBridges(): Promise<any> {
    const endpoint = OKX_CONFIG.ENDPOINTS.SUPPORTED_BRIDGES;
    const headers = generateOKXHeaders('GET', endpoint);

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, { headers });

      if (response.data.code !== '0') {
        throw new Error(`OKX API Error: ${response.data.msg}`);
      }

      console.log('🌉 Available bridge providers:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error fetching supported bridges:', error);
      throw error;
    }
  }

  async estimateBridge(
    fromChainIndex: string,
    toChainIndex: string,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    userWalletAddress: string,
    slippage: string = '0.01'
  ): Promise<BridgeEstimate> {
    console.log('🔍 Attempting bridge estimate with parameters:');
    console.log(`From Chain: ${fromChainIndex} (Base)`);
    console.log(`To Chain: ${toChainIndex} (Arbitrum)`);
    console.log(`From Token: ${fromTokenAddress}`);
    console.log(`To Token: ${toTokenAddress}`);
    console.log(`Amount: ${amount} (raw)`);
    console.log(`User Wallet: ${userWalletAddress}`);
    console.log(`Slippage: ${slippage}`);

    const quoteParams: CrossChainQuoteParams = {
      fromChainIndex,
      toChainIndex,
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage,
      userWalletAddress,
      sort: 1 // Optimal route
    };

    try {
      const quote = await this.getCrossChainQuote(quoteParams);
      
      console.log('📊 OKX API Response:', JSON.stringify(quote, null, 2));
      
      if (!quote.data || quote.data.length === 0) {
        throw new Error('No bridge routes available. This could mean:\n1. The token pair is not supported\n2. The amount is too small\n3. No bridge supports this route currently');
      }

      const quoteData = quote.data[0];
      
      // Handle both old and new response formats
      let bestRoute;
      if (quoteData.routerList && quoteData.routerList.length > 0) {
        // New format with routerList
        bestRoute = quoteData.routerList[0];
      } else if (quoteData.router) {
        // Old format with direct router
        bestRoute = {
          toTokenAmount: quoteData.toTokenAmount || '0',
          minimumReceived: quoteData.minimumReceive || '0',
          estimateTime: quoteData.estimateTime || 'Unknown',
          router: quoteData.router
        };
      } else {
        throw new Error('Invalid response format from OKX API');
      }
      
      return {
        fromAmount: quoteData.fromTokenAmount,
        toAmount: bestRoute.toTokenAmount,
        minimumReceive: bestRoute.minimumReceived,
        bridgeName: bestRoute.router.bridgeName,
        estimatedTime: `${bestRoute.estimateTime} seconds`,
        fees: {
          crossChainFee: bestRoute.router.crossChainFee,
          otherNativeFee: bestRoute.router.otherNativeFee,
          gasFee: '0', // Will be calculated separately
          totalFeeUSD: '0' // Will be calculated separately
        },
        priceImpact: '0' // Will be calculated based on amounts
      };
    } catch (error: any) {
      console.error('❌ Bridge estimation failed:', error?.message || error);
      throw error;
    }
  }
} 