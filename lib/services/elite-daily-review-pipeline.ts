
import { v4 as uuidv4 } from 'uuid';
import { unifiedKnowledgeFoundation, MarketContext, KnowledgeInsight } from './unified-knowledge-foundation';

// --- Interface Definitions ---

export interface TechnicalUnfold {
    price_action_summary: string;
    key_levels: {
        resistance: number[];
        support: number[];
        pre_market_low: number;
    };
    system_component_review: {
        squeeze_analysis: {
            compression_strength: string; // e.g., "Red dots (High Compression)"
            momentum_histogram: string; // e.g., "Cyan rising (Strong Bullish)"
            fired_direction: 'long' | 'short' | 'neutral';
        };
        tick_analysis: {
            extremes_hit: number[]; // e.g., [-1000, 800]
            cumulative_trend: 'buying' | 'selling' | 'neutral';
            divergences_detected: string[]; // e.g., "Price made lower low, TICK made higher low"
        };
        level2_analysis: {
            bid_ask_depth: string;
            absorption_detected: boolean;
            iceberg_orders: string[]; // e.g., "Large buy iceberg at 420.50"
        };
        premium_analysis: {
            iv_rank: number;
            skew_direction: 'call_side' | 'put_side' | 'flat';
            mispricing_detected: boolean;
        };
    };
    fear_proxies: {
        vix_delta: number;
    };
    volume_flow: {
        summary: string;
        flow_type: 'aggressive_buying' | 'aggressive_selling' | 'mixed' | 'neutral';
    };
    algo_performance: {
        entry_accuracy: number; // 0-100%
        exit_accuracy: number; // 0-100%
        hedge_timing: string;
        pnl_attribution: string;
        tactical_improvements: string[];
    };
}

export interface EmotionalInsight {
    participant_psychology: {
        at_highs: string; // e.g., "Greed/FOMO"
        on_rejection: string; // e.g., "Fear/Panic"
        during_flush: string; // e.g., "Doubt"
        on_rebound: string; // e.g., "Relief"
    };
    manipulation_insights: {
        liquidity_grabs: string[];
        weak_hand_flushes: string[];
        crowd_traps: string[];
    };
    societal_connection: string; // e.g., "Confirmation bias leading to impulse"
    takeaways: {
        benefit_patterns: string[]; // How to fade traps
        victim_patterns: string[]; // What to avoid
    };
}

export interface EliteMindsetAudit {
    probabilistic_evaluation: {
        edge_probability_at_entry: number; // 0-100%
        outcome_aligned_with_distribution: boolean;
        thinking_in_odds_notes: string;
    };
    risk_first_critique: {
        capital_protected: boolean;
        position_sizing_appropriateness: string;
        max_drawdown_controlled: boolean;
        survival_rating: number; // 1-10
    };
    process_vs_outcome: {
        execution_quality: number; // 1-10 (independent of PnL)
        process_notes: string;
    };
    bias_check: {
        assumptions_held: boolean;
        confirmation_bias_detected: boolean;
        overconfidence_detected: boolean;
        radical_transparency_notes: string;
    };
    regime_awareness: {
        broader_context: string; // e.g., "High-vol regime, Debt cycle phase"
        influence_on_traps: string;
    };
    self_critique: {
        improvements: string[]; // 1-2 mandatory improvements
        logged_experience: string;
    };
}

import { preMarketRoutineOrchestrator, PreMarketRoutineResult } from './pre-market-routine-orchestrator';

// ... (other interfaces remain same)

export interface DailyReview {
    date: string;
    market_context: string; // e.g., "SPY 2020 crash"
    pre_market_prep?: PreMarketRoutineResult; // New Section: The Plan
    technical: TechnicalUnfold; // The Reality
    emotional: EmotionalInsight;
    mindset: EliteMindsetAudit;
    knowledge_application: {
        applied_concepts: KnowledgeInsight[];
        summary_note: string;
    };
    rl_rewards: {
        process_score: number;
        risk_score: number;
        mindset_bonus: number;
        knowledge_bonus: number;
        preparation_bonus: number; // New Reward
    };
}

// --- Historical Day Data Interface (Mock for now) ---
export interface HistoricalDayData {
    date: string;
    ticker: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vix_open: number;
    vix_close: number;
    events: string[];
}

// --- Service Implementation ---

export class EliteDailyReviewPipeline {
    private reviewStore: DailyReview[] = []; // Mock BigQuery

    constructor() {
        console.log('🏛️ ELITE DAILY REVIEW PIPELINE INITIALIZED');
    }

    /**
     * Generates a structured review for a historical day.
     */
    public generateReview(day: HistoricalDayData, prep?: PreMarketRoutineResult): DailyReview {
        console.log(`📝 Generating review for ${day.date} (${day.ticker})...`);

        // 1. Technical Unfold (Simulated Analysis)
        const technical: TechnicalUnfold = this.analyzeTechnicalUnfold(day);

        // 2. Emotional Ride & Manipulation (Simulated Insight)
        const emotional: EmotionalInsight = this.analyzeEmotionalRide(day, technical);

        // 3. Elite Mindset & Process Audit (Simulated Audit)
        const mindset: EliteMindsetAudit = this.auditMindset(day, technical, emotional);

        // 4. Knowledge Application (New Layer)
        const marketContext = this.deriveContext(day, technical);
        const appliedConcepts = unifiedKnowledgeFoundation.getInsights(marketContext);
        const knowledgeNote = unifiedKnowledgeFoundation.generateApplicationNote(appliedConcepts);


        // Calculate RL Rewards based on the audit
        const rl_rewards = {
            process_score: mindset.process_vs_outcome.execution_quality * 10,
            risk_score: mindset.risk_first_critique.survival_rating * 10,
            mindset_bonus: mindset.bias_check.radical_transparency_notes.length > 10 ? 50 : 0,
            knowledge_bonus: appliedConcepts.length > 0 ? 30 : 0,
            preparation_bonus: prep ? 50 : 0 // Bonus for having done prep
        };

        const review: DailyReview = {
            date: day.date,
            market_context: `${day.ticker} Volatile Session`,
            pre_market_prep: prep,
            technical,
            emotional,
            mindset,
            knowledge_application: {
                applied_concepts: appliedConcepts,
                summary_note: knowledgeNote
            },
            rl_rewards
        };

        this.storeReview(review);
        return review;
    }

    private deriveContext(day: HistoricalDayData, tech: TechnicalUnfold): MarketContext {
        // Logic to map technicals to market context for knowledge retrieval
        const isVolatile = (day.high - day.low) / day.open > 0.02;
        const isTrending = Math.abs(day.close - day.open) / (day.high - day.low) > 0.7;

        return {
            regime: isVolatile ? 'volatile' : (isTrending ? 'trending' : 'consolidation'),
            news_sentiment: day.events.some(e => e.includes('Panic') || e.includes('War')) ? 'negative' : 'neutral',
            price_action: day.close < day.open ? 'breakdown' : 'breakout',
            participant_state: day.close < day.open ? 'fear' : 'greed'
        };
    }

    private analyzeTechnicalUnfold(day: HistoricalDayData): TechnicalUnfold {
        // Logic to derive technicals from price action
        const range = day.high - day.low;
        const isVolatile = range / day.open > 0.02; // >2% range

        return {
            price_action_summary: `Opened at ${day.open}, ranged ${range.toFixed(2)}, closed at ${day.close}. ${isVolatile ? 'High volatility session.' : 'Consolidation session.'}`,
            key_levels: {
                resistance: [day.high, day.high * 1.01],
                support: [day.low, day.low * 0.99],
                pre_market_low: day.low * 0.995 // Mock
            },
            system_component_review: {
                squeeze_analysis: {
                    compression_strength: isVolatile ? "Released from Red Dots" : "Red Dots (High Compression)",
                    momentum_histogram: day.close > day.open ? "Cyan rising (Strong Bullish)" : "Red falling (Bearish)",
                    fired_direction: day.close > day.open ? 'long' : 'short'
                },
                tick_analysis: {
                    extremes_hit: isVolatile ? [-1200, 1000] : [-600, 600],
                    cumulative_trend: day.close > day.open ? 'buying' : 'selling',
                    divergences_detected: isVolatile ? ["Price lower low vs TICK higher low"] : []
                },
                level2_analysis: {
                    bid_ask_depth: isVolatile ? "Thin liquidity, rapid shifts" : "Thick liquidity, absorption",
                    absorption_detected: !isVolatile,
                    iceberg_orders: ["300 lot buy iceberg at support"]
                },
                premium_analysis: {
                    iv_rank: isVolatile ? 85 : 40,
                    skew_direction: day.close < day.open ? 'put_side' : 'call_side',
                    mispricing_detected: isVolatile
                }
            },
            fear_proxies: {
                vix_delta: day.vix_close - day.vix_open,
            },
            volume_flow: {
                summary: `Volume: ${day.volume.toLocaleString()}`,
                flow_type: day.close < day.open ? 'aggressive_selling' : 'aggressive_buying'
            },
            algo_performance: {
                entry_accuracy: 85,
                exit_accuracy: 78,
                hedge_timing: 'Triggered on Support breach',
                pnl_attribution: '60% directional, 40% volatility',
                tactical_improvements: [
                    'Add TICK <-800 filter to avoid fakeout longs',
                    'Tighten stops 0.5% below support'
                ]
            }
        };
    }

    private analyzeEmotionalRide(day: HistoricalDayData, tech: TechnicalUnfold): EmotionalInsight {
        return {
            participant_psychology: {
                at_highs: 'Greed/FOMO evident in morning spike',
                on_rejection: 'Fear creeping in as VWAP failed',
                during_flush: 'Panic selling / Capitulation',
                on_rebound: 'Disbelief / "Dead cat bounce" doubt'
            },
            manipulation_insights: {
                liquidity_grabs: ['Stop run below pre-market low'],
                weak_hand_flushes: ['Mid-day flush on low volume'],
                crowd_traps: ['Bull trap at open', 'Bear trap at close']
            },
            societal_connection: 'Impulse trading driven by headline tracking loops.',
            takeaways: {
                benefit_patterns: ['Fade the initial morning spike if TICK diverges'],
                victim_patterns: ['Chasing the breakdown without volume confirmation']
            }
        };
    }

    private auditMindset(day: HistoricalDayData, tech: TechnicalUnfold, emo: EmotionalInsight): EliteMindsetAudit {
        return {
            probabilistic_evaluation: {
                edge_probability_at_entry: 75,
                outcome_aligned_with_distribution: true,
                thinking_in_odds_notes: 'Setup represented a 3:1 skew, outcome within 1-sigma.'
            },
            risk_first_critique: {
                capital_protected: true,
                position_sizing_appropriateness: 'Correct - halved size due to high VIX',
                max_drawdown_controlled: true,
                survival_rating: 9
            },
            process_vs_outcome: {
                execution_quality: 9,
                process_notes: 'Followed rules perfectly. Market regime shift handled well.'
            },
            bias_check: {
                assumptions_held: true,
                confirmation_bias_detected: false,
                overconfidence_detected: false,
                radical_transparency_notes: 'Initial read was slightly bearish biased, but data confirmed.'
            },
            regime_awareness: {
                broader_context: 'High-vol regime, Debt cycle late-stage',
                influence_on_traps: 'High volatility amplified emotional swings, creating deeper traps.'
            },
            self_critique: {
                improvements: [
                    'Could have scaled out sooner on the first flush.',
                    'Sensitivity to TICK divergence needs calibration.'
                ],
                logged_experience: `Volatile day ${day.date}: VIX spike led to classic liquidity grab. Documented for future pattern matching.`
            }
        };
    }

    /**
     * Mocks storing the review in BigQuery
     */
    private storeReview(review: DailyReview): void {
        console.log(`💾 [MOCK BigQuery] Storing review for ${review.date}`);
        this.reviewStore.push(review);
        // In real implementation:
        // await bigquery.insert('daily_reviews', review);
        // await vectorSearch.upsert(embedding(review), review);
    }

    /**
     * Mocks searching for similar patterns (Vector Search)
     */
    public findSimilarPatterns(contextKeywords: string[]): DailyReview[] {
        console.log(`🔍 [MOCK Vector Search] Finding patterns matching: ${contextKeywords.join(', ')}`);
        // Simple mock filter
        return this.reviewStore.slice(0, 3);
    }

    /**
     * Runs the 5-day volatile market test scenario
     */
    public async runTestScenario(): Promise<DailyReview[]> {
        console.log('\n🚀 RUNNING 5-DAY VOLATILE MARKET TEST SCENARIO (SPY 2020/2022 MOCK)\n');

        const testDays: HistoricalDayData[] = [
            {
                date: '2020-03-16',
                ticker: 'SPY',
                open: 250, high: 255, low: 235, close: 240,
                volume: 300000000,
                vix_open: 55, vix_close: 82,
                events: ['COVID Panic', 'Circuit Breaker']
            },
            {
                date: '2020-03-18',
                ticker: 'SPY',
                open: 235, high: 245, low: 228, close: 240,
                volume: 280000000,
                vix_open: 75, vix_close: 76,
                events: ['Liquidity Crisis']
            },
            {
                date: '2022-01-24',
                ticker: 'SPY',
                open: 430, high: 440, low: 420, close: 439, // Huge intraday reversal
                volume: 250000000,
                vix_open: 28, vix_close: 30,
                events: ['Fed Rate Hike Fear', 'Intraday Reversal']
            },
            {
                date: '2022-02-24',
                ticker: 'SPY',
                open: 410, high: 428, low: 410, close: 427, // War start, buy the invasion
                volume: 200000000,
                vix_open: 35, vix_close: 32,
                events: ['Ukraine Invasion', 'Buy the News']
            },
            {
                date: '2022-06-13',
                ticker: 'SPY',
                open: 380, high: 382, low: 373, close: 374, // CPI collapse
                volume: 180000000,
                vix_open: 28, vix_close: 34,
                events: ['CPI Print', 'Gap Down']
            }
        ];

        const reviews: DailyReview[] = [];

        for (const day of testDays) {
            // Mock Pre-Market Routine Execution
            const yesterdayLevels = {
                ticker: day.ticker,
                poc: day.open - 1,
                value_area_high: day.open + 2,
                value_area_low: day.open - 2,
                closing_price: day.open - 0.5
            };

            const newsData = {
                eco_data: day.events.map(e => ({ event: e, consensus: 'Unknown', priority: 'high' })),
                upgrades: [],
                downgrades: [],
                speakers: []
            };

            const prep = await preMarketRoutineOrchestrator.runRoutine(
                day.ticker,
                yesterdayLevels,
                day.open,
                newsData
            );

            const review = this.generateReview(day, prep);
            reviews.push(review);
            console.log(`✅ Review generated for ${day.date} with Prep validation.`);
        }

        return reviews;
    }
}

export const eliteDailyReviewPipeline = new EliteDailyReviewPipeline();
