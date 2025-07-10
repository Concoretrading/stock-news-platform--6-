#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const TICKERS_FILE = path.join(__dirname, '../lib/tickers.json');
const LOGOS_DIR = path.join(__dirname, '../public/images/logos');
const CLEARBIT_API = 'https://logo.clearbit.com';

// Load diagnostic results from previous script run (or rerun diagnostic inline)
// For this script, we'll rerun the logic to get missing tickers, missing logoUrls, and missing logo files
const tickersJson = JSON.parse(fs.readFileSync(TICKERS_FILE, 'utf8'));
const tickersMap = Object.fromEntries(tickersJson.map(t => [t.ticker.toUpperCase(), t]));

// Helper to download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        fs.unlinkSync(filepath);
        resolve(false);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(filepath);
      resolve(false);
    });
  });
}

function logoFileExists(logoUrl) {
  if (!logoUrl) return false;
  const filePath = path.join(__dirname, '../public', logoUrl);
  return fs.existsSync(filePath);
}

async function fetchAndSaveLogo(ticker, companyName) {
  const domain = `${ticker.toLowerCase()}.com`;
  const logoUrl = `${CLEARBIT_API}/${domain}`;
  const localPath = `/images/logos/${ticker.toLowerCase()}.png`;
  const fullPath = path.join(LOGOS_DIR, `${ticker.toLowerCase()}.png`);
  const success = await downloadImage(logoUrl, fullPath);
  if (success) {
    return localPath;
  }
  return null;
}

async function main() {
  // 1. Get all unique tickers from Firestore
  const admin = require('firebase-admin');
  const serviceAccount = require('../serviceAccountKey.json');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  const db = admin.firestore();
  const snapshot = await db.collection('earnings_calendar').get();
  const dbTickers = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.stockTicker) {
      dbTickers.add(data.stockTicker.trim().toUpperCase());
    }
  });

  // 2. Find missing tickers, missing logoUrls, missing logo files
  const missingFromJson = [];
  const missingLogoUrl = [];
  const missingLogoFile = [];

  for (const ticker of dbTickers) {
    const info = tickersMap[ticker];
    if (!info) {
      missingFromJson.push(ticker);
    } else if (!info.logoUrl) {
      missingLogoUrl.push(ticker);
    } else if (!logoFileExists(info.logoUrl)) {
      missingLogoFile.push({ ticker, logoUrl: info.logoUrl });
    }
  }

  // 3. Add missing tickers to tickers.json
  for (const ticker of missingFromJson) {
    tickersJson.push({ ticker, name: ticker });
    tickersMap[ticker] = { ticker, name: ticker };
  }

  // 4. Fetch logos for all missing tickers and those missing logo files
  const toFetch = new Set([
    ...missingFromJson,
    ...missingLogoUrl,
    ...missingLogoFile.map(x => x.ticker)
  ]);

  let fetched = 0;
  for (const ticker of toFetch) {
    const info = tickersMap[ticker];
    const logoPath = `/images/logos/${ticker.toLowerCase()}.png`;
    if (!logoFileExists(logoPath)) {
      const logoUrl = await fetchAndSaveLogo(ticker, info.name);
      if (logoUrl) {
        info.logoUrl = logoUrl;
        fetched++;
        console.log(`✅ Downloaded logo for ${ticker}`);
      } else {
        console.log(`❌ Failed to fetch logo for ${ticker}`);
      }
      // Small delay to avoid hammering Clearbit
      await new Promise(res => setTimeout(res, 100));
    } else {
      info.logoUrl = logoPath;
    }
  }

  // 5. Save updated tickers.json
  fs.writeFileSync(TICKERS_FILE, JSON.stringify(tickersJson, null, 2));

  console.log('\n--- AUTO-FIX SUMMARY ---');
  console.log(`Added ${missingFromJson.length} missing tickers to tickers.json.`);
  console.log(`Fetched ${fetched} new logos.`);
  console.log('tickers.json updated.');
}

main().catch(err => {
  console.error('Error running auto-fix:', err);
  process.exit(1);
}); 