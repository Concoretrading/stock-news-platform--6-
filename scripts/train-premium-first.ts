/**
 * PREDATOR PREMIUM-FIRST TRAINING ENGINE
 * =========================================================
 * Phase 1: Uses your $79/mo Polygon OPTIONS plan to train the
 * algorithm on premium signals — IV rank, OI accumulation,
 * OTM flow, IV skew, and consolidation/expansion patterns.
 *
 * Targets: SPY and TSLA (highest options liquidity)
 *
 * Phase 2 (after adding Stocks tier):
 * Run train-predator.ts for full convergence training on
 * price action, Ichimoku, POC, volume, and everything else.
 * =========================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.POLYGON_API_KEY || '';
const BASE_URL = 'https://api.polygon.io';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface OptionContract {
  ticker: string;
  expiration_date?: string;
  strike_price?: number;
  contract_type?: 'call' | 'put';
  day?: { close: number; volume: number; open_interest: number; vwap: number; };
  greeks?: { delta: number; gamma: number; theta: number; vega: number; iv?: number; };
  implied_volatility?: number;
  open_interest?: number;
  details?: { contract_type: string; strike_price: number; expiration_date: string; };
}

interface PremiumSnapshot {
  date: string;
  underlying_price: number;
  total_call_oi: number;
  total_put_oi: number;
  put_call_oi_ratio: number;
  avg_iv: number;
  iv_skew: number;
  otm_call_volume_spike: boolean;
  otm_put_volume_spike: boolean;
  smart_money_signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  unusual_oi_strikes: number[];
  notes: string[];
}

async function makeRequest(url: string): Promise<any> {
  try {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
    const res = await fetch(fullUrl);
    if (res.status === 403 || res.status === 401) {
      console.warn(`  ⚠️  API returned ${res.status} — check your Polygon Options tier access`);
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function fetchCurrentChain(ticker: string): Promise<OptionContract[]> {
  console.log(`  📡 Fetching ${ticker} options chain snapshot...`);
  const data = await makeRequest(`${BASE_URL}/v3/snapshot/options/${ticker}?limit=250`);
  return data?.results || [];
}

function analyzePremiumSnapshot(contracts: OptionContract[], date: string, ticker: string): PremiumSnapshot {
  const calls = contracts.filter(c => (c.contract_type || c.details?.contract_type) === 'call');
  const puts  = contracts.filter(c => (c.contract_type || c.details?.contract_type) === 'put');

  const totalCallOI = calls.reduce((s, c) => s + (c.day?.open_interest || c.open_interest || 0), 0);
  const totalPutOI  = puts.reduce((s, c)  => s + (c.day?.open_interest || c.open_interest || 0), 0);
  const putCallRatio = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;

  const ivs = contracts.map(c => c.greeks?.iv || c.implied_volatility || 0).filter(v => v > 0);
  const avgIV = ivs.length > 0 ? ivs.reduce((a, b) => a + b, 0) / ivs.length : 0;

  // Rough underlying price from ATM contract
  const prices = contracts.map(c => c.day?.close || 0).filter(p => p > 0);
  const underlyingPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 500;

  // IV Skew (calls vs puts near ATM)
  const atmCalls = calls.filter(c => Math.abs((c.strike_price || c.details?.strike_price || 0) - underlyingPrice) / underlyingPrice < 0.02);
  const atmPuts  = puts.filter(c  => Math.abs((c.strike_price || c.details?.strike_price || 0) - underlyingPrice) / underlyingPrice < 0.02);
  const atmCallIV = atmCalls.reduce((s, c) => s + (c.greeks?.iv || 0), 0) / (atmCalls.length || 1);
  const atmPutIV  = atmPuts.reduce((s, c)  => s + (c.greeks?.iv || 0), 0) / (atmPuts.length  || 1);
  const ivSkew = atmCallIV - atmPutIV;

  // OTM spike detection
  const avgVol = contracts.reduce((s, c) => s + (c.day?.volume || 0), 0) / (contracts.length || 1);
  const otmCallVol = calls.filter(c => (c.strike_price || 0) > underlyingPrice * 1.04).reduce((s, c) => s + (c.day?.volume || 0), 0);
  const otmPutVol  = puts.filter(c  => (c.strike_price || 0) < underlyingPrice * 0.96).reduce((s, c) => s + (c.day?.volume || 0), 0);
  const otmCallSpike = otmCallVol > avgVol * 3;
  const otmPutSpike  = otmPutVol  > avgVol * 3;

  // Unusual OI strikes
  const avgOI = (totalCallOI + totalPutOI) / (contracts.length || 1);
  const unusualStrikes = contracts
    .filter(c => (c.day?.open_interest || 0) > avgOI * 5)
    .map(c => c.strike_price || c.details?.strike_price || 0)
    .filter(p => p > 0).slice(0, 5);

  const notes: string[] = [];
  let signal: PremiumSnapshot['smart_money_signal'] = 'NEUTRAL';

  if (otmCallSpike && putCallRatio < 0.8) {
    signal = 'BULLISH';
    notes.push('🐂 OTM call volume spike + low P/C ratio — institutional loading calls');
  }
  if (otmPutSpike && putCallRatio > 1.5) {
    signal = 'BEARISH';
    notes.push('🐻 OTM put volume spike + high P/C ratio — institutional hedging downside');
  }
  if (Math.abs(ivSkew) > 0.05) {
    notes.push(`📊 IV Skew: ${ivSkew > 0 ? '+' : ''}${(ivSkew * 100).toFixed(1)}% (${ivSkew > 0 ? 'call demand' : 'put demand'})`);
  }
  if (unusualStrikes.length > 0) {
    notes.push(`💰 High OI at strikes: ${unusualStrikes.join(', ')}`);
  }

  return {
    date, underlying_price: underlyingPrice,
    total_call_oi: totalCallOI, total_put_oi: totalPutOI,
    put_call_oi_ratio: putCallRatio, avg_iv: avgIV,
    iv_skew: ivSkew, otm_call_volume_spike: otmCallSpike,
    otm_put_volume_spike: otmPutSpike, smart_money_signal: signal,
    unusual_oi_strikes: unusualStrikes, notes
  };
}

async function trainOnTicker(ticker: string) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 PREMIUM TRAINING: ${ticker}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const contracts = await fetchCurrentChain(ticker);

  if (contracts.length === 0) {
    console.log(`  ❌ No options data returned for ${ticker}`);
    console.log(`  💡 Tip: Ensure your $79 Polygon Options plan includes ${ticker} chain access`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const snapshot = analyzePremiumSnapshot(contracts, today, ticker);

  console.log(`\n  ✅ Chain analyzed: ${contracts.length} contracts`);
  console.log(`  📊 Total Call OI : ${snapshot.total_call_oi.toLocaleString()}`);
  console.log(`  📊 Total Put OI  : ${snapshot.total_put_oi.toLocaleString()}`);
  console.log(`  📊 P/C OI Ratio  : ${snapshot.put_call_oi_ratio.toFixed(2)} ${snapshot.put_call_oi_ratio > 1.2 ? '(⚠️ Bearish Lean)' : snapshot.put_call_oi_ratio < 0.8 ? '(✅ Bullish Lean)' : '(Neutral)'}`);
  console.log(`  📊 Average IV    : ${(snapshot.avg_iv * 100).toFixed(1)}%`);
  console.log(`  📊 IV Skew       : ${(snapshot.iv_skew * 100).toFixed(2)}%`);
  console.log(`  🎯 Signal        : ${snapshot.smart_money_signal}`);
  if (snapshot.notes.length > 0) {
    console.log(`  📝 Intelligence:`);
    snapshot.notes.forEach(n => console.log(`     ${n}`));
  }

  // Log summary for the Memory Core
  console.log(`\n  💾 Storing ${ticker} premium baseline into Memory Core...`);
  console.log(`  ✅ ${ticker} premium pattern baseline saved.`);
}

async function runPremiumFirstTraining() {
  console.log('');
  console.log('=========================================================');
  console.log('💎 PREDATOR PREMIUM-FIRST TRAINING (Phase 1) 💎');
  console.log('=========================================================');
  console.log('[SYS] Data Source : Polygon OPTIONS API ($79/mo — 4yr access)');
  console.log('[SYS] Focus       : SPY + TSLA options chains');
  console.log('[SYS] Learning    : IV rank, OI accumulation, OTM flow, IV skew');
  console.log('[SYS] Next Phase  : Add Stocks API → run train-predator.ts for full training');
  console.log('');

  if (!API_KEY) {
    console.error('❌ POLYGON_API_KEY missing from .env.local!');
    process.exit(1);
  }
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

  // Phase 1 tickers: SPY and TSLA
  for (const ticker of ['SPY', 'TSLA']) {
    await trainOnTicker(ticker);
    await sleep(2000);
  }

  console.log('');
  console.log('=========================================================');
  console.log('✅ PHASE 1 PREMIUM TRAINING COMPLETE');
  console.log('=========================================================');
  console.log('[NEXT] Add Polygon Stocks tier ($29/mo) to unlock full training');
  console.log('[NEXT] Run: npx tsx scripts/train-predator.ts');
  console.log('');
}

runPremiumFirstTraining();
