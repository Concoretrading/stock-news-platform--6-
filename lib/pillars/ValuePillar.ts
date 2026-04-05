import { BasePillar, PillarReport } from './BasePillar';
import { optionsPremiumMastery } from '../services/options-premium-mastery';

/**
 * VALUE PILLAR
 * Focus: Asset valuation through the lens of Option Premium and ATR relative value.
 * Concrete Example: Uses OptionPremiumMastery to detect "IV Compression" - the primary fuel for Predator breakouts.
 */
export class ValuePillar extends BasePillar {
  pillarName = 'Value & Premium Pillar';

  async getReport(symbol: string, currentPrice: number): Promise<PillarReport> {
    // WRAPPING: Accessing the deep-layer ATR Strike Analysis
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7 || 7);
    const expiration = nextFriday.toISOString().split('T')[0];

    const analysis = await optionsPremiumMastery.analyzeATRStrikes(symbol, currentPrice, expiration);
    const patternInsights = analysis.patternInsights;
    
    const insights: string[] = [];
    
    // CONCRETE LOGIC: Analyzing IV relative to historical compression
    const ivLevel = patternInsights.ivCompressionLevel;
    if (ivLevel > 80) {
      insights.push(`🔥 CRITICAL VALUE: IV Compression is at ${ivLevel}%. Premium is extremely "cheap." High probability of massive expansion upon breakout.`);
    } else {
      insights.push(`IV Environment: ${ivLevel}% compression. Normal premium pricing.`);
    }

    // CONCRETE LOGIC: Real-time Probability Gap
    const callProb = analysis.recommendedStrikes.calls.atr_1.probabilityProfit;
    const putProb = analysis.recommendedStrikes.puts.atr_1.probabilityProfit;
    const gap = Math.abs(callProb - putProb);

    if (gap > 10) {
      const bias = callProb > putProb ? 'UPSIDE' : 'DOWNSIDE';
      insights.push(`PREMIUM BIAS: Option sellers are demanding more premium for ${bias} protection. Sellers are leaning ${bias}. (Gap: ${gap.toFixed(1)}%)`);
    }

    return {
      pillarName: this.pillarName,
      bias: callProb > putProb ? 'BULLISH' : 'BEARISH',
      confidence: ivLevel,
      keyInsights: insights,
      rawMetrics: {
        iv_compression: ivLevel,
        risk_of_crush: patternInsights.riskOfIVCrush,
        call_strike_prob: callProb,
        put_strike_prob: putProb
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const valuePillar = new ValuePillar();
