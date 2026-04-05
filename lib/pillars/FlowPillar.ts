import { BasePillar, PillarReport } from './BasePillar';
import { smartMoneyManipulationEngine } from '../services/smart-money-manipulation-engine';

/**
 * FLOW PILLAR
 * Focus: Who is in control? (Retail vs. Institutions)
 * Concrete Example: Detects "Dark Pool Accumulation" and "Institutional Stop Hunts."
 */
export class FlowPillar extends BasePillar {
  pillarName = 'Flow & Institutional Pillar';

  async getReport(symbol: string): Promise<PillarReport> {
    // WRAPPING: Accessing the institutional footprint analysis
    const analysis = await smartMoneyManipulationEngine.analyzeSmartMoneyManipulation(symbol);
    
    const insights: string[] = [];
    const flow = analysis.institutional_activity.dark_pool_flow;
    const prob = analysis.probability_framework;

    // 1. Institutional Footprint
    if (flow.flow_intensity > 75) {
      insights.push(`🐋 WHALE ACTIVITY: ${flow.flow_direction} intensity is at ${flow.flow_intensity}%. Institutions are ${flow.timing_patterns.current_phase.toLowerCase()} shares.`);
    }

    // 2. Manipulation Probability
    if (prob.manipulation_probability > 70) {
      insights.push(`🎭 MANIPULATION ALERT: ${prob.manipulation_probability}% probability of a retail trap. Narrative: "${prob.institutional_game_plan.retail_expectations}"`);
    }

    // 3. Smart Money Direction
    insights.push(`SMART MONEY BIAS: Institutions are leaning ${prob.smart_money_direction}.`);

    return {
      pillarName: this.pillarName,
      bias: prob.smart_money_direction === 'BULLISH' || prob.smart_money_direction === 'ACCUMULATING' ? 'BULLISH' : 'BEARISH',
      confidence: 100 - prob.manipulation_probability,
      keyInsights: insights,
      rawMetrics: {
        dark_pool_intensity: flow.flow_intensity,
        manipulation_risk: prob.manipulation_probability,
        institutional_phase: flow.timing_patterns.current_phase
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const flowPillar = new FlowPillar();
