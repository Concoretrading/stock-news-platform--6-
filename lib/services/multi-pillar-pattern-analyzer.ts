import { PolygonBar } from './polygon-data-provider';

export interface PillarPattern {
  id: string;
  type: 'volume' | 'support_resistance' | 'price_action' | 'momentum' | 'premium';
  pattern_name: string;
  description: string;
  timestamp: string;
  setup_conditions: string[];
  success_rate: number;
  avg_return: number;
  max_return: number;
  sample_size: number;
  confidence_score: number;
  timeframe: string;
}

export interface CombinedPattern {
  id: string;
  timestamp: string;
  pillars_involved: string[];
  pattern_combination: string;
  overall_success_rate: number;
  avg_return: number;
  max_return: number;
  confidence_score: number;
  setup_description: string;
  entry_signals: string[];
  risk_reward_ratio: number;
  hold_duration: number;
}

export interface PatternAnalysisResult {
  symbol: string;
  timeframe: string;
  date_range: { start: string; end: string };
  individual_pillars: {
    volume: PillarPattern[];
    support_resistance: PillarPattern[];
    price_action: PillarPattern[];
    momentum: PillarPattern[];
    premium: PillarPattern[];
  };
  combined_patterns: CombinedPattern[];
  statistics: {
    total_patterns: number;
    best_performing_pillar: string;
    highest_success_rate_combo: CombinedPattern | null;
    avg_success_rates: Record<string, number>;
  };
}

export class MultiPillarPatternAnalyzer {
  private patterns: Map<string, PillarPattern[]> = new Map();
  private combinedPatterns: CombinedPattern[] = [];

  async analyzeAllPillars(
    symbol: string,
    data: PolygonBar[],
    timeframe: string,
    startDate: string,
    endDate: string
  ): Promise<PatternAnalysisResult> {
    console.log(`🧠 Analyzing all pillars for ${symbol} (${timeframe})`);
    console.log(`📊 Processing ${data.length} bars`);

    // Phase 1: Analyze each pillar individually
    const volumePatterns = await this.analyzeVolumePillar(data, timeframe);
    const srPatterns = await this.analyzeSupportResistancePillar(data, timeframe);
    const priceActionPatterns = await this.analyzePriceActionPillar(data, timeframe);
    const momentumPatterns = await this.analyzeMomentumPillar(data, timeframe);
    const premiumPatterns = await this.analyzePremiumPillar(data, timeframe);

    // Store patterns
    this.patterns.set('volume', volumePatterns);
    this.patterns.set('support_resistance', srPatterns);
    this.patterns.set('price_action', priceActionPatterns);
    this.patterns.set('momentum', momentumPatterns);
    this.patterns.set('premium', premiumPatterns);

    // Phase 2: Find pattern combinations
    const combinedPatterns = await this.findPatternCombinations(data);

    // Phase 3: Calculate statistics
    const statistics = this.calculateStatistics();

    return {
      symbol,
      timeframe,
      date_range: { start: startDate, end: endDate },
      individual_pillars: {
        volume: volumePatterns,
        support_resistance: srPatterns,
        price_action: priceActionPatterns,
        momentum: momentumPatterns,
        premium: premiumPatterns
      },
      combined_patterns: combinedPatterns,
      statistics
    };
  }

  // 📊 VOLUME PILLAR ANALYSIS
  private async analyzeVolumePillar(data: PolygonBar[], timeframe: string): Promise<PillarPattern[]> {
    console.log(`📊 Analyzing Volume Pillar (${timeframe})`);
    const patterns: PillarPattern[] = [];

    // 1. Volume Spike Patterns
    const volumeSpikes = this.findVolumeSpikes(data, timeframe);
    patterns.push(...volumeSpikes);

    // 2. Volume Accumulation Patterns
    const accumulation = this.findVolumeAccumulation(data, timeframe);
    patterns.push(...accumulation);

    // 3. Volume Confirmation Patterns
    const confirmation = this.findVolumeConfirmation(data, timeframe);
    patterns.push(...confirmation);

    // 4. Volume Divergence Patterns
    const divergence = this.findVolumeDivergence(data, timeframe);
    patterns.push(...divergence);

    console.log(`📊 Found ${patterns.length} volume patterns`);
    return patterns;
  }

  // 🎯 SUPPORT/RESISTANCE PILLAR ANALYSIS
  private async analyzeSupportResistancePillar(data: PolygonBar[], timeframe: string): Promise<PillarPattern[]> {
    console.log(`🎯 Analyzing Support/Resistance Pillar (${timeframe})`);
    const patterns: PillarPattern[] = [];

    // 1. Level Test Patterns
    const levelTests = this.findLevelTests(data, timeframe);
    patterns.push(...levelTests);

    // 2. Breakout Patterns
    const breakouts = this.findSRBreakouts(data, timeframe);
    patterns.push(...breakouts);

    // 3. False Breakout Patterns
    const falseBreakouts = this.findFalseBreakouts(data, timeframe);
    patterns.push(...falseBreakouts);

    // 4. Level Strength Patterns
    const levelStrength = this.findLevelStrength(data, timeframe);
    patterns.push(...levelStrength);

    console.log(`🎯 Found ${patterns.length} support/resistance patterns`);
    return patterns;
  }

  // 🕯️ PRICE ACTION PILLAR ANALYSIS
  private async analyzePriceActionPillar(data: PolygonBar[], timeframe: string): Promise<PillarPattern[]> {
    console.log(`🕯️ Analyzing Price Action Pillar (${timeframe})`);
    const patterns: PillarPattern[] = [];

    // 1. Candle Formation Patterns
    const candlePatterns = this.findCandleFormations(data, timeframe);
    patterns.push(...candlePatterns);

    // 2. Consolidation Patterns
    const consolidation = this.findConsolidationPatterns(data, timeframe);
    patterns.push(...consolidation);

    // 3. Trend Patterns
    const trendPatterns = this.findTrendPatterns(data, timeframe);
    patterns.push(...trendPatterns);

    // 4. Gap Patterns
    const gapPatterns = this.findGapPatterns(data, timeframe);
    patterns.push(...gapPatterns);

    console.log(`🕯️ Found ${patterns.length} price action patterns`);
    return patterns;
  }

  // ⚡ MOMENTUM PILLAR ANALYSIS
  private async analyzeMomentumPillar(data: PolygonBar[], timeframe: string): Promise<PillarPattern[]> {
    console.log(`⚡ Analyzing Momentum Pillar (${timeframe})`);
    const patterns: PillarPattern[] = [];

    // Calculate indicators
    const rsi = this.calculateRSI(data, 14);
    const macd = this.calculateMACD(data);
    const stoch = this.calculateStochastic(data, 14, 3);

    // 1. RSI Patterns
    const rsiPatterns = this.findRSIPatterns(data, rsi, timeframe);
    patterns.push(...rsiPatterns);

    // 2. MACD Patterns
    const macdPatterns = this.findMACDPatterns(data, macd, timeframe);
    patterns.push(...macdPatterns);

    // 3. Stochastic Patterns
    const stochPatterns = this.findStochasticPatterns(data, stoch, timeframe);
    patterns.push(...stochPatterns);

    // 4. Momentum Divergence
    const divergencePatterns = this.findMomentumDivergence(data, rsi, timeframe);
    patterns.push(...divergencePatterns);

    console.log(`⚡ Found ${patterns.length} momentum patterns`);
    return patterns;
  }

  // 💰 PREMIUM PILLAR ANALYSIS
  private async analyzePremiumPillar(data: PolygonBar[], timeframe: string): Promise<PillarPattern[]> {
    console.log(`💰 Analyzing Premium Pillar (${timeframe})`);
    const patterns: PillarPattern[] = [];

    // 1. Premium Expansion Patterns
    const expansion = this.findPremiumExpansion(data, timeframe);
    patterns.push(...expansion);

    // 2. Premium Compression Patterns
    const compression = this.findPremiumCompression(data, timeframe);
    patterns.push(...compression);

    // 3. Premium Skew Patterns
    const skew = this.findPremiumSkew(data, timeframe);
    patterns.push(...skew);

    // 4. IV Crush Patterns
    const ivCrush = this.findIVCrushPatterns(data, timeframe);
    patterns.push(...ivCrush);

    console.log(`💰 Found ${patterns.length} premium patterns`);
    return patterns;
  }

  // 🔗 PATTERN COMBINATION FINDER
  private async findPatternCombinations(data: PolygonBar[]): Promise<CombinedPattern[]> {
    console.log(`🔗 Finding pattern combinations...`);
    const combinations: CombinedPattern[] = [];

    // Get all patterns with timestamps
    const allPatterns = Array.from(this.patterns.entries())
      .flatMap(([pillar, patterns]) =>
        patterns.map(p => ({ ...p, pillar }))
      );

    // Sort by timestamp
    allPatterns.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Find patterns that occur within time windows
    const timeWindow = 3; // bars

    for (let i = 0; i < allPatterns.length; i++) {
      const basePattern = allPatterns[i];
      const baseTime = new Date(basePattern.timestamp).getTime();

      // Find patterns within time window
      const nearbyPatterns = allPatterns.filter((p, index) => {
        if (index === i) return false;
        const pTime = new Date(p.timestamp).getTime();
        const timeDiff = Math.abs(pTime - baseTime);
        return timeDiff <= timeWindow * 60000; // Convert to milliseconds
      });

      if (nearbyPatterns.length > 0) {
        // Create combination
        const combo = this.createCombination(basePattern, nearbyPatterns, data);
        if (combo) {
          combinations.push(combo);
        }
      }
    }

    // Sort by success rate
    combinations.sort((a, b) => b.overall_success_rate - a.overall_success_rate);

    console.log(`🔗 Found ${combinations.length} pattern combinations`);
    return combinations.slice(0, 50); // Top 50 combinations
  }

  private createCombination(
    basePattern: any,
    nearbyPatterns: any[],
    data: PolygonBar[]
  ): CombinedPattern | null {
    const allPillars = [basePattern.pillar, ...nearbyPatterns.map(p => p.pillar)];
    const uniquePillars = Array.from(new Set(allPillars));

    // Calculate combined metrics
    const avgSuccessRate = [basePattern, ...nearbyPatterns]
      .reduce((sum, p) => sum + p.success_rate, 0) / (nearbyPatterns.length + 1);

    const avgReturn = [basePattern, ...nearbyPatterns]
      .reduce((sum, p) => sum + p.avg_return, 0) / (nearbyPatterns.length + 1);

    const maxReturn = Math.max(basePattern.max_return, ...nearbyPatterns.map(p => p.max_return));

    // Calculate confidence score based on pillar agreement
    const confidenceScore = Math.min(100, uniquePillars.length * 20 + avgSuccessRate * 0.5);

    return {
      id: `combo_${basePattern.id}_${Date.now()}`,
      timestamp: basePattern.timestamp,
      pillars_involved: uniquePillars,
      pattern_combination: `${basePattern.pattern_name} + ${nearbyPatterns.map(p => p.pattern_name).join(' + ')}`,
      overall_success_rate: avgSuccessRate,
      avg_return: avgReturn,
      max_return: maxReturn,
      confidence_score: confidenceScore,
      setup_description: `Multi-pillar setup with ${uniquePillars.length} confirming signals`,
      entry_signals: [basePattern.description, ...nearbyPatterns.map(p => p.description)],
      risk_reward_ratio: maxReturn / Math.max(Math.abs(avgReturn), 1),
      hold_duration: 5 // Default hold duration
    };
  }

  // VOLUME PATTERN FINDERS
  private findVolumeSpikes(data: PolygonBar[], timeframe: string): PillarPattern[] {
    const patterns: PillarPattern[] = [];
    const lookback = 20;

    for (let i = lookback; i < data.length - 10; i++) {
      const currentVolume = data[i].v;
      const avgVolume = data.slice(i - lookback, i)
        .reduce((sum, bar) => sum + bar.v, 0) / lookback;

      // Volume spike threshold (2x average)
      if (currentVolume > avgVolume * 2) {
        const futureReturn = this.calculateFutureReturn(data, i, 5);
        const maxReturn = this.calculateMaxReturn(data, i, 10);

        if (futureReturn > 1) { // Minimum 1% return
          patterns.push({
            id: `volume_spike_${i}`,
            type: 'volume',
            pattern_name: 'Volume Spike',
            description: `${(currentVolume / avgVolume).toFixed(1)}x volume spike`,
            timestamp: new Date(data[i].t).toISOString(),
            setup_conditions: [`Volume > ${avgVolume * 2}`, 'Price confirmation'],
            success_rate: 65, // Will be calculated based on sample
            avg_return: futureReturn,
            max_return: maxReturn,
            sample_size: 1,
            confidence_score: Math.min(90, currentVolume / avgVolume * 20),
            timeframe
          });
        }
      }
    }

    return patterns;
  }

  private findVolumeAccumulation(data: PolygonBar[], timeframe: string): PillarPattern[] {
    const patterns: PillarPattern[] = [];
    const period = 10;

    for (let i = period; i < data.length - 5; i++) {
      const recentBars = data.slice(i - period, i);
      const avgVolume = recentBars.reduce((sum, bar) => sum + bar.v, 0) / period;
      const priceChange = (data[i].c - data[i - period].c) / data[i - period].c * 100;

      // Look for accumulation (rising volume, stable/rising price)
      const volumeTrend = this.calculateVolumeTrend(recentBars);

      if (volumeTrend > 0.1 && priceChange > -2 && priceChange < 8) {
        const futureReturn = this.calculateFutureReturn(data, i, 10);

        if (futureReturn > 2) {
          patterns.push({
            id: `volume_accumulation_${i}`,
            type: 'volume',
            pattern_name: 'Volume Accumulation',
            description: `Steady volume increase with price stability`,
            timestamp: new Date(data[i].t).toISOString(),
            setup_conditions: ['Rising volume trend', 'Price stability', 'No major selloff'],
            success_rate: 58,
            avg_return: futureReturn,
            max_return: this.calculateMaxReturn(data, i, 15),
            sample_size: 1,
            confidence_score: 70,
            timeframe
          });
        }
      }
    }

    return patterns;
  }

  // Helper calculation methods
  private calculateFutureReturn(data: PolygonBar[], index: number, bars: number): number {
    if (index + bars >= data.length) return 0;
    return ((data[index + bars].c - data[index].c) / data[index].c) * 100;
  }

  private calculateMaxReturn(data: PolygonBar[], startIndex: number, lookAheadBars: number): number {
    const endIndex = Math.min(startIndex + lookAheadBars, data.length - 1);
    let maxPrice = data[startIndex].c;

    for (let i = startIndex; i <= endIndex; i++) {
      maxPrice = Math.max(maxPrice, data[i].h);
    }

    return ((maxPrice - data[startIndex].c) / data[startIndex].c) * 100;
  }

  private calculateVolumeTrend(bars: PolygonBar[]): number {
    if (bars.length < 2) return 0;
    const firstHalf = bars.slice(0, Math.floor(bars.length / 2));
    const secondHalf = bars.slice(Math.floor(bars.length / 2));

    const firstAvg = firstHalf.reduce((sum, bar) => sum + bar.v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, bar) => sum + bar.v, 0) / secondHalf.length;

    return (secondAvg - firstAvg) / firstAvg;
  }

  private calculateStatistics() {
    const allPatterns = Array.from(this.patterns.values()).flat();
    const pillarStats: Record<string, number> = {};

    for (const [pillar, patterns] of Array.from(this.patterns.entries())) {
      pillarStats[pillar] = patterns.length > 0 ?
        patterns.reduce((sum: number, p: PillarPattern) => sum + p.success_rate, 0) / patterns.length : 0;
    }

    const bestPillar = Object.entries(pillarStats)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

    const highestSuccessCombo = this.combinedPatterns
      .sort((a, b) => b.overall_success_rate - a.overall_success_rate)[0] || null;

    return {
      total_patterns: allPatterns.length,
      best_performing_pillar: bestPillar,
      highest_success_rate_combo: highestSuccessCombo,
      avg_success_rates: pillarStats
    };
  }

  // Placeholder methods for other pattern types
  private findVolumeConfirmation(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findVolumeDivergence(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findLevelTests(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findSRBreakouts(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findFalseBreakouts(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findLevelStrength(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findCandleFormations(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findConsolidationPatterns(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findTrendPatterns(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findGapPatterns(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findRSIPatterns(data: PolygonBar[], rsi: number[], timeframe: string): PillarPattern[] { return []; }
  private findMACDPatterns(data: PolygonBar[], macd: any[], timeframe: string): PillarPattern[] { return []; }
  private findStochasticPatterns(data: PolygonBar[], stoch: any[], timeframe: string): PillarPattern[] { return []; }
  private findMomentumDivergence(data: PolygonBar[], rsi: number[], timeframe: string): PillarPattern[] { return []; }
  private findPremiumExpansion(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findPremiumCompression(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findPremiumSkew(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }
  private findIVCrushPatterns(data: PolygonBar[], timeframe: string): PillarPattern[] { return []; }

  // Technical indicator calculations
  private calculateRSI(data: PolygonBar[], period: number): number[] {
    return data.map(() => 50); // Placeholder
  }

  private calculateMACD(data: PolygonBar[]): any[] {
    return data.map(() => ({ macd: 0, signal: 0, histogram: 0 })); // Placeholder
  }

  private calculateStochastic(data: PolygonBar[], kPeriod: number, dPeriod: number): any[] {
    return data.map(() => ({ k: 50, d: 50 })); // Placeholder
  }
} 