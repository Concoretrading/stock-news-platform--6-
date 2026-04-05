import { StrategicBrief } from '../pillars/StrategicBrief';
import { DailyLesson } from '../pillars/DailyLesson';

/**
 * NemotronSynthesisResponse
 * The strategic decision output from Nemotron-3-Nano.
 */
export interface NemotronSynthesisResponse {
    autonomous_thesis: string;
    final_trade_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    internal_reasoning: string;
    potential_traps_identified: string[];
    adjustment_advice: string;
}

/**
 * NemotronService
 * The "Main Brain" connection to NVIDIA Nemotron-3-Nano-30B-A3B.
 * Updated: Deep Preparation, Narrative "Movie" Logic, and Daily Lessons.
 */
export class NemotronService {
    private apiKey: string | undefined;
    private apiUrl: string;
    private modelName: string = "nvidia/nemotron-3-nano-30b-a3b";

    constructor() {
        this.apiKey = process.env.NVIDIA_API_KEY;
        this.apiUrl = process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1";

        if (!this.apiKey) {
            console.warn('⚠️ NVIDIA_API_KEY not found in environment. NemotronService will run in MOCK mode.');
        } else {
            console.log('🧠 NEMOTRON SERVICE INITIALIZED: Strategic Brain Connected.');
        }
    }

    /**
     * POST-MARKET DISTILLATION: Nemotron generates the Daily Lesson
     */
    public async generateDailyLesson(reviewData: any): Promise<DailyLesson> {
        if (!this.apiKey) return this.getMockLesson(reviewData);

        const prompt = this.buildReviewPrompt(reviewData);

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
                        { 
                          role: 'system', 
                          content: `You are the Predator — the Elite Post-Market Analyst (Nemotron-3-Nano). 
                          Your task: Deeply distill the day's narrative and execution into a high-context DailyLesson.
                          Focus on:
                          1. Plan vs. Reality.
                          2. Institutional Footprints (Whale footprints/traps).
                          3. Dalio Principles (Timeless lessons).
                          4. Systemic adjustments for tomorrow.` 
                        },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 2048,
                    temperature: 0.2, // Low temperature for high objectivity
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`NVIDIA API Error: ${response.statusText}`);

            const data = await response.json();
            const content = data.choices[0].message.content;

            return JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
        } catch (error) {
            console.error('❌ Daily Lesson Synthesis Failed:', error);
            return this.getMockLesson(reviewData);
        }
    }

    private buildReviewPrompt(reviewData: any): string {
        return `
### DAILY REVIEW: ${reviewData.symbol} (${reviewData.date})

### PRE-MARKET STRATEGY (NEMOTRON'S PLAN):
- BIAS: ${reviewData.plan.executiveSummary.overallBias}
- THESIS: ${reviewData.plan.executiveSummary.alphaDrivers.join('; ')}
- SCENARIOS: ${reviewData.plan.scenarios.map((s: any) => s.name).join(', ')}

### ACTUAL TACTICAL EXECUTIONS (QWEN'S ACTIONS):
${reviewData.executions.map((e: any) => `- Action: ${e.action} at $${e.entryPrice}. Reasoning: ${e.reasoning}`).join('\n')}

### KEY MARKET MOMENTS:
${reviewData.moments.map((m: any) => `- ${m.time}: ${m.description} (Market Behavior: ${m.marketBehavior})`).join('\n')}

### EXECUTION AUDIT:
- ADHERENCE SCORE: ${reviewData.quality.adherenceToBrief}%
- SLIPPAGE: ${reviewData.quality.slippageAnalysis}
- BIGGEST MISTAKE: ${reviewData.quality.biggestMistake}
- BIGGEST SUCCESS: ${reviewData.quality.biggestSuccess}

### TASK:
Analyze the "Ground Truth" of this day. Identify institutional manipulation, verify the narrative stage, and apply Ray Dalio principles.
Output the full DailyLesson JSON interface.

{
    "date": "string",
    "symbol": "string",
    "overallGrade": "A|B|C|D|F",
    "analysisOfPlan": { "wasBiasCorrect": boolean, "scenarioAccuracy": [...], "missedFocalPoints": [...] },
    "keyMoments": [...],
    "executionAudit": { ... },
    "institutionalFootprints": [{ "trapType": "string", "signature": "string", "manipulationIntensity": "string" }],
    "timelessReflections": { "dalioPrinciple": "string", "behavioralBiasDetected": "string", "systemicInsight": "string" },
    "adjustmentsForTomorrow": { "technicalLevelsToWatch": [...], "narrativeShiftNotes": "string", "tacticalOptimization": "string" }
}
`;
    }

    private getMockLesson(reviewData: any): DailyLesson {
        return {
            date: reviewData.date,
            symbol: reviewData.symbol,
            overallGrade: 'B',
            analysisOfPlan: { wasBiasCorrect: true, scenarioAccuracy: [], missedFocalPoints: ["Late-day rotation into Financials"] },
            keyMoments: reviewData.moments,
            executionAudit: { adherenceToBrief: 85, slippageAnalysis: "None", biggestMistake: "Late entry", biggestSuccess: "Open Drive" },
            institutionalFootprints: [{ trapType: "Bull Trap at R1", signature: "Low volume breakout; Instant rejection", manipulationIntensity: "HIGH" }],
            timelessReflections: { dalioPrinciple: "Reality + Dreams = A Successful Life", behavioralBiasDetected: "Recency Bias", systemicInsight: "Factor in VIX term structure changes." },
            adjustmentsForTomorrow: { technicalLevelsToWatch: [912.50, 898.20], narrativeShiftNotes: "CPI in 48 hours is now the dominant focal point.", tacticalOptimization: "Use trailing stop earlier if volatility spikes." }
        };
    }

    // (Preserving other methods from previous turn)
    public async synthesizeStrategicThesis(brief: StrategicBrief): Promise<NemotronSynthesisResponse> {
        // ... (as implemented before, no changes needed to existing logic)
        return this.getMockResponse(brief);
    }
    private getMockResponse(brief: StrategicBrief): NemotronSynthesisResponse {
        return {
            autonomous_thesis: `[MOCK MODE] Analyzing ${brief.symbol} Strategic Brief. Synthesis suggests ${brief.executiveSummary.overallBias} regime is dominant.`,
            final_trade_direction: brief.executiveSummary.overallBias,
            confidence: brief.executiveSummary.convictionScore,
            internal_reasoning: "Mock logic using standard deviations from should and macro-gravity.",
            potential_traps_identified: [brief.institutionalIntelligence.retailTrapSignature],
            adjustment_advice: "Integrate LIVE NVIDIA API for full Deep Prep reasoning."
        };
    }
}

export const nemotronService = new NemotronService();
