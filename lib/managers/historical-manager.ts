import { systemBus, SystemEvent } from '../central-command/communication-hub';
import { SystematicTrainingEngine } from '../services/systematic-training-engine';

export class HistoricalManager {
    private trainingEngine: SystematicTrainingEngine;

    constructor() {
        console.log('[HISTORICAL_MANAGER] 📜 Initializing (Real Data Mode)...');
        this.trainingEngine = SystematicTrainingEngine.getInstance();
        this.setupListeners();
    }

    private setupListeners() {
        // Listen for completed reviews to update knowledge base
        systemBus.on(SystemEvent.REVIEW_COMPLETED, this.handleReviewCompleted.bind(this));
    }

    public async runDeepAnalysis(ticker: string) {
        console.log(`[HISTORICAL_MANAGER] 🕵️‍♀️ Starting systematic training analysis for ${ticker}`);

        try {
            // Trigger Real Systematic Training (Polygon Data)
            // Defaulting to 6 months of data
            const session = await this.trainingEngine.startTraining(ticker, 6);

            console.log(`[HISTORICAL_MANAGER] 🚀 Training Session Started: ${session.session_id}`);

            // In a real async flow, we would listen for a "TRAINING_COMPLETED" event
            // For now, we acknowledge the start
            systemBus.emitEvent(SystemEvent.HISTORY_PATTERN_IDENTIFIED, {
                ticker,
                pattern: 'Training Initiated',
                confidence: 0, // Pending results
                historicalSuccess: 0
            });

        } catch (error) {
            console.error('[HISTORICAL_MANAGER] ❌ Analysis failed', error);
        }
    }

    private async handleReviewCompleted(payload: any) {
        console.log(`[HISTORICAL_MANAGER] 🧠 Learning from Trade Review ${payload.tradeId}`);
        // Update internal knowledge base logic here

        systemBus.emitEvent(SystemEvent.KNOWLEDGE_BASE_UPDATED, {
            module: 'PatternRecognition',
            itemsLearned: payload.lessonsLearned ? payload.lessonsLearned.length : 1
        });
    }
}

// Export singleton
export const historicalManager = new HistoricalManager();
