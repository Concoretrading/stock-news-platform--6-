
// News Detective Rubric Knowledge Layer
// Purpose: Codify the 5-step investigative process for real-time news analysis.

export interface DetectiveStep {
    step: number;
    name: string;
    description: string;
    requirements: string[];
}

export const DETECTIVE_RUBRIC: DetectiveStep[] = [
    {
        step: 1,
        name: "Source Quality Check",
        description: "Verify the validity and tier of the incoming signal.",
        requirements: ["Check Tier (X vs Polygon vs Official)", "Identify high-signal handles", "Flag low-tier noise"]
    },
    {
        step: 2,
        name: "Surface Narrative Discovery",
        description: "Extract the obvious story that the herd is chasing.",
        requirements: ["Identify obvious headline bias", "Extract sentiment extremes", "Determine the 'Herd Story' (e.g., 'Weak CPI = Panic')"]
    },
    {
        step: 3,
        name: "Detective Investigation",
        description: "Cross-reference against hard data and inter-market signals.",
        requirements: ["Cross-reference Polygon order flow", "Check Inter-market (DXY, Bonds, VIX)", "Analyze Pivot/Gap reactions"]
    },
    {
        step: 4,
        name: "Big-Money Disbelief Signals",
        description: "Search for divergence between herd action and smart money behavior.",
        requirements: ["Check for absorption at key levels", "Analyze options flow (hedging vs aggression)", "Expose phantom liquidity or lack of follow-through"]
    },
    {
        step: 5,
        name: "Predator Validation",
        description: "Final alignment with system principles.",
        requirements: ["Exploits overcrowding/poor risk?", "No contradiction to contrarian edge?", "Enhances regime detection?"]
    }
];

export interface DetectiveAnalysis {
    detective_summary: string; // Surface vs hidden discrepancy
    system_validation: string; // How it exploits weak algos
    big_money_evidence: string; // Specific counter-signals
    suggested_action: string; // Contrarian fade/position
    risk_assessment: string; // false fade chance, etc.
    approval_required: boolean;
}
