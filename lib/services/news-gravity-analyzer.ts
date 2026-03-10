
import { eliteNewsIntelligenceEngine, NewsBasedStrategy } from './elite-news-intelligence-engine';
import { tradingPsychologyEngine, PsychologyEngineOutput } from './trading-psychology-engine';
import { narrativeFlowEngine } from './narrative-flow-engine';
import { narrativeLifecycleReference } from '../knowledge/narrative-lifecycle-reference';

// --- Interfaces for NewsGravity ---

export interface GravityLevel {
    price: number;
    type: 'RIP_TO' | 'RIP_FROM' | 'CRASH_TO' | 'CRASH_FROM' | 'CONSOLIDATION';
    event_context: string; // e.g., "CPI Beat +0.2%"
    date: string;
    strength: number; // 1-100, based on volume/velocity
    decay_factor: number; // How much it weakens over time
}

export interface NewsScenario {
    name: 'BULL_CASE' | 'BEAR_CASE' | 'BASE_CASE' | 'CHAOS_CASE';
    probability: number; // 0-100
    description: string;
    price_targets: number[];
    reaction_profile: {
        immediate: string; // "Spike and fade"
        sustained: string; // "Trend day"
    };
    required_triggers: string[]; // e.g. "CPI < 3.0%"
}

export interface TrapSetup {
    active: boolean;
    type: 'BULL_TRAP' | 'BEAR_TRAP' | 'NONE';
    conviction: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string; // "Euphoric crowd + Bad News = Crash"
    trigger_level: number;
}

export interface GravityAnalysis {
    timestamp: string;
    symbol: string;
    gravity_levels: GravityLevel[];
    active_scenarios: NewsScenario[];
    trap_detection: TrapSetup;
    market_state: 'WAITING' | 'REACTING' | 'DIGESTING';
    recommendation: string;
    narrative_context?: string;
}


export class NewsGravityAnalyzer {
    private gravityMemory: Map<string, GravityLevel[]> = new Map();

    constructor() {
        console.log('🌌 INITIALIZING NEWS GRAVITY ANALYZER (The Soul)...');
    }

    /**
     * Core Analysis Function: The "Brain" of NewsGravity
     */
    async analyzeGravity(ticker: string, upcomingEvent: string | null = null): Promise<GravityAnalysis> {
        console.log(`🌌 Analyzing News Gravity for ${ticker}...`);

        // 1. Get Psychology (The Soul)
        const psychology = await tradingPsychologyEngine.analyzeTradingPsychology(ticker);

        // 2. Retrieve Gravity Levels (The Memory)
        const levels = this.getGravityLevels(ticker);

        // 3. Narrative Intelligence (The Context)
        const activeNarratives = narrativeFlowEngine.getActiveNarratives();
        const primaryNarrative = activeNarratives[0];
        const narrativeInsight = primaryNarrative ? narrativeLifecycleReference.formatInsight(primaryNarrative.current_stage) : undefined;

        // 4. Generate Scenarios (The Vision)
        const scenarios = this.generateScenarios(ticker, upcomingEvent, psychology, levels, activeNarratives);

        // 5. Detect Traps (The Instinct)
        const trap = this.detectTraps(psychology, scenarios);

        // 6. Determine Market State
        const marketState = upcomingEvent ? 'WAITING' : 'DIGESTING';

        return {
            timestamp: new Date().toISOString(),
            symbol: ticker,
            gravity_levels: levels,
            active_scenarios: scenarios,
            trap_detection: trap,
            market_state: marketState,
            recommendation: this.generateRecommendation(trap, scenarios),
            narrative_context: narrativeInsight
        };
    }

    /**
     * Record a major news reaction to build "Muscle Memory"
     */
    recordNewsEvent(ticker: string, event: string, ripTo: number, ripFrom: number, sentiment: string) {
        console.log(`📝 Recording Gravity Event for ${ticker}: ${event}`);

        const existing = this.gravityMemory.get(ticker) || [];

        // Add "Rip To" Level (Resistance/Target)
        existing.push({
            price: ripTo,
            type: 'RIP_TO',
            event_context: event,
            date: new Date().toISOString(),
            strength: 90, // Fresh news is strong
            decay_factor: 0.95
        });

        // Add "Rip From" Level (Support/Launchpad)
        existing.push({
            price: ripFrom,
            type: 'RIP_FROM',
            event_context: event,
            date: new Date().toISOString(),
            strength: 85,
            decay_factor: 0.95
        });

        this.gravityMemory.set(ticker, existing);
    }

    /**
     * HDBSCAN-style Density Clustering: The "Filtering"
     * Groups gravity levels by proximity and density, ignoring noise.
     */
    private analyzeOrderFlowDensity(ticker: string, rawLevels: GravityLevel[]): GravityLevel[] {
        if (rawLevels.length < 3) return rawLevels;

        console.log(`📡 Running HDBSCAN-style density clustering for ${ticker}...`);

        const epsilon = 0.50; // $0.50 range for clustering
        const minPoints = 2; // Min levels to form a cluster

        const clusters: GravityLevel[][] = [];
        const noise: GravityLevel[] = [];

        // 1. Group points into clusters based on distance
        const sorted = [...rawLevels].sort((a, b) => a.price - b.price);
        let currentCluster: GravityLevel[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            if (Math.abs(sorted[i].price - sorted[i - 1].price) <= epsilon) {
                currentCluster.push(sorted[i]);
            } else {
                if (currentCluster.length >= minPoints) {
                    clusters.push(currentCluster);
                } else {
                    noise.push(...currentCluster);
                }
                currentCluster = [sorted[i]];
            }
        }
        // Last cluster
        if (currentCluster.length >= minPoints) {
            clusters.push(currentCluster);
        } else {
            noise.push(...currentCluster);
        }

        // 2. Synthesize clusters into "Truth Zones"
        const truthZones = clusters.map(cluster => {
            const avgPrice = cluster.reduce((sum, l) => sum + l.price, 0) / cluster.length;
            const maxStrength = Math.max(...cluster.map(l => l.strength));

            return {
                price: parseFloat(avgPrice.toFixed(2)),
                type: cluster[0].type, // Inherit type from most strong level
                event_context: `Cluster of ${cluster.length} levels`,
                date: cluster[0].date,
                strength: Math.min(100, maxStrength + (cluster.length * 2)), // Bonus for density
                decay_factor: cluster[0].decay_factor
            };
        });

        console.log(`✅ Filtered ${noise.length} noise levels. Found ${truthZones.length} high-density truth zones.`);
        return truthZones;
    }

    /**
     * Retrieve active gravity levels, filtering out decayed ones
     */
    getGravityLevels(ticker: string): GravityLevel[] {
        // In a real app, this would fetch from DB. 
        // For now, return mock history + memory
        const memory = this.gravityMemory.get(ticker) || [];

        // Add some mock "Legacy" levels (Major structural pivot points)
        const legacyLevels: GravityLevel[] = ticker === 'SPY' ? [
            { price: 480.00, type: 'RIP_TO', event_context: 'ATH Rejection (Jan 24)', date: '2024-01-01', strength: 95, decay_factor: 0.99 },
            { price: 465.50, type: 'RIP_FROM', event_context: 'CPI Low (Dec 23)', date: '2023-12-12', strength: 88, decay_factor: 0.98 }
        ] : [];

        const allRaw = [...memory, ...legacyLevels];

        // APPLY HDBSCAN-STYLE FILTERING
        return this.analyzeOrderFlowDensity(ticker, allRaw);
    }

    /**
     * Generate Probabilistic Scenarios based on Psychology + Event
     */
    private generateScenarios(
        ticker: string,
        event: string | null,
        psychology: PsychologyEngineOutput,
        levels: GravityLevel[],
        activeNarratives: any[]
    ): NewsScenario[] {

        const scenarios: NewsScenario[] = [];

        if (!event) {
            // No specific event? Standard Market Logic
            scenarios.push({
                name: 'BASE_CASE',
                probability: 60,
                description: 'Drift towards nearest Gravity Level',
                price_targets: [levels[0]?.price || 0],
                reaction_profile: { immediate: 'Chop', sustained: 'Drift' },
                required_triggers: ['No new catalysts']
            });
            return scenarios;
        }

        // Event Logic (e.g. CPI)
        const isFearful = psychology.market_emotional_state.primary_emotion === 'fear';

        // Scenario A: Bullish Surprise (The "Rip")
        const isShock = activeNarratives.some(n => n.expectation_status === 'SHOCK');
        const shockMultiplier = isShock ? 1.5 : 1.0;

        scenarios.push({
            name: 'BULL_CASE',
            probability: isFearful ? 40 : 25, // Contrarian: If fearful, upside surprise captures more
            description: isShock ? 'UNEXPECTED BULLISH SHOCK! Deep squeeze likely.' : 'Data comes in soft/dovish. Shorts squeeze.',
            price_targets: levels.filter(l => l.type === 'RIP_TO').map(l => l.price * shockMultiplier), // Wider targets for shock
            reaction_profile: {
                immediate: isShock ? 'Parabolic Rip' : 'Vertical Rip',
                sustained: isShock ? 'Multi-day squeeze' : 'Flag and Go'
            },
            required_triggers: ['Data < Expected', 'Dovish comms']
        });

        // Scenario B: Bearish Reality (The "Rug")
        scenarios.push({
            name: 'BEAR_CASE',
            probability: isFearful ? 30 : 50, // If already fearful, downside might be priced in
            description: isShock ? 'UNEXPECTED BEARISH SHOCK! Massive rug pull.' : 'Data hot/hawkish. Reality check.',
            price_targets: levels.filter(l => l.type === 'RIP_FROM').map(l => l.price / shockMultiplier), // Wider targets for shock
            reaction_profile: {
                immediate: isShock ? 'Gap and Flush' : 'Flush',
                sustained: isShock ? 'Systemic liquidation' : 'Grind lower'
            },
            required_triggers: ['Data > Expected', 'Hawkish surprise']
        });

        return scenarios;
    }

    /**
     * Detect "Traps" by analyzing Crowd vs. Reality
     * "The Gravity of the situation"
     */
    private detectTraps(psychology: PsychologyEngineOutput, scenarios: NewsScenario[]): TrapSetup {
        const primaryEmotion = psychology.market_emotional_state.primary_emotion;
        const intensity = psychology.market_emotional_state.intensity_level;

        // Bull Trap: Euphoria + Bearish Scenario exists
        if (primaryEmotion === 'euphoria' || primaryEmotion === 'greed') {
            if (intensity > 75) {
                return {
                    active: true,
                    type: 'BULL_TRAP',
                    conviction: 'HIGH',
                    description: 'Crowd is euphoric. Any bad news will trigger a massive flush ("Sell the News").',
                    trigger_level: 0 // Would be set to current price
                };
            }
        }

        // Bear Trap: Panic + Bullish Scenario exists
        if (primaryEmotion === 'panic' || primaryEmotion === 'fear') {
            if (intensity > 75) {
                return {
                    active: true,
                    type: 'BEAR_TRAP',
                    conviction: 'HIGH',
                    description: 'Crowd is panicked. Any good news triggers a face-ripping squeeze.',
                    trigger_level: 0
                };
            }
        }

        // Narrative Climax Trap: Peak emotion + Specific Narrative Stage
        const activeNarratives = narrativeFlowEngine.getActiveNarratives();
        const climactic = activeNarratives.find(n => n.current_stage === 'THE_CLIMAX' && n.intensity > 85);
        if (climactic) {
            return {
                active: true,
                type: 'NONE', // Special case: NARRATIVE_CLIMAX
                conviction: 'HIGH',
                description: `🎬 NARRATIVE CLIMAX: [${climactic.topic}] has reached peak emotion. High probability of the "opposite effect" starting.`,
                trigger_level: 0
            };
        }

        // Bait Detection: Expected News + Extreme Sentiment
        const expectedNews = activeNarratives.find(n => n.expectation_status === 'EXPECTED' && n.intensity > 80);
        if (expectedNews && intensity > 80) {
            return {
                active: true,
                type: primaryEmotion === 'greed' || primaryEmotion === 'euphoria' ? 'BULL_TRAP' : 'BEAR_TRAP',
                conviction: 'HIGH',
                description: `🪤 BAIT DETECTED: [${expectedNews.topic}] fell in line with expectations, but sentiment is extreme (${intensity}%). Institutional manipulation likely. Expect rejection.`,
                trigger_level: 0
            };
        }

        return { active: false, type: 'NONE', conviction: 'LOW', description: 'No extreme trap detected', trigger_level: 0 };
    }

    private generateRecommendation(trap: TrapSetup, scenarios: NewsScenario[]): string {
        if (trap.active) {
            return `⚠️ TRAP ALERT: ${trap.type} Detected! (${trap.description}). Bias: ${trap.type === 'BULL_TRAP' ? 'SHORT' : 'LONG'}`;
        }

        const mostLikely = scenarios.sort((a, b) => b.probability - a.probability)[0];
        return `Play the ${mostLikely.name} (${mostLikely.probability}% prob). Target: ${mostLikely.price_targets[0] || 'Open'}`;
    }
}

export const newsGravityAnalyzer = new NewsGravityAnalyzer();
