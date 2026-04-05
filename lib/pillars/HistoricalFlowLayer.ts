import { DailyLesson } from './DailyLesson';
import { dailyReviewEngine } from './DailyReviewEngine';
import { StrategicBrief } from './StrategicBrief';

/**
 * HISTORICAL FLOW LAYER
 * Dedicated to scanning past "Episodes" and Distilling their Lessons.
 * Purpose: Provide Nemotron with "Historical Echoes" to adjust current probabilities.
 */
export class HistoricalFlowLayer {
  
  /**
   * Scans history for setups with similar characteristics (Symbol, Regime, Bias).
   */
  public async findRelevantHistory(symbol: string, currentRegime: string, currentBias: string): Promise<Partial<DailyLesson>[]> {
    console.log(`🔎 SCANNING HISTORICAL FLOW: ${symbol} in ${currentRegime} regime...`);
    
    // In-memory history access from the DailyReviewEngine
    // Note: In production, this would be a RAG query to a Vector Database.
    const lessons: Partial<DailyLesson>[] = [];
    
    // Mocking finding at least 2 relevant past days
    // We filter for days where the Regime was similar.
    lessons.push({
      date: "2026-03-20",
      analysisOfPlan: { wasBiasCorrect: true, scenarioAccuracy: [], missedFocalPoints: ["Yield spike at lunch"] },
      institutionalFootprints: [{ trapType: "Bull Trap at R1", signature: "Low volume breakout", manipulationIntensity: "HIGH" }],
      timelessReflections: { dalioPrinciple: "Reality + Dreams = Progress", behavioralBiasDetected: "FOMO", systemicInsight: "R1 breakout without volume is a high-probability trap." }
    });

    lessons.push({
      date: "2026-03-27",
      analysisOfPlan: { wasBiasCorrect: false, scenarioAccuracy: [], missedFocalPoints: ["Macro rotation out of Tech"] },
      executionAudit: { adherenceToBrief: 60, slippageAnalysis: "", biggestMistake: "Ignored the yield divergence", biggestSuccess: "", disciplineNotes: "" },
      adjustmentsForTomorrow: { technicalLevelsToWatch: [920], narrativeShiftNotes: "Yields are the master driver", tacticalOptimization: "Wait for 15m confirmation on breakouts." }
    });

    return lessons;
  }

  /**
   * Distills the relevant lessons into a single actionable "Replay Insight".
   */
  public synthesizeHistoricalInsight(lessons: Partial<DailyLesson>[], currentPrice: number): { insight: string; probabilityAdj: number } {
    if (lessons.length === 0) return { insight: "No significant historical match found.", probabilityAdj: 0 };

    const traps = lessons.filter(l => l.institutionalFootprints?.some(tf => tf.trapType.includes('Trap')));
    const mistakeNotes = lessons.map(l => l.executionAudit?.biggestMistake).filter(Boolean);

    let insight = `PAST REPLAY: In the last ${lessons.length} similar setups, institutional distribution was hidden behind ${traps[0]?.institutionalFootprints?.[0].signature || 'low volume'}. `;
    insight += `Biggest historical risk: ${mistakeNotes[0] || 'Chasing the initial breakout'}. `;
    insight += "Systemic Recommendation: Wait for high-volume confirmation before committing primary size.";

    // Probability adjustment logic
    // If the last few similar setups were "Traps", we decrease the current scenario's probability.
    const probabilityAdj = traps.length > 0 ? -15 : 5;

    return {
      insight,
      probabilityAdj
    };
  }
}

export const historicalFlowLayer = new HistoricalFlowLayer();
