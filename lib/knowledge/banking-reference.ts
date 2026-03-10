
// Banking & Macro Liquidity Knowledge Reference Layer
// Source: Diamond & Dybvig (1983), Bernanke (1983)
// Purpose: Provide a framework for detecting liquidity/credit stress regimes

export interface BankingConcept {
    concept: string;
    author: "Diamond & Dybvig" | "Ben Bernanke";
    definition: string;
    mechanism: string; // The "How"
    market_implication: string; // Impact on trading/investing
    triggers: string[]; // Context keywords that activate this knowledge
}

export const BANKING_FRAMEWORK: { [category: string]: BankingConcept[] } = {
    "Fragility & Liquidity (Diamond-Dybvig)": [
        {
            concept: "Liquidity Transformation Mismatch",
            author: "Diamond & Dybvig",
            definition: "Banks fund long-term illiquid assets (loans) with short-term liquid deposits.",
            mechanism: "Creates a valuable service but inherently fragile equilibrium. If a threshold of depositors fear a run, the run becomes self-fulfilling.",
            market_implication: "In stress regimes, liquidity can vanish instantly. Watch for maturity mismatches in shadow banking/repos.",
            triggers: ["liquidity", "mismatch", "bank run", "panic", "withdrawal", "illiquid"]
        },
        {
            concept: "Self-Fulfilling Panics",
            author: "Diamond & Dybvig",
            definition: "Fear of others withdrawing creates a mass withdrawal that forces fire sales.",
            mechanism: "Healthy banks become insolvent because they are forced to sell assets at deep discounts to meet immediate cash demands.",
            market_implication: "Volatility spikes often feed on themselves. Detect 'fire sale' behavior in specific sectors to find fade entries.",
            triggers: ["fire sale", "panic", "contagion", "insolvent", "equilibrium"]
        }
    ],
    "Credit Information & Crisis (Bernanke)": [
        {
            concept: "Nonmonetary Credit Effects",
            author: "Ben Bernanke",
            definition: "Bank failures destroy specialized information about borrowers (relationship lending).",
            mechanism: "Information loss -> credit crunch -> businesses can't get loans -> deeper/prolonged recession.",
            market_implication: "If banking stress persists, the equity recovery will be delayed. Avoid early 'dip buying' if the credit information layer is shattered.",
            triggers: ["credit crunch", "lending", "banking failure", "recession", "credit spread"]
        },
        {
            concept: "Financial Accelerator",
            author: "Ben Bernanke",
            definition: "Deteriorating balance sheets make it harder to borrow, amplifying economic shocks.",
            mechanism: "Asset prices fall -> collateral value drops -> less lending -> lower spending -> prices fall more.",
            market_implication: "Feedback loops are the Predator's best friend. Detect the start of an accelerator loop to stay on the right side of a crash.",
            triggers: ["accelerator", "collateral", "balance sheet", "leverage", "deleveraging"]
        }
    ]
};

export class BankingReference {
    constructor() {
        console.log('🏦 INITIALIZED: Banking & Macro Reference Layer (BDD/Bernanke)');
    }

    public getRelevantConcepts(contextKeywords: string[]): BankingConcept[] {
        const results: BankingConcept[] = [];
        const seen = new Set<string>();

        Object.values(BANKING_FRAMEWORK).forEach(categoryList => {
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

    public formatInsight(concept: BankingConcept): string {
        return `🏦 BANKING INSIGHT [${concept.author}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }

    /**
     * ✅ Predator Edge Trading Applications (Nobel Insights)
     */
    public getPredatorInsights() {
        return {
            "Run-Like Stress Detection": "Detect stress in banking equilibrium before mass algorithms react. Forced exits by over-leveraged herds create fade opportunities.",
            "Risk Recalibration": "In high-stress regimes: reduce position size, widen stops, and shift to cash-heavy posture to avoid systemic drawdown.",
            "Crowding Fade": "Fade momentum chasers when BDD stress signals flash. Their forced liquidation becomes your entry liquidity."
        };
    }
}

export const bankingReference = new BankingReference();
