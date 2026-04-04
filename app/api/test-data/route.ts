import { NextRequest, NextResponse } from 'next/server';
import { polygonDataProvider } from '@/lib/services/polygon-data-provider';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing data provider...');
    
    // Test historical data
    const historicalData = await polygonDataProvider.getHistoricalData(
      'META',
      'day',
      '2024-01-01',
      '2024-01-23'
    );

    // Test options data
    const optionsData = await polygonDataProvider.getOptionsData('META');

    // Test market status
    const marketStatus = await polygonDataProvider.getMarketStatus();

    // Test technical indicators
    const smaData = await polygonDataProvider.getTechnicalIndicators('META', 'sma', {
      timespan: 'day',
      window: 20
    });

    return NextResponse.json({
      success: true,
      message: 'Data provider test successful!',
      test_results: {
        historical_data: {
          count: historicalData.length,
          sample: historicalData.slice(0, 2)
        },
        options_data: {
          count: optionsData.length,
          sample: optionsData.slice(0, 2)
        },
        market_status: marketStatus,
        technical_indicators: {
          sma: smaData
        }
      }
    });

  } catch (error) {
    console.error('Data Provider Test Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test data provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 