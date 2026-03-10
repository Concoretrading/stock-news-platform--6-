
import { bigMoneyFlowInterpreter, InstitutionalFlowAnalysis } from './big-money-flow-interpreter';

// --- Interfaces ---

export interface KeltnerState {
    upper: number;
    middle: number; // 20 EMA
    lower: number;
    bandwidth_percent: number;
    status: 'OVERBOUGHT' | 'OVERSOLD' | 'NEUTRAL'; // Price > Upper or < Lower
    extension_factor: number; // How far past the band (0 = at band, >0 = extended)
}

export interface MAExtension {
    ma_21_diff_percent: number; // % distance from 21 EMA
    is_extended: boolean; // > 3-5% (configurable)
    structural_support: {
        sma_50_proximity: number; // % distance
        sma_200_proximity: number; // % distance
        interaction: 'BOUNCE_50' | 'BOUNCE_200' | 'REJECT_200' | 'BREAK_50' | 'NONE';
    };
}

export interface ExtensionConfluenceAnalysis {
    timestamp: string;
    symbol: string;
    keltner_state: KeltnerState;
    ma_structure: MAExtension;
    confluence_score: number; // 0-100 (High = Strong Reversal/Continuation Signal)
    signal: {
        type: 'REVERSION_LONG' | 'REVERSION_SHORT' | 'CONTINUATION' | 'WAIT';
        confidence: number;
        reason: string;
    };
}

export class ExtensionMAConfluence {

    constructor() {
        console.log('🦴 INITIALIZING EXTENSION MA CONFLUENCE (The Skeleton)...');
    }

    /**
     * Core Analysis: Detects Overextension & Structural Confluence
     */
    async analyzeExtension(
        ticker: string,
        dates: string[],
        closes: number[],
        highs: number[],
        lows: number[],
        flowAnalysis?: InstitutionalFlowAnalysis // Optional integration
    ): Promise<ExtensionConfluenceAnalysis> {
        console.log(`🦴 Analyzing Extension/Structure for ${ticker}...`);

        // 1. Calculate Indicators (Manual calc for independence/speed)
        const keltner = this.calculateKeltner(closes, highs, lows);
        const mas = this.calculateMAs(closes);

        // 2. Determine Keltner State
        const currentPrice = closes[closes.length - 1];
        const kState = this.analyzeKeltnerState(currentPrice, keltner);

        // 3. Analyze MA Structure
        const maState = this.analyzeMAStructure(currentPrice, mas, highs[highs.length - 1], lows[lows.length - 1]);

        // 4. Calculate Confluence & Signal
        return this.generateSignal(ticker, kState, maState, flowAnalysis);
    }

    // --- Calculation Helpers ---

    private calculateKeltner(closes: number[], highs: number[], lows: number[]): { upper: number, middle: number, lower: number } {
        const period = 20;
        const multiplier = 2.0;

        // 20 EMA (Middle)
        const ema20 = this.calcEMA(closes, period);

        // ATR
        const atr = this.calcATR(highs, lows, closes, period);

        return {
            upper: ema20 + (atr * multiplier),
            middle: ema20,
            lower: ema20 - (atr * multiplier)
        };
    }

    private calculateMAs(closes: number[]) {
        return {
            ema21: this.calcEMA(closes, 21),
            sma50: this.calcSMA(closes, 50),
            sma200: this.calcSMA(closes, 200)
        };
    }

    private calcEMA(data: number[], period: number): number {
        const k = 2 / (period + 1);
        let ema = data[0]; // Simple seeding for brevity in this snippet
        // In prod, would seed with SMA of first 'period' elements then loop
        // Approximate for recent data:
        let startIdx = Math.max(0, data.length - (period * 5)); // Look back enough to stabilize
        ema = data[startIdx];

        for (let i = startIdx + 1; i < data.length; i++) {
            ema = (data[i] * k) + (ema * (1 - k));
        }
        return ema;
    }

    private calcSMA(data: number[], period: number): number {
        if (data.length < period) return data[data.length - 1];
        const slice = data.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }

    private calcATR(highs: number[], lows: number[], closes: number[], period: number): number {
        // Simplified ATR for latest value
        let trSum = 0;
        // Calculate TRs for last 'period' bars
        for (let i = 0; i < period; i++) {
            const idx = highs.length - 1 - i;
            if (idx <= 0) break;
            const h = highs[idx];
            const l = lows[idx];
            const pc = closes[idx - 1];
            const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
            trSum += tr;
        }
        return trSum / period;
    }

    // --- Analysis Logic ---

    private analyzeKeltnerState(price: number, k: { upper: number, middle: number, lower: number }): KeltnerState {
        let status: KeltnerState['status'] = 'NEUTRAL';
        let extension = 0;

        if (price > k.upper) {
            status = 'OVERBOUGHT';
            extension = (price - k.upper) / k.upper;
        } else if (price < k.lower) {
            status = 'OVERSOLD';
            extension = (k.lower - price) / k.lower;
        }

        return {
            upper: k.upper,
            middle: k.middle,
            lower: k.lower,
            bandwidth_percent: ((k.upper - k.lower) / k.middle) * 100,
            status,
            extension_factor: extension
        };
    }

    private analyzeMAStructure(price: number, mas: { ema21: number, sma50: number, sma200: number }, high: number, low: number): MAExtension {
        const diff21 = ((price - mas.ema21) / mas.ema21) * 100;
        const isExtended = Math.abs(diff21) > 3.0; // 3% threshold

        const prox50 = Math.abs((price - mas.sma50) / mas.sma50) * 100;
        const prox200 = Math.abs((price - mas.sma200) / mas.sma200) * 100;

        let interaction: MAExtension['structural_support']['interaction'] = 'NONE';

        // Simple hit detection (within 0.5%)
        if (prox200 < 0.5) {
            // If price is below 200 but high touched it? Rejection?
            // Simply checking proximity for now
            interaction = price > mas.sma200 ? 'BOUNCE_200' : 'REJECT_200';
        } else if (prox50 < 0.5) {
            interaction = price > mas.sma50 ? 'BOUNCE_50' : 'BREAK_50';
        }

        return {
            ma_21_diff_percent: diff21,
            is_extended: isExtended,
            structural_support: {
                sma_50_proximity: prox50,
                sma_200_proximity: prox200,
                interaction
            }
        };
    }

    private generateSignal(
        ticker: string,
        kState: KeltnerState,
        maState: MAExtension,
        flow?: InstitutionalFlowAnalysis
    ): ExtensionConfluenceAnalysis {

        // Scoring
        let score = 0;
        let signalType: ExtensionConfluenceAnalysis['signal']['type'] = 'WAIT';
        let reason = "Market in equilibrium.";

        // Base Logic: Extension = Reversion Opportunity
        if (kState.status === 'OVERBOUGHT') {
            score += 30;
            if (maState.is_extended) score += 20; // Confluence: Keltner + 21MA Extension

            // Flow Confluence
            if (flow?.institutional_intent.action === 'DISTRIBUTION') score += 30; // Big Money selling into extension
            if (flow?.strength_test.outcome_forecast === 'RETREAT_LIKELY') score += 20;

            if (score > 60) {
                signalType = 'REVERSION_SHORT';
                reason = "EXTREME OVERBOUGHT + FADE CONFLUENCE";
            }
        } else if (kState.status === 'OVERSOLD') {
            score += 30;
            if (maState.is_extended) score += 20;
            if (flow?.institutional_intent.action === 'ACCUMULATION') score += 30;

            if (score > 60) {
                signalType = 'REVERSION_LONG';
                reason = "EXTREME OVERSOLD + BUY CONFLUENCE";
            }
        }

        // Structural Support Logic (Trend Continuation)
        if (maState.structural_support.interaction === 'BOUNCE_50' && kState.status !== 'OVERBOUGHT') {
            // Pullback to 50SMA in uptrend
            signalType = 'CONTINUATION';
            score = 70;
            reason = "Healthy Pullback to 50SMA Support";
        }

        return {
            timestamp: new Date().toISOString(),
            symbol: ticker,
            keltner_state: kState,
            ma_structure: maState,
            confluence_score: score,
            signal: {
                type: signalType,
                confidence: Math.min(score, 100),
                reason
            }
        };
    }
}

export const extensionMAConfluence = new ExtensionMAConfluence();
