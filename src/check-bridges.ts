#!/usr/bin/env node

import { OKXApi } from './services/okxApi';

async function checkBridges() {
  try {
    console.log('🔍 Checking available bridge providers...\n');
    
    const okxApi = new OKXApi();
    
    // Check supported bridges
    await okxApi.getSupportedBridges();
    
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
  }
}

checkBridges(); 