import { NextResponse } from 'next/server';
import { restClient } from '@polygon.io/client-js';

export async function GET() {
  try {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY environment variable is not set');
    }

    console.log('Testing Polygon API with key:', apiKey);
    const client = restClient(apiKey);

    // Test market status
    const marketStatus = await client.reference.marketStatus();
    console.log('Market status:', marketStatus);

    // Test delayed quote for AAPL
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - 2);
    const date = targetDate.toISOString().split('T')[0];
    
    const quote = await client.stocks.dailyOpenClose('AAPL', date);
    console.log('AAPL quote:', quote);

    // Test aggregates for historical data
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - 2);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 10);

    const end = endDate.toISOString().split('T')[0];
    const start = startDate.toISOString().split('T')[0];

    const aggregates = await client.stocks.aggregates('AAPL', 1, 'day', start, end, {
      adjusted: true,
      sort: 'asc',
      limit: 50
    });
    console.log(`Historical data points: ${aggregates.results?.length || 0}`);

    // Return successful test results
    return NextResponse.json({
      success: true,
      marketStatus,
      quote,
      historicalDataPoints: aggregates.results?.length || 0,
      message: 'Successfully fetched real market data from Polygon.io'
    });

  } catch (error) {
    console.error('Polygon API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch market data from Polygon.io'
    }, { status: 500 });
  }
} 