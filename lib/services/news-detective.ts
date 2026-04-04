
import { newsGravityAnalyzer } from './news-gravity-analyzer';
import { bigMoneyFlowInterpreter } from './big-money-flow-interpreter';
import { DETECTIVE_RUBRIC, DetectiveAnalysis } from '../knowledge/detective-rubric';
import { polygonDataProvider } from './polygon-data-provider';

export interface RawNewsSignal {
    source: string; // 'X', 'POLYGON', 'OFFICIAL', 'MANUAL'
    handle?: string;
    headline: string;
    content: string;
    timestamp: string;
    ticker?: string;
}

export class NewsDetective {
    private static instance: NewsDetective;

    private highSignalHandles = [
        'Benzinga', 'zerohedge', 'LiveSquawk', 'EarningsWhispers',
        'CBOE', 'federalreserve', 'KobeissiLetter'
    ];

    private constructor() {
        console.log('🕵️ INITIALIZING NEWS DETECTIVE LAYER (The Investigator)...');
    }

    public static getInstance(): NewsDetective {
        if (!NewsDetective.instance) {
            NewsDetective.instance = new NewsDetective();
        }
        return NewsDetective.instance;
    }

    /**
     * The Mandatory 5-Step Investigative Process
     */
    public async investigate(signal: RawNewsSignal): Promise<DetectiveAnalysis> {
        console.log(`🕵️ INVESTIGATION STARTED: "${signal.headline}"`);

        // Step 1: Source Quality Check
        const tier = this.checkSourceTier(signal);
        if (tier === 'LOW' && !this.isUrgent(signal)) {
            throw new Error('Signal rejected: Low confidence source without corroboration.');
        }

        // Step 2: Surface Narrative Discovery
        const narrative = this.extractNarrative(signal);

        // Step 3: Detective Investigation (Cross-reference)
        const crossRef = await this.crossReferenceData(signal);

        // Step 4: Big-Money Disbelief Signals
        const disbelief = await this.detectBigMoneyDisbelief(signal, crossRef);

        // Step 5: Predator Validation
        const validation = this.validateAgainstCore(narrative, disbelief);

        return this.formatOutput(narrative, disbelief, validation);
    }

    private checkSourceTier(signal: RawNewsSignal): 'HIGH' | 'MEDIUM' | 'LOW' {
        const source = signal.source.toUpperCase();
        if (source === 'POLYGON' || source.includes('POLYGON') || source === 'OFFICIAL') return 'HIGH';
        if (source === 'X' && signal.handle && this.highSignalHandles.some(h => h.toLowerCase() === signal.handle?.toLowerCase())) return 'MEDIUM';
        return 'LOW';
    }

    private isUrgent(signal: RawNewsSignal): boolean {
        // Urgent if high engagement or multiple mentions (simple mock for now)
        return signal.content.includes('BREAKING') || signal.content.includes('URGENT');
    }

    private extractNarrative(signal: RawNewsSignal): { story: string; sentiment: string } {
        const isBullish = /upgrade|beat|positive|growth|improvement/i.test(signal.content);
        return {
            story: signal.headline,
            sentiment: isBullish ? 'BULLISH_HYPE' : 'BEARISH_PANIC'
        };
    }

    private async crossReferenceData(signal: RawNewsSignal): Promise<any> {
        if (!signal.ticker) return null;

        // Fetch order flow and price action context
        // In a real scenario, this calls polygonDataProvider for tick data
        const flow = await bigMoneyFlowInterpreter.analyzeFlow(
            signal.ticker,
            150, 149, 148, // Mocks for current/open/prevClose
            1000000, 800000 // Mocks for volume
        );

        return flow;
    }

    private async detectBigMoneyDisbelief(signal: RawNewsSignal, flow: any): Promise<any> {
        if (!flow) return { evidence: 'NO_DATA', conviction: 'LOW' };

        const isDivergent = (flow.institutional_intent.action === 'DISTRIBUTION' && signal.headline.includes('UPGRADE')) ||
            (flow.institutional_intent.action === 'ACCUMULATION' && signal.headline.includes('DOWNGRADE'));

        return {
            is_disbelief: isDivergent,
            evidence: isDivergent ? 'Price absorption at high volume levels despite headline.' : 'No clear disbelief signals.',
            conviction: isDivergent ? 'HIGH' : 'LOW'
        };
    }

    private validateAgainstCore(narrative: any, disbelief: any): any {
        const fits = disbelief.is_disbelief; // If big money disbelieves, it fits our contrarian edge
        return {
            is_valid: fits,
            reasoning: fits ? 'Exploits herd overreaction with institutional backing.' : 'Inconclusive or herd-following.'
        };
    }

    private formatOutput(narrative: any, disbelief: any, validation: any): DetectiveAnalysis {
        return {
            detective_summary: `Surface Narrative: ${narrative.story}. Hidden Context: ${disbelief.is_disbelief ? 'Big money is fading this move.' : 'Market is reacting tentatively.'}`,
            system_validation: validation.reasoning,
            big_money_evidence: disbelief.evidence,
            suggested_action: disbelief.is_disbelief ? 'CONTRARIAN FADE: Open small position against the herd.' : 'WAIT: No clear edge detected.',
            risk_assessment: 'Medium. False fade risk exists if news impact is systemic.',
            approval_required: true
        };
    }
}

export const newsDetective = NewsDetective.getInstance();
