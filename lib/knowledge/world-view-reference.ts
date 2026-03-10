
// World View & Macro Knowledge Reference Layer
// Sole purpose: To provide a fused framework from Ray Dalio ("Principles for Dealing with the Changing World Order")
// and John Perkins ("Confessions of an Economic Hit Man").
// This module provides macro-historical context, empire cycle awareness, and understanding of systemic manipulation.

export interface WorldViewConcept {
    concept: string;
    author: "Ray Dalio" | "John Perkins";
    definition: string;
    mechanism: string; // The "How"
    market_implication: string; // Impact on trading/investing
    triggers: string[]; // Context keywords that activate this knowledge
}

export const WORLD_VIEW_FRAMEWORK: { [category: string]: WorldViewConcept[] } = {
    "The Big Cycle (Dalio)": [
        {
            concept: "The Big Cycle of Empire",
            author: "Ray Dalio",
            definition: "The predictable rise and decline of empires driven by debt, education, printing money, and internal/external conflict.",
            mechanism: "Rise -> Top (Peak) -> Decline. We are currently in the late-stage cycle (high debt, wealth gap, conflict).",
            market_implication: "Expect higher volatility, currency debasement, and shift from paper assets to hard assets/innovation during decline/transition phases.",
            triggers: ["debt", "inflation", "conflict", "decline", "wealth_gap", "crisis"]
        },
        {
            concept: "Currency Debasement",
            author: "Ray Dalio",
            definition: "Governments print money to service debt, devaluing the currency.",
            mechanism: "Money supply expansion > Productivity growth.",
            market_implication: "Cash is trash. Assets priced in fiat will inflate (nominal gains vs real stagnation). Look for store-of-value assets.",
            triggers: ["quantitative_easing", "stimulus", "printing", "inflation", "currency"]
        }
    ],
    "Systemic Manipulation (Perkins)": [
        {
            concept: "Corporatocracy",
            author: "John Perkins",
            definition: "The partnership of government, banks, and corporations to serve mutual interests at the expense of the public.",
            mechanism: "Economic Hit Men (EHMs) load nations/entities with debt they can't repay to control them.",
            market_implication: "Understand that major policy shifts or 'bailouts' are often designed to protect the Corporatocracy, not the 'free market'. Follow the debt flow.",
            triggers: ["bailout", "policy", "debt_trap", "corruption", "regulation"]
        },
        {
            concept: "Predatory Lending / Debt Traps",
            author: "John Perkins",
            definition: "Intentionally overburdening an entity with huge loans for infrastructure projects that benefit the elite contractors.",
            mechanism: "Enslavement via debt service.",
            market_implication: "In markets, watch for companies or sectors loaded with cheap debt. When rates rise, the 'trap' springs, leading to forced liquidation or acquisition.",
            triggers: ["leverage", "rates", "default", "restructuring", "infrastructure"]
        }
    ],
    "Internal Conflict & Polarization (Dalio)": [
        {
            concept: "Civil Disorder Phase",
            author: "Ray Dalio",
            definition: "When the wealth gap and values gap become too wide, internal conflict (populism) rises.",
            mechanism: "Conflict leads to disorderly wealth redistribution (taxes, strikes, unrest).",
            market_implication: "Market instability increases. Policy becomes unpredictable (swinging between extremes). Risk premiums must rise.",
            triggers: ["unrest", "strike", "election", "populism", "tax", "division"]
        }
    ]
};

export class WorldViewReference {
    constructor() {
        console.log('🌍 INITIALIZED: World View Reference Layer (Dalio/Perkins)');
    }

    /**
     * Retrieves relevant world-view concepts based on context triggers.
     * @param contextKeywords strings describing the current market/macro state
     */
    public getRelevantConcepts(contextKeywords: string[]): WorldViewConcept[] {
        const results: WorldViewConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(WORLD_VIEW_FRAMEWORK).forEach(categoryList => {
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
     * Formats a concept into a macro insight.
     */
    public formatInsight(concept: WorldViewConcept): string {
        return `🌍 MACRO INSIGHT [${concept.author}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }
}

export const worldViewReference = new WorldViewReference();
