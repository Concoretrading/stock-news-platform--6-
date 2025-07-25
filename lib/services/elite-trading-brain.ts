import { OptionStrike } from './options-premium-mastery';
import { tradingPsychologyEngine, PsychologyEngineOutput } from './trading-psychology-engine';

// Define interfaces needed for elite trading brain
interface RealTimeProbabilitySignal {
  ticker: string;
  timestamp: string;
  probabilityAssessment: {
    breakoutProbability: number;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedMoveSize: number;
    keyRisks: string[];
  };
  consolidation: {
    isConsolidating: boolean;
    consolidationDuration: number;
    breakoutProbability: number;
    compressionLevel: number;
  };
  premiumSetup: {
    optimalStrikes: {
      strike: number;
      type: 'CALL' | 'PUT';
      reasoning: string;
    }[];
    ivCompressionOpportunity: number;
    entryTiming: 'IMMEDIATE' | 'WAIT_FOR_SETUP' | 'AFTER_BREAKOUT';
  };
  scalingStrategy: {
    stages: number;
    timeline: string;
    riskManagement: string;
  };
}

interface MarketContext {
  vix: {
    current: number;
    percentile: number;
    term_structure: 'contango' | 'backwardation';
    expected_direction: 'expanding' | 'contracting';
  };
  market_internals: {
    advance_decline_ratio: number;
    tick_index: number;
    vold_cumulative: number;
    market_sentiment: 'risk_on' | 'risk_off' | 'neutral';
  };
  sector_rotation: {
    leading_sectors: string[];
    lagging_sectors: string[];
    relative_strength: {
      sector: string;
      rs_ratio: number;
    }[];
  };
  key_ratios: {
    hyg_tlt_ratio: number;
    hyg_tlt_trend: 'bullish' | 'bearish' | 'neutral';
    vix_spy_ratio: number;
    vix_spy_trend: 'bullish' | 'bearish' | 'neutral';
  };
}

interface InstitutionalFlow {
  dark_pool_signals: {
    significant_levels: number[];
    accumulation_zones: number[];
    distribution_zones: number[];
    net_flow: 'accumulation' | 'distribution' | 'neutral';
  };
  options_flow: {
    unusual_activity: {
      strike: number;
      type: 'CALL' | 'PUT';
      size: number;
      premium: number;
      classification: 'smart_money' | 'retail' | 'unknown';
    }[];
    gamma_exposure: {
      key_levels: number[];
      current_positioning: 'long_gamma' | 'short_gamma';
      gamma_impact: 'supportive' | 'resistant' | 'neutral';
    };
    put_call_skew: {
      current: number;
      percentile: number;
      interpretation: string;
    };
  };
  order_flow: {
    large_blocks: {
      price: number;
      size: number;
      side: 'buy' | 'sell';
      dark_pool: boolean;
    }[];
    volume_profile: {
      key_nodes: number[];
      value_areas: {
        high: number;
        low: number;
        poc: number;
      };
      volume_trend: 'increasing' | 'decreasing' | 'neutral';
    };
  };
}

interface AdvancedSetupAnalysis {
  confluence_factors: {
    factor: string;
    weight: number;
    status: 'confirmed' | 'pending' | 'invalid';
    contribution: number;
  }[];
  technical_alignment: {
    timeframes: {
      frame: string;
      trend: 'bullish' | 'bearish' | 'neutral';
      key_levels: number[];
      momentum: number;
    }[];
    alignment_score: number;
    dominant_timeframe: string;
  };
  volume_analysis: {
    accumulation_quality: number;
    volume_confirmation: boolean;
    institutional_participation: number;
    retail_participation: number;
  };
  momentum_factors: {
    rsi_divergence: boolean;
    macd_histogram: 'expanding' | 'contracting';
    squeeze_status: 'on' | 'off';
    momentum_quality: number;
  };
}

interface EliteSetupQuality {
  overall_score: number;
  overall_rating: 'S' | 'A' | 'B' | 'C' | 'D';
  contributing_factors: string[];
  psychology_integration: {
    emotion_factor: string;
    crowd_edge: number;
    environment_quality: string;
    trade_approval: boolean;
  };
}

interface EliteRiskFramework {
  position_sizing: {
    base_size: number;
    max_size: number;
    current_recommendation: number;
    sizing_factors: string[];
  };
  stop_strategies: {
    initial_stop: number;
    breakeven_trigger: number;
    trailing_parameters: {
      activation_level: number;
      trail_type: 'atr' | 'fixed' | 'volatility';
      trail_value: number;
    };
  };
  hedge_parameters: {
    trigger_conditions: string[];
    recommended_instruments: string[];
    hedge_ratio: number;
    adjustment_rules: string[];
  };
}

interface EliteExecutionPlan {
  entry_strategy: {
    primary_entry: {
      price: number;
      size: number;
      instrument: string;
      trigger: string;
    };
    scaling_entries: {
      price: number;
      size: number;
      trigger: string;
    }[];
  };
  exit_strategy: {
    profit_targets: {
      price: number;
      size: number;
      stop_adjustment: number;
    }[];
    psychology_exits: {
      trigger: string;
      action: string;
    }[];
  };
  timing_considerations: {
    optimal_entry_window: string;
    avoid_periods: string[];
    psychology_timing: string;
  };
}

interface EliteSetup {
  ticker: string;
  timestamp: string;
  setup_type: string;
  market_context: MarketContext;
  institutional_flow: InstitutionalFlow;
  advanced_setup: AdvancedSetupAnalysis;
  probability_signal: RealTimeProbabilitySignal;
  psychology_analysis: PsychologyEngineOutput; // NEW: Psychology integration
  setup_quality: EliteSetupQuality;
  risk_framework: EliteRiskFramework;
  execution_plan: EliteExecutionPlan;
  elite_decision: {
    final_recommendation: 'TAKE_TRADE' | 'PASS' | 'WAIT' | 'HEDGE_ONLY';
    confidence_score: number; // 0-100
    psychology_override: boolean; // true if psychology says no despite good technicals
    adaptive_sizing: number; // position size multiplier based on psychology
    time_horizon_adjustment: 'EXTEND' | 'NORMAL' | 'SHORTEN' | 'EXIT';
    key_concerns: string[];
    elite_edge_factors: string[];
  };
}

export class EliteTradingBrain {
  constructor() {
    this.initializeBrain();
  }

  private initializeBrain(): void {
    console.log('🧠 INITIALIZING ELITE TRADING BRAIN');
    console.log('📊 Loading market context analyzers...');
    console.log('🔍 Activating institutional flow tracking...');
    console.log('⚡ Enabling advanced setup detection...');
    console.log('🎯 Configuring elite execution framework...');
    console.log('🧠 Integrating trading psychology engine...');
  }

  async analyzeEliteSetup(
    ticker: string,
    price: number,
    probabilitySignal: RealTimeProbabilitySignal,
    optionChain: OptionStrike[]
  ): Promise<EliteSetup> {
    console.log(`🧠 ANALYZING ELITE SETUP for ${ticker}`);

    // STEP 1: Get comprehensive psychology analysis
    const psychologyAnalysis = await tradingPsychologyEngine.analyzeTradingPsychology(ticker);
    
    // STEP 2: Analyze market context
    const marketContext = await this.analyzeMarketContext();
    
    // STEP 3: Track institutional flow
    const institutionalFlow = await this.trackInstitutionalFlow(ticker, price, optionChain);
    
    // STEP 4: Analyze advanced setup factors
    const advancedSetup = await this.analyzeAdvancedSetup(ticker, price, marketContext, institutionalFlow);
    
    // STEP 5: Calculate elite setup quality (including psychology)
    const setupQuality = this.calculateSetupQuality(
      marketContext,
      institutionalFlow,
      advancedSetup,
      probabilitySignal,
      psychologyAnalysis // NEW: Include psychology in quality assessment
    );
    
    // STEP 6: Generate risk framework (psychology-adjusted)
    const riskFramework = this.generateRiskFramework(
      setupQuality,
      probabilitySignal,
      marketContext,
      psychologyAnalysis // NEW: Psychology-adjusted risk management
    );
    
    // STEP 7: Create execution plan (psychology-aware)
    const executionPlan = this.createExecutionPlan(
      price,
      setupQuality,
      riskFramework,
      probabilitySignal,
      psychologyAnalysis // NEW: Psychology-informed execution
    );

    // STEP 8: Make final elite decision (the key differentiator)
    const eliteDecision = this.makeEliteDecision(
      setupQuality,
      probabilitySignal,
      psychologyAnalysis,
      marketContext
    );

    // Log elite analysis results
    this.logEliteAnalysis(setupQuality, riskFramework, executionPlan, eliteDecision);

    return {
      ticker,
      timestamp: new Date().toISOString(),
      setup_type: this.determineSetupType(advancedSetup),
      market_context: marketContext,
      institutional_flow: institutionalFlow,
      advanced_setup: advancedSetup,
      probability_signal: probabilitySignal,
      psychology_analysis: psychologyAnalysis,
      setup_quality: setupQuality,
      risk_framework: riskFramework,
      execution_plan: executionPlan,
      elite_decision: eliteDecision
    };
  }

  private async analyzeMarketContext(): Promise<MarketContext> {
    // This would integrate with real market data feeds
    return {
      vix: {
        current: 14.5,
        percentile: 25,
        term_structure: 'contango',
        expected_direction: 'expanding'
      },
      market_internals: {
        advance_decline_ratio: 1.5,
        tick_index: 500,
        vold_cumulative: 25000,
        market_sentiment: 'risk_on'
      },
      sector_rotation: {
        leading_sectors: ['Technology', 'Consumer Discretionary'],
        lagging_sectors: ['Utilities', 'Consumer Staples'],
        relative_strength: [
          { sector: 'Technology', rs_ratio: 1.2 },
          { sector: 'Consumer Discretionary', rs_ratio: 1.1 }
        ]
      },
      key_ratios: {
        hyg_tlt_ratio: 0.65,
        hyg_tlt_trend: 'bullish',
        vix_spy_ratio: 0.05,
        vix_spy_trend: 'bullish'
      }
    };
  }

  private async trackInstitutionalFlow(
    ticker: string,
    price: number,
    optionChain: OptionStrike[]
  ): Promise<InstitutionalFlow> {
    return {
      dark_pool_signals: {
        significant_levels: [price - 2, price + 1.5],
        accumulation_zones: [price - 1, price - 0.5],
        distribution_zones: [price + 2, price + 2.5],
        net_flow: 'accumulation'
      },
      options_flow: {
        unusual_activity: [
          {
            strike: price + 2,
            type: 'CALL',
            size: 1000,
            premium: 150000,
            classification: 'smart_money'
          }
        ],
        gamma_exposure: {
          key_levels: [price, price + 2],
          current_positioning: 'long_gamma',
          gamma_impact: 'supportive'
        },
        put_call_skew: {
          current: 0.85,
          percentile: 20,
          interpretation: 'Bullish skew, indicating potential upside momentum'
        }
      },
      order_flow: {
        large_blocks: [
          {
            price: price - 0.5,
            size: 50000,
            side: 'buy',
            dark_pool: true
          }
        ],
        volume_profile: {
          key_nodes: [price - 1, price, price + 1],
          value_areas: {
            high: price + 1,
            low: price - 1,
            poc: price
          },
          volume_trend: 'increasing'
        }
      }
    };
  }

  private async analyzeAdvancedSetup(
    ticker: string,
    price: number,
    marketContext: MarketContext,
    institutionalFlow: InstitutionalFlow
  ): Promise<AdvancedSetupAnalysis> {
    return {
      confluence_factors: [
        {
          factor: 'Market Internal Alignment',
          weight: 0.2,
          status: 'confirmed',
          contribution: 20
        },
        {
          factor: 'Institutional Flow',
          weight: 0.3,
          status: 'confirmed',
          contribution: 25
        },
        {
          factor: 'Technical Structure',
          weight: 0.25,
          status: 'confirmed',
          contribution: 20
        },
        {
          factor: 'Volume Confirmation',
          weight: 0.25,
          status: 'pending',
          contribution: 15
        }
      ],
      technical_alignment: {
        timeframes: [
          {
            frame: '5min',
            trend: 'bullish',
            key_levels: [price - 1, price + 1],
            momentum: 75
          },
          {
            frame: '15min',
            trend: 'bullish',
            key_levels: [price - 2, price + 2],
            momentum: 80
          },
          {
            frame: '1h',
            trend: 'bullish',
            key_levels: [price - 3, price + 3],
            momentum: 70
          }
        ],
        alignment_score: 85,
        dominant_timeframe: '15min'
      },
      volume_analysis: {
        accumulation_quality: 80,
        volume_confirmation: true,
        institutional_participation: 65,
        retail_participation: 35
      },
      momentum_factors: {
        rsi_divergence: false,
        macd_histogram: 'expanding',
        squeeze_status: 'off',
        momentum_quality: 75
      }
    };
  }

  // NEW: The elite decision-making process that integrates everything
  private makeEliteDecision(
    setupQuality: any,
    probabilitySignal: RealTimeProbabilitySignal,
    psychologyAnalysis: PsychologyEngineOutput,
    marketContext: MarketContext
  ): EliteSetup['elite_decision'] {
    
    const technicalScore = setupQuality.overall_score || 70;
    const probabilityScore = probabilitySignal.probabilityAssessment.breakoutProbability;
    const psychologyScore = psychologyAnalysis.trade_filter.confidence_level;
    
    // Elite edge factors
    const edgeFactors: string[] = [];
    const concerns: string[] = [];
    
    // Check for psychology override
    const psychologyOverride = !psychologyAnalysis.trade_filter.should_trade;
    
    if (psychologyOverride) {
      concerns.push('Psychology engine recommends avoiding trades');
      concerns.push(...psychologyAnalysis.trade_filter.primary_concerns);
    }
    
    // Check for elite edge conditions
    if (psychologyAnalysis.crowd_behavior.divergence_score > 70) {
      edgeFactors.push(`High retail/institutional divergence (${psychologyAnalysis.crowd_behavior.divergence_score}%)`);
    }
    
    if (psychologyAnalysis.market_emotional_state.primary_emotion === 'fear' && 
        psychologyAnalysis.market_emotional_state.intensity_level > 60) {
      edgeFactors.push('Fear-based opportunity - contrarian edge available');
    }
    
    if (psychologyAnalysis.trading_environment.factors.correlation_breakdown) {
      edgeFactors.push('Stock-picking environment - individual names breaking correlation');
    }
    
    // Calculate composite confidence
    let confidenceScore = (technicalScore * 0.4 + probabilityScore * 0.4 + psychologyScore * 0.2);
    
    // Determine final recommendation
    let finalRecommendation: EliteSetup['elite_decision']['final_recommendation'];
    
    if (psychologyOverride && psychologyAnalysis.trade_filter.recommended_action === 'cash') {
      finalRecommendation = 'PASS';
      confidenceScore *= 0.3; // Heavily discount confidence
    } else if (psychologyOverride && psychologyAnalysis.trade_filter.recommended_action === 'hedge') {
      finalRecommendation = 'HEDGE_ONLY';
      confidenceScore *= 0.5;
    } else if (confidenceScore > 80 && edgeFactors.length >= 2) {
      finalRecommendation = 'TAKE_TRADE';
    } else if (confidenceScore > 60) {
      finalRecommendation = 'WAIT';
      concerns.push('Waiting for higher confidence setup');
    } else {
      finalRecommendation = 'PASS';
      concerns.push('Insufficient confidence for elite standards');
    }
    
    // Adaptive sizing based on psychology
    const adaptiveSizing = psychologyAnalysis.trade_filter.position_sizing_modifier;
    
    // Time horizon adjustment
    const timeHorizonAdjustment = 
      psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 'SHORTEN' :
      psychologyAnalysis.trade_filter.time_horizon_adjustment === 'extend' ? 'EXTEND' : 'NORMAL';

    return {
      final_recommendation: finalRecommendation,
      confidence_score: Math.round(confidenceScore),
      psychology_override: psychologyOverride,
      adaptive_sizing: adaptiveSizing,
      time_horizon_adjustment: timeHorizonAdjustment,
      key_concerns: concerns,
      elite_edge_factors: edgeFactors
    };
  }

  // Enhanced setup quality calculation with psychology
  private calculateSetupQuality(
    marketContext: MarketContext,
    institutionalFlow: InstitutionalFlow,
    advancedSetup: AdvancedSetupAnalysis,
    probabilitySignal: RealTimeProbabilitySignal,
    psychologyAnalysis: PsychologyEngineOutput // NEW parameter
  ): EliteSetupQuality {
    
    let overallScore = 60; // Base score
    const factors: string[] = [];
    
    // Technical factors (existing logic)
    if (probabilitySignal.probabilityAssessment.breakoutProbability > 75) {
      overallScore += 15;
      factors.push('High breakout probability');
    }
    
    // Psychology factors (NEW)
    if (psychologyAnalysis.trade_filter.should_trade) {
      overallScore += 10;
      factors.push('Psychology supports trading');
    } else {
      overallScore -= 20;
      factors.push('Psychology advises caution');
    }
    
    if (psychologyAnalysis.trading_environment.overall_rating === 'PRIME') {
      overallScore += 15;
      factors.push('Prime trading environment');
    } else if (psychologyAnalysis.trading_environment.overall_rating === 'AVOID') {
      overallScore -= 25;
      factors.push('Poor trading environment');
    }
    
    // Crowd behavior edge
    if (psychologyAnalysis.crowd_behavior.divergence_score > 70) {
      overallScore += 10;
      factors.push('High crowd divergence - opportunity');
    }
    
    // Market emotion edge
    if (psychologyAnalysis.market_emotional_state.primary_emotion === 'fear' && 
        psychologyAnalysis.market_emotional_state.intensity_level > 60) {
      overallScore += 12;
      factors.push('Fear-based contrarian opportunity');
    } else if (psychologyAnalysis.market_emotional_state.primary_emotion === 'euphoria') {
      overallScore -= 15;
      factors.push('Euphoria increases reversal risk');
    }
    
    // Determine overall rating
    const overallRating = 
      overallScore >= 90 ? 'S' :
      overallScore >= 80 ? 'A' :
      overallScore >= 70 ? 'B' :
      overallScore >= 60 ? 'C' : 'D';
    
    return {
      overall_score: Math.max(0, Math.min(100, overallScore)),
      overall_rating: overallRating,
      contributing_factors: factors,
      psychology_integration: {
        emotion_factor: psychologyAnalysis.market_emotional_state.primary_emotion,
        crowd_edge: psychologyAnalysis.crowd_behavior.divergence_score,
        environment_quality: psychologyAnalysis.trading_environment.overall_rating,
        trade_approval: psychologyAnalysis.trade_filter.should_trade
      }
    };
  }

  // Enhanced risk framework with psychology
  private generateRiskFramework(
    setupQuality: EliteSetupQuality,
    probabilitySignal: RealTimeProbabilitySignal,
    marketContext: MarketContext,
    psychologyAnalysis: PsychologyEngineOutput // NEW parameter
  ): EliteRiskFramework {
    
    // Base sizing adjusted by psychology
    const psychologyMultiplier = psychologyAnalysis.trade_filter.position_sizing_modifier;
    const baseSize = 
      setupQuality.overall_rating === 'S' ? 0.4 :
      setupQuality.overall_rating === 'A' ? 0.3 :
      setupQuality.overall_rating === 'B' ? 0.2 :
      setupQuality.overall_rating === 'C' ? 0.1 : 0.05;

    const adjustedBaseSize = baseSize * psychologyMultiplier;
    const maxSize = adjustedBaseSize * 1.5;

    // Adjust stops based on psychology
    const psychologyStopAdjustment = 
      psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 0.7 : 1.0;

    return {
      position_sizing: {
        base_size: adjustedBaseSize,
        max_size: maxSize,
        current_recommendation: adjustedBaseSize,
        sizing_factors: [
          `Setup Quality: ${setupQuality.overall_rating}`,
          `Probability: ${probabilitySignal.probabilityAssessment.breakoutProbability}%`,
          `Psychology Multiplier: ${Math.round(psychologyMultiplier * 100)}%`,
          `Market Environment: ${psychologyAnalysis.trading_environment.overall_rating}`
        ]
      },
      stop_strategies: {
        initial_stop: (probabilitySignal.consolidation.isConsolidating ? 
          probabilitySignal.consolidation.breakoutProbability * 0.01 : 0.02) * psychologyStopAdjustment,
        breakeven_trigger: probabilitySignal.probabilityAssessment.expectedMoveSize * 0.3,
        trailing_parameters: {
          activation_level: probabilitySignal.probabilityAssessment.expectedMoveSize * 0.5,
          trail_type: 'atr',
          trail_value: psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 1.5 : 2
        }
      },
      hedge_parameters: {
        trigger_conditions: [
          'Key level rejection',
          'Volume climax',
          'Momentum exhaustion',
          'Psychology regime shift' // NEW: Psychology-based hedge trigger
        ],
        recommended_instruments: 
          psychologyAnalysis.market_emotional_state.primary_emotion === 'greed' ? 
          ['ATM Puts', 'VIX Calls', 'Inverse ETF Calls'] :
          ['OTM Calls', 'QQQ Calls', 'Momentum ETF Calls'],
        hedge_ratio: psychologyAnalysis.trade_filter.recommended_action === 'defensive' ? 0.5 : 0.3,
        adjustment_rules: [
          'Increase on psychology deterioration',
          'Reduce on crowd capitulation',
          'Exit on regime confirmation'
        ]
      }
    };
  }

  // Enhanced execution plan with psychology
  private createExecutionPlan(
    price: number,
    setupQuality: EliteSetupQuality,
    riskFramework: EliteRiskFramework,
    probabilitySignal: RealTimeProbabilitySignal,
    psychologyAnalysis: PsychologyEngineOutput // NEW parameter
  ): EliteExecutionPlan {
    
    // Adjust execution based on psychology
    const psychologyTiming = psychologyAnalysis.trade_filter.recommended_action;
    
    let entryTrigger = 'Breakout confirmation with volume';
    if (psychologyTiming === 'defensive') {
      entryTrigger = 'Wait for multiple confirmations and reduced size';
    } else if (psychologyTiming === 'aggressive') {
      entryTrigger = 'Early entry on setup completion';
    }

    return {
      entry_strategy: {
        primary_entry: {
          price: price,
          size: riskFramework.position_sizing.base_size,
          instrument: '1 ATR Call',
          trigger: entryTrigger
        },
        scaling_entries: psychologyAnalysis.trade_filter.should_trade ? [
          {
            price: price * 1.01,
            size: riskFramework.position_sizing.base_size * 0.5,
            trigger: 'First target hit with momentum'
          },
          {
            price: price * 1.02,
            size: riskFramework.position_sizing.base_size * 0.5,
            trigger: 'Second target hit with volume confirmation'
          }
        ] : [] // No scaling if psychology says avoid
      },
      exit_strategy: {
        profit_targets: [
          {
            price: price * (psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 1.015 : 1.02),
            size: 0.4, // Take profits faster if psychology suggests shorter horizon
            stop_adjustment: price * 1.005
          },
          {
            price: price * (psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 1.025 : 1.03),
            size: 0.4,
            stop_adjustment: price * 1.015
          },
          {
            price: price * (psychologyAnalysis.trade_filter.time_horizon_adjustment === 'shorten' ? 1.04 : 1.05),
            size: 0.2,
            stop_adjustment: price * 1.025
          }
        ],
        psychology_exits: [ // NEW: Psychology-based exit triggers
          {
            trigger: 'Market emotion shifts to euphoria',
            action: 'Exit 50% immediately'
          },
          {
            trigger: 'Crowd behavior shows capitulation',
            action: 'Consider full exit or hedge'
          },
          {
            trigger: 'Trading environment deteriorates to AVOID',
            action: 'Exit all positions immediately'
          }
        ]
      },
      timing_considerations: {
        optimal_entry_window: psychologyAnalysis.trade_filter.should_trade ? 'Immediate to 15 minutes' : 'Wait for better conditions',
        avoid_periods: [
          'High volatility events',
          'Market regime transitions',
          'Extreme psychological conditions'
        ],
        psychology_timing: `Current psychology: ${psychologyAnalysis.market_emotional_state.primary_emotion} - ${psychologyAnalysis.trade_filter.recommended_action}`
      }
    };
  }

  private determineSetupType(
    advancedSetup: AdvancedSetupAnalysis
  ): EliteSetup['setup_type'] {
    const momentumStrength = advancedSetup.momentum_factors.momentum_quality;
    const technicalAlignment = advancedSetup.technical_alignment.alignment_score;
    
    if (momentumStrength > 70 && technicalAlignment > 80) return 'momentum';
    if (advancedSetup.momentum_factors.squeeze_status === 'off') return 'breakout';
    return 'mean_reversion';
  }

  // Enhanced logging with psychology
  private logEliteAnalysis(
    setupQuality: any, 
    riskFramework: any, 
    executionPlan: any, 
    eliteDecision: EliteSetup['elite_decision']
  ): void {
    console.log('🧠 ELITE TRADING BRAIN ANALYSIS COMPLETE:');
    console.log(`🎯 Setup Quality: ${setupQuality.overall_rating} (${setupQuality.overall_score}/100)`);
    console.log(`🧠 Psychology Override: ${eliteDecision.psychology_override ? 'YES' : 'NO'}`);
    console.log(`✅ Final Decision: ${eliteDecision.final_recommendation}`);
    console.log(`💯 Elite Confidence: ${eliteDecision.confidence_score}%`);
    console.log(`📊 Adaptive Sizing: ${Math.round(eliteDecision.adaptive_sizing * 100)}%`);
    console.log(`⏰ Time Horizon: ${eliteDecision.time_horizon_adjustment}`);
    
    if (eliteDecision.elite_edge_factors.length > 0) {
      console.log('🎯 ELITE EDGE FACTORS:');
      eliteDecision.elite_edge_factors.forEach(factor => console.log(`   ✓ ${factor}`));
    }
    
    if (eliteDecision.key_concerns.length > 0) {
      console.log('⚠️  KEY CONCERNS:');
      eliteDecision.key_concerns.forEach(concern => console.log(`   - ${concern}`));
    }
  }
} 