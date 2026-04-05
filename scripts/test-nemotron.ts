import * as dotenv from 'dotenv';
const result = dotenv.config({ path: '.env.local' });
if (result.error) {
    console.error('❌ Error loading .env.local:', result.error);
}

// Import AFTER dotenv config
import { NemotronService } from '../lib/services/nemotron-service';

async function testNemotron() {
    console.log('🧠 Testing Nemotron (NVIDIA) Connection...');
    
    // Create NEW instance AFTER dotenv is loaded
    const liveService = new NemotronService();
    
    const request = {
        ticker: 'NVDA',
        currentPrice: 900,
        expertSignals: {
            psychology: { sentiment: 'EUPHORIC', intensity: 85 },
            behavioral: { pattern: 'Bullish Engulfing', confidence: 75 },
            flow: { darkPool: 'Buying', intensity: 90 },
            news: { gravity: 0.8, description: 'Earnings beat expected' },
            technical: { rsi: 72, trend: 'UPWARD' }
        },
        macroContext: 'Rates holding steady, AI demand surging.',
        reasoningBudget: 50
    };

    try {
        const result = await liveService.synthesizeIntelligence(request);
        
        console.log('\n--- BRAIN SYNTHESIS RESULT ---');
        console.log(`Final Decision: ${result.final_trade_direction}`);
        console.log(`Confidence: ${result.confidence}%`);
        console.log(`Thesis: ${result.autonomous_thesis}`);
        
        if (result.autonomous_thesis.includes('[MOCK MODE]')) {
            console.log('\n❌ FAILED: Service is still running in MOCK mode. Check your API key.');
        } else {
            console.log('\n✅ SUCCESS: Nemotron is LIVE and reasoning.');
        }
    } catch (error) {
        console.error('❌ Connection Error:', error);
    }
}

testNemotron();
