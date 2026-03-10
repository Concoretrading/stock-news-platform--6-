
// Price Action Knowledge Reference Layer
// Purpose: Codify Gap Fills, Pivot Points, and Level Battles
// This module provides the "Mechanical Execution" layer for technical levels.

export interface PriceActionConcept {
    concept: string;
    type: "Gap" | "Pivot" | "Level";
    definition: string;
    mechanism: string; // The "How"
    predator_edge: string; // How the framework exploits this
    triggers: string[]; // Context keywords that activate this knowledge
}

export const PRICE_ACTION_FRAMEWORK: { [category: string]: PriceActionConcept[] } = {
    "Gap Mechanics": [
        {
            concept: "Standard Gap Fill",
            type: "Gap",
            definition: "Price opens outside the previous day's range and returns to the previous close.",
            mechanism: "Gaps are often created by overnight emotional orders. If the gap doesn't continue within the first 30 mins, it likely 'fills' to the prior close.",
            predator_edge: "Fade the 'emotional amateurs' who chased the open. Target the prior day's close for a high-probability mean-reversion move.",
            triggers: ["gap", "fill", "overnight", "unfilled", "window"]
        },
        {
            concept: "Runaway Gap (Trend Acceleration)",
            type: "Gap",
            definition: "A gap that occurs in the middle of a trend and does NOT fill.",
            mechanism: "Indicates overwhelming institutional demand/supply. Price maintains the gap and continues the prior trend.",
            predator_edge: "Do NOT fade these. These are institutional footprints. Look for a small consolidation just above the gap for a 'go-with' entry.",
            triggers: ["runaway gap", "acceleration", "breakaway gap", "trend gap"]
        }
    ],
    "Pivot Point Intel": [
        {
            concept: "Standard Floor Pivots",
            type: "Pivot",
            definition: "Calculated levels based on the previous day's high, low, and close (P, S1, S2, R1, R2).",
            mechanism: "Mass algorithms and retail traders use these as default 'hidden' support and resistance.",
            predator_edge: "Use these as 'Magnets'. Price often rotates between pivots. The true edge is watching how price reacts AT the pivot (look for false breaks to trap pivots-chasers).",
            triggers: ["pivot", "floor pivot", "r1", "s1", "central pivot", "pp"]
        },
        {
            concept: "Pivot Confluence",
            type: "Pivot",
            definition: "When a Pivot Point aligns with a Gap Fill level or major Moving Average.",
            mechanism: "The probability of a reaction increases exponentially when multiple independent groups of traders all see the same price level.",
            predator_edge: "This is a 'Hard Floor' or 'Hard Ceiling'. These are the highest-confidence entries for asymmteric bets.",
            triggers: ["confluence", "level cluster", "stacked levels"]
        }
    ]
};

export class PriceActionReference {
    constructor() {
        console.log('🕯️ INITIALIZED: Price Action Reference Layer (Gaps & Pivots)');
    }

    public getRelevantConcepts(contextKeywords: string[]): PriceActionConcept[] {
        const results: PriceActionConcept[] = [];
        const seen = new Set<string>();

        Object.values(PRICE_ACTION_FRAMEWORK).forEach(categoryList => {
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

    public formatInsight(concept: PriceActionConcept): string {
        return `🕯️ PRICE ACTION INSIGHT: ${concept.concept}\n   "${concept.mechanism}" -> Predator Edge: ${concept.predator_edge}`;
    }
}

export const priceActionReference = new PriceActionReference();
