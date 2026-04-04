
/**
 * Premium Mastery Engine (The Proxy)
 * Ports sophisticated Python logic for reading premium dynamics.
 * Logic: "Volatility is the heartbeat of premium."
 */

export interface PremiumPattern {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    pattern: 'EXPANSION_TAKEOFF' | 'DECAY_BREAKDOWN' | 'NEUTRAL_EXPANSION' | 'NEUTRAL_DECAY';
    confluence: number; // 0-1
    confidence: number; // 0-1
    atr: number;
    strike_pinned: boolean;
}

export interface PremiumFeatures {
    vol_change: number;
    asymmetry: number;
    strike_dist_ratio: number;
    atr_trend: number;
}

export class PremiumMasteryEngine {
    private static instance: PremiumMasteryEngine;

    // Configuration parameters (mirrored from Python script)
    private readonly ATR_PERIOD = 14;
    private readonly SHORT_ATR_PERIOD = 5;
    private readonly CONSOLIDATION_THRESHOLD = 1.5;
    private readonly PREMIUM_EXP_THRESHOLD = 0.05;

    private constructor() {
        console.log('💎 PREMIUM MASTERY ENGINE ONLINE');
    }

    public static getInstance(): PremiumMasteryEngine {
        if (!PremiumMasteryEngine.instance) {
            PremiumMasteryEngine.instance = new PremiumMasteryEngine();
        }
        return PremiumMasteryEngine.instance;
    }

    /**
     * CORE: Calculate Premium Patterns from Price/Vol Proxies
     */
    public analyzePremium(bars: any[]): PremiumPattern & { features: PremiumFeatures } {
        if (bars.length < this.ATR_PERIOD + 10) {
            return { ...this.createDefaultPattern(), features: this.extractFeatures(bars) };
        }

        const features = this.extractFeatures(bars);

        // 1. Premium Patterns (Logic Port)
        const expDecay = features.vol_change;
        const asymmetry = features.asymmetry;

        // 2. Multi-Expiry Confluence Proxy (Short vs Long Term)
        // In our 1s/1m engine, we compare last 5 bars vs last 30 bars
        const shortExpansion = this.calculateVolChange(bars.slice(-5));
        const longExpansion = this.calculateVolChange(bars.slice(-30));
        const confluence = 1 - Math.min(1, Math.abs(shortExpansion - longExpansion) / (Math.max(Math.abs(shortExpansion), Math.abs(longExpansion), 1e-5)));

        // 3. Strike Simulation
        const strikePinned = features.strike_dist_ratio < 1.0;

        // 4. Pattern Determination
        let pattern: PremiumPattern['pattern'] = 'NEUTRAL_DECAY';
        let bias: PremiumPattern['bias'] = 'NEUTRAL';

        if (expDecay > this.PREMIUM_EXP_THRESHOLD) {
            pattern = 'EXPANSION_TAKEOFF';
        } else if (expDecay < -this.PREMIUM_EXP_THRESHOLD) {
            pattern = 'DECAY_BREAKDOWN';
        } else {
            pattern = expDecay < 0 ? 'NEUTRAL_DECAY' : 'NEUTRAL_EXPANSION';
        }

        if (asymmetry > 0.2) bias = 'BULLISH';
        if (asymmetry < -0.2) bias = 'BEARISH';

        // 5. ATR Tie-in & Confidence
        const atrValue = this.calculateATR(bars, this.ATR_PERIOD);
        const confidence = Math.min(1.0, confluence + (features.atr_trend < 0 ? 0.2 : 0));

        return {
            bias,
            pattern,
            confluence: parseFloat(confluence.toFixed(4)),
            confidence: parseFloat(confidence.toFixed(4)),
            atr: atrValue,
            strike_pinned: strikePinned,
            features
        };
    }

    private extractFeatures(bars: any[]): PremiumFeatures {
        const returns = this.calculateReturns(bars);
        const vol = this.calculateStdDev(returns.slice(-5));
        const prevVol = this.calculateStdDev(returns.slice(-20, -5));

        const volChange = prevVol !== 0 ? (vol - prevVol) / prevVol : 0;

        // Asymmetry: Positive returns vol vs Negative returns vol
        const upReturns = returns.slice(-10).filter(r => r > 0);
        const downReturns = returns.slice(-10).filter(r => r < 0);
        const upVol = this.calculateStdDev(upReturns);
        const downVol = this.calculateStdDev(downReturns.map(r => Math.abs(r)));
        const asymmetry = (upVol - downVol) / (vol || 1e-5);

        // ATR and Strike Dist
        const currentPrice = bars[bars.length - 1].c;
        const atr = this.calculateATR(bars, this.ATR_PERIOD);
        const shortAtr = this.calculateATR(bars, this.SHORT_ATR_PERIOD);

        const simStrike = Math.round(currentPrice / 5) * 5;
        const strikeDistRatio = Math.abs(currentPrice - simStrike) / (shortAtr || 1e-5);

        const prevAtr = this.calculateATR(bars.slice(0, -1), this.ATR_PERIOD);
        const atrTrend = prevAtr !== 0 ? (atr - prevAtr) / prevAtr : 0;

        return {
            vol_change: volChange,
            asymmetry,
            strike_dist_ratio: strikeDistRatio,
            atr_trend: atrTrend
        };
    }

    private calculateVolChange(bars: any[]): number {
        const returns = this.calculateReturns(bars);
        if (returns.length < 5) return 0;
        const vol = this.calculateStdDev(returns.slice(-5));
        const prevVol = this.calculateStdDev(returns.slice(-10, -5));
        return prevVol !== 0 ? (vol - prevVol) / prevVol : 0;
    }

    private calculateReturns(bars: any[]): number[] {
        const returns = [];
        for (let i = 1; i < bars.length; i++) {
            returns.push((bars[i].c - bars[i - 1].c) / bars[i - 1].c);
        }
        return returns;
    }

    private calculateStdDev(values: number[]): number {
        if (values.length < 2) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
        return Math.sqrt(variance);
    }

    private calculateATR(bars: any[], period: number): number {
        if (bars.length < period) return 0;
        let totalTR = 0;
        const slice = bars.slice(-period - 1);
        for (let i = 1; i < slice.length; i++) {
            const h = slice[i].h;
            const l = slice[i].l;
            const prevC = slice[i - 1].c;
            const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
            totalTR += tr;
        }
        return totalTR / period;
    }

    private createDefaultPattern(): PremiumPattern {
        return {
            bias: 'NEUTRAL',
            pattern: 'NEUTRAL_DECAY',
            confluence: 0.5,
            confidence: 0.5,
            atr: 0,
            strike_pinned: false
        };
    }
}

export const premiumMasteryEngine = PremiumMasteryEngine.getInstance();
