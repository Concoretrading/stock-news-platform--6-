
import { MarketContext, UnifiedKnowledgeFoundation } from './unified-knowledge-foundation';

// Helper Interfaces for Incoming Data (Simulated)
export interface PolygonData {
    ticker: string;
    price: number;
    volume: number;
    vwap: number;
    prevClose: number;
    timestamp: number;
}

export interface NewsItem {
    headline: string;
    source: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    tickers: string[];
    timestamp: number;
}

export interface Tweet {
    author_id: string; // e.g. "DeItaone"
    text: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    is_verified: boolean;
}

/**
 * Live Data Adapter
 * Acts as the translation layer between external APIs (Polygon, News, X) and the internal Unified Brain.
 * This service is "Ready" to be connected to real streams.
 */
export class LiveDataAdapter {
    private knowledgeFoundation: UnifiedKnowledgeFoundation;

    constructor() {
        this.knowledgeFoundation = new UnifiedKnowledgeFoundation();
        console.log('🔌 LIVE DATA ADAPTER INITIALIZED: Ready for Polygon & News Streams');
    }

    /**
     * Synthesizes raw data streams into a cohesive Market Context for the Brain.
     * This describes "What to do" when data arrives.
     */
    public synthesizeContext(priceData: PolygonData, newsItems: NewsItem[], xStream: Tweet[]): MarketContext {
        console.log(`\n🌊 Ingesting Live Data for ${priceData.ticker}...`);

        // 1. Determine Regime & Price Action from Polygon Data
        // (Simplified logic for demonstration - would be real technical analysis)
        const priceChange = (priceData.price - priceData.prevClose) / priceData.prevClose;
        const isTrending = Math.abs(priceChange) > 0.005; // > 0.5% move
        const isVolatile = (priceData.price - priceData.vwap) / priceData.vwap > 0.002; // Deviation from VWAP

        let regime: 'consolidation' | 'trending' | 'volatile' | 'neutral' = 'neutral';
        if (isTrending) regime = 'trending';
        if (isVolatile) regime = 'volatile';

        let priceAction: 'breakout' | 'breakdown' | 'chop' | 'rejection' | 'flush' = 'chop';
        if (priceChange > 0.01) priceAction = 'breakout';
        else if (priceChange < -0.01) priceAction = 'breakdown';

        // 2. Synthesize News & X Stream for Sentiment & Truth Revelation
        let newsSentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
        let detectedEvents: string[] = [];

        // Check Headlines
        newsItems.forEach(news => {
            // Add specific tickers or keywords to events
            if (news.headline.toLowerCase().includes('earnings')) detectedEvents.push('earnings');
            if (news.headline.toLowerCase().includes('fed')) detectedEvents.push('fed', 'powell', 'rates');
            if (news.headline.toLowerCase().includes('apple')) detectedEvents.push('apple', 'big tech');

            // Simple sentiment logic
            if (news.sentiment === 'positive') newsSentiment = 'positive';
            if (news.sentiment === 'negative') newsSentiment = 'negative';
        });

        // 3. X-Stream Truth Check (Real-time Interpretation)
        // "News as Truth Revealer": Checks for divergence
        const xConsensus = this.calculateXConsensus(xStream);

        // TRAP DETECTION LOGIC
        // If News = Positive but X-Consensus = Bearish (Trap) -> Sentiment = Mixed
        if (newsSentiment === 'positive' && xConsensus === 'bearish') {
            console.log('⚠️ TRAP DETECTED: News is bullish but Smart Money (X) is bearish.');
            newsSentiment = 'mixed';
            detectedEvents.push('trap');
        }

        // 4. Construct the Context
        const context: MarketContext = {
            regime: regime,
            price_action: priceAction,
            news_sentiment: newsSentiment,
            participant_state: this.inferParticipantState(priceAction, newsSentiment),
            specific_events: detectedEvents
        };

        return context;
    }

    private calculateXConsensus(tweets: Tweet[]): 'bullish' | 'bearish' | 'neutral' {
        // Pseudo-logic to sum sentiment from verified tweets
        let score = 0;
        tweets.forEach(t => {
            if (t.is_verified) {
                if (t.sentiment === 'bullish') score++;
                if (t.sentiment === 'bearish') score--;
            }
        });
        if (score > 2) return 'bullish';
        if (score < -2) return 'bearish';
        return 'neutral';
    }

    private inferParticipantState(action: string, sentiment: string): any {
        if (action === 'breakout' && sentiment === 'positive') return 'greed';
        if (action === 'breakdown' && sentiment === 'negative') return 'fear';
        if (sentiment === 'mixed') return 'doubt';
        return 'unknown';
    }
}
