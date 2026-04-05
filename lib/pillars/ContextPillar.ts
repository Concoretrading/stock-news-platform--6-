import { BasePillar, PillarReport } from './BasePillar';
import { newsGravityAnalyzer } from '../services/news-gravity-analyzer';

/**
 * CONTEXT PILLAR
 * Focus: What is the external environment? (Macro, News, Sentiment)
 * Concrete Example: Tracking "News Gravity" and "Retail Traps."
 */
export class ContextPillar extends BasePillar {
  pillarName = 'Context & News Pillar';

  async getReport(symbol: string, currentPrice: number, liveContext?: any): Promise<PillarReport> {
    // WRAPPING: Accessing the News Gravity Analyzer (The "Soul")
    const analysis = await newsGravityAnalyzer.analyzeGravity(symbol, null, liveContext);
    
    const insights: string[] = [];
    const trap = analysis.trap_detection;

    // 1. News Gravity / Market State
    if (analysis.market_state === 'WAITING') {
      insights.push('🌌 MARKET STATE: Waiting for news catalyst. Compression is high.');
    } else {
      insights.push(`🌌 MARKET STATE: ${analysis.market_state.toLowerCase()}. Market is still factoring in recent news.`);
    }

    // 2. Retail Trap Detection
    if (trap.active) {
      insights.push(`🚨 TRAP ALERT: ${trap.type} (${trap.description}) detected at level ${trap.trigger_level}. CONVICTION: ${trap.conviction}`);
    }

    // 3. Recommended Gravity Reaction
    insights.push(`GRAVITY GUIDANCE: ${analysis.recommendation}`);

    // Aggregate Bias from Scenarios
    const bestScenario = analysis.active_scenarios.reduce((prev, curr) => curr.probability > prev.probability ? curr : prev);

    return {
      pillarName: this.pillarName,
      bias: bestScenario.name === 'BULL_CASE' ? 'BULLISH' : bestScenario.name === 'BEAR_CASE' ? 'BEARISH' : 'NEUTRAL',
      confidence: bestScenario.probability,
      keyInsights: insights,
      rawMetrics: {
        market_state: analysis.market_state,
        trap_active: trap.active,
        scenarios: analysis.active_scenarios.map(s => `${s.name} (${s.probability}%)`)
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const contextPillar = new ContextPillar();
