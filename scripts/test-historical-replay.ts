import { premiumReplayEngine } from '../lib/services/premium-replay-engine';

async function runHistoricalReplayTest() {
  console.log('--- STARTING PREDATOR HISTORICAL REPLAY TEST ---');
  
  // We specify SPY to trigger SPX options logic inside SystematicTrainingEngine
  const ticker = 'SPY'; 
  
  // Define a 3-day history window (August 15 to August 17) to keep it fast
  const startDate = '2024-08-15T09:30:00Z';
  const endDate = '2024-08-17T16:00:00Z'; // 3 days
  
  try {
     await premiumReplayEngine.startReplaySession(ticker, startDate, endDate);
     console.log('--- SYSTEM REPLAY DONE ---');
  } catch (err) {
      console.error('Replay Failed:', err);
  }
}

// Execute
runHistoricalReplayTest().then(() => {
    process.exit(0);
});
