import { NextRequest, NextResponse } from 'next/server';
import { ExpertCouncil } from '../../../lib/services/expert-council-system';
import { PolygonDataProvider } from '../../../lib/services/polygon-data-provider';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'META';
    const action = searchParams.get('action') || 'decision'; // 'train', 'decision', 'status'
    const months = parseInt(searchParams.get('months') || '3');
    
    console.log(`🏛️ Expert Council ${action} for ${symbol}`);
    
    const council = new ExpertCouncil();
    const dataProvider = new PolygonDataProvider();
    
    if (action === 'train') {
      // Training phase
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log(`🎓 Training experts on ${months} months of data`);
      
      // Get training data (daily timeframe for comprehensive learning)
      const trainingData = await dataProvider.getHistoricalData(
        symbol,
        startDateStr,
        endDateStr,
        'day',
        10000
      );
      
      if (!trainingData || trainingData.length < 50) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient training data'
        }, { status: 400 });
      }
      
      // Train all experts
      await council.trainAllExperts(trainingData, symbol);
      
      const status = council.getCouncilStatus();
      
      return NextResponse.json({
        success: true,
        action: 'training_complete',
        symbol,
        training_period: `${months} months`,
        data_points: trainingData.length,
        council_status: status,
        training_summary: {
          experts_trained: status.total_experts,
          qualified_experts: status.qualified_experts,
          avg_expertise_gained: status.avg_expertise,
          ready_for_decisions: status.qualified_experts > 0
        }
      });
      
    } else if (action === 'decision') {
      // Decision making phase
      console.log(`📊 Getting recent data for decision...`);
      
      // Get recent data for decision making
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Last 30 days
      
      const recentData = await dataProvider.getHistoricalData(
        symbol,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        '1hour',
        1000
      );
      
      if (!recentData || recentData.length < 20) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient recent data for decision'
        }, { status: 400 });
      }
      
      // Check if experts are trained
      const status = council.getCouncilStatus();
      if (status.qualified_experts === 0) {
        return NextResponse.json({
          success: false,
          error: 'No qualified experts available. Please train the council first.',
          suggestion: `Call /api/expert-council?action=train&symbol=${symbol}&months=3`
        }, { status: 400 });
      }
      
      // Make council decision
      const decision = await council.makeCouncilDecision(recentData, symbol);
      
      return NextResponse.json({
        success: true,
        action: 'decision_made',
        symbol,
        council_decision: decision,
        council_status: status,
        market_context: {
          data_points_analyzed: recentData.length,
          current_price: recentData[recentData.length - 1]?.c,
          price_change_24h: this.calculatePriceChange(recentData),
          volume_trend: this.calculateVolumeTrend(recentData)
        },
        execution_guidance: {
          should_act: decision.confidence_score > 60,
          risk_level: decision.final_recommendation.max_risk > 70 ? 'HIGH' : 
                     decision.final_recommendation.max_risk > 40 ? 'MEDIUM' : 'LOW',
          position_size_suggestion: this.calculatePositionSize(decision),
          stop_loss_suggestion: this.calculateStopLoss(recentData, decision)
        }
      });
      
    } else if (action === 'status') {
      // Status check
      const status = council.getCouncilStatus();
      
      return NextResponse.json({
        success: true,
        action: 'status_check',
        council_status: status,
        recommendations: this.generateStatusRecommendations(status)
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: train, decision, or status'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in Expert Council:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Helper methods
function calculatePriceChange(data: any[]): number {
  if (data.length < 24) return 0;
  const current = data[data.length - 1].c;
  const dayAgo = data[data.length - 24].c;
  return ((current - dayAgo) / dayAgo) * 100;
}

function calculateVolumeTrend(data: any[]): string {
  if (data.length < 10) return 'UNKNOWN';
  
  const recent = data.slice(-5);
  const previous = data.slice(-10, -5);
  
  const recentAvg = recent.reduce((sum, bar) => sum + bar.v, 0) / recent.length;
  const previousAvg = previous.reduce((sum, bar) => sum + bar.v, 0) / previous.length;
  
  const change = (recentAvg - previousAvg) / previousAvg;
  
  if (change > 0.2) return 'INCREASING';
  if (change < -0.2) return 'DECREASING';
  return 'STABLE';
}

function calculatePositionSize(decision: any): string {
  const confidence = decision.confidence_score;
  const risk = decision.final_recommendation.max_risk;
  
  if (confidence > 80 && risk < 30) return 'LARGE (3-5% of portfolio)';
  if (confidence > 60 && risk < 50) return 'MEDIUM (1-3% of portfolio)';
  if (confidence > 40 && risk < 70) return 'SMALL (0.5-1% of portfolio)';
  return 'MINIMAL (0.1-0.5% of portfolio)';
}

function calculateStopLoss(data: any[], decision: any): number {
  const current_price = data[data.length - 1].c;
  const volatility = this.calculateVolatility(data.slice(-20));
  const risk_multiplier = decision.final_recommendation.max_risk / 100;
  
  const stop_distance = volatility * risk_multiplier * 2;
  
  if (decision.majority_signal.includes('BUY')) {
    return current_price - stop_distance;
  } else if (decision.majority_signal.includes('SELL')) {
    return current_price + stop_distance;
  }
  
  return current_price;
}

function calculateVolatility(data: any[]): number {
  if (data.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].c - data[i-1].c) / data[i-1].c);
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * data[data.length - 1].c;
}

function generateStatusRecommendations(status: any): string[] {
  const recommendations = [];
  
  if (status.qualified_experts === 0) {
    recommendations.push('Train the expert council with historical data');
  }
  
  if (status.avg_expertise < 50) {
    recommendations.push('Increase training data to improve expert expertise');
  }
  
  if (status.qualified_experts < status.total_experts) {
    recommendations.push(`${status.total_experts - status.qualified_experts} experts need more training`);
  }
  
  if (status.qualified_experts >= 2) {
    recommendations.push('Council ready for decision making');
  }
  
  return recommendations;
} 