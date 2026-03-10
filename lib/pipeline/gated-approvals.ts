import { StrategicSuggestion } from '../services/education-advisor';
import { SystematicTrainingEngine } from '../services/systematic-training-engine';

export interface ApprovalMetrics {
    sharpeDelta: number;
    drawdownDelta: number;
    winRateDelta: number;
    correlationToHerd: number;
}

export class GatedApprovals {
    private static instance: GatedApprovals;
    private suggestions: StrategicSuggestion[] = [];

    private constructor() {
        console.log('🛡️ GatedApprovals service initialized');
    }

    public static getInstance(): GatedApprovals {
        if (!GatedApprovals.instance) {
            GatedApprovals.instance = new GatedApprovals();
        }
        return GatedApprovals.instance;
    }

    /**
     * Submits a suggestion for formal gating.
     */
    public async submitSuggestion(suggestion: StrategicSuggestion) {
        suggestion.status = 'backtesting';
        this.suggestions.push(suggestion);
        console.log(`📡 Suggestion [${suggestion.id}] moved to BACKTESTING`);

        // Trigger automated backtest
        await this.runBacktest(suggestion);
    }

    private async runBacktest(suggestion: StrategicSuggestion) {
        const engine = SystematicTrainingEngine.getInstance();

        console.log(`📈 Requesting shadow validation for suggestion: ${suggestion.title}`);

        // Call the real engine integration
        const results = await engine.validateSuggestion(suggestion);

        if (this.validateMetrics(results)) {
            suggestion.status = 'shadow_mode';
            console.log(`👤 Suggestion [${suggestion.id}] PASSED Backtest. Moving to SHADOW_MODE.`);
        } else {
            suggestion.status = 'rejected';
            console.log(`❌ Suggestion [${suggestion.id}] REJECTED due to poor metrics or herd correlation.`);
        }
    }


    private validateMetrics(metrics: ApprovalMetrics): boolean {
        // Strict Predator Rules
        if (metrics.correlationToHerd > 0.2) return false; // Too herd-like
        if (metrics.drawdownDelta > 0.05) return false; // Too risky
        return metrics.sharpeDelta > 0;
    }

    public getActiveSuggestions() {
        return this.suggestions.filter(s => s.status !== 'rejected');
    }
}

export const gatedApprovals = GatedApprovals.getInstance();
