import { pillarOrchestrator } from './PillarOrchestrator';
import { nemotronService, NemotronSynthesisResponse } from '../services/nemotron-service';
import { QwenService } from '../services/qwen-service';
import { StrategicBrief } from './StrategicBrief';

/**
 * BRAIN COORDINATOR
 * The conductor of the Predator Hierarchical Intelligence.
 * Updated: Deep Preparation (Pre-Market) Specialists logic.
 */
export class BrainCoordinator {
  private lastStrategicBrief: StrategicBrief | null = null;
  private lastStrategicThesis: NemotronSynthesisResponse | null = null;
  private marketOpenTime: Date;
  private tacticalService: QwenService;

  constructor(marketOpen: Date = new Date()) {
    this.marketOpenTime = marketOpen;
    
    // Choose tactical hardware based on 4-hour "H200 Era" logic
    const isH200Era = this.checkH200Era();
    this.tacticalService = new QwenService(!isH200Era); // Local if not H200 era
    
    console.log(`🧠 BRAIN COORDINATOR INITIALIZED. Market Open: ${this.marketOpenTime.toLocaleTimeString()}`);
  }

  /**
   * DEEP PRE-MARKET PREPARATION (30-60m before open)
   * This is where Nemotron does its deepest work.
   */
  async runPreMarketPreparation(symbol: string, currentPrice: number, marketSnapshot: any) {
    console.log(`\n--- 🌅 DEEP PRE-MARKET PREPARATION START: ${symbol} ---`);

    try {
      // 1. STRATEGIC PREP: Deep Orchestration (Macro, Ratios, Movie Framework)
      console.log('📡 Step 1: Gathering Deep Intelligence across 6 Pillars + Macro...');
      const prepBrief = await pillarOrchestrator.generateDeepPreparationBrief(symbol, currentPrice, marketSnapshot);
      this.lastStrategicBrief = prepBrief;

      // 2. STRATEGIC BRAIN: Nemotron-3-Nano (Deep Preparation Context)
      console.log('🧠 Step 2: Nemotron Deep Strategic Reasoning (Movie Logic + Dalio)...');
      const strategicThesis = await nemotronService.synthesizeStrategicThesis(prepBrief);
      this.lastStrategicThesis = strategicThesis;

      console.log(`   Strategic Prep Finish: Bias ${strategicThesis.final_trade_direction} (${strategicThesis.confidence}%)`);
      console.log(`   Autonomous Thesis: ${strategicThesis.autonomous_thesis}`);
      console.log(`   Manipulation Risks: ${strategicThesis.potential_traps_identified.join(', ')}`);

      // 3. TACTICAL READINESS: Pre-caching guidance for Qwen
      console.log('🐆 Step 3: Preparing Tactical Readiness for Qwen Execution...');
      // In the prep phase, we don't necessarily execute, we just verify the plan for the open.
      
      return {
        strategic: strategicThesis,
        brief: prepBrief,
        is_ready_for_open: strategicThesis.confidence > 60 && strategicThesis.final_trade_direction !== 'NEUTRAL'
      };

    } catch (error) {
      console.error('❌ Deep Preparation Phase Failed:', error);
      throw error;
    }
  }

  /**
   * Main Decision Cycle for a specific ticker (Live Trading)
   */
  async runDecisionCycle(symbol: string, currentPrice: number, marketSnapshot: any) {
    console.log(`\n--- 🔄 LIVE BRAIN CYCLE: ${symbol} ---`);
    const brief = await pillarOrchestrator.generateStrategicBrief(symbol, currentPrice, marketSnapshot);
    const strategicThesis = await nemotronService.synthesizeStrategicThesis(brief);
    
    return {
      strategic: strategicThesis,
      tactical: await this.tacticalService.generateTacticalDecision(brief, marketSnapshot),
      brief
    };
  }

  private checkH200Era(): boolean {
    const now = new Date();
    const fourHoursInMillis = 4 * 60 * 60 * 1000;
    const elapsed = now.getTime() - this.marketOpenTime.getTime();
    return elapsed >= 0 && elapsed < fourHoursInMillis;
  }
}

export const brainCoordinator = new BrainCoordinator();
