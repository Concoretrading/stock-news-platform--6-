import { NextResponse } from 'next/server';
import { tradingPsychologyEngine } from '../../../lib/services/trading-psychology-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'SPY';
    const includeThesisTracking = searchParams.get('includeThesis') === 'true';
    
    console.log(`🧠 TRADING PSYCHOLOGY ANALYSIS for ${ticker}...`);
    
    // Run comprehensive psychology analysis
    const psychologyAnalysis = await tradingPsychologyEngine.analyzeTradingPsychology(ticker);
    
    // Optional thesis tracking (if provided)
    let thesisTracking = null;
    if (includeThesisTracking) {
      const thesis = searchParams.get('thesis') || 'Breakout setup with volume confirmation';
      const timeElapsed = parseInt(searchParams.get('timeElapsed') || '4'); // hours
      
      thesisTracking = await tradingPsychologyEngine.trackThesisEvolution(
        thesis,
        timeElapsed,
        psychologyAnalysis.market_regime
      );
    }
    
    return NextResponse.json({
      success: true,
      ticker,
      analysis: psychologyAnalysis,
      thesis_tracking: thesisTracking,
      system_info: {
        analysis_type: 'TRADING_PSYCHOLOGY_ENGINE',
        components: [
          'Market Emotional State Analysis',
          'Crowd Behavior Detection',
          'Market Regime Analysis',
          'Trading Environment Assessment',
          'Psychological Trade Filter',
          'Thesis Evolution Tracking'
        ],
        capabilities: [
          'Fear/Greed Cycle Detection',
          'Retail vs Institutional Divergence',
          'When NOT to Trade Intelligence',
          'Market Regime Transition Probability',
          'Position Sizing Psychology',
          'Time Horizon Adjustments',
          'Thesis Validation Tracking'
        ]
      },
      recommendations: {
        should_trade: psychologyAnalysis.trade_filter.should_trade,
        confidence: psychologyAnalysis.trade_filter.confidence_level,
        action: psychologyAnalysis.trade_filter.recommended_action,
        position_sizing: `${Math.round(psychologyAnalysis.trade_filter.position_sizing_modifier * 100)}% of normal`,
        time_horizon: psychologyAnalysis.trade_filter.time_horizon_adjustment,
        key_message: !psychologyAnalysis.trade_filter.should_trade ? 
          '🛑 AVOID TRADING - Market psychology unfavorable' :
          `✅ Trading approved with ${psychologyAnalysis.trade_filter.recommended_action} approach`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Trading Psychology analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze trading psychology',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 