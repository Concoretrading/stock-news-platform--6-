
// Compounding Knowledge Reference Layer
// Fuses the psychology and tape reading of Jesse Livermore with the systematic reflection of Ray Dalio.

export interface CompoundingConcept {
    concept: string;
    author: "Jesse Livermore" | "Ray Dalio";
    definition: string;
    mechanism: string; // The "How it works"
    market_implication: string; // How the algo should react
    triggers: string[]; // Context keywords
}

export const COMPOUNDING_FRAMEWORK: { [category: string]: CompoundingConcept[] } = {
    "Tape Reading & Psychology (Livermore)": [
        {
            concept: "The Line of Least Resistance",
            author: "Jesse Livermore",
            definition: "The market moves in the direction of least resistance; don't fight the tape.",
            mechanism: "Identify if volume is heavy on the offer (distribution) or the bid (accumulation).",
            market_implication: "If price is rising on low volume but dipping on heavy volume, the 'line of least resistance' is down, regardless of the news.",
            triggers: ["tape", "resistance", "volume profile", "accumulation", "distribution"]
        },
        {
            concept: "Pivotal Points",
            author: "Jesse Livermore",
            definition: "Specific price levels where the trend confirms or reverses with conviction.",
            mechanism: "Watch for high-volume breakouts from consolidation that hold the retest.",
            market_implication: "Do not enter mid-range. Enter only when the 'pivotal point' is cleared. If it fails, exit immediately.",
            triggers: ["pivotal", "key level", "breakout", "test", "reversal"]
        },
        {
            concept: "Operator Size Hiding",
            author: "Jesse Livermore",
            definition: "How big money hides its true intention to avoid alerting the herd.",
            mechanism: "Look for 'iceberg' orders or steady small buys that never let the price drop below a specific level.",
            market_implication: "When price holds a level despite negative news, 'Big Size' is likely supporting it. Align with the operator, not the news.",
            triggers: ["iceberg", "dark pool", "hidden size", "manipulation", "support"]
        }
    ],
    "Systematic Evolution (Dalio)": [
        {
            concept: "Pain + Reflection = Progress",
            author: "Ray Dalio",
            definition: "Failure is just an information signal for a broken rule.",
            mechanism: "Log every 'Pain Point' (loss/missed op) and trace it back to a specific algo line or logic gap.",
            market_implication: "The 2-hour study session must start with the 'Pain Log' from the H200 session to refine the ruleset.",
            triggers: ["loss", "failure", "reflection", "improvement", "gap"]
        },
        {
            concept: "Believability-Weighted Decisions",
            author: "Ray Dalio",
            definition: "Not all signals are equal; weight them by their historical accuracy.",
            mechanism: "Assign a 'Believability Score' to each sub-engine (e.g., Grok vs Polygon).",
            market_implication: "If Grok detects a rumor but the Polygon $TICK is negative, the $TICK (higher believability) overrides the rumor.",
            triggers: ["weighting", "confidence", "accuracy", "model performance"]
        },
        {
            concept: "Economic Machine Mechanics",
            author: "Ray Dalio",
            definition: "Markets are driven by debt cycles and liquidity, not just charts.",
            mechanism: "Monitor Central Bank liquidity and credit spreads as the 'Master Context'.",
            market_implication: "If liquidity is tightening (BDD stress), even 'perfect' charts have a higher failure rate. Reduce size.",
            triggers: ["macro", "liquidity", "debt cycle", "interest rates", "credit"]
        }
    ]
};

export class CompoundingKnowledgeReference {
    constructor() {
        console.log('📜 INITIALIZED: Compounding Knowledge Reference (Livermore & Dalio)');
    }

    public getRelevantConcepts(contextKeywords: string[]): CompoundingConcept[] {
        const results: CompoundingConcept[] = [];
        const seen = new Set<string>();

        Object.values(COMPOUNDING_FRAMEWORK).forEach(categoryList => {
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

    public formatInsight(concept: CompoundingConcept): string {
        const prefix = concept.author === "Jesse Livermore" ? "🎩 LIVERMORE" : "📈 DALIO";
        return `${prefix} INSIGHT: ${concept.concept}\n   Mechanism: ${concept.mechanism}\n   Action: ${concept.market_implication}`;
    }
}

export const compoundingKnowledgeReference = new CompoundingKnowledgeReference();
