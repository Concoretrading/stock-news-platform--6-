
import { MarketContext, UnifiedKnowledgeFoundation } from './unified-knowledge-foundation';
import { finnhubService, FinnhubNews } from './finnhub-service';
import { grokService, GrokIntelligence } from './grok-service';

// Helper Interfaces for Incoming Data
export interface PolygonData {
    ticker: string;
    price: number;
    volume: number;
    vwap: number;
    prevClose: number;
    timestamp: number;
}

/**
 * Live Data Adapter
 * Acts as the translation layer between external APIs (Polygon, Finnhub, Grok) and the internal Unified Brain.
 */
export class LiveDataAdapter {
    private knowledgeFoundation: UnifiedKnowledgeFoundation;

    constructor() {
        this.knowledgeFoundation = new UnifiedKnowledgeFoundation();
        console.log('🔌 LIVE DATA ADAPTER INITIALIZED: Connected to Finnhub & Grok Streams');
    }

    /**
     * Synthesizes raw data streams into a cohesive Market Context for the Brain.
     */
    public async synthesizeLiveContext(priceData: PolygonData): Promise<MarketContext> {
        console.log(`\n🌊 Ingesting Live Data for ${priceData.ticker}...`);

        // 1. Fetch Real Intelligence from Dual Experts
        const [newsItems, socialIntel] = await Promise.all([
            finnhubService.getMarketNews(),
            grokService.analyzeSocialIntelligence(priceData.ticker)
        ]);

        // 2. Determine Regime & Price Action from Polygon Data
        const priceChange = (priceData.price - priceData.prevClose) / priceData.prevClose;
        const isTrending = Math.abs(priceChange) > 0.005;
        const isVolatile = (priceData.price - priceData.vwap) / priceData.vwap > 0.002;

        let regime: 'consolidation' | 'trending' | 'volatile' | 'neutral' = 'neutral';
        if (isTrending) regime = 'trending';
        if (isVolatile) regime = 'volatile';

        let priceAction: 'breakout' | 'breakdown' | 'chop' | 'rejection' | 'flush' = 'chop';
        if (priceChange > 0.01) priceAction = 'breakout';
        else if (priceChange < -0.01) priceAction = 'breakdown';

        // 3. Synthesize News Sentiment (Institutional Truth)
        let newsSentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
        let detectedEvents: string[] = [];

        newsItems.forEach(news => {
            const headline = news.headline.toLowerCase();
            if (headline.includes('earnings')) detectedEvents.push('earnings');
            if (headline.includes('fed') || headline.includes('powell')) detectedEvents.push('fed_catalyst');

            // Basic keyword-based sentiment for Finnhub
            if (headline.includes('surge') || headline.includes('beat') || headline.includes('upgrade')) newsSentiment = 'positive';
            else if (headline.includes('plunge') || headline.includes('miss') || headline.includes('downgrade')) newsSentiment = 'negative';
        });

        // 4. Social Rumor Check (Divergence Detection)
        const xConsensus = socialIntel.consensus;
        const batonPhase: 'IDLE' | 'RAW_WHISPER' | 'VALIDATED_WHISPER' | 'CONFIRMED_NARRATIVE' =
            socialIntel.is_whisper && socialIntel.intel_score > 70 ? 'VALIDATED_WHISPER' :
                socialIntel.is_whisper ? 'RAW_WHISPER' : 'IDLE';

        // TRAP DETECTION LOGIC: Divergence between Social (Grok) and Official (Finnhub)
        if ((newsSentiment as string) === 'positive' && xConsensus === 'bearish') {
            console.log('⚠️ TRAP DETECTED: Institutional news is bullish but Social Rumors (Grok) are bearish.');
            newsSentiment = 'mixed';
            detectedEvents.push('bull_trap_divergence');
        } else if ((newsSentiment as string) === 'negative' && xConsensus === 'bullish') {
            console.log('⚠️ TRAP DETECTED: Institutional news is bearish but Social Rumors (Grok) are bullish.');
            newsSentiment = 'mixed';
            detectedEvents.push('bear_trap_divergence');
        }

        // Add specific social shocks and rumor categories
        if (socialIntel.social_shocks.length > 0) {
            detectedEvents.push(...socialIntel.social_shocks.map(s => `shock_${s.toLowerCase().replace(/\s+/g, '_')}`));
        }
        if (socialIntel.rumor_category && socialIntel.rumor_category !== 'none') {
            detectedEvents.push(`rumor_${socialIntel.rumor_category}`);
        }

        // 5. Construct the Context
        const context: MarketContext = {
            regime: regime,
            price_action: priceAction,
            news_sentiment: newsSentiment,
            participant_state: this.inferParticipantState(priceAction, newsSentiment, xConsensus),
            specific_events: detectedEvents,
            baton_phase: batonPhase
        };

        // 6. PHASE 0: LOG OBSERVATION FOR TRAINING
        await this.logTrainingData(priceData, context, socialIntel);

        return context;
    }

    private async logTrainingData(priceData: PolygonData, context: MarketContext, socialIntel: GrokIntelligence): Promise<void> {
        try {
            const { trainingLogger } = await import('./training-logger');
            await trainingLogger.logObservation({
                ticker: priceData.ticker,
                timestamp: new Date().toISOString(),
                price_action: {
                    price: priceData.price,
                    volume: priceData.volume,
                    change_pct: (priceData.price - priceData.prevClose) / priceData.prevClose
                },
                narrative_context: {
                    sentiment: context.news_sentiment,
                    baton_phase: context.baton_phase || 'IDLE',
                    catalysts: socialIntel.catalyst_details || [],
                    intel_score: socialIntel.intel_score
                }
            });
        } catch (e) {
            console.warn('⚠️ Training logic bypass (Logger not initialized)');
        }
    }

    private inferParticipantState(action: string, sentiment: string, xConsensus: string): any {
        if (action === 'breakout' && sentiment === 'positive' && xConsensus === 'bullish') return 'greed';
        if (action === 'breakdown' && sentiment === 'negative' && xConsensus === 'bearish') return 'fear';
        if (sentiment === 'mixed') return 'doubt';
        return 'observing';
    }
}

export const liveDataAdapter = new LiveDataAdapter();
