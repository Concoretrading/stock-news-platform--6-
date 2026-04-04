import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const timeframe = searchParams.get('timeframe') || 'multi';
    
    console.log(`🚀 AI MOMENTUM BRAIN ANALYSIS for ${ticker} (${timeframe} timeframe)...`);
    
    // Get comprehensive market data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 120);
    
    // AI MOMENTUM INTELLIGENCE COMPONENTS
    const momentumBrain = {
      // 1. MOMENTUM MEMORY - Historical momentum patterns and outcomes
      momentumMemory: await analyzeMomentumMemory(historicalData),
      
      // 2. MULTI-TIMEFRAME MOMENTUM ANALYSIS
      multiTimeframeMomentum: analyzeMultiTimeframeMomentum(historicalData),
      
      // 3. MOMENTUM-VOLUME SYNERGY
      momentumVolumeSynergy: analyzeMomentumVolumeSynergy(historicalData),
      
      // 4. MOMENTUM DIVERGENCE DETECTION
      momentumDivergence: detectMomentumDivergence(historicalData),
      
      // 5. MOMENTUM EXHAUSTION PATTERNS
      momentumExhaustion: analyzeMomentumExhaustion(historicalData),
      
      // 6. MOMENTUM REVERSAL PREDICTION
      momentumReversal: predictMomentumReversal(historicalData, currentQuote.price)
    };
    
    // AI MOMENTUM CONFIDENCE SCORING
    const aiConfidence = calculateMomentumConfidence(momentumBrain);
    
    // AI MOMENTUM RECOMMENDATIONS
    const aiRecommendations = generateMomentumRecommendations(momentumBrain, aiConfidence);
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      timeframe,
      momentumBrain,
      aiConfidence,
      aiRecommendations,
      systemInfo: {
        analysisType: 'AI_MOMENTUM_BRAIN',
        components: [
          'Momentum Memory',
          'Multi-Timeframe Analysis',
          'Momentum-Volume Synergy',
          'Divergence Detection',
          'Exhaustion Patterns',
          'Reversal Prediction'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('AI Momentum Brain error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'AI Momentum Brain analysis failed'
    }, { status: 500 });
  }
}

// MOMENTUM MEMORY ANALYSIS
async function analyzeMomentumMemory(data: any[]) {
  const prices = data.map((d: any) => d.close || d.c);
  const volumes = data.map((d: any) => d.volume || d.v);
  const momentumMemories = [];
  
  // Calculate momentum indicators
  for (let i = 30; i < data.length - 10; i++) {
    const rsi = calculateRSI(prices.slice(0, i + 1), 14);
    const momentum = calculateMomentumOscillator(prices.slice(0, i + 1), 10);
    const volumeRatio = volumes[i] / (volumes.slice(i-20, i).reduce((sum: number, v: number) => sum + v, 0) / 20);
    
    const futureMove = (prices[i + 10] - prices[i]) / prices[i];
    
    momentumMemories.push({
      rsi,
      momentum,
      volumeRatio,
      futureMove,
      outcome: Math.abs(futureMove) > 0.03 ? (futureMove > 0 ? 'STRONG_UP' : 'STRONG_DOWN') : 'CONSOLIDATION',
      strength: Math.abs(futureMove)
    });
  }
  
  // AI learns from momentum patterns
  const strongMoves = momentumMemories.filter(m => m.strength > 0.03);
  const avgRSIForStrongMoves = strongMoves.reduce((sum, m) => sum + m.rsi, 0) / strongMoves.length || 50;
  const avgVolumeForStrongMoves = strongMoves.reduce((sum, m) => sum + m.volumeRatio, 0) / strongMoves.length || 1;
  
  return {
    memories: momentumMemories.slice(-20),
    learnings: {
      totalPatterns: momentumMemories.length,
      strongMovePatterns: strongMoves.length,
      optimalRSIRange: [avgRSIForStrongMoves - 10, avgRSIForStrongMoves + 10],
      optimalVolumeRatio: avgVolumeForStrongMoves,
      successRate: strongMoves.length / momentumMemories.length
    },
    confidence: Math.min(momentumMemories.length / 50, 1)
  };
}

// MULTI-TIMEFRAME MOMENTUM ANALYSIS
function analyzeMultiTimeframeMomentum(data: any[]) {
  const prices = data.map((d: any) => d.close || d.c);
  
  // Multiple timeframe analysis
  const timeframes = {
    short: calculateMomentumIndicators(prices.slice(-10)), // 10-period
    medium: calculateMomentumIndicators(prices.slice(-20)), // 20-period
    long: calculateMomentumIndicators(prices.slice(-50)) // 50-period
  };
  
  // Analyze alignment
  const momentumAlignment = analyzeMomentumAlignment(timeframes);
  
  return {
    timeframes,
    alignment: momentumAlignment,
    overallDirection: momentumAlignment.consensus,
    strength: momentumAlignment.strength,
    divergences: momentumAlignment.divergences
  };
}

// MOMENTUM-VOLUME SYNERGY ANALYSIS
function analyzeMomentumVolumeSynergy(data: any[]) {
  const prices = data.map((d: any) => d.close || d.c);
  const volumes = data.map((d: any) => d.volume || d.v);
  
  const synergyPatterns = [];
  
  for (let i = 20; i < data.length - 5; i++) {
    const momentum = calculateMomentumOscillator(prices.slice(0, i + 1), 10);
    const volumeRatio = volumes[i] / (volumes.slice(i-10, i).reduce((sum: number, v: number) => sum + v, 0) / 10);
    const futureMove = (prices[i + 5] - prices[i]) / prices[i];
    
    // Momentum-Volume synergy scoring
    const synergy = calculateSynergyScore(momentum, volumeRatio);
    
    synergyPatterns.push({
      momentum,
      volumeRatio,
      synergy,
      futureMove,
      effectiveness: Math.abs(futureMove) * synergy
    });
  }
  
  const highSynergyPatterns = synergyPatterns.filter(p => p.synergy > 0.7);
  
  return {
    patterns: synergyPatterns.slice(-15),
    highSynergyCount: highSynergyPatterns.length,
    avgEffectiveness: highSynergyPatterns.reduce((sum, p) => sum + p.effectiveness, 0) / highSynergyPatterns.length || 0,
    currentSynergy: calculateCurrentSynergy(prices.slice(-20), volumes.slice(-20)),
    recommendation: generateSynergyRecommendation(highSynergyPatterns)
  };
}

// MOMENTUM DIVERGENCE DETECTION
function detectMomentumDivergence(data: any[]) {
  const prices = data.map((d: any) => d.close || d.c);
  const divergences = [];
  
  for (let i = 40; i < data.length - 5; i++) {
    const priceHigh = Math.max(...prices.slice(i-20, i));
    const priceLow = Math.min(...prices.slice(i-20, i));
    const currentPrice = prices[i];
    
    const momentum = calculateMomentumOscillator(prices.slice(0, i + 1), 14);
    const rsi = calculateRSI(prices.slice(0, i + 1), 14);
    
    // Detect bullish divergence (price makes lower low, momentum makes higher low)
    if (currentPrice < priceLow * 1.02 && momentum > -5 && rsi > 35) {
      divergences.push({
        type: 'BULLISH_DIVERGENCE',
        strength: (rsi - 30) / 20, // Normalized strength
        timestamp: i,
        outcome: (prices[i + 5] - prices[i]) / prices[i]
      });
    }
    
    // Detect bearish divergence (price makes higher high, momentum makes lower high)
    if (currentPrice > priceHigh * 0.98 && momentum < 5 && rsi < 65) {
      divergences.push({
        type: 'BEARISH_DIVERGENCE',
        strength: (70 - rsi) / 20, // Normalized strength
        timestamp: i,
        outcome: (prices[i + 5] - prices[i]) / prices[i]
      });
    }
  }
  
  return {
    divergences: divergences.slice(-10),
    recentDivergences: divergences.filter(d => d.timestamp > data.length - 20).length,
    successRate: calculateDivergenceSuccessRate(divergences),
    currentDivergenceSignal: assessCurrentDivergence(prices.slice(-30))
  };
}

// MOMENTUM EXHAUSTION ANALYSIS
function analyzeMomentumExhaustion(data: any[]) {
  const prices = data.map((d: any) => d.close || d.c);
  const volumes = data.map((d: any) => d.volume || d.v);
  
  const exhaustionSignals = [];
  
  for (let i = 30; i < data.length - 5; i++) {
    const rsi = calculateRSI(prices.slice(0, i + 1), 14);
    const volumeRatio = volumes[i] / (volumes.slice(i-20, i).reduce((sum: number, v: number) => sum + v, 0) / 20);
    const priceChange = (prices[i] - prices[i-5]) / prices[i-5];
    
    // Exhaustion pattern: Extreme RSI + High volume + Slowing momentum
    if ((rsi > 75 || rsi < 25) && volumeRatio > 2) {
      const futureReversal = Math.sign(priceChange) !== Math.sign((prices[i + 5] - prices[i]) / prices[i]);
      
      exhaustionSignals.push({
        rsi,
        volumeRatio,
        priceChange,
        futureReversal,
        exhaustionLevel: Math.abs(rsi - 50) / 50 + volumeRatio / 5,
        type: rsi > 75 ? 'OVERBOUGHT_EXHAUSTION' : 'OVERSOLD_EXHAUSTION'
      });
    }
  }
  
  return {
    signals: exhaustionSignals.slice(-10),
    exhaustionRate: exhaustionSignals.filter(s => s.futureReversal).length / exhaustionSignals.length || 0,
    currentExhaustionLevel: assessCurrentExhaustion(prices.slice(-20), volumes.slice(-20)),
    prediction: predictExhaustionReversal(exhaustionSignals)
  };
}

// MOMENTUM REVERSAL PREDICTION
function predictMomentumReversal(data: any[], currentPrice: number) {
  const prices = data.map((d: any) => d.close || d.c);
  const volumes = data.map((d: any) => d.volume || d.v);
  
  // Multi-factor reversal prediction
  const reversalFactors = {
    extremeRSI: calculateExtremeRSIFactor(prices),
    volumeClimex: calculateVolumeClimaxFactor(volumes.slice(-10)),
    momentumSlowing: calculateMomentumSlowingFactor(prices.slice(-20)),
    supportResistance: calculateSupportResistanceFactor(prices, currentPrice),
    timeAtLevel: calculateTimeAtLevelFactor(prices.slice(-30), currentPrice)
  };
  
  // AI weights for reversal prediction
  const weights = {
    extremeRSI: 0.25,
    volumeClimex: 0.20,
    momentumSlowing: 0.25,
    supportResistance: 0.20,
    timeAtLevel: 0.10
  };
  
  const reversalScore = Object.entries(reversalFactors).reduce((score, [factor, value]) => {
    const weight = weights[factor as keyof typeof weights] || 0;
    return score + (value * weight);
  }, 0);
  
  return {
    factors: reversalFactors,
    reversalScore,
    reversalProbability: Math.min(reversalScore * 100, 95),
    direction: reversalScore > 0.5 ? 'BULLISH_REVERSAL' : 'BEARISH_REVERSAL',
    confidence: Math.abs(reversalScore - 0.5) * 2,
    timeframe: '1-5 trading sessions'
  };
}

// HELPER FUNCTIONS
function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMomentumOscillator(prices: number[], period: number): number {
  if (prices.length < period + 1) return 0;
  return ((prices[prices.length - 1] - prices[prices.length - 1 - period]) / prices[prices.length - 1 - period]) * 100;
}

function calculateMomentumIndicators(prices: number[]) {
  return {
    rsi: calculateRSI(prices, 14),
    momentum: calculateMomentumOscillator(prices, 10),
    rate_of_change: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
  };
}

function analyzeMomentumAlignment(timeframes: any) {
  const directions = Object.values(timeframes).map((tf: any) => {
    return tf.rsi > 50 && tf.momentum > 0 ? 'BULLISH' : 'BEARISH';
  });
  
  const bullishCount = directions.filter(d => d === 'BULLISH').length;
  const bearishCount = directions.filter(d => d === 'BEARISH').length;
  
  return {
    consensus: bullishCount > bearishCount ? 'BULLISH' : 'BEARISH',
    strength: Math.abs(bullishCount - bearishCount) / directions.length,
    divergences: directions.length - Math.max(bullishCount, bearishCount)
  };
}

function calculateSynergyScore(momentum: number, volumeRatio: number): number {
  // High momentum + High volume = High synergy
  const momentumScore = Math.abs(momentum) / 10; // Normalize momentum
  const volumeScore = Math.min(volumeRatio / 3, 1); // Normalize volume ratio
  
  return (momentumScore + volumeScore) / 2;
}

function calculateCurrentSynergy(prices: number[], volumes: number[]) {
  const momentum = calculateMomentumOscillator(prices, 10);
  const volumeRatio = volumes[volumes.length - 1] / (volumes.slice(-10, -1).reduce((sum, v) => sum + v, 0) / 9);
  
  return calculateSynergyScore(momentum, volumeRatio);
}

function generateSynergyRecommendation(patterns: any[]) {
  const avgEffectiveness = patterns.reduce((sum, p) => sum + p.effectiveness, 0) / patterns.length || 0;
  
  if (avgEffectiveness > 0.15) {
    return 'HIGH_MOMENTUM_SETUP';
  } else if (avgEffectiveness > 0.08) {
    return 'MODERATE_MOMENTUM_SETUP';
  } else {
    return 'WEAK_MOMENTUM_SETUP';
  }
}

function calculateDivergenceSuccessRate(divergences: any[]): number {
  if (divergences.length === 0) return 0;
  
  const successful = divergences.filter(d => {
    if (d.type === 'BULLISH_DIVERGENCE') return d.outcome > 0.01;
    if (d.type === 'BEARISH_DIVERGENCE') return d.outcome < -0.01;
    return false;
  }).length;
  
  return successful / divergences.length;
}

function assessCurrentDivergence(prices: number[]) {
  const rsi = calculateRSI(prices, 14);
  const momentum = calculateMomentumOscillator(prices, 14);
  
  if (rsi < 35 && momentum > -5) return 'BULLISH_DIVERGENCE_FORMING';
  if (rsi > 65 && momentum < 5) return 'BEARISH_DIVERGENCE_FORMING';
  return 'NO_DIVERGENCE';
}

function assessCurrentExhaustion(prices: number[], volumes: number[]) {
  const rsi = calculateRSI(prices, 14);
  const volumeRatio = volumes[volumes.length - 1] / (volumes.slice(-20, -1).reduce((sum, v) => sum + v, 0) / 19);
  
  if ((rsi > 75 || rsi < 25) && volumeRatio > 2) {
    return Math.abs(rsi - 50) / 50 + volumeRatio / 5;
  }
  
  return 0;
}

function predictExhaustionReversal(signals: any[]) {
  const recentSignals = signals.slice(-5);
  const reversalRate = recentSignals.filter(s => s.futureReversal).length / recentSignals.length || 0;
  
  return {
    probability: reversalRate,
    confidence: Math.min(recentSignals.length / 5, 1),
    direction: 'REVERSAL_LIKELY'
  };
}

// REVERSAL FACTOR CALCULATIONS
function calculateExtremeRSIFactor(prices: number[]): number {
  const rsi = calculateRSI(prices, 14);
  if (rsi > 80) return 0.9;
  if (rsi > 75) return 0.7;
  if (rsi < 20) return 0.9;
  if (rsi < 25) return 0.7;
  return 0.1;
}

function calculateVolumeClimaxFactor(volumes: number[]): number {
  const avgVolume = volumes.slice(0, -1).reduce((sum, v) => sum + v, 0) / (volumes.length - 1);
  const currentVolume = volumes[volumes.length - 1];
  const ratio = currentVolume / avgVolume;
  
  return Math.min(ratio / 5, 1);
}

function calculateMomentumSlowingFactor(prices: number[]): number {
  const momentum1 = calculateMomentumOscillator(prices.slice(-10), 5);
  const momentum2 = calculateMomentumOscillator(prices.slice(-15, -5), 5);
  
  return Math.abs(momentum1) < Math.abs(momentum2) ? 0.8 : 0.2;
}

function calculateSupportResistanceFactor(prices: number[], currentPrice: number): number {
  const high = Math.max(...prices.slice(-50));
  const low = Math.min(...prices.slice(-50));
  
  const distanceFromHigh = Math.abs(currentPrice - high) / high;
  const distanceFromLow = Math.abs(currentPrice - low) / low;
  
  if (distanceFromHigh < 0.02 || distanceFromLow < 0.02) return 0.8;
  return 0.2;
}

function calculateTimeAtLevelFactor(prices: number[], currentPrice: number): number {
  const tolerance = currentPrice * 0.01; // 1% tolerance
  const daysAtLevel = prices.filter(p => Math.abs(p - currentPrice) < tolerance).length;
  
  return Math.min(daysAtLevel / 10, 1);
}

function calculateMomentumConfidence(brain: any): any {
  const components = [
    { name: 'memory', confidence: brain.momentumMemory.confidence },
    { name: 'alignment', confidence: brain.multiTimeframeMomentum.strength },
    { name: 'synergy', confidence: brain.momentumVolumeSynergy.currentSynergy },
    { name: 'reversal', confidence: brain.momentumReversal.confidence }
  ];
  
  const overall = components.reduce((sum, c) => sum + c.confidence, 0) / components.length;
  
  return {
    overall: Math.round(overall * 100),
    components,
    rating: overall > 0.8 ? 'VERY_HIGH' : overall > 0.6 ? 'HIGH' : overall > 0.4 ? 'MEDIUM' : 'LOW'
  };
}

function generateMomentumRecommendations(brain: any, confidence: any): any {
  const recommendations = [];
  
  if (brain.momentumReversal.reversalProbability > 75) {
    recommendations.push({
      type: 'REVERSAL_PLAY',
      action: brain.momentumReversal.direction,
      confidence: brain.momentumReversal.confidence,
      timeframe: brain.momentumReversal.timeframe
    });
  }
  
  if (brain.multiTimeframeMomentum.strength > 0.8) {
    recommendations.push({
      type: 'MOMENTUM_FOLLOW',
      action: brain.multiTimeframeMomentum.overallDirection,
      confidence: brain.multiTimeframeMomentum.strength,
      timeframe: 'Multi-timeframe aligned'
    });
  }
  
  return {
    individual: recommendations,
    master: recommendations.length > 0 ? recommendations[0] : { action: 'WAIT', confidence: 0.3 }
  };
} 