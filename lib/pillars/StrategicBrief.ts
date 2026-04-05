import { PillarReport } from './BasePillar';
import { CouncilDecision } from '../services/timeframe-council';
import { DailyLesson } from './DailyLesson';

/**
 * STRATEGIC BRIEF INTERFACE
 * The master intelligence document for the Predator System.
 * Updated: Multi-Timeframe Council + Historical Context
 */
export interface StrategicBrief {
  symbol: string;
  timestamp: string;
  currentPrice: number;
  phase: 'PRE_MARKET_PREP' | 'LIVE_TRADING' | 'POST_SESSION_REVIEW';

  // --- EXECUTIVE SUMMARY ---
  executiveSummary: {
    overallBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    convictionScore: number; // 0-100
    marketRegime: string;    
    alphaDrivers: string[];   
  };

  // --- TIMEFRAME COUNCIL (Real-time Verdict) ---
  councilVerdict: CouncilDecision;

  // --- HISTORICAL CONTEXT (Past Replay) ---
  historicalContext: {
    relevantPastLessons: Partial<DailyLesson>[];
    synthesizedInsight: string; // e.g., "Last 3 similar setups resulted in X% reversal"
    probabilityAdjustment: number; // e.g., -5 or +10 based on history
  };

  // --- DEEP PREP: MACRO & CORRELATIONS ---
  macroContext: {
    intermarketDynamics: {
      gold: { trend: string; correlation: number; impact: string };
      dollar: { trend: string; correlation: number; impact: string };
      bonds: { trend: string; correlation: number; impact: string };
    };
    ratioAnalysis: {
      spx_ndx: { value: number; deviation: string; signal: string };
      sector_leaders: { sector: string; leader: string; health: number }[];
    };
    relativeStrength: {
      strong: string[];
      weak: string[];
      gauge_names: { ticker: string; signal: string; significance: string }[]; 
    };
  };

  // --- NARRATIVE MOVIE FRAMEWORK ---
  narrativeMovie: {
    title: string;
    stage: 'THE_HOOK' | 'THE_BUILD' | 'THE_CLIMAX' | 'THE_FADE';
    catalysts: string[];
    twoSidesOfStory: { bull_case: string; bear_case: string };
    displacementPotential: string; 
  };

  // --- INSTITUTIONAL INTELLIGENCE ---
  institutionalIntelligence: {
    manipulationRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    bigMoneyIntent: string;      
    retailTrapSignature: string; 
    liquidityZones: { level: number; size: 'SMALL' | 'LARGE' | 'WHALE' }[];
    deviationsFromShould: string[]; 
  };

  // --- DALIO & EXPERT CONTEXT ---
  expertContext: {
    expert: string;
    concept: string;
    principle: string;
    application: string;
  }[];

  // --- PROBABILISTIC SCENARIOS ---
  scenarios: {
    name: string;
    probability: number;   
    priceTarget: number;
    trigger: string;       
    narrative: string;     
  }[];

  // --- TACTICAL DIRECTIVES FOR QWEN ---
  qwenTacticalGuidance: {
    executionStyle: 'AGGRESSIVE_ENTRY' | 'PATIENT_SCALPEL' | 'STRIKE_ON_CONFIRM' | 'SIT_ON_HANDS';
    primaryEntryLevel: number;
    hardStopLevel: number;
    trailingStopAtr: number;
    takeProfitZones: number[];
    runnersAdvice: string; 
    thingsToWatch: string[]; 
  };

  pillarInsights: Record<string, string[]>;
  rawPillarReports?: Record<string, PillarReport>;
}
