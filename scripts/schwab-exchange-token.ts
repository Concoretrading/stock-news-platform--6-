import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import { SchwabClient } from '../lib/clients/thinkorswim-client';

async function main() {
  // Read auth code from file (avoids ALL PowerShell terminal issues)
  const codeFile = 'schwab-code.txt';

  if (!fs.existsSync(codeFile)) {
    console.error(`❌ File not found: ${codeFile}`);
    console.log('Create that file in your project root, paste the code inside, and save it.');
    process.exit(1);
  }

  // Read, clean the code — strip whitespace, decode URL encoding
  let code = fs.readFileSync(codeFile, 'utf-8').trim();
  code = decodeURIComponent(code);

  if (!code || !code.startsWith('C0.')) {
    console.error('❌ Invalid code in schwab-code.txt — it should start with C0.');
    process.exit(1);
  }

  console.log(`\n🔄 Exchanging code for tokens...`);
  console.log(`   Code: ${code.substring(0, 20)}...`);

  const client = new SchwabClient();
  const success = await client.exchangeCodeForTokens(code);

  if (success) {
    console.log('\n✅ SUCCESS! Schwab API fully connected.');
    console.log('   Testing live connection...');
    const accounts = await client.getAccounts();
    console.log(`   ✅ ${accounts.length} account(s) linked and live!`);

    // Clean up the code file for security
    fs.unlinkSync(codeFile);
    console.log('   🗑️  schwab-code.txt deleted for security.');
  } else {
    console.error('\n❌ Token exchange failed — the code may have expired.');
    console.log('   Go through the browser auth flow again and update schwab-code.txt');
  }
}

main();
