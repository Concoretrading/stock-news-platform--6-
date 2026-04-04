
// Investor Knowledge Reference Layer
// Sole purpose: To provide a fused framework from Benjamin Graham ("The Intelligent Investor").
// This module provides insights into Fundamental Value and Investor Psychology.

export interface InvestorConcept {
    concept: string;
    author: "Benjamin Graham";
    definition: string;
    mechanism: string; // The "How"
    market_implication: string; // Impact on trading/investing
    triggers: string[]; // Context keywords that activate this knowledge
}

export const INVESTOR_FRAMEWORK: { [category: string]: InvestorConcept[] } = {
    "Fundamental Value (Graham)": [
        {
            concept: "Margin of Safety",
            author: "Benjamin Graham",
            definition: "The secret of sound investment: Buying an asset at a significant discount to its intrinsic value.",
            mechanism: "If Intrinsic Value is $100, buy at $60. The $40 gap protects against error and market downturns.",
            market_implication: "When a stock is battered (oversold) but fundamentals remain strong, Smart Money investors step in. Look for 'Value Support'.",
            triggers: ["value", "discount", "safety", "intrinsic", "cheap", "oversold", "fundamental"]
        },
        {
            concept: "Mr. Market",
            author: "Benjamin Graham",
            definition: "The market is a manic-depressive partner who offers prices every day. You don't have to accept them.",
            mechanism: "Use his manic moods (euphoria) to sell, and his depressive moods (panic) to buy.",
            market_implication: "Fade extreme emotional moves. If the chart shows panic selling into major support, expect investors to 'buy the fear'.",
            triggers: ["volatility", "panic", "euphoria", "manic", "mood", "emotional", "irrational"]
        },
        {
            concept: "Defensive vs. Enterprising",
            author: "Benjamin Graham",
            definition: "Know your type. Defensive investors seek safety (Index/Bonds). Enterprising investors seek alpha through work.",
            mechanism: "Active traders must be 'Enterprising' - willing to put in the work to find mispricings.",
            market_implication: "If you are swinging active setups, you are Enterprising. Ensure your 'work' (analysis) justifies the risk.",
            triggers: ["defensive", "active", "passive", "alpha", "effort", "work"]
        }
    ]
};

export class InvestorReference {
    constructor() {
        console.log('🏛️ INITIALIZED: Investor Reference Layer (Benjamin Graham)');
    }

    /**
     * Retrieves relevant investor concepts based on context triggers.
     * @param contextKeywords strings describing the current market/macro state
     */
    public getRelevantConcepts(contextKeywords: string[]): InvestorConcept[] {
        const results: InvestorConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(INVESTOR_FRAMEWORK).forEach(categoryList => {
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
     * Formats a concept into an investor insight.
     */
    public formatInsight(concept: InvestorConcept): string {
        return `🏛️ INVESTOR INSIGHT [${concept.author}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }
}

export const investorReference = new InvestorReference();
