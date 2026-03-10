import { NextResponse } from 'next/server';
import { SystematicTrainingEngine } from '@/lib/services/systematic-training-engine';

function getHistoricalDateRange(): { startDate: string; endDate: string } {
  // Use historical date range that we know has data (August 2023 to February 2024)
  const endDate = new Date('2024-02-05T21:00:00.000Z'); // February 2024
  const startDate = new Date('2023-08-05T14:30:00.000Z'); // August 2023

  // Adjust to market hours  
  startDate.setUTCHours(14, 30, 0, 0); // 9:30 AM EST
  endDate.setUTCHours(21, 0, 0, 0); // 4:00 PM EST
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const symbol = searchParams.get('symbol');
    const months = parseInt(searchParams.get('months') || '1', 10);
    const pillars = searchParams.get('pillars')?.split(',') || ['volume'];

    if (!symbol) {
      return NextResponse.json({ 
        success: false, 
        error: 'Symbol is required',
        suggestion: 'Add symbol parameter: /api/systematic-training?action=start&symbol=META'
      });
    }

    const engine = SystematicTrainingEngine.getInstance();

    switch (action) {
      case 'start': {
        console.log(`🎯 Systematic Training start for ${symbol}`);
        const { startDate, endDate } = getHistoricalDateRange();
        console.log(`📅 Training period: ${startDate} to ${endDate}`);
        
        const session = await engine.startTraining(symbol, months, pillars);
        return NextResponse.json({
          success: true,
          action: 'training_started',
          symbol,
          training_session: session,
          guidance: {
            can_pause: true,
            monitor_endpoint: `/api/systematic-training?action=status&symbol=${symbol}`,
            expected_completion: session.estimated_completion,
            rate_limit_handling: 'Automatic with 65-second delays'
          }
        });
      }

      case 'status': {
        const session = engine.getTrainingStatus();
        if (!session) {
          return NextResponse.json({
            success: false,
            error: 'No active training session found',
            suggestion: `Start training with: /api/systematic-training?action=start&symbol=${symbol}`
          });
        }

        // Calculate progress metrics
        const total = session.total_progress.length;
        const completed = session.total_progress.filter(p => p.status === 'completed').length;
        const errors = session.total_progress.filter(p => p.status === 'error').length;
        const inProgress = session.total_progress.filter(p => p.status === 'in_progress').length;
        const pending = session.total_progress.filter(p => p.status === 'pending').length;

        // Calculate pillar-specific progress
        const pillarProgress = session.pillars_to_train.map(pillar => {
          const pillarPeriods = session.total_progress.filter(p => p.pillar === pillar);
          const pillarCompleted = pillarPeriods.filter(p => p.status === 'completed').length;
          const pillarPatterns = pillarPeriods.reduce((sum, p) => sum + p.patterns_learned, 0);
          return {
            pillar,
            total_periods: pillarPeriods.length,
            completed_periods: pillarCompleted,
            completion_percentage: pillarCompleted / pillarPeriods.length,
            total_patterns_learned: pillarPatterns
          };
        });

        // Calculate time metrics
        const now = new Date();
        const end = new Date(session.estimated_completion);
        const minutesRemaining = Math.max(0, Math.round((end.getTime() - now.getTime()) / (60 * 1000)));
        const hoursRemaining = Math.floor(minutesRemaining / 60);
        const remainingMinutes = minutesRemaining % 60;
        const timeRemaining = hoursRemaining > 0 
          ? `${hoursRemaining}h ${remainingMinutes}m`
          : `${remainingMinutes}m`;

        // Calculate patterns per minute
        const startTime = new Date(session.start_time);
        const minutesElapsed = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / (60 * 1000)));
        const patternsPerMinute = Math.round(session.summary.total_patterns_learned / minutesElapsed);

        return NextResponse.json({
          success: true,
          action: 'status_check',
          training_session: session,
          progress_summary: {
            total_periods: total,
            completed_periods: completed,
            error_periods: errors,
            in_progress_periods: inProgress,
            pending_periods: pending,
            completion_percentage: completed / total,
            pillar_progress: pillarProgress
          },
          live_metrics: {
            completion_percentage: completed / total,
            estimated_time_remaining: timeRemaining,
            patterns_per_minute: patternsPerMinute,
            current_pillar: inProgress > 0 
              ? session.total_progress.find(p => p.status === 'in_progress')?.pillar 
              : 'None'
          }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          suggestion: 'Valid actions are: start, status'
        });
    }
  } catch (error) {
    console.error('Error in systematic training:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check logs for details'
    });
  }
} 