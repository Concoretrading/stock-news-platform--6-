import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dailyReviewEngine } from '../lib/pillars/DailyReviewEngine';
import { StrategicBrief } from '../lib/pillars/StrategicBrief';
import { QwenTacticalDecision } from '../lib/services/qwen-service';

/**
 * DAILY REVIEW TEST SCRIPT
 * Simulates a full day's cycle: Pre-Market Plan → Executions → Post-Market Review.
 */
async function testDailyReview() {
  console.log('🚀 INITIALIZING DAILY REVIEW TEST SURGERY...');

  const date = '2026-04-03';
  const symbol = 'NVDA';

  // 1. MOCK PRE-MARKET PLAN (StrategicBrief)
  const mockPlan: any = {
    symbol,
    overallBias: 'BULLISH',
    executiveSummary: { 
        alphaDrivers: ["Strong sector demand", "Low IV compression break"],
        overallBias: 'BULLISH',
        convictionScore: 82 
    },
    macroContext: {
        ratioAnalysis: { sector_leaders: [{ health: 912.40 }, { health: 898.20 }] } // Mock levels
    },
    scenarios: [
        { name: "PRIMARY_OPEN_DRIVE", probability: 70 },
        { name: "FADE_THE_TRAP", probability: 20 }
    ],
    qwenTacticalGuidance: { executionStyle: 'AGGRESSIVE_ENTRY' }
  };

  // 2. MOCK TACTICAL EXECUTIONS (Qwen Actions)
  const mockExecutions: any[] = [
    {
      action: 'BUY',
      entryPrice: 909.20,
      reasoning: "Breakout above pre-market high with volume spike."
    },
    {
      action: 'SELL',
      entryPrice: 925.00,
      reasoning: "Target 1 reached; scaling out 50%."
    }
  ];

  // 3. MOCK MARKET DATA (OHLCV/Pivots)
  const mockMarketData = {
     pivots: ["09:45 Reversal", "11:15 Dip", "14:20 Breakout"],
     volatility: 'HIGH'
  };

  try {
    // 4. Run the Synthesis
    const lesson = await dailyReviewEngine.synthesizeDay(
      date, 
      symbol, 
      mockPlan, 
      mockExecutions, 
      mockMarketData
    );

    console.log('\n--- 🧠 FINAL DAILY LESSON SUMMARY ---');
    console.log(`Grade: ${lesson.overallGrade} | Symbol: ${lesson.symbol}`);
    console.log(`Bias Correct: ${lesson.analysisOfPlan.wasBiasCorrect}`);
    console.log(`Key Moment [0]: ${lesson.keyMoments[0].time} - ${lesson.keyMoments[0].description}`);
    console.log(`Biggest Success: ${lesson.executionAudit.biggestSuccess}`);
    console.log(`Dalio Principle: ${lesson.timelessReflections.dalioPrinciple}`);
    console.log(`Tomorrow's Levels: ${lesson.adjustmentsForTomorrow.technicalLevelsToWatch.join(', ')}`);

    console.log('\n✅ DAILY REVIEW SURGERY SUCCESSFUL.');
  } catch (error) {
    console.error('❌ Daily Review Test Failed:', error);
  }
}

testDailyReview().catch(console.error);
