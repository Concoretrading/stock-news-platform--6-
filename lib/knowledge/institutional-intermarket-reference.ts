
// Institutional & Intermarket Knowledge Reference Layer
// Sole purpose: To provide a fused framework from Sebastian Mallaby ("More Money Than God")
// and John J. Murphy ("Trading with Intermarket Analysis").
// This module provides insights into hedge fund alpha generation and cross-asset correlations.

export interface InstitutionalConcept {
    concept: string;
    author: "Sebastian Mallaby" | "John J. Murphy";
    definition: string;
    mechanism: string; // The "How"
    market_implication: string; // Impact on trading/investing
    triggers: string[]; // Context keywords that activate this knowledge
}

export const INSTITUTIONAL_FRAMEWORK: { [category: string]: InstitutionalConcept[] } = {
    "Hedge Fund Alpha (Mallaby)": [
        {
            concept: "Asymmetric Bets",
            author: "Sebastian Mallaby",
            definition: "The holy grail of hedge funds: finding trades with limited downside and uncapped upside (like Soros defying the BoE).",
            mechanism: "Wait for extreme dislocations where the market sentiment is 100% on one side, but the fundamental reality is changing.",
            market_implication: "Seek 'convexity'. Don't just look for probability, look for payoff ratio. Risk $1 to make $5+.",
            triggers: ["asymemtry", "risk_reward", "dislocation", "contrarian", "soros"]
        },
        {
            concept: "Arbitraging Anomalies",
            author: "Sebastian Mallaby",
            definition: "Markets are not efficient. Math-based funds (Renaissance) exploit tiny, temporary mispricings.",
            mechanism: "High-frequency mean reversion or statistical arbitrage.",
            market_implication: "In short timeframes, look for statistical extremes (2-3 Std Dev moves) to revert, provided no structural news driver exists.",
            triggers: ["anomaly", "mean_reversion", "arbitrage", "quant", "efficiency"]
        }
    ],
    "Intermarket Analysis (Murphy)": [
        {
            concept: "Currency/Commodity Inverse",
            author: "John J. Murphy",
            definition: "The US Dollar has a strong inverse relationship with Commodities (Gold, Oil).",
            mechanism: "Dollar Up -> Commodities Down. Dollar Down -> Commodities Up (Inflation trades).",
            market_implication: "Never trade Oil or Gold without checking the DXY (Dollar Index). They are inextricably linked.",
            triggers: ["dollar", "dxy", "gold", "oil", "commodities", "inflation"]
        },
        {
            concept: "Bond/Stock Correlation",
            author: "John J. Murphy",
            definition: "Bond yields and stock prices generally move together (economic growth), until inflation becomes the primary driver.",
            mechanism: "Deflationary scare: Bonds Up (Yields Down), Stocks Down. Inflationary scare: Bonds Down (Yields Up), Stocks Down.",
            market_implication: "Watch the 10-Year Treasury Yield (TNX). Spikes in yields often trigger tech sector sell-offs.",
            triggers: ["bonds", "yields", "rates", "tnx", "10-year", "interest"]
        },
        {
            concept: "Sector Rotation",
            author: "John J. Murphy",
            definition: "Money flows move from defensive (Staples, Utilities) to cyclical (Tech, Discretionary) based on the business cycle.",
            mechanism: "Early Bull: Tech/Financials lead. Late Bull: Energy/Materials lead. Recession: Staples/Healthcare lead.",
            market_implication: "Identify the leading sector to understand the 'true' economic phase. Don't fight the rotation flow.",
            triggers: ["rotation", "sector", "cyclical", "defensive", "flow", "leadership"]
        }
    ]
};

export class InstitutionalReference {
    constructor() {
        console.log('🏦 INITIALIZED: Institutional & Intermarket Reference Layer (Mallaby/Murphy)');
    }

    /**
     * Retrieves relevant institutional concepts based on context triggers.
     * @param contextKeywords strings describing the current market/macro state
     */
    public getRelevantConcepts(contextKeywords: string[]): InstitutionalConcept[] {
        const results: InstitutionalConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(INSTITUTIONAL_FRAMEWORK).forEach(categoryList => {
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
     * Formats a concept into a smart money insight.
     */
    public formatInsight(concept: InstitutionalConcept): string {
        return `🏦 INSTITUTIONAL INSIGHT [${concept.author}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }
}

export const institutionalReference = new InstitutionalReference();
