
import { BigMoneyFlowInterpreter, InstitutionalFlowAnalysis } from './big-money-flow-interpreter';
import { ExtensionMAConfluence, ExtensionConfluenceAnalysis } from './extension-ma-confluence';

// --- Interfaces ---

export interface IchimokuComponents {
    tenkan: number;      // Conversion Line (9)
    kijun: number;       // Base Line (26)
    senkou_a: number;    // Leading Span A (26 shifted)
    senkou_b: number;    // Leading Span B (52 shifted)
    chikou: number;      // Lagging Span (26 lagged) - Current price plotted back
    cloud_top: number;
    cloud_bottom: number;
    cloud_color: 'GREEN' | 'RED';
    lead_line_1: number; // Future A
    lead_line_2: number; // Future B
}

export interface CloudInteraction {
    status: 'ABOVE' | 'BELOW' | 'INSIDE' | 'APPROACHING' | 'BREAKING';
    proximity_percent: number; // Distance to nearest cloud edge
    cloud_thickness_percent: number; // Thickness relative to price (volatility gauge)
    support_resistance_strength: 'STRONG' | 'MODERATE' | 'WEAK';
    interaction_type: 'BOUNCE_LIKELY' | 'BREAK_LIKELY' | 'CHOP_LIKELY' | 'NEUTRAL';
}

export interface IchimokuCloudAnalysis {
    timestamp: string;
    symbol: string;
    timeframe: string; // e.g., '1D' or '1W'
    components: IchimokuComponents;
    trend_bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    interaction: CloudInteraction;
    handling_rule: string; // "Scale In", "Hedge", "Fade", "Wait"
    confluence_score: number; // 0-100
}

export class IchimokuCloudInterpreter {

    constructor() {
        console.log('☁️ INITIALIZING ICHIMOKU CLOUD INTERPRETER (The Atmosphere)...');
    }

    /**
     * Core Analysis: Logic for High TF Trend + Short Term Interaction
     */
    async analyzeCloud(
        ticker: string,
        closes: number[],
        highs: number[],
        lows: number[],
        volume: number[], // For interaction analysis
        bigMoney?: InstitutionalFlowAnalysis, // Optional Confluence
        extension?: ExtensionConfluenceAnalysis // Optional Confluence
    ): Promise<IchimokuCloudAnalysis> {
        console.log(`☁️ Analyzing Cloud Physics for ${ticker}...`);

        // 1. Calculate Ichimoku Components (Daily settings: 9, 26, 52)
        const components = this.calculateIchimoku(closes, highs, lows);
        const currentPrice = closes[closes.length - 1];

        // 2. Determine Trend Bias
        const bias = this.determineTrendBias(currentPrice, components);

        // 3. Analyze Cloud Interaction (Physics of Approach)
        const interaction = this.analyzeInteraction(currentPrice, components, volume, bigMoney);

        // 4. Generate Handling Rules & Confluence
        return this.generateHandlingStrategy(ticker, components, bias, interaction, bigMoney, extension);
    }

    // --- Calculation Helpers ---

    private calculateIchimoku(closes: number[], highs: number[], lows: number[]): IchimokuComponents {
        // Standard Settings
        const tenkanPeriod = 9;
        const kijunPeriod = 26;
        const senkouBPeriod = 52;
        const displacement = 26;

        const len = closes.length;

        // Helpers for plotting
        const getHighLowAvg = (p: number, idx: number) => {
            if (idx < p - 1) return 0;
            const sliceH = highs.slice(idx - p + 1, idx + 1);
            const sliceL = lows.slice(idx - p + 1, idx + 1);
            return (Math.max(...sliceH) + Math.min(...sliceL)) / 2;
        };

        const currentIdx = len - 1;

        // Current Tenkan / Kijun
        const tenkan = getHighLowAvg(tenkanPeriod, currentIdx);
        const kijun = getHighLowAvg(kijunPeriod, currentIdx);

        // Senkou Span A (Future projected, but we need value at current price, which is from 26 periods ago)
        // Actually, for "Current Support/Resistance", we look at the cloud value plotted TODAY.
        // That value came from (Tenkan+Kijun)/2 from 26 periods ago.
        const prevIdx = currentIdx - displacement;

        let senkou_a = 0;
        let senkou_b = 0;

        if (prevIdx >= 0) {
            const tPrev = getHighLowAvg(tenkanPeriod, prevIdx);
            const kPrev = getHighLowAvg(kijunPeriod, prevIdx);
            senkou_a = (tPrev + kPrev) / 2;

            const sbPrev = getHighLowAvg(senkouBPeriod, prevIdx);
            senkou_b = sbPrev;
        } else {
            // Fallback if not enough data, use current approximation
            const t = getHighLowAvg(tenkanPeriod, currentIdx);
            const k = getHighLowAvg(kijunPeriod, currentIdx);
            senkou_a = (t + k) / 2;
            senkou_b = getHighLowAvg(senkouBPeriod, currentIdx);
        }

        // Chikou is current price shifted BACK. 
        // We evaluate Chikou by comparing Current Price to Price 26 bars ago.
        // But the interface asks for the value.
        const chikou = closes[currentIdx]; // Its position is -26.

        const cloud_top = Math.max(senkou_a, senkou_b);
        const cloud_bottom = Math.min(senkou_a, senkou_b);
        const cloud_color = senkou_a >= senkou_b ? 'GREEN' : 'RED';

        return {
            tenkan,
            kijun,
            senkou_a,
            senkou_b,
            chikou,
            cloud_top,
            cloud_bottom,
            cloud_color,
            lead_line_1: senkou_a, // Simplified for this snippet
            lead_line_2: senkou_b
        };
    }

    // --- Analysis Logic ---

    private determineTrendBias(price: number, c: IchimokuComponents): IchimokuCloudAnalysis['trend_bias'] {
        if (price > c.cloud_top) return 'BULLISH';
        if (price < c.cloud_bottom) return 'BEARISH';
        return 'NEUTRAL'; // Inside Cloud
    }

    private analyzeInteraction(
        price: number,
        c: IchimokuComponents,
        volume: number[],
        bigMoney?: InstitutionalFlowAnalysis
    ): CloudInteraction {
        // 1. Cloud Thickness (Strength)
        const thickness = Math.abs(c.cloud_top - c.cloud_bottom);
        const thicknessPct = (thickness / price) * 100;

        let strength: CloudInteraction['support_resistance_strength'] = 'MODERATE';
        if (thicknessPct > 2.0) strength = 'STRONG'; // Massive cloud = Heavy resistance/support
        if (thicknessPct < 0.5) strength = 'WEAK';   // Thin cloud = Easy to punch through

        // 2. Proximity & Status
        let status: CloudInteraction['status'] = 'INSIDE';
        let dist = 0;

        if (price > c.cloud_top) {
            status = 'ABOVE';
            dist = (price - c.cloud_top) / c.cloud_top;
        } else if (price < c.cloud_bottom) {
            status = 'BELOW';
            dist = (c.cloud_bottom - price) / c.cloud_bottom;
        } else {
            status = 'INSIDE';
        }

        // 3. Interaction Prediction utilizing Volume/Flow
        let sentiment = 'NEUTRAL';
        if (Math.abs(dist) < 0.01 && status !== 'INSIDE') status = 'APPROACHING';

        // Check recent volume trend (last 3 bars vs avg loop - simplified here)
        const lastVol = volume[volume.length - 1];
        const avgVol = volume.slice(-20).reduce((a, b) => a + b, 0) / 20;
        const volSpike = lastVol > (avgVol * 1.5);

        let type: CloudInteraction['interaction_type'] = 'CHOP_LIKELY';

        // Logic: 
        // - Strong Cloud + Low Vol = Bounce/Reject Likely
        // - Weak Cloud + High Vol + Big Money Gap = Break Likely

        const isBigMoneyPushing = bigMoney && bigMoney.institutional_intent.confidence > 70;

        if (status === 'APPROACHING' || Math.abs(dist) < 0.005) {
            if (strength === 'STRONG' && !volSpike) {
                type = 'BOUNCE_LIKELY'; // Wall is too thick, no hammer
            } else if (strength === 'WEAK' && (volSpike || isBigMoneyPushing)) {
                type = 'BREAK_LIKELY'; // Thin wall + Sledgehammer
            } else {
                type = 'NEUTRAL';
            }
        }

        return {
            status,
            proximity_percent: dist * 100,
            cloud_thickness_percent: thicknessPct,
            support_resistance_strength: strength,
            interaction_type: type
        };
    }

    private generateHandlingStrategy(
        ticker: string,
        c: IchimokuComponents,
        bias: IchimokuCloudAnalysis['trend_bias'],
        interaction: CloudInteraction,
        bigMoney?: InstitutionalFlowAnalysis,
        extension?: ExtensionConfluenceAnalysis
    ): IchimokuCloudAnalysis {

        // Strategy Synthesis
        let strategy = "Monitor Trend";
        let score = 50;

        // SCENARIO 1: Bullish Continuation (Bounce off Cloud Top)
        if (bias === 'BULLISH' && interaction.status === 'ABOVE' && interaction.proximity_percent < 1.0) {
            // We are just above cloud (support)
            if (interaction.interaction_type === 'BOUNCE_LIKELY') {
                strategy = "SCALE IN LONG (Cloud Support)";
                score += 20;
                if (bigMoney?.institutional_intent.action === 'ACCUMULATION') score += 15;
            }
        }

        // SCENARIO 2: Kumo Breakout (Bullish)
        if (interaction.status === 'APPROACHING' && c.cloud_color === 'GREEN' && interaction.interaction_type === 'BREAK_LIKELY') {
            strategy = "BREAKOUT WATCH - Add on Close Above";
            score += 15;
        }

        // SCENARIO 3: Inside Cloud (Turbulence)
        if (interaction.status === 'INSIDE') {
            strategy = "REDUCE SIZE / HEDGE (Inside Cloud Chop)";
            score = 40; // Neutral/Avoid
            if (c.cloud_color === 'RED') score -= 10;
        }

        // SCENARIO 4: Confluence with Extension (The User's specific request)
        // "Overextended + approaching cloud = high reversion prob"
        if (extension?.keltner_state.status === 'OVERBOUGHT' && interaction.status === 'ABOVE') {
            // If we are way above cloud, cloud is magnet?
            // Actually, usually "Approaching Cloud" implies pullback.
            // If Price is Dropping INTO Cloud Top from Above:
            strategy = "WATCH FOR BOUNCE (Cloud Support)";
            if (extension.ma_structure.structural_support.interaction === 'BOUNCE_50') {
                strategy = "STRONG CONFLUENCE (Cloud + 50SMA Bounce)";
                score = 85;
            }
        }

        // SCENARIO 5: Contrarian Fade (Cloud Rejection)
        // Price below red cloud, rallies into it, hits massive resistance
        if (bias === 'BEARISH' && interaction.status === 'BELOW' && interaction.proximity_percent < 1.0) {
            if (interaction.support_resistance_strength === 'STRONG') {
                strategy = "FADE RALLY (Thick Cloud Resistance)";
                score = 80; // High conviction short
            }
        }

        return {
            timestamp: new Date().toISOString(),
            symbol: ticker,
            timeframe: '1D', // Default to Daily per instructions
            components: c,
            trend_bias: bias,
            interaction,
            handling_rule: strategy,
            confluence_score: Math.min(score, 100)
        };
    }
}

export const ichimokuCloudInterpreter = new IchimokuCloudInterpreter();
