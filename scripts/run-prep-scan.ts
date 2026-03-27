
import { grokService } from '../lib/services/grok-service';
import { trainingLogger } from '../lib/services/training-logger';
import fs from 'fs';
import path from 'path';

const WATCHLIST = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT'];

async function runPrepScan() {
    const isMorning = new Date().getHours() < 12;
    const sessionType = isMorning ? 'MORNING_PREP' : 'NIGHTLY_REVIEW';

    console.log(`🚀 STARTING ${sessionType} FOR WATCHLIST: ${WATCHLIST.join(', ')}`);

    const results: Record<string, any> = {};

    for (const ticker of WATCHLIST) {
        console.log(`🔍 Scanning ${ticker} for high-signal catalysts...`);
        const intel = await grokService.analyzeSocialIntelligence(ticker);

        results[ticker] = {
            sentiment: intel.consensus,
            score: intel.intel_score,
            catalysts: intel.catalyst_details,
            is_whisper: intel.is_whisper,
            timestamp: new Date().toISOString()
        };

        // Log for Phase 0 Training
        await trainingLogger.logObservation({
            ticker,
            timestamp: new Date().toISOString(),
            price_action: { price: 0, volume: 0, change_pct: 0 }, // Prep scan, no live action yet
            narrative_context: {
                sentiment: intel.consensus,
                baton_phase: intel.is_whisper ? 'VALIDATED_WHISPER' : 'IDLE',
                catalysts: intel.catalyst_details,
                intel_score: intel.intel_score
            }
        });
    }

    const outputPath = path.join(process.cwd(), 'logs', 'daily_prep.json');
    fs.writeFileSync(outputPath, JSON.stringify({
        session: sessionType,
        updated_at: new Date().toISOString(),
        data: results
    }, null, 2));

    console.log(`✅ ${sessionType} COMPLETE. Results saved to logs/daily_prep.json`);
}

runPrepScan().catch(console.error);
