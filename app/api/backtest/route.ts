import { NextRequest, NextResponse } from 'next/server';
import polygonClient from '@/lib/services/polygon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const lookbackYears = parseInt(searchParams.get('years') || '2');
    
    if (!ticker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticker parameter is required' 
      }, { status: 400 });
    }
    
    console.log(`🔍 Performing ${lookbackYears}-year historical backtest for ${ticker}...`);
    
    // Comprehensive analysis with historical pattern learning
    const comprehensiveAnalysis = await polygonClient.analyzeBreakoutWithBacktest(ticker);
    
    return NextResponse.json({
      success: true,
      ticker,
      analysis: comprehensiveAnalysis,
      summary: {
        currentSetup: {
          signal: comprehensiveAnalysis.currentAnalysis[0]?.signal || 'unknown',
          confidence: comprehensiveAnalysis.currentAnalysis[0]?.confidence || 0,
          patternSimilarity: comprehensiveAnalysis.patternMatch.similarity,
          recommendation: comprehensiveAnalysis.patternMatch.recommendation
        },
        historicalPerformance: {
          totalPatterns: comprehensiveAnalysis.historicalInsights.totalPatterns,
          successRate: comprehensiveAnalysis.historicalInsights.successRate,
          avgReturn: comprehensiveAnalysis.historicalInsights.avgReturn,
          bestReturn: comprehensiveAnalysis.historicalInsights.bestPattern?.tradingOutcome.finalReturn || 0,
          worstReturn: comprehensiveAnalysis.historicalInsights.worstPattern?.tradingOutcome.finalReturn || 0
        },
        keyInsights: {
          timeframeEffectiveness: comprehensiveAnalysis.historicalInsights.timeframeEffectiveness,
          volumePatterns: comprehensiveAnalysis.historicalInsights.volumePatternInsights,
          premiumOpportunities: comprehensiveAnalysis.historicalInsights.premiumInsights,
          mostSuccessfulPatterns: Object.entries(comprehensiveAnalysis.historicalInsights.commonPatterns)
            .sort(([,a], [,b]) => b.successRate - a.successRate)
            .slice(0, 3)
            .map(([pattern, data]) => ({
              pattern,
              successRate: data.successRate,
              avgReturn: data.avgReturn,
              frequency: data.frequency
            }))
        }
      },
      explanation: {
        methodology: 'Goes back in time to analyze consolidation-to-breakout patterns, studying momentum/squeeze/volume/premium behaviors that preceded successful moves',
        patternDetection: 'Identifies consolidations (<8% range over 15+ days) and tracks subsequent breakout success',
        squeezeAnalysis: 'Multi-timeframe squeeze progression (Daily→4hr→1hr→30min→15min→5min→1min) with color coding',
        volumeConfirmation: 'Compares breakout volume vs historical averages for validation',
        premiumBehavior: 'Simulates option premium changes during breakout scenarios',
        keyLevels: 'Tracks support/resistance respect and retest behavior post-breakout',
        scientificApproach: 'No arbitrary percentages - all probabilities derived from actual historical performance'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'unknown';
    
    console.error('Backtest analysis error for', ticker, ':', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Backtest analysis failed',
      ticker,
      fallback: {
        message: 'Historical backtesting requires sufficient market data',
        suggestion: 'Try with a different ticker or reduce lookback period',
        minDataRequired: '500+ trading days for reliable patterns'
      }
    }, { status: 500 });
  }
} 