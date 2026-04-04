import { systemBus, SystemEvent } from '../central-command/communication-hub';

// Mock Agents
interface ReviewAgent {
    generateReview(tradeData: any): Promise<{ rating: number, lessons: string[] }>;
}

export class ReviewManager {
    private reviewAgent: ReviewAgent;

    constructor() {
        console.log('[REVIEW_MANAGER] 📝 Initializing...');

        // Initialize Agents
        this.reviewAgent = {
            generateReview: async (data) => ({
                rating: 95,
                lessons: ['Great patience on entry', 'Exited too early on 50%']
            })
        };

        this.setupListeners();
    }

    private setupListeners() {
        systemBus.on(SystemEvent.TRADE_CLOSED, this.conductPostMortem.bind(this));
    }

    private async conductPostMortem(payload: any) {
        console.log(`[REVIEW_MANAGER] 🧐 Analyzing Closed Trade: ${payload.ticker} (PnL: ${payload.pnl})`);

        // Generate Report
        const review = await this.reviewAgent.generateReview(payload);

        // Broadcast Results to close the loop
        console.log(`[REVIEW_MANAGER] ✅ Review Complete. Rating: ${review.rating}/100`);

        systemBus.emitEvent(SystemEvent.REVIEW_COMPLETED, {
            tradeId: payload.tradeId,
            rating: review.rating,
            lessonsLearned: review.lessons,
            improvements: ['Hold runners longer']
        });
    }
}

export const reviewManager = new ReviewManager();
