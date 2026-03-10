
import { NarrativeStage, narrativeLifecycleReference } from '../knowledge/narrative-lifecycle-reference';

export type ExpectationStatus = 'SHOCK' | 'EXPECTED' | 'DISPLACED';

export interface ActiveNarrative {
    id: string;
    topic: string; // e.g., "War in Region X", "Tech AI Hype"
    current_stage: NarrativeStage;
    intensity: number; // 1-100
    shock_factor: number; // Delta from expected (e.g. 0-10)
    expectation_status: ExpectationStatus;
    start_time: string;
    last_update_time: string;
    tags: string[];
}

export interface DisplacementReport {
    displaced_topic: string;
    new_driver: string;
    intensity_drop: number;
    reason: string;
}

export class NarrativeFlowEngine {
    private static instance: NarrativeFlowEngine;
    private activeNarratives: Map<string, ActiveNarrative> = new Map();

    private constructor() {
        console.log('🎞️ NARRATIVE FLOW ENGINE ONLINE');
    }

    public static getInstance(): NarrativeFlowEngine {
        if (!NarrativeFlowEngine.instance) {
            NarrativeFlowEngine.instance = new NarrativeFlowEngine();
        }
        return NarrativeFlowEngine.instance;
    }

    /**
     * Registers or updates a narrative based on new news.
     */
    public processNews(topic: string, keywords: string[], data?: { actual: number, expected: number, stdDev?: number }): { narrative: ActiveNarrative, displacement?: DisplacementReport } {
        const id = this.generateId(topic);
        let narrative = this.activeNarratives.get(id);

        let shockFactor = 0;
        let status: ExpectationStatus = 'EXPECTED';

        if (data) {
            const delta = Math.abs(data.actual - data.expected);
            const sd = data.stdDev || 1.0;
            shockFactor = delta / sd;
            if (shockFactor > 2.0) status = 'SHOCK';
        }

        const initialIntensity = status === 'SHOCK' ? 80 : 50;

        if (!narrative) {
            // Check for Displacement before creating new
            const displacement = this.checkDisplacement(topic, initialIntensity);

            narrative = {
                id,
                topic,
                current_stage: 'THE_HOOK',
                intensity: initialIntensity,
                shock_factor: parseFloat(shockFactor.toFixed(2)),
                expectation_status: status,
                start_time: new Date().toISOString(),
                last_update_time: new Date().toISOString(),
                tags: keywords
            };
            this.activeNarratives.set(id, narrative);

            return { narrative, displacement };
        } else {
            // Update existing narrative stage
            const nextStage = narrativeLifecycleReference.getNextStage(narrative.current_stage);
            narrative.current_stage = nextStage;
            narrative.intensity = Math.min(100, narrative.intensity + 10 + (status === 'SHOCK' ? 15 : 0));
            narrative.shock_factor = parseFloat(shockFactor.toFixed(2));
            narrative.expectation_status = status;
            narrative.last_update_time = new Date().toISOString();

            return { narrative };
        }
    }

    /**
     * Detects if a new narrative "displaces" (cools off) existing ones.
     */
    private checkDisplacement(newTopic: string, newIntensity: number): DisplacementReport | undefined {
        if (this.activeNarratives.size === 0) return undefined;

        // Find the most intense existing narrative
        let strongest: ActiveNarrative | undefined;
        const narratives = Array.from(this.activeNarratives.values());
        for (const n of narratives) {
            if (!strongest || n.intensity > strongest.intensity) {
                strongest = n;
            }
        }

        if (strongest && newIntensity > 70) {
            const drop = newIntensity > 90 ? 40 : 30; // More aggressive drop for extreme news
            strongest.intensity = Math.max(0, strongest.intensity - drop);

            // If intensity drops significantly or new driver is extreme, move to THE_FADE
            if (strongest.intensity < 50 || newIntensity > 90) {
                strongest.current_stage = 'THE_FADE';
            }

            return {
                displaced_topic: strongest.topic,
                new_driver: newTopic,
                intensity_drop: drop,
                reason: `New dominant driver [${newTopic}] has entered the frame, cooling off [${strongest.topic}].`
            };
        }

        return undefined;
    }

    public getActiveNarratives(): ActiveNarrative[] {
        return Array.from(this.activeNarratives.values());
    }

    private generateId(topic: string): string {
        return topic.toLowerCase().replace(/\s+/g, '-');
    }

    /**
     * Provides a "Peak Emotion" check for contrarian signals.
     */
    public isPeakEmotion(topic: string): boolean {
        const narrative = this.activeNarratives.get(this.generateId(topic));
        return narrative?.current_stage === 'THE_CLIMAX' && narrative.intensity >= 85;
    }
}

export const narrativeFlowEngine = NarrativeFlowEngine.getInstance();
