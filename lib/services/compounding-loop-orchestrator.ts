
import { knowledgeSyncService } from './knowledge-sync-service';
import { dailyStudyOrchestrator } from './daily-study-orchestrator';

export class CompoundingLoopOrchestrator {
    private static instance: CompoundingLoopOrchestrator;
    private currentTickers: string[] = ['SPY', 'QQQ', 'NVDA'];

    private constructor() {
        console.log('🏗️ CompoundingLoopOrchestrator initialized');
    }

    public static getInstance(): CompoundingLoopOrchestrator {
        if (!CompoundingLoopOrchestrator.instance) {
            CompoundingLoopOrchestrator.instance = new CompoundingLoopOrchestrator();
        }
        return CompoundingLoopOrchestrator.instance;
    }

    /**
     * STAGE 1: 9:00 AM - H200 Startup & AM Sync
     */
    public async runMorningRoutine(): Promise<void> {
        console.log('🌅 [9:00 AM] H200 CLOUD STARTUP');
        // Fetch yesterday's study results from local/cloud storage
        // Inject into H200's brain
        await knowledgeSyncService.syncAMKnowledge({
            sessionId: 'yesterday_session',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            blocks: [],
            summary: 'Injecting compounded lessons into H200.'
        });

        console.log('🚀 H200 is now primary for high-compute morning session.');
    }

    /**
     * STAGE 2: 11:55 AM - Smooth Handover (H200 -> LAPTOP)
     */
    public async runHandoverRoutine(): Promise<void> {
        console.log('🤝 [11:55 AM] STARTING SMOOTH TRANSITION (H200 -> LAPTOP)');
        await knowledgeSyncService.initiateSmoothHandover('LAPTOP');
        console.log('✅ [12:05 PM] LAPTOP is now primary for the afternoon session.');
    }

    /**
     * STAGE 3: 4:15 PM - Post-Market Compounding Session
     */
    public async runStudyRoutine(): Promise<void> {
        console.log('🎓 [4:15 PM] STARTING 2-HOUR COMPOUNDING SESSION');
        const session = await dailyStudyOrchestrator.startStudySession(this.currentTickers);

        // Final Sync back to H200 (for tomorrow morning)
        await knowledgeSyncService.syncAMKnowledge(session);
        console.log('✅ Daily compounding complete. Intelligence levels increased.');
    }

    /**
     * Helper to track the time-based handover.
     */
    public async checkSchedule(): Promise<void> {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const timeValue = hour * 100 + minute;

        if (timeValue === 900) {
            await this.runMorningRoutine();
        } else if (timeValue === 1155) {
            await this.runHandoverRoutine();
        } else if (timeValue === 1615) {
            await this.runStudyRoutine();
        }
    }
}

export const compoundingLoopOrchestrator = CompoundingLoopOrchestrator.getInstance();
