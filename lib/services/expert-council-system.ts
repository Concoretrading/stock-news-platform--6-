import { PolygonBar } from './polygon-data-provider';
import { MomentumSqueezeExpert } from './momentum-squeeze-expert';

// Individual Expert Interfaces
export interface Expert {
  name: string;
  expertise_level: number; // 0-100
  patterns_learned: number;
  success_rate: number;
  confidence_threshold: number;
  learning_history: LearningSession[];
  current_opinion: ExpertOpinion | null;
  learnFromHistory(data: PolygonBar[], symbol: string): Promise<void>;
  formOpinion(currentData: PolygonBar[], lookback?: number): Promise<ExpertOpinion>;
}

export interface LearningSession {
  date: string;
  patterns_analyzed: number;
  new_patterns_discovered: number;
  accuracy_improvement: number;
  key_insights: string[];
}

export interface ExpertOpinion {
  expert_name: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  reasoning: string[];
  supporting_patterns: string[];
  risk_assessment: number; // 0-100 (higher = riskier)
  target_return: number;
  time_horizon: number; // bars
  conditions: string[];
}

export interface CouncilDecision {
  timestamp: string;
  symbol: string;
  unanimous: boolean;
  majority_signal: string;
  confidence_score: number;
  participating_experts: string[];
  dissenting_opinions: ExpertOpinion[];
  final_recommendation: {
    action: string;
    confidence: number;
    target_return: number;
    max_risk: number;
    entry_conditions: string[];
    exit_conditions: string[];
  };
  reasoning: string;
}

// Specialized Expert Classes
export class VolumeExpert implements Expert {
  name = 'Volume Expert';
  expertise_level = 0;
  patterns_learned = 0;
  success_rate = 0;
  confidence_threshold = 60;
  learning_history: LearningSession[] = [];
  current_opinion: ExpertOpinion | null = null;

  private patterns: Map<string, any> = new Map();
  private knowledge_base: Map<string, any> = new Map();

  async learnFromHistory(data: PolygonBar[], symbol: string): Promise<void> {
    console.log(`🎓 ${this.name} is studying volume patterns for ${symbol}...`);

    const session_start = Date.now();
    const patterns_before = this.patterns_learned;

    // Deep volume pattern analysis
    await this.analyzeVolumeSpikes(data);
    await this.analyzeVolumeAccumulation(data);
    await this.analyzeVolumeDistribution(data);
    await this.analyzeVolumeBreakouts(data);
    await this.analyzeVolumeDivergence(data);

    const patterns_discovered = this.patterns_learned - patterns_before;

    // Calculate learning metrics
    const accuracy = this.calculatePatternAccuracy();
    this.success_rate = accuracy;
    this.expertise_level = Math.min(100, this.expertise_level + patterns_discovered * 0.5);

    // Store learning session
    this.learning_history.push({
      date: new Date().toISOString(),
      patterns_analyzed: data.length,
      new_patterns_discovered: patterns_discovered,
      accuracy_improvement: accuracy - (this.success_rate || 0),
      key_insights: this.generateKeyInsights()
    });

    console.log(`📊 ${this.name} learned ${patterns_discovered} new patterns`);
    console.log(`🎯 Expertise level: ${this.expertise_level.toFixed(1)}%`);
    console.log(`✅ Success rate: ${this.success_rate.toFixed(1)}%`);
  }

  async formOpinion(currentData: PolygonBar[], lookback: number = 20): Promise<ExpertOpinion> {
    if (this.expertise_level < 30) {
      return {
        expert_name: this.name,
        signal: 'HOLD',
        confidence: 20,
        reasoning: ['Insufficient expertise - still learning'],
        supporting_patterns: [],
        risk_assessment: 50,
        target_return: 0,
        time_horizon: 0,
        conditions: ['Need more learning data']
      };
    }

    const recent_data = currentData.slice(-lookback);
    const signals: string[] = [];
    const patterns: string[] = [];
    let confidence = 0;
    let target_return = 0;

    // Analyze current volume patterns
    const volume_spike = this.detectVolumeSpike(recent_data);
    if (volume_spike.detected) {
      signals.push(volume_spike.signal);
      patterns.push(volume_spike.pattern);
      confidence += volume_spike.confidence;
      target_return += volume_spike.expected_return;
    }

    const accumulation = this.detectAccumulation(recent_data);
    if (accumulation.detected) {
      signals.push(accumulation.signal);
      patterns.push(accumulation.pattern);
      confidence += accumulation.confidence;
      target_return += accumulation.expected_return;
    }

    const breakout_volume = this.detectBreakoutVolume(recent_data);
    if (breakout_volume.detected) {
      signals.push(breakout_volume.signal);
      patterns.push(breakout_volume.pattern);
      confidence += breakout_volume.confidence;
      target_return += breakout_volume.expected_return;
    }

    // Determine final signal
    let final_signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';

    if (confidence > 80 && target_return > 5) final_signal = 'STRONG_BUY';
    else if (confidence > 60 && target_return > 3) final_signal = 'BUY';
    else if (confidence > 40 && target_return < -3) final_signal = 'SELL';
    else if (confidence > 70 && target_return < -5) final_signal = 'STRONG_SELL';

    this.current_opinion = {
      expert_name: this.name,
      signal: final_signal,
      confidence: Math.min(confidence, this.expertise_level),
      reasoning: [
        `Volume analysis based on ${this.patterns_learned} learned patterns`,
        ...signals
      ],
      supporting_patterns: patterns,
      risk_assessment: this.calculateRiskAssessment(recent_data),
      target_return: target_return,
      time_horizon: this.estimateTimeHorizon(patterns),
      conditions: this.generateEntryConditions(patterns)
    };

    return this.current_opinion;
  }

  private async analyzeVolumeSpikes(data: PolygonBar[]): Promise<void> {
    const spike_patterns = [];

    for (let i = 20; i < data.length - 10; i++) {
      const current_volume = data[i].v;
      const avg_volume = data.slice(i - 20, i).reduce((sum, bar) => sum + bar.v, 0) / 20;

      if (current_volume > avg_volume * 2.5) {
        const future_return = this.calculateFutureReturn(data, i, 5);
        const pattern_success = future_return > 2;

        spike_patterns.push({
          type: 'volume_spike',
          multiplier: current_volume / avg_volume,
          success: pattern_success,
          return: future_return,
          context: this.getMarketContext(data, i)
        });

        this.patterns_learned++;
      }
    }

    this.knowledge_base.set('volume_spikes', spike_patterns);
  }

  private calculateFutureReturn(data: PolygonBar[], index: number, bars: number): number {
    if (index + bars >= data.length) return 0;
    return ((data[index + bars].c - data[index].c) / data[index].c) * 100;
  }

  private calculatePatternAccuracy(): number {
    const all_patterns = Array.from(this.knowledge_base.values()).flat();
    if (all_patterns.length === 0) return 0;

    const successful = all_patterns.filter((p: any) => p.success).length;
    return (successful / all_patterns.length) * 100;
  }

  private generateKeyInsights(): string[] {
    const insights = [];

    const spikes = this.knowledge_base.get('volume_spikes') || [];
    if (spikes.length > 10) {
      const avg_multiplier = spikes.reduce((sum: number, s: any) => sum + s.multiplier, 0) / spikes.length;
      const success_rate = spikes.filter((s: any) => s.success).length / spikes.length * 100;
      insights.push(`Volume spikes averaging ${avg_multiplier.toFixed(1)}x have ${success_rate.toFixed(1)}% success rate`);
    }

    return insights;
  }

  // Additional methods for pattern detection
  private detectVolumeSpike(data: PolygonBar[]): any {
    const current = data[data.length - 1];
    const avg_volume = data.slice(-10).reduce((sum, bar) => sum + bar.v, 0) / 10;

    if (current.v > avg_volume * 2) {
      return {
        detected: true,
        signal: 'Strong volume confirmation',
        pattern: `${(current.v / avg_volume).toFixed(1)}x volume spike`,
        confidence: Math.min(40, (current.v / avg_volume) * 10),
        expected_return: 3
      };
    }

    return { detected: false };
  }

  private detectAccumulation(data: PolygonBar[]): any { return { detected: false }; }
  private detectBreakoutVolume(data: PolygonBar[]): any { return { detected: false }; }
  private calculateRiskAssessment(data: PolygonBar[]): number { return 30; }
  private estimateTimeHorizon(patterns: string[]): number { return 5; }
  private generateEntryConditions(patterns: string[]): string[] { return ['Volume confirmation']; }
  private getMarketContext(data: PolygonBar[], index: number): string { return 'neutral'; }
  private analyzeVolumeAccumulation(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeVolumeDistribution(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeVolumeBreakouts(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
  private analyzeVolumeDivergence(data: PolygonBar[]): Promise<void> { return Promise.resolve(); }
}

export class PriceActionExpert implements Expert {
  name = 'Price Action Expert';
  expertise_level = 0;
  patterns_learned = 0;
  success_rate = 0;
  confidence_threshold = 65;
  learning_history: LearningSession[] = [];
  current_opinion: ExpertOpinion | null = null;

  private patterns: Map<string, any> = new Map();
  private candlestick_library: Map<string, any> = new Map();

  async learnFromHistory(data: PolygonBar[], symbol: string): Promise<void> {
    console.log(`🕯️ ${this.name} is studying price action for ${symbol}...`);

    // Learn candlestick patterns
    await this.learnCandlestickPatterns(data);
    await this.learnSupportResistanceLevels(data);
    await this.learnTrendPatterns(data);
    await this.learnConsolidationBreakouts(data);

    this.expertise_level = Math.min(100, this.patterns_learned * 0.3);
    this.success_rate = this.calculatePatternAccuracy();

    console.log(`🕯️ ${this.name} expertise: ${this.expertise_level.toFixed(1)}%`);
  }

  async formOpinion(currentData: PolygonBar[], lookback: number = 20): Promise<ExpertOpinion> {
    // Similar structure to VolumeExpert but focused on price action
    return {
      expert_name: this.name,
      signal: 'HOLD',
      confidence: this.expertise_level * 0.6,
      reasoning: ['Price action analysis in progress'],
      supporting_patterns: [],
      risk_assessment: 40,
      target_return: 2,
      time_horizon: 8,
      conditions: ['Clean price action setup']
    };
  }

  private async learnCandlestickPatterns(data: PolygonBar[]): Promise<void> {
    // Implement candlestick pattern learning
    this.patterns_learned += 50; // Placeholder
  }

  private calculatePatternAccuracy(): number { return 55; }
  private async learnSupportResistanceLevels(data: PolygonBar[]): Promise<void> { }
  private async learnTrendPatterns(data: PolygonBar[]): Promise<void> { }
  private async learnConsolidationBreakouts(data: PolygonBar[]): Promise<void> { }
}

// Expert Council Coordinator
export class ExpertCouncil {
  private experts: Expert[] = [];
  private decision_history: CouncilDecision[] = [];

  constructor() {
    this.experts = [
      new VolumeExpert(),
      new PriceActionExpert(),
      new MomentumSqueezeExpert(), // TTM Squeeze specialist
      // Will add more experts: SupportResistanceExpert, PremiumExpert
    ];
  }

  async trainAllExperts(data: PolygonBar[], symbol: string): Promise<void> {
    console.log(`🎓 Training Expert Council on ${symbol}...`);

    for (const expert of this.experts) {
      await expert.learnFromHistory(data, symbol);
    }

    console.log(`🧠 Council Training Complete:`);
    this.experts.forEach(expert => {
      console.log(`  ${expert.name}: ${expert.expertise_level.toFixed(1)}% expertise`);
    });
  }

  async makeCouncilDecision(currentData: PolygonBar[], symbol: string): Promise<CouncilDecision> {
    console.log(`🏛️ Expert Council convening for ${symbol}...`);

    // Get opinions from all qualified experts
    const opinions: ExpertOpinion[] = [];
    for (const expert of this.experts) {
      if (expert.expertise_level >= expert.confidence_threshold) {
        const opinion = await expert.formOpinion(currentData);
        opinions.push(opinion);
        console.log(`${expert.name}: ${opinion.signal} (${opinion.confidence}% confidence)`);
      }
    }

    if (opinions.length === 0) {
      return this.createNoConsensusDecision(symbol);
    }

    // Analyze consensus
    const signal_counts = this.countSignals(opinions);
    const majority_signal = this.findMajoritySignal(signal_counts);
    const is_unanimous = this.checkUnanimity(opinions);

    // Calculate weighted confidence
    const weighted_confidence = this.calculateWeightedConfidence(opinions);

    // Generate final recommendation
    const recommendation = this.generateRecommendation(opinions, majority_signal);

    const decision: CouncilDecision = {
      timestamp: new Date().toISOString(),
      symbol,
      unanimous: is_unanimous,
      majority_signal,
      confidence_score: weighted_confidence,
      participating_experts: opinions.map(o => o.expert_name),
      dissenting_opinions: this.findDissentingOpinions(opinions, majority_signal),
      final_recommendation: recommendation,
      reasoning: this.generateCouncilReasoning(opinions, majority_signal)
    };

    this.decision_history.push(decision);

    console.log(`📋 Council Decision: ${majority_signal} with ${weighted_confidence.toFixed(1)}% confidence`);
    console.log(`🎯 Target Return: ${recommendation.target_return}%`);

    return decision;
  }

  private countSignals(opinions: ExpertOpinion[]): Record<string, number> {
    const counts: Record<string, number> = {};
    opinions.forEach(opinion => {
      counts[opinion.signal] = (counts[opinion.signal] || 0) + 1;
    });
    return counts;
  }

  private findMajoritySignal(counts: Record<string, number>): string {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'HOLD';
  }

  private checkUnanimity(opinions: ExpertOpinion[]): boolean {
    if (opinions.length <= 1) return true;
    const first_signal = opinions[0].signal;
    return opinions.every(opinion => opinion.signal === first_signal);
  }

  private calculateWeightedConfidence(opinions: ExpertOpinion[]): number {
    if (opinions.length === 0) return 0;

    const total_weight = opinions.reduce((sum, opinion) => {
      const expert = this.experts.find(e => e.name === opinion.expert_name);
      return sum + (expert?.expertise_level || 50);
    }, 0);

    const weighted_confidence = opinions.reduce((sum, opinion) => {
      const expert = this.experts.find(e => e.name === opinion.expert_name);
      const weight = (expert?.expertise_level || 50) / total_weight;
      return sum + (opinion.confidence * weight);
    }, 0);

    return weighted_confidence;
  }

  private generateRecommendation(opinions: ExpertOpinion[], majority_signal: string): any {
    const avg_target = opinions.reduce((sum, o) => sum + o.target_return, 0) / opinions.length;
    const max_risk = Math.max(...opinions.map(o => o.risk_assessment));

    return {
      action: majority_signal,
      confidence: this.calculateWeightedConfidence(opinions),
      target_return: avg_target,
      max_risk,
      entry_conditions: Array.from(new Set(opinions.flatMap(o => o.conditions))),
      exit_conditions: ['Target reached', 'Stop loss hit', 'Expert consensus changes']
    };
  }

  private findDissentingOpinions(opinions: ExpertOpinion[], majority: string): ExpertOpinion[] {
    return opinions.filter(opinion => opinion.signal !== majority);
  }

  private generateCouncilReasoning(opinions: ExpertOpinion[], majority: string): string {
    const expert_count = opinions.length;
    const consensus_strength = opinions.filter(o => o.signal === majority).length / expert_count;

    return `${expert_count} experts participated with ${(consensus_strength * 100).toFixed(0)}% agreement on ${majority}. ` +
      `Key factors: ${opinions.flatMap(o => o.reasoning).slice(0, 3).join(', ')}`;
  }

  private createNoConsensusDecision(symbol: string): CouncilDecision {
    return {
      timestamp: new Date().toISOString(),
      symbol,
      unanimous: false,
      majority_signal: 'HOLD',
      confidence_score: 10,
      participating_experts: [],
      dissenting_opinions: [],
      final_recommendation: {
        action: 'HOLD',
        confidence: 10,
        target_return: 0,
        max_risk: 100,
        entry_conditions: ['Wait for expert consensus'],
        exit_conditions: ['Manual review required']
      },
      reasoning: 'Insufficient expert consensus - more learning required'
    };
  }

  getCouncilStatus(): any {
    return {
      total_experts: this.experts.length,
      qualified_experts: this.experts.filter(e => e.expertise_level >= e.confidence_threshold).length,
      avg_expertise: this.experts.reduce((sum, e) => sum + e.expertise_level, 0) / this.experts.length,
      decisions_made: this.decision_history.length,
      experts_status: this.experts.map(expert => ({
        name: expert.name,
        expertise_level: expert.expertise_level,
        patterns_learned: expert.patterns_learned,
        success_rate: expert.success_rate,
        qualified: expert.expertise_level >= expert.confidence_threshold
      }))
    };
  }
} 