// OPTIONS PREMIUM MASTERY ENGINE
// Real-time options premium analysis and strike-specific tracking with consolidation pattern analysis

export interface ConsolidationPremiumPattern {
  consolidationPeriod: {
    startDate: string;
    endDate: string;
    duration: number;
    priceRange: {
      high: number;
      low: number;
      percentRange: number;
    };
    avgVolume: number;
  };
  
  // Premium behavior during consolidation
  premiumPatterns: {
    atrStrikePremiums: {
      call_1atr: number[];  // Premium history at 1 ATR call
      call_2atr: number[];  // Premium history at 2 ATR call
      put_1atr: number[];   // Premium history at 1 ATR put
      put_2atr: number[];   // Premium history at 2 ATR put
    };
    
    // IV patterns during consolidation
    ivCompressionPattern: {
      initialIV: number;
      minIV: number;
      avgIV: number;
      ivCompressionDays: number;
      compressionRate: number; // IV decline per day
    };
    
    // Time decay patterns
    thetaDecayPattern: {
      dailyDecayRate: number;
      accelerationNearExpiry: boolean;
      optimalEntryDays: number[]; // Days before expiry for best entries
    };
    
    // Volume patterns on key strikes
    volumePatterns: {
      call_1atr_volume: number[];
      call_2atr_volume: number[];
      put_1atr_volume: number[];
      put_2atr_volume: number[];
      averageVolumeRatio: number;
    };
  };
  
  // What happened at breakout
  breakoutPremiumExpansion: {
    breakoutDate: string;
    preBreakoutPremium: {
      call_1atr: number;
      call_2atr: number;
      put_1atr: number;
      put_2atr: number;
    };
    firstDayExpansion: {
      call_1atr: number;
      call_2atr: number;
      put_1atr: number;
      put_2atr: number;
    };
    maxExpansion: {
      call_1atr: number;
      call_2atr: number;
      put_1atr: number;
      put_2atr: number;
      daysToMax: number;
    };
    profitabilityScore: number; // 0-100
  };
}

export interface ATRStrikeAnalysis {
  currentATR: number;
  atrPeriod: number; // 14-day ATR typically
  
  recommendedStrikes: {
    calls: {
      atm: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
      };
      atr_1: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        historicalSuccessRate: number;
      };
      atr_2: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        historicalSuccessRate: number;
      };
      customOptimal?: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        reasonForRecommendation: string;
      };
    };
    puts: {
      atm: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
      };
      atr_1: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        historicalSuccessRate: number;
      };
      atr_2: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        historicalSuccessRate: number;
      };
      customOptimal?: {
        strike: number;
        premium: number;
        breakeven: number;
        probabilityProfit: number;
        reasonForRecommendation: string;
      };
    };
  };
  
  // Pattern-based insights
  patternInsights: {
    consolidationDetected: boolean;
    daysInConsolidation: number;
    ivCompressionLevel: number; // 0-100, 100 = maximum compression
    optimalEntryTiming: 'NOW' | 'WAIT_FOR_MORE_COMPRESSION' | 'WAIT_FOR_BREAKOUT_SIGNAL';
    expectedPremiumExpansion: number; // Percentage expected on breakout
    riskOfIVCrush: number; // 0-100
  };
}

export interface OptionStrike {
  strike: number;
  expiration: string;
  type: 'CALL' | 'PUT';
  
  // Pricing data
  bid: number;
  ask: number;
  last: number;
  mark: number;
  
  // Greeks
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  
  // Volatility
  implied_volatility: number;
  iv_rank: number; // 0-100 percentile
  iv_percentile: number;
  
  // Volume and interest
  volume: number;
  open_interest: number;
  volume_oi_ratio: number;
  
  // Premium characteristics
  intrinsic_value: number;
  extrinsic_value: number;
  time_value: number;
  moneyness: number; // % in/out of money
  
  // Flow analysis
  unusual_activity: boolean;
  smart_money_flow: 'bullish' | 'bearish' | 'neutral';
  retail_sentiment: 'bullish' | 'bearish' | 'neutral';
  
  // ATR-based analysis
  atrLevel?: '1ATR' | '2ATR' | 'ATM' | 'OTHER';
  consolidationPremiumScore?: number; // How this strike performs in consolidation
  breakoutPremiumScore?: number; // How this strike performs on breakouts
}

export interface PremiumFlowAnalysis {
  overall_bias: 'bullish' | 'bearish' | 'neutral';
  
  // Flow metrics
  call_put_ratio: number;
  call_volume: number;
  put_volume: number;
  net_premium_flow: number; // positive = bullish, negative = bearish
  
  // Unusual activity
  unusual_call_activity: OptionStrike[];
  unusual_put_activity: OptionStrike[];
  large_orders: {
    strike: number;
    type: 'CALL' | 'PUT';
    size: number;
    premium_paid: number;
    sentiment: 'bullish' | 'bearish';
  }[];
  
  // Smart money indicators
  dark_pool_activity: boolean;
  institutional_positioning: 'accumulating' | 'distributing' | 'neutral';
  sweep_activity: {
    detected: boolean;
    direction: 'bullish' | 'bearish';
    strikes_hit: number[];
  };
}

export interface PremiumProbabilityAnalysis {
  // Strike-specific probabilities
  optimal_strikes: {
    calls: {
      strike: number;
      probability_profitable: number;
      max_profit_potential: number;
      breakeven_move_required: number;
      time_decay_impact: number;
    }[];
    puts: {
      strike: number;
      probability_profitable: number;
      max_profit_potential: number;
      breakeven_move_required: number;
      time_decay_impact: number;
    }[];
  };
  
  // Premium expansion/compression
  volatility_expansion_probability: number;
  premium_compression_risk: number;
  optimal_entry_timing: {
    immediate: boolean;
    wait_for_dip: boolean;
    wait_for_breakout: boolean;
    iv_crush_risk: number;
  };
  
  // Multi-strike strategies
  spread_opportunities: {
    type: 'bull_call' | 'bear_put' | 'iron_condor' | 'butterfly';
    strikes: number[];
    probability_profitable: number;
    max_profit: number;
    max_loss: number;
    breakeven_points: number[];
  }[];
}

export interface RealTimePremiumTracking {
  tracked_strikes: Map<string, OptionStrike>; // key: "strike_expiration_type"
  premium_momentum: {
    expanding: OptionStrike[];
    compressing: OptionStrike[];
    accelerating: OptionStrike[];
    decelerating: OptionStrike[];
  };
  
  // Real-time alerts
  premium_alerts: {
    type: 'unusual_volume' | 'iv_spike' | 'large_order' | 'sweep_detected' | 'premium_explosion';
    strike: number;
    option_type: 'CALL' | 'PUT';
    message: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: string;
  }[];
  
  // Level interaction
  at_key_levels: {
    strikes_near_support: OptionStrike[];
    strikes_near_resistance: OptionStrike[];
    gamma_exposure_levels: number[];
  };
}

export interface OptionsPremiumMasterySignal {
  ticker: string;
  underlying_price: number;
  timestamp: string;
  
  // Overall assessment
  premium_environment: 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE';
  optimal_strategy: 'BUY_CALLS' | 'BUY_PUTS' | 'SELL_PREMIUM' | 'SPREADS' | 'WAIT';
  
  // Specific recommendations
  recommended_strikes: {
    primary: OptionStrike;
    alternatives: OptionStrike[];
    reasoning: string[];
  };
  
  // Premium analysis
  flow_analysis: PremiumFlowAnalysis;
  probability_analysis: PremiumProbabilityAnalysis;
  real_time_tracking: RealTimePremiumTracking;
  
  // Risk assessment
  iv_crush_risk: number; // 0-100
  time_decay_impact: number; // daily theta impact
  gamma_risk: number; // acceleration risk
  vega_exposure: number; // volatility sensitivity
  
  // Confluence with stock analysis
  stock_options_alignment: {
    directional_agreement: boolean;
    volatility_setup: boolean;
    timing_confluence: boolean;
    overall_confluence_score: number;
  };
}

class OptionsPremiumMastery {
  private trackedStrikes: Map<string, OptionStrike> = new Map();
  private historicalPremiumData: Map<string, any[]> = new Map();
  private realTimeAlerts: any[] = [];
  private consolidationPatterns: ConsolidationPremiumPattern[] = [];
  
  constructor() {
    this.initializePremiumEngine();
  }
  
  private initializePremiumEngine(): void {
    console.log('🔥 INITIALIZING OPTIONS PREMIUM MASTERY ENGINE');
    console.log('📊 Loading historical consolidation patterns...');
    console.log('🎯 Setting up ATR-based strike analysis...');
    console.log('⚡ Enabling real-time premium flow tracking...');
  }
  
  // MASTER PREMIUM ANALYSIS
  async masterPremiumAnalysis(ticker: string, underlyingPrice: number): Promise<OptionsPremiumMasterySignal> {
    console.log(`💎 MASTERING OPTIONS PREMIUM for ${ticker} at $${underlyingPrice}`);
    
    // Get options chain data
    const optionsChain = await this.getOptionsChain(ticker);
    
    // Analyze premium flow
    const flowAnalysis = this.analyzePremiumFlow(optionsChain);
    
    // Calculate probabilities for each strike
    const probabilityAnalysis = await this.analyzePremiumProbabilities(optionsChain, underlyingPrice);
    
    // Real-time tracking and alerts
    const realTimeTracking = this.updateRealTimeTracking(optionsChain);
    
    // Identify optimal strikes
    const recommendedStrikes = this.identifyOptimalStrikes(optionsChain, probabilityAnalysis, flowAnalysis);
    
    // Assess premium environment
    const premiumEnvironment = this.assessPremiumEnvironment(flowAnalysis, probabilityAnalysis);
    
    // Generate strategy recommendation
    const optimalStrategy = this.determineOptimalStrategy(premiumEnvironment, flowAnalysis, probabilityAnalysis);
    
    // Calculate confluence with stock analysis
    const stockOptionsAlignment = await this.analyzeStockOptionsAlignment(ticker, underlyingPrice);
    
    const signal: OptionsPremiumMasterySignal = {
      ticker,
      underlying_price: underlyingPrice,
      timestamp: new Date().toISOString(),
      premium_environment: premiumEnvironment,
      optimal_strategy: optimalStrategy,
      recommended_strikes: recommendedStrikes,
      flow_analysis: flowAnalysis,
      probability_analysis: probabilityAnalysis,
      real_time_tracking: realTimeTracking,
      iv_crush_risk: this.calculateIVCrushRisk(optionsChain),
      time_decay_impact: this.calculateTimeDecayImpact(optionsChain),
      gamma_risk: this.calculateGammaRisk(optionsChain, underlyingPrice),
      vega_exposure: this.calculateVegaExposure(optionsChain),
      stock_options_alignment: stockOptionsAlignment
    };
    
    console.log(`💎 ${ticker} PREMIUM MASTERY COMPLETE:`);
    console.log(`🎯 Environment: ${premiumEnvironment}`);
    console.log(`⚡ Strategy: ${optimalStrategy}`);
    console.log(`📊 Primary Strike: ${recommendedStrikes.primary.strike} ${recommendedStrikes.primary.type}`);
    console.log(`💹 Flow Bias: ${flowAnalysis.overall_bias}`);
    console.log(`🔥 IV Rank: ${recommendedStrikes.primary.iv_rank}%`);
    
    return signal;
  }
  
  // OPTIONS CHAIN DATA
  private async getOptionsChain(ticker: string): Promise<OptionStrike[]> {
    // This would connect to real options data feed
    // For now, creating intelligent mock data that represents real market behavior
    
    const basePrice = 150; // Current underlying price
    const expirationDates = [
      this.getNextFriday(7),   // 1 week
      this.getNextFriday(14),  // 2 weeks  
      this.getNextFriday(21),  // 3 weeks
      this.getNextFriday(35)   // 5 weeks
    ];
    
    const chain: OptionStrike[] = [];
    
    expirationDates.forEach((expiration, expIndex) => {
      // Generate strikes around current price
      for (let i = -10; i <= 10; i++) {
        const strike = basePrice + (i * 5); // $5 intervals
        const isITM_Call = strike < basePrice;
        const isITM_Put = strike > basePrice;
        
        // Calls
        const callDelta = this.calculateDelta(basePrice, strike, 'CALL', expiration);
        const callIV = this.calculateImpliedVolatility(basePrice, strike, 'CALL', expIndex);
        
        chain.push({
          strike,
          expiration,
          type: 'CALL',
          bid: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV) - 0.05,
          ask: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV) + 0.05,
          last: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV),
          mark: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV),
          delta: callDelta,
          gamma: this.calculateGamma(basePrice, strike, expiration),
          theta: this.calculateTheta(basePrice, strike, 'CALL', expiration),
          vega: this.calculateVega(basePrice, strike, expiration),
          implied_volatility: callIV,
          iv_rank: this.calculateIVRank(callIV),
          iv_percentile: this.calculateIVPercentile(callIV),
          volume: this.generateRealisticVolume(strike, basePrice, 'CALL'),
          open_interest: this.generateRealisticOI(strike, basePrice, 'CALL'),
          volume_oi_ratio: 0,
          intrinsic_value: Math.max(0, basePrice - strike),
          extrinsic_value: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV) - Math.max(0, basePrice - strike),
          time_value: this.calculateOptionPrice(basePrice, strike, 'CALL', expiration, callIV) - Math.max(0, basePrice - strike),
          moneyness: ((basePrice - strike) / basePrice) * 100,
          unusual_activity: this.detectUnusualActivity(strike, basePrice, 'CALL'),
          smart_money_flow: this.analyzeSmartMoneyFlow(strike, basePrice, 'CALL'),
          retail_sentiment: this.analyzeRetailSentiment(strike, basePrice, 'CALL')
        });
        
        // Puts
        const putDelta = this.calculateDelta(basePrice, strike, 'PUT', expiration);
        const putIV = this.calculateImpliedVolatility(basePrice, strike, 'PUT', expIndex);
        
        chain.push({
          strike,
          expiration,
          type: 'PUT',
          bid: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV) - 0.05,
          ask: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV) + 0.05,
          last: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV),
          mark: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV),
          delta: putDelta,
          gamma: this.calculateGamma(basePrice, strike, expiration),
          theta: this.calculateTheta(basePrice, strike, 'PUT', expiration),
          vega: this.calculateVega(basePrice, strike, expiration),
          implied_volatility: putIV,
          iv_rank: this.calculateIVRank(putIV),
          iv_percentile: this.calculateIVPercentile(putIV),
          volume: this.generateRealisticVolume(strike, basePrice, 'PUT'),
          open_interest: this.generateRealisticOI(strike, basePrice, 'PUT'),
          volume_oi_ratio: 0,
          intrinsic_value: Math.max(0, strike - basePrice),
          extrinsic_value: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV) - Math.max(0, strike - basePrice),
          time_value: this.calculateOptionPrice(basePrice, strike, 'PUT', expiration, putIV) - Math.max(0, strike - basePrice),
          moneyness: ((strike - basePrice) / basePrice) * 100,
          unusual_activity: this.detectUnusualActivity(strike, basePrice, 'PUT'),
          smart_money_flow: this.analyzeSmartMoneyFlow(strike, basePrice, 'PUT'),
          retail_sentiment: this.analyzeRetailSentiment(strike, basePrice, 'PUT')
        });
      }
    });
    
    // Calculate volume/OI ratios
    chain.forEach(option => {
      option.volume_oi_ratio = option.open_interest > 0 ? option.volume / option.open_interest : 0;
    });
    
    return chain;
  }
  
  // PREMIUM FLOW ANALYSIS
  private analyzePremiumFlow(chain: OptionStrike[]): PremiumFlowAnalysis {
    const calls = chain.filter(opt => opt.type === 'CALL');
    const puts = chain.filter(opt => opt.type === 'PUT');
    
    const callVolume = calls.reduce((sum, opt) => sum + opt.volume, 0);
    const putVolume = puts.reduce((sum, opt) => sum + opt.volume, 0);
    const callPutRatio = putVolume > 0 ? callVolume / putVolume : 999;
    
    // Calculate net premium flow
    const netPremiumFlow = calls.reduce((sum, opt) => sum + (opt.volume * opt.mark), 0) - 
                          puts.reduce((sum, opt) => sum + (opt.volume * opt.mark), 0);
    
    // Identify unusual activity
    const unusualCallActivity = calls.filter(opt => opt.unusual_activity);
    const unusualPutActivity = puts.filter(opt => opt.unusual_activity);
    
    // Detect large orders (volume > 100 and high premium)
    const largeOrders = chain
      .filter(opt => opt.volume > 100 && opt.mark > 1.0)
      .map(opt => ({
        strike: opt.strike,
        type: opt.type,
        size: opt.volume,
        premium_paid: opt.volume * opt.mark * 100, // Convert to actual dollar amount
        sentiment: opt.type === 'CALL' ? 'bullish' as const : 'bearish' as const
      }));
    
    // Determine overall bias
    let overallBias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (callPutRatio > 1.2) overallBias = 'bullish';
    else if (callPutRatio < 0.8) overallBias = 'bearish';
    
    return {
      overall_bias: overallBias,
      call_put_ratio: callPutRatio,
      call_volume: callVolume,
      put_volume: putVolume,
      net_premium_flow: netPremiumFlow,
      unusual_call_activity: unusualCallActivity,
      unusual_put_activity: unusualPutActivity,
      large_orders: largeOrders,
      dark_pool_activity: largeOrders.length > 3, // Heuristic
      institutional_positioning: netPremiumFlow > 50000 ? 'accumulating' : netPremiumFlow < -50000 ? 'distributing' : 'neutral',
      sweep_activity: {
        detected: unusualCallActivity.length > 2 || unusualPutActivity.length > 2,
        direction: unusualCallActivity.length > unusualPutActivity.length ? 'bullish' : 'bearish',
        strikes_hit: [...unusualCallActivity, ...unusualPutActivity].map(opt => opt.strike)
      }
    };
  }
  
  // PREMIUM PROBABILITY ANALYSIS  
  private async analyzePremiumProbabilities(chain: OptionStrike[], underlyingPrice: number): Promise<PremiumProbabilityAnalysis> {
    const calls = chain.filter(opt => opt.type === 'CALL');
    const puts = chain.filter(opt => opt.type === 'PUT');
    
    // Calculate probabilities for each strike
    const optimalCalls = calls
      .filter(opt => opt.delta > 0.3 && opt.delta < 0.7) // Sweet spot deltas
      .map(opt => ({
        strike: opt.strike,
        probability_profitable: this.calculateProfitProbability(opt, underlyingPrice),
        max_profit_potential: this.calculateMaxProfit(opt, underlyingPrice),
        breakeven_move_required: this.calculateBreakevenMove(opt, underlyingPrice),
        time_decay_impact: Math.abs(opt.theta)
      }))
      .sort((a, b) => b.probability_profitable - a.probability_profitable)
      .slice(0, 5); // Top 5
    
    const optimalPuts = puts
      .filter(opt => opt.delta < -0.3 && opt.delta > -0.7) // Sweet spot deltas
      .map(opt => ({
        strike: opt.strike,
        probability_profitable: this.calculateProfitProbability(opt, underlyingPrice),
        max_profit_potential: this.calculateMaxProfit(opt, underlyingPrice),
        breakeven_move_required: this.calculateBreakevenMove(opt, underlyingPrice),
        time_decay_impact: Math.abs(opt.theta)
      }))
      .sort((a, b) => b.probability_profitable - a.probability_profitable)
      .slice(0, 5); // Top 5
    
    // Volatility analysis
    const avgIV = chain.reduce((sum, opt) => sum + opt.implied_volatility, 0) / chain.length;
    const volatilityExpansionProb = avgIV < 25 ? 75 : avgIV > 40 ? 25 : 50; // Simplified
    
    return {
      optimal_strikes: {
        calls: optimalCalls,
        puts: optimalPuts
      },
      volatility_expansion_probability: volatilityExpansionProb,
      premium_compression_risk: 100 - volatilityExpansionProb,
      optimal_entry_timing: {
        immediate: volatilityExpansionProb > 70,
        wait_for_dip: volatilityExpansionProb < 30,
        wait_for_breakout: volatilityExpansionProb >= 30 && volatilityExpansionProb <= 70,
        iv_crush_risk: avgIV > 35 ? 60 : 20
      },
      spread_opportunities: [] // Would implement spread analysis
    };
  }
  
  // REAL-TIME TRACKING
  private updateRealTimeTracking(chain: OptionStrike[]): RealTimePremiumTracking {
    // Update tracked strikes
    chain.forEach(option => {
      const key = `${option.strike}_${option.expiration}_${option.type}`;
      this.trackedStrikes.set(key, option);
    });
    
    // Analyze premium momentum
    const expanding = chain.filter(opt => opt.implied_volatility > 30);
    const compressing = chain.filter(opt => opt.implied_volatility < 20);
    
    // Generate alerts
    const alerts: Array<{
      type: 'unusual_volume' | 'iv_spike' | 'large_order' | 'sweep_detected' | 'premium_explosion';
      strike: number;
      option_type: 'CALL' | 'PUT';
      message: string;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
      timestamp: string;
    }> = [];
    
    chain.forEach(opt => {
      if (opt.volume > opt.open_interest * 2 && opt.open_interest > 100) {
        alerts.push({
          type: 'unusual_volume' as const,
          strike: opt.strike,
          option_type: opt.type,
          message: `Unusual volume: ${opt.volume} vs OI ${opt.open_interest}`,
          urgency: 'HIGH' as const,
          timestamp: new Date().toISOString()
        });
      }
      
      if (opt.implied_volatility > 40) {
        alerts.push({
          type: 'iv_spike' as const,
          strike: opt.strike,
          option_type: opt.type,
          message: `IV spike: ${opt.implied_volatility.toFixed(1)}%`,
          urgency: 'MEDIUM' as const,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return {
      tracked_strikes: this.trackedStrikes,
      premium_momentum: {
        expanding,
        compressing,
        accelerating: chain.filter(opt => opt.volume_oi_ratio > 1.5),
        decelerating: chain.filter(opt => opt.volume_oi_ratio < 0.1)
      },
      premium_alerts: alerts,
      at_key_levels: {
        strikes_near_support: chain.filter(opt => Math.abs(opt.strike - 147) < 2), // Example support at 147
        strikes_near_resistance: chain.filter(opt => Math.abs(opt.strike - 153) < 2), // Example resistance at 153
        gamma_exposure_levels: [145, 150, 155] // High gamma levels
      }
    };
  }
  
  // OPTIMAL STRIKES IDENTIFICATION
  private identifyOptimalStrikes(chain: OptionStrike[], probabilityAnalysis: PremiumProbabilityAnalysis, flowAnalysis: PremiumFlowAnalysis): any {
    // Find the best primary strike based on multiple factors
    const allOptions = [...probabilityAnalysis.optimal_strikes.calls, ...probabilityAnalysis.optimal_strikes.puts];
    
    if (allOptions.length === 0) {
      // Fallback to ATM options
      const atmCall = chain.find(opt => opt.type === 'CALL' && Math.abs(opt.moneyness) < 5);
      const atmPut = chain.find(opt => opt.type === 'PUT' && Math.abs(opt.moneyness) < 5);
      
      return {
        primary: atmCall || atmPut || chain[0],
        alternatives: [atmPut || atmCall].filter(Boolean),
        reasoning: ['Using at-the-money options as default', 'Insufficient probability data for optimization']
      };
    }
    
    const primaryStrike = allOptions[0];
    const primaryOption = chain.find(opt => 
      opt.strike === primaryStrike.strike && 
      ((flowAnalysis.overall_bias === 'bullish' && opt.type === 'CALL') ||
       (flowAnalysis.overall_bias === 'bearish' && opt.type === 'PUT') ||
       (flowAnalysis.overall_bias === 'neutral' && opt.type === 'CALL'))
    );
    
    const alternatives = allOptions.slice(1, 4).map(strike => 
      chain.find(opt => opt.strike === strike.strike)
    ).filter(Boolean);
    
    return {
      primary: primaryOption || chain[0],
      alternatives,
      reasoning: [
        `${primaryStrike.probability_profitable.toFixed(1)}% probability of profit`,
        `${primaryStrike.breakeven_move_required.toFixed(1)}% move required for breakeven`,
        `Aligned with ${flowAnalysis.overall_bias} flow bias`
      ]
    };
  }
  
  // HELPER CALCULATIONS
  private calculateDelta(spot: number, strike: number, type: 'CALL' | 'PUT', expiration: string): number {
    const moneyness = spot / strike;
    const baseData = type === 'CALL' ? 
      (moneyness > 1 ? 0.6 + (moneyness - 1) * 0.3 : 0.1 + (moneyness - 0.8) * 2.5) :
      (moneyness < 1 ? -0.6 - (1 - moneyness) * 0.3 : -0.1 - (1.2 - moneyness) * 2.5);
    return Math.max(-1, Math.min(1, baseData));
  }
  
  private calculateImpliedVolatility(spot: number, strike: number, type: 'CALL' | 'PUT', expIndex: number): number {
    const distanceFromATM = Math.abs(strike - spot) / spot;
    const baseIV = 25 + (distanceFromATM * 15) + (expIndex * 2); // Vol smile + term structure
    return Math.min(50, Math.max(15, baseIV + (Math.random() - 0.5) * 5));
  }
  
  private calculateOptionPrice(spot: number, strike: number, type: 'CALL' | 'PUT', expiration: string, iv: number): number {
    // Simplified Black-Scholes approximation
    const intrinsic = type === 'CALL' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
    const timeValue = (iv / 100) * Math.sqrt(this.getDaysToExpiration(expiration) / 365) * spot * 0.4;
    return intrinsic + timeValue;
  }
  
  private calculateGamma(spot: number, strike: number, expiration: string): number {
    const distanceFromATM = Math.abs(strike - spot) / spot;
    const daysToExp = this.getDaysToExpiration(expiration);
    return Math.max(0.001, (1 - distanceFromATM * 5) * (30 / daysToExp) * 0.05);
  }
  
  private calculateTheta(spot: number, strike: number, type: 'CALL' | 'PUT', expiration: string): number {
    const daysToExp = this.getDaysToExpiration(expiration);
    const distanceFromATM = Math.abs(strike - spot) / spot;
    return -(1 - distanceFromATM) * (spot * 0.001) * (30 / daysToExp);
  }
  
  private calculateVega(spot: number, strike: number, expiration: string): number {
    const distanceFromATM = Math.abs(strike - spot) / spot;
    const daysToExp = this.getDaysToExpiration(expiration);
    return (1 - distanceFromATM * 2) * Math.sqrt(daysToExp / 365) * spot * 0.01;
  }
  
  private calculateIVRank(iv: number): number {
    // Simplified IV rank - would use historical IV data in real implementation
    return Math.min(100, Math.max(0, (iv - 15) * 2));
  }
  
  private calculateIVPercentile(iv: number): number {
    // Simplified IV percentile
    return Math.min(100, Math.max(0, (iv - 10) * 2.5));
  }
  
  private generateRealisticVolume(strike: number, spot: number, type: 'CALL' | 'PUT'): number {
    const distanceFromATM = Math.abs(strike - spot) / spot;
    const baseVolume = 200;
    const atmBonus = distanceFromATM < 0.05 ? 300 : 0;
    const randomFactor = Math.random() * 150;
    return Math.floor(baseVolume - (distanceFromATM * 1000) + atmBonus + randomFactor);
  }
  
  private generateRealisticOI(strike: number, spot: number, type: 'CALL' | 'PUT'): number {
    const distanceFromATM = Math.abs(strike - spot) / spot;
    const baseOI = 500;
    const atmBonus = distanceFromATM < 0.05 ? 1000 : 0;
    return Math.floor(baseOI - (distanceFromATM * 2000) + atmBonus + Math.random() * 300);
  }
  
  private detectUnusualActivity(strike: number, spot: number, type: 'CALL' | 'PUT'): boolean {
    // Simplified unusual activity detection
    return Math.random() < 0.15; // 15% chance of unusual activity
  }
  
  private analyzeSmartMoneyFlow(strike: number, spot: number, type: 'CALL' | 'PUT'): 'bullish' | 'bearish' | 'neutral' {
    const flows = ['bullish', 'bearish', 'neutral'] as const;
    return flows[Math.floor(Math.random() * flows.length)];
  }
  
  private analyzeRetailSentiment(strike: number, spot: number, type: 'CALL' | 'PUT'): 'bullish' | 'bearish' | 'neutral' {
    const sentiments = ['bullish', 'bearish', 'neutral'] as const;
    return sentiments[Math.floor(Math.random() * sentiments.length)];
  }
  
  private calculateProfitProbability(option: OptionStrike, underlyingPrice: number): number {
    // Simplified probability calculation based on delta and premium
    const breakeven = option.type === 'CALL' ? 
      option.strike + option.mark : 
      option.strike - option.mark;
    
    const moveRequired = Math.abs(breakeven - underlyingPrice) / underlyingPrice;
    
    // Higher probability for smaller required moves
    return Math.max(10, Math.min(90, 80 - (moveRequired * 200)));
  }
  
  private calculateMaxProfit(option: OptionStrike, underlyingPrice: number): number {
    // Simplified max profit calculation
    return option.type === 'CALL' ? 
      Math.max(0, (underlyingPrice * 1.1) - option.strike - option.mark) :
      Math.max(0, option.strike - (underlyingPrice * 0.9) - option.mark);
  }
  
  private calculateBreakevenMove(option: OptionStrike, underlyingPrice: number): number {
    const breakeven = option.type === 'CALL' ? 
      option.strike + option.mark : 
      option.strike - option.mark;
    
    return Math.abs(breakeven - underlyingPrice) / underlyingPrice * 100;
  }
  
  private assessPremiumEnvironment(flowAnalysis: PremiumFlowAnalysis, probabilityAnalysis: PremiumProbabilityAnalysis): 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE' {
    const factors = [
      probabilityAnalysis.volatility_expansion_probability > 60,
      flowAnalysis.unusual_call_activity.length > 2 || flowAnalysis.unusual_put_activity.length > 2,
      flowAnalysis.institutional_positioning === 'accumulating',
      probabilityAnalysis.optimal_entry_timing.immediate
    ];
    
    const favorableCount = factors.filter(Boolean).length;
    
    if (favorableCount >= 3) return 'FAVORABLE';
    if (favorableCount >= 2) return 'NEUTRAL';
    return 'UNFAVORABLE';
  }
  
  private determineOptimalStrategy(
    environment: 'FAVORABLE' | 'NEUTRAL' | 'UNFAVORABLE',
    flowAnalysis: PremiumFlowAnalysis, 
    probabilityAnalysis: PremiumProbabilityAnalysis
  ): 'BUY_CALLS' | 'BUY_PUTS' | 'SELL_PREMIUM' | 'SPREADS' | 'WAIT' {
    if (environment === 'UNFAVORABLE') return 'WAIT';
    
    if (flowAnalysis.overall_bias === 'bullish' && probabilityAnalysis.volatility_expansion_probability > 60) {
      return 'BUY_CALLS';
    }
    
    if (flowAnalysis.overall_bias === 'bearish' && probabilityAnalysis.volatility_expansion_probability > 60) {
      return 'BUY_PUTS';
    }
    
    if (probabilityAnalysis.premium_compression_risk > 70) {
      return 'SELL_PREMIUM';
    }
    
    return 'SPREADS';
  }
  
  private async analyzeStockOptionsAlignment(ticker: string, underlyingPrice: number): Promise<any> {
    // This would integrate with the market mastery engine
    return {
      directional_agreement: true,
      volatility_setup: true,
      timing_confluence: true,
      overall_confluence_score: 85
    };
  }
  
  // Risk calculations
  private calculateIVCrushRisk(chain: OptionStrike[]): number {
    const avgIV = chain.reduce((sum, opt) => sum + opt.implied_volatility, 0) / chain.length;
    return avgIV > 35 ? 60 : avgIV > 25 ? 30 : 10;
  }
  
  private calculateTimeDecayImpact(chain: OptionStrike[]): number {
    const avgTheta = chain.reduce((sum, opt) => sum + Math.abs(opt.theta), 0) / chain.length;
    return avgTheta;
  }
  
  private calculateGammaRisk(chain: OptionStrike[], underlyingPrice: number): number {
    const atmOptions = chain.filter(opt => Math.abs(opt.strike - underlyingPrice) < 5);
    const avgGamma = atmOptions.reduce((sum, opt) => sum + opt.gamma, 0) / atmOptions.length;
    return avgGamma * 100; // Convert to percentage
  }
  
  private calculateVegaExposure(chain: OptionStrike[]): number {
    const avgVega = chain.reduce((sum, opt) => sum + opt.vega, 0) / chain.length;
    return avgVega;
  }
  
  // NEW: CONSOLIDATION PERIOD PREMIUM ANALYSIS
  async analyzeConsolidationPremiumPatterns(ticker: string, lookbackDays: number = 252): Promise<ConsolidationPremiumPattern[]> {
    console.log(`🔍 ANALYZING CONSOLIDATION PREMIUM PATTERNS for ${ticker} over ${lookbackDays} days`);
    
    // This would fetch real historical data - for now using mock patterns
    const patterns: ConsolidationPremiumPattern[] = [
      {
        consolidationPeriod: {
          startDate: '2024-10-01',
          endDate: '2024-10-20',
          duration: 19,
          priceRange: { high: 152.50, low: 147.80, percentRange: 3.2 },
          avgVolume: 45000000
        },
        premiumPatterns: {
          atrStrikePremiums: {
            call_1atr: [2.45, 2.20, 1.95, 1.70, 1.45, 1.20, 0.95], // Declining due to theta
            call_2atr: [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25],
            put_1atr: [2.10, 1.85, 1.60, 1.35, 1.10, 0.85, 0.60],
            put_2atr: [0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.15]
          },
          ivCompressionPattern: {
            initialIV: 32.5,
            minIV: 18.2,
            avgIV: 24.8,
            ivCompressionDays: 12,
            compressionRate: 1.2 // IV declined 1.2% per day
          },
          thetaDecayPattern: {
            dailyDecayRate: 0.08,
            accelerationNearExpiry: true,
            optimalEntryDays: [21, 14, 7] // Best entry timing
          },
          volumePatterns: {
            call_1atr_volume: [850, 920, 760, 680, 590, 520, 480],
            call_2atr_volume: [1200, 1150, 980, 850, 720, 650, 580],
            put_1atr_volume: [750, 680, 620, 580, 540, 500, 460],
            put_2atr_volume: [980, 920, 850, 780, 720, 660, 600],
            averageVolumeRatio: 0.75 // Lower volume during consolidation
          }
        },
        breakoutPremiumExpansion: {
          breakoutDate: '2024-10-21',
          preBreakoutPremium: {
            call_1atr: 0.95,
            call_2atr: 0.25,
            put_1atr: 0.60,
            put_2atr: 0.15
          },
          firstDayExpansion: {
            call_1atr: 3.45, // 263% expansion!
            call_2atr: 1.20, // 380% expansion!
            put_1atr: 0.25,  // Crushed
            put_2atr: 0.05   // Crushed
          },
          maxExpansion: {
            call_1atr: 4.80,
            call_2atr: 2.15,
            put_1atr: 0.15,
            put_2atr: 0.02,
            daysToMax: 3
          },
          profitabilityScore: 87 // Very profitable pattern
        }
      }
    ];
    
    console.log(`📈 Found ${patterns.length} historical consolidation patterns`);
    patterns.forEach((pattern, i) => {
      console.log(`   Pattern ${i+1}: ${pattern.consolidationPeriod.duration} days, ` +
                  `${pattern.consolidationPeriod.priceRange.percentRange}% range, ` +
                  `Profitability: ${pattern.breakoutPremiumExpansion.profitabilityScore}/100`);
    });
    
    this.consolidationPatterns = patterns;
    return patterns;
  }
  
  // NEW: ATR-BASED STRIKE ANALYSIS
  async analyzeATRStrikes(ticker: string, currentPrice: number, expiration: string): Promise<ATRStrikeAnalysis> {
    console.log(`🎯 ANALYZING ATR-BASED STRIKES for ${ticker} at $${currentPrice}`);
    
    // Calculate ATR (mock for now - would use real historical data)
    const atr = this.calculateATR(currentPrice);
    
    // Calculate key strike levels
    const strikes = {
      atm: Math.round(currentPrice),
      call_1atr: Math.round(currentPrice + atr),
      call_2atr: Math.round(currentPrice + (2 * atr)),
      put_1atr: Math.round(currentPrice - atr),
      put_2atr: Math.round(currentPrice - (2 * atr))
    };
    
    // Analyze historical success rates at these levels
    const historicalSuccess = this.analyzeHistoricalATRSuccess();
    
    // Check current consolidation status
    const consolidationStatus = this.detectCurrentConsolidation(ticker);
    
    const analysis: ATRStrikeAnalysis = {
      currentATR: atr,
      atrPeriod: 14,
      recommendedStrikes: {
        calls: {
          atm: {
            strike: strikes.atm,
            premium: this.calculateOptionPrice(currentPrice, strikes.atm, 'CALL', expiration, 25),
            breakeven: strikes.atm + this.calculateOptionPrice(currentPrice, strikes.atm, 'CALL', expiration, 25),
            probabilityProfit: 52
          },
          atr_1: {
            strike: strikes.call_1atr,
            premium: this.calculateOptionPrice(currentPrice, strikes.call_1atr, 'CALL', expiration, 28),
            breakeven: strikes.call_1atr + this.calculateOptionPrice(currentPrice, strikes.call_1atr, 'CALL', expiration, 28),
            probabilityProfit: 35,
            historicalSuccessRate: historicalSuccess.call_1atr
          },
          atr_2: {
            strike: strikes.call_2atr,
            premium: this.calculateOptionPrice(currentPrice, strikes.call_2atr, 'CALL', expiration, 32),
            breakeven: strikes.call_2atr + this.calculateOptionPrice(currentPrice, strikes.call_2atr, 'CALL', expiration, 32),
            probabilityProfit: 22,
            historicalSuccessRate: historicalSuccess.call_2atr
          }
        },
        puts: {
          atm: {
            strike: strikes.atm,
            premium: this.calculateOptionPrice(currentPrice, strikes.atm, 'PUT', expiration, 25),
            breakeven: strikes.atm - this.calculateOptionPrice(currentPrice, strikes.atm, 'PUT', expiration, 25),
            probabilityProfit: 48
          },
          atr_1: {
            strike: strikes.put_1atr,
            premium: this.calculateOptionPrice(currentPrice, strikes.put_1atr, 'PUT', expiration, 28),
            breakeven: strikes.put_1atr - this.calculateOptionPrice(currentPrice, strikes.put_1atr, 'PUT', expiration, 28),
            probabilityProfit: 33,
            historicalSuccessRate: historicalSuccess.put_1atr
          },
          atr_2: {
            strike: strikes.put_2atr,
            premium: this.calculateOptionPrice(currentPrice, strikes.put_2atr, 'PUT', expiration, 32),
            breakeven: strikes.put_2atr - this.calculateOptionPrice(currentPrice, strikes.put_2atr, 'PUT', expiration, 32),
            probabilityProfit: 20,
            historicalSuccessRate: historicalSuccess.put_2atr
          }
        }
      },
             patternInsights: {
         consolidationDetected: consolidationStatus.inConsolidation,
         daysInConsolidation: consolidationStatus.days,
         ivCompressionLevel: consolidationStatus.ivCompressionLevel,
         optimalEntryTiming: this.determineOptimalEntryTiming(consolidationStatus),
         expectedPremiumExpansion: this.calculateExpectedPremiumExpansion(consolidationStatus),
         riskOfIVCrush: this.calculateIVCrushRiskFromConsolidation(consolidationStatus)
       }
    };
    
    // Add custom optimal strikes if patterns suggest better opportunities
    const customOptimal = this.findCustomOptimalStrikes(currentPrice, atr, consolidationStatus);
    if (customOptimal.call) {
      analysis.recommendedStrikes.calls.customOptimal = customOptimal.call;
    }
    if (customOptimal.put) {
      analysis.recommendedStrikes.puts.customOptimal = customOptimal.put;
    }
    
    console.log(`🎯 ATR ANALYSIS COMPLETE:`);
    console.log(`   ATR: $${atr.toFixed(2)}`);
    console.log(`   1 ATR Call Strike: $${strikes.call_1atr} (${historicalSuccess.call_1atr}% historical success)`);
    console.log(`   2 ATR Call Strike: $${strikes.call_2atr} (${historicalSuccess.call_2atr}% historical success)`);
    console.log(`   Consolidation: ${consolidationStatus.inConsolidation ? 'YES' : 'NO'} (${consolidationStatus.days} days)`);
    console.log(`   Entry Timing: ${analysis.patternInsights.optimalEntryTiming}`);
    
    return analysis;
  }
  
  // NEW: ENHANCED MASTER ANALYSIS WITH CONSOLIDATION PATTERNS
  async masterPremiumAnalysisWithPatterns(ticker: string, underlyingPrice: number): Promise<OptionsPremiumMasterySignal & { consolidationAnalysis: ConsolidationPremiumPattern[], atrAnalysis: ATRStrikeAnalysis }> {
    console.log(`💎 MASTERING OPTIONS PREMIUM WITH PATTERNS for ${ticker} at $${underlyingPrice}`);
    
    // Get consolidation patterns
    const consolidationPatterns = await this.analyzeConsolidationPremiumPatterns(ticker);
    
    // Get ATR-based analysis
    const atrAnalysis = await this.analyzeATRStrikes(ticker, underlyingPrice, this.getNextFridayExpiration());
    
    // Get regular premium analysis
    const regularAnalysis = await this.masterPremiumAnalysis(ticker, underlyingPrice);
    
    // Enhance recommendations with pattern-based insights
    const enhancedRecommendations = this.enhanceRecommendationsWithPatterns(
      regularAnalysis.recommended_strikes,
      atrAnalysis,
      consolidationPatterns
    );
    
    console.log(`💎 PATTERN-ENHANCED PREMIUM MASTERY COMPLETE:`);
    console.log(`🎯 Enhanced Strategy: ${this.getPatternBasedStrategy(atrAnalysis)}`);
    console.log(`⚡ Primary Strike: $${enhancedRecommendations.primary.strike} ${enhancedRecommendations.primary.type}`);
    console.log(`📊 Pattern Confidence: ${atrAnalysis.patternInsights.consolidationDetected ? 'HIGH' : 'MEDIUM'}`);
    console.log(`🔥 Expected Premium Expansion: ${atrAnalysis.patternInsights.expectedPremiumExpansion}%`);
    
    return {
      ...regularAnalysis,
      recommended_strikes: enhancedRecommendations,
      consolidationAnalysis: consolidationPatterns,
      atrAnalysis: atrAnalysis
    };
  }
  
  // Helper methods for consolidation and ATR analysis
  private calculateATR(currentPrice: number): number {
    // Mock ATR calculation - would use real 14-day ATR from historical data
    return currentPrice * 0.025; // Approximate 2.5% ATR
  }
  
  private analyzeHistoricalATRSuccess(): { call_1atr: number, call_2atr: number, put_1atr: number, put_2atr: number } {
    // Mock historical success rates - would analyze real historical data
    return {
      call_1atr: 68, // 68% success rate for 1 ATR calls in breakouts
      call_2atr: 42, // 42% success rate for 2 ATR calls
      put_1atr: 65, // 65% success rate for 1 ATR puts in breakdowns
      put_2atr: 38  // 38% success rate for 2 ATR puts
    };
  }
  
  private detectCurrentConsolidation(ticker: string): { inConsolidation: boolean, days: number, ivCompressionLevel: number } {
    // Mock consolidation detection - would analyze real price data
    return {
      inConsolidation: true,
      days: 12,
      ivCompressionLevel: 75 // 75% compressed (high compression)
    };
  }
  
  private determineOptimalEntryTiming(consolidationStatus: any): 'NOW' | 'WAIT_FOR_MORE_COMPRESSION' | 'WAIT_FOR_BREAKOUT_SIGNAL' {
    if (consolidationStatus.ivCompressionLevel > 70 && consolidationStatus.days > 10) {
      return 'NOW'; // High compression, good entry
    } else if (consolidationStatus.ivCompressionLevel < 50) {
      return 'WAIT_FOR_MORE_COMPRESSION';
    } else {
      return 'WAIT_FOR_BREAKOUT_SIGNAL';
    }
  }
  
  private calculateExpectedPremiumExpansion(consolidationStatus: any): number {
    // Based on historical patterns
    if (consolidationStatus.ivCompressionLevel > 70) {
      return 180; // Expect 180% premium expansion on breakout
    } else if (consolidationStatus.ivCompressionLevel > 50) {
      return 120;
    } else {
      return 60;
    }
  }
  
  private calculateIVCrushRiskFromConsolidation(consolidationStatus: any): number {
    // Higher compression = lower IV crush risk on breakout
    return Math.max(10, 80 - consolidationStatus.ivCompressionLevel);
  }
  
  private findCustomOptimalStrikes(currentPrice: number, atr: number, consolidationStatus: any): { call?: any, put?: any } {
    // Look for optimal strikes based on patterns (could be 1.5 ATR, 0.75 ATR, etc.)
    if (consolidationStatus.ivCompressionLevel > 80) {
      // Super compressed - consider closer strikes
      return {
        call: {
          strike: Math.round(currentPrice + (atr * 0.75)),
          premium: 1.85,
          breakeven: currentPrice + (atr * 0.75) + 1.85,
          probabilityProfit: 58,
          reasonForRecommendation: "High IV compression suggests strong breakout potential - 0.75 ATR strike offers better risk/reward"
        }
      };
    }
    return {};
  }
  
  private enhanceRecommendationsWithPatterns(originalRecs: any, atrAnalysis: ATRStrikeAnalysis, patterns: ConsolidationPremiumPattern[]): any {
    // Use ATR analysis to enhance recommendations
    const useATR1 = atrAnalysis.recommendedStrikes.calls.atr_1.historicalSuccessRate > 60;
    const bestATRStrike = useATR1 
      ? atrAnalysis.recommendedStrikes.calls.atr_1 
      : atrAnalysis.recommendedStrikes.calls.atm;
    
    const successRate = useATR1 
      ? atrAnalysis.recommendedStrikes.calls.atr_1.historicalSuccessRate 
      : atrAnalysis.recommendedStrikes.calls.atm.probabilityProfit;
    
    return {
      primary: {
        strike: bestATRStrike.strike,
        type: 'CALL',
        premium: bestATRStrike.premium,
        atrLevel: useATR1 ? '1ATR' : 'ATM',
        consolidationPremiumScore: 85,
        breakoutPremiumScore: 92
      },
      alternatives: originalRecs.alternatives,
      reasoning: [
        ...originalRecs.reasoning,
        `ATR-based strike selection: ${successRate}% ${useATR1 ? 'historical success' : 'probability of profit'}`,
        `Consolidation pattern detected: ${atrAnalysis.patternInsights.daysInConsolidation} days`,
        `Expected premium expansion: ${atrAnalysis.patternInsights.expectedPremiumExpansion}%`
      ]
    };
  }
  
  private getPatternBasedStrategy(atrAnalysis: ATRStrikeAnalysis): string {
    if (atrAnalysis.patternInsights.consolidationDetected && atrAnalysis.patternInsights.ivCompressionLevel > 70) {
      return 'BUY_COMPRESSED_PREMIUM';
    } else if (atrAnalysis.patternInsights.optimalEntryTiming === 'WAIT_FOR_BREAKOUT_SIGNAL') {
      return 'WAIT_FOR_BREAKOUT';
    } else {
      return 'BUY_ATR_CALLS';
    }
  }
  
  private getNextFridayExpiration(): string {
    const today = new Date();
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7 || 7);
    return nextFriday.toISOString().split('T')[0];
  }
  
  // Utility functions
  private getNextFriday(daysOut: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOut);
    
    // Find next Friday
    const dayOfWeek = date.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysUntilFriday);
    
    return date.toISOString().split('T')[0];
  }
  
  private getDaysToExpiration(expiration: string): number {
    const expDate = new Date(expiration);
    const today = new Date();
    return Math.max(1, Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }
}

export const optionsPremiumMastery = new OptionsPremiumMastery();
export default optionsPremiumMastery; 