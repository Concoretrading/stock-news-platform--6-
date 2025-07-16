import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const sensitivity = searchParams.get('sensitivity') || 'medium'; // low, medium, high
    
    console.log(`💰 SMART MONEY DETECTION for ${ticker} (${sensitivity} sensitivity)...`);
    
    // Get extended historical data for pattern recognition
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 60);
    
    // COMPREHENSIVE SMART MONEY ANALYSIS
    const smartMoneySignals = {
      // 1. ACCUMULATION/DISTRIBUTION DETECTION
      accumulationDistribution: analyzeAccumulationDistribution(historicalData),
      
      // 2. VOLUME PROFILE ANALYSIS
      volumeProfile: analyzeVolumeProfile(historicalData, currentQuote.price),
      
      // 3. PRICE-VOLUME DIVERGENCE
      priceVolumeDivergence: detectPriceVolumeDivergence(historicalData),
      
      // 4. INSTITUTIONAL ORDER PATTERNS
      institutionalPatterns: detectInstitutionalPatterns(historicalData),
      
      // 5. SMART MONEY INDEX CALCULATION
      smartMoneyIndex: calculateSmartMoneyIndex(historicalData),
      
      // 6. BREAKOUT PREPARATION SIGNALS
      breakoutPreparation: analyzeBreakoutPreparation(historicalData, currentQuote.price)
    };
    
    // Calculate composite smart money score
    const smartMoneyScore = calculateSmartMoneyScore(smartMoneySignals, sensitivity);
    
    // Generate actionable insights
    const insights = generateSmartMoneyInsights(smartMoneySignals, smartMoneyScore);
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      sensitivity,
      smartMoneySignals,
      smartMoneyScore,
      insights,
      recommendation: generateSmartMoneyRecommendation(smartMoneySignals, smartMoneyScore),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Smart money detection error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Smart money detection failed'
    }, { status: 500 });
  }
}

// ACCUMULATION/DISTRIBUTION ANALYSIS
function analyzeAccumulationDistribution(data: any[]) {
  const adLine = [];
  let accumulator = 0;
  
  for (let i = 0; i < data.length; i++) {
    const high = data[i].high || data[i].h || 0;
    const low = data[i].low || data[i].l || 0;
    const close = data[i].close || data[i].c || 0;
    const volume = data[i].volume || data[i].v || 0;
    
    if (high !== low) {
      const clv = ((close - low) - (high - close)) / (high - low);
      accumulator += clv * volume;
    }
    adLine.push(accumulator);
  }
  
  // Analyze trend in A/D line
  const recentAD = adLine.slice(-10);
  const adTrend = recentAD[recentAD.length - 1] - recentAD[0];
  
  return {
    adLine: adLine.slice(-20), // Last 20 values
    trend: adTrend > 0 ? 'ACCUMULATION' : 'DISTRIBUTION',
    strength: Math.abs(adTrend) / adLine[adLine.length - 1],
    confidence: Math.min(Math.abs(adTrend) / 1000000, 1),
    interpretation: adTrend > 0 ? 
      'Smart money is accumulating shares' : 
      'Smart money is distributing shares'
  };
}

// VOLUME PROFILE ANALYSIS
function analyzeVolumeProfile(data: any[], currentPrice: number) {
  const priceVolumes: { [key: string]: number } = {};
  
  // Build volume profile
  data.forEach(candle => {
    const price = Math.round((candle.close || candle.c || 0) * 100) / 100; // Round to cents
    const volume = candle.volume || candle.v || 0;
    priceVolumes[price.toString()] = (priceVolumes[price.toString()] || 0) + volume;
  });
  
  // Find volume-weighted average price (VWAP)
  let totalVolumePrice = 0;
  let totalVolume = 0;
  
  Object.entries(priceVolumes).forEach(([price, volume]) => {
    totalVolumePrice += parseFloat(price) * volume;
    totalVolume += volume;
  });
  
  const vwap = totalVolumePrice / totalVolume;
  const distanceFromVWAP = ((currentPrice - vwap) / vwap) * 100;
  
  // Find highest volume nodes (institutional interest areas)
  const sortedByVolume = Object.entries(priceVolumes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([price, volume]) => ({ price: parseFloat(price), volume }));
  
  return {
    vwap,
    distanceFromVWAP,
    highVolumeNodes: sortedByVolume,
    institutionalInterest: sortedByVolume.some(node => 
      Math.abs(node.price - currentPrice) / currentPrice < 0.02
    ) ? 'HIGH' : 'MEDIUM',
    nearestSupport: sortedByVolume.find(node => node.price < currentPrice)?.price || 0,
    nearestResistance: sortedByVolume.find(node => node.price > currentPrice)?.price || 0
  };
}

// PRICE-VOLUME DIVERGENCE DETECTION
function detectPriceVolumeDivergence(data: any[]) {
  if (data.length < 20) return { divergence: 'INSUFFICIENT_DATA' };
  
  const recentData = data.slice(-20);
  const prices = recentData.map(d => d.close || d.c);
  const volumes = recentData.map(d => d.volume || d.v);
  
  // Calculate price trend (simple linear regression)
  const priceSlope = calculateSlope(prices);
  const volumeSlope = calculateSlope(volumes);
  
  // Detect divergence
  const isDivergent = (priceSlope > 0 && volumeSlope < -0.1) || 
                     (priceSlope < 0 && volumeSlope > 0.1);
  
  let divergenceType = 'NONE';
  if (priceSlope > 0 && volumeSlope < -0.1) divergenceType = 'BEARISH_DIVERGENCE';
  if (priceSlope < 0 && volumeSlope > 0.1) divergenceType = 'BULLISH_DIVERGENCE';
  
  return {
    divergence: divergenceType,
    priceSlope,
    volumeSlope,
    isDivergent,
    confidence: isDivergent ? Math.min(Math.abs(priceSlope - volumeSlope) * 10, 1) : 0,
    interpretation: divergenceType === 'BEARISH_DIVERGENCE' ? 
      'Price rising but volume declining - potential weakness' :
      divergenceType === 'BULLISH_DIVERGENCE' ?
      'Price falling but volume increasing - potential bottom' :
      'No significant divergence detected'
  };
}

// INSTITUTIONAL ORDER PATTERN DETECTION
function detectInstitutionalPatterns(data: any[]) {
  const patterns = [];
  
  for (let i = 5; i < data.length; i++) {
    const current = data[i];
    const previous = data.slice(i-5, i);
    const volume = current.volume || current.v || 0;
    const avgVolume = previous.reduce((sum, d) => sum + (d.volume || d.v || 0), 0) / 5;
    
    // Large volume spike with small price movement (accumulation)
    const priceChange = Math.abs((current.close || current.c) - (previous[4].close || previous[4].c)) / (previous[4].close || previous[4].c);
    const volumeRatio = volume / avgVolume;
    
    if (volumeRatio > 3 && priceChange < 0.01) {
      patterns.push({
        type: 'STEALTH_ACCUMULATION',
        timestamp: i,
        volumeRatio,
        priceChange,
        significance: 'HIGH'
      });
    }
    
    // Volume climax patterns
    if (volumeRatio > 5) {
      patterns.push({
        type: 'VOLUME_CLIMAX',
        timestamp: i,
        volumeRatio,
        priceChange,
        significance: priceChange > 0.02 ? 'EXHAUSTION' : 'ABSORPTION'
      });
    }
  }
  
  return {
    patterns: patterns.slice(-10), // Last 10 patterns
    totalPatterns: patterns.length,
    recentActivity: patterns.filter(p => p.timestamp > data.length - 10).length,
    institutionalBehavior: patterns.length > 5 ? 'ACTIVE' : 'QUIET'
  };
}

// SMART MONEY INDEX CALCULATION
function calculateSmartMoneyIndex(data: any[]) {
  if (data.length < 30) return { index: 50, interpretation: 'INSUFFICIENT_DATA' };
  
  let smartMoneyScore = 0;
  const recentData = data.slice(-30);
  
  recentData.forEach((candle, i) => {
    if (i === 0) return;
    
    const volume = candle.volume || candle.v || 0;
    const prevVolume = recentData[i-1].volume || recentData[i-1].v || 0;
    const close = candle.close || candle.c || 0;
    const open = candle.open || candle.o || 0;
    const high = candle.high || candle.h || 0;
    const low = candle.low || candle.l || 0;
    
    // Close relative to range
    const rangePosition = (close - low) / (high - low) || 0.5;
    
    // Volume change
    const volumeChange = volume / prevVolume;
    
    // Smart money indicator
    const smartScore = (rangePosition - 0.5) * volumeChange;
    smartMoneyScore += smartScore;
  });
  
  // Normalize to 0-100 scale
  const normalizedIndex = Math.max(0, Math.min(100, 50 + smartMoneyScore * 10));
  
  return {
    index: Math.round(normalizedIndex),
    trend: smartMoneyScore > 0 ? 'BULLISH' : 'BEARISH',
    strength: Math.abs(smartMoneyScore),
    interpretation: normalizedIndex > 70 ? 'STRONG_ACCUMULATION' :
                   normalizedIndex > 55 ? 'ACCUMULATION' :
                   normalizedIndex < 30 ? 'STRONG_DISTRIBUTION' :
                   normalizedIndex < 45 ? 'DISTRIBUTION' : 'NEUTRAL'
  };
}

// BREAKOUT PREPARATION ANALYSIS
function analyzeBreakoutPreparation(data: any[], currentPrice: number) {
  const recentData = data.slice(-20);
  const volumes = recentData.map(d => d.volume || d.v || 0);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  
  // Look for volume expansion near key levels
  const priceRange = {
    high: Math.max(...recentData.map(d => d.high || d.h || 0)),
    low: Math.min(...recentData.map(d => d.low || d.l || 0))
  };
  
  const rangePercent = ((priceRange.high - priceRange.low) / priceRange.low) * 100;
  const nearHighVolume = volumes.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5;
  const volumeIncrease = nearHighVolume / avgVolume;
  
  const isConsolidating = rangePercent < 5; // Less than 5% range
  const hasVolumeExpansion = volumeIncrease > 1.5;
  
  return {
    consolidating: isConsolidating,
    rangePercent,
    volumeExpansion: hasVolumeExpansion,
    volumeIncrease,
    breakoutProbability: (isConsolidating && hasVolumeExpansion) ? 0.75 : 0.25,
    preparationPhase: (isConsolidating && hasVolumeExpansion) ? 'ACTIVE' : 'DORMANT',
    upwardBreakoutTarget: priceRange.high * 1.05,
    downwardBreakoutTarget: priceRange.low * 0.95
  };
}

// HELPER FUNCTIONS
function calculateSlope(values: number[]): number {
  const n = values.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, i) => sum + val * i, 0);
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6;
  
  return (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
}

// SMART MONEY SCORING
function calculateSmartMoneyScore(signals: any, sensitivity: string) {
  let score = 0;
  let maxScore = 0;
  
  const multiplier = sensitivity === 'high' ? 1.2 : sensitivity === 'low' ? 0.8 : 1.0;
  
  // Accumulation/Distribution weight: 25%
  if (signals.accumulationDistribution.trend === 'ACCUMULATION') {
    score += signals.accumulationDistribution.confidence * 25;
  }
  maxScore += 25;
  
  // Volume Profile weight: 20%
  if (signals.volumeProfile.institutionalInterest === 'HIGH') {
    score += 20;
  }
  maxScore += 20;
  
  // Price-Volume Divergence weight: 15%
  if (signals.priceVolumeDivergence.isDivergent) {
    score += signals.priceVolumeDivergence.confidence * 15;
  }
  maxScore += 15;
  
  // Institutional Patterns weight: 20%
  score += Math.min(signals.institutionalPatterns.recentActivity * 5, 20);
  maxScore += 20;
  
  // Smart Money Index weight: 20%
  if (signals.smartMoneyIndex.index > 60) {
    score += ((signals.smartMoneyIndex.index - 50) / 50) * 20;
  }
  maxScore += 20;
  
  score *= multiplier;
  
  return {
    score: Math.round(score),
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    rating: score > 75 ? 'VERY_STRONG' : 
            score > 60 ? 'STRONG' : 
            score > 40 ? 'MODERATE' : 'WEAK'
  };
}

// INSIGHTS GENERATION
function generateSmartMoneyInsights(signals: any, score: any) {
  const insights = [];
  
  if (signals.accumulationDistribution.trend === 'ACCUMULATION') {
    insights.push({
      type: 'ACCUMULATION',
      message: 'Smart money is actively accumulating shares',
      confidence: signals.accumulationDistribution.confidence,
      timeframe: 'Medium-term'
    });
  }
  
  if (signals.priceVolumeDivergence.isDivergent) {
    insights.push({
      type: 'DIVERGENCE',
      message: signals.priceVolumeDivergence.interpretation,
      confidence: signals.priceVolumeDivergence.confidence,
      timeframe: 'Short-term'
    });
  }
  
  if (signals.breakoutPreparation.preparationPhase === 'ACTIVE') {
    insights.push({
      type: 'BREAKOUT_PREP',
      message: 'Volume expansion suggests breakout preparation',
      confidence: 0.75,
      timeframe: 'Immediate'
    });
  }
  
  return insights;
}

// RECOMMENDATION ENGINE
function generateSmartMoneyRecommendation(signals: any, score: any) {
  if (score.percentage > 75) {
    return {
      action: 'STRONG_BUY',
      reasoning: 'Multiple smart money signals confirmed',
      confidence: 'HIGH',
      timeframe: '1-5 days',
      strategy: 'Follow smart money accumulation'
    };
  } else if (score.percentage > 60) {
    return {
      action: 'BUY',
      reasoning: 'Smart money activity detected',
      confidence: 'MEDIUM',
      timeframe: '2-10 days',
      strategy: 'Position alongside institutions'
    };
  } else if (score.percentage < 30) {
    return {
      action: 'AVOID',
      reasoning: 'Smart money appears to be distributing',
      confidence: 'MEDIUM',
      timeframe: 'TBD',
      strategy: 'Wait for better setup'
    };
  } else {
    return {
      action: 'MONITOR',
      reasoning: 'Mixed smart money signals',
      confidence: 'LOW',
      timeframe: 'TBD',
      strategy: 'Wait for clearer direction'
    };
  }
} 