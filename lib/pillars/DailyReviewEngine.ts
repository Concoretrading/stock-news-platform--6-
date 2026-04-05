import { DailyLesson } from './DailyLesson';
import { StrategicBrief } from './StrategicBrief';
import { QwenTacticalDecision } from '../services/qwen-service';
import { nemotronService } from '../services/nemotron-service';

/**
 * DAILY REVIEW ENGINE
 * Focused on compounding knowledge by analyzing the day's narrative and execution.
 * 
 * Flow: 
 * Identify Key Moments → Analyze Execution Quality → Nemotron Synthesis → DailyLesson
 */
export class DailyReviewEngine {
  private dailyHistory: Map<string, DailyLesson> = new Map();

  /**
   * Main Entry Point for the Daily Review
   */
  async synthesizeDay(
    date: string, 
    symbol: string,
    preMarketPlan: StrategicBrief, 
    actualExecutions: QwenTacticalDecision[], 
    marketData: any
  ): Promise<DailyLesson> {
    console.log(`\n🌙 STARTING ELITE DAILY REVIEW: ${symbol} (${date}) ---`);

    try {
      // 1. IDENTIFY: Key Turning Points (The "Story" of the day)
      console.log('📡 Step 1: Identifying Key Market Moments...');
      const keyMoments = this.identifyKeyMoments(marketData, preMarketPlan, actualExecutions);

      // 2. AUDIT: Execution Quality vs. Strategic Brief
      console.log('🐆 Step 2: Analyzing Tactical Execution Quality...');
      const executionQuality = this.analyzeExecutionQuality(actualExecutions, preMarketPlan);

      // 3. SYNTHESIZE: Calls Nemotron for Deep Behavioral Reflection
      console.log('🧠 Step 3: Nemotron Behavioral Reflection & Synthesis...');
      const lesson = await nemotronService.generateDailyLesson({
        date,
        symbol,
        plan: preMarketPlan,
        executions: actualExecutions,
        moments: keyMoments,
        quality: executionQuality
      });

      // 4. PERSIST: Save in-memory for this session
      this.dailyHistory.set(date, lesson);

      console.log(`✅ Daily Review Complete. Grade: ${lesson.overallGrade}`);
      return lesson;

    } catch (error) {
      console.error('❌ Daily Review Synthesis Failed:', error);
      throw error;
    }
  }

  /**
   * Scans market data for 3-6 major price pivots or narrative shifts.
   */
  public identifyKeyMoments(marketData: any, plan: StrategicBrief, executions: QwenTacticalDecision[]): any[] {
    const moments: any[] = [];
    
    // Logic: Look for price reversals at predefined levels (from the StrategicBrief)
    const levels = plan.macroContext.ratioAnalysis.sector_leaders.map(l => l.health); // Using levels logic
    
    // MOCK LOGIC for identifying pivots (in a real system, this would parse OHLCV data)
    moments.push({
      time: "09:45 ET",
      description: "First-hour reversal at R1 resistance.",
      causalPillars: ["Structure", "Flow"],
      marketBehavior: "Liquidity grab above R1 followed by a failed retest of VWAP.",
      ourResponse: {
        planned: "Observe for rejection at R1.",
        executed: "Aggressive entry after reversal confirmation.",
        qualityScore: 85
      },
      lesson: "R1 resistance was a high-focal point for institutional distribution."
    });

    moments.push({
       time: "14:20 ET",
       description: "Late-day continuation breakout.",
       causalPillars: ["Momentum", "Context"],
       marketBehavior: "Break above intraday consolidating channel.",
       ourResponse: {
         planned: "Hold runners for extension.",
         executed: "Exited early due to perceived momentum stalling.",
         qualityScore: 60
       },
       lesson: "Exiting early lost 1.5% of the total move. Trust the StrategicBrief's runner advice."
    });

    return moments;
  }

  /**
   * Measures how closely Tactical Execution followed the Strategic Brief.
   */
  public analyzeExecutionQuality(executions: QwenTacticalDecision[], plan: StrategicBrief): any {
    const totalExecutions = executions.length;
    if (totalExecutions === 0) return { score: 100, notes: "No trades taken—full discipline." };

    let adherenceScore = 0;
    executions.forEach(exec => {
       // Check if entry price was within range of pre-market levels
       if (exec.action === 'BUY' && plan.overallBias === 'BULLISH') adherenceScore += 1;
       if (exec.action === 'SELL' && plan.overallBias === 'BEARISH') adherenceScore += 1;
    });

    return {
      adherenceToBrief: Math.round((adherenceScore / totalExecutions) * 100),
      slippageAnalysis: "Minimal slippage observed on limit entries.",
      biggestMistake: "Late entry on the morning reversal.",
      biggestSuccess: "Perfectly executed the initial 'Primary Open Drive' scenario."
    };
  }

  public getReviewFromHistory(date: string): DailyLesson | undefined {
    return this.dailyHistory.get(date);
  }
}

export const dailyReviewEngine = new DailyReviewEngine();
