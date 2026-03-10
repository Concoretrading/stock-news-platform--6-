
// Master Trader Reference Layer
// Sole purpose: To provide a fused framework from John Carter ("Mastering the Trade").
// This module provides insights into Setups, Market Internals, and Risk Management.

export interface MasterTraderConcept {
    concept: string;
    author: "John Carter";
    definition: string;
    mechanism: string; // The "How"
    market_implication: string; // Impact on trading/investing
    triggers: string[]; // Context keywords that activate this knowledge
}

export const MASTER_TRADER_FRAMEWORK: { [category: string]: MasterTraderConcept[] } = {
    "Setups & Execution (Carter)": [
        {
            concept: "TTM Squeeze",
            author: "John Carter",
            definition: "Volatility contraction (Bollinger Bands inside Keltner Channels) leads to explosive expansion.",
            mechanism: "Wait for the dots to turn red (squeeze), then buy the first green dot (release) or sell the first red dot.",
            market_implication: "If price is chopping in a tight range, do not get bored. Get ready. The bigger the squeeze, the bigger the move.",
            triggers: ["squeeze", "contraction", "expansion", "bollinger", "keltner", "volatility", "chop"]
        },
        {
            concept: "Opening Range Breakout",
            author: "John Carter",
            definition: "The first 30 minutes of the day establish the session's tone.",
            mechanism: "If price breaks above the 30-min high with volume, go long. Below 30-min low, go short.",
            market_implication: "Don't chase the first 5 minutes. Let the 'amateurs' open the market, and the 'pros' (you) trade the range resolution.",
            triggers: ["opening", "range", "breakout", "30-min", "amateur", "open"]
        },
        {
            concept: "Market Internals ($TICK, $TRIN)",
            author: "John Carter",
            definition: "Internals are the engine under the hood. Price can lie, internals tell the truth.",
            mechanism: "$TICK > +600 is bullish, < -600 is bearish. $TRIN < 1.0 is bullish, > 1.0 is bearish.",
            market_implication: "Never go long if $TICK is consistently negative, even if the chart looks 'okay'. Wait for internal confirmation.",
            triggers: ["internals", "tick", "trin", "breadth", "confirmation", "divergence"]
        }
    ]
};

export class MasterTraderReference {
    constructor() {
        console.log('🚀 INITIALIZED: Master Trader Reference Layer (John Carter)');
    }

    /**
     * Retrieves relevant master trader concepts based on context triggers.
     * @param contextKeywords strings describing the current market/macro state
     */
    public getRelevantConcepts(contextKeywords: string[]): MasterTraderConcept[] {
        const results: MasterTraderConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(MASTER_TRADER_FRAMEWORK).forEach(categoryList => {
            categoryList.forEach(concept => {
                const isRelevant = concept.triggers.some(trigger =>
                    contextKeywords.some(ctx => ctx.toLowerCase().includes(trigger.toLowerCase()))
                );

                if (isRelevant && !seen.has(concept.concept)) {
                    results.push(concept);
                    seen.add(concept.concept);
                }
            });
        });

        return results;
    }

    /**
     * Formats a concept into a master trader insight.
     */
    public formatInsight(concept: MasterTraderConcept): string {
        return `🚀 MASTER TRADER INSIGHT [${concept.author}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }
}

export const masterTraderReference = new MasterTraderReference();
