import { StrategicBrief } from './StrategicBrief';
import { QwenTacticalDecision } from '../services/qwen-service';

/**
 * DAILY LESSON INTERFACE
 * The master distilled intelligence from a single trading day.
 * Designed for RAG memory ingestion.
 */
export interface DailyLesson {
  date: string;
  symbol: string;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  // --- PLAN VS REALITY ---
  analysisOfPlan: {
    wasBiasCorrect: boolean;
    scenarioAccuracy: { name: string; realized: boolean; notes: string }[];
    missedFocalPoints: string[]; // What did Nemotron miss pre-market?
  };

  // --- KEY TURNING POINTS (3-6 Moments) ---
  keyMoments: {
    time: string;
    description: string;
    causalPillars: string[]; // e.g. ["Flow", "Structure"]
    marketBehavior: string;  // e.g. "V-Bottom at VWAP"
    ourResponse: {
      planned: string;
      executed: string;
      qualityScore: number; // 0-100
    };
    lesson: string;
  }[];

  // --- EXECUTION AUDIT ---
  executionAudit: {
    adherenceToBrief: number; // 0-100
    slippageAnalysis: string;
    biggestMistake: string;
    biggestSuccess: string;
  };

  // --- INSTITUTIONAL MANIPULATION LOG ---
  // Tracking footprints for future pattern recognition
  institutionalFootprints: {
    trapType: string;         // e.g. "Bull Trap", "Liquidity Grab"
    signature: string;        // The "look" of the tape/candles
    manipulationIntensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  }[];

  // --- DALIO & BEHAVIORAL REFLECTION ---
  timelessReflections: {
    dalioPrinciple: string;
    behavioralBiasDetected: string; // e.g. "Recency Bias", "FOMO"
    systemicInsight: string;         // How to improve the system's "Map of Reality"
  };

  // --- TOMORROW'S ALPHA ---
  // Specific inputs for the next Pre-Market Prep
  adjustmentsForTomorrow: {
    technicalLevelsToWatch: number[];
    narrativeShiftNotes: string;
    tacticalOptimization: string;
  };
}
