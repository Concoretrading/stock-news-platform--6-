const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load existing tickers
const tickersPath = path.join(__dirname, '../lib/tickers.json');
const tickers = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));

const LOGO_DIR = path.join(__dirname, '../public/images/logos');

// Ensure logo directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// Multiple logo sources to try
const LOGO_SOURCES = [
  // Primary source - Clearbit Logo API
  (ticker) => `https://logo.clearbit.com/${ticker.toLowerCase()}.com`,
  
  // Secondary source - Alternative domain
  (ticker) => `https://logo.clearbit.com/${ticker.toLowerCase()}.net`,
  
  // Tertiary source - Direct company domain
  (ticker) => `https://logo.clearbit.com/${ticker.toLowerCase()}.org`,
  
  // Fallback - Generic logo service
  (ticker) => `https://ui-avatars.com/api/?name=${ticker}&size=64&background=random`,
  
  // Company-specific mappings for known issues
  (ticker) => {
    const mappings = {
      'SHEL': 'shell.com',
      'INOD': 'inod.com',
      'JBLU': 'jetblue.com',
      'TMUS': 't-mobile.com',
      'ENVX': 'enovix.com',
      'KNSL': 'kinsale-capital.com',
      'ETN': 'eaton.com',
      'WITCHING': 'default.png', // Skip this one
      'CTAS': 'ctas.com',
      'NFLX': 'netflix.com',
      'SYK': 'stryker.com',
      'COF': 'capitalone.com',
      'K': 'kelloggcompany.com',
      'LHX': 'l3harris.com',
      'EQIX': 'equinix.com',
      'FSLR': 'firstsolar.com',
      'POWL': 'powell.com',
      'TXRH': 'texasroadhouse.com',
      'DLR': 'digitalrealty.com',
      'DXCM': 'dexcom.com',
      'MCHP': 'microchip.com',
      'CVNA': 'carvana.com',
      'LMND': 'lemonade.com',
      'GWW': 'grainger.com',
      'TER': 'teradyne.com',
      'C': 'citigroup.com',
      'VKTX': 'vikingtherapeutics.com',
      'TLRY': 'tilray.com',
      'USB': 'usbank.com',
      'LYG': 'lloydsbankinggroup.com',
      'ISRG': 'intuitivesurgical.com',
      'VRT': 'vertiv.com',
      'MBLY': 'mobileye.com',
      'HCA': 'hcahealthcare.com',
      'DJT': 'trump.com',
      'BX': 'blackstone.com',
      'MSTR': 'microstrategy.com',
      'GRMN': 'garmin.com',
      'CHTR': 'charter.com',
      'IQV': 'iqvia.com',
      'NXT': 'nextracker.com',
      'BAC': 'bankofamerica.com',
      'CNI': 'canadiannational.com',
      'BBAI': 'bigbear.ai',
      'DKNG': 'draftkings.com',
      'ENB': 'enbridge.com',
      'TMDX': 'transmedics.com',
      'ECL': 'ecolab.com',
      'F': 'ford.com',
      'CFLT': 'confluent.com',
      'TWLO': 'twilio.com',
      'UAL': 'united.com',
      'BKNG': 'booking.com',
      'V': 'visa.com',
      'AAPL': 'apple.com'
    };
    
    if (mappings[ticker]) {
      return `https://logo.clearbit.com/${mappings[ticker]}`;
    }
    return null;
  }
];

// Download function with retry logic
function downloadLogo(ticker, url, retries = 3) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const logoPath = path.join(LOGO_DIR, `${ticker}.png`);
          fs.writeFileSync(logoPath, buffer);
          resolve(true);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (error) => {
      if (retries > 0) {
        setTimeout(() => {
          downloadLogo(ticker, url, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(error);
      }
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      if (retries > 0) {
        setTimeout(() => {
          downloadLogo(ticker, url, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(new Error('Timeout'));
      }
    });
  });
}

// Try multiple sources for a ticker
async function tryMultipleSources(ticker) {
  console.log(`🔄 Trying to fetch logo for ${ticker}...`);
  
  for (let i = 0; i < LOGO_SOURCES.length; i++) {
    const source = LOGO_SOURCES[i];
    const url = source(ticker);
    
    if (!url || url === 'default.png') {
      continue;
    }
    
    try {
      await downloadLogo(ticker, url);
      console.log(`✅ Downloaded logo for ${ticker} from source ${i + 1}`);
      return true;
    } catch (error) {
      console.log(`❌ Source ${i + 1} failed for ${ticker}: ${error.message}`);
      continue;
    }
  }
  
  console.log(`❌ All sources failed for ${ticker}`);
  return false;
}

// Create fallback logo for missing companies
function createFallbackLogo(ticker) {
  const fallbackPath = path.join(LOGO_DIR, `${ticker}.png`);
  
  // Create a simple SVG-based fallback logo
  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#3b82f6"/>
      <text x="32" y="40" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${ticker}</text>
    </svg>
  `;
  
  // Convert SVG to PNG using a simple approach (you might want to use a proper SVG to PNG converter)
  // For now, we'll create a simple colored square with text
  const canvas = require('canvas');
  const c = canvas.createCanvas(64, 64);
  const ctx = c.getContext('2d');
  
  // Draw background
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, 64, 64);
  
  // Draw text
  ctx.fillStyle = 'white';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ticker, 32, 32);
  
  // Save as PNG
  const buffer = c.toBuffer('image/png');
  fs.writeFileSync(fallbackPath, buffer);
  
  console.log(`🎨 Created fallback logo for ${ticker}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting enhanced logo fetcher...');
  
  const missingLogos = [];
  const successfulLogos = [];
  const failedLogos = [];
  
  // Check which logos are missing
  for (const ticker of Object.keys(tickers)) {
    const logoPath = path.join(LOGO_DIR, `${ticker}.png`);
    if (!fs.existsSync(logoPath)) {
      missingLogos.push(ticker);
    }
  }
  
  console.log(`📊 Found ${missingLogos.length} missing logos`);
  
  // Process missing logos
  for (const ticker of missingLogos) {
    try {
      const success = await tryMultipleSources(ticker);
      if (success) {
        successfulLogos.push(ticker);
      } else {
        failedLogos.push(ticker);
        // Create fallback logo for failed ones
        createFallbackLogo(ticker);
      }
    } catch (error) {
      console.log(`❌ Error processing ${ticker}: ${error.message}`);
      failedLogos.push(ticker);
      createFallbackLogo(ticker);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 ENHANCED LOGO FETCHER SUMMARY');
  console.log('=====================================');
  console.log(`✅ Successfully downloaded: ${successfulLogos.length} logos`);
  console.log(`❌ Failed to download: ${failedLogos.length} logos`);
  console.log(`🎨 Created fallback logos: ${failedLogos.length} logos`);
  console.log(`📁 Total logos now available: ${Object.keys(tickers).length}`);
  
  if (failedLogos.length > 0) {
    console.log('\n❌ Failed logos (now have fallbacks):');
    failedLogos.forEach(ticker => console.log(`   - ${ticker}`));
  }
  
  console.log('\n🎉 Logo fetching complete!');
}

// Run the script
main().catch(console.error); 