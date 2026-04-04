import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { nemotronService } from '../lib/services/nemotron-service';

async function main() {
  console.log('🧪 Testing Nemotron brain connection...\n');

  const result = await nemotronService.synthesizeIntelligence({
    ticker: 'SPY',
    currentPrice: 650,
    expertSignals: {
      psychology: { squeeze: 'TIGHT on Daily and 4H' },
      behavioral:  { momentum_bias: 'BULLISH' },
      flow:        { call_strike: 655, put_strike: 645 },
      news:        { note: 'Fed speakers today at 10AM' },
      technical:   { atr: 3.2, squeezed_frames: 4 }
    },
    macroContext: 'SPY at $650. 4 timeframes compressed. Approaching resistance at $655. Premium slightly call-heavy.',
    reasoningBudget: 50
  });

  const isMock = result.autonomous_thesis?.includes('MOCK MODE');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧠 NEMOTRON STATUS:', isMock ? '⚠️  MOCK (key issue)' : '✅ LIVE & REASONING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Direction:  ', result.final_trade_direction);
  console.log('Confidence: ', result.confidence + '%');
  console.log('Thesis:     ', result.autonomous_thesis);
  console.log('Traps:      ', result.potential_traps_identified?.join(', ') || 'None');
  console.log('Advice:     ', result.adjustment_advice);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
