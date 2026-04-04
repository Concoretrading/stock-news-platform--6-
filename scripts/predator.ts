/**
 * ============================================================
 * PREDATOR ORCHESTRATOR — THE BACKBONE
 * ============================================================
 * One breathing system. Every pillar wired in sequence.
 *
 * FLOW:
 *  1. MORNING BRIEF    — Past / Present / Future
 *  2. MARKET CONTEXT   — Rotation, Relative Strength
 *  3. SQUEEZE MATRIX   — All timeframes
 *  4. S/R MAP          — Key fight zones for today
 *  5. PREMIUM BASELINE — Fair value, ATR basket
 *  6. SCENARIO BUILD   — Plan A / B / C with strike plan
 *  7. LIVE EXECUTION   — Nemotron reasons → ExpertCouncil votes → Schwab executes
 *  8. FEEDBACK LOOPS   — Every pillar learns from every outcome
 * ============================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as readline from 'readline';

// ── Core Services ──────────────────────────────────────────────
import { nemotronService } from '../lib/services/nemotron-service';
import { ExpertCouncil } from '../lib/services/expert-council-system';
import { MomentumSqueezeExpert } from '../lib/services/momentum-squeeze-expert';
import { ScenarioIntelligenceEngine } from '../lib/services/scenario-intelligence-engine';
import { PreMarketRoutineOrchestrator } from '../lib/services/pre-market-routine-orchestrator';
import { SmartMoneyManipulationEngine } from '../lib/services/smart-money-manipulation-engine';
import { polygonDataProvider } from '../lib/services/polygon-data-provider';
import { SchwabClient } from '../lib/clients/thinkorswim-client';

// ── Constants ──────────────────────────────────────────────────
const WATCHLIST   = ['SPY', 'QQQ', 'SPX'];
const PRIMARY     = 'SPY';
const KNOWLEDGE_FILE = 'predator-knowledge-1min.json';
const DIVERGENCE_FILE = 'predator-knowledge-divergence.json';
const SESSION_LOG_FILE = `predator-session-${new Date().toISOString().split('T')[0]}.json`;

// ── Timeframe Definitions ──────────────────────────────────────
const TIMEFRAMES = [
  { label: 'Daily',   multiplier: 1, timespan: 'day'    },
  { label: '4H',      multiplier: 4, timespan: 'hour'   },
  { label: '1H',      multiplier: 1, timespan: 'hour'   },
  { label: '30M',     multiplier: 30, timespan: 'minute' },
  { label: '15M',     multiplier: 15, timespan: 'minute' },
  { label: '5M',      multiplier: 5,  timespan: 'minute' },
  { label: '1M',      multiplier: 1,  timespan: 'minute' },
];

// ── Utility ────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const hr    = (char = '═', len = 60) => char.repeat(len);
const log   = (msg: string) => {
  const ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true });
  console.log(`[${ts}] ${msg}`);
};

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function prevTradingDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

function today(): string {
  return fmtDate(new Date());
}

// ── ATR Calculation ────────────────────────────────────────────
function calcATR(bars: any[], period = 14): number {
  if (bars.length < period + 1) return 0;
  let trSum = 0;
  let atr = 0;
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i-1].c),
      Math.abs(bars[i].l - bars[i-1].c)
    );
    if (i < period) { trSum += tr; atr = trSum / i; }
    else { atr = ((atr * (period - 1)) + tr) / period; }
  }
  return atr;
}

// ── Squeeze Detector ───────────────────────────────────────────
function detectSqueeze(bars: any[]): { state: string; intensity: number; momentum: string } {
  if (bars.length < 22) return { state: 'UNKNOWN', intensity: 0, momentum: 'NEUTRAL' };
  
  const closes   = bars.slice(-20).map((b: any) => b.c);
  const highs    = bars.slice(-20).map((b: any) => b.h);
  const lows     = bars.slice(-20).map((b: any) => b.l);
  const prevClose= bars.slice(-21,-1).map((b: any) => b.c);

  const sma      = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance = closes.reduce((s, c) => s + Math.pow(c - sma, 2), 0) / closes.length;
  const std      = Math.sqrt(variance);
  const bbUpper  = sma + std * 2;
  const bbLower  = sma - std * 2;

  const trValues = highs.map((h, i) => Math.max(h - lows[i], Math.abs(h - (prevClose[i] ?? lows[i])), Math.abs(lows[i] - (prevClose[i] ?? lows[i]))));
  const atr      = trValues.reduce((a, b) => a + b, 0) / trValues.length;
  const ema      = closes.reduce((a, b, i) => i === 0 ? b : (b * (2/21)) + (a * (1 - 2/21)), 0);
  const kcUpper  = ema + atr * 1.5;
  const kcLower  = ema - atr * 1.5;

  const squeezed = bbUpper < kcUpper && bbLower > kcLower;
  const bbWidth  = bbUpper - bbLower;
  const kcWidth  = kcUpper - kcLower;
  const ratio    = bbWidth / kcWidth;
  
  // Momentum direction from MACD histogram approximation
  const fast = closes.slice(-12).reduce((a, b, i, arr) => (b * (2/13)) + (a * (1 - 2/13)), closes[0]);
  const slow = closes.reduce((a, b) => (b * (2/27)) + (a * (1 - 2/27)), closes[0]);
  const momentum = fast - slow;

  const lastBars = bars.slice(-5);
  const trend    = lastBars[lastBars.length-1].c > lastBars[0].c ? 'BULLISH' : 'BEARISH';

  return {
    state: squeezed ? 'SQUEEZE_ON' : 'SQUEEZE_OFF',
    intensity: Math.round((1 - ratio) * 100),
    momentum: momentum > 0 ? 'BULLISH' : momentum < 0 ? 'BEARISH' : 'NEUTRAL'
  };
}

// ── Support & Resistance Finder ────────────────────────────────
function findKeyLevels(bars: any[]): { supports: number[]; resistances: number[] } {
  const supports: number[] = [];
  const resistances: number[] = [];
  const lookback = Math.min(bars.length - 2, 30);

  for (let i = 2; i < lookback; i++) {
    const prev = bars[bars.length - 1 - i - 1];
    const curr = bars[bars.length - 1 - i];
    const next = bars[bars.length - 1 - i + 1];

    if (!prev || !next) continue;
    if (curr.l < prev.l && curr.l < next.l) supports.push(Math.round(curr.l * 100) / 100);
    if (curr.h > prev.h && curr.h > next.h) resistances.push(Math.round(curr.h * 100) / 100);
  }

  return {
    supports:     supports.slice(0, 5).sort((a, b) => b - a),
    resistances:  resistances.slice(0, 5).sort((a, b) => a - b)
  };
}

// ── Premium Fair Value ─────────────────────────────────────────
async function fetchPremiumBaseline(ticker: string, currentPrice: number, atr: number): Promise<{
  atm: number; call1atr: number; put1atr: number; bias: string;
}> {
  const expiry = today();
  const atmStrike = Math.round(currentPrice);
  const callStrike = Math.ceil(currentPrice + atr);
  const putStrike  = Math.floor(currentPrice - atr);

  const buildTicker = (strike: number, type: 'C' | 'P') => {
    const und = ticker === 'SPX' ? 'SPXW' : ticker;
    const d = expiry.replace(/-/g, '').slice(2);
    const s = Math.round(strike * 1000).toString().padStart(8, '0');
    return `O:${und}${d}${type}${s}`;
  };

  const API_KEY  = process.env.POLYGON_API_KEY || '';
  const BASE_URL = 'https://api.polygon.io';

  const fetch1M = async (optTicker: string) => {
    try {
      const url = `${BASE_URL}/v2/aggs/ticker/${encodeURIComponent(optTicker)}/range/1/minute/${today()}/${today()}?limit=5&apiKey=${API_KEY}`;
      const r = await fetch(url);
      if (!r.ok) return 0;
      const d: any = await r.json();
      return d.results?.[d.results.length - 1]?.c || 0;
    } catch { return 0; }
  };

  const [atmVal, callVal, putVal] = await Promise.all([
    fetch1M(buildTicker(atmStrike, 'C')),
    fetch1M(buildTicker(callStrike, 'C')),
    fetch1M(buildTicker(putStrike, 'P')),
  ]);

  const bias = callVal > putVal ? 'CALL HEAVY' : putVal > callVal ? 'PUT HEAVY' : 'BALANCED';

  return { atm: atmVal, call1atr: callVal, put1atr: putVal, bias };
}

// ── Session State ──────────────────────────────────────────────
interface SessionState {
  ticker: string;
  price: number;
  atr: number;
  scenarioA_prob: number;
  scenarioB_prob: number;
  squeezeMatrix: Record<string, { state: string; intensity: number; momentum: string }>;
  activeScenario: 'A' | 'B' | 'C' | null;
  executed: boolean;
  positionEntry: number;
  strikePlan: { call: number; put: number };
}

const sessionState: SessionState = {
  ticker: PRIMARY,
  price: 0,
  atr: 0,
  scenarioA_prob: 50,
  scenarioB_prob: 50,
  squeezeMatrix: {},
  activeScenario: null,
  executed: false,
  positionEntry: 0,
  strikePlan: { call: 0, put: 0 }
};

// ── PHASE 1: MORNING BRIEF ─────────────────────────────────────
async function runMorningBrief() {
  console.log('\n' + hr());
  console.log('🦅  PREDATOR INTELLIGENCE SYSTEM — MORNING BRIEF');
  console.log(hr());
  console.log(`📅  ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  console.log(`🕐  ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} EST`);
  console.log(hr('─'));

  // PAST: What happened yesterday
  log('📖 PAST — Loading yesterday\'s key levels...');
  const prevDay = prevTradingDay();
  const yesterdayBars = await polygonDataProvider.getMultiDayData(PRIMARY, 'day', prevDay, prevDay);
  const lastClose     = yesterdayBars[yesterdayBars.length - 1]?.c || 0;
  const yesterdayHigh = yesterdayBars[yesterdayBars.length - 1]?.h || 0;
  const yesterdayLow  = yesterdayBars[yesterdayBars.length - 1]?.l  || 0;

  console.log(`\n📊 YESTERDAY (${prevDay}):`);
  console.log(`   Close: $${lastClose.toFixed(2)}  High: $${yesterdayHigh.toFixed(2)}  Low: $${yesterdayLow.toFixed(2)}`);

  // Load divergence knowledge (premium intelligence from training)
  let divergencePatterns: any[] = [];
  if (fs.existsSync(DIVERGENCE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(DIVERGENCE_FILE, 'utf8'));
    divergencePatterns = raw.patterns || [];
    console.log(`   📚 Premium Divergence Knowledge: ${divergencePatterns.length} MM trap signatures loaded.`);
  }

  await sleep(500);
}

// ── PHASE 2: MARKET CONTEXT ────────────────────────────────────
async function runMarketContext() {
  console.log('\n' + hr('─'));
  log('🌍 MARKET CONTEXT — Rotation & Relative Strength...');

  // Fetch pre-market/latest bars for SPY and QQQ
  const today_date = today();
  const spyBars = await polygonDataProvider.getMultiDayData('SPY', '5min', today_date, today_date);
  const qqqBars = await polygonDataProvider.getMultiDayData('QQQ', '5min', today_date, today_date);

  const spyPrice  = spyBars[spyBars.length - 1]?.c || 0;
  const qqqPrice  = qqqBars[qqqBars.length - 1]?.c || 0;

  // Simple relative strength: SPY vs QQQ 5-min change
  const spy5mChng = spyBars.length > 2 ? ((spyBars[spyBars.length-1].c - spyBars[0].c) / spyBars[0].c * 100) : 0;
  const qqq5mChng = qqqBars.length > 2 ? ((qqqBars[qqqBars.length-1].c - qqqBars[0].c) / qqqBars[0].c * 100) : 0;

  const spyLeading = spy5mChng >= qqq5mChng;
  const rotation   = spyLeading ? 'Broad market leading. Large caps in control.' : 'Tech leading. Growth rotation active.';

  sessionState.price = spyPrice;

  console.log(`\n📈 RELATIVE STRENGTH:`);
  console.log(`   SPY: $${spyPrice.toFixed(2)} (${spy5mChng >= 0 ? '+' : ''}${spy5mChng.toFixed(2)}% 5min)`);
  console.log(`   QQQ: $${qqqPrice.toFixed(2)} (${qqq5mChng >= 0 ? '+' : ''}${qqq5mChng.toFixed(2)}% 5min)`);
  console.log(`   📊 ${rotation}`);

  await sleep(300);
  return spyBars;
}

// ── PHASE 3: SQUEEZE MATRIX ─────────────────────────────────────
async function runSqueezeMatrix() {
  console.log('\n' + hr('─'));
  log('⚡ SQUEEZE MATRIX — Reading momentum across all timeframes...');

  const today_date = today();
  const matrix: Record<string, any> = {};

  for (const tf of TIMEFRAMES) {
    try {
      const tsMap: Record<string,string> = { 'Daily':'day','4H':'4hour','1H':'hour','30M':'minute','15M':'15min','5M':'5min','1M':'minute' };
      const bars = await polygonDataProvider.getMultiDayData(PRIMARY, tsMap[tf.label] || 'day', today_date, today_date);
      if (bars && bars.length >= 22) {
        matrix[tf.label] = detectSqueeze(bars);
      } else {
        matrix[tf.label] = { state: 'INSUFFICIENT_DATA', intensity: 0, momentum: 'NEUTRAL' };
      }
    } catch {
      matrix[tf.label] = { state: 'ERROR', intensity: 0, momentum: 'NEUTRAL' };
    }
    await sleep(120);
  }

  sessionState.squeezeMatrix = matrix;

  console.log('\n⚡ SQUEEZE MATRIX:');
  const stateIcon = (s: string) => s === 'SQUEEZE_ON' ? '🔴 TIGHT' : s === 'SQUEEZE_OFF' ? '🟢 FIRED' : '⚫ –';
  
  for (const [tf, data] of Object.entries(matrix)) {
    const bar = tf.padEnd(6);
    const state = stateIcon(data.state).padEnd(12);
    const intensity = data.intensity > 0 ? `${data.intensity}% compressed` : '';
    const mom = data.momentum === 'BULLISH' ? '📈' : data.momentum === 'BEARISH' ? '📉' : '➡️';
    console.log(`   ${bar} ${state} ${mom} ${intensity}`);
  }

  // Detect cascade potential
  const tightCount = Object.values(matrix).filter((m: any) => m.state === 'SQUEEZE_ON').length;
  if (tightCount >= 3) {
    console.log(`\n   ⚠️  ${tightCount} timeframes compressed — CASCADE POTENTIAL HIGH`);
  }
}

// ── PHASE 4: S/R MAP ───────────────────────────────────────────
async function runSRMap(): Promise<{ supports: number[]; resistances: number[] }> {
  console.log('\n' + hr('─'));
  log('🎯 S/R MAP — Identifying today\'s fight zones...');

  const today_date = today();
  const bars       = await polygonDataProvider.getMultiDayData(PRIMARY, '5min', today_date, today_date);
  const dailyBars  = await polygonDataProvider.getMultiDayData(PRIMARY, 'day', prevTradingDay(), today_date);

  const intradayLevels = findKeyLevels(bars);
  const atr            = calcATR(bars);
  const dailyATR       = calcATR(dailyBars);

  sessionState.atr = atr || dailyATR;

  const price          = sessionState.price;
  const targetUp       = Math.ceil(price + (dailyATR || atr));
  const targetDown     = Math.floor(price - (dailyATR || atr));

  console.log(`\n🎯 KEY LEVELS:`);
  console.log(`   Current Price:   $${price.toFixed(2)}`);
  console.log(`   Daily ATR:       $${(dailyATR || atr).toFixed(2)}`);
  console.log(`   Upside Target:   $${targetUp} (1 ATR) ← watch call basket here`);
  console.log(`   Downside Target: $${targetDown} (1 ATR) ← watch put basket here`);
  
  if (intradayLevels.resistances.length > 0) {
    console.log(`   Resistance:      ${intradayLevels.resistances.slice(0,3).map(r => `$${r}`).join(' | ')}`);
  }
  if (intradayLevels.supports.length > 0) {
    console.log(`   Support:         ${intradayLevels.supports.slice(0,3).map(s => `$${s}`).join(' | ')}`);
  }

  // Strike plan
  sessionState.strikePlan = { call: targetUp, put: targetDown };

  return intradayLevels;
}

// ── PHASE 5: PREMIUM BASELINE ──────────────────────────────────
async function runPremiumBaseline() {
  console.log('\n' + hr('─'));
  log('💎 PREMIUM BASELINE — Fair value of 1 ATR option basket...');

  const { atm, call1atr, put1atr, bias } = await fetchPremiumBaseline(
    PRIMARY, sessionState.price, sessionState.atr
  );

  console.log(`\n💎 OPTION FAIR VALUE:`);
  console.log(`   ATM  ($${Math.round(sessionState.price)}):       $${atm > 0 ? atm.toFixed(2) : 'querying...'}`);
  console.log(`   Call $${sessionState.strikePlan.call} (1 ATR Up): $${call1atr > 0 ? call1atr.toFixed(2) : 'querying...'}`);
  console.log(`   Put  $${sessionState.strikePlan.put} (1 ATR Dn): $${put1atr > 0 ? put1atr.toFixed(2) : 'querying...'}`);
  console.log(`   Flow Bias: ${bias}`);

  if (call1atr > 0 && put1atr > 0) {
    const callPutRatio = call1atr / put1atr;
    if (callPutRatio > 1.3) console.log(`   🐂 Calls pricing in a BULLISH bias — smart money loading upside.`);
    if (callPutRatio < 0.7) console.log(`   🐻 Puts pricing in a BEARISH bias — distribution signal.`);
    if (Math.abs(callPutRatio - 1) < 0.1) console.log(`   ⚖️  Balanced premium — true consolidation. Energy storing.`);
  }
}

// ── PHASE 6: SCENARIO BUILD ─────────────────────────────────────
async function runScenarioBuild() {
  console.log('\n' + hr('─'));
  log('🧠 SCENARIO BUILD — Planning A/B/C with Nemotron...');

  const squeezeStates = Object.entries(sessionState.squeezeMatrix);
  const tightTimeframes = squeezeStates.filter(([,v]) => (v as any).state === 'SQUEEZE_ON').map(([k]) => k);
  const firedTimeframes = squeezeStates.filter(([,v]) => (v as any).state === 'SQUEEZE_OFF').map(([k]) => k);
  const bullMomentum    = squeezeStates.filter(([,v]) => (v as any).momentum === 'BULLISH').length;
  const bearMomentum    = squeezeStates.filter(([,v]) => (v as any).momentum === 'BEARISH').length;

  const technicalSummary = {
    tight_timeframes: tightTimeframes,
    fired_timeframes: firedTimeframes,
    bull_count: bullMomentum,
    bear_count: bearMomentum,
    atm_strikes: sessionState.strikePlan,
    atr: sessionState.atr,
    price: sessionState.price
  };

  const nemotronResult = await nemotronService.synthesizeIntelligence({
    ticker: PRIMARY,
    currentPrice: sessionState.price,
    expertSignals: {
      psychology:  { squeeze_states: technicalSummary },
      behavioral:  { momentum_bias: bullMomentum > bearMomentum ? 'BULLISH' : 'BEARISH' },
      flow:        { call_strike: sessionState.strikePlan.call, put_strike: sessionState.strikePlan.put },
      news:        { note: 'Pre-market context' },
      technical:   { atr: sessionState.atr, squeezed_frames: tightCount() }
    },
    macroContext: `SPY at $${sessionState.price}. ATR=$${sessionState.atr.toFixed(2)}. ${tightTimeframes.length} timeframes compressed.`,
    reasoningBudget: 80
  });

  // Translate to Predator style scenarios
  const isNemBull = nemotronResult.final_trade_direction === 'BULLISH';
  const isNemBear = nemotronResult.final_trade_direction === 'BEARISH';

  const scA_label = isNemBull ? `HOLD SUPPORT → SQUEEZE FIRES UP → TARGET $${sessionState.strikePlan.call}` : `FAIL RESISTANCE → SQUEEZE FIRES DOWN → TARGET $${sessionState.strikePlan.put}`;
  const scB_label = isNemBull ? `REJECTION AT RESISTANCE → DROP TO $${sessionState.strikePlan.put}` : `BOUNCE AT SUPPORT → GRIND UP TO $${sessionState.strikePlan.call}`;
  const scC_label = `CHOP BETWEEN $${sessionState.strikePlan.put} AND $${sessionState.strikePlan.call} — premium bleeds`;

  sessionState.scenarioA_prob = nemotronResult.confidence;
  sessionState.scenarioB_prob = Math.round((100 - nemotronResult.confidence) * 0.7);

  console.log(`\n🧠 NEMOTRON REASONING: ${nemotronResult.autonomous_thesis}`);
  console.log(`\n📋 SCENARIO PLAN:`);
  console.log(`   Scenario A (${sessionState.scenarioA_prob}%): ${scA_label}`);
  console.log(`      → Position: ${isNemBull ? `BUY $${sessionState.strikePlan.call} CALLS` : `BUY $${sessionState.strikePlan.put} PUTS`}`);
  console.log(`   Scenario B (${sessionState.scenarioB_prob}%): ${scB_label}`);
  console.log(`      → Position: ${isNemBull ? `BUY $${sessionState.strikePlan.put} PUTS` : `BUY $${sessionState.strikePlan.call} CALLS`}`);
  console.log(`   Scenario C (${100 - sessionState.scenarioA_prob - sessionState.scenarioB_prob}%): ${scC_label}`);
  console.log(`      → Position: WAIT`);

  if (nemotronResult.potential_traps_identified.length > 0) {
    console.log(`\n   ⚠️  NEMOTRON TRAP ALERTS:`);
    nemotronResult.potential_traps_identified.forEach(trap => console.log(`      • ${trap}`));
  }

  return isNemBull;
}

function tightCount() {
  return Object.values(sessionState.squeezeMatrix).filter((v: any) => v.state === 'SQUEEZE_ON').length;
}

// ── PHASE 7: LIVE EXECUTION LOOP ───────────────────────────────
async function runLiveExecutionLoop(isBullBias: boolean) {
  console.log('\n' + hr());
  console.log('🔴  MARKET OPEN — LIVE EXECUTION ARMED');
  console.log('    Listening to the market... Nemotron is watching.');
  console.log(hr());

  const schwabClient = new SchwabClient();
  const council      = new ExpertCouncil();
  const API_KEY      = process.env.POLYGON_API_KEY || '';
  const BASE_URL     = 'https://api.polygon.io';

  let lastPrice = sessionState.price;
  let checkCount = 0;
  const MAX_CHECKS = 390; // full trading day minute by minute

  while (!sessionState.executed && checkCount < MAX_CHECKS) {
    await sleep(60000); // check every minute
    checkCount++;

    try {
      // Fetch latest 1-minute bar
      const url = `${BASE_URL}/v2/aggs/ticker/${PRIMARY}/range/1/minute/${today()}/${today()}?limit=1&sort=desc&apiKey=${API_KEY}`;
      const res = await fetch(url);
      const data: any = await res.json();
      const latest = data.results?.[0];

      if (!latest) continue;

      const currentPrice = latest.c;
      const priceChange  = ((currentPrice - lastPrice) / lastPrice) * 100;
      lastPrice = currentPrice;

      // Live squeeze check
      const liveBars = await polygonDataProvider.getMultiDayData(PRIMARY, '5min', today(), today());
      const liveSquz = detectSqueeze(liveBars);

      // Premium divergence check
      const { call1atr, put1atr } = await fetchPremiumBaseline(PRIMARY, currentPrice, sessionState.atr);
      
      // The core divergence logic: price direction vs premium reaction
      const priceDropping = priceChange < -0.1;
      const priceRising   = priceChange > 0.1;
      const callHolding   = call1atr > 0 && put1atr > 0 && (call1atr / put1atr) > 0.95;
      const putHolding    = call1atr > 0 && put1atr > 0 && (put1atr / call1atr) > 0.95;

      const bullishDivergence = priceDropping && callHolding; // Stock drops, calls hold = bull trap forming
      const bearishDivergence = priceRising   && putHolding;  // Stock rises, puts hold = bear trap forming

      log(`📡 SPY $${currentPrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%) | Squeeze: ${liveSquz.state} | Call: $${call1atr.toFixed(2)} | Put: $${put1atr.toFixed(2)}`);

      // Scenario confirmation logic
      let scenarioAConfirmed = false;
      let confirmReason = '';

      if (isBullBias) {
        if (bullishDivergence && liveSquz.momentum === 'BULLISH') {
          scenarioAConfirmed = true;
          confirmReason = 'BULLISH DIVERGENCE: Price dropped but calls held. Squeeze momentum bullish. MM accumulating.';
          sessionState.scenarioA_prob = Math.min(95, sessionState.scenarioA_prob + 15);
        }
        if (liveSquz.state === 'SQUEEZE_OFF' && liveSquz.momentum === 'BULLISH' && priceChange > 0.2) {
          scenarioAConfirmed = true;
          confirmReason = 'SQUEEZE FIRED BULLISH with price confirmation.';
          sessionState.scenarioA_prob = Math.min(95, sessionState.scenarioA_prob + 20);
        }
      } else {
        if (bearishDivergence && liveSquz.momentum === 'BEARISH') {
          scenarioAConfirmed = true;
          confirmReason = 'BEARISH DIVERGENCE: Price rose but puts held. Squeeze momentum bearish. MM distributing.';
          sessionState.scenarioA_prob = Math.min(95, sessionState.scenarioA_prob + 15);
        }
        if (liveSquz.state === 'SQUEEZE_OFF' && liveSquz.momentum === 'BEARISH' && priceChange < -0.2) {
          scenarioAConfirmed = true;
          confirmReason = 'SQUEEZE FIRED BEARISH with price confirmation.';
          sessionState.scenarioA_prob = Math.min(95, sessionState.scenarioA_prob + 20);
        }
      }

      if (scenarioAConfirmed && sessionState.scenarioA_prob >= 65) {
        log(`\n🚨 SCENARIO A CONFIRMED (${sessionState.scenarioA_prob}%): ${confirmReason}`);
        
        // Expert Council vote before execution
        const decision = await council.makeCouncilDecision(liveBars, PRIMARY);
        const councilGo = decision.confidence_score >= 55 || sessionState.scenarioA_prob >= 75;
        
        log(`🏛️  Expert Council: ${decision.majority_signal} | Confidence: ${decision.confidence_score.toFixed(1)}%`);

        if (councilGo) {
          const instrument = isBullBias
            ? `${PRIMARY} $${sessionState.strikePlan.call} CALL`
            : `${PRIMARY} $${sessionState.strikePlan.put} PUT`;

          log(`\n⚡ EXECUTING TRADE — ${instrument}`);

          // Schwab execution (requires authenticated token)
          const hasTokens = schwabClient.isAuthenticated?.() || false;
          if (hasTokens) {
            const order = {
              orderType: 'MARKET' as const,
              session: 'NORMAL' as const,
              duration: 'DAY' as const,
              orderStrategyType: 'SINGLE' as const,
              orderLegCollection: [{
                instruction: 'BUY_TO_OPEN' as const,
                quantity: 1,
                instrument: {
                  symbol: instrument,
                  assetType: 'OPTION' as const
                }
              }]
            };
            await schwabClient.placeOrder(order);
            log(`✅ ORDER PLACED: ${instrument}`);
          } else {
            log(`⚠️  Schwab not yet authenticated — logging paper trade: BUY 1x ${instrument} @ market`);
          }

          sessionState.executed = true;
          sessionState.positionEntry = currentPrice;

          // Save session log
          fs.writeFileSync(SESSION_LOG_FILE, JSON.stringify({
            date: today(),
            ticker: PRIMARY,
            scenario: 'A',
            confirm_reason: confirmReason,
            entry_price: currentPrice,
            strike_plan: sessionState.strikePlan,
            nemotron_confidence: sessionState.scenarioA_prob,
            executed_at: new Date().toISOString()
          }, null, 2));
        } else {
          log(`🛑 Expert Council vetoed. Confidence too low. Waiting...`);
        }
      }

    } catch (err) {
      log(`⚠️  Live loop error: ${err}`);
    }
  }

  if (!sessionState.executed) {
    log('📵 Market closed without execution. No setup met all criteria today.');
  }
}

// ── PHASE 8: POST-MARKET FEEDBACK LOOPS ───────────────────────
async function runFeedbackLoops() {
  if (!sessionState.executed) return;

  console.log('\n' + hr('─'));
  log('🔄 FEEDBACK LOOPS — Recording outcome for every pillar...');

  const outcome = {
    date: today(),
    ticker: PRIMARY,
    entry: sessionState.positionEntry,
    squeeze_state: sessionState.squeezeMatrix,
    scenario_prob_at_entry: sessionState.scenarioA_prob,
    strikePlan: sessionState.strikePlan,
    result: 'PENDING_REVIEW'  // User updates this post-trade
  };

  // Persist feedback for every pillar's individual learning loop
  const feedbackFile = `predator-feedback-${today()}.json`;
  fs.writeFileSync(feedbackFile, JSON.stringify(outcome, null, 2));

  console.log(`\n✅ Session feedback saved to ${feedbackFile}`);
  console.log('   Each pillar (Squeeze, Premium, S/R, Volume) will train on this outcome tonight.');
  console.log(hr());
}

// ── MAIN ───────────────────────────────────────────────────────
async function main() {
  try {
    await runMorningBrief();
    await runMarketContext();
    await runSqueezeMatrix();
    const levels = await runSRMap();
    await runPremiumBaseline();
    const isBull = await runScenarioBuild();

    console.log('\n' + hr());
    console.log('📋 GAME PLAN LOCKED. Waiting for market open...');
    console.log('   Press Ctrl+C at any time to exit safely.');
    console.log(hr());

    // Wait for 9:30 AM ET if pre-market
    const now = new Date();
    const etHour = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }).split(':')[0]);
    const etMin  = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }).split(':')[1]);
    if (etHour < 9 || (etHour === 9 && etMin < 30)) {
      const waitMs = ((9 - etHour) * 60 + (30 - etMin)) * 60 * 1000;
      log(`⏳ Pre-market. Market opens in ${Math.round(waitMs / 60000)} minutes. Holding...`);
      await sleep(waitMs);
    }

    await runLiveExecutionLoop(isBull);
    await runFeedbackLoops();

  } catch (err) {
    console.error('❌ Predator Orchestrator Fatal Error:', err);
    process.exit(1);
  }
}

main();
