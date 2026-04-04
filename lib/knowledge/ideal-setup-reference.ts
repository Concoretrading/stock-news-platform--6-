
// Ideal Predator Setup Reference
// Purpose: Codify the "Gold Standard" for a high-probability trade.

export interface SetupCriteria {
    component: string;
    description: string;
    indicators: string[]; // Keywords or data visual signals
    importance: number; // 1-10
}

export const IDEAL_SETUP_GUIDELINES: { [category: string]: SetupCriteria[] } = {
    "Energy & Momentum": [
        {
            component: "Energy Build-up",
            description: "Wait for momentum to compress or build before the explosive move.",
            indicators: ["compression", "tight range", "decreasing volume before spike", "coiled"],
            importance: 10
        }
    ],
    "Contextual Battle Zones": [
        {
            component: "Key Business Areas",
            description: "Entry must occur at a level where a verified 'Battle' is taking place.",
            indicators: ["POC", "21 MA", "Cloud Top", "S1", "R1", "Pivot Cluster"],
            importance: 9
        },
        {
            component: "Level 2 & Premium Flow",
            description: "Tape and Order Flow at the key area must confirm big money intent.",
            indicators: ["Level 2 depth", "Premium flow", "Order book absorption", "Iceberg detection"],
            importance: 9
        }
    ],
    "Safety Nets & Risk Control": [
        {
            component: "Structural Support/Resistance",
            description: "Ideally have a key support level immediately underneath for upside entries.",
            indicators: ["MA under price", "POC under price", "Cloud support", "Historical floor"],
            importance: 8
        },
        {
            component: "Exit Discipline",
            description: "If the structural safety net breaks, cut immediately and look for re-entry.",
            indicators: ["Violation of support", "Regime shift", "VIX spike"],
            importance: 10
        }
    ],
    "Catalyst Chain": [
        {
            component: "The Double Catalyst",
            description: "Requires a released catalyst to start the move and an upcoming one to sustain energy.",
            indicators: ["released news", "upcoming earnings", "upcoming FOMC", "rumor follow-up"],
            importance: 9
        }
    ]
};

export class IdealSetupReference {
    constructor() {
        console.log('🏆 INITIALIZED: Ideal Predator Setup Reference Layer');
    }

    public getCriteria() {
        return IDEAL_SETUP_GUIDELINES;
    }

    /**
     * Scores a suggestion based on how closely it matches the "Ideal Setup".
     */
    public calculateSetupScore(logic: string, context: string): number {
        let score = 0;
        const lowerLogic = logic.toLowerCase() + " " + context.toLowerCase();

        Object.values(IDEAL_SETUP_GUIDELINES).flat().forEach(criteria => {
            if (criteria.indicators.some(ind => lowerLogic.includes(ind.toLowerCase()))) {
                score += (criteria.importance * 2); // Simple weighting
            }
        });

        return Math.min(100, score);
    }
}

export const idealSetupReference = new IdealSetupReference();
