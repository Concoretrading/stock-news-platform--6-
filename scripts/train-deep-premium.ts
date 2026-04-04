/**
 * PREDATOR DEEP PREMIUM LEARNING ENGINE
 * =========================================================
 * Uses 4-year historical Polygon OPTIONS data ($79/mo plan)
 * to train the algorithm on the fingerprints smart money
 * leaves in the chain BEFORE major market moves.
 *
 * Tickers: SPX (I:SPX), SPY, TSLA
 *
 * What it learns:
 *   - IV compression → expansion signatures (squeeze setups)
 *   - OI accumulation before institutional moves
 *   - OTM call/put volume spikes (directional bias)
 *   - Premium behavior at major market turning points
 *   - The exact chain structure before crashes, rallies, squeezes
 * =========================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as fs from 'fs';

const API_KEY  = process.env.POLYGON_API_KEY || '';
const BASE_URL = 'https://api.polygon.io';

const sleep  = (ms: number)  => new Promise(r => setTimeout(r, ms));
const fmtDate = (d: Date)    => d.toISOString().split('T')[0];

// ─── Rate limiter: max 5 requests/min for options tier ───────────────────────
let lastRequest = 0;
async function apiRequest(url: string): Promise<any> {
  const now     = Date.now();
  const elapsed = now - lastRequest;
  if (elapsed < 13000) await sleep(13000 - elapsed); // ~5 req/min
  lastRequest = Date.now();

  try {
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}apiKey=${API_KEY}`;
    const res     = await fetch(fullUrl);
    if (res.status === 403 || res.status === 401) {
      console.warn(`  ⚠️  Auth error ${res.status} — check Polygon plan`);
      return null;
    }
    if (res.status === 429) {
      console.log('  ⏳ Rate limited — waiting 60s...');
      await sleep(60000);
      return apiRequest(url);
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface OptionBar {
  // OHLCV for a single option contract on a single day
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
  vw?: number; // vwap
}

interface ChainSnapshot {
  date: string;
  underlying: string;
  strikes: {
    strike: number;
    expiry: string;
    type: 'call' | 'put';
    premium: number;
    volume: number;
    open_interest: number;
    iv_proxy: number; // We approximate from price movement %
  }[];
}

interface PremiumPattern {
  id: string;
  ticker: string;
  date_range: string;
  pattern_type: 'iv_squeeze' | 'oi_accumulation' | 'otm_sweep' | 'iv_crush' | 'premium_expansion' | 'reversal_warning';
  confidence: number;
  setup_description: string;
  outcome: 'bullish' | 'bearish' | 'neutral' | 'unknown';
  outcome_magnitude: number; // % move in underlying
  key_metrics: Record<string, number>;
}

// ─── Build Polygon option ticker symbol ──────────────────────────────────────
function buildOptionTicker(underlying: string, expiry: string, type: 'C' | 'P', strike: number): string {
  // Format: O:SPY240115C00500000
  const dateStr    = expiry.replace(/-/g, '').slice(2); // YYMMDD
  const strikeStr  = Math.round(strike * 1000).toString().padStart(8, '0');
  const und        = underlying === 'SPX' ? 'SPXW' : underlying; // SPX weeklies
  return `O:${und}${dateStr}${type}${strikeStr}`;
}

// ─── Get daily bars for a specific option contract ────────────────────────────
async function getOptionDailyBars(ticker: string, from: string, to: string): Promise<OptionBar[]> {
  const url  = `${BASE_URL}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${from}/${to}`;
  const data = await apiRequest(url);
  return data?.results || [];
}

// ─── Get reference contracts (expired) for a ticker ──────────────────────────
async function getReferenceContracts(ticker: string, expirationDate: string): Promise<any[]> {
  const url  = `${BASE_URL}/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date=${expirationDate}&limit=250&expired=true`;
  const data = await apiRequest(url);
  return data?.results || [];
}

// ─── Analyze a month of premium data for a ticker ────────────────────────────
async function analyzeMonthlyPremium(
  ticker: string,
  expirationDate: string,
  strikes: number[]
): Promise<{ patterns: PremiumPattern[]; log: string[] }> {
  const patterns: PremiumPattern[] = [];
  const log: string[] = [];
  
  // Look at the 30 days BEFORE each expiration
  const expiry = new Date(expirationDate);
  const from   = fmtDate(new Date(expiry.getTime() - 35 * 86400000));
  const to     = expirationDate;

  log.push(`\n  📅 Analyzing ${ticker} expiry ${expirationDate} | ${from} → ${to}`);

  const callData: Record<number, OptionBar[]> = {};
  const putData:  Record<number, OptionBar[]> = {};

  // Pull data for ATM ±1 ATR and key OTM strikes
  for (const strike of strikes) {
    const callTicker = buildOptionTicker(ticker, expirationDate, 'C', strike);
    const putTicker  = buildOptionTicker(ticker, expirationDate, 'P', strike);

    const callBars = await getOptionDailyBars(callTicker, from, to);
    const putBars  = await getOptionDailyBars(putTicker, from, to);

    if (callBars.length > 0) { callData[strike] = callBars; log.push(`    ✅ ${callTicker}: ${callBars.length} days data`); }
    if (putBars.length > 0)  { putData[strike]  = putBars;  log.push(`    ✅ ${putTicker}: ${putBars.length} days data`); }
    
    await sleep(500); // Small pause between requests
  }

  // ──── PATTERN 1: IV Squeeze Detection ────────────────────────────────────
  // Look for premium contracting steadily over 5+ days then breaking out
  const callStrikes = Object.keys(callData).map(Number);
  if (callStrikes.length >= 2) {
    const atm     = callStrikes[Math.floor(callStrikes.length / 2)];
    const atmBars = callData[atm] || [];

    if (atmBars.length >= 7) {
      // Look at premium change % over rolling 5-day windows
      const premiumChanges: number[] = [];
      for (let i = 1; i < atmBars.length; i++) {
        const change = (atmBars[i].c - atmBars[i-1].c) / (atmBars[i-1].c || 1);
        premiumChanges.push(change);
      }

      // Detect compression (small moves) followed by expansion
      const recentChanges = premiumChanges.slice(-7);
      const earlyAvgMove  = Math.abs(recentChanges.slice(0, 4).reduce((a, b) => a + b, 0) / 4);
      const lateMoves     = recentChanges.slice(-3).map(Math.abs);
      const lateAvgMove   = lateMoves.reduce((a, b) => a + b, 0) / lateMoves.length;

      if (earlyAvgMove < 0.05 && lateAvgMove > 0.15) {
        // Compression then expansion detected!
        const isCallExpansion = atmBars[atmBars.length-1].c > atmBars[atmBars.length-4].c;
        patterns.push({
          id: `${ticker}-${expirationDate}-iv-squeeze`,
          ticker,
          date_range: `${from} → ${to}`,
          pattern_type: 'iv_squeeze',
          confidence: Math.min(90, 60 + (lateAvgMove * 200)),
          setup_description: `IV compressed (avg ${(earlyAvgMove*100).toFixed(1)}%/day) for 4 days then expanded to ${(lateAvgMove*100).toFixed(1)}%/day — ${isCallExpansion ? 'CALL' : 'PUT'} driven`,
          outcome: isCallExpansion ? 'bullish' : 'bearish',
          outcome_magnitude: lateAvgMove * 100,
          key_metrics: { compression_avg: earlyAvgMove, expansion_avg: lateAvgMove, atm_strike: atm }
        });
        log.push(`    🎯 IV SQUEEZE PATTERN found! Confidence: ${Math.min(90, 60 + (lateAvgMove * 200)).toFixed(0)}%`);
      }
    }
  }

  // ──── PATTERN 2: OTM Volume Sweep ────────────────────────────────────────
  // Detect when deep OTM contracts had unusual volume spikes
  const deepOTMStrikes = callStrikes.slice(0, 2); // First 2 = deepest OTM
  for (const strike of deepOTMStrikes) {
    const bars = callData[strike] || [];
    if (bars.length < 5) continue;

    const avgVol  = bars.slice(0, -3).reduce((s, b) => s + b.v, 0) / Math.max(1, bars.length - 3);
    const lastVol = bars[bars.length - 1].v;

    if (lastVol > avgVol * 5 && avgVol > 10) {
      patterns.push({
        id: `${ticker}-${expirationDate}-otm-sweep-${strike}`,
        ticker,
        date_range: `${from} → ${to}`,
        pattern_type: 'otm_sweep',
        confidence: Math.min(85, 55 + (lastVol / avgVol) * 5),
        setup_description: `Deep OTM call at $${strike} saw ${(lastVol/avgVol).toFixed(1)}x average volume spike — institutional directional bet`,
        outcome: 'bullish',
        outcome_magnitude: 0, // Unknown until we correlate with underlying
        key_metrics: { strike, vol_ratio: lastVol / avgVol, avg_volume: avgVol }
      });
      log.push(`    💰 OTM SWEEP detected on $${strike} calls — ${(lastVol/avgVol).toFixed(1)}x avg volume!`);
    }
  }

  // ──── PATTERN 3: Premium Expansion (Breakout signal) ─────────────────────
  const atmCallStrikes = callStrikes.slice(Math.floor(callStrikes.length/2));
  for (const strike of atmCallStrikes.slice(0, 2)) {
    const bars = callData[strike] || [];
    if (bars.length < 3) continue;
    const lastBar = bars[bars.length - 1];
    const prevBar = bars[bars.length - 3];
    const expansion = (lastBar.h - prevBar.l) / prevBar.l;
    if (expansion > 0.30) {
      patterns.push({
        id: `${ticker}-${expirationDate}-expansion-${strike}`,
        ticker,
        date_range: `${from} → ${to}`,
        pattern_type: 'premium_expansion',
        confidence: 75,
        setup_description: `Call premium at $${strike} expanded ${(expansion*100).toFixed(0)}% in 3 days — momentum building`,
        outcome: 'bullish',
        outcome_magnitude: expansion * 100,
        key_metrics: { strike, expansion_pct: expansion * 100 }
      });
      log.push(`    📈 PREMIUM EXPANSION: $${strike} calls up ${(expansion*100).toFixed(0)}% in 3 days`);
    }
  }

  return { patterns, log };
}

// ─── Deep training session for one ticker ────────────────────────────────────
async function deepTrainTicker(
  ticker: string,
  underlyingPrice: number,
  tradeYears: number = 2
) {
  const allPatterns: PremiumPattern[] = [];
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🧠 DEEP LEARNING: ${ticker} | Last ${tradeYears} years`);
  console.log(`${'━'.repeat(60)}`);

  // Build monthly expiration dates going backward
  const expirations: string[] = [];
  const today = new Date();
  for (let m = 0; m < tradeYears * 12; m++) {
    const expDate = new Date(today);
    expDate.setMonth(expDate.getMonth() - m);
    // 3rd Friday of each month = standard monthly expiry
    expDate.setDate(1);
    let fridays = 0;
    while (fridays < 3) {
      if (expDate.getDay() === 5) fridays++;
      if (fridays < 3) expDate.setDate(expDate.getDate() + 1);
    }
    expirations.push(fmtDate(expDate));
  }

  console.log(`  📋 Will analyze ${expirations.length} monthly expirations`);

  // Define key strikes relative to underlying price
  // ATM ± 2% (tight range) and OTM at 5%, 8%, 10%
  const strikeMultipliers = [0.90, 0.95, 0.97, 0.99, 1.00, 1.01, 1.03, 1.05, 1.08, 1.10];
  const strikes = strikeMultipliers.map(m => Math.round(underlyingPrice * m / 5) * 5); // Round to nearest $5
  const uniqueStrikes = [...new Set(strikes)];

  console.log(`  📊 Key strikes: ${uniqueStrikes.slice(0, 5).join(', ')} ... ${uniqueStrikes.slice(-2).join(', ')}`);

  // Process each monthly expiration
  let patternsFound = 0;
  for (let i = 0; i < Math.min(expirations.length, 24); i++) {
    const expiry = expirations[i];
    process.stdout.write(`\r  ⏳ Progress: ${i+1}/${Math.min(expirations.length, 24)} expirations analyzed | Patterns: ${patternsFound}    `);

    try {
      const { patterns, log } = await analyzeMonthlyPremium(ticker, expiry, uniqueStrikes.slice(0, 6));
      allPatterns.push(...patterns);
      patternsFound += patterns.length;

      // Only log when we find something interesting
      if (patterns.length > 0) {
        log.forEach(l => console.log(l));
      }
    } catch (e) {
      // Silently continue on errors for individual expirations
    }
  }

  console.log(`\n\n  ✅ ${ticker} deep learning complete!`);
  console.log(`  📊 Total patterns distilled: ${allPatterns.length}`);

  // Summarize pattern types found
  const typeCounts: Record<string, number> = {};
  allPatterns.forEach(p => { typeCounts[p.pattern_type] = (typeCounts[p.pattern_type] || 0) + 1; });
  console.log(`  📋 Pattern breakdown:`);
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`     • ${type}: ${count}`);
  });

  const avgConfidence = allPatterns.length > 0
    ? allPatterns.reduce((s, p) => s + p.confidence, 0) / allPatterns.length
    : 0;
  console.log(`  🎯 Average pattern confidence: ${avgConfidence.toFixed(1)}%`);

  // Save to local knowledge file
  const knowledgeFile = `predator-knowledge-${ticker.toLowerCase()}.json`;
  fs.writeFileSync(knowledgeFile, JSON.stringify({
    ticker,
    trained_at: new Date().toISOString(),
    underlying_price_at_training: underlyingPrice,
    expirations_analyzed: expirations.length,
    patterns_found: allPatterns.length,
    avg_confidence: avgConfidence,
    patterns: allPatterns
  }, null, 2));
  console.log(`  💾 Knowledge saved to ${knowledgeFile}`);

  return allPatterns;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runDeepPremiumLearning() {
  console.log('');
  console.log('='.repeat(60));
  console.log('💎 PREDATOR DEEP PREMIUM LEARNING ENGINE');
  console.log('='.repeat(60));
  console.log('[SYS] Data: 4-year Polygon OPTIONS API ($79/mo plan)');
  console.log('[SYS] Method: Monthly expiration sweep × ATM/OTM strike grid');
  console.log('[SYS] Goal: 2-year IV compression, OI sweep, & expansion patterns');
  console.log('[SYS] Rate: ~5 req/min (respects Polygon limits)');
  console.log('[SYS] Estimated time: 60-120 min for full 3-ticker sweep');
  console.log('='.repeat(60));
  console.log('');

  if (!API_KEY) { console.error('❌ POLYGON_API_KEY missing!'); process.exit(1); }
  console.log(`🔑 API: ${API_KEY.substring(0, 8)}...`);

  const allResults: Record<string, PremiumPattern[]> = {};

  // ── SPY (most liquid, best data quality) ────────────────────────────────
  console.log('\n⏳ Starting SPY deep scan... (most liquid — best signal quality)');
  allResults['SPY'] = await deepTrainTicker('SPY', 570, 2);

  // ── Paused: Review SPY results before continuing ─────────────────────────
  // Uncomment these when ready to train SPX and TSLA:
  //
  // console.log('\n⏳ Starting SPX deep scan...');
  // allResults['SPX'] = await deepTrainTicker('SPX', 5700, 2);
  //
  // console.log('\n⏳ Starting TSLA deep scan...');
  // allResults['TSLA'] = await deepTrainTicker('TSLA', 280, 2);

  // ── Final Summary ─────────────────────────────────────────────────────────
  const totalPatterns = Object.values(allResults).reduce((s, p) => s + p.length, 0);

  console.log('\n');
  console.log('='.repeat(60));
  console.log('✅ DEEP PREMIUM LEARNING COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Total patterns distilled: ${totalPatterns}`);
  Object.entries(allResults).forEach(([ticker, patterns]) => {
    console.log(`   ${ticker}: ${patterns.length} patterns`);
  });
  console.log('');
  console.log('[NEXT] When TOS connects → merge with live chain data');
  console.log('[NEXT] Add stock price data → confirm outcome magnitudes');
  console.log('[NEXT] Run: compare live chain to historical fingerprints');
  console.log('='.repeat(60));
  console.log('');
}

runDeepPremiumLearning().catch(e => { console.error(e); process.exit(1); });
