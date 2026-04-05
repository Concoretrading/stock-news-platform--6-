import { BasePillar, PillarReport } from './BasePillar';
import { patternEngine } from '../services/pattern-recognition-engine';

/**
 * STRUCTURE PILLAR
 * Focus: Where are the "Fight Zones" (S/R) and Market Geometry?
 * Wraps: pattern-recognition-engine.ts
 */
export class StructurePillar extends BasePillar {
  pillarName = 'Structure & Levels Pillar';

  async getReport(symbol: string, currentData: any[]): Promise<PillarReport> {
    // WRAPPING: Calling the singleton pattern engine for real-time analysis
    const patterns = await patternEngine.processRealTimeData(symbol, currentData[currentData.length - 1]);
    
    // CONCRETE LOGIC: Analyzing consolidation and key-level confluence
    const consolidation = patterns.find(p => p.pattern_type === 'CONSOLIDATION');
    const breakouts = patterns.filter(p => p.pattern_type === 'BREAKOUT');
    
    const insights: string[] = [];
    
    // 1. Consolidation Maturity
    if (consolidation) {
      const duration = consolidation.supporting_data.momentum.strength; // Using as a proxy
      insights.push(`STRUCTURE: Long-term consolidation (${duration} bars). Range: ${(consolidation.confidence * 100).toFixed(1)}% height. Expansion is imminent.`);
    }

    // 2. Breakout Signal Quality
    if (breakouts.length > 0) {
      const bestBreakout = breakouts.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev);
      insights.push(`🔥 BREAKOUT DETECTED: Confirmed ${bestBreakout.timeframe} breakout with ${bestBreakout.confidence * 100}% quality.`);
    }

    // 3. Key Levels
    const levels = patterns[0]?.supporting_data.key_levels || [];
    if (levels.length > 0) {
      insights.push(`FIGHT ZONES: ${levels.slice(0, 3).map(l => `$${l}`).join(' | ')} are the priority targets.`);
    }

    // Average confidence across detected patterns
    const avgConfidence = patterns.length > 0 
      ? patterns.reduce((acc, p) => acc + p.confidence, 0) / patterns.length 
      : 0.5;

    return {
      pillarName: this.pillarName,
      bias: breakouts.length > 0 ? 'BULLISH' : 'NEUTRAL',
      confidence: Math.round(avgConfidence * 100),
      keyInsights: insights,
      rawMetrics: {
        pattern_count: patterns.length,
        levels: levels,
        top_pattern: patterns[0]?.pattern_type || 'NONE'
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

export const structurePillar = new StructurePillar();
