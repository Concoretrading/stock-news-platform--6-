
import { StrategicSuggestion } from '../services/education-advisor';

export interface ScalingDecision {
    multiplier: number;
    reason: string;
    convictionScore: number;
}

export class HighConvictionScaling {
    private static instance: HighConvictionScaling;

    private constructor() {
        console.log('⚖️ INITIALIZING HIGH-CONVICTION RISK MODULE (Bigger Risk for Precise Levels)...');
    }

    public static getInstance(): HighConvictionScaling {
        if (!HighConvictionScaling.instance) {
            HighConvictionScaling.instance = new HighConvictionScaling();
        }
        return HighConvictionScaling.instance;
    }

    /**
     * Calculates if a suggestion warrants a "High-Conviction" risk multiplier.
     */
    public calculateScaling(suggestion: StrategicSuggestion, confluenceScore: number): ScalingDecision {
        let multiplier = 1.0;
        let reason = "Standard sizing applied.";
        const precisionKeywords = ['precise level', 's1', 'r1', 'pivot bank', 'gap fill zone'];

        // Logic: Scaling increases based on Confluence + User's Precision
        if (confluenceScore >= 90) {
            multiplier = 2.0;
            reason = "EXCEPTIONAL CONFLUENCE (90%+): Doubling risk for high-probability setup.";
        }

        const isPrecise = precisionKeywords.some(key => suggestion.logic.toLowerCase().includes(key));
        if (isPrecise && confluenceScore >= 80) {
            multiplier *= 1.5;
            reason += " | PRECISE LEVEL DETECTED: Scaling up due to prepared level accuracy.";
        }

        // Cap scaling for safety
        multiplier = Math.min(3.0, multiplier);

        return {
            multiplier,
            reason,
            convictionScore: confluenceScore
        };
    }
}

export const highConvictionScaling = HighConvictionScaling.getInstance();
