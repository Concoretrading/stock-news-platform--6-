import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Twitter OAuth 2.0 configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

export async function POST(request: NextRequest) {
  try {
    if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'Twitter OAuth credentials not configured'
      }, { status: 500 });
    }

    const { redirectUrl } = await request.json();

    if (!redirectUrl) {
      return NextResponse.json({
        success: false,
        error: 'Redirect URL is required'
      }, { status: 400 });
    }

    // Generate state parameter for security
    const state = crypto.randomBytes(32).toString('hex');
    
    // Generate code verifier and challenge for PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state and code verifier (in production, use a secure session store)
    // For now, we'll include them in the state parameter
    const stateData = {
      state,
      codeVerifier,
      redirectUrl
    };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

    // Twitter OAuth 2.0 authorization URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUrl);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', encodedState);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString()
    });

  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate Twitter authentication'
    }, { status: 500 });
  }
} 