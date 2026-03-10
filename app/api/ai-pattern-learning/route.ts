import { NextRequest, NextResponse } from 'next/server';
import { SystematicTrainingEngine } from '../../../lib/services/systematic-training-engine';

// Advanced Pattern Learning System - REAL DATA EDITION
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'SPX';

  console.log(`🧠 AI PATTERN LEARNING for ${symbol} - Accessing Systematic Training Engine...`);

  try {
    const trainingEngine = SystematicTrainingEngine.getInstance();

    // 1. Check for existing session
    const status = trainingEngine.getTrainingStatus();

    if (status && status.symbol === symbol) {
      console.log(`📊 Found active/completed session for ${symbol}: ${status.current_status}`);
      return NextResponse.json({
        success: true,
        source: 'REAL_SYSTEMATIC_ENGINE',
        session_id: status.session_id,
        status: status.current_status,
        progress: status.total_progress,
        summary: status.summary,
        // In a full implementation, we would fetch the detailed patterns from DB here
        message: `Training is ${status.current_status}. Patterns found: ${status.summary.total_patterns_learned}`
      });
    }

    // 2. If no session, start one (or if explicit 'force=true' param)
    if (searchParams.get('force') === 'true' || !status) {
      console.log(`🚀 Starting NEW systematic training for ${symbol}`);
      const newSession = await trainingEngine.startTraining(symbol, 6); // 6 months

      return NextResponse.json({
        success: true,
        source: 'REAL_SYSTEMATIC_ENGINE',
        status: 'STARTED',
        session_id: newSession.session_id,
        message: 'New analysis started via Polygon.io. Check back for results.'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Unexpected state'
    });

  } catch (error) {
    console.error('Pattern learning error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      symbol
    }, { status: 500 });
  }
} 