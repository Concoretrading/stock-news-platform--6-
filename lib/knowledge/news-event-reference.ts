
// News & Event Reference Layer
// Sole purpose: To provide a permanently embedded framework for handling news/events across three time dimensions.
// This module provides insights into "News as Truth Revealer", "Scenarios of Possibilities", and "Emotional/Behavioral Tells".

export interface NewsEventConcept {
    concept: string;
    category: "Core Framework" | "Event Type" | "Breakdown Principle";
    definition: string;
    mechanism: string; // The "How" (Past/Real-time/Upcoming connection)
    market_implication: string; // Impact on trading
    triggers: string[]; // Context keywords that activate this knowledge
}

export const NEWS_EVENT_FRAMEWORK: { [category: string]: NewsEventConcept[] } = {
    "Core Framework": [
        {
            concept: "News as Truth Revealer",
            category: "Core Framework",
            definition: "News/events catalyze revelations in market data, revealing underlying emotions and biases.",
            mechanism: "Analyze independent breakdowns of reactions (vol shifts, flow changes).",
            market_implication: "Validation: Use news to confirm 'scenarios of possibilities' mapped by technicals. Does the reaction match the setup?",
            triggers: ["news", "event", "catalyst", "truth", "revelation", "reaction"]
        },
        {
            concept: "Three Time Dimensions",
            category: "Core Framework",
            definition: "Connect Past (memory), Real-time (assessment), and Upcoming (preparation) to reveal truth.",
            mechanism: "Past informs deviations; Real-time detects emotional tells; Upcoming maps risk branches.",
            market_implication: "Context: Never analyze headlines in a vacuum. Compare current reaction to historical baselines and future risk.",
            triggers: ["time", "past", "present", "future", "upcoming", "memory", "real-time"]
        },
        {
            concept: "Scenarios of Possibilities",
            category: "Core Framework",
            definition: "News allows us to map potential outcomes, but the Market's Reaction reveals the Truth.",
            mechanism: "If [News] + [Bullish Reaction] = True Strength. If [News] + [Failure] = True Weakness (Trap).",
            market_implication: "Do not trade the news itself. Trade the 'Truth' revealed by the reaction to the news relative to key levels.",
            triggers: ["scenario", "possibility", "reaction", "truth", "outcome", "branch", "news", "event", "analysis"]
        }
    ],
    "Key Event Types": [
        {
            concept: "Expirations & Witching",
            category: "Event Type",
            definition: "SPX Rolls, VIX Expiration, Triple/Quad Witching. Liquidity events involving massive open interest shuffles.",
            mechanism: "Past: Pinning zones. Real-time: Vanishing liquidity. Upcoming: Roll-over volume.",
            market_implication: "Expect 'Pinning' (price magnets) or 'Volatility Suppression' until the event clears.",
            triggers: ["expiration", "witching", "opex", "quad", "triple", "roll", "vix expiration", "spx roll"]
        },
        {
            concept: "Earnings & Big Tech",
            category: "Event Type",
            definition: "Quarterly reports, Product Launches, Delays, Price Increases. The 'Titans' moving the index.",
            mechanism: "Look for 'Sell the News' on hype or 'Relief Rallies' on bad-but-better-than-feared news.",
            market_implication: "Big Tech flows dictate SPY/QQQ direction. Watch for immediate repricing vs. fading moves.",
            triggers: ["earnings", "apple", "microsoft", "nvidia", "google", "meta", "tesla", "amazon", "product", "delay", "price increase"]
        },
        {
            concept: "Economic Data & Fed",
            category: "Event Type",
            definition: "GDP, CPI/PPI, Jobs, Fed Presidents, Powell. Monetary policy and macro health.",
            mechanism: "Algo knee-jerk reactions (HFT) followed by 'Real Money' positioning.",
            market_implication: "Wait for the 'Algo Flush' (first 5-15 mins). Fade the initial noise if it hits a key technical wall.",
            triggers: ["macro", "gdp", "cpi", "pmi", "jobs", "fed", "powell", "policy", "rates", "speaker"]
        },
        {
            concept: "Analyst Ratings",
            category: "Event Type",
            definition: "Upgrades, Downgrades, Price Target changes. Institutional perception shifts.",
            mechanism: "Assess if the upgrade chases price (lagging) or leads price (leading).",
            market_implication: "Upgrades at highs = Trap (Exit Liquidity). Upgrades at lows = accumulation catalyst.",
            triggers: ["upgrade", "downgrade", "rating", "analyst", "price target"]
        }
    ],
    "Breakdown Principles": [
        {
            concept: "X (Social) Sentiment Stream",
            category: "Breakdown Principle",
            definition: "Real-time parsing of professional analyst breakdowns (not retail noise).",
            mechanism: "Filter for 'Verified' expert takes to gauge consensus vs. contrarian setups.",
            market_implication: "Use professional consensus to identify crowded trades (fade targets) or confirmed momentum.",
            triggers: ["twitter", "x", "social", "stream", "sentiment", "analyst", "consensus"]
        },
        {
            concept: "Emotional/Behavioral Tells",
            category: "Breakdown Principle",
            definition: "Independent recognition of biases (greed in hype, fear in delays) without external input.",
            mechanism: "Map news content to likely emotional reactions (Availability Bias, Panic).",
            market_implication: "Fade rapid emotional moves that contradict core system trend indicators.",
            triggers: ["emotion", "behavior", "bias", "greed", "fear", "panic", "hype", "tell"]
        }
    ]
};

export class NewsEventReference {
    constructor() {
        console.log('📰 INITIALIZED: News & Event Reference Layer (Embedded Logic)');
    }

    /**
     * Retrieves relevant news/event concepts based on context triggers.
     * @param contextKeywords strings describing the current market/macro state or specific news events
     */
    public getRelevantConcepts(contextKeywords: string[]): NewsEventConcept[] {
        const results: NewsEventConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(NEWS_EVENT_FRAMEWORK).forEach(categoryList => {
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
     * Formats a concept into a news insight.
     */
    public formatInsight(concept: NewsEventConcept): string {
        return `📰 NEWS LOGIC [${concept.category}]: ${concept.concept}\n   "${concept.mechanism}" -> ${concept.market_implication}`;
    }
}

export const newsEventReference = new NewsEventReference();
