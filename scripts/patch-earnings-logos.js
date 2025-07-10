const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load tickers.json and build a mapping
tickersPath = path.join(__dirname, '../lib/tickers.json');
const tickersArr = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));
const tickerMap = {};
tickersArr.forEach(t => {
  if (t.ticker && t.logoUrl) {
    tickerMap[t.ticker.toUpperCase()] = t.logoUrl;
  }
});

// Initialize Firebase Admin
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS env var is not set!');
  process.exit(1);
}
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function patchEarningsLogos() {
  const earningsRef = db.collection('earnings_calendar');
  const snapshot = await earningsRef.get();
  let updated = 0, skipped = 0, missing = 0;
  const missingLogoTickers = new Set();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const ticker = (data.ticker || '').toUpperCase();
    if (!ticker) { missing++; continue; }
    const logoUrl = tickerMap[ticker];
    if (!logoUrl) {
      console.warn(`No logo for ticker: ${ticker}`);
      missing++;
      missingLogoTickers.add(ticker);
      continue;
    }
    if (data.logoUrl !== logoUrl) {
      await doc.ref.update({ logoUrl });
      updated++;
      console.log(`Patched ${ticker}: ${logoUrl}`);
    } else {
      skipped++;
    }
  }
  console.log(`Done. Updated: ${updated}, Skipped (already correct): ${skipped}, Missing logo: ${missing}`);

  // Now, print missing tickers
  const missingTickers = Array.from(missingLogoTickers);
  if (missingTickers.length) {
    console.log('\nTickers missing logos:');
    missingTickers.forEach(ticker => console.log(ticker));
  } else {
    console.log('All tickers have logos!');
  }
}

patchEarningsLogos().catch(console.error); 