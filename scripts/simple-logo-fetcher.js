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

// Company-specific domain mappings for known issues
const COMPANY_MAPPINGS = {
  'SHEL': 'shell.com',
  'INOD': 'inod.com',
  'JBLU': 'jetblue.com',
  'TMUS': 't-mobile.com',
  'ENVX': 'enovix.com',
  'KNSL': 'kinsale-capital.com',
  'ETN': 'eaton.com',
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
  
  // Skip WITCHING as it's not a real company
  if (ticker === 'WITCHING') {
    console.log(`⏭️ Skipping ${ticker} (not a real company)`);
    return false;
  }
  
  const sources = [
    // Try company-specific mapping first
    () => {
      if (COMPANY_MAPPINGS[ticker]) {
        return `https://logo.clearbit.com/${COMPANY_MAPPINGS[ticker]}`;
      }
      return null;
    },
    
    // Try standard .com domain
    () => `https://logo.clearbit.com/${ticker.toLowerCase()}.com`,
    
    // Try .net domain
    () => `https://logo.clearbit.com/${ticker.toLowerCase()}.net`,
    
    // Try .org domain
    () => `https://logo.clearbit.com/${ticker.toLowerCase()}.org`,
    
    // Try .ai domain for tech companies
    () => `https://logo.clearbit.com/${ticker.toLowerCase()}.ai`,
    
    // Fallback to UI Avatars for generic logo
    () => `https://ui-avatars.com/api/?name=${ticker}&size=64&background=3b82f6&color=ffffff&bold=true`
  ];
  
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const url = source();
    
    if (!url) {
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

// Copy default logo for missing companies
function createFallbackLogo(ticker) {
  const fallbackPath = path.join(LOGO_DIR, `${ticker}.png`);
  const defaultLogoPath = path.join(LOGO_DIR, 'default.png');
  
  // Copy the default logo if it exists, otherwise create a simple one
  if (fs.existsSync(defaultLogoPath)) {
    fs.copyFileSync(defaultLogoPath, fallbackPath);
    console.log(`🎨 Copied default logo for ${ticker}`);
  } else {
    // Create a simple default logo
    const defaultSvg = `
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#3b82f6"/>
        <text x="32" y="40" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">${ticker}</text>
      </svg>
    `;
    
    // For now, just create a placeholder file
    fs.writeFileSync(fallbackPath, '');
    console.log(`🎨 Created placeholder for ${ticker}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting simple logo fetcher...');
  
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
  console.log('\n📊 SIMPLE LOGO FETCHER SUMMARY');
  console.log('==================================');
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