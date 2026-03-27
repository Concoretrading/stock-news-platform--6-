
import axios from 'axios';

export interface GrokIntelligence {
    consensus: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    intel_score: number; // 0-100 conviction
    engagement_velocity: number; // 0-100 speed of spread
    is_whisper: boolean; // True if rumor hasn't hit mainstream yet
    rumor_category?: 'product_leak' | 'm_and_a' | 'management_shift' | 'regulatory_leak' | 'none';
    narrative_archetype?: 'WHISPER' | 'PUMP' | 'DUMP' | 'STABILIZATION';
    catalyst_details: string[];
    social_shocks: string[];
    raw_insight: string;
}

export class GrokService {
    private apiKey: string;
    private baseUrl = 'https://api.x.ai/v1';

    constructor() {
        this.apiKey = process.env.XAI_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ XAI_API_KEY NOT FOUND: GrokService will be limited.');
        }
    }

    /**
     * Analyze social consensus and rumors for a specific ticker
     * Enhanced with "Predatory" rumor categories and engagement filtering.
     */
    async analyzeSocialIntelligence(ticker: string): Promise<GrokIntelligence> {
        try {
            const prompt = `
                Act as a "Predator" trading floor intelligence officer.
                Analyze the current X (Twitter) social consensus and leaks for $${ticker}.
                
                CRITICAL INSTRUCTION: Ignore all random retail noise, "big order" guesses, and generic hype (e.g., "to the moon"). 
                Only focus on high-signal, verifiable catalysts:
                - Partnerships or Joint Ventures (confirmed or whispered).
                - New Product specs, launches, or upgrades (e.g., "FDA approval", "Blackwell specs").
                - Delays, Cancellations, or Production issues.
                - Regulatory/SEC filing whispers.

                Filter for credibility:
                - Verified accounts with historical accuracy.
                - High engagement (quality over quantity).
                - Specificity: Search for "Partnership", "Product", "Delay", "Leak".

                Respond in JSON format:
                {
                    "consensus": "bullish" | "bearish" | "neutral" | "mixed",
                    "intel_score": number (0-100 conviction),
                    "engagement_velocity": number (0-100 speed of spread),
                    "is_whisper": boolean (true if pre-news rumor),
                    "rumor_category": "product_leak" | "m_and_a" | "management_shift" | "regulatory_leak" | "none",
                    "narrative_archetype": "WHISPER" | "PUMP" | "DUMP" | "STABILIZATION",
                    "catalyst_details": ["specific details on partnerships/products/delays"],
                    "social_shocks": ["list of narrative shifts from credible sources"],
                    "raw_insight": "One sentence 'Predator' summary focusing on the credible driver"
                }
            `;

            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'grok-beta',
                messages: [
                    { role: 'system', content: 'You are an elite financial intelligence AI with real-time access to X.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            console.error(`❌ Error fetching Grok intelligence for ${ticker}:`, error);
            return {
                consensus: 'neutral',
                intel_score: 0,
                engagement_velocity: 0,
                is_whisper: false,
                catalyst_details: [],
                social_shocks: [],
                raw_insight: 'Intelligence stream offline.'
            };
        }
    }
}

export const grokService = new GrokService();
