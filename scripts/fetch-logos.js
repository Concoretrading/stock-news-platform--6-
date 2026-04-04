#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

// Configuration
const LOGOS_DIR = path.join(__dirname, '../public/images/logos');
const TICKERS_FILE = path.join(__dirname, '../lib/tickers.json');
const CLEARBIT_API = 'https://logo.clearbit.com';

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  console.log('✅ Created logos directory:', LOGOS_DIR);
}

// Load tickers
const tickers = JSON.parse(fs.readFileSync(TICKERS_FILE, 'utf8'));
console.log(`📊 Loaded ${tickers.length} tickers`);

// Helper function to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

// Helper function to resize and optimize image
async function resizeImage(inputPath, outputPath, size = 64) {
  try {
    const image = await loadImage(inputPath);
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Calculate scaling to fit in square while maintaining aspect ratio
    const scale = Math.min(size / image.width, size / image.height);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (size - scaledWidth) / 2;
    const y = (size - scaledHeight) / 2;
    
    // Draw with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Draw the image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    return true;
  } catch (error) {
    console.error(`❌ Error resizing ${inputPath}:`, error.message);
    return false;
  }
}

// Helper function to get company domain from ticker
function getCompanyDomain(ticker, companyName) {
  // Common domain mappings for major companies
  const domainMap = {
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'GOOGL': 'google.com',
    'AMZN': 'amazon.com',
    'TSLA': 'tesla.com',
    'NVDA': 'nvidia.com',
    'META': 'meta.com',
    'BRK.B': 'berkshirehathaway.com',
    'JPM': 'jpmorganchase.com',
    'V': 'visa.com',
    'UNH': 'unitedhealthgroup.com',
    'HD': 'homedepot.com',
    'PG': 'pg.com',
    'MA': 'mastercard.com',
    'XOM': 'exxonmobil.com',
    'LLY': 'lilly.com',
    'ABBV': 'abbvie.com',
    'AVGO': 'broadcom.com',
    'COST': 'costco.com',
    'PEP': 'pepsico.com',
    'BMY': 'bms.com',
    'CAT': 'cat.com',
    'CVX': 'chevron.com',
    'DHR': 'danaher.com',
    'DUK': 'duke-energy.com',
    'EMR': 'emerson.com',
    'FDX': 'fedex.com',
    'GM': 'gm.com',
    'GS': 'goldmansachs.com',
    'HON': 'honeywell.com',
    'IBM': 'ibm.com',
    'JNJ': 'jnj.com',
    'KO': 'coca-cola.com',
    'LIN': 'linde.com',
    'LOW': 'lowes.com',
    'MCD': 'mcdonalds.com',
    'MDT': 'medtronic.com',
    'MMM': '3m.com',
    'MO': 'altria.com',
    'MRK': 'merck.com',
    'NEE': 'nexteraenergy.com',
    'NKE': 'nike.com',
    'PFE': 'pfizer.com',
    'PM': 'philipmorris.com',
    'SBUX': 'starbucks.com',
    'SO': 'southerncompany.com',
    'T': 'att.com',
    'UNP': 'up.com',
    'WMT': 'walmart.com',
    'COP': 'conocophillips.com',
    'EOG': 'eogresources.com',
    'SLB': 'slb.com',
    'HAL': 'halliburton.com',
    'BKR': 'bakerhughes.com',
    'PSX': 'phillips66.com',
    'VLO': 'valero.com',
    'MPC': 'marathonpetroleum.com',
    'OXY': 'oxy.com',
    'PXD': 'pioneer.com',
    'DVN': 'devonenergy.com',
    'HES': 'hess.com',
    'APA': 'apainvestments.com',
    'FANG': 'diamondback.com',
    'EQT': 'eqt.com',
    'CNX': 'cnx.com',
    'CHK': 'chk.com',
    'SWN': 'swn.com',
    'RRC': 'rangeresources.com',
    'COG': 'cabotog.com',
    'NBL': 'nobleenergy.com',
    'MRO': 'marathonoil.com',
    'HFC': 'hollyfrontier.com',
    'CVI': 'cvrenergy.com',
    'DK': 'delekus.com',
    'PBF': 'pbfenergy.com',
    'VAC': 'marriottvacations.com',
    'ALB': 'albemarle.com',
    'LVS': 'lasvegassands.com',
    'WYNN': 'wynnresorts.com',
    'MGM': 'mgmresorts.com',
    'CZR': 'caesars.com',
    'PENN': 'pennentertainment.com',
    'BYD': 'boydgaming.com',
    'ERI': 'eldoradoresorts.com',
    'IGT': 'igt.com',
    'SGMS': 'scientificgames.com',
    'GLPI': 'glpropinc.com',
    'VICI': 'viciproperties.com',
    'MGP': 'mgmgrowthproperties.com',
    'BALY': 'ballys.com',
    'RRR': 'redrockresorts.com',
    'CHDN': 'churchilldowns.com',
    'ADBE': 'adobe.com',
    'ADSK': 'autodesk.com',
    'AKAM': 'akamai.com',
    'AMD': 'amd.com',
    'ANET': 'arista.com',
    'APH': 'amphenol.com',
    'CDNS': 'cadence.com',
    'CDW': 'cdw.com',
    'CRM': 'salesforce.com',
    'CSCO': 'cisco.com',
    'CTSH': 'cognizant.com',
    'DDOG': 'datadoghq.com',
    'DOCU': 'docusign.com',
    'DXC': 'dxc.com',
    'ENPH': 'enphase.com',
    'EPAM': 'epam.com',
    'FFIV': 'f5.com',
    'FLT': 'fleetcor.com',
    'FTNT': 'fortinet.com',
    'GEN': 'gen.com',
    'GLW': 'corning.com',
    'GPN': 'globalpayments.com',
    'HPQ': 'hp.com',
    'INTC': 'intel.com',
    'INTU': 'intuit.com',
    'JKHY': 'jackhenry.com',
    'KLAC': 'kla.com',
    'LRCX': 'lamresearch.com',
    'MPWR': 'monolithicpower.com',
    'MSI': 'motorolasolutions.com',
    'MU': 'micron.com',
    'NET': 'cloudflare.com',
    'NOW': 'servicenow.com',
    'NTAP': 'netapp.com',
    'ON': 'onsemi.com',
    'ORCL': 'oracle.com',
    'PANW': 'paloaltonetworks.com',
    'PAYC': 'paycom.com',
    'QCOM': 'qualcomm.com',
    'SNPS': 'synopsys.com',
    'STX': 'seagate.com',
    'SWKS': 'skyworksinc.com',
    'TDY': 'teledyne.com',
    'TEL': 'te.com',
    'TRMB': 'trimble.com',
    'TXN': 'ti.com',
    'TYL': 'tylertech.com',
    'VRSN': 'verisign.com',
    'WDAY': 'workday.com',
    'WDC': 'westerndigital.com',
    'ZM': 'zoom.us',
    'AON': 'aon.com',
    'AJG': 'ajg.com',
    'AMP': 'ameriprise.com',
    'AIZ': 'assurant.com',
    'BEN': 'franklinresources.com',
    'BK': 'bnymellon.com',
    'BRO': 'bbinsurance.com',
    'CBOE': 'cboe.com',
    'CINF': 'cinfin.com',
    'CME': 'cmegroup.com',
    'DFS': 'discover.com',
    'EVR': 'evercore.com',
    'FDS': 'factset.com',
    'FITB': '53.com',
    'FRC': 'firstrepublic.com',
    'GL': 'globelife.com',
    'HIG': 'thehartford.com',
    'ICE': 'theice.com',
    'IVZ': 'invesco.com',
    'JEF': 'jefferies.com',
    'KEY': 'key.com',
    'LNC': 'lincolnfinancial.com',
    'LPLA': 'lpl.com',
    'MKTX': 'marketaxess.com',
    'MMC': 'marshmclennan.com',
    'MTB': 'mtb.com',
    'NDAQ': 'nasdaq.com',
    'NTRS': 'northerntrust.com',
    'PBCT': 'peoples.com',
    'PFG': 'principal.com',
    'PGR': 'progressive.com',
    'PNC': 'pnc.com',
    'RJF': 'raymondjames.com',
    'RF': 'regions.com',
    'RNR': 'renre.com',
    'SIVB': 'svb.com',
    'SPGI': 'spglobal.com',
    'STT': 'statestreet.com',
    'SYF': 'synchrony.com',
    'TROW': 'troweprice.com',
    'UBS': 'ubs.com',
    'VTRS': 'viatris.com',
    'WRB': 'wrberkley.com',
    'ZION': 'zionbank.com',
    'AA': 'alcoa.com',
    'AGCO': 'agcocorp.com',
    'AGU': 'nutrien.com',
    'APD': 'airproducts.com',
    'ARCH': 'archrsc.com',
    'ASH': 'ashland.com',
    'AVNT': 'avient.com',
    'BG': 'bunge.com',
    'BHP': 'bhp.com',
    'CCJ': 'cameco.com',
    'CF': 'cfindustries.com',
    'CLF': 'clevelandcliffs.com'
  };

  // First try the domain map
  if (domainMap[ticker]) {
    return domainMap[ticker];
  }

  // Try to extract domain from company name
  const name = companyName.toLowerCase();
  const words = name.split(' ');
  
  // Common patterns
  if (name.includes('inc') || name.includes('corp') || name.includes('llc')) {
    const mainWords = words.filter(word => 
      !['inc', 'corporation', 'corp', 'company', 'co', 'llc', 'ltd', 'limited', 'plc', 'group', 'holdings', '&'].includes(word)
    );
    if (mainWords.length > 0) {
      return `${mainWords.join('')}.com`;
    }
  }

  // Fallback: try to construct domain from company name
  const cleanName = name
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  
  return `${cleanName}.com`;
}

// Main function to fetch and process logos
async function fetchLogos() {
  console.log('🚀 Starting logo fetch process...');
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const ticker of tickers) {
    const tickerSymbol = ticker.ticker;
    
    // Skip if already has logoUrl
    if (ticker.logoUrl) {
      console.log(`⏭️  Skipping ${tickerSymbol} (already has logo)`);
      skippedCount++;
      continue;
    }

    try {
      console.log(`📥 Fetching logo for ${tickerSymbol} (${ticker.name})...`);
      
      // Get company domain
      const domain = getCompanyDomain(tickerSymbol, ticker.name);
      const logoUrl = `${CLEARBIT_API}/${domain}`;
      
      // Download logo
      const tempPath = path.join(LOGOS_DIR, `${tickerSymbol.toLowerCase()}_temp.png`);
      await downloadImage(logoUrl, tempPath);
      
      // Resize and optimize
      const finalPath = path.join(LOGOS_DIR, `${tickerSymbol.toLowerCase()}.png`);
      const success = await resizeImage(tempPath, finalPath, 64);
      
      if (success) {
        // Update ticker with logoUrl
        ticker.logoUrl = `/images/logos/${tickerSymbol.toLowerCase()}.png`;
        successCount++;
        console.log(`✅ Successfully processed ${tickerSymbol}`);
      } else {
        errorCount++;
        console.log(`❌ Failed to process ${tickerSymbol}`);
      }
      
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.log(`❌ Error processing ${tickerSymbol}: ${error.message}`);
    }
  }

  // Save updated tickers.json
  fs.writeFileSync(TICKERS_FILE, JSON.stringify(tickers, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⏭️  Skipped (already had logos): ${skippedCount}`);
  console.log(`📁 Logos saved to: ${LOGOS_DIR}`);
  console.log(`📄 Updated: ${TICKERS_FILE}`);
}

// Run the script
fetchLogos().catch(console.error); 