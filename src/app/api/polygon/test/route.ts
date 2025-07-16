import { NextResponse } from 'next/server';
import polygonClient from '@/lib/services/polygon-client';

export async function GET() {
  try {
    console.log('Testing Polygon API connection...');
    
    // Test basic API connectivity
    const marketStatus = await polygonClient.getMarketStatus();
    console.log('Market status:', marketStatus);
    
    // Test quote fetching
    const quote = await polygonClient.getDelayedQuote('AAPL');
    console.log('AAPL quote:', quote);
    
    return NextResponse.json({
      success: true,
      message: 'Polygon API connection successful',
      data: {
        marketStatus,
        sampleQuote: quote,
      }
    });
  } catch (error) {
    console.error('Polygon API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 