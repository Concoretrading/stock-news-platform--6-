import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const scanType = searchParams.get('scanType') || 'comprehensive'; // comprehensive, ema_focused, squeeze_focused
    
    console.log(`🔍 COMPREHENSIVE OPPORTUNITY SCAN for ${ticker}...`);
    
    // Get base market data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 120);
    
    // Run all analysis types in parallel for comprehensive view
    const analysisResults = await Promise.all([
      // Core technical analysis
      polygonClient.analyze21EMAOpportunity(ticker, historicalData, currentQuote.price),
      polygonClient.analyzeMultiTimeframeSqueeze(ticker),
      polygonClient.analyzeBreakout(ticker),
      
      // Advanced opportunity detection
      polygonClient.analyzePremiumMispricing(ticker, currentQuote.price * 0.95, 'support'),
      polygonClient.analyzeRealTimeBreakout(ticker, currentQuote.price * 1.05),
      polygonClient.analyzeConflictingSignals(ticker, 2)
    ]);
    
    const [
      ema21Analysis,
      squeezeAnalysis,
      breakoutAnalysis,
      premiumAnalysis,
      realTimeAnalysis,
      conflictingSignalsAnalysis
    ] = analysisResults;
    
    // COMPOSITE OPPORTUNITY SCORING
    const opportunityScore = calculateCompositeOpportunityScore(
      ema21Analysis,
      squeezeAnalysis,
      breakoutAnalysis,
      premiumAnalysis,
      realTimeAnalysis,
      conflictingSignalsAnalysis
    );
    
    // MULTI-CATALYST ANALYSIS
    const catalysts = identifyMultipleCatalysts(
      ema21Analysis,
      squeezeAnalysis,
      breakoutAnalysis,
      premiumAnalysis
    );
    
    // EDGE DETECTION - What gives us advantage over other traders?
    const edges = detectTradingEdges(
      ema21Analysis,
      squeezeAnalysis,
      premiumAnalysis,
      conflictingSignalsAnalysis
    );
    
    // TIMING ANALYSIS - When to act?
    const timingAnalysis = analyzeOptimalTiming(
      ema21Analysis,
      squeezeAnalysis,
      breakoutAnalysis,
      currentQuote
    );
    
    // RISK MANAGEMENT - Position sizing and stops
    const riskManagement = calculateAdvancedRiskManagement(
      opportunityScore,
      catalysts,
      edges,
      currentQuote.price
    );
    
    // EXECUTION PLAN
    const executionPlan = generateExecutionPlan(
      opportunityScore,
      catalysts,
      edges,
      timingAnalysis,
      riskManagement
    );
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      opportunityScore,
      catalysts,
      edges,
      timingAnalysis,
      riskManagement,
      executionPlan,
      detailedAnalysis: {
        ema21: ema21Analysis,
        squeeze: squeezeAnalysis,
        breakout: breakoutAnalysis && breakoutAnalysis[0],
        premium: premiumAnalysis,
        realTime: realTimeAnalysis,
        conflictingSignals: conflictingSignalsAnalysis
      },
      recommendation: generateFinalRecommendation(
        opportunityScore,
        catalysts,
        edges,
        executionPlan
      ),
      metadata: {
        scanType,
        timestamp: new Date().toISOString(),
        analysisCount: 6,
        dataQuality: historicalData.length > 100 ? 'HIGH' : 'MEDIUM'
      }
    });
    
  } catch (error) {
    console.error('Opportunity scanning error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to scan opportunities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// COMPOSITE OPPORTUNITY SCORING (0-100)
function calculateCompositeOpportunityScore(
  ema21: any,
  squeeze: any,
  breakout: any,
  premium: any,
  realTime: any,
  conflicting: any
): any {
  let totalScore = 0;
  let weights = {
    ema21: 25,      // 21 EMA is critical
    squeeze: 20,    // Multi-timeframe squeeze
    breakout: 15,   // Breakout patterns
    premium: 20,    // Premium mispricing
    realTime: 10,   // Real-time signals
    conflicting: 10 // Signal resolution
  };
  
  // EMA21 Score (0-25)
  let ema21Score = 0;
  if (ema21?.confidence) {
    ema21Score = (ema21.confidence / 100) * weights.ema21;
    if (ema21.opportunityType?.priority === 'HIGH') ema21Score *= 1.2;
  }
  
  // Squeeze Score (0-20)
  let squeezeScore = 0;
  if (squeeze?.timeframes) {
    const firingCount = squeeze.timeframes.filter((tf: any) => 
      tf.status === 'firing' || tf.status === 'green').length;
    const buildingCount = squeeze.timeframes.filter((tf: any) => 
      tf.status === 'building' || tf.status === 'yellow' || tf.status === 'black').length;
    
    squeezeScore = ((firingCount * 4) + (buildingCount * 2)) / 7 * weights.squeeze;
  }
  
  // Breakout Score (0-15)
  let breakoutScore = 0;
  if (breakout?.confidence) {
    breakoutScore = (breakout.confidence / 100) * weights.breakout;
  }
  
  // Premium Score (0-20)
  let premiumScore = 0;
  if (premium?.opportunities?.length > 0) {
    const highConfidenceOpps = premium.opportunities.filter((opp: any) => 
      opp.confidence === 'HIGH').length;
    premiumScore = Math.min(20, highConfidenceOpps * 10);
  }
  
  // Real-time Score (0-10)
  let realTimeScore = 0;
  if (realTime?.confidence) {
    realTimeScore = (realTime.confidence / 100) * weights.realTime;
  }
  
  // Conflicting Signals Score (0-10)
  let conflictingScore = 0;
  if (conflicting?.resolution?.clarity === 'CLEAR') {
    conflictingScore = weights.conflicting;
  } else if (conflicting?.resolution?.clarity === 'LEANING') {
    conflictingScore = weights.conflicting * 0.6;
  }
  
  totalScore = ema21Score + squeezeScore + breakoutScore + premiumScore + realTimeScore + conflictingScore;
  
  return {
    totalScore: Math.round(totalScore),
    breakdown: {
      ema21: Math.round(ema21Score),
      squeeze: Math.round(squeezeScore),
      breakout: Math.round(breakoutScore),
      premium: Math.round(premiumScore),
      realTime: Math.round(realTimeScore),
      conflicting: Math.round(conflictingScore)
    },
    grade: totalScore >= 80 ? 'EXCEPTIONAL' :
           totalScore >= 65 ? 'STRONG' :
           totalScore >= 50 ? 'MODERATE' :
           totalScore >= 35 ? 'WEAK' : 'POOR',
    actionable: totalScore >= 50
  };
}

// IDENTIFY MULTIPLE CATALYSTS
function identifyMultipleCatalysts(ema21: any, squeeze: any, breakout: any, premium: any): any[] {
  const catalysts = [];
  
  // 21 EMA Catalyst
  if (ema21?.opportunityType?.priority === 'HIGH') {
    catalysts.push({
      type: 'EMA21_SETUP',
      strength: 'HIGH',
      description: ema21.opportunityType.description,
      timeframe: ema21.opportunityType.timeframe,
      confidence: ema21.confidence
    });
  }
  
  // Squeeze Catalyst
  if (squeeze?.timeframes) {
    const firingTFs = squeeze.timeframes.filter((tf: any) => tf.status === 'firing' || tf.status === 'green');
    if (firingTFs.length >= 2) {
      catalysts.push({
        type: 'MULTI_TIMEFRAME_SQUEEZE',
        strength: firingTFs.length >= 3 ? 'VERY_HIGH' : 'HIGH',
        description: `${firingTFs.length} timeframes firing simultaneously`,
        timeframe: '1-3 days',
        confidence: 75 + (firingTFs.length * 5)
      });
    }
  }
  
  // Breakout Catalyst
  if (breakout?.signal !== 'no_signal' && breakout?.confidence > 70) {
    catalysts.push({
      type: 'BREAKOUT_PATTERN',
      strength: breakout.confidence > 85 ? 'HIGH' : 'MEDIUM',
      description: `${breakout.signal} with ${breakout.confidence}% confidence`,
      timeframe: '2-5 days',
      confidence: breakout.confidence
    });
  }
  
  // Premium Catalyst
  if (premium?.opportunities?.length > 0) {
    const highConfOpps = premium.opportunities.filter((opp: any) => opp.confidence === 'HIGH');
    if (highConfOpps.length > 0) {
      catalysts.push({
        type: 'PREMIUM_MISPRICING',
        strength: 'MEDIUM',
        description: `${highConfOpps.length} high-confidence premium opportunities`,
        timeframe: '1-2 weeks',
        confidence: 70
      });
    }
  }
  
  return catalysts;
}

// DETECT TRADING EDGES
function detectTradingEdges(ema21: any, squeeze: any, premium: any, conflicting: any): any[] {
  const edges = [];
  
  // Multi-timeframe edge
  if (squeeze?.timeframes) {
    const alignedTFs = squeeze.timeframes.filter((tf: any) => 
      tf.status === 'firing' || tf.status === 'building').length;
    if (alignedTFs >= 4) {
      edges.push({
        type: 'MULTI_TIMEFRAME_ALIGNMENT',
        description: `${alignedTFs}/7 timeframes aligned - institutional money following`,
        advantage: 'Most retail traders only watch 1-2 timeframes',
        edgeStrength: 'HIGH'
      });
    }
  }
  
  // EMA precision edge
  if (ema21?.distanceTo21EMA && Math.abs(ema21.distanceTo21EMA) < 1.5) {
    edges.push({
      type: 'PRECISE_EMA_ENTRY',
      description: `Within 1.5% of 21 EMA - institutional level precision`,
      advantage: 'Optimal risk/reward at key algorithmic level',
      edgeStrength: ema21.confidence > 80 ? 'HIGH' : 'MEDIUM'
    });
  }
  
  // Premium mispricing edge
  if (premium?.opportunities?.length > 0) {
    const premiumEdges = premium.opportunities.filter((opp: any) => 
      opp.type.includes('SELL') && opp.confidence === 'HIGH');
    if (premiumEdges.length > 0) {
      edges.push({
        type: 'PREMIUM_EDGE',
        description: 'Market makers overpricing options - sell premium opportunity',
        advantage: 'Profit from fear/greed premium inflation',
        edgeStrength: 'MEDIUM'
      });
    }
  }
  
  // Signal resolution edge
  if (conflicting?.resolution?.winningStrategy) {
    edges.push({
      type: 'SIGNAL_RESOLUTION',
      description: 'Clear resolution of conflicting signals using volume',
      advantage: 'Most traders confused by mixed signals',
      edgeStrength: 'MEDIUM'
    });
  }
  
  return edges;
}

// ANALYZE OPTIMAL TIMING
function analyzeOptimalTiming(ema21: any, squeeze: any, breakout: any, quote: any): any {
  const timing = {
    immediacy: 'MONITOR',
    optimalEntryWindow: '1-3 days',
    catalystTiming: [],
    urgency: 'LOW',
    waitingFor: []
  };
  
  // Immediate entry signals
  if (ema21?.opportunityType?.priority === 'HIGH' && ema21.confidence > 85) {
    timing.immediacy = 'IMMEDIATE';
    timing.urgency = 'HIGH';
    timing.catalystTiming.push('21 EMA setup ready now');
  }
  
  // Squeeze timing
  if (squeeze?.timeframes) {
    const yellowBlackTFs = squeeze.timeframes.filter((tf: any) => 
      tf.status === 'yellow' || tf.status === 'black').length;
    if (yellowBlackTFs >= 3) {
      timing.waitingFor.push('Squeeze to fire on 2+ timeframes');
      timing.optimalEntryWindow = '1-5 days';
    }
  }
  
  // Price action timing
  const currentPrice = quote.price;
  if (ema21?.current21EMA) {
    const distanceToEMA = Math.abs(currentPrice - ema21.current21EMA);
    const distancePercent = (distanceToEMA / currentPrice) * 100;
    
    if (distancePercent > 2.5) {
      timing.waitingFor.push(`Price to approach 21 EMA (currently ${distancePercent.toFixed(1)}% away)`);
      timing.optimalEntryWindow = '3-7 days';
    }
  }
  
  return timing;
}

// ADVANCED RISK MANAGEMENT
function calculateAdvancedRiskManagement(
  opportunityScore: any,
  catalysts: any[],
  edges: any[],
  currentPrice: number
): any {
  const basePositionSize = 2; // 2% base position
  let adjustedPositionSize = basePositionSize;
  
  // Adjust position size based on opportunity quality
  if (opportunityScore.totalScore >= 80) {
    adjustedPositionSize = 3.5; // Exceptional opportunities
  } else if (opportunityScore.totalScore >= 65) {
    adjustedPositionSize = 2.5; // Strong opportunities
  } else if (opportunityScore.totalScore < 50) {
    adjustedPositionSize = 1.0; // Weak opportunities
  }
  
  // Catalyst multiplier
  const highStrengthCatalysts = catalysts.filter(c => c.strength === 'HIGH' || c.strength === 'VERY_HIGH').length;
  if (highStrengthCatalysts >= 2) {
    adjustedPositionSize *= 1.2;
  }
  
  // Edge multiplier
  const highEdges = edges.filter(e => e.edgeStrength === 'HIGH').length;
  if (highEdges >= 2) {
    adjustedPositionSize *= 1.1;
  }
  
  // Cap maximum position size
  adjustedPositionSize = Math.min(adjustedPositionSize, 4.0);
  
  return {
    positionSize: `${adjustedPositionSize.toFixed(1)}%`,
    stopLossPercent: opportunityScore.totalScore >= 70 ? 1.5 : 2.0,
    profitTargetPercent: opportunityScore.totalScore >= 70 ? 4.0 : 3.0,
    trailingStop: opportunityScore.totalScore >= 70,
    maxDaysInTrade: catalysts.length >= 2 ? 10 : 7,
    portfolioHeatCheck: adjustedPositionSize > 3.0 ? 'ELEVATED' : 'NORMAL'
  };
}

// GENERATE EXECUTION PLAN
function generateExecutionPlan(
  opportunityScore: any,
  catalysts: any[],
  edges: any[],
  timing: any,
  riskMgmt: any
): any {
  const plan = {
    phase: 'MONITORING',
    actions: [],
    checkpoints: [],
    contingencies: []
  };
  
  if (opportunityScore.totalScore >= 65 && timing.immediacy === 'IMMEDIATE') {
    plan.phase = 'EXECUTION';
    plan.actions = [
      'Enter position immediately',
      `Position size: ${riskMgmt.positionSize}`,
      `Set stop loss at ${riskMgmt.stopLossPercent}%`,
      `Set profit target at ${riskMgmt.profitTargetPercent}%`
    ];
  } else if (opportunityScore.totalScore >= 50) {
    plan.phase = 'PREPARATION';
    plan.actions = [
      'Prepare orders for quick execution',
      'Monitor key levels closely',
      'Watch for catalyst triggers'
    ];
  }
  
  // Add checkpoints
  plan.checkpoints = [
    'Check at market open for overnight changes',
    'Reassess if new economic data released',
    'Exit if opportunity score drops below 40'
  ];
  
  // Add contingencies
  plan.contingencies = [
    'If stopped out, wait for re-entry signal',
    'If highly profitable, consider taking partial profits',
    'If market conditions change dramatically, exit immediately'
  ];
  
  return plan;
}

// GENERATE FINAL RECOMMENDATION
function generateFinalRecommendation(
  opportunityScore: any,
  catalysts: any[],
  edges: any[],
  executionPlan: any
): any {
  const rec = {
    action: 'MONITOR',
    conviction: 'LOW',
    reasoning: [],
    nextSteps: []
  };
  
  if (opportunityScore.totalScore >= 75) {
    rec.action = 'STRONG_BUY';
    rec.conviction = 'HIGH';
    rec.reasoning.push(`Exceptional opportunity score: ${opportunityScore.totalScore}/100`);
  } else if (opportunityScore.totalScore >= 60) {
    rec.action = 'BUY';
    rec.conviction = 'MEDIUM';
    rec.reasoning.push(`Strong opportunity score: ${opportunityScore.totalScore}/100`);
  } else if (opportunityScore.totalScore >= 45) {
    rec.action = 'CONSIDER';
    rec.conviction = 'LOW';
    rec.reasoning.push(`Moderate opportunity, wait for improvement`);
  }
  
  // Add catalyst reasoning
  if (catalysts.length >= 2) {
    rec.reasoning.push(`${catalysts.length} bullish catalysts aligned`);
  }
  
  // Add edge reasoning
  if (edges.length >= 2) {
    rec.reasoning.push(`${edges.length} trading edges identified`);
  }
  
  // Next steps
  rec.nextSteps = executionPlan.actions.length > 0 ? 
    executionPlan.actions : ['Continue monitoring', 'Wait for clearer signals'];
  
  return rec;
} 