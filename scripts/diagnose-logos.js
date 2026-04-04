#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Make sure this file exists and is correct

const TICKERS_FILE = path.join(__dirname, '../lib/tickers.json');
const LOGOS_DIR = path.join(__dirname, '../public/images/logos');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function getUniqueTickersFromFirestore() {
  const snapshot = await db.collection('earnings_calendar').get();
  const tickers = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.stockTicker) {
      tickers.add(data.stockTicker.trim().toUpperCase());
    }
  });
  return Array.from(tickers);
}

function getTickersJson() {
  return JSON.parse(fs.readFileSync(TICKERS_FILE, 'utf8'));
}

function logoFileExists(logoUrl) {
  if (!logoUrl) return false;
  const filePath = path.join(__dirname, '../public', logoUrl);
  return fs.existsSync(filePath);
}

async function main() {
  console.log('🔍 Scanning Firestore for unique tickers...');
  const dbTickers = await getUniqueTickersFromFirestore();
  console.log(`Found ${dbTickers.length} unique tickers in earnings_calendar.`);

  const tickersJson = getTickersJson();
  const tickersMap = Object.fromEntries(tickersJson.map(t => [t.ticker.toUpperCase(), t]));

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

  console.log('\n--- DIAGNOSTIC REPORT ---');
  if (missingFromJson.length) {
    console.log(`❌ Missing from tickers.json (${missingFromJson.length}):`, missingFromJson);
  } else {
    console.log('✅ All Firestore tickers are present in tickers.json');
  }

  if (missingLogoUrl.length) {
    console.log(`❌ Missing logoUrl in tickers.json (${missingLogoUrl.length}):`, missingLogoUrl);
  } else {
    console.log('✅ All tickers in tickers.json have a logoUrl');
  }

  if (missingLogoFile.length) {
    console.log(`❌ Missing logo file (${missingLogoFile.length}):`);
    missingLogoFile.forEach(({ ticker, logoUrl }) => {
      console.log(`   - ${ticker}: ${logoUrl}`);
    });
  } else {
    console.log('✅ All logo files exist');
  }

  // Optionally, you can add auto-fix logic here
}

main().catch(err => {
  console.error('Error running diagnostic:', err);
  process.exit(1);
}); 