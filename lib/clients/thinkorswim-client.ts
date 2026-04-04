/**
 * SCHWAB (THINKORSWIM) OAUTH2 CLIENT
 * =====================================================
 * Full OAuth2 three-legged flow for Charles Schwab Developer API
 * Handles: Authorization → Token Exchange → Token Refresh → API Calls
 *
 * Docs: https://developer.schwab.com/
 * =====================================================
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Schwab OAuth2 Endpoints ---
const SCHWAB_AUTH_URL     = 'https://api.schwabapi.com/v1/oauth/authorize';
const SCHWAB_TOKEN_URL    = 'https://api.schwabapi.com/v1/oauth/token';
const SCHWAB_API_BASE     = 'https://api.schwabapi.com/trader/v1';
const SCHWAB_MARKET_BASE  = 'https://api.schwabapi.com/marketdata/v1';

// Token persistence file (local-only, never committed)
const TOKEN_FILE = path.join(process.cwd(), '.schwab_tokens.json');

export interface SchwabTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;         // Unix timestamp (ms)
  refresh_expires_at: number; // 7 days from issue
  token_type: string;
  scope: string;
}

export interface SchwabOrder {
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  session: 'NORMAL' | 'AM' | 'PM' | 'SEAMLESS';
  duration: 'DAY' | 'GOOD_TILL_CANCEL' | 'FILL_OR_KILL';
  orderStrategyType: 'SINGLE' | 'OCO' | 'TRIGGER';
  orderLegCollection: SchwabOrderLeg[];
  price?: number;
}

export interface SchwabOrderLeg {
  instruction: 'BUY_TO_OPEN' | 'SELL_TO_CLOSE' | 'BUY' | 'SELL';
  quantity: number;
  instrument: {
    symbol: string;
    assetType: 'EQUITY' | 'OPTION';
  };
}

export interface SchwabPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  unrealizedPL: number;
  assetType: string;
}

export class SchwabClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private tokens: SchwabTokens | null = null;
  private accountHash: string | null = null;

  constructor() {
    this.clientId    = process.env.SCHWAB_CLIENT_ID     || '';
    this.clientSecret = process.env.SCHWAB_CLIENT_SECRET || '';
    this.redirectUri  = process.env.SCHWAB_REDIRECT_URI  || 'https://developer.schwab.com/oauth2-redirect.html';

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️  SCHWAB_CLIENT_ID or SCHWAB_CLIENT_SECRET not set in .env.local');
    } else {
      console.log('🦅 Schwab Developer API Client initialized');
      this.loadTokens();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Generate the Authorization URL (open this in browser)
  // ─────────────────────────────────────────────────────────────
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     this.clientId,
      redirect_uri:  this.redirectUri,
      scope:         'readonly',
    });
    const url = `${SCHWAB_AUTH_URL}?${params.toString()}`;
    console.log('\n🔐 === SCHWAB AUTHORIZATION REQUIRED ===');
    console.log('Open this URL in your browser, log in with your Schwab credentials,');
    console.log('then paste the full redirect URL back here:\n');
    console.log(url);
    console.log('\n=========================================\n');
    return url;
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Exchange authorization code for tokens
  // ─────────────────────────────────────────────────────────────
  async exchangeCodeForTokens(authorizationCode: string): Promise<boolean> {
    console.log('🔄 Exchanging authorization code for tokens...');

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await fetch(SCHWAB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type:   'authorization_code',
          code:          authorizationCode,
          redirect_uri:  this.redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('❌ Token exchange failed:', err);
        return false;
      }

      const data = await response.json();
      this.tokens = {
        access_token:       data.access_token,
        refresh_token:      data.refresh_token,
        expires_at:         Date.now() + (data.expires_in * 1000),
        refresh_expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        token_type:         data.token_type,
        scope:              data.scope || '',
      };

      this.saveTokens();
      console.log('✅ Tokens obtained and saved successfully!');
      console.log(`   Access token expires: ${new Date(this.tokens.expires_at).toLocaleString()}`);
      console.log(`   Refresh token expires: ${new Date(this.tokens.refresh_expires_at).toLocaleString()}`);
      return true;
    } catch (e) {
      console.error('❌ Token exchange error:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Refresh access token (runs automatically)
  // ─────────────────────────────────────────────────────────────
  async refreshAccessToken(): Promise<boolean> {
    if (!this.tokens?.refresh_token) {
      console.error('❌ No refresh token available. Re-authorization required.');
      return false;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await fetch(SCHWAB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token:  this.tokens.refresh_token,
        }).toString(),
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed:', await response.text());
        return false;
      }

      const data = await response.json();
      this.tokens.access_token = data.access_token;
      this.tokens.expires_at   = Date.now() + (data.expires_in * 1000);
      if (data.refresh_token) {
        this.tokens.refresh_token      = data.refresh_token;
        this.tokens.refresh_expires_at = Date.now() + (7 * 24 * 60 * 60 * 1000);
      }

      this.saveTokens();
      console.log('🔄 Access token refreshed successfully');
      return true;
    } catch (e) {
      console.error('❌ Token refresh error:', e);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Core authenticated request handler
  // ─────────────────────────────────────────────────────────────
  private async request(url: string, options: RequestInit = {}): Promise<any> {
    // Auto-refresh if token is within 2 minutes of expiry
    if (this.tokens && Date.now() > this.tokens.expires_at - 120000) {
      await this.refreshAccessToken();
    }

    if (!this.tokens?.access_token) {
      throw new Error('No access token — call getAuthorizationUrl() first');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.tokens.access_token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (response.status === 401) {
      console.log('🔄 Token expired mid-request, refreshing...');
      await this.refreshAccessToken();
      return this.request(url, options); // Retry once
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Schwab API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // ─────────────────────────────────────────────────────────────
  // ACCOUNT DATA
  // ─────────────────────────────────────────────────────────────
  async getAccounts(): Promise<any[]> {
    console.log('📊 Fetching Schwab accounts...');
    const data = await this.request(`${SCHWAB_API_BASE}/accounts?fields=positions`);
    return data || [];
  }

  async getAccountHash(): Promise<string | null> {
    if (this.accountHash) return this.accountHash;
    const accounts = await this.getAccounts();
    if (accounts.length > 0) {
      this.accountHash = accounts[0].hashValue;
      console.log(`✅ Using account: ${this.accountHash?.substring(0, 8)}...`);
    }
    return this.accountHash;
  }

  async getPositions(): Promise<SchwabPosition[]> {
    const hash = await this.getAccountHash();
    if (!hash) return [];
    const data = await this.request(`${SCHWAB_API_BASE}/accounts/${hash}?fields=positions`);
    return data?.securitiesAccount?.positions || [];
  }

  async getAccountBalance(): Promise<any> {
    const hash = await this.getAccountHash();
    if (!hash) return null;
    const data = await this.request(`${SCHWAB_API_BASE}/accounts/${hash}`);
    return data?.securitiesAccount?.currentBalances || null;
  }

  // ─────────────────────────────────────────────────────────────
  // MARKET DATA (Level 1 quotes + options chain)
  // ─────────────────────────────────────────────────────────────
  async getQuote(symbol: string): Promise<any> {
    return this.request(`${SCHWAB_MARKET_BASE}/quotes?symbols=${symbol}&fields=quote,reference`);
  }

  async getOptionsChain(symbol: string, strikeCount: number = 20): Promise<any> {
    const params = new URLSearchParams({
      symbol,
      strikeCount: strikeCount.toString(),
      includeUnderlyingQuote: 'true',
      strategy: 'SINGLE',
    });
    return this.request(`${SCHWAB_MARKET_BASE}/chains?${params.toString()}`);
  }

  async getPriceHistory(symbol: string, periodType: string = 'day', period: number = 1, frequencyType: string = 'minute', frequency: number = 1): Promise<any> {
    const params = new URLSearchParams({
      symbol, periodType, period: period.toString(),
      frequencyType, frequency: frequency.toString(),
      needExtendedHoursData: 'false',
    });
    return this.request(`${SCHWAB_MARKET_BASE}/pricehistory?${params.toString()}`);
  }

  // ─────────────────────────────────────────────────────────────
  // ORDER EXECUTION (Paper-safe by default)
  // ─────────────────────────────────────────────────────────────
  async placeOrder(order: SchwabOrder): Promise<string | null> {
    const hash = await this.getAccountHash();
    if (!hash) { console.error('❌ No account hash found'); return null; }

    console.log(`🚀 Placing order: ${order.orderLegCollection[0]?.instrument.symbol} ${order.orderType}`);

    try {
      const response = await fetch(`${SCHWAB_API_BASE}/accounts/${hash}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (response.status === 201) {
        const location = response.headers.get('Location') || '';
        const orderId = location.split('/').pop() || `ORD-${Date.now()}`;
        console.log(`✅ Order placed successfully! Order ID: ${orderId}`);
        return orderId;
      }

      console.error('❌ Order failed:', await response.text());
      return null;
    } catch (e) {
      console.error('❌ Order placement error:', e);
      return null;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const hash = await this.getAccountHash();
    if (!hash) return false;
    try {
      const response = await fetch(`${SCHWAB_API_BASE}/accounts/${hash}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.tokens?.access_token}` },
      });
      return response.ok;
    } catch { return false; }
  }

  async getOrders(): Promise<any[]> {
    const hash = await this.getAccountHash();
    if (!hash) return [];
    const data = await this.request(`${SCHWAB_API_BASE}/accounts/${hash}/orders?status=WORKING`);
    return Array.isArray(data) ? data : [];
  }

  // ─────────────────────────────────────────────────────────────
  // Token Persistence
  // ─────────────────────────────────────────────────────────────
  private saveTokens(): void {
    try {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(this.tokens, null, 2));
    } catch (e) { console.error('⚠️ Could not save tokens:', e); }
  }

  private loadTokens(): void {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        this.tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
        if (this.tokens && Date.now() < this.tokens.expires_at) {
          console.log('✅ Loaded existing Schwab tokens from disk');
        } else {
          console.log('⚠️ Existing tokens expired — refresh needed');
        }
      }
    } catch (e) { this.tokens = null; }
  }

  isAuthenticated(): boolean {
    return !!(this.tokens?.access_token && Date.now() < this.tokens.expires_at);
  }

  isRefreshable(): boolean {
    return !!(this.tokens?.refresh_token && Date.now() < this.tokens.refresh_expires_at);
  }
}

// Export singleton
export const schwabClient = new SchwabClient();
