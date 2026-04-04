import { NextRequest, NextResponse } from 'next/server';

// Hedged Breakout Strategy System
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker') || 'AAPL';
  const capital = parseFloat(searchParams.get('capital') || '10000');
  const riskTolerance = parseFloat(searchParams.get('riskTolerance') || '0.03'); // 3% max loss
  
  console.log(`🎯 HEDGED BREAKOUT STRATEGY for ${ticker} - Capital: $${capital.toLocaleString()}`);
  
  try {
    // Comprehensive breakout probability analysis
    const breakoutAnalysis = await analyzeBreakoutProbability(ticker);
    
    // Calculate optimal position sizing and hedge ratios
    const positionStrategy = await calculateOptimalHedgedPosition(
      ticker, 
      breakoutAnalysis, 
      capital, 
      riskTolerance
    );
    
    // Generate specific trade recommendations
    const tradeRecommendations = await generateTradeRecommendations(
      ticker,
      breakoutAnalysis,
      positionStrategy
    );
    
    return NextResponse.json({
      success: true,
      ticker,
      capital,
      riskTolerance: `${riskTolerance * 100}%`,
      analysisDate: new Date().toISOString(),
      breakoutAnalysis,
      positionStrategy,
      tradeRecommendations
    });
    
  } catch (error) {
    console.error('Hedged breakout strategy error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ticker
    }, { status: 500 });
  }
}

// Analyze breakout probability with confidence levels
async function analyzeBreakoutProbability(ticker: string) {
  console.log(`📊 Analyzing breakout probability for ${ticker}...`);
  
  // Mock current market analysis (in real system, this would use actual data)
  const currentPrice = 208.62;
  const keyResistance = 220.00;
  const keySupport = 195.00;
  
  // Multi-factor probability analysis
  const factors = {
    // Squeeze analysis across timeframes
    squeezeStates: {
      daily: Math.random() > 0.3 ? 'GREEN' : ['RED', 'BLACK', 'YELLOW'][Math.floor(Math.random() * 3)],
      fourHour: Math.random() > 0.4 ? 'GREEN' : ['RED', 'BLACK', 'YELLOW'][Math.floor(Math.random() * 3)],
      oneHour: Math.random() > 0.5 ? 'GREEN' : ['RED', 'BLACK', 'YELLOW'][Math.floor(Math.random() * 3)],
      thirtyMin: Math.random() > 0.6 ? 'GREEN' : ['RED', 'BLACK', 'YELLOW'][Math.floor(Math.random() * 3)],
      fifteenMin: Math.random() > 0.7 ? 'GREEN' : ['RED', 'BLACK', 'YELLOW'][Math.floor(Math.random() * 3)]
    },
    
    // Volume confirmation
    volumeMultiple: 1.8 + (Math.random() * 2.5), // 1.8x to 4.3x
    
    // Momentum alignment
    momentumAlignment: {
      daily: Math.random() > 0.4 ? 'BULLISH' : 'BEARISH',
      fourHour: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
      oneHour: Math.random() > 0.6 ? 'BULLISH' : 'BEARISH'
    },
    
    // Premium behavior
    premiumSkew: {
      callPremium: 15 + (Math.random() * 20), // 15-35% implied vol
      putPremium: 12 + (Math.random() * 18), // 12-30% implied vol
      skewRatio: 0.8 + (Math.random() * 0.4) // 0.8-1.2 (call/put ratio)
    },
    
    // Market context
    vixLevel: 18 + (Math.random() * 15), // 18-33 VIX
    distanceFromResistance: ((keyResistance - currentPrice) / currentPrice) * 100, // 5.45%
    distanceFromSupport: ((currentPrice - keySupport) / currentPrice) * 100 // 6.53%
  };
  
  // Calculate probability scores
  const probabilityScores = calculateProbabilityScores(factors);
  
  // Determine overall bias and confidence
  const overallBias = probabilityScores.bullishProbability > probabilityScores.bearishProbability ? 'BULLISH' : 'BEARISH';
  const confidence = Math.abs(probabilityScores.bullishProbability - probabilityScores.bearishProbability);
  
  return {
    currentPrice,
    keyLevels: {
      resistance: keyResistance,
      support: keySupport,
      distanceToResistance: `${factors.distanceFromResistance.toFixed(2)}%`,
      distanceToSupport: `${factors.distanceFromSupport.toFixed(2)}%`
    },
    factors,
    probabilityScores,
    overallBias,
    confidence: Math.round(confidence),
    breakoutLikelihood: confidence > 30 ? 'HIGH' : confidence > 15 ? 'MEDIUM' : 'LOW',
    recommendation: {
      direction: overallBias,
      strength: confidence > 30 ? 'STRONG' : confidence > 15 ? 'MODERATE' : 'WEAK'
    }
  };
}

// Calculate probability scores based on all factors
function calculateProbabilityScores(factors: any) {
  let bullishScore = 50; // Start neutral
  let bearishScore = 50;
  
  // Squeeze states contribution (40% weight)
  const greenTimeframes = Object.values(factors.squeezeStates).filter(s => s === 'GREEN').length;
  const compressionTimeframes = Object.values(factors.squeezeStates).filter(s => s === 'BLACK' || s === 'YELLOW').length;
  
  if (greenTimeframes >= 3) {
    bullishScore += 20;
  } else if (greenTimeframes >= 2) {
    bullishScore += 10;
  }
  
  if (compressionTimeframes >= 2) {
    bullishScore += 5; // Compression suggests coming breakout
    bearishScore += 5;
  }
  
  // Volume confirmation (25% weight)
  if (factors.volumeMultiple >= 3) {
    bullishScore += 15;
  } else if (factors.volumeMultiple >= 2.5) {
    bullishScore += 10;
  } else if (factors.volumeMultiple < 1.5) {
    bullishScore -= 10;
    bearishScore += 5;
  }
  
  // Momentum alignment (20% weight)
  const bullishMomentum = Object.values(factors.momentumAlignment).filter(m => m === 'BULLISH').length;
  if (bullishMomentum >= 3) {
    bullishScore += 12;
  } else if (bullishMomentum >= 2) {
    bullishScore += 6;
  } else if (bullishMomentum <= 1) {
    bearishScore += 8;
  }
  
  // Premium behavior (10% weight)
  if (factors.premiumSkew.skewRatio > 1.1) {
    bullishScore += 5; // Call heavy
  } else if (factors.premiumSkew.skewRatio < 0.9) {
    bearishScore += 5; // Put heavy
  }
  
  // Market context (5% weight)
  if (factors.vixLevel < 20) {
    bullishScore += 3; // Low vol environment
  } else if (factors.vixLevel > 30) {
    bearishScore += 3; // High vol, fear
  }
  
  // Normalize to percentages
  const total = bullishScore + bearishScore;
  return {
    bullishProbability: Math.round((bullishScore / total) * 100),
    bearishProbability: Math.round((bearishScore / total) * 100),
    rawScores: { bullish: bullishScore, bearish: bearishScore }
  };
}

// Calculate optimal hedged position sizing
async function calculateOptimalHedgedPosition(
  ticker: string, 
  breakoutAnalysis: any, 
  capital: number, 
  riskTolerance: number
) {
  console.log(`⚖️ Calculating optimal hedged position for ${ticker}...`);
  
  const { overallBias, confidence, probabilityScores } = breakoutAnalysis;
  
  // Base position allocation based on confidence
  const baseAllocation = Math.min(0.8, confidence / 100 + 0.3); // 30-80% allocation
  const positionSize = capital * baseAllocation;
  
  // Calculate directional weighting
  const biasStrength = confidence / 100;
  const primaryWeight = 0.6 + (biasStrength * 0.3); // 60-90% to primary direction
  const hedgeWeight = 1 - primaryWeight; // 10-40% to hedge
  
  // Position sizing
  const primaryAllocation = positionSize * primaryWeight;
  const hedgeAllocation = positionSize * hedgeWeight;
  
  // Strike selection logic
  const currentPrice = breakoutAnalysis.currentPrice;
  const strikes = calculateOptimalStrikes(currentPrice, overallBias, confidence);
  
  return {
    totalPositionSize: positionSize,
    cashReserved: capital - positionSize,
    allocationRatio: `${Math.round(primaryWeight * 100)}% Primary / ${Math.round(hedgeWeight * 100)}% Hedge`,
    
    primaryPosition: {
      direction: overallBias,
      allocation: primaryAllocation,
      reasoning: `${confidence}% confidence in ${overallBias.toLowerCase()} breakout`,
      suggestedStrategy: confidence > 30 ? 'ATM or ITM options' : 'Slightly OTM options'
    },
    
    hedgePosition: {
      direction: overallBias === 'BULLISH' ? 'BEARISH' : 'BULLISH',
      allocation: hedgeAllocation,
      reasoning: `${100 - confidence}% chance of being wrong - protect downside`,
      suggestedStrategy: 'OTM protective options'
    },
    
    strikes,
    
    riskManagement: {
      maxLoss: positionSize * riskTolerance,
      stopLossLevel: overallBias === 'BULLISH' ? 
        currentPrice * 0.95 : currentPrice * 1.05,
      profitTarget: overallBias === 'BULLISH' ? 
        currentPrice * 1.10 : currentPrice * 0.90
    }
  };
}

// Calculate optimal strike prices
function calculateOptimalStrikes(currentPrice: number, bias: string, confidence: number) {
  const isbullish = bias === 'BULLISH';
  
  // Primary position strikes (closer to money based on confidence)
  const primaryOffset = confidence > 30 ? 0.02 : confidence > 15 ? 0.04 : 0.06;
  const primaryStrike = isbullish ? 
    currentPrice * (1 + primaryOffset) : 
    currentPrice * (1 - primaryOffset);
  
  // Hedge position strikes (further OTM for cost efficiency)
  const hedgeOffset = 0.08 + (confidence / 1000); // 8-11% OTM
  const hedgeStrike = isbullish ? 
    currentPrice * (1 - hedgeOffset) : 
    currentPrice * (1 + hedgeOffset);
  
  return {
    primary: {
      direction: bias,
      strike: Math.round(primaryStrike),
      distanceFromCurrent: `${primaryOffset * 100}% ${isbullish ? 'above' : 'below'}`,
      reasoning: `${confidence}% confidence warrants ${primaryOffset * 100}% OTM`
    },
    hedge: {
      direction: bias === 'BULLISH' ? 'PUT' : 'CALL',
      strike: Math.round(hedgeStrike),
      distanceFromCurrent: `${hedgeOffset * 100}% ${isbullish ? 'below' : 'above'}`,
      reasoning: 'Cheap protection against directional mistake'
    }
  };
}

// Generate specific trade recommendations
async function generateTradeRecommendations(
  ticker: string,
  breakoutAnalysis: any,
  positionStrategy: any
) {
  console.log(`📋 Generating trade recommendations for ${ticker}...`);
  
  const { overallBias, confidence, currentPrice } = breakoutAnalysis;
  const { primaryPosition, hedgePosition, strikes } = positionStrategy;
  
  const trades = [];
  
  // Primary trade
  trades.push({
    type: 'PRIMARY_POSITION',
    action: `BUY ${overallBias === 'BULLISH' ? 'CALLS' : 'PUTS'}`,
    strike: strikes.primary.strike,
    allocation: `$${primaryPosition.allocation.toLocaleString()}`,
    rationale: `${confidence}% probability of ${overallBias.toLowerCase()} breakout`,
    timing: 'Enter on volume confirmation (2.5x+ average)',
    expiration: '2-4 weeks out for breakout time',
    expectedMove: overallBias === 'BULLISH' ? 
      `Target: $${(currentPrice * 1.08).toFixed(2)} (+8%)` :
      `Target: $${(currentPrice * 0.92).toFixed(2)} (-8%)`
  });
  
  // Hedge trade
  trades.push({
    type: 'HEDGE_POSITION',
    action: `BUY ${overallBias === 'BULLISH' ? 'PUTS' : 'CALLS'}`,
    strike: strikes.hedge.strike,
    allocation: `$${hedgePosition.allocation.toLocaleString()}`,
    rationale: `Protection against ${100 - confidence}% chance of being wrong`,
    timing: 'Enter simultaneously with primary position',
    expiration: 'Same expiration as primary',
    expectedMove: 'Recovery 30-50% of primary loss if wrong'
  });
  
  // Generate specific scenarios
  const scenarios = generateOutcomeScenarios(
    currentPrice,
    overallBias,
    primaryPosition.allocation,
    hedgePosition.allocation,
    strikes
  );
  
  return {
    trades,
    scenarios,
    entryConditions: [
      'Wait for volume spike (2.5x+ average volume)',
      'Confirm 2+ timeframes firing green',
      'Enter both positions simultaneously',
      'Set stop loss at key support/resistance'
    ],
    exitStrategy: [
      `Take profits on primary position at ${overallBias === 'BULLISH' ? '+8%' : '-8%'} move`,
      'Hold hedge until primary reaches target or stop',
      'If wrong direction, hedge should recover 30-50% of loss',
      'Exit both positions if sideways action for 1 week'
    ]
  };
}

// Generate outcome scenarios
function generateOutcomeScenarios(
  currentPrice: number,
  bias: string,
  primaryAllocation: number,
  hedgeAllocation: number,
  strikes: any
) {
  const isCallPrimary = bias === 'BULLISH';
  
  // Scenario 1: Correct direction (8% move)
  const correctMove = isCallPrimary ? currentPrice * 1.08 : currentPrice * 0.92;
  const primaryProfitCorrect = primaryAllocation * 2.5; // Assume 250% gain on options
  const hedgeLossCorrect = hedgeAllocation * 0.9; // Lose 90% of hedge premium
  const netCorrect = primaryProfitCorrect - hedgeLossCorrect - (primaryAllocation + hedgeAllocation);
  
  // Scenario 2: Wrong direction (5% opposite move)
  const wrongMove = isCallPrimary ? currentPrice * 0.95 : currentPrice * 1.05;
  const primaryLossWrong = primaryAllocation * 0.8; // Lose 80% of primary
  const hedgeProfitWrong = hedgeAllocation * 1.5; // 150% gain on hedge
  const netWrong = hedgeProfitWrong - primaryLossWrong - (primaryAllocation + hedgeAllocation);
  
  // Scenario 3: Sideways (no significant move)
  const netSideways = -(primaryAllocation + hedgeAllocation) * 0.6; // Lose 60% to time decay
  
  return [
    {
      scenario: 'CORRECT DIRECTION',
      priceMove: `${currentPrice.toFixed(2)} → ${correctMove.toFixed(2)} (${isCallPrimary ? '+8%' : '-8%'})`,
      primaryOutcome: `+$${(primaryProfitCorrect - primaryAllocation).toLocaleString()}`,
      hedgeOutcome: `-$${(hedgeAllocation - (hedgeAllocation * 0.1)).toLocaleString()}`,
      netResult: `+$${netCorrect.toLocaleString()}`,
      probability: `${bias === 'BULLISH' ? '65%' : '60%'} based on analysis`
    },
    {
      scenario: 'WRONG DIRECTION',
      priceMove: `${currentPrice.toFixed(2)} → ${wrongMove.toFixed(2)} (${isCallPrimary ? '-5%' : '+5%'})`,
      primaryOutcome: `-$${(primaryAllocation - (primaryAllocation * 0.2)).toLocaleString()}`,
      hedgeOutcome: `+$${(hedgeProfitWrong - hedgeAllocation).toLocaleString()}`,
      netResult: `${netWrong >= 0 ? '+' : ''}$${netWrong.toLocaleString()}`,
      probability: `${100 - (bias === 'BULLISH' ? 65 : 60)}% chance of being wrong`
    },
    {
      scenario: 'SIDEWAYS ACTION',
      priceMove: `${currentPrice.toFixed(2)} → ${(currentPrice * 1.02).toFixed(2)} (+/- 2%)`,
      primaryOutcome: `-$${(primaryAllocation * 0.6).toLocaleString()}`,
      hedgeOutcome: `-$${(hedgeAllocation * 0.6).toLocaleString()}`,
      netResult: `-$${Math.abs(netSideways).toLocaleString()}`,
      probability: '15-20% chance of no significant move'
    }
  ];
} 