
import { nemotronService } from '../lib/services/nemotron-service';

async function testNemotronKey() {
    console.log('🧠 TESTING NEMOTRON API CONNECTIVITY');

    const request = {
        ticker: 'NVDA',
        currentPrice: 900,
        expertSignals: {
            psychology: { sentiment: 'bullish' },
            behavioral: { biases: [] },
            flow: { direction: 'buying' },
            news: { gravity: 80 },
            technical: { trend: 'up' }
        },
        macroContext: 'Earnings season, AI hype high.',
        reasoningBudget: 50
    };

    try {
        const response = await nemotronService.synthesizeIntelligence(request);
        console.log('\n✅ NEMOTRON RESPONSE:');
        console.log(JSON.stringify(response, null, 2));

        if (response.autonomous_thesis.includes('[MOCK MODE]')) {
            console.log('\n❌ STILL IN MOCK MODE. Key not being picked up.');
        } else {
            console.log('\n🚀 POWERFUL: Main Brain is LIVE.');
        }
    } catch (error) {
        console.error('\n❌ NEMOTRON API ERROR:', error);
    }
}

testNemotronKey();
