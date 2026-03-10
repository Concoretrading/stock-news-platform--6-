
// Narrative Lifecycle Reference Layer
// Sole purpose: To define the "Life Span" of news and its emotional flow stages.
// Based on the "Movie Flow" concept: Breaking News -> Selective Justification -> Peak Emotion -> Displacement.

export type NarrativeStage = 'THE_HOOK' | 'THE_SCRIPT' | 'THE_CLIMAX' | 'THE_FADE';

export interface NarrativeLifecycleConcept {
    stage: NarrativeStage;
    description: string;
    flow_feeling: string; // The "Feeling" in the movie
    market_prey_mechanism: string; // How the market preys on this stage
    behavioral_tell: string; // What to look for in data/behavior
    reversal_probability: number; // 0-1
    duration_weight: number; // Relative length of this stage
}

export const NARRATIVE_LIFECYCLE: NarrativeLifecycleConcept[] = [
    {
        stage: 'THE_HOOK',
        description: 'Initial breaking news or shock event. High confusion.',
        flow_feeling: 'Shock / Fear / Sudden Excitement',
        market_prey_mechanism: 'Initial knee-jerk flush or rip. HFT-dominated noise.',
        behavioral_tell: 'Availability Heuristic - recent vivid event dominates perception.',
        reversal_probability: 0.1,
        duration_weight: 0.1
    },
    {
        stage: 'THE_SCRIPT',
        description: 'Selective sharing of information to justify and sustain a trend.',
        flow_feeling: 'Building Conviction / Narrative Consolidation',
        market_prey_mechanism: 'Creating a "Logical" reason for the move to trap late participants.',
        behavioral_tell: 'Confirmation Bias - seeking info that supports the new trend.',
        reversal_probability: 0.3,
        duration_weight: 0.5
    },
    {
        stage: 'THE_CLIMAX',
        description: 'Peak emotion. Hectic, extreme sentiment, maximum attention.',
        flow_feeling: 'Hysteria / Total Panic / Infinite Greed',
        market_prey_mechanism: 'Liquidity trap. Counter-trend moves begin as the crowd is most certain.',
        behavioral_tell: 'Irrational Exuberance or Capitulation. Herd saturation.',
        reversal_probability: 0.9,
        duration_weight: 0.2
    },
    {
        stage: 'THE_FADE',
        description: 'Narrative displacement. New events shift attention. Cooling off.',
        flow_feeling: 'Exhaustion / Boredom / Shifted Focus',
        market_prey_mechanism: 'Slow bleed or slow recovery as the "Truth" settles and attention moves elsewhere.',
        behavioral_tell: 'Narrative Fallacy begins to fail. Volume declines.',
        reversal_probability: 0.5,
        duration_weight: 0.2
    }
];

export class NarrativeLifecycleReference {
    constructor() {
        console.log('🎬 INITIALIZED: Narrative Lifecycle Reference Layer (Movie Flow Logic)');
    }

    public getStage(stage: NarrativeStage): NarrativeLifecycleConcept | undefined {
        return NARRATIVE_LIFECYCLE.find(s => s.stage === stage);
    }

    public getNextStage(current: NarrativeStage): NarrativeStage {
        const order: NarrativeStage[] = ['THE_HOOK', 'THE_SCRIPT', 'THE_CLIMAX', 'THE_FADE'];
        const idx = order.indexOf(current);
        return order[(idx + 1) % order.length];
    }

    public formatInsight(stage: NarrativeStage): string {
        const concept = this.getStage(stage);
        if (!concept) return `🎬 NARRATIVE: Unknown Stage`;
        return `🎬 NARRATIVE [${concept.stage}]: ${concept.description}\n   Feeling: ${concept.flow_feeling}\n   Prey Logic: ${concept.market_prey_mechanism}`;
    }
}

export const narrativeLifecycleReference = new NarrativeLifecycleReference();
