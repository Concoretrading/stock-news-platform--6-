import { OptionStrike, PremiumAnalysis, ConsolidationPremiumPattern } from './options-premium-mastery';

interface HistoricalBreakoutLearning {
  direction: 'bullish' | 'bearish';
  priceRange: {
    start: number;
    end: number;
    percentage: number;
  };
  consolidationDuration: number;
  premiumBehavior: {
    preBreakout: {
      ivRange: { low: number; high: number };
      atr1Premium: number;
      atr2Premium: number;
      volumeProfile: 'accumulation' | 'distribution' | 'neutral';
    };
    duringBreakout: {
      premiumExpansion: {
        atr1: number; // percentage gain
        atr2: number;
      };
      volumeSpike: number;
      timeToMaxProfit: number;
    };
  };
  successMetrics: {
    profitFactor: number;
    winRate: number;
    averageReturn: number;
    optimalScalingPoints: number[]; // Percentages where scaling worked best
  };
}

interface ScalingStrategy {
  entryStages: {
    initial: {
      size: number; // Percentage of total position
      trigger: string;
      strike: string;
    };
    scaling: {
      size: number;
      trigger: string;
      strike: string;
    }[];
  };
  exitStages: {
    targets: {
      percentage: number;
      size: number;
      adjustStopTo: number;
    }[];
    finalTarget: {
      percentage: number;
      condition: string;
    };
  };
  hedgeRules: {
    initialHedge: {
      type: 'put' | 'spread';
      strike: string;
      size: number;
      when: string;
    };
    adjustHedge: {
      trigger: string;
      action: string;
    }[];
  };
}

interface RealTimeProbabilitySignal {
  timestamp: string;
  ticker: string;
  currentPrice: number;
  atr: number;
  
  consolidation: {
    isConsolidating: boolean;
    duration: number;
    compressionScore: number; // 0-100
    breakoutProbability: number;
    expectedDirection: 'bullish' | 'bearish' | 'neutral';
  };

  premiumSetup: {
    ivPercentile: number;
    ivCompressionScore: number;
    optimalStrikes: {
      atr1: {
        strike: number;
        premium: number;
        probability: number;
        historicalSuccess: number;
      };
      atr2: {
        strike: number;
        premium: number;
        probability: number;
        historicalSuccess: number;
      };
    };
  };

  volumeProfile: {
    accumulation: boolean;
    distribution: boolean;
    unusualActivity: {
      calls: boolean;
      puts: boolean;
      ratio: number;
    };
  };

  probabilityAssessment: {
    breakoutProbability: number;
    expectedMoveSize: number;
    confidenceScore: number;
    keyRisks: string[];
  };

  recommendedStrategy: ScalingStrategy;
}

export class PremiumProbabilityEngine {
  private historicalPatterns: HistoricalBreakoutLearning[] = [];
  private activeScalingStrategies: Map<string, ScalingStrategy> = new Map();
  
  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log('🧠 INITIALIZING PREMIUM PROBABILITY ENGINE');
    console.log('📚 Loading historical breakout patterns...');
    console.log('⚡ Setting up real-time probability analysis...');
    console.log('🎯 Configuring elite scaling strategies...');
  }

  async analyzeSetup(
    ticker: string,
    currentPrice: number,
    consolidationPatterns: ConsolidationPremiumPattern[],
    optionChain: OptionStrike[],
    atr: number
  ): Promise<RealTimeProbabilitySignal> {
    console.log(`🧠 ANALYZING PROBABILITY SETUP for ${ticker}`);

    // Learn from historical patterns
    const relevantPatterns = this.findSimilarPatterns(consolidationPatterns, currentPrice, atr);
    const historicalLearnings = this.extractPatternLearnings(relevantPatterns);

    // Analyze current consolidation
    const consolidationAnalysis = this.analyzeCurrentConsolidation(currentPrice, atr, historicalLearnings);

    // Analyze premium setup
    const premiumSetup = this.analyzePremiumSetup(optionChain, atr, historicalLearnings);

    // Volume analysis
    const volumeProfile = this.analyzeVolumeProfile(optionChain, historicalLearnings);

    // Calculate probabilities
    const probability = this.calculateBreakoutProbability(
      consolidationAnalysis,
      premiumSetup,
      volumeProfile,
      historicalLearnings
    );

    // Generate scaling strategy
    const strategy = this.generateScalingStrategy(
      probability,
      premiumSetup,
      atr,
      historicalLearnings
    );

    return {
      timestamp: new Date().toISOString(),
      ticker,
      currentPrice,
      atr,
      consolidation: consolidationAnalysis,
      premiumSetup,
      volumeProfile,
      probabilityAssessment: probability,
      recommendedStrategy: strategy
    };
  }

  private findSimilarPatterns(
    patterns: ConsolidationPremiumPattern[],
    currentPrice: number,
    atr: number
  ): ConsolidationPremiumPattern[] {
    // Find patterns with similar characteristics
    return patterns.filter(pattern => {
      const priceRangeSimilar = Math.abs(pattern.consolidationPeriod.priceRange.percentRange - (atr / currentPrice * 100)) < 1;
      const ivCompressionSimilar = pattern.premiumPatterns.ivCompressionPattern.compressionRate > 0.8;
      return priceRangeSimilar && ivCompressionSimilar;
    });
  }

  private extractPatternLearnings(patterns: ConsolidationPremiumPattern[]): HistoricalBreakoutLearning[] {
    return patterns.map(pattern => ({
      direction: pattern.breakoutPremiumExpansion.call_1atr > pattern.breakoutPremiumExpansion.put_1atr ? 'bullish' : 'bearish',
      priceRange: {
        start: pattern.consolidationPeriod.priceRange.low,
        end: pattern.consolidationPeriod.priceRange.high,
        percentage: pattern.consolidationPeriod.priceRange.percentRange
      },
      consolidationDuration: pattern.consolidationPeriod.duration,
      premiumBehavior: {
        preBreakout: {
          ivRange: {
            low: pattern.premiumPatterns.ivCompressionPattern.minIV,
            high: pattern.premiumPatterns.ivCompressionPattern.initialIV
          },
          atr1Premium: pattern.breakoutPremiumExpansion.preBreakoutPremium.call_1atr,
          atr2Premium: pattern.breakoutPremiumExpansion.preBreakoutPremium.call_2atr,
          volumeProfile: pattern.premiumPatterns.volumePatterns.averageVolumeRatio > 1 ? 'accumulation' : 
                        pattern.premiumPatterns.volumePatterns.averageVolumeRatio < 0.7 ? 'distribution' : 'neutral'
        },
        duringBreakout: {
          premiumExpansion: {
            atr1: (pattern.breakoutPremiumExpansion.maxExpansion.call_1atr / pattern.breakoutPremiumExpansion.preBreakoutPremium.call_1atr - 1) * 100,
            atr2: (pattern.breakoutPremiumExpansion.maxExpansion.call_2atr / pattern.breakoutPremiumExpansion.preBreakoutPremium.call_2atr - 1) * 100
          },
          volumeSpike: Math.max(...pattern.premiumPatterns.volumePatterns.call_1atr_volume) / 
                      Math.min(...pattern.premiumPatterns.volumePatterns.call_1atr_volume),
          timeToMaxProfit: pattern.breakoutPremiumExpansion.maxExpansion.daysToMax
        }
      },
      successMetrics: {
        profitFactor: pattern.breakoutPremiumExpansion.profitabilityScore / 20,
        winRate: pattern.breakoutPremiumExpansion.profitabilityScore / 100,
        averageReturn: pattern.breakoutPremiumExpansion.maxExpansion.call_1atr / pattern.breakoutPremiumExpansion.preBreakoutPremium.call_1atr,
        optimalScalingPoints: [33, 50, 75, 90] // Default scaling points, would be learned from actual data
      }
    }));
  }

  private analyzeCurrentConsolidation(
    currentPrice: number,
    atr: number,
    historicalLearnings: HistoricalBreakoutLearning[]
  ): RealTimeProbabilitySignal['consolidation'] {
    const avgDuration = Math.avg(historicalLearnings.map(p => p.consolidationDuration));
    const avgRange = Math.avg(historicalLearnings.map(p => p.priceRange.percentage));
    
    // Calculate compression score based on historical patterns
    const compressionScore = historicalLearnings.reduce((score, pattern) => {
      const durationSimilarity = 1 - Math.abs(pattern.consolidationDuration - avgDuration) / avgDuration;
      const rangeSimilarity = 1 - Math.abs(pattern.priceRange.percentage - avgRange) / avgRange;
      return score + (durationSimilarity + rangeSimilarity) / 2;
    }, 0) / historicalLearnings.length * 100;

    // Determine expected direction
    const bullishPatterns = historicalLearnings.filter(p => p.direction === 'bullish').length;
    const bearishPatterns = historicalLearnings.filter(p => p.direction === 'bearish').length;
    const expectedDirection = bullishPatterns > bearishPatterns ? 'bullish' : 
                            bearishPatterns > bullishPatterns ? 'bearish' : 'neutral';

    return {
      isConsolidating: true,
      duration: 12, // Would come from real data
      compressionScore,
      breakoutProbability: compressionScore * 0.8, // Higher compression = higher probability
      expectedDirection
    };
  }

  private analyzePremiumSetup(
    optionChain: OptionStrike[],
    atr: number,
    historicalLearnings: HistoricalBreakoutLearning[]
  ): RealTimeProbabilitySignal['premiumSetup'] {
    // Calculate current IV percentile and compression
    const currentIV = Math.avg(optionChain.map(opt => opt.implied_volatility));
    const ivPercentile = Math.percentileRank(currentIV, historicalLearnings.map(p => p.premiumBehavior.preBreakout.ivRange.high));
    
    // Calculate compression score
    const ivCompressionScore = (1 - (currentIV - Math.min(...historicalLearnings.map(p => p.premiumBehavior.preBreakout.ivRange.low))) / 
                              (Math.max(...historicalLearnings.map(p => p.premiumBehavior.preBreakout.ivRange.high)) - 
                               Math.min(...historicalLearnings.map(p => p.premiumBehavior.preBreakout.ivRange.low)))) * 100;

    // Find optimal strikes based on ATR
    const atr1Strike = optionChain.find(opt => Math.abs(opt.strike - (currentPrice + atr)) < 0.5);
    const atr2Strike = optionChain.find(opt => Math.abs(opt.strike - (currentPrice + 2 * atr)) < 0.5);

    // Calculate probabilities based on historical success
    const atr1Success = Math.avg(historicalLearnings.map(p => p.successMetrics.winRate * 100));
    const atr2Success = Math.avg(historicalLearnings.map(p => p.successMetrics.winRate * 70)); // 2 ATR typically has lower probability

    return {
      ivPercentile,
      ivCompressionScore,
      optimalStrikes: {
        atr1: {
          strike: atr1Strike?.strike || 0,
          premium: atr1Strike?.mark || 0,
          probability: atr1Success,
          historicalSuccess: Math.avg(historicalLearnings.map(p => p.successMetrics.winRate * 100))
        },
        atr2: {
          strike: atr2Strike?.strike || 0,
          premium: atr2Strike?.mark || 0,
          probability: atr2Success,
          historicalSuccess: Math.avg(historicalLearnings.map(p => p.successMetrics.winRate * 70))
        }
      }
    };
  }

  private analyzeVolumeProfile(
    optionChain: OptionStrike[],
    historicalLearnings: HistoricalBreakoutLearning[]
  ): RealTimeProbabilitySignal['volumeProfile'] {
    const callVolume = optionChain.filter(opt => opt.type === 'CALL').reduce((sum, opt) => sum + opt.volume, 0);
    const putVolume = optionChain.filter(opt => opt.type === 'PUT').reduce((sum, opt) => sum + opt.volume, 0);
    
    // Compare to historical volume patterns
    const avgHistoricalVolume = Math.avg(historicalLearnings.map(p => p.premiumBehavior.duringBreakout.volumeSpike));
    
    return {
      accumulation: callVolume / putVolume > 1.5,
      distribution: putVolume / callVolume > 1.5,
      unusualActivity: {
        calls: callVolume > avgHistoricalVolume * 1.5,
        puts: putVolume > avgHistoricalVolume * 1.5,
        ratio: callVolume / putVolume
      }
    };
  }

  private calculateBreakoutProbability(
    consolidation: RealTimeProbabilitySignal['consolidation'],
    premiumSetup: RealTimeProbabilitySignal['premiumSetup'],
    volumeProfile: RealTimeProbabilitySignal['volumeProfile'],
    historicalLearnings: HistoricalBreakoutLearning[]
  ): RealTimeProbabilitySignal['probabilityAssessment'] {
    // Weight different factors
    const consolidationWeight = 0.35;
    const premiumWeight = 0.35;
    const volumeWeight = 0.30;

    // Calculate component probabilities
    const consolidationProb = consolidation.compressionScore / 100;
    const premiumProb = premiumSetup.ivCompressionScore / 100;
    const volumeProb = volumeProfile.accumulation ? 0.8 : volumeProfile.distribution ? 0.3 : 0.5;

    // Calculate weighted probability
    const breakoutProbability = (
      consolidationProb * consolidationWeight +
      premiumProb * premiumWeight +
      volumeProb * volumeWeight
    ) * 100;

    // Calculate expected move size based on historical patterns
    const expectedMoveSize = Math.avg(historicalLearnings.map(p => p.premiumBehavior.duringBreakout.premiumExpansion.atr1));

    // Calculate confidence score
    const confidenceScore = Math.min(
      breakoutProbability,
      Math.avg(historicalLearnings.map(p => p.successMetrics.profitFactor * 20))
    );

    // Identify key risks
    const keyRisks = [];
    if (premiumSetup.ivPercentile < 20) keyRisks.push('Low IV environment - reduced premium potential');
    if (volumeProfile.unusualActivity.puts > volumeProfile.unusualActivity.calls) keyRisks.push('Put accumulation detected');
    if (consolidation.duration > Math.avg(historicalLearnings.map(p => p.consolidationDuration)) * 1.5) keyRisks.push('Extended consolidation - increased breakout failure risk');

    return {
      breakoutProbability,
      expectedMoveSize,
      confidenceScore,
      keyRisks
    };
  }

  private generateScalingStrategy(
    probability: RealTimeProbabilitySignal['probabilityAssessment'],
    premiumSetup: RealTimeProbabilitySignal['premiumSetup'],
    atr: number,
    historicalLearnings: HistoricalBreakoutLearning[]
  ): ScalingStrategy {
    // Determine optimal scaling points based on historical success
    const optimalPoints = historicalLearnings.reduce((points, pattern) => {
      pattern.successMetrics.optimalScalingPoints.forEach((point, i) => {
        points[i] = (points[i] || 0) + point;
      });
      return points;
    }, [] as number[]).map(total => total / historicalLearnings.length);

    // Generate entry stages based on probability
    const initialSize = probability.confidenceScore > 80 ? 0.4 : 
                       probability.confidenceScore > 60 ? 0.3 : 0.2;

    return {
      entryStages: {
        initial: {
          size: initialSize,
          trigger: 'Breakout confirmation with volume',
          strike: '1 ATR Call'
        },
        scaling: [
          {
            size: 0.3,
            trigger: 'First target hit with momentum',
            strike: '1 ATR Call'
          },
          {
            size: 0.3,
            trigger: 'Second target hit with continued strength',
            strike: '2 ATR Call'
          }
        ]
      },
      exitStages: {
        targets: [
          {
            percentage: optimalPoints[0],
            size: 0.3,
            adjustStopTo: 0
          },
          {
            percentage: optimalPoints[1],
            size: 0.3,
            adjustStopTo: optimalPoints[0]
          },
          {
            percentage: optimalPoints[2],
            size: 0.3,
            adjustStopTo: optimalPoints[1]
          }
        ],
        finalTarget: {
          percentage: optimalPoints[3],
          condition: 'Hold remaining 10% until momentum exhaustion'
        }
      },
      hedgeRules: {
        initialHedge: {
          type: 'put',
          strike: 'ATM Put',
          size: 0.2,
          when: 'After 2nd target hit'
        },
        adjustHedge: [
          {
            trigger: 'Momentum weakening',
            action: 'Increase hedge to 0.3'
          },
          {
            trigger: 'Key support break',
            action: 'Increase hedge to 0.5'
          }
        ]
      }
    };
  }
}

// Helper functions
declare global {
  interface Math {
    avg(arr: number[]): number;
    percentileRank(value: number, array: number[]): number;
  }
}

Math.avg = function(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

Math.percentileRank = function(value: number, array: number[]): number {
  const sorted = array.slice().sort((a, b) => a - b);
  const index = sorted.findIndex(x => x >= value);
  return (index / sorted.length) * 100;
}; 