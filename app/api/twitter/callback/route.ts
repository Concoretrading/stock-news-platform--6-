import { NextRequest, NextResponse } from 'next/server';

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

    const { code, state } = await request.json();

    if (!code || !state) {
      return NextResponse.json({
        success: false,
        error: 'Authorization code and state are required'
      }, { status: 400 });
    }

    // Decode state to get original data
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid state parameter'
      }, { status: 400 });
    }

    const { codeVerifier, redirectUrl } = stateData;

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUrl,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Twitter token exchange failed:', errorData);
      return NextResponse.json({
        success: false,
        error: 'Failed to exchange authorization code for access token'
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user information from Twitter API
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,verified', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Twitter user fetch failed:', errorData);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user information from Twitter'
      }, { status: 400 });
    }

    const userData = await userResponse.json();

    return NextResponse.json({
      success: true,
      user: userData.data,
      accessToken: access_token // You might want to store this securely
    });

  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process Twitter authentication callback'
    }, { status: 500 });
  }
} 