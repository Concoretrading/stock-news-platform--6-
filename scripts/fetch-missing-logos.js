const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Missing tickers from the console output
const MISSING_TICKERS = [
  'SHEL', 'INOD', 'JBLU', 'TMUS', 'WITCHING', 'CTAS', 'NFLX', 'SYK', 'COF', 'K', 'LHX', 'EQIX', 'FSLR', 'POWL', 'TXRH', 'DLR', 'DXCM', 'MCHP', 'CVNA', 'LMND', 'GWW', 'TER', 'C', 'VKTX', 'TLRY', 'USB', 'LYG', 'ISRG', 'VRT', 'MBLY', 'HCA', 'DJT', 'BX', 'MSTR', 'GRMN', 'CHTR', 'IQV', 'NXT', 'BAC', 'CNI', 'BBAI', 'DKNG', 'ENB', 'TMDX', 'ECL', 'F', 'CFLT', 'TWLO', 'UAL', 'BKNG', 'V', 'AAPL'
];

const LOGO_SOURCES = [
  ticker => `https://logo.clearbit.com/${ticker.toLowerCase()}.com`,
  ticker => `https://financialmodelingprep.com/image-stock/${ticker.toUpperCase()}.png`,
  ticker => `https://s3-symbol-logo.tradingview.com/${ticker.toLowerCase()}--big.svg`,
];

const logosDir = path.join(__dirname, '../public/images/logos');
const tickersPath = path.join(__dirname, '../lib/tickers.json');
let tickersJson = [];
if (fs.existsSync(tickersPath)) {
  tickersJson = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    const request = mod.get(url, response => {
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    request.on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

(async () => {
  for (const ticker of MISSING_TICKERS) {
    let found = false;
    for (const getUrl of LOGO_SOURCES) {
      const url = getUrl(ticker);
      const ext = url.endsWith('.svg') ? 'svg' : 'png';
      const dest = path.join(logosDir, `${ticker.toUpperCase()}.${ext}`);
      try {
        await download(url, dest);
        console.log(`✅ Downloaded logo for ${ticker} from ${url}`);
        // Add to tickers.json if not present
        if (!tickersJson.find(t => t.ticker.toUpperCase() === ticker.toUpperCase())) {
          tickersJson.push({ ticker: ticker.toUpperCase(), logoUrl: `/images/logos/${ticker.toUpperCase()}.${ext}` });
        }
        found = true;
        break;
      } catch (e) {
        // Try next source
      }
    }
    if (!found) {
      console.log(`❌ Failed to fetch logo for ${ticker}`);
    }
  }
  // Save updated tickers.json
  fs.writeFileSync(tickersPath, JSON.stringify(tickersJson, null, 2));
  console.log('--- LOGO FETCH COMPLETE ---');
})(); 