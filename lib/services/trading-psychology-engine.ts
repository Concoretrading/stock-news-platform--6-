// Trading Psychology Engine - Elite Trader Intelligence
// Analyzes market psychology, sentiment, and provides "when not to trade" intelligence

export interface MarketEmotionalState {
  primary_emotion: 'fear' | 'greed' | 'complacency' | 'uncertainty' | 'panic' | 'euphoria';
  intensity_level: number; // 0-100
  duration_days: number;
  historical_context: 'extreme' | 'elevated' | 'normal' | 'suppressed';
  regime_shift_probability: number; // 0-100
}

export interface CrowdBehaviorAnalysis {
  retail_sentiment: {
    bullish_percentage: number;
    put_call_ratio: number;
    social_media_sentiment: 'extremely_bullish' | 'bullish' | 'neutral' | 'bearish' | 'extremely_bearish';
    retail_flow: 'buying' | 'selling' | 'neutral';
    capitulation_signals: string[];
  };
  institutional_behavior: {
    smart_money_flow: 'accumulating' | 'distributing' | 'neutral';
    dark_pool_activity: 'high' | 'moderate' | 'low';
    insider_activity: 'buying' | 'selling' | 'neutral';
    hedge_fund_positioning: 'long_bias' | 'short_bias' | 'neutral';
  };
  divergence_score: number; // 0-100 (higher = more divergence between retail/institutional)
}

export interface MarketRegimeAnalysis {
  current_regime: 'bull_trending' | 'bear_trending' | 'bull_correcting' | 'bear_rallying' | 'sideways_consolidation';
  regime_confidence: number; // 0-100
  regime_age_days: number;
  transition_probability: {
    to_bull: number;
    to_bear: number;
    to_sideways: number;
  };
  supporting_factors: string[];
  contradicting_factors: string[];
}

export interface TradingEnvironmentQuality {
  overall_rating: 'PRIME' | 'EXCELLENT' | 'GOOD' | 'POOR' | 'AVOID';
  score: number; // 0-100
  factors: {
    volatility_environment: 'optimal' | 'acceptable' | 'challenging' | 'dangerous';
    trend_clarity: 'crystal_clear' | 'clear' | 'mixed' | 'unclear';
    volume_quality: 'strong' | 'adequate' | 'weak' | 'concerning';
    correlation_breakdown: boolean; // true = individual stocks moving independently
    sector_rotation_health: 'healthy' | 'stagnant' | 'chaotic';
  };
  reasoning: string[];
}

export interface PsychologicalTradeFilter {
  should_trade: boolean;
  confidence_level: number; // 0-100
  primary_concerns: string[];
  recommended_action: 'aggressive' | 'normal' | 'defensive' | 'cash' | 'hedge';
  time_horizon_adjustment: 'extend' | 'normal' | 'shorten' | 'exit';
  position_sizing_modifier: number; // 0.5 = half size, 1.0 = normal, 1.5 = oversized
}

export interface ThesisEvolutionTracking {
  original_thesis: string;
  current_validation_score: number; // 0-100
  time_elapsed_hours: number;
  supporting_developments: string[];
  contradicting_developments: string[];
  thesis_evolution: 'strengthening' | 'stable' | 'weakening' | 'invalidated';
  recommended_holding_period: 'minutes' | 'hours' | 'days' | 'weeks';
  patience_score: number; // 0-100 (higher = be more patient)
}

export interface PsychologyEngineOutput {
  timestamp: string;
  market_emotional_state: MarketEmotionalState;
  crowd_behavior: CrowdBehaviorAnalysis;
  market_regime: MarketRegimeAnalysis;
  trading_environment: TradingEnvironmentQuality;
  trade_filter: PsychologicalTradeFilter;
  key_insights: string[];
  actionable_intelligence: string[];
}

export class TradingPsychologyEngine {
  constructor() {
    this.initializePsychologyEngine();
  }

  private initializePsychologyEngine(): void {
    console.log('🧠 INITIALIZING TRADING PSYCHOLOGY ENGINE');
    console.log('😰 Loading fear/greed analysis models...');
    console.log('👥 Activating crowd behavior detection...');
    console.log('📊 Calibrating market regime analysis...');
    console.log('🎯 Setting up trade filtering intelligence...');
    console.log('⏰ Enabling thesis evolution tracking...');
  }

  async analyzeTradingPsychology(ticker: string): Promise<PsychologyEngineOutput> {
    console.log(`🧠 ANALYZING TRADING PSYCHOLOGY for ${ticker}...`);

    // Analyze current market emotional state
    const emotionalState = await this.analyzeMarketEmotionalState();
    
    // Analyze crowd behavior patterns
    const crowdBehavior = await this.analyzeCrowdBehavior();
    
    // Determine current market regime
    const marketRegime = await this.analyzeMarketRegime();
    
    // Assess trading environment quality
    const tradingEnvironment = await this.assessTradingEnvironment(
      emotionalState, 
      crowdBehavior, 
      marketRegime
    );
    
    // Generate psychological trade filter
    const tradeFilter = this.generateTradeFilter(
      emotionalState,
      crowdBehavior,
      marketRegime,
      tradingEnvironment
    );
    
    // Generate insights and actionable intelligence
    const insights = this.generateKeyInsights(emotionalState, crowdBehavior, marketRegime);
    const actionableIntelligence = this.generateActionableIntelligence(tradeFilter, tradingEnvironment);

    const result = {
      timestamp: new Date().toISOString(),
      market_emotional_state: emotionalState,
      crowd_behavior: crowdBehavior,
      market_regime: marketRegime,
      trading_environment: tradingEnvironment,
      trade_filter: tradeFilter,
      key_insights: insights,
      actionable_intelligence: actionableIntelligence
    };

    this.logPsychologyAnalysis(result);
    return result;
  }

  private async analyzeMarketEmotionalState(): Promise<MarketEmotionalState> {
    // This would integrate with real market data feeds
    // For now, providing sophisticated mock analysis
    
    const vixLevel = 16.5; // Mock VIX level
    const vixPercentile = 35; // 35th percentile
    const advanceDeclineRatio = 0.8; // More declines than advances
    
    let primaryEmotion: MarketEmotionalState['primary_emotion'];
    let intensity: number;
    let historicalContext: MarketEmotionalState['historical_context'];
    
    if (vixLevel > 30) {
      primaryEmotion = vixLevel > 40 ? 'panic' : 'fear';
      intensity = Math.min(100, (vixLevel - 15) * 3);
      historicalContext = 'extreme';
    } else if (vixLevel < 12) {
      primaryEmotion = vixLevel < 10 ? 'euphoria' : 'complacency';
      intensity = Math.max(20, (20 - vixLevel) * 4);
      historicalContext = vixLevel < 10 ? 'extreme' : 'suppressed';
    } else if (advanceDeclineRatio < 0.7) {
      primaryEmotion = 'uncertainty';
      intensity = 60;
      historicalContext = 'normal';
    } else {
      primaryEmotion = 'greed';
      intensity = 45;
      historicalContext = 'normal';
    }

    return {
      primary_emotion: primaryEmotion,
      intensity_level: intensity,
      duration_days: 8, // Mock duration
      historical_context: historicalContext,
      regime_shift_probability: intensity > 70 ? 75 : 25
    };
  }

  private async analyzeCrowdBehavior(): Promise<CrowdBehaviorAnalysis> {
    // Mock sophisticated crowd behavior analysis
    const putCallRatio = 1.15; // Elevated put buying (fear)
    const retailSentiment = 35; // Bearish
    
    return {
      retail_sentiment: {
        bullish_percentage: retailSentiment,
        put_call_ratio: putCallRatio,
        social_media_sentiment: retailSentiment < 40 ? 'bearish' : 'neutral',
        retail_flow: putCallRatio > 1.1 ? 'selling' : 'neutral',
        capitulation_signals: putCallRatio > 1.3 ? ['High put/call ratio', 'Social media despair'] : []
      },
      institutional_behavior: {
        smart_money_flow: 'accumulating', // Contrarian to retail
        dark_pool_activity: 'high',
        insider_activity: 'buying',
        hedge_fund_positioning: 'long_bias'
      },
      divergence_score: 75 // High divergence = opportunity
    };
  }

  private async analyzeMarketRegime(): Promise<MarketRegimeAnalysis> {
    // Mock regime analysis - this would use real market data
    return {
      current_regime: 'bull_correcting',
      regime_confidence: 78,
      regime_age_days: 45,
      transition_probability: {
        to_bull: 60,
        to_bear: 15,
        to_sideways: 25
      },
      supporting_factors: [
        'Economic fundamentals remain strong',
        'Earnings growth continuing',
        'Fed policy supportive'
      ],
      contradicting_factors: [
        'Technical breakdown in progress',
        'Sector rotation suggesting defensive positioning'
      ]
    };
  }

  private async assessTradingEnvironment(
    emotional: MarketEmotionalState,
    crowd: CrowdBehaviorAnalysis,
    regime: MarketRegimeAnalysis
  ): Promise<TradingEnvironmentQuality> {
    
    let score = 50;
    const reasoning: string[] = [];
    
    // Emotional state impact
    if (emotional.primary_emotion === 'fear' && emotional.intensity_level > 60) {
      score += 20;
      reasoning.push('Fear creates opportunity for contrarian trades');
    } else if (emotional.primary_emotion === 'euphoria') {
      score -= 30;
      reasoning.push('Euphoria increases risk of reversals');
    }
    
    // Crowd behavior impact
    if (crowd.divergence_score > 70) {
      score += 15;
      reasoning.push('High retail/institutional divergence creates alpha opportunities');
    }
    
    // Regime clarity impact
    if (regime.regime_confidence > 75) {
      score += 10;
      reasoning.push('Clear market regime enables directional strategies');
    }
    
    score = Math.max(0, Math.min(100, score));
    
    let rating: TradingEnvironmentQuality['overall_rating'];
    if (score >= 85) rating = 'PRIME';
    else if (score >= 70) rating = 'EXCELLENT';
    else if (score >= 55) rating = 'GOOD';
    else if (score >= 35) rating = 'POOR';
    else rating = 'AVOID';

    return {
      overall_rating: rating,
      score,
      factors: {
        volatility_environment: emotional.intensity_level < 30 ? 'challenging' : 
                               emotional.intensity_level > 70 ? 'dangerous' : 'optimal',
        trend_clarity: regime.regime_confidence > 75 ? 'clear' : 'mixed',
        volume_quality: 'adequate', // Would analyze real volume data
        correlation_breakdown: crowd.divergence_score > 60,
        sector_rotation_health: 'healthy'
      },
      reasoning
    };
  }

  private generateTradeFilter(
    emotional: MarketEmotionalState,
    crowd: CrowdBehaviorAnalysis,
    regime: MarketRegimeAnalysis,
    environment: TradingEnvironmentQuality
  ): PsychologicalTradeFilter {
    
    const shouldTrade = environment.score > 40;
    let confidence = environment.score;
    const concerns: string[] = [];
    
    // Adjust confidence based on psychological factors
    if (emotional.primary_emotion === 'panic' || emotional.primary_emotion === 'euphoria') {
      if (emotional.intensity_level > 80) {
        concerns.push(`Extreme ${emotional.primary_emotion} - high reversal risk`);
        confidence *= 0.7;
      }
    }
    
    if (regime.regime_confidence < 50) {
      concerns.push('Market regime unclear - avoid directional bets');
      confidence *= 0.8;
    }
    
    // Determine recommended action
    let recommendedAction: PsychologicalTradeFilter['recommended_action'];
    if (confidence > 80) recommendedAction = 'aggressive';
    else if (confidence > 60) recommendedAction = 'normal';
    else if (confidence > 40) recommendedAction = 'defensive';
    else if (confidence > 20) recommendedAction = 'hedge';
    else recommendedAction = 'cash';
    
    // Position sizing modifier
    const positionSizingModifier = confidence > 80 ? 1.3 : 
                                   confidence > 60 ? 1.0 :
                                   confidence > 40 ? 0.7 : 0.3;

    return {
      should_trade: shouldTrade,
      confidence_level: Math.round(confidence),
      primary_concerns: concerns,
      recommended_action: recommendedAction,
      time_horizon_adjustment: emotional.intensity_level > 70 ? 'shorten' : 'normal',
      position_sizing_modifier: positionSizingModifier
    };
  }

  private generateKeyInsights(
    emotional: MarketEmotionalState,
    crowd: CrowdBehaviorAnalysis,
    regime: MarketRegimeAnalysis
  ): string[] {
    const insights: string[] = [];
    
    // Emotional insights
    if (emotional.intensity_level > 70) {
      insights.push(`Market showing ${emotional.primary_emotion} at ${emotional.intensity_level}% intensity - expect mean reversion`);
    }
    
    // Crowd behavior insights
    if (crowd.divergence_score > 70) {
      insights.push(`High retail/institutional divergence (${crowd.divergence_score}%) - smart money likely correct`);
    }
    
    if (crowd.retail_sentiment.put_call_ratio > 1.2) {
      insights.push('Elevated put/call ratio suggests oversold conditions and potential bounce');
    }
    
    // Regime insights
    if (regime.transition_probability.to_bear > 40) {
      insights.push('Bear market transition probability elevated - reduce risk exposure');
    }
    
    return insights;
  }

  private generateActionableIntelligence(
    filter: PsychologicalTradeFilter,
    environment: TradingEnvironmentQuality
  ): string[] {
    const intelligence: string[] = [];
    
    if (!filter.should_trade) {
      intelligence.push('❌ AVOID TRADING - Market psychology unfavorable');
      intelligence.push('💰 Preserve capital and wait for better conditions');
    } else {
      intelligence.push(`✅ TRADING APPROVED - Confidence: ${filter.confidence_level}%`);
      intelligence.push(`📊 Recommended approach: ${filter.recommended_action.toUpperCase()}`);
      intelligence.push(`💰 Position sizing: ${Math.round(filter.position_sizing_modifier * 100)}% of normal`);
    }
    
    if (filter.time_horizon_adjustment === 'shorten') {
      intelligence.push('⏰ SHORTEN TIME HORIZONS - High volatility environment');
    }
    
    if (environment.factors.correlation_breakdown) {
      intelligence.push('🎯 STOCK PICKING ENVIRONMENT - Individual names breaking correlation');
    }
    
    return intelligence;
  }

  // Method for tracking thesis evolution over time
  async trackThesisEvolution(
    originalThesis: string,
    timeElapsedHours: number,
    currentMarketConditions: any
  ): Promise<ThesisEvolutionTracking> {
    
    // Mock thesis tracking - would integrate with real position tracking
    const validationScore = 75; // Mock validation
    const supportingDevelopments = [
      'Key level holding as expected',
      'Volume confirming thesis',
      'Sector strength supporting move'
    ];
    
    const contradictingDevelopments = [
      'Broader market weakness',
      'Sector rotation out of favor'
    ];
    
    const evolution = validationScore > 70 ? 'strengthening' :
                     validationScore > 50 ? 'stable' :
                     validationScore > 30 ? 'weakening' : 'invalidated';
    
    return {
      original_thesis: originalThesis,
      current_validation_score: validationScore,
      time_elapsed_hours: timeElapsedHours,
      supporting_developments: supportingDevelopments,
      contradicting_developments: contradictingDevelopments,
      thesis_evolution: evolution,
      recommended_holding_period: evolution === 'strengthening' ? 'days' : 'hours',
      patience_score: validationScore > 60 ? 80 : 40
    };
  }

  private logPsychologyAnalysis(result: PsychologyEngineOutput): void {
    console.log('🧠 TRADING PSYCHOLOGY ANALYSIS COMPLETE:');
    console.log(`😰 Market Emotion: ${result.market_emotional_state.primary_emotion.toUpperCase()} (${result.market_emotional_state.intensity_level}%)`);
    console.log(`👥 Crowd Divergence: ${result.crowd_behavior.divergence_score}%`);
    console.log(`📊 Trading Environment: ${result.trading_environment.overall_rating}`);
    console.log(`✅ Should Trade: ${result.trade_filter.should_trade ? 'YES' : 'NO'} (${result.trade_filter.confidence_level}% confidence)`);
    console.log(`🎯 Recommended Action: ${result.trade_filter.recommended_action.toUpperCase()}`);
    
    if (result.trade_filter.primary_concerns.length > 0) {
      console.log('⚠️  Primary Concerns:');
      result.trade_filter.primary_concerns.forEach(concern => console.log(`   - ${concern}`));
    }
  }
}

export const tradingPsychologyEngine = new TradingPsychologyEngine(); 