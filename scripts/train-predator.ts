import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { premiumReplayEngine } from '../lib/services/premium-replay-engine';

async function runFullTraining() {
  console.log('=========================================================');
  console.log('🧠 INITIATING PREDATOR CORE TRAINING SEQUENCE 🧠');
  console.log('=========================================================');
  
  const ticker = 'SPY'; 
  
  // Define a 30-day history window to stay within Polygon's strict API limits for real data
  const startDate = '2026-02-28T09:30:00Z'; // Exactly 30 days ago
  const endDate = '2026-03-30T16:00:00Z';   // Today
  
  console.log(`[SYS] Target Asset: ${ticker}`);
  console.log(`[SYS] Training Window: ${startDate} to ${endDate}`);
  console.log(`\n[WARNING] This deep-learning replay process will actively pull options chains on every structural breakout spotted over a 6 month period. This could easily take 30-60 minutes depending on Polygon API throttling.`);
  console.log(`[SYS] Local Database (PGLite) will continuously distill pattern outcomes. Do not close this terminal until completed.\n`);
  
  try {
     await premiumReplayEngine.startReplaySession(ticker, startDate, endDate);
     console.log('=========================================================');
     console.log('🟢 CORE TRAINING COMPLETE: Memory Core Updated Successfully.');
     console.log('=========================================================');
  } catch (err) {
      console.error('❌ Training Error Encountered:', err);
  }
}

// Execute without process.exit(0) so the background executeTraining promises aren't killed.
runFullTraining().then(() => {
    console.log(`[SYS] Training loop backgrounded successfully. Let it run.`);
});
