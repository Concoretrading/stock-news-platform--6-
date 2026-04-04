/**
 * PREDATOR CONVERGENCE LEARNING ENGINE (1-Minute Resolution)
 * =========================================================
 * Designed to find the exact inflection points where:
 * 1. Base Stock (SPY) enters consolidation.
 * 2. 1-minute Option Premium (0DTE/Weekly, 1 ATR Strikes) compresses.
 * 3. Base Stock breaks out with momentum and volume.
 * 4. We record the EXACT signature of how the Option Premium exploded.
 * =========================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as fs from 'fs';

const API_KEY  = process.env.POLYGON_API_KEY || '';
const BASE_URL = 'https://api.polygon.io';

const sleep  = (ms: number)  => new Promise(r => setTimeout(r, ms));
const fmtDate = (d: Date)    => d.toISOString().split('T')[0];

interface Bar {
  t: number; o: number; h: number; l: number; c: number; v: number; vw?: number;
}

interface PatternRecording {
  id: string;
  ticker: string;
  date: string;
  time_of_breakout: string;
  setup_type: 'bullish_breakout' | 'bearish_breakdown';
  stock_consolidation_duration_mins: number;
  stock_breakout_volume_spike_ratio: number;
  atm_strike: number;
  call_1atr_strike: number;
  put_1atr_strike: number;
  call_premium_change_pct: number;
  put_premium_change_pct: number;
  confidence: number;
}

// ── Rate limiter (Polygon Options Tier) ──
let lastRequest = 0;
async function apiRequest(url: string, isOptions = true): Promise<any> {
  const now     = Date.now();
  const elapsed = now - lastRequest;
  const rateLimit = isOptions ? 13000 : 200; // Options: 5 req/min, Stocks: 5 req/min (or unlimited if user has Stocks tier)
  
  // Since user might only have Options tier, we must be careful with rate limits anywhere.
  // Actually, Polygon Options Advanced includes stock data as well, but we will use the safe limit.
  if (elapsed < rateLimit) await sleep(rateLimit - elapsed);
  lastRequest = Date.now();

  try {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
    const res     = await fetch(fullUrl);
    
    if (res.status === 429) {
      console.log('  ⏳ Rate limited — waiting 60s...');
      await sleep(61000);
      return apiRequest(url, isOptions);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function calculateATR(bars: Bar[], period: number = 14): number[] {
  const atr: number[] = [];
  let trSum = 0;
  for (let i = 0; i < bars.length; i++) {
    const high = bars[i].h;
    const low = bars[i].l;
    const prevClose = i > 0 ? bars[i-1].c : bars[i].o;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    
    if (i < period) {
      trSum += tr;
      atr.push(trSum / (i + 1));
    } else {
      const currentAtr = ((atr[i-1] * (period - 1)) + tr) / period;
      atr.push(currentAtr);
    }
  }
  return atr;
}

function buildOptionTicker(underlying: string, expiry: string, type: 'C' | 'P', strike: number): string {
  const dateStr    = expiry.replace(/-/g, '').slice(2);
  const strikeStr  = Math.round(strike * 1000).toString().padStart(8, '0');
  const und        = underlying === 'SPX' ? 'SPXW' : underlying;
  return `O:${und}${dateStr}${type}${strikeStr}`;
}

async function getDailyExpirations(ticker: string, targetDate: string): Promise<string[]> {
  const url = `${BASE_URL}/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date.gte=${targetDate}&limit=10&sort=expiration_date&order=asc`;
  const data = await apiRequest(url, true);
  if (!data || !data.results) return [];
  const expDates = new Set<string>();
  data.results.forEach((r: any) => expDates.add(r.expiration_date));
  return Array.from(expDates);
}

async function get1MinBars(ticker: string, date: string, isOption = false): Promise<Bar[]> {
  const url = `${BASE_URL}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/minute/${date}/${date}`;
  const data = await apiRequest(url, isOption);
  return data?.results || [];
}

async function analyzeIntradayConvergence(ticker: string, date: string): Promise<PatternRecording[]> {
  const patterns: PatternRecording[] = [];
  console.log(`\n📅 Analyzing convergence for ${ticker} on ${date}...`);
  
  // 1. Get Stock 1-min data
  const stockBars = await get1MinBars(ticker, date, false);
  if (!stockBars || stockBars.length < 30) {
    console.log(`  ⚠️ Insufficient stock data for ${date}`);
    return [];
  }
  console.log(`  ✅ Retrieved ${stockBars.length} 1-minute stock bars.`);

  // 2. Find nearest expiration (0DTE or Weekly)
  const availableExps = await getDailyExpirations(ticker, date);
  if (availableExps.length === 0) {
    console.log(`  ⚠️ No options expirations found near ${date}`);
    return [];
  }
  const expiry = availableExps[0];
  console.log(`  🎯 Nearest Expiration Selected: ${expiry} (${expiry === date ? '0DTE' : 'Weekly'})`);

  // 3. Process the day structurally (using simulated live playback)
  const atrArray = calculateATR(stockBars, 14);
  
  // We'll look for the first moment of consolidation followed by a volume spike
  let inConsolidation = false;
  let consolidationStartIdx = 0;
  
  for (let i = 20; i < stockBars.length - 15; i++) {
    const currentBar = stockBars[i];
    const avgVol = stockBars.slice(i-10, i).reduce((s, b) => s + b.v, 0) / 10;
    const volRatio = currentBar.v / Math.max(1, avgVol);
    const range = currentBar.h - currentBar.l;
    const currentATR = atrArray[i];

    // Detect tight consolidation (range < 0.5 * ATR and very low volume)
    if (range < currentATR * 0.5 && volRatio < 0.8) {
      if (!inConsolidation) {
        inConsolidation = true;
        consolidationStartIdx = i;
      }
    } 
    // Detect Breakout: High volume and large range expanding OUT of consolidation
    else if (inConsolidation && volRatio > 2.5 && range > currentATR * 1.5) {
      const consolidationDuration = i - consolidationStartIdx;
      if (consolidationDuration >= 5) { // At least 5 minutes of tight chop
        
        const isBullish = currentBar.c > stockBars[i-1].h;
        console.log(`\n  ⚡ BREAKOUT DETECTED at ${new Date(currentBar.t).toLocaleTimeString()}!`);
        console.log(`     • Consolidation lasted ${consolidationDuration} minutes.`);
        console.log(`     • Volume spike: ${volRatio.toFixed(1)}x normal.`);
        console.log(`     • Direction: ${isBullish ? 'BULLISH' : 'BEARISH'}`);
        console.log(`     • Current Stock Price: $${currentBar.c.toFixed(2)}`);
        console.log(`     • Current Intraday 1-Min ATR: $${currentATR.toFixed(2)}`);

        // Lock onto the strikes
        const atmStrike = Math.round(currentBar.c);
        const callStrike1Atr = Math.ceil(currentBar.c + currentATR);
        const putStrike1Atr = Math.floor(currentBar.c - currentATR);
        
        console.log(`  🎯 Tracking 1 ATR Option Strikes: Call $${callStrike1Atr} | Put $${putStrike1Atr}`);
        
        const callTicker = buildOptionTicker(ticker, expiry, 'C', callStrike1Atr);
        const putTicker = buildOptionTicker(ticker, expiry, 'P', putStrike1Atr);

        // Fetch exactly the premium change over the next 10 minutes from breakout
        const callBars = await get1MinBars(callTicker, date, true);
        const putBars = await get1MinBars(putTicker, date, true);

        // Find the option prices right before breakout vs peaks/troughs right after
        const callBefore = callBars.find(b => b.t <= stockBars[i-1].t)?.c || 0;
        const callAfterHigh = callBars.filter(b => b.t > currentBar.t && b.t <= currentBar.t + (10 * 60000)).map(b => b.h).sort((a,b)=>b-a)[0] || 0;
        const callAfterLow = callBars.filter(b => b.t > currentBar.t && b.t <= currentBar.t + (10 * 60000)).map(b => b.l).sort((a,b)=>a-b)[0] || 0;

        const putBefore = putBars.find(b => b.t <= stockBars[i-1].t)?.c || 0;
        const putAfterHigh = putBars.filter(b => b.t > currentBar.t && b.t <= currentBar.t + (10 * 60000)).map(b => b.h).sort((a,b)=>b-a)[0] || 0;
        const putAfterLow = putBars.filter(b => b.t > currentBar.t && b.t <= currentBar.t + (10 * 60000)).map(b => b.l).sort((a,b)=>a-b)[0] || 0;

        if (callBefore > 0 && putBefore > 0) {
          const callPctHigh = ((callAfterHigh - callBefore) / callBefore) * 100;
          const callPctLow = ((callAfterLow - callBefore) / callBefore) * 100;
          
          const putPctHigh = ((putAfterHigh - putBefore) / putBefore) * 100;
          const putPctLow = ((putAfterLow - putBefore) / putBefore) * 100;

          // For bullish breakout, call shoots up, put gets crushed. 
          const callChange = isBullish ? callPctHigh : callPctLow;
          const putChange = isBullish ? putPctLow : putPctHigh;

          console.log(`  💥 1 ATR Options Reaction (Next 10 mins):`);
          console.log(`     • Call $${callStrike1Atr}: $${callBefore.toFixed(2)} → Peak/Trough = ${(callChange > 0 ? '+' : '')}${callChange.toFixed(1)}%`);
          console.log(`     • Put $${putStrike1Atr}:  $${putBefore.toFixed(2)} → Peak/Trough = ${(putChange > 0 ? '+' : '')}${putChange.toFixed(1)}%`);

          patterns.push({
            id: `conv-${date}-${currentBar.t}`,
            ticker,
            date,
            time_of_breakout: new Date(currentBar.t).toLocaleTimeString(),
            setup_type: isBullish ? 'bullish_breakout' : 'bearish_breakdown',
            stock_consolidation_duration_mins: consolidationDuration,
            stock_breakout_volume_spike_ratio: volRatio,
            atm_strike: atmStrike,
            call_1atr_strike: callStrike1Atr,
            put_1atr_strike: putStrike1Atr,
            call_premium_change_pct: callChange,
            put_premium_change_pct: putChange,
            confidence: Math.min(95, 50 + (volRatio * 10) + (consolidationDuration * 2))
          });
        } else {
          console.log(`  ⚠️ Insufficient options quoting at that exact minute.`);
        }
      }
      
      // Reset consolidation scanner
      inConsolidation = false;
      // Skip ahead 15 mins to avoid detecting the exact same breakout continuously
      i += 15;
    }
  }

  return patterns;
}

async function run() {
  console.log('='.repeat(60));
  console.log('🧠 PREDATOR CONVERGENCE ENGINE (1-Minute Resoluton)');
  console.log('='.repeat(60));
  if (!API_KEY) { console.error('❌ POLYGON_API_KEY missing!'); process.exit(1); }

  // Test run on a few recent specific high-volatility days for SPY
  // Note: Polygon requires YYYY-MM-DD
  const testDays = ['2023-10-27', '2023-11-01']; // Fed day / Major bottom example days or recent days available in plan

  // Generate 2 business days dynamically
  const d1 = new Date();
  d1.setDate(d1.getDate() - 5);
  while(d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() - 1);
  const date2 = fmtDate(d1);

  d1.setDate(d1.getDate() - 1);
  while(d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() - 1);
  const date1 = fmtDate(d1);

  const dynamicTestDays = [date1, date2];
  console.log(`🔍 Running 2-Day Verification Test on SPY: ${dynamicTestDays.join(', ')}`);

  const allPatterns: PatternRecording[] = [];

  for (const date of dynamicTestDays) {
    try {
      const dailyPatterns = await analyzeIntradayConvergence('SPY', date);
      allPatterns.push(...dailyPatterns);
    } catch (e) {
      console.error(`Error processing ${date}:`, e);
    }
  }

  console.log('\n=========================================================');
  console.log('✅ 1-MINUTE CONVERGENCE LEARNING COMPLETE');
  console.log('=========================================================');
  console.log(`📊 Distilled ${allPatterns.length} micro-structure breakout signatures.`);
  
  if (allPatterns.length > 0) {
    fs.writeFileSync('predator-knowledge-1min.json', JSON.stringify({
      generated_at: new Date().toISOString(),
      tested_days: dynamicTestDays,
      patterns_found: allPatterns.length,
      patterns: allPatterns
    }, null, 2));
    console.log('💾 Intelligence explicitly saved to: predator-knowledge-1min.json');
  } else {
    console.log('⚠️ No perfect convergence setups found on those specific days. Try other highly volatile days or expand the constraints slightly.');
  }
}

run();
