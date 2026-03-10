
// Mindset Coach Knowledge Reference Layer
// Sole purpose: To provide a fused framework from Mark Douglas ("Trading in the Zone") 
// and Brett Steenbarger ("The Daily Trading Coach").
// This module provides psychological coaching, probability thinking, and self-improvement loops.

export interface MindsetConcept {
    concept: string;
    author: "Mark Douglas" | "Brett Steenbarger";
    definition: string;
    mechanism: string; // The "Why"
    actionable_coaching: string; // The "Do"
    triggers: string[]; // Context keywords that activate this knowledge
}

export const MINDSET_FRAMEWORK: { [category: string]: MindsetConcept[] } = {
    "Probabilistic Mindset (Douglas)": [
        {
            concept: "The 5 Fundamental Truths",
            author: "Mark Douglas",
            definition: "1. Anything can happen. 2. You don't need to know what happens next to make money. 3. There is a random distribution of wins/losses. 4. An edge is essentially a higher probability. 5. Every moment is unique.",
            mechanism: "Accepting these truths eliminates fear and expectations.",
            actionable_coaching: "Stop trying to predict. Execute the edge without hesitation. Accept the outcome as just one data point in a large sample.",
            triggers: ["hesitation", "fear", "prediction", "expectation", "loss_aversion"]
        },
        {
            concept: "Thinking in Probabilities",
            author: "Mark Douglas",
            definition: "Viewing trading as a game of odds, not certainty. Letting the law of large numbers work for you.",
            mechanism: "Shifts focus from the 'micro' (this trade) to the 'macro' (series of trades).",
            actionable_coaching: "This trade is just one occurrence. If the setup is valid, take it. The outcome of THIS specific trade is random; the outcome of 20 trades is predictable.",
            triggers: ["uncertainty", "odds", "probability", "series", "sample_size"]
        },
        {
            concept: "The Gap (Psychological vs. Mechanical)",
            author: "Mark Douglas",
            definition: "The conflict between your desire to be right (Ego) and the market's reality.",
            mechanism: "Pain comes from the market not matching your expectations.",
            actionable_coaching: "Drop your expectations. The market owes you nothing. Be available to what is actually happening, not what you want to happen.",
            triggers: ["frustration", "anger", "revenge", "expectation_gap"]
        }
    ],
    "Consistency & Discipline (Douglas)": [
        {
            concept: "The Zone",
            author: "Mark Douglas",
            definition: "A state of mind where you are in sync with the market stream, acting without fear, hesitation, or conflict.",
            mechanism: "Achieved by fully accepting risk before the trade.",
            actionable_coaching: "Did you accept the risk? If you are anxious, you traded too big or didn't accept the potential loss. Reduce size until the fear vanishes.",
            triggers: ["anxiety", "flow_state", "sync", "harmony"]
        },
        {
            concept: "Responsibility",
            author: "Mark Douglas",
            definition: "You create your own results. The market just provides opportunities.",
            mechanism: "Taking total responsibility eliminates the victim mentality.",
            actionable_coaching: "Stop blaming the algo, the news, or the market makers. You clicked the button. Own the outcome to own the future fix.",
            triggers: ["blame", "victim", "excuse", "responsibility"]
        }
    ],
    "Self-Coaching (Steenbarger)": [
        {
            concept: "The Observing Ego",
            author: "Brett Steenbarger",
            definition: "Developing a 'third-person' perspective to monitor your own internal state while trading.",
            mechanism: "Disrupts emotional loops by stepping outside them.",
            actionable_coaching: "Talk to yourself in the third person. 'What is the trader feeling right now?' Disrupt the emotional buildup before it triggers an impulse.",
            triggers: ["emotional_loop", "impulse", "loss_of_control", "monitor"]
        },
        {
            concept: "Solution-Focused Coaching",
            author: "Brett Steenbarger",
            definition: "Focusing on what you do RIGHT and doing more of it, rather than just fixing what's wrong.",
            mechanism: "Reinforces neural pathways of success.",
            actionable_coaching: "Recall your best trade this week. What improved your state then? Re-create that environment now.",
            triggers: ["slump", "negative_spiral", "confidence_loss", "focus"]
        },
        {
            concept: "Cognitive Reframing",
            author: "Brett Steenbarger",
            definition: "Changing the emotional meaning of an event by changing the narrative.",
            mechanism: "A loss isn't a failure; it's a tuition payment for data.",
            actionable_coaching: "Reframe this loss: It just paid for a valuable lesson on [Market Context]. Document the lesson so the tuition isn't wasted.",
            triggers: ["failure", "depression", "giving_up", "bad_day"]
        }
    ]
};

export class MindsetCoachReference {
    constructor() {
        console.log('🧘 INITIALIZED: Mindset Coach Reference Layer (Douglas/Steenbarger)');
    }

    /**
     * Retrieves relevant mindset concepts based on context triggers.
     * @param contextKeywords strings describing the current market/trader state
     */
    public getRelevantConcepts(contextKeywords: string[]): MindsetConcept[] {
        const results: MindsetConcept[] = [];
        const seen = new Set<string>();

        // Iterate through all categories
        Object.values(MINDSET_FRAMEWORK).forEach(categoryList => {
            categoryList.forEach(concept => {
                const isRelevant = concept.triggers.some(trigger =>
                    contextKeywords.some(ctx => ctx.toLowerCase().includes(trigger.toLowerCase()))
                );

                if (isRelevant && !seen.has(concept.concept)) {
                    results.push(concept);
                    seen.add(concept.concept);
                }
            });
        });

        return results;
    }

    /**
     * Formats a concept into a coaching message.
     */
    public formatCoaching(concept: MindsetConcept): string {
        return `🧠 COACHING [${concept.author}]: ${concept.concept}\n   "${concept.actionable_coaching}"`;
    }
}

export const mindsetCoachReference = new MindsetCoachReference();
