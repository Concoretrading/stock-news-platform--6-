import { NextRequest, NextResponse } from 'next/server';
import polygonClient from '@/lib/services/polygon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const lookbackYears = parseInt(searchParams.get('years') || '4'); // 4 years for comprehensive data
    
    if (!ticker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticker parameter is required' 
      }, { status: 400 });
    }

    console.log(`🔍 ANALYZING ${lookbackYears}-YEAR HISTORICAL BREAKOUTS for ${ticker}...`);

    // First, get comprehensive historical data
    const historicalAnalysis = await polygonClient.analyzeRecurringPatterns(ticker, lookbackYears);

    // Analyze success rates at different profit levels
    const profitAnalysis = analyzeHistoricalProfitLevels(historicalAnalysis);

    // Find optimal scaling points based on historical behavior
    const scalingPoints = calculateOptimalScalingPoints(profitAnalysis);

    // Generate dynamic scaling strategy based on actual data
    const scalingStrategy = generateDataDrivenStrategy(scalingPoints, profitAnalysis);

    return NextResponse.json({
      success: true,
      ticker,
      historicalStats: {
        totalBreakoutsAnalyzed: historicalAnalysis.totalPatterns,
        successfulBreakouts: historicalAnalysis.successfulBreakouts,
        averageGain: historicalAnalysis.averageGain,
        averageLoss: historicalAnalysis.averageLoss,
        timeframe: `${lookbackYears} years`
      },
      profitAnalysis,
      scalingPoints,
      scalingStrategy,
      methodology: {
        dataPoints: `Analysis based on ${historicalAnalysis.totalPatterns} historical breakouts`,
        profitLevels: 'Derived from actual trade outcomes, not arbitrary percentages',
        riskManagement: 'Stop levels based on historical failure points',
        optimization: 'Scaling points optimized for maximum profit capture while maintaining position',
      }
    });

  } catch (error) {
    console.error('Scaling strategy analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Strategy analysis failed',
      ticker,
      suggestion: 'Ensure sufficient historical data available for analysis'
    }, { status: 500 });
  }
}

// Analyze where profits typically materialize in successful breakouts
function analyzeHistoricalProfitLevels(historicalData: any) {
  const profitLevels = [];
  let currentLevel = 0;
  
  // Analyze profit distribution in 5% increments
  while (currentLevel <= 200) { // Up to 200% profit
    const tradesAtThisLevel = historicalData.patterns.filter((p: any) => 
      p.maxProfit >= currentLevel && p.maxProfit < (currentLevel + 5)
    );
    
    if (tradesAtThisLevel.length > 0) {
      profitLevels.push({
        level: currentLevel,
        frequency: tradesAtThisLevel.length,
        successRate: (tradesAtThisLevel.filter((t: any) => t.outcome === 'SUCCESS').length / tradesAtThisLevel.length) * 100,
        averageHoldingTime: calculateAverageHoldingTime(tradesAtThisLevel),
        volumeCharacteristics: analyzeVolumeAtLevel(tradesAtThisLevel)
      });
    }
    
    currentLevel += 5;
  }
  
  return profitLevels;
}

// Calculate optimal scaling points based on historical profit clusters
function calculateOptimalScalingPoints(profitAnalysis: any) {
  // Find natural profit clusters where trades tend to end
  const profitClusters = findProfitClusters(profitAnalysis);
  
  // Sort clusters by frequency and success rate
  const rankedClusters = rankProfitClusters(profitClusters);
  
  // Convert clusters into scaling recommendations
  return rankedClusters.map((cluster: any) => ({
    profitTarget: cluster.centerPoint,
    positionSize: calculateOptimalPositionSize(cluster),
    confidence: calculateClusterConfidence(cluster),
    historicalContext: {
      occurrences: cluster.frequency,
      successRate: cluster.successRate,
      averageHoldingTime: cluster.averageHoldingTime
    }
  }));
}

// Generate final strategy based on historical analysis
function generateDataDrivenStrategy(scalingPoints: any, profitAnalysis: any) {
  // Only include points with high statistical significance
  const significantPoints = scalingPoints.filter((point: any) => 
    point.confidence > 70 && point.historicalContext.occurrences >= 10
  );
  
  // Sort by profit target for progressive scaling
  const sortedPoints = significantPoints.sort((a: any, b: any) => 
    a.profitTarget - b.profitTarget
  );
  
  return {
    entryConditions: {
      minimumHistoricalSuccess: calculateMinimumSuccessThreshold(profitAnalysis),
      volumeRequirements: determineVolumeThresholds(profitAnalysis),
      momentumConfirmation: analyzeMomentumRequirements(profitAnalysis)
    },
    scalingLevels: sortedPoints.map((point: any, index: number) => ({
      level: index + 1,
      profitTarget: point.profitTarget,
      positionSize: point.positionSize,
      confidence: point.confidence,
      historicalSuccess: point.historicalContext.successRate,
      averageHoldingTime: point.historicalContext.averageHoldingTime,
      volumeCharacteristics: point.historicalContext.volumeCharacteristics
    })),
    riskManagement: {
      initialStopDistance: calculateHistoricalStopDistance(profitAnalysis),
      breakEvenPoint: findOptimalBreakEvenPoint(profitAnalysis),
      trailingStopStrategy: determineTrailingStopStrategy(profitAnalysis)
    }
  };
} 