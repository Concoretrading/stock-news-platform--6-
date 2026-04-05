import { StrategicBrief } from './StrategicBrief';
import { valuePillar } from './ValuePillar';
import { structurePillar } from './StructurePillar';
import { momentumPillar } from './MomentumPillar';
import { priceActionPillar } from './PriceActionPillar';
import { flowPillar } from './FlowPillar';
import { contextPillar } from './ContextPillar';

// Elite Intelligence Layers
import { timeframeCouncil, TimeframeAnalysis } from '../services/timeframe-council';
import { historicalFlowLayer } from './HistoricalFlowLayer';
import { intermarketAnalysisEngine } from '../services/intermarket-analysis-engine';
import { relationalEdgeEngine } from '../services/relational-edge-engine';
import { narrativeFlowEngine } from '../services/narrative-flow-engine';

/**
 * PILLAR ORCHESTRATOR
 * The "Central Nervous System" of the Predator Brain.
 * Updated: Multi-Timeframe Council + Historical Context
 */
export class PillarOrchestrator {
  
  /**
   * DEEP PREPARATION BRIEF
   * Synthesizes 6 pillars, Timeframe Council, and Historical Context.
   */
  async generateDeepPreparationBrief(symbol: string, currentPrice: number, marketSnapshot: any): Promise<StrategicBrief> {
    console.log(`🌅 STARTING DEEP PRE-MARKET PREPARATION for ${symbol}`);

    // 1. GATHER PILLAR DATA (Parallel)
    const [val, str, mom, pa, flow, ctx] = await Promise.all([
      valuePillar.getReport(symbol, currentPrice),
      structurePillar.getReport(symbol, marketSnapshot.history || []),
      momentumPillar.getReport(symbol, currentPrice, marketSnapshot.history || []),
      priceActionPillar.getReport(symbol),
      flowPillar.getReport(symbol),
      contextPillar.getReport(symbol, currentPrice, marketSnapshot.liveContext)
    ]);

    // 2. CONVENE TIMEFRAME COUNCIL (Investor / Swing / Scalper)
    const councilData: Record<string, TimeframeAnalysis> = marketSnapshot.timeframeData || {
      weekly: { timeframe: 'weekly', trend: 'uptrend', key_levels: { nearest_resistance: 950, nearest_support: 880, distance_to_resistance_pct: 0.05, distance_to_support_pct: 0.03 }, structure: 'consolidation', momentum: 'neutral' },
      daily: { timeframe: 'daily', trend: 'uptrend', key_levels: { nearest_resistance: 935, nearest_support: 900, distance_to_resistance_pct: 0.03, distance_to_support_pct: 0.01 }, structure: 'breakout', momentum: 'accelerating' },
      scalp: { timeframe: '5min', trend: 'uptrend', key_levels: { nearest_resistance: 915, nearest_support: 905, distance_to_resistance_pct: 0.01, distance_to_support_pct: 0.005 }, structure: 'extension', momentum: 'accelerating' }
    };

    const councilVerdict = timeframeCouncil.conveneCouncil(symbol, councilData.weekly, councilData.daily, councilData.scalp);

    // 3. SCAN HISTORICAL FLOW (Relevant Episodes)
    const biasWeight = this.calculateWeightedBias([val, str, mom, pa, flow, ctx]);
    const overallBias = biasWeight > 0.6 ? 'BULLISH' : biasWeight < 0.4 ? 'BEARISH' : 'NEUTRAL';
    const regime = this.determineMarketRegime(mom, ctx, str);

    const pastLessons = await historicalFlowLayer.findRelevantHistory(symbol, regime, overallBias);
    const replayInsight = historicalFlowLayer.synthesizeHistoricalInsight(pastLessons, currentPrice);

    // 4. INTERMARKET/MACRO DATA
    const intermarket = await intermarketAnalysisEngine.analyzeMarketRelationships(symbol, ['SPY', 'QQQ', 'TLT', 'UUP']);
    const narratives = await Promise.resolve(narrativeFlowEngine.getActiveNarratives());
    const activeMovie = narratives[0] || { topic: 'Market Open Vol', current_stage: 'THE_HOOK', intensity: 50 };

    return {
      symbol,
      timestamp: new Date().toISOString(),
      currentPrice,
      phase: 'PRE_MARKET_PREP',

      executiveSummary: {
        overallBias,
        convictionScore: Math.round(this.calculateSynthesisConfidence([val, str, mom, pa, flow, ctx]) * 100),
        marketRegime: regime,
        alphaDrivers: [val.keyInsights[0], flow.keyInsights[0], str.keyInsights[0]]
      },

      councilVerdict,

      historicalContext: {
        relevantPastLessons: pastLessons,
        synthesizedInsight: replayInsight.insight,
        probabilityAdjustment: replayInsight.probabilityAdj
      },

      macroContext: {
        intermarketDynamics: {
          gold: { trend: 'NEUTRAL', correlation: 0.2, impact: 'Hedge demand tracking' },
          dollar: { trend: 'STRONG', correlation: -0.6, impact: 'Liquidity drain tracking' },
          bonds: { trend: 'WEAK', correlation: 0.4, impact: 'Rate sensitivity tracking' }
        },
        ratioAnalysis: {
          spx_ndx: { value: 1.05, deviation: 'MODERATE', signal: 'Tech outperforming significantly' },
          sector_leaders: [{ sector: 'Technology', leader: 'NVDA', health: 912.40 }]
        },
        relativeStrength: {
          strong: ['NVDA', 'SMCI'],
          weak: ['AMD', 'INTC'],
          gauge_names: [{ ticker: 'MU', signal: 'BULLISH', significance: 'Semi Sector Health' }]
        }
      },

      narrativeMovie: {
        title: activeMovie.topic,
        stage: activeMovie.current_stage as any,
        catalysts: [activeMovie.topic, 'Pre-market gap'],
        twoSidesOfStory: { 
          bull_case: "Macro tailwinds pushing tech higher.", 
          bear_case: "Institutional distribution hidden behind retail euphoria." 
        },
        displacementPotential: "Yield spike or macro data shock."
      },

      institutionalIntelligence: {
        manipulationRisk: flow.rawMetrics.manipulation_risk > 70 ? 'HIGH' : 'MEDIUM',
        bigMoneyIntent: flow.keyInsights[0],
        retailTrapSignature: pa.keyInsights.find((i: string) => i.includes('TRAP')) || "Low-volume distribution.",
        liquidityZones: str.rawMetrics.levels.map((l: number) => ({ level: l, size: 'LARGE' })),
        deviationsFromShould: ["NARRATIVE DEVIATION: News is bullish, but flow is distribution."]
      },

      expertContext: [], // Placeholder for expert concept injection

      scenarios: this.buildDeepScenarios(currentPrice, str, biasWeight, activeMovie, replayInsight.probabilityAdj),

      qwenTacticalGuidance: this.buildDetailedQwenDirectives(currentPrice, biasWeight, str, mom),

      pillarInsights: {
        value: val.keyInsights,
        structure: str.keyInsights,
        momentum: mom.keyInsights,
        priceAction: pa.keyInsights,
        flow: flow.keyInsights,
        context: ctx.keyInsights
      },
      rawPillarReports: { val, str, mom, pa, flow, ctx }
    };
  }

  private calculateWeightedBias(reports: any[]): number {
    const weights = { 'Flow & Institutional Pillar': 3, 'Structure & Levels Pillar': 2, 'Context & News Pillar': 1.5 };
    let sum = 0; let totalW = 0;
    reports.forEach(r => {
      const w = (weights as any)[r.pillarName] || 1;
      const b = r.bias === 'BULLISH' ? 1 : r.bias === 'BEARISH' ? 0 : 0.5;
      sum += (b * w); totalW += w;
    });
    return sum / totalW;
  }

  private calculateSynthesisConfidence(reports: any[]): number {
    return reports.reduce((acc, r) => acc + r.confidence, 0) / (reports.length * 100);
  }

  private buildDeepScenarios(price: number, str: any, bias: number, movie: any, probAdj: number): StrategicBrief['scenarios'] {
    const primaryProb = (bias > 0.6 ? 70 : 30) + probAdj;
    return [
      {
        name: 'PRIMARY_OPEN_DRIVE',
        probability: Math.max(0, Math.min(100, primaryProb)),
        priceTarget: str.rawMetrics.levels[0] || price * 1.05,
        trigger: "Holding above pre-market VWAP.",
        narrative: `The "${movie.topic}" movie accelerates into THE_BUILD stage.`
      },
      {
        name: 'FADE_THE_TRAP',
        probability: Math.max(0, Math.min(100, (bias < 0.4 ? 65 : 10) - probAdj)),
        priceTarget: price * 0.97,
        trigger: "Failure at pre-market high with massive sell-sweeps.",
        narrative: "Retail enters on the 'Beginning' story, big money exits."
      }
    ];
  }

  private buildDetailedQwenDirectives(price: number, bias: number, str: any, mom: any): StrategicBrief['qwenTacticalGuidance'] {
    return {
      executionStyle: bias > 0.6 ? 'AGGRESSIVE_ENTRY' : 'PATIENT_SCALPEL',
      primaryEntryLevel: str.rawMetrics.levels[0] || price,
      hardStopLevel: price * 0.985,
      trailingStopAtr: 1.5,
      takeProfitZones: [price * 1.03],
      runnersAdvice: "Let 20% run if bias is confirmed.",
      thingsToWatch: ["Volume spike at open"]
    };
  }

  private determineMarketRegime(momentum: any, context: any, structure: any): string {
    if (context.rawMetrics.trap_active) return "MANIPULATIVE_TRAP";
    return "STABLE_ACCUMULATION";
  }
}

export const pillarOrchestrator = new PillarOrchestrator();
