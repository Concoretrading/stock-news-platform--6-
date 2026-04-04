
// Anti-Algo Predation Reference
// Purpose: Codify "Meta-Game" patterns where sophisticated algos exploit simple mechanical systems.

export interface AntiAlgoPattern {
    name: string;
    description: string;
    weakAlgoAction: string; // What the "prey" does
    predatorExploit: string; // How the "predatory algo" exploits it
    indicators: string[];
}

export const ANTI_ALGO_PATTERNS: AntiAlgoPattern[] = [
    {
        name: "Mechanical Stop-Run",
        description: "Retail algos place stops at obvious technical levels (Double Bottoms, Daily Lows).",
        weakAlgoAction: "Clustering stops 2-5 ticks below an obvious support level.",
        predatorExploit: "Driving price just deep enough to trigger the stop cluster, creating a liquidity 'vacuum' to fill large buy orders.",
        indicators: ["Double bottom with high volume", "Stop cluster heatmaps", "V-reversal after level breach"]
    },
    {
        name: "Standard Indicator Baiting",
        description: "Sophisticated algos manipulate price to trigger a mechanical signal (e.g., RSI Oversold or MA Crossover).",
        weakAlgoAction: "Buying a 'Golden Cross' or selling 'RSI Overbought' blindly.",
        predatorExploit: "Creating the 'Golden Cross' signal with artificial volume, then Dumping/Selling into the retail buy-in flow.",
        indicators: ["Wash-trade volume spikes", "Immediate reversal after MA crossing", "Divergence at signal peaks"]
    },
    {
        name: "The Liquidity Squeeze (Short/Long)",
        description: "Identifying a crowd of weak algos trapped on one side of a tight range.",
        weakAlgoAction: "Stacking orders in a tight consolidation with tight stops.",
        predatorExploit: "Aggressive market-buying to force the first layer of stops, which triggers a chain reaction of liquidations.",
        indicators: ["Tight Bollinger Bands", "Negative/Positive funding rates (crypto)", "High OI with flat price"]
    },
    {
        name: "Mean-Reversion Exhaustion",
        description: "Weak algos that 'fade' any extreme move against the trend.",
        weakAlgoAction: "Shorting a 'Parabolic Move' without looking at the underlying catalyst gravity.",
        predatorExploit: "Extending the move further to force the 'faders' to cover, adding fuel to the trend.",
        indicators: ["Parabolic curve", "Volume climaxes that don't reverse", "Big money disbelief signals"]
    }
];

export class AntiAlgoReference {
    constructor() {
        console.log('🤖 INITIALIZED: Anti-Algo Predation Intelligence (Meta-Game Layer)');
    }

    public getPatterns() {
        return ANTI_ALGO_PATTERNS;
    }

    /**
     * Identifies if a news signal or price action context matches a "Weak Algo" trap.
     */
    public detectAlgoPredation(context: string): { detected: boolean; patterns: string[]; threatLevel: 'low' | 'med' | 'high' } {
        const lowerContext = context.toLowerCase();
        const detected = ANTI_ALGO_PATTERNS.filter(p =>
            p.indicators.some(ind => lowerContext.includes(ind.toLowerCase()))
        );

        return {
            detected: detected.length > 0,
            patterns: detected.map(p => p.name),
            threatLevel: detected.length > 2 ? 'high' : (detected.length > 0 ? 'med' : 'low')
        };
    }
}

export const antiAlgoReference = new AntiAlgoReference();
