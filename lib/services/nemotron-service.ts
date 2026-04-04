
/**
 * NemotronService
 * The "Main Brain" connection to NVIDIA Nemotron 3 Super.
 * Engineered for high-context financial reasoning and autonomous decision making.
 */

export interface NemotronSynthesisRequest {
    ticker: string;
    currentPrice: number;
    expertSignals: {
        psychology: any;
        behavioral: any;
        flow: any;
        news: any;
        technical: any;
    };
    macroContext: string;
    reasoningBudget: number; // 0-100 depth of thinking
}

export interface NemotronSynthesisResponse {
    autonomous_thesis: string;
    final_trade_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    internal_reasoning: string;
    potential_traps_identified: string[];
    adjustment_advice: string;
}

export class NemotronService {
    private apiKey: string | undefined;
    private apiUrl: string;
    private modelName: string = "meta/llama-3.3-70b-instruct";

    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.apiUrl = process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1";

        if (!this.apiKey) {
            console.warn('⚠️ NVIDIA_API_KEY not found in environment. NemotronService will run in MOCK mode.');
        } else {
            console.log('🧠 NEMOTRON SERVICE INITIALIZED: Main Brain Connected.');
        }
    }

    /**
     * Synthesize all intelligence into a single autonomous decision.
     */
    public async synthesizeIntelligence(request: NemotronSynthesisRequest): Promise<NemotronSynthesisResponse> {
        if (!this.apiKey) {
            return this.getMockResponse(request);
        }

        const prompt = this.buildSynthesisPrompt(request);

        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        { role: 'system', content: 'You are the Predator — an elite AI trading brain. Synthesize signals and return a JSON trade decision. Be decisive. Identify market maker traps. Think like Ray Dalio.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1024,
                    temperature: 0.1,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`NVIDIA API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Attempt to parse structured response from LLM content
            return this.parseResponse(content);
        } catch (error) {
            console.error('❌ Nemotron Synthesis Failed:', error);
            return this.getMockResponse(request);
        }
    }

    private buildSynthesisPrompt(request: NemotronSynthesisRequest): string {
        return `
### MARKET ANALYSIS REQUEST: ${request.ticker}
CURRENT PRICE: $${request.currentPrice}
MACRO CONTEXT: ${request.macroContext}

### EXPERT SIGNALS:
- PSYCHOLOGY: ${JSON.stringify(request.expertSignals.psychology)}
- BEHAVIORAL BIASED: ${JSON.stringify(request.expertSignals.behavioral)}
- FLOW/MANIPULATION: ${JSON.stringify(request.expertSignals.flow)}
- NEWS GRAVITY: ${JSON.stringify(request.expertSignals.news)}
- TECHNICALS: ${JSON.stringify(request.expertSignals.technical)}

### TASK:
Analyze the above signals. Identify if current retail is being trapped by institutional manipulation. Reason through the "Expectation vs. Shock" logic. Provide a final autonomous thesis and decision.

RESPONSE FORMAT (JSON):
{
    "autonomous_thesis": "...",
    "final_trade_direction": "BULLISH|BEARISH|NEUTRAL",
    "confidence": 0-100,
    "internal_reasoning": "Chain of thought logic here",
    "potential_traps_identified": ["trap 1", "trap 2"],
    "adjustment_advice": "Advice for position sizing/timing"
}
`;
    }

    private parseResponse(content: string): NemotronSynthesisResponse {
        try {
            // Very simple JSON extraction
            const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn('⚠️ Failed to parse Nemotron JSON response, returning fallback.');
            return {
                autonomous_thesis: "Synthesized logic provided by Nemotron brain.",
                final_trade_direction: 'NEUTRAL',
                confidence: 50,
                internal_reasoning: content,
                potential_traps_identified: [],
                adjustment_advice: "Wait for more clarity."
            };
        }
    }

    private getMockResponse(request: NemotronSynthesisRequest): NemotronSynthesisResponse {
        return {
            autonomous_thesis: `[MOCK MODE] Analyzing ${request.ticker} at ${request.currentPrice}. Synthesis of signals suggests retail is chasing a gap that institutions are fading.`,
            final_trade_direction: 'NEUTRAL',
            confidence: 65,
            internal_reasoning: "Mock logic: Mixed signals in dark pool flow vs news sentiment.",
            potential_traps_identified: ["Euphoric Gap Up", "Low Volume Support"],
            adjustment_advice: "Reduce risk until Nemotron API Key is provided."
        };
    }
}

export const nemotronService = new NemotronService();
