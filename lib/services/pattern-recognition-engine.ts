import { polygonData } from './polygon-data-provider';
import { patternStorage } from './pattern-storage';

interface PatternConfig {
  symbol: string;
  timeframes: string[];
  patterns: {
    squeeze: {
      enabled: boolean;
      bb_std: number;  // Bollinger Band standard deviations
      kc_mult: number; // Keltner Channel multiplier
    };
    breakout: {
      enabled: boolean;
      volume_threshold: number;  // Volume increase threshold
      price_threshold: number;   // Price breakout threshold
    };
    consolidation: {
      enabled: boolean;
      range_threshold: number;   // Maximum price range %
      min_duration: number;      // Minimum bars
    };
  };
  volume: {
    min_threshold: number;      // Minimum volume requirement
    increase_threshold: number; // Volume increase threshold
  };
}

interface PatternResult {
  symbol: string;
  pattern_type: 'SQUEEZE' | 'BREAKOUT' | 'CONSOLIDATION';
  timeframe: string;
  confidence: number;
  signals: {
    entry_price: number;
    stop_loss: number;
    targets: number[];
    position_size?: number;
  };
  supporting_data: {
    volume_profile: any;
    momentum: any;
    key_levels: number[];
  };
  timestamp: string;
}

export class PatternRecognitionEngine {
  private static instance: PatternRecognitionEngine;
  private activeSymbols: Set<string> = new Set();
  private patternConfigs: Map<string, PatternConfig> = new Map();
  private realTimeData: Map<string, any> = new Map();
  private historicalPatterns: Map<string, any[]> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
  }

  public static getInstance(): PatternRecognitionEngine {
    if (!PatternRecognitionEngine.instance) {
      PatternRecognitionEngine.instance = new PatternRecognitionEngine();
    }
    return PatternRecognitionEngine.instance;
  }

  /**
   * Initialize pattern recognition for a symbol
   */
  async initializeSymbol(symbol: string, config?: Partial<PatternConfig>): Promise<void> {
    try {
      console.log(`🎯 Initializing pattern recognition for ${symbol}`);
      
      // Set up configuration
      const defaultConfig = this.getDefaultConfig(symbol);
      const finalConfig = { ...defaultConfig, ...config };
      this.patternConfigs.set(symbol, finalConfig);
      
      // Load historical patterns
      const patterns = await patternStorage.getPatternsForSymbol(symbol);
      this.historicalPatterns.set(symbol, patterns);
      
      // Subscribe to real-time data
      await this.subscribeToRealTimeData(symbol);
      
      this.activeSymbols.add(symbol);
      console.log(`✅ Pattern recognition initialized for ${symbol}`);

    } catch (error) {
      console.error(`Failed to initialize ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Process real-time data and identify patterns
   */
  async processRealTimeData(symbol: string, data: any): Promise<PatternResult[]> {
    try {
      const config = this.patternConfigs.get(symbol);
      if (!config) throw new Error(`No config found for ${symbol}`);

      const patterns: PatternResult[] = [];
      
      // Process each timeframe
      for (const timeframe of config.timeframes) {
        // Get historical data for context
        const historicalData = await polygonData.getHistoricalData(
          symbol,
          timeframe,
          this.getStartDate(timeframe),
          new Date().toISOString()
        );

        // Check for squeeze pattern
        if (config.patterns.squeeze.enabled) {
          const squeezePattern = await this.detectSqueezePattern(
            symbol,
            timeframe,
            historicalData,
            config
          );
          if (squeezePattern) patterns.push(squeezePattern);
        }

        // Check for breakout pattern
        if (config.patterns.breakout.enabled) {
          const breakoutPattern = await this.detectBreakoutPattern(
            symbol,
            timeframe,
            historicalData,
            config
          );
          if (breakoutPattern) patterns.push(breakoutPattern);
        }

        // Check for consolidation pattern
        if (config.patterns.consolidation.enabled) {
          const consolidationPattern = await this.detectConsolidationPattern(
            symbol,
            timeframe,
            historicalData,
            config
          );
          if (consolidationPattern) patterns.push(consolidationPattern);
        }
      }

      // Store detected patterns
      if (patterns.length > 0) {
        await this.storePatterns(patterns);
      }

      return patterns;

    } catch (error) {
      console.error(`Error processing ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Detect squeeze pattern
   */
  private async detectSqueezePattern(
    symbol: string,
    timeframe: string,
    data: any[],
    config: PatternConfig
  ): Promise<PatternResult | null> {
    try {
      const lookback = 20;
      if (data.length < lookback) return null;

      // Calculate Bollinger Bands
      const prices = data.slice(-lookback).map(d => d.c);
      const sma = prices.reduce((a, b) => a + b) / lookback;
      const stdDev = Math.sqrt(
        prices.map(p => Math.pow(p - sma, 2)).reduce((a, b) => a + b) / lookback
      );
      const upperBB = sma + (config.patterns.squeeze.bb_std * stdDev);
      const lowerBB = sma - (config.patterns.squeeze.bb_std * stdDev);

      // Calculate Keltner Channels
      const atr = this.calculateATR(data.slice(-lookback));
      const upperKC = sma + (config.patterns.squeeze.kc_mult * atr);
      const lowerKC = sma - (config.patterns.squeeze.kc_mult * atr);

      // Detect squeeze
      if (lowerBB > lowerKC && upperBB < upperKC) {
        // Calculate confidence based on historical patterns
        const confidence = await this.calculatePatternConfidence(
          symbol,
          'SQUEEZE',
          timeframe,
          data
        );

        // Generate trading signals
        const signals = this.generateSignals(data, 'SQUEEZE', confidence);

        return {
          symbol,
          pattern_type: 'SQUEEZE',
          timeframe,
          confidence,
          signals,
          supporting_data: {
            volume_profile: this.analyzeVolume(data),
            momentum: this.analyzeMomentum(data),
            key_levels: this.findKeyLevels(data)
          },
          timestamp: new Date().toISOString()
        };
      }

      return null;

    } catch (error) {
      console.error('Squeeze detection error:', error);
      return null;
    }
  }

  /**
   * Detect breakout pattern
   */
  private async detectBreakoutPattern(
    symbol: string,
    timeframe: string,
    data: any[],
    config: PatternConfig
  ): Promise<PatternResult | null> {
    try {
      const lookback = 20;
      if (data.length < lookback) return null;

      // Calculate recent high and low
      const high = Math.max(...data.slice(-lookback).map(d => d.h));
      const low = Math.min(...data.slice(-lookback).map(d => d.l));
      const lastPrice = data[data.length - 1].c;
      const lastVolume = data[data.length - 1].v;
      const avgVolume = data.slice(-lookback).reduce((a, b) => a + b.v, 0) / lookback;

      // Check for breakout
      const priceBreakout = lastPrice > high * (1 + config.patterns.breakout.price_threshold);
      const volumeBreakout = lastVolume > avgVolume * config.patterns.breakout.volume_threshold;

      if (priceBreakout && volumeBreakout) {
        // Calculate confidence
        const confidence = await this.calculatePatternConfidence(
          symbol,
          'BREAKOUT',
          timeframe,
          data
        );

        // Generate signals
        const signals = this.generateSignals(data, 'BREAKOUT', confidence);

        return {
          symbol,
          pattern_type: 'BREAKOUT',
          timeframe,
          confidence,
          signals,
          supporting_data: {
            volume_profile: this.analyzeVolume(data),
            momentum: this.analyzeMomentum(data),
            key_levels: this.findKeyLevels(data)
          },
          timestamp: new Date().toISOString()
        };
      }

      return null;

    } catch (error) {
      console.error('Breakout detection error:', error);
      return null;
    }
  }

  /**
   * Detect consolidation pattern
   */
  private async detectConsolidationPattern(
    symbol: string,
    timeframe: string,
    data: any[],
    config: PatternConfig
  ): Promise<PatternResult | null> {
    try {
      const lookback = config.patterns.consolidation.min_duration;
      if (data.length < lookback) return null;

      // Calculate price range
      const prices = data.slice(-lookback).map(d => d.c);
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
      const range = (high - low) / avgPrice;

      if (range <= config.patterns.consolidation.range_threshold) {
        // Calculate confidence
        const confidence = await this.calculatePatternConfidence(
          symbol,
          'CONSOLIDATION',
          timeframe,
          data
        );

        // Generate signals
        const signals = this.generateSignals(data, 'CONSOLIDATION', confidence);

        return {
          symbol,
          pattern_type: 'CONSOLIDATION',
          timeframe,
          confidence,
          signals,
          supporting_data: {
            volume_profile: this.analyzeVolume(data),
            momentum: this.analyzeMomentum(data),
            key_levels: this.findKeyLevels(data)
          },
          timestamp: new Date().toISOString()
        };
      }

      return null;

    } catch (error) {
      console.error('Consolidation detection error:', error);
      return null;
    }
  }

  /**
   * Calculate pattern confidence based on historical patterns
   */
  private async calculatePatternConfidence(
    symbol: string,
    pattern_type: string,
    timeframe: string,
    data: any[]
  ): Promise<number> {
    try {
      const historicalPatterns = this.historicalPatterns.get(symbol) || [];
      
      // Filter relevant patterns
      const relevantPatterns = historicalPatterns.filter(p => 
        p.pattern_type === pattern_type &&
        p.timeframe === timeframe
      );

      if (relevantPatterns.length === 0) return 0.5; // Neutral confidence

      // Calculate average success rate
      const avgSuccess = relevantPatterns.reduce((sum, p) => sum + p.success_rate, 0) / 
        relevantPatterns.length;

      // Calculate current pattern strength
      const patternStrength = this.calculatePatternStrength(pattern_type, data);

      // Combine historical success with current strength
      return (avgSuccess * 0.7) + (patternStrength * 0.3);

    } catch (error) {
      console.error('Confidence calculation error:', error);
      return 0.5; // Neutral confidence on error
    }
  }

  /**
   * Calculate current pattern strength
   */
  private calculatePatternStrength(pattern_type: string, data: any[]): number {
    try {
      switch (pattern_type) {
        case 'SQUEEZE':
          return this.calculateSqueezeStrength(data);
        case 'BREAKOUT':
          return this.calculateBreakoutStrength(data);
        case 'CONSOLIDATION':
          return this.calculateConsolidationStrength(data);
        default:
          return 0.5;
      }
    } catch (error) {
      console.error('Pattern strength calculation error:', error);
      return 0.5;
    }
  }

  /**
   * Generate trading signals
   */
  private generateSignals(
    data: any[],
    pattern_type: string,
    confidence: number
  ): any {
    const lastPrice = data[data.length - 1].c;
    const atr = this.calculateATR(data);

    let stopLoss: number;
    let targets: number[];

    switch (pattern_type) {
      case 'SQUEEZE':
        stopLoss = lastPrice - (1.5 * atr);
        targets = [
          lastPrice + (2 * atr),
          lastPrice + (3 * atr),
          lastPrice + (4 * atr)
        ];
        break;

      case 'BREAKOUT':
        stopLoss = lastPrice - (2 * atr);
        targets = [
          lastPrice + (3 * atr),
          lastPrice + (4 * atr),
          lastPrice + (5 * atr)
        ];
        break;

      case 'CONSOLIDATION':
        stopLoss = lastPrice - atr;
        targets = [
          lastPrice + (1.5 * atr),
          lastPrice + (2 * atr),
          lastPrice + (3 * atr)
        ];
        break;

      default:
        stopLoss = lastPrice - atr;
        targets = [lastPrice + atr, lastPrice + (2 * atr)];
    }

    return {
      entry_price: lastPrice,
      stop_loss: stopLoss,
      targets,
      position_size: this.calculatePositionSize(confidence, lastPrice, stopLoss)
    };
  }

  // Helper methods
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

  private analyzeVolume(data: any[]): any {
    const volumes = data.map(d => d.v);
    const avgVolume = volumes.reduce((a, b) => a + b) / volumes.length;
    
    return {
      average: avgVolume,
      current: volumes[volumes.length - 1],
      trend: volumes[volumes.length - 1] > avgVolume ? 'increasing' : 'decreasing'
    };
  }

  private analyzeMomentum(data: any[]): any {
    const closes = data.map(d => d.c);
    const sma20 = this.calculateSMA(closes, 20);
    const lastClose = closes[closes.length - 1];
    
    return {
      trend: lastClose > sma20 ? 'bullish' : 'bearish',
      strength: Math.abs((lastClose - sma20) / sma20) * 100
    };
  }

  private calculateSMA(data: number[], period: number): number {
    return data.slice(-period).reduce((a, b) => a + b) / period;
  }

  private findKeyLevels(data: any[]): number[] {
    const levels = new Set<number>();
    
    data.forEach(bar => {
      const price = bar.c;
      const touches = data.filter(d => 
        Math.abs(d.h - price) / price < 0.001 ||
        Math.abs(d.l - price) / price < 0.001
      ).length;
      
      if (touches >= 3) {
        levels.add(Number(price.toFixed(2)));
      }
    });
    
    return Array.from(levels).sort((a, b) => a - b);
  }

  private calculatePositionSize(
    confidence: number,
    entry: number,
    stop: number
  ): number {
    const riskAmount = 100; // Risk $100 per trade
    const riskPerShare = Math.abs(entry - stop);
    let shares = Math.floor(riskAmount / riskPerShare);
    
    // Adjust size based on confidence
    if (confidence > 0.8) shares = Math.floor(shares * 1.5);
    if (confidence < 0.6) shares = Math.floor(shares * 0.5);
    
    return shares;
  }

  private calculateSqueezeStrength(data: any[]): number {
    // Implementation specific to squeeze patterns
    return 0.7; // Placeholder
  }

  private calculateBreakoutStrength(data: any[]): number {
    // Implementation specific to breakout patterns
    return 0.8; // Placeholder
  }

  private calculateConsolidationStrength(data: any[]): number {
    // Implementation specific to consolidation patterns
    return 0.6; // Placeholder
  }

  private async storePatterns(patterns: PatternResult[]): Promise<void> {
    try {
      await Promise.all(patterns.map(pattern => 
        patternStorage.storePattern({
          ...pattern,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      ));
    } catch (error) {
      console.error('Pattern storage error:', error);
    }
  }

  private async subscribeToRealTimeData(symbol: string): Promise<void> {
    try {
      await polygonData.subscribeToRealTime([symbol], async (data) => {
        const patterns = await this.processRealTimeData(symbol, data);
        if (patterns.length > 0) {
          console.log(`🎯 Patterns detected for ${symbol}:`, patterns);
        }
      });
    } catch (error) {
      console.error('Real-time subscription error:', error);
      throw error;
    }
  }

  private getStartDate(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case '1m':
        return new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
      case '5m':
      case '15m':
        return new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString();
      case '30m':
      case '1h':
        return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
      case '4h':
      case '1D':
        return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
      default:
        return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
    }
  }

  private getDefaultConfig(symbol: string): PatternConfig {
    return {
      symbol,
      timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1D'],
      patterns: {
        squeeze: {
          enabled: true,
          bb_std: 2,    // 2 standard deviations for Bollinger Bands
          kc_mult: 1.5  // 1.5 multiplier for Keltner Channels
        },
        breakout: {
          enabled: true,
          volume_threshold: 1.5,  // 150% of average volume
          price_threshold: 0.01   // 1% price breakout
        },
        consolidation: {
          enabled: true,
          range_threshold: 0.02,  // 2% price range
          min_duration: 20        // Minimum 20 bars
        }
      },
      volume: {
        min_threshold: 100000,     // Minimum volume
        increase_threshold: 1.5    // 150% volume increase
      }
    };
  }

  private initializeDefaultConfigs(): void {
    const defaultSymbols = ['META', 'TSLA', 'SPY', 'QQQ', 'NFLX', 'NVDA'];
    defaultSymbols.forEach(symbol => {
      this.patternConfigs.set(symbol, this.getDefaultConfig(symbol));
    });
  }
}

// Export singleton instance
export const patternEngine = PatternRecognitionEngine.getInstance(); 