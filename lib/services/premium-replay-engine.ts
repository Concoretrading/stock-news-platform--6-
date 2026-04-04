import { localDBService } from './local-db-service';
import { PolygonDataProvider } from './polygon-data-provider';
import { SystematicTrainingEngine } from './systematic-training-engine';

export class PremiumReplayEngine {
  private static instance: PremiumReplayEngine;
  private dataProvider: PolygonDataProvider;

  private constructor() {
    this.dataProvider = PolygonDataProvider.getInstance();
  }

  public static getInstance(): PremiumReplayEngine {
    if (!PremiumReplayEngine.instance) {
      PremiumReplayEngine.instance = new PremiumReplayEngine();
    }
    return PremiumReplayEngine.instance;
  }

  /**
   * Orchestrates the historical bar-by-bar step through using SPY for price
   * action and SPX for premium querying.
   */
  async startReplaySession(symbol: string, startDate: string, endDate: string): Promise<void> {
    console.log(`\n⏳ [Historical Replay] ENGINE STARTING...`);
    console.log(`🎯 Target Underlying: ${symbol}`);
    console.log(`📅 Range: ${startDate} to ${endDate}\n`);

    const trainingEngine = SystematicTrainingEngine.getInstance();
    
    console.log(`⚙️ Injecting Premium Reconnaissance into the Systematic Training Engine...`);
    
    // The Systematic Training engine will execute its historical loop, and our injected
    // hooks inside analyzeMarketStructure will trigger the Premium Mastery API snapshots.
    try {
        await trainingEngine.startTraining(symbol, 1, ['volume', 'momentum', 'support_resistance', 'premium'], startDate, endDate);
        console.log(`\n✅ [Historical Replay] ENGINE FINISHED. Premium mapping complete.`);
    } catch (e) {
        console.error(`❌ [Historical Replay] Failed:`, e);
    }
  }
}

export const premiumReplayEngine = PremiumReplayEngine.getInstance();
