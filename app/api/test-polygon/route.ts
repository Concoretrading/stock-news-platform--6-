import { NextResponse } from 'next/server';

// ✅ PAID POLYGON API KEY ONLY - $79 STOCKS DEVELOPER PLAN
const API_KEY = 'mTmTNRmv236VbU8ijndr1F5EOJz8NR3s'; // PAID $79 PLAN KEY ONLY
const BASE_URL = 'https://api.polygon.io';

export async function GET(request: Request) {
  try {
    console.log('🔄 Testing Polygon.io connection...');
    
    // Test market status first (to verify API key)
    const marketStatus = await fetch(
      `${BASE_URL}/v1/marketstatus/now?apiKey=${API_KEY}`
    ).then(res => res.json());
    
    console.log('Market status response:', marketStatus);

    // Wait 1 second before next request
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test aggregates endpoint
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'META';
    const date = searchParams.get('date') || '2024-02-01';

    console.log(`Getting aggregates for ${symbol} on ${date}`);

    const aggregatesUrl = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${date}/${date}?adjusted=true&sort=asc&limit=50000&apikey=${API_KEY}`;
    
    const aggregatesResponse = await fetch(aggregatesUrl);
    console.log('Aggregates response status:', aggregatesResponse.status);
    
    const aggregatesData = await aggregatesResponse.json();
    console.log('Aggregates response:', aggregatesData);

    return NextResponse.json({
      success: true,
      message: 'Polygon.io test successful',
      market_status: marketStatus,
      aggregates: aggregatesData
    });

  } catch (error) {
    console.error('Polygon.io test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 