import CryptoJS from 'crypto-js';
import { env } from '../config/environment';
import { OKXHeaders } from '../types';

export function generateOKXHeaders(
  method: string,
  requestPath: string,
  queryString?: string
): OKXHeaders {
  const timestamp = new Date().toISOString();
  const body = '';
  const preHash = timestamp + method.toUpperCase() + requestPath + (queryString || '') + body;
  
  const signature = CryptoJS.enc.Base64.stringify(
    CryptoJS.HmacSHA256(preHash, env.OKX_SECRET_KEY)
  );

  return {
    'OK-ACCESS-KEY': env.OKX_API_KEY,
    'OK-ACCESS-SIGN': signature,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': env.OKX_PASSPHRASE,
    'Content-Type': 'application/json'
  };
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  
  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
} 