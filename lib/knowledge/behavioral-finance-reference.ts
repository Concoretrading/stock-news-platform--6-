
// Behavioral Finance Knowledge Reference Layer
// Sole purpose: To provide a fused framework from Kahneman, Thaler, and Shiller.
// This module provides conceptual knowledge, definitions, mechanisms, and original reasoning
// to the primary system whenever it evaluates market data.

export interface BehavioralConcept {
    concept: string;
    authors: string[]; // e.g., ["Kahneman", "Thaler"]
    definition: string;
    mechanism: string; // How it works
    market_implication: string; // Shiller/Thaler application to markets
    triggers: string[]; // Context keywords that activate this knowledge
}

export const BEHAVIORAL_FRAMEWORK: { [category: string]: BehavioralConcept[] } = {
    "Core Framework": [
        {
            concept: "Econs vs. Humans",
            authors: ["Thaler", "Shiller"],
            definition: "Traditional economics assumes rational 'Econs' (optimizing, self-interested, stable). Real 'Humans' deviate predictably due to psych limits—irrational, error-prone, context/emotion-driven.",
            mechanism: "Humans have bounded rationality vs. Econs' infinite cognitive resources.",
            market_implication: "Aggregated Human misbehavior creates market-wide inefficiencies/bubbles, challenging efficient market hypothesis (prices don't always reflect fundamentals).",
            triggers: ["inefficiency", "irrational", "mispricing", "bubble"]
        },
        {
            concept: "System 1 vs. System 2",
            authors: ["Kahneman", "Thaler", "Shiller"],
            definition: "System 1: Fast, automatic, intuitive, emotional (heuristics). System 2: Slow, deliberate, analytical (logic). System 2 is lazy and often defers to System 1.",
            mechanism: "System 1 generates quick impressions via heuristics but introduces biases. System 2 corrects but under-engages.",
            market_implication: "System 1 dominates exuberance (herd enthusiasm) and panic. System 2 under-engages in complex forecasts, leading to over-reliance on simple narratives.",
            triggers: ["impulse", "panic", "euphoria", "fast_move", "automatic"]
        },
        {
            concept: "Irrational Exuberance",
            authors: ["Shiller"],
            definition: "Over-enthusiasm/optimism inflating asset prices beyond fundamentals, driven by psych/social factors.",
            mechanism: "Not random—predictable via cycles of speculation. Self-sustaining feedback loops of rising prices attracting more buyers.",
            market_implication: "Leads to bubbles and subsequent crashes. Persistent volatility exists post-crises due to these human factors.",
            triggers: ["bubble", "parabolic", "speculation", "hype", "valuation_disconnect"]
        }
    ],
    "Heuristics & Biases": [
        {
            concept: "Availability Heuristic",
            authors: ["Kahneman", "Thaler", "Shiller"],
            definition: "Probability judged by ease with which instances come to mind.",
            mechanism: "Recent, vivid, emotionally charged events dominate perception of risk/likelihood.",
            market_implication: "Investors overreact to recent crash/pump events (recency bias). Media-hyped events amplify this distortion.",
            triggers: ["news_shock", "recent_crash", "vivid_event", "media_hype"]
        },
        {
            concept: "Representativeness Heuristic",
            authors: ["Kahneman", "Thaler", "Shiller"],
            definition: "Similarity-based judgments—things that resemble a prototype are judged more probable, ignoring base rates.",
            mechanism: "Pattern matching without statistical logic.",
            market_implication: "Chasing 'hot' assets purely because they look like past winners. Extrapolating short-term trends as 'new era' paradigms.",
            triggers: ["pattern_match", "new_paradigm", "trend_extrapolation", "ignoring_base_rates"]
        },
        {
            concept: "Anchoring",
            authors: ["Kahneman", "Thaler", "Shiller"],
            definition: "Initial number (even arbitrary) influences subsequent estimates. Adjustment is usually insufficient.",
            mechanism: "Fixation on a reference point.",
            market_implication: "Investors fixate on past peaks (ATH) or recent deal prices. Slows price discovery in expanding/contracting markets.",
            triggers: ["support", "resistance", "all_time_high", "price_target", "fixation"]
        },
        {
            concept: "Confirmation Bias / WYSIATI",
            authors: ["Kahneman"],
            definition: "What You See Is All There Is. Constructing coherent stories from available info, ignoring missing data.",
            mechanism: "System 1 seeks coherence, not truth. Suppresses doubt.",
            market_implication: "Traders build confident narratives on limited data (e.g., 'price is up, must be bullish') while ignoring contradictory fundamentals.",
            triggers: ["narrative", "conviction", "ignoring_data", "tunnel_vision"]
        },
        {
            concept: "Mental Accounting",
            authors: ["Thaler", "Shiller"],
            definition: "Categorizing money differently based on source/use (violinating fungibility).",
            mechanism: "Treating 'house money' (gains) more risk-seekingly than 'hard-earned' capital.",
            market_implication: "Exacerbates bubbles as early winners reinvest gains recklessly. Segmentation leads to inefficient portfolio allocation.",
            triggers: ["house_money", "profit_risk", "bucket_thinking"]
        },
        {
            concept: "Endowment Effect",
            authors: ["Thaler", "Kahneman", "Shiller"],
            definition: "Owning something increases its subjective value.",
            mechanism: "Pain of giving up > pleasure of acquiring.",
            market_implication: "Investors hold losing positions (bag holding) or refuse to sell at fair value because they 'own' it. Reduces liquidity.",
            triggers: ["bag_holding", "refusal_to_sell", "attachment"]
        }
    ],
    "Prospect Theory": [
        {
            concept: "Loss Aversion",
            authors: ["Kahneman", "Thaler", "Shiller"],
            definition: "Losses loom larger than gains (coefficient approx 2:1).",
            mechanism: "Evolutionary asymmetry: pain of loss is 2x pleasure of gain.",
            market_implication: "The Disposition Effect: Selling winners too early (to secure gain) and holding losers too long (to avoid realizing loss). Explains slow bubble pops.",
            triggers: ["loss", "drawdown", "holding_loser", "selling_winner"]
        },
        {
            concept: "Diminishing Sensitivity",
            authors: ["Kahneman"],
            definition: "Marginal impact decreases with distance from reference point.",
            mechanism: "Concave utility for gains, convex for losses.",
            market_implication: "Risk-seeking in losses (doubling down to get back to even). Risk-averse in gains (locking it in).",
            triggers: ["averaging_down", "locking_profit", "risk_attitude"]
        },
        {
            concept: "Reference Dependence",
            authors: ["Kahneman", "Shiller"],
            definition: "Outcomes evaluated relative to a reference point (e.g., entry price), not absolute wealth.",
            mechanism: "Resetting the 'zero point' defines gain/loss.",
            market_implication: "Market 'memory' at key levels. Crashes accelerate when reference points shift universally.",
            triggers: ["entry_price", "breakeven", "reference_point"]
        }
    ],
    "Structural & Bubbles": [
        {
            concept: "Speculative Bubbles",
            authors: ["Shiller"],
            definition: "Temporary high prices from enthusiasm, self-sustaining via feedback loops.",
            mechanism: "Price rise -> Media/Social Proof -> More Buyers -> Price rise.",
            market_implication: "Bubbles are not random; they are social/psychological phenomena precipitated by 'new era' stories.",
            triggers: ["bubble", "feedback_loop", "viral", "mania"]
        },
        {
            concept: "Narrative Fallacy",
            authors: ["Shiller", "Kahneman"],
            definition: "Tendency to impose coherent stories on random events.",
            mechanism: "Humans need causal explanations.",
            market_implication: "Media amplifies simple stories ('AI will change everything') to justify complex price moves. Narrative drives price more than data.",
            triggers: ["story", "media", "headline", "justification"]
        },
        {
            concept: "Herd Behavior",
            authors: ["Shiller", "Thaler"],
            definition: "Social proof and recency bias creating cascades.",
            mechanism: "Fear of missing out (FOMO) and safety in numbers.",
            market_implication: "Momentum investing. Contrarian signals arise when herding reaches saturation.",
            triggers: ["herd", "fomo", "crowd", "consensus"]
        }
    ]
};

export class BehavioralFinanceReference {
    constructor() {
        console.log('📘 INITIALIZED: Behavioral Finance Reference Layer (Kahneman/Thaler/Shiller)');
    }

    /**
     * Retrieves relevant behavioral concepts based on context triggers.
     * @param contextKeywords strings describing the current market state (e.g., "panic", "bubble", "loss")
     */
    public getRelevantConcepts(contextKeywords: string[]): BehavioralConcept[] {
        const results: BehavioralConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(BEHAVIORAL_FRAMEWORK).forEach(categoryList => {
            categoryList.forEach(concept => {
                // Check if any trigger matches context
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
     * Returns the full "Blended Core Framework" for deep review.
     */
    public getCoreFramework(): BehavioralConcept[] {
        return BEHAVIORAL_FRAMEWORK["Core Framework"];
    }

    /**
     * Formats a concept into a citation string.
     */
    public formatCitation(concept: BehavioralConcept): string {
        return `[${concept.authors.join('/')}] ${concept.concept}: ${concept.definition} -> Market Implication: ${concept.market_implication}`;
    }
}

export const behavioralFinanceReference = new BehavioralFinanceReference();
