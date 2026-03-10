import { NextRequest, NextResponse } from 'next/server';
import { priceActionFoundation } from '@/lib/services/price-action-foundation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'AAPL';

    console.log(`🕯️ Price Action API called for: ${symbol}`);
    console.log('🕯️ Reading candle formations and market battles...');

    const priceActionAnalysis = await priceActionFoundation.analyzePriceAction(symbol);

    return NextResponse.json({
      success: true,
      data: priceActionAnalysis,
      message: `Price action analysis completed for ${symbol}`,
      battle_summary: {
        current_battle: priceActionAnalysis.candle_formation.battle_narrative.current_battle,
        bulls_strength: priceActionAnalysis.candle_formation.battle_narrative.bulls_strength,
        bears_strength: priceActionAnalysis.candle_formation.battle_narrative.bears_strength,
        likely_winner: priceActionAnalysis.candle_formation.battle_narrative.likely_winner,
        pa_strength: priceActionAnalysis.pa_confluence.strength_score,
        quality_rating: priceActionAnalysis.pa_confluence.quality_rating
      },
      key_insights: [
        `Battle Story: ${priceActionAnalysis.candle_formation.battle_narrative.current_battle}`,
        `Bulls vs Bears: ${priceActionAnalysis.candle_formation.battle_narrative.bulls_strength}% vs ${priceActionAnalysis.candle_formation.battle_narrative.bears_strength}%`,
        `Current Candle: ${priceActionAnalysis.candle_formation.current_candle.candle_type} (${priceActionAnalysis.candle_formation.current_candle.battle_story})`,
        `Candle Sequence: ${priceActionAnalysis.candle_formation.candle_sequence.sequence_message}`,
        `Level Interaction: ${priceActionAnalysis.level_interaction.at_level_behavior.battle_development}`,
        `Pattern Recognition: ${priceActionAnalysis.pattern_recognition.single_candle_patterns[0]?.pattern_name || 'No patterns'} at ${priceActionAnalysis.pattern_recognition.single_candle_patterns[0]?.location || 'N/A'}`,
        `Price Action Quality: ${priceActionAnalysis.pa_confluence.quality_rating} (${priceActionAnalysis.pa_confluence.strength_score}%)`,
        `Overall Bias: ${priceActionAnalysis.pa_confluence.overall_bias}`
      ]
    });

  } catch (error) {
    console.error('Price Action API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze price action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, focus_area, real_time_monitoring } = body;

    console.log(`🕯️ Price Action Analysis: ${focus_area || 'FULL_ANALYSIS'}`);

    if (real_time_monitoring) {
      // Real-time price action monitoring
      const realtimeAnalysis = await priceActionFoundation.analyzePriceAction(symbol || 'AAPL');
      
      return NextResponse.json({
        success: true,
        data: {
          real_time_analysis: realtimeAnalysis,
          price_action_alerts: [
            {
              type: 'CANDLE_FORMATION',
              candle_type: realtimeAnalysis.candle_formation.current_candle.candle_type,
              significance: realtimeAnalysis.candle_formation.current_candle.significance,
              action: realtimeAnalysis.candle_formation.current_candle.significance === 'HIGH' ? 'PAY_ATTENTION' : 'MONITOR'
            },
            {
              type: 'BATTLE_UPDATE',
              battle_status: realtimeAnalysis.candle_formation.battle_narrative.current_battle,
              likely_winner: realtimeAnalysis.candle_formation.battle_narrative.likely_winner,
              action: realtimeAnalysis.candle_formation.battle_narrative.likely_winner === 'BULLS' ? 'CONSIDER_BULLISH' : 'CONSIDER_BEARISH'
            },
            {
              type: 'LEVEL_INTERACTION',
              interaction_type: realtimeAnalysis.level_interaction.at_level_behavior.resolution_type,
              development: realtimeAnalysis.level_interaction.at_level_behavior.battle_development,
              action: realtimeAnalysis.level_interaction.at_level_behavior.resolution_type === 'BREAK' ? 'BREAKOUT_CONFIRMED' : 'MONITOR_BATTLE'
            }
          ],
          candle_status: {
            current_candle: {
              type: realtimeAnalysis.candle_formation.current_candle.candle_type,
              body_size: realtimeAnalysis.candle_formation.current_candle.body_size,
              close_position: realtimeAnalysis.candle_formation.current_candle.close_position,
              volume_confirmation: realtimeAnalysis.candle_formation.current_candle.volume_confirmation
            },
            sequence_quality: realtimeAnalysis.candle_formation.candle_sequence.sequence_quality,
            formation_quality: realtimeAnalysis.candle_formation.formation_quality.overall_quality,
            battle_intensity: realtimeAnalysis.candle_formation.battle_narrative.battle_intensity
          },
          recommended_actions: [
            'MONITOR_CANDLE_FORMATIONS',
            'WATCH_BATTLE_DEVELOPMENT',
            'CONFIRM_WITH_VOLUME',
            'READ_THE_STORY_CANDLES_TELL'
          ]
        },
        message: 'Real-time price action monitoring active'
      });
    }

    // Regular price action analysis
    const priceActionAnalysis = await priceActionFoundation.analyzePriceAction(symbol || 'AAPL');

    return NextResponse.json({
      success: true,
      data: priceActionAnalysis,
      message: 'Price action analysis completed'
    });

  } catch (error) {
    console.error('Price Action POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process price action analysis request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 