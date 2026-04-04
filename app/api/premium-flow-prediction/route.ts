import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const sensitivity = searchParams.get('sensitivity') || 'medium'; // low, medium, high
    
    console.log(`🔮 REAL-TIME PREMIUM FLOW PREDICTION for ${ticker}...`);
    
    // Get comprehensive market data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 30);
    
    // ENHANCED PREMIUM DISLOCATION DETECTION
    const premiumFlow = {
      // 1. VOLUME ANOMALY DETECTION
      volumeAnomalies: await detectVolumeAnomalies(ticker, historicalData),
      
      // 2. IMPLIED VOLATILITY DISLOCATION
      ivDislocation: await analyzeIVDislocation(ticker, historicalData),
      
      // 3. INSTITUTIONAL FOOTPRINT DETECTION
      institutionalFootprint: await detectInstitutionalActivity(ticker),
      
      // 4. DARK POOL FLOW ESTIMATION
      darkPoolFlow: estimateDarkPoolActivity(historicalData),
      
      // 5. PREMIUM FLOW DIRECTION PREDICTION
      flowPrediction: predictPremiumFlow(historicalData, currentQuote.price)
    };
    
    // Calculate composite opportunity score
    const opportunityScore = calculatePremiumOpportunityScore(premiumFlow);
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: currentQuote.price,
      sensitivity,
      premiumFlow,
      opportunityScore,
      alerts: generatePremiumAlerts(premiumFlow, opportunityScore),
      recommendation: generatePremiumRecommendation(premiumFlow, opportunityScore),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Premium flow prediction error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Premium flow prediction failed'
    }, { status: 500 });
  }
}

// ADVANCED VOLUME ANOMALY DETECTION
async function detectVolumeAnomalies(ticker: string, data: any[]) {
  const volumes = data.map(d => d.volume || d.v || 0);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const recentVolume = volumes.slice(-3);
  const currentVolumeRatio = recentVolume[recentVolume.length - 1] / avgVolume;
  
  return {
    currentVolumeRatio,
    isAnomalous: currentVolumeRatio > 2.5,
    severity: currentVolumeRatio > 5 ? 'EXTREME' : 
              currentVolumeRatio > 3 ? 'HIGH' : 
              currentVolumeRatio > 2 ? 'MEDIUM' : 'LOW',
    interpretation: currentVolumeRatio > 3 ? 
      'INSTITUTIONAL_ACCUMULATION' : 
      'NORMAL_FLOW',
    confidence: Math.min(currentVolumeRatio / 2, 1)
  };
}

// IMPLIED VOLATILITY DISLOCATION ANALYSIS
async function analyzeIVDislocation(ticker: string, data: any[]) {
  // Calculate realized volatility vs implied volatility
  const prices = data.map(d => d.close || d.c);
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i-1]));
  }
  
  const realizedVol = Math.sqrt(
    returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length
  ) * Math.sqrt(252);
  
  // Mock implied volatility (in real system, get from options data)
  const impliedVol = 0.25; // 25% implied volatility
  const dislocation = impliedVol - realizedVol;
  
  return {
    realizedVolatility: realizedVol,
    impliedVolatility: impliedVol,
    dislocation,
    isSignificant: Math.abs(dislocation) > 0.05,
    opportunity: dislocation > 0.05 ? 'SELL_PREMIUM' : 
                 dislocation < -0.05 ? 'BUY_PREMIUM' : 'NEUTRAL',
    confidence: Math.min(Math.abs(dislocation) * 10, 1)
  };
}

// INSTITUTIONAL FOOTPRINT DETECTION
async function detectInstitutionalActivity(ticker: string) {
  // Mock institutional detection (in real system, analyze order flow)
  return {
    largeBlockActivity: Math.random() > 0.7,
    darkPoolPercentage: 35 + Math.random() * 20, // 35-55%
    institutionalBias: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
    confidence: Math.random() * 0.5 + 0.5,
    timeframe: '15min'
  };
}

// DARK POOL ACTIVITY ESTIMATION
function estimateDarkPoolActivity(data: any[]) {
  const volumes = data.map(d => d.volume || d.v || 0);
  const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
  const darkPoolEstimate = avgVolume * 0.4; // ~40% estimate
  
  return {
    estimatedDarkPoolVolume: darkPoolEstimate,
    darkPoolPercentage: 40,
    institutionalInterest: darkPoolEstimate > avgVolume * 0.35 ? 'HIGH' : 'MEDIUM',
    interpretation: 'Elevated dark pool activity suggests institutional positioning'
  };
}

// PREMIUM FLOW DIRECTION PREDICTION
function predictPremiumFlow(data: any[], currentPrice: number) {
  const prices = data.map(d => d.close || d.c);
  const momentum = prices[prices.length - 1] - prices[prices.length - 5];
  
  return {
    direction: momentum > 0 ? 'BULLISH' : 'BEARISH',
    strength: Math.abs(momentum) / currentPrice,
    timeframe: '1-3 hours',
    confidence: Math.min(Math.abs(momentum) / currentPrice * 10, 1),
    expectedMove: Math.abs(momentum) * 1.5 // Expected continuation
  };
}

// PREMIUM OPPORTUNITY SCORING
function calculatePremiumOpportunityScore(flow: any) {
  let score = 0;
  let maxScore = 0;
  
  // Volume anomaly weight: 30%
  if (flow.volumeAnomalies?.isAnomalous) {
    score += flow.volumeAnomalies.confidence * 30;
  }
  maxScore += 30;
  
  // IV dislocation weight: 40%
  if (flow.ivDislocation?.isSignificant) {
    score += flow.ivDislocation.confidence * 40;
  }
  maxScore += 40;
  
  // Institutional activity weight: 20%
  if (flow.institutionalFootprint?.largeBlockActivity) {
    score += flow.institutionalFootprint.confidence * 20;
  }
  maxScore += 20;
  
  // Flow prediction weight: 10%
  score += flow.flowPrediction?.confidence * 10;
  maxScore += 10;
  
  return {
    score: Math.round(score),
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    rating: score > 70 ? 'EXCELLENT' : 
            score > 50 ? 'GOOD' : 
            score > 30 ? 'FAIR' : 'POOR'
  };
}

// PREMIUM ALERTS GENERATION
function generatePremiumAlerts(flow: any, opportunity: any) {
  const alerts = [];
  
  if (flow.volumeAnomalies?.severity === 'EXTREME') {
    alerts.push({
      type: 'VOLUME_SPIKE',
      severity: 'HIGH',
      message: `Extreme volume spike detected: ${flow.volumeAnomalies.currentVolumeRatio.toFixed(1)}x normal`,
      action: 'Monitor for institutional positioning'
    });
  }
  
  if (flow.ivDislocation?.opportunity !== 'NEUTRAL') {
    alerts.push({
      type: 'IV_DISLOCATION',
      severity: 'MEDIUM',
      message: `IV Dislocation: ${flow.ivDislocation.opportunity}`,
      action: flow.ivDislocation.opportunity
    });
  }
  
  if (opportunity.percentage > 75) {
    alerts.push({
      type: 'HIGH_OPPORTUNITY',
      severity: 'HIGH',
      message: `Premium opportunity score: ${opportunity.percentage}%`,
      action: 'Consider premium strategy execution'
    });
  }
  
  return alerts;
}

// PREMIUM RECOMMENDATION ENGINE
function generatePremiumRecommendation(flow: any, opportunity: any) {
  if (opportunity.percentage > 75) {
    return {
      action: 'EXECUTE',
      strategy: flow.ivDislocation?.opportunity || 'STRADDLE',
      confidence: 'HIGH',
      timeframe: '1-4 hours',
      reasoning: 'Multiple premium signals aligned'
    };
  } else if (opportunity.percentage > 50) {
    return {
      action: 'PREPARE',
      strategy: 'Watch for entry',
      confidence: 'MEDIUM',
      timeframe: '2-6 hours',
      reasoning: 'Some premium signals present'
    };
  } else {
    return {
      action: 'WAIT',
      strategy: 'Monitor conditions',
      confidence: 'LOW',
      timeframe: 'TBD',
      reasoning: 'Insufficient premium signals'
    };
  }
} 