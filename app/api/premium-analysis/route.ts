import { NextResponse } from 'next/server';
import polygonClient from '../../../lib/services/polygon-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'AAPL';
    const keyLevel = parseFloat(searchParams.get('keyLevel') || '0');
    const analysisType = searchParams.get('type') || 'support'; // 'support' or 'resistance'
    const mode = searchParams.get('mode') || 'mispricing'; // 'mispricing' or 'extended'
    
    console.log(`💰 PREMIUM ANALYSIS for ${ticker} - Mode: ${mode.toUpperCase()}`);
    
    if (mode === 'extended') {
      // Extended market conditions analysis - identifies most desirable strikes
      const extendedAnalysis = await polygonClient.analyzeExtendedMarketOpportunities(ticker, keyLevel, analysisType as 'support' | 'resistance');
      
      return NextResponse.json({
        success: true,
        ticker,
        analysisType: 'extended-market-opportunities',
        mode: 'extended',
        keyLevel,
        levelType: analysisType,
        timestamp: new Date().toISOString(),
        ...extendedAnalysis
      });
    } else {
      // Standard premium mispricing analysis
      const premiumAnalysis = await polygonClient.analyzePremiumMispricing(ticker, keyLevel, analysisType as 'support' | 'resistance');
      
      return NextResponse.json({
        success: true,
        ticker,
        analysisType: 'premium-mispricing-detection',
        mode: 'mispricing',
        keyLevel,
        levelType: analysisType,
        timestamp: new Date().toISOString(),
        ...premiumAnalysis
      });
    }
    
  } catch (error) {
    console.error('Premium analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Premium analysis failed' 
    }, { status: 500 });
  }
} 