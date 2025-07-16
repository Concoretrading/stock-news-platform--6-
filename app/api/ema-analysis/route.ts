import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const emaType = searchParams.get('emaType') || '21'; // Support different EMAs
    
    console.log(`📈 21 EMA ANALYSIS for ${ticker} (${emaType}-day EMA)...`);
    
    // Get current quote and historical data
    const currentQuote = await polygonClient.getDelayedQuote(ticker);
    const historicalData = await polygonClient.getHistoricalData(ticker, 100);
    
    if (historicalData.length === 0) {
      throw new Error('Insufficient historical data');
    }
    
    // Perform 21 EMA analysis
    const ema21Analysis = polygonClient.analyze21EMAOpportunity(
      ticker,
      historicalData,
      currentQuote.price
    );
    
    // Get current squeeze status for additional context
    const currentSqueezeStatus = await polygonClient.analyzeMultiTimeframeSqueeze(ticker);
    
    // Analyze volume confirmation
    const volumeAnalysis = polygonClient.analyzeVolumeConfirmation(
      historicalData,
      currentQuote.volume
    );
    
    // Calculate optimal entry zones
    const entryZones = calculateEMAEntryZones(
      currentQuote.price,
      ema21Analysis.current21EMA,
      ema21Analysis.emaAlignment,
      volumeAnalysis
    );
    
    // Risk/reward analysis
    const riskRewardAnalysis = calculateEMARiskReward(
      currentQuote.price,
      ema21Analysis,
      entryZones
    );
    
    return NextResponse.json({
      success: true,
      ticker,
      analysis: {
        currentPrice: currentQuote.price,
        current21EMA: ema21Analysis.current21EMA,
        distanceTo21EMA: ema21Analysis.distanceTo21EMA,
        opportunityType: ema21Analysis.opportunityType,
        confidence: ema21Analysis.confidence,
        emaAlignment: ema21Analysis.emaAlignment,
        volumeConfirmation: volumeAnalysis,
        premiumStrategy: ema21Analysis.premiumStrategy,
        entryZones,
        riskRewardAnalysis,
        squeezeContext: {
          multiTimeframe: currentSqueezeStatus,
          emaSqueezeAlignment: analyzeEMASqueezeAlignment(
            ema21Analysis,
            currentSqueezeStatus
          )
        }
      },
      recommendation: generateEMARecommendation(
        ema21Analysis,
        volumeAnalysis,
        entryZones,
        riskRewardAnalysis
      ),
      metadata: {
        analysisType: '21_EMA_OPPORTUNITY',
        timestamp: new Date().toISOString(),
        dataPoints: historicalData.length
      }
    });
    
  } catch (error) {
    console.error('21 EMA analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze 21 EMA opportunity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// CALCULATE EMA ENTRY ZONES
function calculateEMAEntryZones(
  currentPrice: number,
  ema21: number,
  emaAlignment: any,
  volumeAnalysis: any
): any {
  const zones = [];
  
  // Primary entry zone (within 1% of 21 EMA)
  const primaryZone = {
    type: 'PRIMARY_ENTRY',
    upper: ema21 * 1.01,
    lower: ema21 * 0.99,
    center: ema21,
    confidence: emaAlignment.bullish ? 85 : emaAlignment.bearish ? 80 : 65,
    description: 'Highest probability entry zone near 21 EMA'
  };
  
  // Secondary entry zone (1-2.5% from 21 EMA)
  const secondaryZone = {
    type: 'SECONDARY_ENTRY',
    upper: ema21 * 1.025,
    lower: ema21 * 0.975,
    center: ema21,
    confidence: emaAlignment.bullish ? 70 : emaAlignment.bearish ? 65 : 50,
    description: 'Secondary entry zone approaching 21 EMA'
  };
  
  // Volume-based adjustment
  if (volumeAnalysis.recentVolumeRatio > 1.5) {
    primaryZone.confidence += 10;
    secondaryZone.confidence += 5;
  }
  
  zones.push(primaryZone, secondaryZone);
  
  // Add aggressive entry zone if trending strongly
  if (emaAlignment.strength > 2.0) {
    const aggressiveZone = {
      type: 'AGGRESSIVE_ENTRY',
      upper: currentPrice * 1.005,
      lower: currentPrice * 0.995,
      center: currentPrice,
      confidence: 60,
      description: 'Aggressive entry on strong trend continuation'
    };
    zones.push(aggressiveZone);
  }
  
  return zones;
}

// CALCULATE EMA RISK/REWARD
function calculateEMARiskReward(
  currentPrice: number,
  ema21Analysis: any,
  entryZones: any[]
): any {
  const primaryZone = entryZones.find(z => z.type === 'PRIMARY_ENTRY');
  if (!primaryZone) return null;
  
  const entryPrice = primaryZone.center;
  const opportunityType = ema21Analysis.opportunityType;
  
  let riskLevel, rewardLevel, stopLoss, profitTarget;
  
  if (opportunityType.type === 'BULLISH_BOUNCE_SETUP') {
    stopLoss = entryPrice * 0.985; // 1.5% below entry
    profitTarget = entryPrice * 1.04; // 4% target
    riskLevel = Math.abs(entryPrice - stopLoss);
    rewardLevel = Math.abs(profitTarget - entryPrice);
  } else if (opportunityType.type === 'BEARISH_REJECTION_SETUP') {
    stopLoss = entryPrice * 1.015; // 1.5% above entry
    profitTarget = entryPrice * 0.96; // 4% target
    riskLevel = Math.abs(stopLoss - entryPrice);
    rewardLevel = Math.abs(entryPrice - profitTarget);
  } else {
    // Decision point - symmetric risk/reward
    stopLoss = entryPrice * 0.98; // 2% stop
    profitTarget = entryPrice * 1.03; // 3% target
    riskLevel = Math.abs(entryPrice - stopLoss);
    rewardLevel = Math.abs(profitTarget - entryPrice);
  }
  
  const riskRewardRatio = rewardLevel / riskLevel;
  
  return {
    entryPrice,
    stopLoss,
    profitTarget,
    riskAmount: riskLevel,
    rewardAmount: rewardLevel,
    riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
    riskPercent: ((riskLevel / entryPrice) * 100).toFixed(2),
    rewardPercent: ((rewardLevel / entryPrice) * 100).toFixed(2),
    grade: riskRewardRatio > 2.5 ? 'EXCELLENT' :
           riskRewardRatio > 2.0 ? 'GOOD' :
           riskRewardRatio > 1.5 ? 'FAIR' : 'POOR'
  };
}

// ANALYZE EMA-SQUEEZE ALIGNMENT
function analyzeEMASqueezeAlignment(ema21Analysis: any, squeezeStatus: any): any {
  const alignment = [];
  
  // Check if 21 EMA opportunity aligns with squeeze firing
  if (ema21Analysis.opportunityType.priority === 'HIGH') {
    const firingTimeframes = squeezeStatus.timeframes?.filter((tf: any) => 
      tf.status === 'firing' || tf.status === 'green'
    ) || [];
    
    if (firingTimeframes.length >= 2) {
      alignment.push({
        type: 'STRONG_ALIGNMENT',
        description: `21 EMA ${ema21Analysis.opportunityType.type} + ${firingTimeframes.length} timeframes firing`,
        confidence: 90,
        priority: 'VERY_HIGH'
      });
    } else if (firingTimeframes.length === 1) {
      alignment.push({
        type: 'MODERATE_ALIGNMENT',
        description: `21 EMA opportunity + 1 timeframe firing`,
        confidence: 75,
        priority: 'HIGH'
      });
    }
  }
  
  // Check for squeeze building near 21 EMA
  const buildingTimeframes = squeezeStatus.timeframes?.filter((tf: any) => 
    tf.status === 'building' || tf.status === 'yellow' || tf.status === 'black'
  ) || [];
  
  if (buildingTimeframes.length >= 3 && Math.abs(ema21Analysis.distanceTo21EMA) < 2) {
    alignment.push({
      type: 'COILED_SPRING',
      description: `${buildingTimeframes.length} timeframes building pressure near 21 EMA`,
      confidence: 80,
      priority: 'HIGH'
    });
  }
  
  return alignment;
}

// GENERATE EMA RECOMMENDATION
function generateEMARecommendation(
  ema21Analysis: any,
  volumeAnalysis: any,
  entryZones: any[],
  riskRewardAnalysis: any
): any {
  const recommendation = {
    action: 'MONITOR',
    priority: 'LOW',
    reasoning: [],
    timeline: '1-3 days',
    positionSize: '1-2%'
  };
  
  // High confidence 21 EMA setups
  if (ema21Analysis.confidence > 80 && ema21Analysis.opportunityType.priority === 'HIGH') {
    recommendation.action = 'ENTER';
    recommendation.priority = 'HIGH';
    recommendation.positionSize = '2-3%';
    recommendation.reasoning.push(`High confidence ${ema21Analysis.opportunityType.type}`);
  }
  
  // Volume confirmation
  if (volumeAnalysis.recentVolumeRatio > 2.0) {
    recommendation.priority = recommendation.priority === 'HIGH' ? 'VERY_HIGH' : 'HIGH';
    recommendation.reasoning.push('Strong volume confirmation');
  }
  
  // Risk/reward quality
  if (riskRewardAnalysis && riskRewardAnalysis.riskRewardRatio > 2.5) {
    recommendation.reasoning.push(`Excellent R:R ratio of ${riskRewardAnalysis.riskRewardRatio}:1`);
    if (recommendation.action === 'MONITOR') recommendation.action = 'CONSIDER';
  }
  
  // EMA alignment strength
  if (ema21Analysis.emaAlignment.strength > 2.0) {
    recommendation.reasoning.push('Strong EMA alignment supporting direction');
  }
  
  return recommendation;
} 