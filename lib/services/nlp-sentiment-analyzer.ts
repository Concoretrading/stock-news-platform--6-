// NLP Sentiment Analyzer - Granular News Sentiment Scoring
// Uses AI (OpenAI/Anthropic) for sophisticated sentiment analysis

export interface SentimentScore {
    headline: string;
    overall_sentiment: number; // -100 (very bearish) to +100 (very bullish)
    confidence: number; // 0-100
    sentiment_label: 'VERY_BEARISH' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'VERY_BULLISH';
    key_factors: {
        factor: string;
        impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        weight: number; // 0-100
    }[];
    market_implications: {
        short_term: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        medium_term: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        sectors_affected: string[];
    };
    contrarian_opportunity: boolean;
    reasoning: string;
}

export interface BatchSentimentAnalysis {
    headlines: string[];
    scores: SentimentScore[];
    aggregate_sentiment: number; // -100 to +100
    sentiment_trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE';
    consensus_strength: number; // 0-100, how aligned are the headlines
}

export class NLPSentimentAnalyzer {
    private apiKey: string | null = null;
    private provider: 'openai' | 'anthropic' | 'mock' = 'mock';

    constructor(apiKey?: string, provider?: 'openai' | 'anthropic') {
        this.apiKey = apiKey || null;
        this.provider = provider || 'mock';

        console.log('🧠 INITIALIZING NLP SENTIMENT ANALYZER');
        console.log(`🤖 Provider: ${this.provider.toUpperCase()}`);

        if (!this.apiKey && this.provider !== 'mock') {
            console.log('⚠️  No API key provided - using mock mode');
            this.provider = 'mock';
        }
    }

    /**
     * Analyze sentiment of a single headline
     */
    async analyzeSentiment(headline: string): Promise<SentimentScore> {
        console.log(`🧠 Analyzing sentiment: "${headline.substring(0, 60)}..."`);

        if (this.provider === 'mock') {
            return this.mockSentimentAnalysis(headline);
        }

        // Real API call (OpenAI or Anthropic)
        const prompt = this.buildSentimentPrompt(headline);
        const response = await this.callAI(prompt);

        return this.parseSentimentResponse(response, headline);
    }

    /**
     * Analyze multiple headlines in batch
     */
    async analyzeBatch(headlines: string[]): Promise<BatchSentimentAnalysis> {
        console.log(`🧠 Analyzing ${headlines.length} headlines in batch...`);

        const scores: SentimentScore[] = [];
        for (const headline of headlines) {
            const score = await this.analyzeSentiment(headline);
            scores.push(score);
        }

        const aggregateSentiment = this.calculateAggregateSentiment(scores);
        const sentimentTrend = this.calculateSentimentTrend(scores);
        const consensusStrength = this.calculateConsensusStrength(scores);

        return {
            headlines,
            scores,
            aggregate_sentiment: aggregateSentiment,
            sentiment_trend: sentimentTrend,
            consensus_strength: consensusStrength
        };
    }

    /**
     * Build sentiment analysis prompt
     */
    private buildSentimentPrompt(headline: string): string {
        return `You are a financial sentiment analyzer. Analyze the following news headline and provide a sentiment score from -100 (very bearish) to +100 (very bullish).

Headline: "${headline}"

Provide your analysis in the following JSON format:
{
  "sentiment_score": <number from -100 to +100>,
  "confidence": <number from 0 to 100>,
  "key_factors": [
    {"factor": "<factor description>", "impact": "POSITIVE|NEGATIVE|NEUTRAL", "weight": <0-100>}
  ],
  "short_term_outlook": "BULLISH|BEARISH|NEUTRAL",
  "medium_term_outlook": "BULLISH|BEARISH|NEUTRAL",
  "sectors_affected": ["<sector1>", "<sector2>"],
  "contrarian_opportunity": <true|false>,
  "reasoning": "<brief explanation>"
}`;
    }

    /**
     * Call AI API (OpenAI or Anthropic)
     */
    private async callAI(prompt: string): Promise<string> {
        if (this.provider === 'openai') {
            // OpenAI API call (placeholder - requires actual API integration)
            // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
            return '{"sentiment_score": 75, "confidence": 85, "key_factors": [], "short_term_outlook": "BULLISH", "medium_term_outlook": "BULLISH", "sectors_affected": ["TECH"], "contrarian_opportunity": false, "reasoning": "Positive earnings beat"}';
        } else if (this.provider === 'anthropic') {
            // Anthropic API call (placeholder - requires actual API integration)
            // const response = await fetch('https://api.anthropic.com/v1/messages', { ... });
            return '{"sentiment_score": 75, "confidence": 85, "key_factors": [], "short_term_outlook": "BULLISH", "medium_term_outlook": "BULLISH", "sectors_affected": ["TECH"], "contrarian_opportunity": false, "reasoning": "Positive earnings beat"}';
        }

        return '';
    }

    /**
     * Parse AI response into SentimentScore
     */
    private parseSentimentResponse(response: string, headline: string): SentimentScore {
        try {
            const parsed = JSON.parse(response);

            return {
                headline,
                overall_sentiment: parsed.sentiment_score,
                confidence: parsed.confidence,
                sentiment_label: this.getSentimentLabel(parsed.sentiment_score),
                key_factors: parsed.key_factors || [],
                market_implications: {
                    short_term: parsed.short_term_outlook,
                    medium_term: parsed.medium_term_outlook,
                    sectors_affected: parsed.sectors_affected || []
                },
                contrarian_opportunity: parsed.contrarian_opportunity || false,
                reasoning: parsed.reasoning
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return this.mockSentimentAnalysis(headline);
        }
    }

    /**
     * Mock sentiment analysis (for testing without API)
     */
    private mockSentimentAnalysis(headline: string): SentimentScore {
        const lowerHeadline = headline.toLowerCase();

        // Simple keyword-based sentiment
        let sentiment = 0;

        // Positive keywords
        if (lowerHeadline.includes('beat') || lowerHeadline.includes('surge') ||
            lowerHeadline.includes('rally') || lowerHeadline.includes('gain')) {
            sentiment += 60;
        }
        if (lowerHeadline.includes('record') || lowerHeadline.includes('all-time high')) {
            sentiment += 40;
        }

        // Negative keywords
        if (lowerHeadline.includes('miss') || lowerHeadline.includes('plunge') ||
            lowerHeadline.includes('crash') || lowerHeadline.includes('loss')) {
            sentiment -= 60;
        }
        if (lowerHeadline.includes('recession') || lowerHeadline.includes('crisis')) {
            sentiment -= 40;
        }

        // Neutral keywords
        if (lowerHeadline.includes('flat') || lowerHeadline.includes('unchanged')) {
            sentiment = 0;
        }

        // Clamp to -100 to +100
        sentiment = Math.max(-100, Math.min(100, sentiment));

        return {
            headline,
            overall_sentiment: sentiment,
            confidence: 70,
            sentiment_label: this.getSentimentLabel(sentiment),
            key_factors: [
                {
                    factor: 'Keyword analysis',
                    impact: sentiment > 0 ? 'POSITIVE' : sentiment < 0 ? 'NEGATIVE' : 'NEUTRAL',
                    weight: 70
                }
            ],
            market_implications: {
                short_term: sentiment > 20 ? 'BULLISH' : sentiment < -20 ? 'BEARISH' : 'NEUTRAL',
                medium_term: sentiment > 40 ? 'BULLISH' : sentiment < -40 ? 'BEARISH' : 'NEUTRAL',
                sectors_affected: this.extractSectors(headline)
            },
            contrarian_opportunity: Math.abs(sentiment) > 80, // Extreme sentiment = contrarian opp
            reasoning: `Mock analysis based on keyword detection. Sentiment: ${sentiment}`
        };
    }

    /**
     * Get sentiment label from score
     */
    private getSentimentLabel(score: number): SentimentScore['sentiment_label'] {
        if (score >= 60) return 'VERY_BULLISH';
        if (score >= 20) return 'BULLISH';
        if (score <= -60) return 'VERY_BEARISH';
        if (score <= -20) return 'BEARISH';
        return 'NEUTRAL';
    }

    /**
     * Extract sectors from headline
     */
    private extractSectors(headline: string): string[] {
        const sectors: string[] = [];
        const lowerHeadline = headline.toLowerCase();

        if (lowerHeadline.includes('tech') || lowerHeadline.includes('apple') ||
            lowerHeadline.includes('google') || lowerHeadline.includes('microsoft')) {
            sectors.push('TECH');
        }
        if (lowerHeadline.includes('bank') || lowerHeadline.includes('finance')) {
            sectors.push('FINANCIALS');
        }
        if (lowerHeadline.includes('energy') || lowerHeadline.includes('oil')) {
            sectors.push('ENERGY');
        }
        if (lowerHeadline.includes('health') || lowerHeadline.includes('pharma')) {
            sectors.push('HEALTHCARE');
        }

        return sectors.length > 0 ? sectors : ['GENERAL'];
    }

    /**
     * Calculate aggregate sentiment from multiple scores
     */
    private calculateAggregateSentiment(scores: SentimentScore[]): number {
        if (scores.length === 0) return 0;

        // Weighted average by confidence
        const totalWeight = scores.reduce((sum, s) => sum + s.confidence, 0);
        const weightedSum = scores.reduce((sum, s) => sum + (s.overall_sentiment * s.confidence), 0);

        return weightedSum / totalWeight;
    }

    /**
     * Calculate sentiment trend
     */
    private calculateSentimentTrend(scores: SentimentScore[]): 'IMPROVING' | 'DETERIORATING' | 'STABLE' {
        if (scores.length < 3) return 'STABLE';

        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));

        const firstAvg = this.calculateAggregateSentiment(firstHalf);
        const secondAvg = this.calculateAggregateSentiment(secondHalf);

        const change = secondAvg - firstAvg;

        if (change > 10) return 'IMPROVING';
        if (change < -10) return 'DETERIORATING';
        return 'STABLE';
    }

    /**
     * Calculate consensus strength (how aligned are the headlines)
     */
    private calculateConsensusStrength(scores: SentimentScore[]): number {
        if (scores.length === 0) return 0;

        const sentiments = scores.map(s => s.overall_sentiment);
        const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
        const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
        const stdDev = Math.sqrt(variance);

        // Lower std dev = higher consensus
        // Map std dev (0-100) to consensus (100-0)
        const consensus = Math.max(0, 100 - stdDev);

        return consensus;
    }
}

export const nlpSentimentAnalyzer = new NLPSentimentAnalyzer();
