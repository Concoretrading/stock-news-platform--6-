
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    const apiKey = process.env.NVIDIA_API_KEY;
    const apiUrl = process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1";

    if (!apiKey) {
        console.error('❌ NVIDIA_API_KEY missing.');
        return;
    }

    console.log(`🔍 Fetching models from ${apiUrl}...`);

    try {
        const response = await fetch(`${apiUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log('\n📜 AVAILABLE MODELS:');
        data.data.forEach((m: any) => {
            if (m.id.toLowerCase().includes('nemotron')) {
                console.log(`✅ ${m.id}`);
            } else {
                console.log(`- ${m.id}`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to fetch models:', error);
    }
}

listModels();
