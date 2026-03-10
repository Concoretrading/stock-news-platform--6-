
import { MarketContext, unifiedKnowledgeFoundation } from './unified-knowledge-foundation';
import { newsGravityAnalyzer, GravityAnalysis } from './news-gravity-analyzer';
import { MultiContractPositionManager, multiContractPositionManager } from './multi-contract-position-manager';
import { technicalIndicatorsEngine } from './technical-indicators-engine';
import { polygonDataProvider } from './polygon-data-provider';

export interface PostSessionLevels {
    ticker: string;
    poc: number; // Point of Control
    value_area_high: number;
    value_area_low: number;
    closing_price: number;
}

export interface OvernightReaction {
    pre_market_price: number;
    relative_bias: 'stronger' | 'weaker' | 'rangebound';
    anomaly_detected: boolean;
    anomaly_description?: string;
}

export interface CatalystScan {
    upgrades: string[];
    downgrades: string[];
    economic_data: { event: string; consensus: string; priority: 'high' | 'medium' | 'low' }[];
    speakers: { politician: string; time: string }[];
}

export interface PreMarketRoutineResult {
    ticker: string;
    overnight: OvernightReaction;
    catalysts: CatalystScan;
    system_grade: 'A' | 'B' | 'C' | 'F';
    strategy_plan: {
        strikes: { call: number; put: number };
        mission: string;
        scenarios: string[];
    };
    actionable_prep: string;
}

export class PreMarketRoutineOrchestrator {
    constructor() {
        console.log('🏛️ ELITE PRE-MARKET ROUTINE ORCHESTRATOR INITIALIZED');
    }

    /**
     * Executes the full 4-stage routine
     */
    public async runRoutine(
        ticker: string,
        yesterday: PostSessionLevels,
        preMarketPrice: number,
        newsData: any
    ): Promise<PreMarketRoutineResult> {
        console.log(`\n🌅 STARTING PRE-MARKET ROUTINE FOR ${ticker}...`);

        // 1. Overnight Assessment
        const overnight = this.assessOvernight(yesterday, preMarketPrice);

        // 2. Catalyst Scanning
        const catalysts = this.scanCatalysts(newsData);

        // 2.5 Fetch Fundamentals (Grok Upgrade)
        const fundamentals = await polygonDataProvider.getFinancials(ticker);

        // 3. System Filtering (Selection)
        const grade = await this.gradeStock(ticker, overnight, catalysts, fundamentals);

        // 4. Strategy Preparation
        const prep = await this.prepareStrategy(ticker, overnight, catalysts, grade);

        return {
            ticker,
            overnight,
            catalysts,
            system_grade: grade,
            strategy_plan: prep.strategy_plan,
            actionable_prep: prep.actionable_prep
        };
    }

    /**
     * STAGE 1: Overnight Reaction Assessment
     * Exposing opportunity by detecting what is different.
     */
    private assessOvernight(yesterday: PostSessionLevels, currentPre: number): OvernightReaction {
        const drift = (currentPre - yesterday.closing_price) / yesterday.closing_price * 100;

        let bias: 'stronger' | 'weaker' | 'rangebound' = 'rangebound';
        if (currentPre > yesterday.value_area_high) bias = 'stronger';
        else if (currentPre < yesterday.value_area_low) bias = 'weaker';

        // Anomaly: Opening outside of range or significant drift
        const anomalyDetected = currentPre > yesterday.value_area_high || currentPre < yesterday.value_area_low;

        return {
            pre_market_price: currentPre,
            relative_bias: bias,
            anomaly_detected: anomalyDetected,
            anomaly_description: anomalyDetected ?
                `Value Area Breach: Opening ${bias === 'stronger' ? 'above' : 'below'} yesterday's range.` :
                "Opening within balance."
        };
    }

    /**
     * STAGE 2: Catalyst Scanning
     * News decides how we prepare.
     */
    private scanCatalysts(newsData: any): CatalystScan {
        // Mocking extraction from incoming news stream
        return {
            upgrades: newsData.upgrades || [],
            downgrades: newsData.downgrades || [],
            economic_data: newsData.eco_data || [],
            speakers: newsData.speakers || []
        };
    }

    /**
     * STAGE 3: System Filtering
     * Running stocks through are system and see which ones look the best.
     * Includes Fundamental Sanitization (Grok Upgrade).
     */
    private async gradeStock(
        ticker: string,
        overnight: OvernightReaction,
        catalysts: CatalystScan,
        fundamentals: any
    ): Promise<'A' | 'B' | 'C' | 'F'> {
        // 1. Technical/Catalyst Confluence
        const hasMajorCatalyst = catalysts.upgrades.length > 0 || catalysts.economic_data.some(e => e.priority === 'high');
        const isAnomaly = overnight.anomaly_detected;

        let baseGrade: 'A' | 'B' | 'C' | 'F' = 'C';
        if (hasMajorCatalyst && isAnomaly) baseGrade = 'A';
        else if (hasMajorCatalyst || isAnomaly) baseGrade = 'B';

        // 2. Fundamental Sanitization (The "Quality Gate")
        if (fundamentals) {
            const isLiquid = fundamentals.current_ratio > 1.0;
            const isSolvent = fundamentals.debt_to_equity < 3.0;

            // If fundamental red flags exist, downgrade the setup
            if (!isLiquid || !isSolvent) {
                console.warn(`🛑 Fundamental Red Flag for ${ticker}: Liquidity/Solvency issue. Downgrading grade.`);
                if (baseGrade === 'A') return 'B';
                if (baseGrade === 'B') return 'C';
            }
        }

        return baseGrade;
    }

    /**
     * STAGE 4: Strategy Preparation
     * Finding strikes and plan for add/exit as day unfolds.
     */
    private async prepareStrategy(
        ticker: string,
        overnight: OvernightReaction,
        catalysts: CatalystScan,
        grade: 'A' | 'B' | 'C' | 'F'
    ): Promise<any> {

        // A. Define Strikes (e.g. Near ATM based on pre-market)
        const callStrike = Math.ceil(overnight.pre_market_price + 2);
        const putStrike = Math.floor(overnight.pre_market_price - 2);

        // B. Map scenarios using NewsGravity
        const gravity = await newsGravityAnalyzer.analyzeGravity(ticker, catalysts.economic_data[0]?.event || "Open Vol");
        const scenarios = gravity.active_scenarios.map(s => `${s.name}: ${s.description}`);

        // C. Define Mission Strategy
        const mission = grade === 'A' ? "AGGRESSIVE_RATIO" : "CONSERVATIVE_CORE";

        return {
            strategy_plan: {
                strikes: { call: callStrike, put: putStrike },
                mission,
                scenarios
            },
            actionable_prep: `Prep for ${mission} on ${ticker}. ${overnight.anomaly_description} Catalyst: ${catalysts.economic_data[0]?.event || 'None'}.`
        };
    }
}

export const preMarketRoutineOrchestrator = new PreMarketRoutineOrchestrator();
