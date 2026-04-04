
import { tradingPsychologyEngine, PsychologyEngineOutput } from './trading-psychology-engine';
import { newsGravityAnalyzer, GravityAnalysis } from './news-gravity-analyzer';

// --- Interfaces ---

export interface BehavioralBiasReport {
    timestamp: string;
    biases_detected: {
        prospect_theory: {
            active: boolean;
            loss_aversion_factor: number; // > 1.0 means high fear of loss
            risk_adjustment: string; // "TIGHTEN_STOPS" | "REDUCE_SIZE"
        };
        herd_behavior: {
            active: boolean;
            sentiment_extreme: 'BULLISH' | 'BEARISH' | 'NONE';
            contrarian_signal: boolean; // True if we should fade the herd
        };
        anchoring: {
            active: boolean;
            anchored_level: number | null; // e.g., Previous ATH or News Rip
            bias_correction: string; // "RESPECT_LEVEL" | "FADE_BREAKOUT"
        };
        disposition_effect: {
            active: boolean;
            pressure: 'SELL_WINNERS' | 'HOLD_LOSERS' | 'NONE';
            automation_override: string; // "FORCE_TAKE_PROFIT" | "FORCE_CUT_LOSS"
        };
    };
    risk_modifiers: {
        max_size_multiplier: number; // 0.5 to 1.5
        stop_loss_multiplier: number; // 0.8 (tighten) to 1.2 (loosen)
    };
    strategic_advice: string[];
}

export class BehavioralGravityEngine {

    constructor() {
        console.log('🧠 INITIALIZING BEHAVIORAL GRAVITY ENGINE (The Instinct)...');
    }

    /**
     * Core Analysis: Models human biases to find edge
     */
    async analyzeBehavioralBiases(
        ticker: string,
        currentPrice: number,
        unrealizedPLPercent: number // Current position P&L (mocked or real)
    ): Promise<BehavioralBiasReport> {
        console.log(`🧠 Analyzing Behavioral Biases for ${ticker}...`);

        // 1. Gather Intelligence
        const psychology = await tradingPsychologyEngine.analyzeTradingPsychology(ticker);
        const newsGravity = await newsGravityAnalyzer.analyzeGravity(ticker);

        // 2. Model Individual Biases
        const prospectTheory = this.modelProspectTheory(psychology, unrealizedPLPercent);
        const herdBehavior = this.modelHerdBehavior(psychology);
        const anchoring = this.modelAnchoring(currentPrice, newsGravity);
        const disposition = this.modelDispositionEffect(unrealizedPLPercent);

        // 3. Synthesize Risk Modifiers
        const riskModifiers = this.calculateRiskModifiers(prospectTheory, herdBehavior, anchoring);

        // 4. Generate Strategic Advice
        const advice = this.generateStrategicAdvice(prospectTheory, herdBehavior, anchoring, disposition);

        return {
            timestamp: new Date().toISOString(),
            biases_detected: {
                prospect_theory: prospectTheory,
                herd_behavior: herdBehavior,
                anchoring: anchoring,
                disposition_effect: disposition
            },
            risk_modifiers: riskModifiers,
            strategic_advice: advice
        };
    }

    /**
     * Prospect Theory: "Losses loom larger than gains"
     * If market is fearful OR we are in a loss, risk aversion spikes.
     */
    private modelProspectTheory(psychology: PsychologyEngineOutput, pnlPercent: number) {
        const isFearful = psychology.market_emotional_state.primary_emotion === 'fear';
        const isPanic = psychology.market_emotional_state.primary_emotion === 'panic';

        let lossAversion = 1.0;
        let riskAdj = 'NORMAL';

        // Bias amplifies if in a losing position (Fighting back to zero)
        if (pnlPercent < -2.0) {
            lossAversion += 0.5; // Desperation kicks in
            riskAdj = 'FORCE_CUT_LOSS'; // Bot must override human desire to hold
        }

        // Bias amplifies if market is scared
        if (isFearful) lossAversion += 0.3;
        if (isPanic) {
            lossAversion += 0.8;
            riskAdj = 'REDUCE_SIZE';
        }

        return {
            active: lossAversion > 1.2,
            loss_aversion_factor: lossAversion,
            risk_adjustment: riskAdj
        };
    }

    /**
     * Herd Behavior: "The trend is your friend until it's a bubble"
     * Contrarian signaling at extremes.
     */
    private modelHerdBehavior(psychology: PsychologyEngineOutput) {
        const emotion = psychology.market_emotional_state.primary_emotion;
        const intensity = psychology.market_emotional_state.intensity_level;

        let sentiment: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
        let contrarian = false;

        if (emotion === 'euphoria' || emotion === 'greed') {
            sentiment = 'BULLISH';
            if (intensity > 80) contrarian = true; // Bubblicious
        } else if (emotion === 'panic' || emotion === 'fear') {
            sentiment = 'BEARISH';
            if (intensity > 80) contrarian = true; // Capitulation
        }

        return {
            active: contrarian,
            sentiment_extreme: sentiment,
            contrarian_signal: contrarian
        };
    }

    /**
     * Anchoring: "Fixating on past price levels"
     * Uses NewsGravity levels as anchors.
     */
    private modelAnchoring(currentPrice: number, gravity: GravityAnalysis) {
        // Safety check: if no gravity levels, return inactive
        if (!gravity.gravity_levels || gravity.gravity_levels.length === 0) {
            return { active: false, anchored_level: null, bias_correction: 'NONE' };
        }

        // Find nearest heavy gravity level
        const nearest = gravity.gravity_levels.reduce((prev, curr) =>
            Math.abs(curr.price - currentPrice) < Math.abs(prev.price - currentPrice) ? curr : prev
        );

        if (!nearest) return { active: false, anchored_level: null, bias_correction: 'NONE' };

        const distPercent = Math.abs(currentPrice - nearest.price) / currentPrice * 100;
        const isClose = distPercent < 1.0; // Within 1%

        return {
            active: isClose,
            anchored_level: nearest.price,
            bias_correction: isClose ? 'RESPECT_ANCHOR' : 'NONE'
        };
    }

    /**
     * Disposition Effect: "Selling winners too early, holding losers too long"
     */
    private modelDispositionEffect(pnlPercent: number) {
        let pressure: 'SELL_WINNERS' | 'HOLD_LOSERS' | 'NONE' = 'NONE';
        let override = 'NONE';

        // Human Instinct: "I made 5%, let me bank it before it vanishes!" (Premature selling)
        if (pnlPercent > 5.0 && pnlPercent < 10.0) {
            pressure = 'SELL_WINNERS';
            override = 'FORCE_HOLD_RUNNER'; // Bot enforces discipline
        }

        // Human Instinct: "It's coming back, just give it time." (Hold loser)
        if (pnlPercent < -5.0) {
            pressure = 'HOLD_LOSERS';
            override = 'FORCE_CUT_LOSS'; // Bot serves as risk manager
        }

        return {
            active: pressure !== 'NONE',
            pressure: pressure,
            automation_override: override
        };
    }

    private calculateRiskModifiers(prospect: any, herd: any, anchoring: any) {
        let sizeMult = 1.0;
        let stopMult = 1.0;

        // Prospect Theory: Reduce size if panicked
        if (prospect.loss_aversion_factor > 1.5) {
            sizeMult *= 0.5;
            stopMult *= 0.8; // Tighten stops
        }

        // Herd: If fading a bubble, size small initially (catching a falling knife)
        if (herd.contrarian_signal) {
            sizeMult *= 0.75;
            stopMult *= 1.2; // Looser stop to allow for "noise"
        }

        return { max_size_multiplier: sizeMult, stop_loss_multiplier: stopMult };
    }

    private generateStrategicAdvice(prospect: any, herd: any, anchoring: any, disposition: any): string[] {
        const advice: string[] = [];

        if (herd.contrarian_signal) {
            advice.push(`🐑 CONTRARIAN ALERT: Herd is extreme ${herd.sentiment_extreme}. Look to FADE.`);
        }

        if (anchoring.active) {
            advice.push(`⚓ ANCHORING: Market fixated on ${anchoring.anchored_level}. Expect turbulence/rejection.`);
        }

        if (disposition.active) {
            if (disposition.pressure === 'SELL_WINNERS') {
                advice.push(`💎 DISCIPLINE: Resist urge to sell early. Trust the runner targets.`);
            }
            if (disposition.pressure === 'HOLD_LOSERS') {
                advice.push(`🔪 DISCIPLINE: Stop hoping. Cut the loss immediately.`);
            }
        }

        if (prospect.loss_aversion_factor > 1.2) {
            advice.push(`🛡️ DEFENSE: Loss aversion detected. Reduced sizing active.`);
        }

        return advice;
    }
}

export const behavioralGravityEngine = new BehavioralGravityEngine();
