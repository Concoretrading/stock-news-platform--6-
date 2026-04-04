import { PolygonBar } from './polygon-data-provider';
import { Expert, ExpertOpinion, LearningSession } from './expert-council-system';

export interface SqueezePattern {
  timestamp: string;
  squeeze_type: 'SQUEEZE_ON' | 'SQUEEZE_OFF' | 'NO_SQUEEZE';
  squeeze_intensity: number; // 0-100
  momentum_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum_strength: number; // 0-100
  bb_width: number;
  kc_width: number;
  compression_ratio: number;
  breakout_potential: number;
  future_return: number;
  success: boolean;
}

export interface SqueezeKnowledge {
  squeeze_on_patterns: SqueezePattern[];
  squeeze_off_patterns: SqueezePattern[];
  momentum_signals: any[];
  success_rates: {
    squeeze_on_bullish: number;
    squeeze_on_bearish: number;
    squeeze_off_bullish: number;
    squeeze_off_bearish: number;
  };
  optimal_timeframes: string[];
}

export class MomentumSqueezeExpert implements Expert {
  name = 'Momentum Squeeze Expert';
  expertise_level = 0;
  patterns_learned = 0;
  success_rate = 0;
  confidence_threshold = 70; // Higher threshold due to specialized nature
  learning_history: LearningSession[] = [];
  current_opinion: ExpertOpinion | null = null;

  private squeeze_knowledge: SqueezeKnowledge = {
    squeeze_on_patterns: [],
    squeeze_off_patterns: [],
    momentum_signals: [],
    success_rates: {
      squeeze_on_bullish: 0,
      squeeze_on_bearish: 0,
      squeeze_off_bullish: 0,
      squeeze_off_bearish: 0
    },
    optimal_timeframes: []
  };

  async learnFromHistory(data: PolygonBar[], symbol: string): Promise<void> {
    console.log(`⚡ ${this.name} studying TTM Squeeze patterns for ${symbol}...`);
    
    const session_start = Date.now();
    const patterns_before = this.patterns_learned;
    
    // Deep analysis of squeeze patterns
    await this.analyzeSqueezePatterns(data);
    await this.analyzeMomentumHistograms(data);
    await this.analyzeBreakoutMomentum(data);
    await this.analyzeCompressionExpansion(data);
    
    const patterns_discovered = this.patterns_learned - patterns_before;
    
    // Calculate success rates for different squeeze scenarios
    this.calculateSqueezeSuccessRates();
    this.expertise_level = Math.min(100, this.patterns_learned * 0.4);
    this.success_rate = this.calculateOverallSuccessRate();
    
    // Store learning session
    this.learning_history.push({
      date: new Date().toISOString(),
      patterns_analyzed: data.length,
      new_patterns_discovered: patterns_discovered,
      accuracy_improvement: this.success_rate - (this.learning_history[this.learning_history.length - 1]?.accuracy_improvement || 0),
      key_insights: this.generateSqueezeInsights()
    });

    console.log(`⚡ ${this.name} learned ${patterns_discovered} squeeze patterns`);
    console.log(`🎯 Expertise level: ${this.expertise_level.toFixed(1)}%`);
    console.log(`📊 Squeeze success rates:`);
    console.log(`   Squeeze ON Bullish: ${this.squeeze_knowledge.success_rates.squeeze_on_bullish.toFixed(1)}%`);
    console.log(`   Squeeze OFF Bullish: ${this.squeeze_knowledge.success_rates.squeeze_off_bullish.toFixed(1)}%`);
  }

  async formOpinion(currentData: PolygonBar[], lookback: number = 20): Promise<ExpertOpinion> {
    if (this.expertise_level < this.confidence_threshold) {
      return {
        expert_name: this.name,
        signal: 'HOLD',
        confidence: 20,
        reasoning: ['Insufficient squeeze expertise - need more learning'],
        supporting_patterns: [],
        risk_assessment: 50,
        target_return: 0,
        time_horizon: 0,
        conditions: ['Need more squeeze pattern data']
      };
    }

    const recent_data = currentData.slice(-lookback * 2); // Need more data for squeeze calculations
    
    // Calculate current squeeze status
    const current_squeeze = this.calculateCurrentSqueeze(recent_data);
    const momentum_analysis = this.analyzeMomentumHistogram(recent_data);
    const trend_analysis = this.analyzeSqueezemTrend(recent_data);
    
    let confidence = 0;
    let target_return = 0;
    const signals: string[] = [];
    const patterns: string[] = [];
    let final_signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';

    // Analyze squeeze conditions
    if (current_squeeze.is_squeezed) {
      // Squeeze is ON - look for breakout setup
      if (momentum_analysis.direction === 'BULLISH' && momentum_analysis.strength > 60) {
        signals.push(`Squeeze ON with bullish momentum building`);
        patterns.push(`TTM Squeeze compression with ${momentum_analysis.strength}% bullish momentum`);
        confidence += 35;
        target_return += this.squeeze_knowledge.success_rates.squeeze_on_bullish * 0.1;
        
        if (trend_analysis.momentum_divergence > 0.3) {
          signals.push('Positive momentum divergence detected');
          confidence += 20;
          target_return += 2;
        }
      } else if (momentum_analysis.direction === 'BEARISH' && momentum_analysis.strength > 60) {
        signals.push(`Squeeze ON with bearish momentum building`);
        patterns.push(`TTM Squeeze compression with ${momentum_analysis.strength}% bearish momentum`);
        confidence += 30;
        target_return -= this.squeeze_knowledge.success_rates.squeeze_on_bearish * 0.1;
      }
    } else if (current_squeeze.just_fired) {
      // Squeeze just fired - major breakout signal
      if (momentum_analysis.direction === 'BULLISH') {
        signals.push('🚀 SQUEEZE FIRED - Bullish breakout confirmed!');
        patterns.push(`TTM Squeeze breakout with ${current_squeeze.breakout_strength}% momentum`);
        confidence += 50;
        target_return += this.squeeze_knowledge.success_rates.squeeze_off_bullish * 0.15;
        
        if (current_squeeze.breakout_strength > 80) {
          final_signal = 'STRONG_BUY';
          confidence += 25;
          target_return += 3;
        } else {
          final_signal = 'BUY';
        }
      } else if (momentum_analysis.direction === 'BEARISH') {
        signals.push('📉 SQUEEZE FIRED - Bearish breakout confirmed!');
        patterns.push(`TTM Squeeze breakdown with ${current_squeeze.breakout_strength}% momentum`);
        confidence += 45;
        target_return -= this.squeeze_knowledge.success_rates.squeeze_off_bearish * 0.15;
        
        if (current_squeeze.breakout_strength > 80) {
          final_signal = 'STRONG_SELL';
        } else {
          final_signal = 'SELL';
        }
      }
    }

    // Additional momentum confirmations
    if (this.detectMomentumAcceleration(recent_data)) {
      signals.push('Momentum acceleration detected');
      confidence += 15;
      target_return += 1.5;
    }

    if (this.detectVolumeSqueezeConfirmation(recent_data)) {
      signals.push('Volume confirms squeeze setup');
      confidence += 10;
    }

    // Apply expertise weighting
    confidence = Math.min(confidence * (this.expertise_level / 100), 95);

    this.current_opinion = {
      expert_name: this.name,
      signal: final_signal,
      confidence: confidence,
      reasoning: [
        `TTM Squeeze analysis based on ${this.patterns_learned} learned patterns`,
        `Current squeeze status: ${current_squeeze.is_squeezed ? 'ON' : 'OFF'}`,
        ...signals
      ],
      supporting_patterns: patterns,
      risk_assessment: this.calculateSqueezeRisk(current_squeeze, momentum_analysis),
      target_return: target_return,
      time_horizon: this.estimateSqueezeTimeHorizon(current_squeeze),
      conditions: this.generateSqueezeConditions(current_squeeze, momentum_analysis)
    };

    return this.current_opinion;
  }

  private async analyzeSqueezePatterns(data: PolygonBar[]): Promise<void> {
    const period = 20;
    const squeeze_patterns: SqueezePattern[] = [];
    
    for (let i = period; i < data.length - 10; i++) {
      const window = data.slice(i - period, i + 1);
      
      // Calculate Bollinger Bands
      const bb = this.calculateBollingerBands(window, period, 2);
      
      // Calculate Keltner Channels
      const kc = this.calculateKeltnerChannels(window, period, 1.5);
      
      // Check for squeeze condition
      const is_squeezed = bb.upper < kc.upper && bb.lower > kc.lower;
      
      if (is_squeezed || this.wasRecentlySqueezed(squeeze_patterns)) {
        const momentum = this.calculateMomentumHistogram(window);
        const compression_ratio = (bb.upper - bb.lower) / (kc.upper - kc.lower);
        
        const future_return = this.calculateFutureReturn(data, i, 10);
        const success = Math.abs(future_return) > 2; // 2% minimum move
        
        const pattern: SqueezePattern = {
          timestamp: new Date(data[i].t).toISOString(),
          squeeze_type: is_squeezed ? 'SQUEEZE_ON' : 'SQUEEZE_OFF',
          squeeze_intensity: this.calculateSqueezeIntensity(bb, kc),
          momentum_direction: momentum > 0 ? 'BULLISH' : momentum < 0 ? 'BEARISH' : 'NEUTRAL',
          momentum_strength: Math.abs(momentum) * 100,
          bb_width: bb.upper - bb.lower,
          kc_width: kc.upper - kc.lower,
          compression_ratio: compression_ratio,
          breakout_potential: this.calculateBreakoutPotential(window),
          future_return: future_return,
          success: success
        };
        
        squeeze_patterns.push(pattern);
        
        if (is_squeezed) {
          this.squeeze_knowledge.squeeze_on_patterns.push(pattern);
        } else {
          this.squeeze_knowledge.squeeze_off_patterns.push(pattern);
        }
        
        this.patterns_learned++;
      }
    }
  }

  private calculateBollingerBands(data: PolygonBar[], period: number, stdDev: number): { upper: number; lower: number; middle: number } {
    const closes = data.map(bar => bar.c);
    const sma = closes.reduce((sum, close) => sum + close, 0) / closes.length;
    
    const variance = closes.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / closes.length;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (std * stdDev),
      lower: sma - (std * stdDev),
      middle: sma
    };
  }

  private calculateKeltnerChannels(data: PolygonBar[], period: number, multiplier: number): { upper: number; lower: number; middle: number } {
    const closes = data.map(bar => bar.c);
    const ema = this.calculateEMA(closes, period);
    
    const atr = this.calculateATR(data, period);
    
    return {
      upper: ema + (atr * multiplier),
      lower: ema - (atr * multiplier),
      middle: ema
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateATR(data: PolygonBar[], period: number): number {
    const trueRanges = [];
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].h;
      const low = data[i].l;
      const prevClose = data[i - 1].c;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trueRanges.push(tr);
    }
    
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  private calculateMomentumHistogram(data: PolygonBar[]): number {
    if (data.length < 12) return 0;
    
    // Simplified momentum calculation
    const fast_ma = this.calculateEMA(data.slice(-12).map(d => d.c), 12);
    const slow_ma = this.calculateEMA(data.slice(-26).map(d => d.c), 26);
    const signal_ma = this.calculateEMA([fast_ma - slow_ma], 9);
    
    return (fast_ma - slow_ma) - signal_ma;
  }

  private calculateCurrentSqueeze(data: PolygonBar[]): any {
    if (data.length < 20) return { is_squeezed: false, just_fired: false };
    
    const recent = data.slice(-20);
    const bb = this.calculateBollingerBands(recent, 20, 2);
    const kc = this.calculateKeltnerChannels(recent, 20, 1.5);
    
    const is_squeezed = bb.upper < kc.upper && bb.lower > kc.lower;
    
    // Check if squeeze just ended
    const prev_data = data.slice(-21, -1);
    const prev_bb = this.calculateBollingerBands(prev_data, 20, 2);
    const prev_kc = this.calculateKeltnerChannels(prev_data, 20, 1.5);
    const was_squeezed = prev_bb.upper < prev_kc.upper && prev_bb.lower > prev_kc.lower;
    
    return {
      is_squeezed,
      just_fired: was_squeezed && !is_squeezed,
      breakout_strength: !is_squeezed ? this.calculateBreakoutStrength(bb, kc) : 0
    };
  }

  private analyzeMomentumHistogram(data: PolygonBar[]): any {
    const momentum = this.calculateMomentumHistogram(data);
    const prev_momentum = data.length > 1 ? this.calculateMomentumHistogram(data.slice(0, -1)) : 0;
    
    return {
      direction: momentum > 0 ? 'BULLISH' : momentum < 0 ? 'BEARISH' : 'NEUTRAL',
      strength: Math.min(Math.abs(momentum) * 1000, 100), // Scale to 0-100
      acceleration: momentum - prev_momentum,
      divergence: this.checkMomentumDivergence(data)
    };
  }

  private calculateSqueezeSuccessRates(): void {
    const on_bullish = this.squeeze_knowledge.squeeze_on_patterns.filter(p => 
      p.momentum_direction === 'BULLISH'
    );
    const on_bearish = this.squeeze_knowledge.squeeze_on_patterns.filter(p => 
      p.momentum_direction === 'BEARISH'
    );
    const off_bullish = this.squeeze_knowledge.squeeze_off_patterns.filter(p => 
      p.momentum_direction === 'BULLISH'
    );
    const off_bearish = this.squeeze_knowledge.squeeze_off_patterns.filter(p => 
      p.momentum_direction === 'BEARISH'
    );

    this.squeeze_knowledge.success_rates = {
      squeeze_on_bullish: on_bullish.length > 0 ? 
        on_bullish.filter(p => p.success).length / on_bullish.length * 100 : 0,
      squeeze_on_bearish: on_bearish.length > 0 ? 
        on_bearish.filter(p => p.success).length / on_bearish.length * 100 : 0,
      squeeze_off_bullish: off_bullish.length > 0 ? 
        off_bullish.filter(p => p.success).length / off_bullish.length * 100 : 0,
      squeeze_off_bearish: off_bearish.length > 0 ? 
        off_bearish.filter(p => p.success).length / off_bearish.length * 100 : 0
    };
  }

  private generateSqueezeInsights(): string[] {
    const insights = [];
    const rates = this.squeeze_knowledge.success_rates;
    
    if (rates.squeeze_off_bullish > 70) {
      insights.push(`Bullish squeeze breakouts have ${rates.squeeze_off_bullish.toFixed(1)}% success rate - high confidence signal`);
    }
    
    if (rates.squeeze_on_bullish > 60) {
      insights.push(`Squeeze compression with bullish momentum: ${rates.squeeze_on_bullish.toFixed(1)}% success rate`);
    }
    
    const total_patterns = this.squeeze_knowledge.squeeze_on_patterns.length + 
                          this.squeeze_knowledge.squeeze_off_patterns.length;
    
    if (total_patterns > 50) {
      insights.push(`Analyzed ${total_patterns} squeeze patterns with robust statistical confidence`);
    }
    
    return insights;
  }

  // Helper methods
  private calculateFutureReturn(data: PolygonBar[], index: number, bars: number): number {
    if (index + bars >= data.length) return 0;
    return ((data[index + bars].c - data[index].c) / data[index].c) * 100;
  }

  private calculateOverallSuccessRate(): number {
    const all_patterns = [...this.squeeze_knowledge.squeeze_on_patterns, ...this.squeeze_knowledge.squeeze_off_patterns];
    if (all_patterns.length === 0) return 0;
    return all_patterns.filter(p => p.success).length / all_patterns.length * 100;
  }

  // Placeholder methods to be implemented
  private wasRecentlySqueezed(patterns: SqueezePattern[]): boolean { return false; }
  private calculateSqueezeIntensity(bb: any, kc: any): number { return 50; }
  private calculateBreakoutPotential(data: PolygonBar[]): number { return 50; }
  private analyzeMomentumHistograms(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeBreakoutMomentum(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeCompressionExpansion(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeSqueezemTrend(data: PolygonBar[]): any { return { momentum_divergence: 0 }; }
  private detectMomentumAcceleration(data: PolygonBar[]): boolean { return false; }
  private detectVolumeSqueezeConfirmation(data: PolygonBar[]): boolean { return false; }
  private calculateSqueezeRisk(squeeze: any, momentum: any): number { return 40; }
  private estimateSqueezeTimeHorizon(squeeze: any): number { return 5; }
  private generateSqueezeConditions(squeeze: any, momentum: any): string[] { 
    return ['Wait for squeeze confirmation', 'Monitor momentum direction']; 
  }
  private calculateBreakoutStrength(bb: any, kc: any): number { return 50; }
  private checkMomentumDivergence(data: PolygonBar[]): number { return 0; }
} 