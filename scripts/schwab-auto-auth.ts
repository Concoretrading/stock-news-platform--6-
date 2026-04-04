/**
 * SCHWAB AUTO-AUTH SERVER
 * =========================================================
 * Starts a local HTTP server on port 8080.
 * When Schwab redirects back with the auth code,
 * this server catches it AUTOMATICALLY — no copy-pasting ever!
 *
 * Usage: npx tsx scripts/schwab-auto-auth.ts
 * =========================================================
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as http from 'http';
import { SchwabClient } from '../lib/clients/thinkorswim-client';

const PORT = 8080;
const CLIENT_ID    = process.env.SCHWAB_CLIENT_ID     || '';
const REDIRECT_URI = 'http://localhost:8080/callback';

// Update the Schwab client to use the localhost redirect
process.env.SCHWAB_REDIRECT_URI = REDIRECT_URI;

function buildAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    scope:         'readonly',
  });
  return `https://api.schwabapi.com/v1/oauth/authorize?${params.toString()}`;
}

async function startAuthServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${PORT}`);

      if (url.pathname === '/callback') {
        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1 style="color:red">❌ Auth Error: ${error}</h1><p>Close this tab.</p>`);
          server.close();
          reject(new Error(`Auth error: ${error}`));
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>❌ No code received</h1>`);
          server.close();
          reject(new Error('No auth code in callback'));
          return;
        }

        console.log(`\n✅ Authorization code received automatically!`);
        console.log(`   Code: ${code.substring(0, 25)}...`);
        console.log(`\n🔄 Exchanging code for tokens...`);

        // Send success page to browser immediately
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>Schwab Connected!</title>
          <style>
            body { font-family: Arial, sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0; background:#0a0a0a; color:#fff; }
            .card { text-align:center; padding:40px; border-radius:16px; background:#111; border:1px solid #333; }
            h1 { color:#00ff88; font-size:2em; }
            p { color:#aaa; font-size:1.1em; }
          </style>
          </head>
          <body>
            <div class="card">
              <h1>✅ Schwab Connected!</h1>
              <p>The Predator is now live.<br>You can close this tab.</p>
            </div>
          </body>
          </html>
        `);

        // Exchange code for tokens
        try {
          const client  = new SchwabClient();
          const success = await client.exchangeCodeForTokens(decodeURIComponent(code));

          if (success) {
            console.log('\n🎯 SCHWAB FULLY CONNECTED!');
            console.log('=========================================================');
            console.log('✅ Tokens saved — auto-refresh active forever');
            console.log('✅ The Predator now has access to:');
            console.log('   📊 Real-time Level 1 + Level 2 market data');
            console.log('   📈 Live SPX/SPY/TSLA options chains');
            console.log('   🎯 Full order execution (paper + live)');
            console.log('   📉 Account positions and balance monitoring');
            console.log('=========================================================\n');

            // Test the connection
            const accounts = await client.getAccounts();
            console.log(`📊 ${accounts.length} account(s) linked and verified!`);
          } else {
            console.error('❌ Token exchange failed');
          }
        } catch (e) {
          console.error('❌ Error during token exchange:', e);
        }

        server.close();
        resolve();
      } else {
        // Root path — show instructions
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h1>Schwab Auth Server Running</h1><p>Waiting for Schwab to redirect...</p>`);
      }
    });

    server.listen(PORT, () => {
      const authUrl = buildAuthUrl();

      console.log('');
      console.log('='.repeat(60));
      console.log('🦅 SCHWAB AUTO-AUTH SERVER — READY');
      console.log('='.repeat(60));
      console.log(`\n✅ Local server listening on http://localhost:${PORT}`);
      console.log('\n📋 STEP 1: Open this URL in your browser:\n');
      console.log(authUrl);
      console.log('\n📋 STEP 2: Log into your Schwab brokerage account');
      console.log('📋 STEP 3: Select your account(s) and click Allow');
      console.log('\n⏳ Waiting for Schwab to redirect back here automatically...');
      console.log('   (No copy-pasting needed — just log in and click Allow!)\n');
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Close any other servers and try again.`);
      } else {
        console.error('❌ Server error:', e);
      }
      reject(e);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      console.log('\n⏰ Auth timeout — no response received in 5 minutes');
      server.close();
      resolve();
    }, 5 * 60 * 1000);
  });
}

startAuthServer().catch(e => {
  console.error('Auth server failed:', e);
  process.exit(1);
});
