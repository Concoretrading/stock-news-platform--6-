/**
 * SCHWAB API AUTHORIZATION SETUP
 * =====================================================
 * Run this script once to connect your Schwab account.
 * After the first authorization, tokens are saved locally
 * and refresh automatically — you'll never need to do this again.
 *
 * Usage:
 *   npx tsx scripts/schwab-auth.ts
 * =====================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as readline from 'readline';
import { SchwabClient } from '../lib/clients/thinkorswim-client';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('');
  console.log('=========================================================');
  console.log('🦅 SCHWAB DEVELOPER API — FIRST-TIME AUTHORIZATION SETUP');
  console.log('=========================================================');
  console.log('');

  const client = new SchwabClient();

  // Check if already authenticated
  if (client.isAuthenticated()) {
    console.log('✅ Already authenticated! Your Schwab connection is active.');
    console.log('');

    const accounts = await client.getAccounts();
    console.log(`📊 Found ${accounts.length} linked account(s):`);
    accounts.forEach((a: any, i: number) => {
      const acc = a.securitiesAccount;
      console.log(`   ${i + 1}. ${acc?.type} — ${acc?.accountNumber?.slice(-4).padStart(8, '*')}`);
    });

    const balance = await client.getAccountBalance();
    if (balance) {
      console.log(`\n💰 Account Balance:`);
      console.log(`   Cash Available: $${balance.cashAvailableForTrading?.toLocaleString()}`);
      console.log(`   Total Value   : $${balance.liquidationValue?.toLocaleString()}`);
    }

    rl.close();
    return;
  }

  if (client.isRefreshable()) {
    console.log('🔄 Tokens expired but refreshable. Refreshing now...');
    // The client will handle refresh automatically on the next API call
    const accounts = await client.getAccounts();
    console.log(`✅ Re-authenticated. Found ${accounts.length} account(s).`);
    rl.close();
    return;
  }

  // First time — need full OAuth flow
  console.log('📋 STEP 1: Copy the URL below and open it in your browser.');
  console.log('   Log in with your SCHWAB BROKERAGE credentials (not Dev Portal).');
  console.log('   Select the account(s) you want to link, then click Authorize.\n');

  client.getAuthorizationUrl();

  console.log('📋 STEP 2: After clicking Authorize, your browser goes to a white page.');
  console.log('   Look at the address bar — it will look like:');
  console.log('   https://developer.schwab.com/oauth2-redirect.html?code=C0.xxxxxx&session=...\n');
  console.log('   ⚠️  Do NOT paste the full URL (PowerShell breaks on & symbols)');
  console.log('   Instead, copy ONLY the code value — everything between "code=" and "&session"');
  console.log('   Example: if URL is ?code=C0.abc123&session=xyz — paste just: C0.abc123\n');

  const authCode = await ask('Paste JUST the code value here → ');

  console.log(`\n🔄 Exchanging authorization code for tokens...`);
  const success = await client.exchangeCodeForTokens(authCode);

  if (success) {
    console.log('\n✅ SUCCESS! Schwab API is now connected.');
    console.log('=========================================================');
    console.log('Your tokens are saved to .schwab_tokens.json');
    console.log('They refresh automatically every 30 minutes.');
    console.log('The Predator can now:');
    console.log('  📊 Read live Level 1 + Level 2 market data');
    console.log('  📈 Pull real-time options chains (Greeks, IV, OI)');
    console.log('  🎯 Execute trades automatically when patterns fire');
    console.log('=========================================================\n');

    // Test it
    console.log('🧪 Running connection test...');
    const accounts = await client.getAccounts();
    console.log(`✅ Connection confirmed — ${accounts.length} account(s) linked.\n`);
  } else {
    console.error('❌ Authorization failed. Check your Client ID and Secret in .env.local');
  }

  rl.close();
}

main().catch(e => { console.error(e); process.exit(1); });
