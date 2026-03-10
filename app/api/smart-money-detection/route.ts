import { NextRequest, NextResponse } from 'next/server';
import { smartMoneyManipulationEngine } from '@/lib/services/smart-money-manipulation-engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'SPY';

    console.log(`🎭 Smart Money Detection API called for: ${symbol}`);

    const smartMoneyAnalysis = await smartMoneyManipulationEngine.analyzeSmartMoneyManipulation(symbol);

    return NextResponse.json({
      success: true,
      data: smartMoneyAnalysis,
      message: `Smart money manipulation analysis completed for ${symbol}`,
      insights: [
        `Manipulation Probability: ${smartMoneyAnalysis.probability_framework.manipulation_probability}%`,
        `Smart Money Direction: ${smartMoneyAnalysis.probability_framework.smart_money_direction}`,
        `Institutional Activity: ${smartMoneyAnalysis.institutional_activity.dark_pool_flow.timing_patterns.current_phase}`,
        `Internals Quality: ${smartMoneyAnalysis.internals_analysis.breadth_divergence.quality_of_move}`
      ]
    });

  } catch (error) {
    console.error('Smart Money Detection API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze smart money manipulation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, analysis_type, real_time_monitoring } = body;

    console.log(`🎭 Processing smart money analysis: ${analysis_type || 'FULL_ANALYSIS'}`);

    if (real_time_monitoring) {
      // Real-time manipulation monitoring
      const realtimeAnalysis = await smartMoneyManipulationEngine.analyzeSmartMoneyManipulation(symbol || 'SPY');
      
      return NextResponse.json({
        success: true,
        data: {
          real_time_analysis: realtimeAnalysis,
          alerts: [
            {
              type: 'MANIPULATION_ALERT',
              probability: realtimeAnalysis.probability_framework.manipulation_probability,
              action: realtimeAnalysis.probability_framework.manipulation_probability > 70 ? 'FADE_THE_MOVE' : 'FOLLOW_SMART_MONEY'
            },
            {
              type: 'INTERNALS_ALERT',
              quality: realtimeAnalysis.internals_analysis.breadth_divergence.quality_of_move,
              action: realtimeAnalysis.internals_analysis.breadth_divergence.quality_of_move === 'BROAD_BASED' ? 'TRUST_THE_MOVE' : 'BE_CAUTIOUS'
            }
          ],
          recommended_actions: [
            'MONITOR_DARK_POOL_FLOW',
            'WATCH_INSTITUTIONAL_OPTIONS_ACTIVITY',
            'TRACK_MARKET_INTERNALS',
            'FOCUS_ON_PROBABILITY_NOT_NARRATIVES'
          ]
        },
        message: 'Real-time smart money monitoring active'
      });
    }

    // Regular smart money analysis
    const smartMoneyAnalysis = await smartMoneyManipulationEngine.analyzeSmartMoneyManipulation(symbol || 'SPY');

    return NextResponse.json({
      success: true,
      data: smartMoneyAnalysis,
      message: 'Smart money manipulation analysis completed'
    });

  } catch (error) {
    console.error('Smart Money Detection POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process smart money analysis request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 