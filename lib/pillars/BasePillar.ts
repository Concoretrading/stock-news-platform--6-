import { ExpertOpinion } from '../services/expert-council-system';

export type MarketBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface PillarReport {
  pillarName: string;
  bias: MarketBias;
  confidence: number; // 0-100
  keyInsights: string[]; // High-context strings for Nemotron reasoning
  rawMetrics: Record<string, any>; // Supporting numerical data
  lastUpdated: string;
}

export abstract class BasePillar {
  abstract pillarName: string;
  
  /**
   * Generates a standardized intelligence report by aggregating sub-experts.
   */
  abstract getReport(symbol: string, currentPrice: number, data?: any[]): Promise<PillarReport>;

  protected calculateAggregateBias(opinions: ExpertOpinion[]): MarketBias {
    let bull = 0;
    let bear = 0;
    
    opinions.forEach(o => {
      const signal = o.signal.split('_').pop(); 
      if (signal === 'BUY') bull += o.confidence;
      if (signal === 'SELL') bear += o.confidence;
    });

    if (bull > bear + 20) return 'BULLISH';
    if (bear > bull + 20) return 'BEARISH';
    return 'NEUTRAL';
  }

  protected calculateAverageConfidence(opinions: ExpertOpinion[]): number {
    if (opinions.length === 0) return 0;
    const sum = opinions.reduce((acc, o) => acc + o.confidence, 0);
    return Math.round(sum / opinions.length);
  }
}
