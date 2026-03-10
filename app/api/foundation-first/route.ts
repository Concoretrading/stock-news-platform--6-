import { NextRequest, NextResponse } from 'next/server';
import { foundationFirstIntelligence } from '@/lib/services/foundation-first-intelligence';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'AAPL';

    console.log(`🏗️ Foundation First API called for: ${symbol}`);
    console.log('🏗️ Starting with the 4 unshakeable pillars...');

    const foundationAnalysis = await foundationFirstIntelligence.analyzeFoundationFirst(symbol);

    return NextResponse.json({
      success: true,
      data: foundationAnalysis,
      message: `Foundation-first analysis completed for ${symbol}`,
      foundation_summary: {
        foundation_score: foundationAnalysis.foundation_decision.foundation_score,
        confidence_level: foundationAnalysis.foundation_decision.confidence_level,
        primary_signal: foundationAnalysis.foundation_decision.primary_signal,
        pillar_alignment: foundationAnalysis.present_reality.foundation_alignment.overall_alignment,
        data_reliability: foundationAnalysis.foundation_decision.data_reliability
      },
      key_insights: [
        `Foundation Score: ${foundationAnalysis.foundation_decision.foundation_score}% (4 pillars alignment)`,
        `Confidence Level: ${foundationAnalysis.foundation_decision.confidence_level}% (data-driven)`,
        `Signal: ${foundationAnalysis.foundation_decision.primary_signal} with ${foundationAnalysis.foundation_decision.trade_recommendation.conviction_level}% conviction`,
        `Key Levels: Support ${foundationAnalysis.foundation_decision.trade_recommendation.key_levels_for_trade.stop_levels[0]}, Resistance ${foundationAnalysis.foundation_decision.trade_recommendation.key_levels_for_trade.target_levels[0]}`,
        `Volume Truth: ${foundationAnalysis.foundation_pillars.volume.volume_truth.overall_truth_score}% validation`,
        `Momentum Alignment: ${foundationAnalysis.foundation_pillars.momentum.momentum_quality.alignment_score}% across timeframes`,
        `Premium Efficiency: ${foundationAnalysis.foundation_pillars.premium.options_reality.premium_efficiency}%`,
        `Data vs Narrative: ${foundationAnalysis.big_money_context.data_vs_narrative.data_support}% trust data`
      ]
    });

  } catch (error) {
    console.error('Foundation First API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze foundation-first intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, focus_pillar, real_time_monitoring } = body;

    console.log(`🏗️ Foundation First Analysis: ${focus_pillar || 'ALL_PILLARS'}`);

    if (real_time_monitoring) {
      // Real-time foundation monitoring
      const realtimeAnalysis = await foundationFirstIntelligence.analyzeFoundationFirst(symbol || 'AAPL');
      
      return NextResponse.json({
        success: true,
        data: {
          real_time_analysis: realtimeAnalysis,
          foundation_alerts: [
            {
              type: 'FOUNDATION_ALIGNMENT',
              score: realtimeAnalysis.present_reality.foundation_alignment.overall_alignment,
              action: realtimeAnalysis.present_reality.foundation_alignment.overall_alignment > 80 ? 'HIGH_CONVICTION_TRADE' : 'WAIT_FOR_BETTER_ALIGNMENT'
            },
            {
              type: 'DATA_QUALITY',
              quality: realtimeAnalysis.present_reality.data_quality_score,
              action: realtimeAnalysis.present_reality.data_quality_score > 90 ? 'TRUST_THE_DATA' : 'VERIFY_SIGNALS'
            },
            {
              type: 'BIG_MONEY_CHECK',
              alignment: realtimeAnalysis.big_money_context.foundation_truth_check.big_money_aligns_with_foundation,
              action: realtimeAnalysis.big_money_context.foundation_truth_check.action_recommendation
            }
          ],
          pillar_status: {
            key_levels: {
              strength: realtimeAnalysis.foundation_pillars.key_levels.level_quality.respect_rate,
              status: realtimeAnalysis.foundation_pillars.key_levels.current_position.level_interaction
            },
            momentum: {
              alignment: realtimeAnalysis.foundation_pillars.momentum.momentum_quality.alignment_score,
              phase: realtimeAnalysis.foundation_pillars.momentum.momentum_quality.acceleration_phase
            },
            premium: {
              efficiency: realtimeAnalysis.foundation_pillars.premium.options_reality.premium_efficiency,
              environment: realtimeAnalysis.foundation_pillars.premium.options_reality.theta_environment
            },
            volume: {
              truth_score: realtimeAnalysis.foundation_pillars.volume.volume_truth.overall_truth_score,
              pattern: realtimeAnalysis.foundation_pillars.volume.volume_reality.accumulation_distribution
            }
          },
          recommended_actions: [
            'MONITOR_4_PILLAR_ALIGNMENT',
            'TRUST_DATA_OVER_NARRATIVES',
            'USE_FOUNDATION_FOR_SIZING',
            'PREPARE_FOR_EVENTS_DONT_BET'
          ]
        },
        message: 'Real-time foundation monitoring active'
      });
    }

    // Regular foundation analysis
    const foundationAnalysis = await foundationFirstIntelligence.analyzeFoundationFirst(symbol || 'AAPL');

    return NextResponse.json({
      success: true,
      data: foundationAnalysis,
      message: 'Foundation-first analysis completed'
    });

  } catch (error) {
    console.error('Foundation First POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process foundation-first analysis request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 