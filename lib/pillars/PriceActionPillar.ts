import { BasePillar, PillarReport } from './BasePillar';
import { priceActionFoundation } from '../services/price-action-foundation';

/**
 * PRICE ACTION PILLAR
 * Focus: Candle-by-candle behavioral story. 
 * Concrete Example: Detects Bullish Engulfing and False Breakouts at Key Levels.
 */
export class PriceActionPillar extends BasePillar {
  pillarName = 'Price Action Pillar';

  async getReport(symbol: string): Promise<PillarReport> {
    // WRAPPING: Calling the deep Battle Analysis logic
    const analysis = await priceActionFoundation.analyzePriceAction(symbol);
    
    const insights: string[] = [];
    const confluence = analysis.pa_confluence;
    const candleSet = analysis.candle_formation.current_candle;

    // 1. Current Battle Story
    if (candleSet.significance === 'HIGH') {
      insights.push(`🕯️ ${candleSet.candle_type.replace(/_/g, ' ')} detected: ${candleSet.battle_story}. This is a high-conviction candle.`);
    }

    // 2. Battle Intensity at Levels
    if (analysis.candle_formation.battle_narrative.battle_intensity > 75) {
      insights.push(`📊 INTENSE BATTLE: Intensity is at ${analysis.candle_formation.battle_narrative.battle_intensity}%. Major level resolution is imminent.`);
    }

    // 3. Traps and Divergence
    if (analysis.battle_zones.false_break_signals.length > 0) {
        insights.push(`⚠️  FALSE BREAKOUT DETECTED. Institutional traps identified at key levels. Probability of reversal is HIGH.`);
    }

    return {
      pillarName: this.pillarName,
      bias: confluence.overall_bias as any,
      confidence: confluence.strength_score,
      keyInsights: insights,
      rawMetrics: {
        quality_rating: confluence.quality_rating,
        bull_strength: analysis.candle_formation.battle_narrative.bulls_strength,
        bear_strength: analysis.candle_formation.battle_narrative.bears_strength,
        pattern_count: analysis.pattern_recognition.single_candle_patterns.length
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const priceActionPillar = new PriceActionPillar();
