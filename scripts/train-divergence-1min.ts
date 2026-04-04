/**
 * PREDATOR DIVERGENCE LEARNING ENGINE (1-Minute Resoluton)
 * =========================================================
 * Replays historical days minute-by-minute to read the "basket of strikes"
 * (ATM all the way to the 1 ATR Target).
 * 
 * Goal: Find when the stock price action tells one story (e.g., selling off)
 * while the option premium tells the truth (upside calls holding value).
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

interface StrikeMapping {
  strike: number;
  ticker: string; // The polygon option ticker
  type: 'C' | 'P';
  bars: Map<number, Bar>; // Map of timestamp -> Bar for O(1) instantaneous lookup
}

interface DivergenceRecording {
  id: string;
  ticker: string;
  date: string;
  time_of_divergence: string; // The exact minute we caught the market makers lying
  divergence_type: 'Bullish_Accumulation' | 'Bearish_Distribution'; // Bullish means stock dropping but calls holding
  stock_price: number;
  intraday_atr: number;
  atm_strike: number;
  target_atr_strike: number;
  stock_trend_15min_pct: number;
  target_premium_trend_15min_pct: number;
  basket_story: string; // Description of the divergence
  subsequent_reversal_occurred: boolean; // Did the trap spring?
  time_to_reversal_mins: number;
  reversal_magnitude_pct: number;
}

let lastRequest = 0;
async function apiRequest(url: string, isOptions = true): Promise<any> {
  const now     = Date.now();
  const elapsed = now - lastRequest;
  const rateLimit = isOptions ? 13000 : 200; // Options: ~5/min
  
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

async function fetchStrikeBasket(
  ticker: string,
  expiry: string,
  date: string,
  centerPrice: number,
  atr: number
): Promise<{ calls: StrikeMapping[], puts: StrikeMapping[] }> {
  const calls: StrikeMapping[] = [];
  const puts: StrikeMapping[] = [];

  // Define our target zones
  const atmBase = Math.round(centerPrice);
  const upsideTarget = Math.ceil(centerPrice + atr);
  const downsideTarget = Math.floor(centerPrice - atr);

  // We fetch the ATM, the Target, and every $1 strike in between to build the basket
  // SPY has $1 increments
  const strikesToFetch = new Set<number>();
  for (let s = downsideTarget - 1; s <= upsideTarget + 1; s++) {
    strikesToFetch.add(s);
  }

  console.log(`  🧺 Building Strike Basket from $${downsideTarget - 1} to $${upsideTarget + 1} (ATR Target zones)...`);
  
  for (const strike of strikesToFetch) {
    // Process Calls
    if (strike >= atmBase - 1) { // Only slightly ITM and all OTM calls
      const optTicker = buildOptionTicker(ticker, expiry, 'C', strike);
      const bars = await get1MinBars(optTicker, date, true);
      const map = new Map<number, Bar>();
      bars.forEach(b => map.set(b.t, b));
      if (bars.length > 0) calls.push({ strike, ticker: optTicker, type: 'C', bars: map });
    }
    
    // Process Puts
    if (strike <= atmBase + 1) { // Only slightly ITM and all OTM puts
      const optTicker = buildOptionTicker(ticker, expiry, 'P', strike);
      const bars = await get1MinBars(optTicker, date, true);
      const map = new Map<number, Bar>();
      bars.forEach(b => map.set(b.t, b));
      if (bars.length > 0) puts.push({ strike, ticker: optTicker, type: 'P', bars: map });
    }
  }

  calls.sort((a,b) => a.strike - b.strike);
  puts.sort((a,b) => b.strike - a.strike); // Puts descending (closest to ATM first among OTMs)

  return { calls, puts };
}

async function analyzePremiumDivergence(ticker: string, date: string): Promise<DivergenceRecording[]> {
  const recordings: DivergenceRecording[] = [];
  console.log(`\n📅 Reliving ${ticker} market action on ${date}...`);
  
  const stockBars = await get1MinBars(ticker, date, false);
  if (!stockBars || stockBars.length < 30) return [];

  // Filter ONLY standard market hours (9:30 AM to 4:00 PM EST)
  const regularHoursBars = stockBars.filter(b => {
      const d = new Date(b.t);
      // Polygon timestamps are UTC. New York is UTC-5 or UTC-4. 
      // Safest route is to convert to NY string and check hours
      const timeStr = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
      const [hourStr, minStr] = timeStr.split(':');
      const timeInt = parseInt(hourStr) * 100 + parseInt(minStr);
      return timeInt >= 930 && timeInt < 1600;
  });

  if (regularHoursBars.length < 100) {
      console.log(`  ⚠️ Insufficient regular hours data for ${date}. Found ${regularHoursBars.length} bars.`);
      return [];
  }
  
  console.log(`  ✅ Retrieved ${regularHoursBars.length} normal 1-minute stock bars (9:30 AM - 4:00 PM EST).`);

  const availableExps = await getDailyExpirations(ticker, date);
  if (availableExps.length === 0) return [];
  const expiry = availableExps[0];
  console.log(`  🎯 Nearest Expiration Selected: ${expiry} (0DTE/Weekly)`);

  // To build the initial basket, we measure ATR opening print 
  const atrArray = calculateATR(regularHoursBars, 14);
  const midDayAtr = atrArray[Math.floor(regularHoursBars.length / 2)];
  const centerPrice = regularHoursBars[Math.floor(regularHoursBars.length / 2)].c;

  // We fetch the massive "basket" of strikes for the entire day.
  // Warning: This consumes a large chunk of options rate limit all at once, but then we can replay the day instantly in memory!
  const basket = await fetchStrikeBasket(ticker, expiry, date, centerPrice, midDayAtr);

  console.log(`\n  🕵️‍♂️ Replaying the day minute-by-minute hunting for Market Maker Traps...`);
  
  // Replay memory
  let setupFoundAtIdx = -1;

  // Start at 10:00 AM NY (after 30 minutes of open to let volatility settle)
  for (let i = 30; i < regularHoursBars.length - 60; i++) {
    const currentBar = regularHoursBars[i];
    const prev15MinsStr = regularHoursBars.slice(i-15, i);
    const startOf15 = prev15MinsStr[0].c;
    const endOf15 = currentBar.c;

    const stockTrendPct = ((endOf15 - startOf15) / startOf15) * 100;
    const currentAtr = atrArray[i];

    // Identify target strikes dynamically based on current price
    const atmStrike = Math.round(endOf15);
    const targetCallStrike = Math.ceil(endOf15 + currentAtr);
    const targetPutStrike = Math.floor(endOf15 - currentAtr);

    // DIVERGENCE SETUP 1: Stock is selling off, but Target Call Basket is HOLDING
    if (stockTrendPct < -0.25) { // Stock dropped meaningly
      
      const targetCall = basket.calls.find(c => c.strike === targetCallStrike);
      if (targetCall) {
        const optionStart = targetCall.bars.get(prev15MinsStr[0].t)?.c;
        const optionEnd = targetCall.bars.get(currentBar.t)?.c;

        if (optionStart && optionEnd && optionStart > 0) {
          const callTrendPct = ((optionEnd - optionStart) / optionStart) * 100;
          
          // The stock sold off, but the Call option is flat (or up). This is a trap! It should be crushed.
          if (callTrendPct > -1.0) { // e.g., didn't drop despite underlying dropping, or even ticked positive
            
            // Check to avoid duplicate sequential logging
            if (i > setupFoundAtIdx + 30) {
                console.log(`\n  🚨 ${new Date(currentBar.t).toLocaleTimeString('en-US', {timeZone: 'America/New_York'})} EST | 🐂 BULLISH DIVERGENCE (BEAR TRAP) DETECTED!`);
                console.log(`     • The Story: Stock has sold off ${stockTrendPct.toFixed(2)}% over the last 15 minutes to $${endOf15.toFixed(2)}.`);
                console.log(`     • The Truth: Market makers are holding the Upside Target Calls ($${targetCallStrike}) flat/up (${callTrendPct.toFixed(2)}%).`);
                console.log(`     • They are accumulating for a reversal. The retail shorts are trapped.`);
                
                // Track reversal results manually
                const lowestNext30 = regularHoursBars.slice(i, i+30).reduce((min, b) => b.l < min ? b.l : min, 99999);
                const highestNext60 = regularHoursBars.slice(i, i+60).reduce((max, b) => b.h > max ? b.h : max, 0);
                const reversalMag = ((highestNext60 - endOf15) / endOf15) * 100;

                console.log(`     • Outcome: Stock squeezed +${reversalMag.toFixed(2)}% over the next hour.`);

                recordings.push({
                   id: `div-${date}-${currentBar.t}`,
                   ticker, date, time_of_divergence: new Date(currentBar.t).toLocaleTimeString(),
                   divergence_type: 'Bullish_Accumulation', stock_price: endOf15, intraday_atr: currentAtr,
                   atm_strike: atmStrike, target_atr_strike: targetCallStrike,
                   stock_trend_15min_pct: stockTrendPct, target_premium_trend_15min_pct: callTrendPct,
                   basket_story: "Stock dropping but 1 ATR upside call basket holding value.",
                   subsequent_reversal_occurred: reversalMag > 0.15,
                   time_to_reversal_mins: 15,
                   reversal_magnitude_pct: reversalMag
                });

                setupFoundAtIdx = i;
            }
          }
        }
      }
    }
    
    // DIVERGENCE SETUP 2: Stock is grinding up, but Target Put Basket is HOLDING
    if (stockTrendPct > 0.25) { 
      const targetPut = basket.puts.find(p => p.strike === targetPutStrike);
      if (targetPut) {
        const optionStart = targetPut.bars.get(prev15MinsStr[0].t)?.c;
        const optionEnd = targetPut.bars.get(currentBar.t)?.c;

        if (optionStart && optionEnd && optionStart > 0) {
          const putTrendPct = ((optionEnd - optionStart) / optionStart) * 100;
          
          if (putTrendPct > -1.0) { // e.g. put is flat despite stock rallying up
            if (i > setupFoundAtIdx + 30) {
                console.log(`\n  🚨 ${new Date(currentBar.t).toLocaleTimeString('en-US', {timeZone: 'America/New_York'})} EST | 🐻 BEARISH DIVERGENCE (BULL TRAP) DETECTED!`);
                console.log(`     • The Story: Stock rallied +${stockTrendPct.toFixed(2)}% over 15 minutes to $${endOf15.toFixed(2)}.`);
                console.log(`     • The Truth: Downside Target Puts ($${targetPutStrike}) are holding value (${putTrendPct.toFixed(2)}%). Market Makers refuse to crush them.`);
                console.log(`     • They are capping the rally. Longs are trapped.`);

                const highestNext30 = regularHoursBars.slice(i, i+30).reduce((max, b) => b.h > max ? b.h : max, 0);
                const lowestNext60 = regularHoursBars.slice(i, i+60).reduce((min, b) => b.l < min ? b.l : min, 99999);
                const breakdownMag = ((lowestNext60 - endOf15) / endOf15) * 100;

                console.log(`     • Outcome: Stock rejected and dropped ${breakdownMag.toFixed(2)}% over the next hour.`);
                
                recordings.push({
                   id: `div-${date}-${currentBar.t}`,
                   ticker, date, time_of_divergence: new Date(currentBar.t).toLocaleTimeString(),
                   divergence_type: 'Bearish_Distribution', stock_price: endOf15, intraday_atr: currentAtr,
                   atm_strike: atmStrike, target_atr_strike: targetPutStrike,
                   stock_trend_15min_pct: stockTrendPct, target_premium_trend_15min_pct: putTrendPct,
                   basket_story: "Stock rising but 1 ATR downside put basket holding value.",
                   subsequent_reversal_occurred: breakdownMag < -0.15,
                   time_to_reversal_mins: 15,
                   reversal_magnitude_pct: breakdownMag
                });

                setupFoundAtIdx = i;
            }
          }
        }
      }
    }
  }

  return recordings;
}

async function run() {
  console.log('='.repeat(60));
  console.log('🧠 PREDATOR 1-MIN DIVERGENCE REPLAY ENGINE (1 ATR Targets)');
  console.log('='.repeat(60));

  // Use a highly volatile week for real truth testing
  // During major drops, the divergence is highly visible
  const testDays = ['2023-11-01', '2023-11-02']; 
  const recentDays = ['2024-03-01', '2024-03-04']; 

  const finalDaysToTest = ['2024-04-04']; // Known high-volatility reversal day (massive afternoon drop and wild swings)
  
  console.log(`🔍 Reliving high-volatility reversal sessions to trap the Market Makers...`);

  // Try the most recent business days dynamically
  const d1 = new Date();
  d1.setDate(d1.getDate() - 3);
  while(d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() - 1);
  const date2 = fmtDate(d1);
  
  d1.setDate(d1.getDate() - 1);
  while(d1.getDay() === 0 || d1.getDay() === 6) d1.setDate(d1.getDate() - 1);
  const date1 = fmtDate(d1);

  const dynamicTestDays = [date1, date2];

  const allPatterns: DivergenceRecording[] = [];

  for (const date of dynamicTestDays) {
    try {
      const dailyPatterns = await analyzePremiumDivergence('SPY', date);
      allPatterns.push(...dailyPatterns);
    } catch (e) {
      console.error(`Error processing ${date}:`, e);
    }
  }

  console.log('\n=========================================================');
  console.log('✅ TRUTH ENGINE REPLAY COMPLETE');
  console.log('=========================================================');
  console.log(`📊 Caught Market Makers in a Trap ${allPatterns.length} times.`);
  
  if (allPatterns.length > 0) {
    fs.writeFileSync('predator-knowledge-divergence.json', JSON.stringify({
      generated_at: new Date().toISOString(),
      tested_days: dynamicTestDays,
      patterns_found: allPatterns.length,
      patterns: allPatterns
    }, null, 2));
    console.log('💾 Market Maker Trap Signatures saved to: predator-knowledge-divergence.json');
  }
}

run();
