import { BasePillar, PillarReport } from './BasePillar';
import { MomentumSqueezeExpert } from '../services/momentum-squeeze-expert';

/**
 * MOMENTUM PILLAR
 * Focus: How fast is it moving & in which direction? 
 * Concrete Example: Detecting TTM Squeeze firing (compression → explosion).
 */
export class MomentumPillar extends BasePillar {
  pillarName = 'Momentum & Squeeze Pillar';
  private expert = new MomentumSqueezeExpert();

  async getReport(symbol: string, currentPrice: number, data: any[]): Promise<PillarReport> {
    // WRAPPING: Utilizing the expert council "formOpinion" method
    const opinion = await this.expert.formOpinion(data);
    
    const insights: string[] = [];
    const isSqueezeOn = opinion.reasoning.some(r => r.includes('SQUEEZE_ON'));
    const justFired = opinion.reasoning.some(r => r.includes('just_fired'));
    
    // 1. Squeeze Status
    if (isSqueezeOn) {
      insights.push(`🟠 SQUEEZE DETECTED: Energy is storing. ${opinion.confidence}% confidence in a build-up phase.`);
    } else if (justFired) {
      insights.push(`🚀 SQUEEZE FIRED: Breakout initiated with ${opinion.confidence}% momentum strength.`);
    }

    // 2. Momentum Direction
    if (opinion.signal === 'BUY' || opinion.signal === 'STRONG_BUY') {
      insights.push('📈 MOMENTUM: Bullish acceleration confirmed by TTM histogram.');
    } else if (opinion.signal === 'SELL' || opinion.signal === 'STRONG_SELL') {
      insights.push('📉 MOMENTUM: Bearish acceleration confirmed by TTM histogram.');
    }

    // 3. Risk Assessment
    if (opinion.risk_assessment > 70) {
      insights.push('⚠️  WARNING: High-risk momentum extension. Pullback likely before further continuation.');
    }

    return {
      pillarName: this.pillarName,
      bias: opinion.signal.includes('BUY') ? 'BULLISH' : opinion.signal.includes('SELL') ? 'BEARISH' : 'NEUTRAL',
      confidence: opinion.confidence,
      keyInsights: insights,
      rawMetrics: {
        signal: opinion.signal,
        risk: opinion.risk_assessment,
        success_rate: this.expert.success_rate,
        patterns: opinion.supporting_patterns
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const momentumPillar = new MomentumPillar();
