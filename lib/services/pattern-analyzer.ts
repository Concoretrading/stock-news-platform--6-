const BASE_URL = 'https://api.polygon.io';
const API_KEY = 'mTmTNRmv236VbU8ijndr1F5EOJz8NR3s'; // PAID $79 PLAN KEY ONLY

interface PatternResult {
  symbol: string;
  pattern_type: 'SQUEEZE' | 'BREAKOUT' | 'CONSOLIDATION';
  timeframe: string;
  start_date: string;
  end_date: string;
  success_rate: number;
  avg_profit: number;
  volume_profile: {
    avg_volume: number;
    volume_trend: 'increasing' | 'decreasing' | 'neutral';
  };
  key_levels: number[];
  momentum: {
    trend: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    timeframe_alignment: boolean;
  };
}

interface StockAnalysis {
  symbol: string;
  patterns: PatternResult[];
  best_timeframes: string[];
  key_levels: number[];
  success_metrics: {
    overall_success_rate: number;
    best_pattern_type: string;
    avg_profit_factor: number;
  };
}

export class PatternAnalyzer {
  private core_symbols = ['META', 'TSLA', 'SPY', 'QQQ', 'NFLX', 'NVDA'];
  private timeframes = ['5', '15', '30', '60', '240', '1D'];

  /**
   * Analyze patterns for all core symbols
   */
  async analyzeAllStocks(days: number = 180): Promise<{ [key: string]: StockAnalysis }> {
    const results: { [key: string]: StockAnalysis } = {};
    
    for (const symbol of this.core_symbols) {
      console.log(`\n📊 Analyzing ${symbol}...`);
      results[symbol] = await this.analyzeStock(symbol, days);
    }

    return results;
  }

  /**
   * Analyze patterns for a single stock
   */
  private async analyzeStock(symbol: string, days: number): Promise<StockAnalysis> {
    const patterns: PatternResult[] = [];
    const end_date = new Date().toISOString().split('T')[0];
    const start_date = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
      .toISOString().split('T')[0];

    // Analyze each timeframe
    for (const timeframe of this.timeframes) {
      // Get historical data
      const data = await fetch(
        `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/${timeframe.includes('D') ? 'day' : 'minute'}/${start_date}/${end_date}?apiKey=${API_KEY}`
      ).then(res => res.json());

      if (data.results) {
        // Find squeeze patterns
        const squeezes = await this.findSqueezePatterns(symbol, data.results, timeframe);
        patterns.push(...squeezes);

        // Find breakout patterns
        const breakouts = await this.findBreakoutPatterns(symbol, data.results, timeframe);
        patterns.push(...breakouts);

        // Find consolidation patterns
        const consolidations = await this.findConsolidationPatterns(symbol, data.results, timeframe);
        patterns.push(...consolidations);
      }
    }

    // Calculate success metrics
    const success_metrics = this.calculateSuccessMetrics(patterns);
    const best_timeframes = this.findBestTimeframes(patterns);
    const key_levels = this.findKeyLevels(patterns);

    return {
      symbol,
      patterns,
      best_timeframes,
      key_levels,
      success_metrics
    };
  }

  /**
   * Find squeeze patterns
   */
  private async findSqueezePatterns(
    symbol: string,
    data: any[],
    timeframe: string
  ): Promise<PatternResult[]> {
    const patterns: PatternResult[] = [];
    const lookback = 20;

    for (let i = lookback; i < data.length - lookback; i++) {
      // Calculate Bollinger Bands
      const prices = data.slice(i - lookback, i).map(d => d.c);
      const sma = prices.reduce((a, b) => a + b) / lookback;
      const stdDev = Math.sqrt(
        prices.map(p => Math.pow(p - sma, 2)).reduce((a, b) => a + b) / lookback
      );
      const upperBB = sma + (2 * stdDev);
      const lowerBB = sma - (2 * stdDev);

      // Calculate Keltner Channels
      const atr = this.calculateATR(data.slice(i - lookback, i));
      const upperKC = sma + (1.5 * atr);
      const lowerKC = sma - (1.5 * atr);

      // Detect squeeze
      if (lowerBB > lowerKC && upperBB < upperKC) {
        // Found squeeze, analyze outcome
        const outcome = this.analyzeSqueezeOutcome(data, i);
        
        if (outcome.valid) {
          patterns.push({
            symbol,
            pattern_type: 'SQUEEZE',
            timeframe,
            start_date: new Date(data[i].t).toISOString(),
            end_date: new Date(data[i + outcome.duration].t).toISOString(),
            success_rate: outcome.success_rate,
            avg_profit: outcome.avg_profit,
            volume_profile: this.analyzeVolume(data.slice(i, i + outcome.duration)),
            key_levels: this.findLevelsForRange(data.slice(i - lookback, i + outcome.duration)),
            momentum: this.analyzeMomentum(data.slice(i, i + outcome.duration))
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Find breakout patterns
   */
  private async findBreakoutPatterns(
    symbol: string,
    data: any[],
    timeframe: string
  ): Promise<PatternResult[]> {
    const patterns: PatternResult[] = [];
    const lookback = 20;

    for (let i = lookback; i < data.length - lookback; i++) {
      // Calculate recent high and low
      const high = Math.max(...data.slice(i - lookback, i).map(d => d.h));
      const low = Math.min(...data.slice(i - lookback, i).map(d => d.l));
      const range = high - low;

      // Detect breakout
      if (
        data[i].c > high && 
        data[i].v > data[i-1].v * 1.5 &&
        this.hasConsolidation(data.slice(i - lookback, i))
      ) {
        // Found bullish breakout, analyze outcome
        const outcome = this.analyzeBreakoutOutcome(data, i, 'bullish');
        
        if (outcome.valid) {
          patterns.push({
            symbol,
            pattern_type: 'BREAKOUT',
            timeframe,
            start_date: new Date(data[i].t).toISOString(),
            end_date: new Date(data[i + outcome.duration].t).toISOString(),
            success_rate: outcome.success_rate,
            avg_profit: outcome.avg_profit,
            volume_profile: this.analyzeVolume(data.slice(i, i + outcome.duration)),
            key_levels: this.findLevelsForRange(data.slice(i - lookback, i + outcome.duration)),
            momentum: this.analyzeMomentum(data.slice(i, i + outcome.duration))
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Find consolidation patterns
   */
  private async findConsolidationPatterns(
    symbol: string,
    data: any[],
    timeframe: string
  ): Promise<PatternResult[]> {
    const patterns: PatternResult[] = [];
    const lookback = 20;

    for (let i = lookback; i < data.length - lookback; i++) {
      // Check for consolidation
      if (this.hasConsolidation(data.slice(i - lookback, i))) {
        // Found consolidation, analyze outcome
        const outcome = this.analyzeConsolidationOutcome(data, i);
        
        if (outcome.valid) {
          patterns.push({
            symbol,
            pattern_type: 'CONSOLIDATION',
            timeframe,
            start_date: new Date(data[i].t).toISOString(),
            end_date: new Date(data[i + outcome.duration].t).toISOString(),
            success_rate: outcome.success_rate,
            avg_profit: outcome.avg_profit,
            volume_profile: this.analyzeVolume(data.slice(i, i + outcome.duration)),
            key_levels: this.findLevelsForRange(data.slice(i - lookback, i + outcome.duration)),
            momentum: this.analyzeMomentum(data.slice(i, i + outcome.duration))
          });
        }
      }
    }

    return patterns;
  }

  // Analysis helper methods
  private calculateATR(data: any[]): number {
    const tr = data.map((d, i) => {
      if (i === 0) return d.h - d.l;
      const ych = Math.abs(d.h - data[i-1].c);
      const ycl = Math.abs(d.l - data[i-1].c);
      const hl = d.h - d.l;
      return Math.max(hl, ych, ycl);
    });
    return tr.reduce((a, b) => a + b) / tr.length;
  }

  private hasConsolidation(data: any[]): boolean {
    const prices = data.map(d => d.c);
    const range = Math.max(...prices) - Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
    return range / avgPrice < 0.02; // 2% range
  }

  private analyzeSqueezeOutcome(data: any[], start: number) {
    let duration = 1;
    let success_count = 0;
    let total_profit = 0;
    let valid = false;

    // Analyze next 10 bars
    for (let i = 1; i <= 10 && start + i < data.length; i++) {
      const move = Math.abs(data[start + i].c - data[start].c);
      const profit = move / data[start].c;
      
      if (profit > 0.01) { // 1% move
        success_count++;
        total_profit += profit;
        duration = i;
        valid = true;
      }
    }

    return {
      valid,
      duration,
      success_rate: success_count / 10,
      avg_profit: total_profit / (success_count || 1)
    };
  }

  private analyzeBreakoutOutcome(data: any[], start: number, direction: 'bullish' | 'bearish') {
    let duration = 1;
    let success_count = 0;
    let total_profit = 0;
    let valid = false;

    // Analyze next 10 bars
    for (let i = 1; i <= 10 && start + i < data.length; i++) {
      const move = direction === 'bullish'
        ? data[start + i].c - data[start].c
        : data[start].c - data[start + i].c;
      
      const profit = move / data[start].c;
      
      if (profit > 0.01) { // 1% move
        success_count++;
        total_profit += profit;
        duration = i;
        valid = true;
      }
    }

    return {
      valid,
      duration,
      success_rate: success_count / 10,
      avg_profit: total_profit / (success_count || 1)
    };
  }

  private analyzeConsolidationOutcome(data: any[], start: number) {
    let duration = 1;
    let success_count = 0;
    let total_profit = 0;
    let valid = false;

    // Analyze next 10 bars
    for (let i = 1; i <= 10 && start + i < data.length; i++) {
      const move = Math.abs(data[start + i].c - data[start].c);
      const profit = move / data[start].c;
      
      if (profit > 0.02) { // 2% move
        success_count++;
        total_profit += profit;
        duration = i;
        valid = true;
      }
    }

    return {
      valid,
      duration,
      success_rate: success_count / 10,
      avg_profit: total_profit / (success_count || 1)
    };
  }

  private analyzeVolume(data: any[]) {
    const volumes = data.map(d => d.v);
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    
    // Calculate volume trend
    const firstHalf = volumes.slice(0, Math.floor(volumes.length / 2));
    const secondHalf = volumes.slice(Math.floor(volumes.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    
    let volume_trend: 'increasing' | 'decreasing' | 'neutral';
    if (secondHalfAvg > firstHalfAvg * 1.1) volume_trend = 'increasing';
    else if (secondHalfAvg < firstHalfAvg * 0.9) volume_trend = 'decreasing';
    else volume_trend = 'neutral';

    return {
      avg_volume: avgVolume,
      volume_trend
    };
  }

  private findLevelsForRange(data: any[]): number[] {
    const levels = new Set<number>();
    
    // Find price clusters
    for (const bar of data) {
      const price = bar.c;
      const touches = data.filter(d => 
        Math.abs(d.h - price) / price < 0.001 ||
        Math.abs(d.l - price) / price < 0.001
      ).length;
      
      if (touches >= 3) {
        levels.add(Number(price.toFixed(2)));
      }
    }
    
    return Array.from(levels).sort((a, b) => a - b);
  }

  private analyzeMomentum(data: any[]) {
    const closes = data.map(d => d.c);
    
    // Calculate momentum trend
    const firstHalf = closes.slice(0, Math.floor(closes.length / 2));
    const secondHalf = closes.slice(Math.floor(closes.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    
    let trend: 'bullish' | 'bearish' | 'neutral';
    if (secondHalfAvg > firstHalfAvg * 1.01) trend = 'bullish';
    else if (secondHalfAvg < firstHalfAvg * 0.99) trend = 'bearish';
    else trend = 'neutral';

    // Calculate momentum strength (0-100)
    const strength = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    // Check timeframe alignment
    const timeframe_alignment = trend === 'bullish' 
      ? closes[closes.length - 1] > closes[closes.length - 2]
      : trend === 'bearish'
      ? closes[closes.length - 1] < closes[closes.length - 2]
      : true;

    return {
      trend,
      strength: Math.abs(strength),
      timeframe_alignment
    };
  }

  private calculateSuccessMetrics(patterns: PatternResult[]) {
    if (patterns.length === 0) {
      return {
        overall_success_rate: 0,
        best_pattern_type: 'N/A',
        avg_profit_factor: 0
      };
    }

    // Calculate overall success rate
    const overall_success_rate = patterns.reduce((sum, p) => sum + p.success_rate, 0) / patterns.length;

    // Find best pattern type
    const pattern_stats = new Map<string, { count: number, success: number }>();
    patterns.forEach(p => {
      if (!pattern_stats.has(p.pattern_type)) {
        pattern_stats.set(p.pattern_type, { count: 0, success: 0 });
      }
      const stats = pattern_stats.get(p.pattern_type)!;
      stats.count++;
      stats.success += p.success_rate;
    });

    let best_pattern_type = 'N/A';
    let best_success = 0;
    pattern_stats.forEach((stats, type) => {
      const success_rate = stats.success / stats.count;
      if (success_rate > best_success) {
        best_success = success_rate;
        best_pattern_type = type;
      }
    });

    // Calculate average profit factor
    const avg_profit_factor = patterns.reduce((sum, p) => sum + p.avg_profit, 0) / patterns.length;

    return {
      overall_success_rate,
      best_pattern_type,
      avg_profit_factor
    };
  }

  private findBestTimeframes(patterns: PatternResult[]): string[] {
    const timeframe_stats = new Map<string, { count: number, success: number }>();
    
    patterns.forEach(p => {
      if (!timeframe_stats.has(p.timeframe)) {
        timeframe_stats.set(p.timeframe, { count: 0, success: 0 });
      }
      const stats = timeframe_stats.get(p.timeframe)!;
      stats.count++;
      stats.success += p.success_rate;
    });

    return Array.from(timeframe_stats.entries())
      .map(([tf, stats]) => ({
        timeframe: tf,
        success_rate: stats.success / stats.count
      }))
      .sort((a, b) => b.success_rate - a.success_rate)
      .filter(tf => tf.success_rate > 0.5)
      .map(tf => tf.timeframe);
  }
}

// Create and export instance
const patternAnalyzer = new PatternAnalyzer();
export default patternAnalyzer; 