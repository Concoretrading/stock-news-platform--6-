
import { newsGravityAnalyzer, GravityAnalysis } from './news-gravity-analyzer';
import { behavioralGravityEngine, BehavioralBiasReport } from './behavioral-gravity-engine';

// --- Interfaces ---

export interface GapZone {
    type: 'GAP_UP' | 'GAP_DOWN';
    zone_low: number;
    zone_high: number;
    fill_percent: number; // 0 to 100
    status: 'UNFILLED' | 'PARTIAL' | 'FILLED';
    context: 'NEWS_DRIVEN' | 'TECHNICAL_ONLY';
}

export interface InstitutionalIntent {
    action: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
    confidence: number; // 0-100
    reason: string; // "Gap Up on Value + Low Retail Euphoria"
}

export interface InstitutionalFlowAnalysis {
    timestamp: string;
    symbol: string;
    gap_analysis: {
        active_gap: GapZone | null;
        gap_type: 'VALUE_SHIFT' | 'TRAP' | 'NONE';
        description: string;
    };
    strength_test: {
        tested_level: number | null;
        selling_pressure: 'LOW' | 'MEDIUM' | 'HIGH'; // Volume/Price Action on test
        retreat_probability: number; // 0-100 (High = Big Money Fleeing)
        outcome_forecast: 'SUPPORT_LIKELY' | 'RETREAT_LIKELY' | 'NEUTRAL';
    };
    institutional_intent: InstitutionalIntent;
    strategic_bias: 'FOLLOW_INSTITUTIONS' | 'FADE_RETAIL' | 'WAIT';
}

export class BigMoneyFlowInterpreter {

    constructor() {
        console.log('💼 INITIALIZING BIG MONEY FLOW INTERPRETER (The Wallet)...');
    }

    /**
     * Core Analysis: Deciphers Institutional Intent via Gaps & Flow
     */
    async analyzeFlow(
        ticker: string,
        currentPrice: number,
        openPrice: number,
        prevClose: number,
        currentVolume: number,
        avgVolume: number
    ): Promise<InstitutionalFlowAnalysis> {
        console.log(`💼 Analyzing Institutional Flow for ${ticker}...`);

        // 1. Detect Gap
        const gap = this.detectGap(openPrice, prevClose);

        // 2. Gather Context (News & Behavior)
        // In a real run, we'd pass real P&L or fetch it. Mocking P&L as 0 for behavioral analysis here.
        const news = await newsGravityAnalyzer.analyzeGravity(ticker);
        const behavior = await behavioralGravityEngine.analyzeBehavioralBiases(ticker, currentPrice, 0);

        // 3. Engineer the Gap (Value vs Trap)
        const gapType = this.engineerGap(gap, news, behavior);

        // 4. Test Strength (Retreat vs Support)
        const strengthTest = this.analyzeStrengthTest(gap, currentPrice, currentVolume, avgVolume);

        // 5. Determine Intent
        const intent = this.determineIntent(gap, gapType, strengthTest);

        return {
            timestamp: new Date().toISOString(),
            symbol: ticker,
            gap_analysis: {
                active_gap: gap,
                gap_type: gapType.type,
                description: gapType.description
            },
            strength_test: strengthTest,
            institutional_intent: intent,
            strategic_bias: this.deriveBias(intent, strengthTest)
        };
    }

    private detectGap(open: number, prevClose: number): GapZone | null {
        const threshold = 0.5; // 0.5% gap minimum
        const change = ((open - prevClose) / prevClose) * 100;

        if (Math.abs(change) < threshold) return null;

        const isUp = change > 0;
        return {
            type: isUp ? 'GAP_UP' : 'GAP_DOWN',
            zone_low: isUp ? prevClose : open,
            zone_high: isUp ? open : prevClose,
            fill_percent: 0,
            status: 'UNFILLED',
            context: 'TECHNICAL_ONLY' // Default, updated later
        }
    }

    private engineerGap(gap: GapZone | null, news: GravityAnalysis, behavior: BehavioralBiasReport) {
        if (!gap) return { type: 'NONE', description: 'No significant gap' } as const;

        // Is it News Driven?
        const isNews = news.gravity_levels.some(l =>
            Math.abs(new Date(l.date).getTime() - Date.now()) < 24 * 60 * 60 * 1000 // Within 24h
        );
        if (isNews) gap.context = 'NEWS_DRIVEN';

        // Gap Up Analysis
        if (gap.type === 'GAP_UP') {
            const isEuphoric = behavior.biases_detected.herd_behavior.sentiment_extreme === 'BULLISH';

            if (isEuphoric) {
                // Gap Up + Euphoria = Likely Trap (Institutions selling into retail chase)
                return { type: 'TRAP', description: 'Gap Up into Euphoria. Institutions likely distributing.' } as const;
            } else {
                // Gap Up + Fear/Neutral = Value Shift (Institutions repricing higher)
                return { type: 'VALUE_SHIFT', description: 'Gap Up in quiet/fearful market. Institutions accumulating value.' } as const;
            }
        }

        // Gap Down Analysis (simplified for now to mirror Gap Up logic)
        return { type: 'VALUE_SHIFT', description: 'Gap Down. Institutions repricing lower.' } as const;
    }

    private analyzeStrengthTest(
        gap: GapZone | null,
        currentPrice: number,
        volume: number,
        avgVolume: number
    ) {
        if (!gap) return { tested_level: null, selling_pressure: 'LOW', retreat_probability: 0, outcome_forecast: 'NEUTRAL' } as const;

        // Check if testing gap zone
        const inZone = currentPrice >= gap.zone_low && currentPrice <= gap.zone_high;

        let pressure: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        let retreatProb = 30; // Baseline

        if (inZone) {
            // Volume Analysis relative to average
            // If volume is high while testing gap, it means conflict/activity.
            // On a retest of a Gap Up (support check), high sell volume is BAD (Retreat).

            // Simulating "Sell Volume" proportion (in real app, use order flow)
            const relativeVol = volume / (avgVolume / 6.5); // approx hourly avg

            if (relativeVol > 2.0) {
                pressure = 'HIGH';
                retreatProb = 80;
            } else if (relativeVol > 1.2) {
                pressure = 'MEDIUM';
                retreatProb = 50;
            } else {
                retreatProb = 20; // Low volume pullback = Support
            }
        }

        return {
            tested_level: inZone ? currentPrice : null,
            selling_pressure: pressure,
            retreat_probability: retreatProb,
            outcome_forecast: retreatProb > 60 ? 'RETREAT_LIKELY' : 'SUPPORT_LIKELY'
        } as const;
    }

    private determineIntent(gap: GapZone | null, gapType: any, strength: any): InstitutionalIntent {
        if (!gap) return { action: 'NEUTRAL', confidence: 0, reason: 'No gap context' };

        if (gapType.type === 'TRAP') {
            return { action: 'DISTRIBUTION', confidence: 85, reason: 'Trap Gap detected. Smart Money selling.' };
        }

        if (gapType.type === 'VALUE_SHIFT') {
            if (strength.outcome_forecast === 'RETREAT_LIKELY') {
                return { action: 'NEUTRAL', confidence: 60, reason: 'Value Gap failing support test.' };
            }
            return { action: 'ACCUMULATION', confidence: 80, reason: 'Value Gap holding support. Smart Money buying.' };
        }

        return { action: 'NEUTRAL', confidence: 50, reason: 'Mixed signals.' };
    }

    private deriveBias(intent: InstitutionalIntent, strength: any): 'FOLLOW_INSTITUTIONS' | 'FADE_RETAIL' | 'WAIT' {
        if (intent.action === 'DISTRIBUTION') return 'FADE_RETAIL'; // Fade the chasers
        if (intent.action === 'ACCUMULATION') return 'FOLLOW_INSTITUTIONS'; // Ride the wave
        return 'WAIT';
    }
}

export const bigMoneyFlowInterpreter = new BigMoneyFlowInterpreter();
