import { NextResponse } from 'next/server';

// ✅ PAID POLYGON API KEY ONLY - $79 STOCKS DEVELOPER PLAN
const API_KEY = 'mTmTNRmv236VbU8ijndr1F5EOJz8NR3s'; // PAID $79 PLAN KEY ONLY
const BASE_URL = 'https://api.polygon.io';

interface PolygonBar {
  v: number;  // volume
  vw: number; // volume weighted average price
  o: number;  // open
  c: number;  // close
  h: number;  // high
  l: number;  // low
  t: number;  // timestamp
  n: number;  // number of transactions
}

interface PatternAnalysis {
  timeframe: string;
  pattern_type: 'squeeze' | 'breakout';
  start_date: string;
  end_date: string;
  success: boolean;
  return_percentage: number;
  volume_confirmation: boolean;
  momentum_alignment: boolean;
  premium_behavior?: {
    iv_rank: number;
    skew: number;
    call_put_ratio: number;
  };
}

export class HistoricalPatternLearner {
  private static instance: HistoricalPatternLearner;
  private patterns: Map<string, PatternAnalysis[]> = new Map();
  
  private constructor() {}

  public static getInstance(): HistoricalPatternLearner {
    if (!HistoricalPatternLearner.instance) {
      HistoricalPatternLearner.instance = new HistoricalPatternLearner();
    }
    return HistoricalPatternLearner.instance;
  }

  async analyzeHistoricalPatterns(symbol: string, start_date: string, end_date: string): Promise<void> {
    console.log(`🔍 Analyzing historical patterns for ${symbol} from ${start_date} to ${end_date}`);
    
    // Analyze patterns across multiple timeframes
    const timeframes = ['day', '4hour', '1hour', '15min'];
    
    for (const timeframe of timeframes) {
      try {
        console.log(`\n📊 Analyzing ${timeframe} timeframe for ${symbol}`);
        
        // Split date range into 30-day chunks to avoid rate limits
        const chunks = this.splitDateRange(new Date(start_date), new Date(end_date), 30);
        let allData: PolygonBar[] = [];
        
        // Process chunks with automatic retries
        for (let i = 0; i < chunks.length; i++) {
          const [chunkStart, chunkEnd] = chunks[i];
          let success = false;
          let retryCount = 0;
          const MAX_RETRIES = 10;

          while (!success && retryCount < MAX_RETRIES) {
            try {
              console.log(`\nFetching chunk ${i + 1}/${chunks.length}: ${chunkStart.toISOString().split('T')[0]} to ${chunkEnd.toISOString().split('T')[0]}`);
              
              // Convert timeframe to Polygon.io format
              const { multiplier, timespan } = this.parseTimeframe(timeframe);
              
              const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${chunkStart.toISOString().split('T')[0]}/${chunkEnd.toISOString().split('T')[0]}?apiKey=${API_KEY}&limit=50000&adjusted=true&sort=asc`;
              
              const response = await fetch(url);
              
              if (response.status === 429) {
                console.log(`⏳ Rate limit hit, waiting 65 seconds... (retry ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 65000)); // Wait 65 seconds
                retryCount++;
                continue;
              }
              
              if (!response.ok) {
                throw new Error(`Polygon API error: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (data.status === 'OK' && Array.isArray(data.results)) {
                console.log(`✅ Got ${data.results.length} bars for chunk`);
                allData = allData.concat(data.results);
                success = true;
              } else {
                throw new Error('Invalid response format');
              }
              
              // Add delay between successful chunks
              console.log('Waiting 2 seconds before next chunk...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              
            } catch (error) {
              console.error(`❌ Error getting data for chunk:`, error);
              
              if (error instanceof Error && error.message.includes('429')) {
                console.log(`⏳ Rate limit hit, waiting 65 seconds... (retry ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 65000));
                retryCount++;
              } else {
                // For other errors, wait less time
                console.log(`⏳ Error occurred, waiting 5 seconds... (retry ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                retryCount++;
              }
            }
          }

          if (!success) {
            console.log(`⚠️ Failed to fetch chunk after ${MAX_RETRIES} retries, skipping...`);
          }
        }
        
        if (allData.length === 0) {
          console.log(`No data available for ${timeframe} timeframe`);
          continue;
        }

        // Log data summary
        console.log('\nData summary:', {
          total_bars: allData.length,
          first_date: new Date(allData[0].t).toISOString(),
          last_date: new Date(allData[allData.length - 1].t).toISOString(),
          timeframe
        });

        // Process the data in smaller chunks to avoid memory issues
        const PROCESS_CHUNK_SIZE = 1000;
        let patterns: PatternAnalysis[] = [];
        
        for (let i = 0; i < allData.length; i += PROCESS_CHUNK_SIZE) {
          const dataChunk = allData.slice(i, i + PROCESS_CHUNK_SIZE);
          
          // 1. Find Consolidation-to-Breakout Patterns
          console.log(`\nAnalyzing consolidation-to-breakout patterns for bars ${i + 1}-${i + dataChunk.length}...`);
          const breakouts = await this.findConsolidationBreakouts(dataChunk);
          
          // 2. Analyze Squeeze Patterns
          console.log(`Analyzing squeeze patterns for bars ${i + 1}-${i + dataChunk.length}...`);
          const squeezes = await this.analyzeSqueezePatterns(dataChunk, timeframe);
          
          patterns = patterns.concat([...breakouts, ...squeezes]);
        }

        // Log pattern summary
        const breakouts = patterns.filter(p => p.pattern_type === 'breakout');
        const squeezes = patterns.filter(p => p.pattern_type === 'squeeze');
        
        console.log('\nPattern analysis summary:', {
          total_patterns: patterns.length,
          breakouts: {
            total: breakouts.length,
            successful: breakouts.filter(b => b.success).length,
            with_volume: breakouts.filter(b => b.volume_confirmation).length,
            with_momentum: breakouts.filter(b => b.momentum_alignment).length,
            avg_return: breakouts.length > 0 ? 
              (breakouts.reduce((sum, b) => sum + b.return_percentage, 0) / breakouts.length).toFixed(2) + '%' : 
              'N/A'
          },
          squeezes: {
            total: squeezes.length,
            successful: squeezes.filter(s => s.success).length,
            with_volume: squeezes.filter(s => s.volume_confirmation).length,
            with_momentum: squeezes.filter(s => s.momentum_alignment).length,
            avg_return: squeezes.length > 0 ?
              (squeezes.reduce((sum, s) => sum + s.return_percentage, 0) / squeezes.length).toFixed(2) + '%' :
              'N/A'
          }
        });
        
        // Store results
        console.log(`\nStoring ${patterns.length} patterns for ${symbol}_${timeframe}`);
        this.patterns.set(`${symbol}_${timeframe}`, patterns);
        
        // Add delay between timeframes
        console.log('Waiting 5 seconds before next timeframe...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error) {
        console.error(`❌ Error analyzing ${timeframe} timeframe:`, error);
      }
    }
  }

  private parseTimeframe(timeframe: string): { multiplier: number; timespan: string } {
    const timeframeMap: Record<string, { multiplier: number; timespan: string }> = {
      '1min': { multiplier: 1, timespan: 'minute' },
      '5min': { multiplier: 5, timespan: 'minute' },
      '15min': { multiplier: 15, timespan: 'minute' },
      '30min': { multiplier: 30, timespan: 'minute' },
      'hour': { multiplier: 1, timespan: 'hour' },
      '1hour': { multiplier: 1, timespan: 'hour' },
      '4hour': { multiplier: 4, timespan: 'hour' },
      'day': { multiplier: 1, timespan: 'day' }
    };

    return timeframeMap[timeframe] || { multiplier: 1, timespan: 'minute' };
  }

  private splitDateRange(start: Date, end: Date, daysPerChunk: number): [Date, Date][] {
    const chunks: [Date, Date][] = [];
    let currentStart = new Date(start);
    
    while (currentStart < end) {
      const chunkEnd = new Date(currentStart);
      chunkEnd.setDate(chunkEnd.getDate() + daysPerChunk);
      
      if (chunkEnd > end) {
        chunks.push([currentStart, end]);
      } else {
        chunks.push([currentStart, chunkEnd]);
      }
      
      currentStart = new Date(chunkEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }
    
    return chunks;
  }

  private async findConsolidationBreakouts(data: PolygonBar[]): Promise<PatternAnalysis[]> {
    const patterns: PatternAnalysis[] = [];
    const MIN_CONSOLIDATION_BARS = 10;
    
    console.log(`Looking for consolidation patterns (minimum ${MIN_CONSOLIDATION_BARS} bars)`);
    
    for (let i = MIN_CONSOLIDATION_BARS; i < data.length - 1; i++) {
      try {
        // Calculate price ranges for consolidation detection
        const priceRange = Math.abs(data[i].h - data[i].l);
        const avgRange = this.calculateAverageRange(data, i - MIN_CONSOLIDATION_BARS, i);
        
        // Detect breakout
        if (priceRange > (avgRange * 1.5)) {
          console.log(`\nPotential breakout detected at ${new Date(data[i].t).toISOString()}`);
          console.log(`Price range: ${priceRange.toFixed(2)} vs Avg range: ${avgRange.toFixed(2)}`);
          
          const pattern: PatternAnalysis = {
            timeframe: 'day',
            pattern_type: 'breakout',
            start_date: new Date(data[i - MIN_CONSOLIDATION_BARS].t).toISOString(),
            end_date: new Date(data[i + 1].t).toISOString(),
            success: this.validateBreakoutSuccess(data, i + 1),
            return_percentage: this.calculateReturn(data, i, i + 10), // Look ahead 10 bars for return calculation
            volume_confirmation: data[i + 1].v > this.calculateAverageVolume(data, i - 5, i),
            momentum_alignment: this.checkMomentumAlignment(data, i)
          };
          
          console.log('Breakout details:', {
            success: pattern.success,
            return_percentage: pattern.return_percentage.toFixed(2) + '%',
            volume_confirmation: pattern.volume_confirmation
          });
          
          patterns.push(pattern);
        }
      } catch (error) {
        console.error(`Error analyzing bar at index ${i}:`, error);
      }
    }
    
    return patterns;
  }

  /**
   * Calculate return percentage between two price points
   */
  private calculateReturn(data: PolygonBar[], startIndex: number, endIndex: number): number {
    if (!data[startIndex] || !data[endIndex] || endIndex >= data.length) {
      return 0.00;
    }
    
    const startPrice = data[startIndex].c; // Close price at start
    const endPrice = data[endIndex].c; // Close price at end
    const returnPct = ((endPrice - startPrice) / startPrice) * 100;
    
    return parseFloat(returnPct.toFixed(2));
  }

  private async analyzeSqueezePatterns(data: PolygonBar[], timeframe: string): Promise<PatternAnalysis[]> {
    const patterns: PatternAnalysis[] = [];
    const LOOKBACK = 20;
    
    console.log(`Analyzing squeeze patterns with ${LOOKBACK} bar lookback`);
    
    for (let i = LOOKBACK; i < data.length - 1; i++) {
      try {
        // Calculate Bollinger Bands and Keltner Channels
        const bb = this.calculateBollingerBands(data, i, LOOKBACK);
        const kc = this.calculateKeltnerChannels(data, i, LOOKBACK);
        
        // Log band calculations periodically
        if (i % 100 === 0) {
          console.log('\nBand calculations sample:', {
            time: new Date(data[i].t).toISOString(),
            bb_upper: bb.upper.toFixed(2),
            bb_lower: bb.lower.toFixed(2),
            kc_upper: kc.upper.toFixed(2),
            kc_lower: kc.lower.toFixed(2)
          });
        }
        
        // Detect squeeze
        if (bb.lower > kc.lower && bb.upper < kc.upper) {
          console.log(`\nSqueeze detected at ${new Date(data[i].t).toISOString()}`);
          
          const pattern: PatternAnalysis = {
            timeframe,
            pattern_type: 'squeeze',
            start_date: new Date(data[i].t).toISOString(),
            end_date: new Date(data[i + 1].t).toISOString(),
            success: this.validateSqueezeSuccess(data, i + 1),
            return_percentage: this.calculateReturn(data, i + 1, i + 10), // Look ahead 10 bars for return calculation
            volume_confirmation: data[i + 1].v > this.calculateAverageVolume(data, i - 5, i),
            momentum_alignment: this.checkMomentumAlignment(data, i)
          };
          
          patterns.push(pattern);
        }
      } catch (error) {
        console.error(`Error analyzing squeeze at index ${i}:`, error);
      }
    }
    
    return patterns;
  }

  private calculateBollingerBands(data: PolygonBar[], index: number, period: number) {
    const prices = data.slice(index - period, index + 1).map(d => d.c);
    const sma = prices.reduce((a, b) => a + b) / period;
    const stdDev = Math.sqrt(prices.map(p => Math.pow(p - sma, 2)).reduce((a, b) => a + b) / period);
    
    return {
      upper: sma + (2 * stdDev),
      lower: sma - (2 * stdDev)
    };
  }

  private calculateKeltnerChannels(data: PolygonBar[], index: number, period: number) {
    const prices = data.slice(index - period, index + 1);
    const ema = this.calculateEMA(prices.map(d => d.c), period);
    const atr = this.calculateATR(prices);
    
    return {
      upper: ema + (2 * atr),
      lower: ema - (2 * atr)
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    return prices.reduce((ema, price, i) => {
      if (i === 0) return price;
      return (price * k) + (ema * (1 - k));
    }, prices[0]);
  }

  private calculateATR(prices: PolygonBar[]): number {
    const trs = prices.map((bar, i) => {
      if (i === 0) return bar.h - bar.l;
      const prevClose = prices[i - 1].c;
      return Math.max(
        bar.h - bar.l,
        Math.abs(bar.h - prevClose),
        Math.abs(bar.l - prevClose)
      );
    });
    
    return trs.reduce((a, b) => a + b) / trs.length;
  }

  private calculateAverageRange(data: PolygonBar[], start: number, end: number): number {
    const ranges = data.slice(start, end + 1).map(bar => bar.h - bar.l);
    return ranges.reduce((a, b) => a + b) / ranges.length;
  }

  private calculateAverageVolume(data: PolygonBar[], start: number, end: number): number {
    const volumes = data.slice(start, end + 1).map(bar => bar.v);
    return volumes.reduce((a, b) => a + b) / volumes.length;
  }

  private validateBreakoutSuccess(data: PolygonBar[], breakoutIndex: number): boolean {
    const VALIDATION_BARS = 3;
    if (breakoutIndex + VALIDATION_BARS >= data.length) return false;
    
    const direction = data[breakoutIndex].c > data[breakoutIndex - 1].c ? 'up' : 'down';
    const consolidationHigh = Math.max(...data.slice(breakoutIndex - 5, breakoutIndex).map(d => d.h));
    const consolidationLow = Math.min(...data.slice(breakoutIndex - 5, breakoutIndex).map(d => d.l));
    
    for (let i = 1; i <= VALIDATION_BARS; i++) {
      const bar = data[breakoutIndex + i];
      if (direction === 'up' && bar.l < consolidationHigh) return false;
      if (direction === 'down' && bar.h > consolidationLow) return false;
    }
    
    return true;
  }

  private validateSqueezeSuccess(data: PolygonBar[], squeezeIndex: number): boolean {
    const VALIDATION_BARS = 3;
    if (squeezeIndex + VALIDATION_BARS >= data.length) return false;
    
    const preSqueezeMoveSize = Math.abs(data[squeezeIndex].c - data[squeezeIndex - 1].c);
    const postSqueezeMove = data
      .slice(squeezeIndex + 1, squeezeIndex + VALIDATION_BARS + 1)
      .map(bar => Math.abs(bar.c - bar.o));
    
    const avgPostMove = postSqueezeMove.reduce((a, b) => a + b, 0) / postSqueezeMove.length;
    
    return avgPostMove > (preSqueezeMoveSize * 1.5);
  }

  private calculateFutureReturn(data: PolygonBar[], index: number, bars: number): number {
    if (index + bars >= data.length) return 0;
    
    const entryPrice = data[index].c;
    const exitPrice = data[index + bars].c;
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  }

  private calculateMaxReturn(data: PolygonBar[], startIndex: number, lookAheadBars: number): number {
    const endIndex = Math.min(startIndex + lookAheadBars, data.length - 1);
    const entryPrice = data[startIndex].c;
    let maxPrice = entryPrice;
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
      maxPrice = Math.max(maxPrice, data[i].h);
    }
    
    return ((maxPrice - entryPrice) / entryPrice) * 100;
  }

  private checkMomentumAlignment(data: PolygonBar[], index: number): boolean {
    const MOMENTUM_PERIOD = 10;
    if (index < MOMENTUM_PERIOD) return false;
    
    const prices = data.slice(index - MOMENTUM_PERIOD, index + 1).map(d => d.c);
    const momentum = prices.map((price, i) => i === 0 ? 0 : price - prices[i - 1]);
    
    const recentMomentum = momentum.slice(-3);
    const avgMomentum = recentMomentum.reduce((a, b) => a + b, 0) / recentMomentum.length;
    
    return Math.abs(avgMomentum) > Math.abs(momentum[0]);
  }

  getPatternAnalysis(symbol: string, timeframe: string): PatternAnalysis[] {
    return this.patterns.get(`${symbol}_${timeframe}`) || [];
  }
}

export const historicalPatternLearner = HistoricalPatternLearner.getInstance(); 