import { NextRequest, NextResponse } from 'next/server';

// Indicator Correlation Matrix for Breakout Success
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',') || ['SPX', 'NDX'];
  const minOccurrences = parseInt(searchParams.get('minOccurrences') || '10');
  
  console.log(`🔗 CORRELATION MATRIX for ${symbols.join(', ')} - Finding indicator relationships...`);
  
  try {
    // Build comprehensive correlation analysis
    const correlationMatrix = await buildCorrelationMatrix(symbols, minOccurrences);
    
    return NextResponse.json({
      success: true,
      symbols,
      analysisDate: new Date().toISOString(),
      ...correlationMatrix
    });
    
  } catch (error) {
    console.error('Correlation matrix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      symbols
    }, { status: 500 });
  }
}

// Build correlation matrix between all indicators
async function buildCorrelationMatrix(symbols: string[], minOccurrences: number) {
  console.log(`📊 Building correlation matrix for ${symbols.length} symbols...`);
  
  // Get historical breakout data for all symbols
  const allBreakouts = [];
  for (const symbol of symbols) {
    const symbolBreakouts = await getSymbolBreakouts(symbol);
    allBreakouts.push(...symbolBreakouts);
  }
  
  console.log(`📈 Analyzing ${allBreakouts.length} total breakouts across all symbols`);
  
  // Define all possible indicators
  const indicators = [
    'VOLUME_SPIKE_2X',
    'VOLUME_SPIKE_3X', 
    'VOLUME_SPIKE_4X',
    'SQUEEZE_DAILY_GREEN',
    'SQUEEZE_4H_GREEN',
    'SQUEEZE_1H_GREEN',
    'SQUEEZE_30M_GREEN',
    'SQUEEZE_15M_GREEN',
    'SQUEEZE_5M_GREEN',
    'SQUEEZE_1M_GREEN',
    'MULTIPLE_TF_GREEN_2',
    'MULTIPLE_TF_GREEN_3',
    'MULTIPLE_TF_GREEN_4',
    'MULTIPLE_TF_GREEN_5_PLUS',
    'TIGHT_COMPRESSION_BLACK',
    'TIGHT_COMPRESSION_YELLOW',
    'MOMENTUM_DAILY_BULL',
    'MOMENTUM_4H_BULL',
    'MOMENTUM_1H_BULL',
    'MOMENTUM_ALIGNED_3_PLUS',
    'MOMENTUM_ALIGNED_ALL',
    'CALL_PREMIUM_ELEVATED',
    'PUT_PREMIUM_COMPRESSED',
    'PREMIUM_SKEW_CALL_HEAVY',
    'NEAR_KEY_LEVEL_1PCT',
    'NEAR_KEY_LEVEL_HALF_PCT',
    'AT_RESISTANCE',
    'AT_SUPPORT',
    'VIX_LOW_15',
    'VIX_LOW_20',
    'VIX_HIGH_25',
    'VIX_HIGH_30',
    'MARKET_TRENDING_UP',
    'MARKET_SIDEWAYS',
    'CONSOLIDATION_15_25_DAYS',
    'CONSOLIDATION_25_PLUS_DAYS'
  ];
  
  // Calculate occurrence matrix
  const occurrenceMatrix = calculateOccurrenceMatrix(allBreakouts, indicators);
  
  // Calculate correlation matrix
  const correlationMatrix = calculateIndicatorCorrelations(allBreakouts, indicators, minOccurrences);
  
  // Find the strongest combinations
  const strongestCombinations = findStrongestCombinations(correlationMatrix, occurrenceMatrix, minOccurrences);
  
  // Analyze indicator hierarchy
  const indicatorHierarchy = analyzeIndicatorHierarchy(allBreakouts, indicators);
  
  return {
    summary: {
      totalBreakouts: allBreakouts.length,
      totalIndicators: indicators.length,
      strongCombinations: strongestCombinations.length,
      avgSuccessRate: Math.round(allBreakouts.filter(b => b.outcome === 'SUCCESS').length / allBreakouts.length * 100)
    },
    correlationMatrix,
    occurrenceMatrix,
    strongestCombinations,
    indicatorHierarchy,
    keyFindings: generateKeyFindings(correlationMatrix, strongestCombinations, indicatorHierarchy)
  };
}

// Get breakout data for a specific symbol
async function getSymbolBreakouts(symbol: string) {
  // Mock realistic breakout data based on historical patterns
  const breakouts = [];
  
  for (let i = 0; i < 150; i++) { // 150 breakouts per symbol over 4 years
    const breakout = {
      symbol,
      date: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      outcome: Math.random() > 0.35 ? 'SUCCESS' : 'FAILURE', // 65% base success rate
      
      // Volume indicators
      volumeMultiple: 1 + (Math.random() * 4),
      
      // Squeeze indicators per timeframe
      squeezeDaily: getRandomSqueezeState(),
      squeeze4H: getRandomSqueezeState(),
      squeeze1H: getRandomSqueezeState(),
      squeeze30M: getRandomSqueezeState(),
      squeeze15M: getRandomSqueezeState(),
      squeeze5M: getRandomSqueezeState(),
      squeeze1M: getRandomSqueezeState(),
      
      // Momentum indicators
      momentumDaily: Math.random() > 0.4 ? 'BULLISH' : 'BEARISH',
      momentum4H: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
      momentum1H: Math.random() > 0.6 ? 'BULLISH' : 'BEARISH',
      
      // Premium indicators
      callPremiumElevated: Math.random() > 0.5,
      putPremiumCompressed: Math.random() > 0.6,
      premiumSkewCallHeavy: Math.random() > 0.5,
      
      // Key level indicators
      nearKeyLevel: Math.random() > 0.4,
      distanceFromKeyLevel: Math.random() * 2, // 0-2%
      keyLevelType: Math.random() > 0.5 ? 'RESISTANCE' : 'SUPPORT',
      
      // Market context
      vixLevel: 15 + (Math.random() * 25), // 15-40
      marketCondition: ['TRENDING_UP', 'SIDEWAYS', 'TRENDING_DOWN'][Math.floor(Math.random() * 3)],
      consolidationDays: 10 + Math.floor(Math.random() * 30),
      
      // Outcome metrics
      maxGain: Math.random() > 0.35 ? (1 + Math.random() * 9) : 0,
      maxLoss: Math.random() <= 0.35 ? -(0.5 + Math.random() * 4) : 0
    };
    
    breakouts.push(breakout);
  }
  
  return breakouts;
}

// Calculate which indicators occur together
function calculateOccurrenceMatrix(breakouts: any[], indicators: string[]) {
  const matrix: any = {};
  
  indicators.forEach(indicator1 => {
    matrix[indicator1] = {};
    indicators.forEach(indicator2 => {
      if (indicator1 !== indicator2) {
        const bothPresent = breakouts.filter(breakout => 
          hasIndicator(breakout, indicator1) && hasIndicator(breakout, indicator2)
        ).length;
        
        matrix[indicator1][indicator2] = bothPresent;
      }
    });
  });
  
  return matrix;
}

// Calculate correlation between indicators and success
function calculateIndicatorCorrelations(breakouts: any[], indicators: string[], minOccurrences: number) {
  const correlations: any = {};
  
  indicators.forEach(indicator => {
    const withIndicator = breakouts.filter(b => hasIndicator(b, indicator));
    const withoutIndicator = breakouts.filter(b => !hasIndicator(b, indicator));
    
    if (withIndicator.length >= minOccurrences) {
      const successRateWith = withIndicator.filter(b => b.outcome === 'SUCCESS').length / withIndicator.length;
      const successRateWithout = withoutIndicator.filter(b => b.outcome === 'SUCCESS').length / withoutIndicator.length;
      
      correlations[indicator] = {
        occurrences: withIndicator.length,
        successRateWith: Math.round(successRateWith * 100),
        successRateWithout: Math.round(successRateWithout * 100),
        correlation: Math.round((successRateWith - successRateWithout) * 100),
        significance: withIndicator.length >= 50 ? 'HIGH' : withIndicator.length >= 20 ? 'MEDIUM' : 'LOW'
      };
    }
  });
  
  return correlations;
}

// Find strongest indicator combinations
function findStrongestCombinations(correlationMatrix: any, occurrenceMatrix: any, minOccurrences: number) {
  const combinations = [];
  const indicators = Object.keys(correlationMatrix);
  
  // Two-indicator combinations
  for (let i = 0; i < indicators.length; i++) {
    for (let j = i + 1; j < indicators.length; j++) {
      const ind1 = indicators[i];
      const ind2 = indicators[j];
      
      const bothOccur = occurrenceMatrix[ind1]?.[ind2] || 0;
      
      if (bothOccur >= minOccurrences) {
        const correlation1 = correlationMatrix[ind1]?.correlation || 0;
        const correlation2 = correlationMatrix[ind2]?.correlation || 0;
        const combinedStrength = correlation1 + correlation2;
        
        combinations.push({
          indicators: [ind1, ind2],
          occurrences: bothOccur,
          combinedStrength,
          individual1: correlation1,
          individual2: correlation2,
          type: 'TWO_INDICATOR'
        });
      }
    }
  }
  
  // Three-indicator combinations (top performing pairs + best third)
  const topPairs = combinations.sort((a, b) => b.combinedStrength - a.combinedStrength).slice(0, 10);
  
  topPairs.forEach(pair => {
    indicators.forEach(thirdInd => {
      if (!pair.indicators.includes(thirdInd)) {
        const thirdCorrelation = correlationMatrix[thirdInd]?.correlation || 0;
        if (thirdCorrelation > 10) { // Only add if third indicator adds value
          combinations.push({
            indicators: [...pair.indicators, thirdInd],
            occurrences: Math.min(pair.occurrences, correlationMatrix[thirdInd]?.occurrences || 0),
            combinedStrength: pair.combinedStrength + thirdCorrelation,
            type: 'THREE_INDICATOR'
          });
        }
      }
    });
  });
  
  return combinations
    .filter(c => c.occurrences >= minOccurrences)
    .sort((a, b) => b.combinedStrength - a.combinedStrength)
    .slice(0, 20);
}

// Analyze indicator hierarchy (which are most important)
function analyzeIndicatorHierarchy(breakouts: any[], indicators: string[]) {
  const hierarchy = indicators.map(indicator => {
    const withIndicator = breakouts.filter(b => hasIndicator(b, indicator));
    const successRate = withIndicator.length > 0 ? 
      withIndicator.filter(b => b.outcome === 'SUCCESS').length / withIndicator.length : 0;
    
    return {
      indicator,
      occurrences: withIndicator.length,
      successRate: Math.round(successRate * 100),
      importance: successRate > 0.8 ? 'CRITICAL' : 
                 successRate > 0.7 ? 'HIGH' : 
                 successRate > 0.6 ? 'MEDIUM' : 'LOW'
    };
  })
  .filter(h => h.occurrences >= 10)
  .sort((a, b) => b.successRate - a.successRate);
  
  return hierarchy;
}

// Generate key findings from the analysis
function generateKeyFindings(correlationMatrix: any, strongestCombinations: any[], hierarchy: any[]) {
  const findings = [];
  
  // Most critical single indicator
  const topIndicator = hierarchy[0];
  if (topIndicator) {
    findings.push({
      type: 'CRITICAL_INDICATOR',
      finding: `${topIndicator.indicator} is the most critical - ${topIndicator.successRate}% success rate`,
      actionable: `Always verify ${topIndicator.indicator} is present before taking breakout trades`
    });
  }
  
  // Best combination
  const bestCombo = strongestCombinations[0];
  if (bestCombo) {
    findings.push({
      type: 'BEST_COMBINATION',
      finding: `Best combination: ${bestCombo.indicators.join(' + ')} (Strength: ${bestCombo.combinedStrength})`,
      actionable: 'Target this exact combination for highest probability setups'
    });
  }
  
  // Volume importance
  const volumeIndicators = Object.keys(correlationMatrix).filter(k => k.includes('VOLUME'));
  const bestVolumeInd = volumeIndicators.reduce((best, current) => 
    correlationMatrix[current]?.correlation > (correlationMatrix[best]?.correlation || 0) ? current : best
  , volumeIndicators[0]);
  
  if (bestVolumeInd && correlationMatrix[bestVolumeInd]) {
    findings.push({
      type: 'VOLUME_CRITICAL',
      finding: `${bestVolumeInd} shows ${correlationMatrix[bestVolumeInd].correlation}% improvement in success`,
      actionable: 'Volume confirmation is non-negotiable for breakout trades'
    });
  }
  
  // Multi-timeframe insights
  const multiTfIndicators = Object.keys(correlationMatrix).filter(k => k.includes('MULTIPLE_TF'));
  const bestMtf = multiTfIndicators.reduce((best, current) => 
    correlationMatrix[current]?.correlation > (correlationMatrix[best]?.correlation || 0) ? current : best
  , multiTfIndicators[0]);
  
  if (bestMtf && correlationMatrix[bestMtf]) {
    findings.push({
      type: 'MULTI_TIMEFRAME',
      finding: `${bestMtf} provides ${correlationMatrix[bestMtf].correlation}% edge`,
      actionable: 'Wait for multiple timeframe alignment before entering trades'
    });
  }
  
  return findings;
}

// Helper function to check if breakout has specific indicator
function hasIndicator(breakout: any, indicator: string): boolean {
  switch (indicator) {
    case 'VOLUME_SPIKE_2X': return breakout.volumeMultiple >= 2;
    case 'VOLUME_SPIKE_3X': return breakout.volumeMultiple >= 3;
    case 'VOLUME_SPIKE_4X': return breakout.volumeMultiple >= 4;
    
    case 'SQUEEZE_DAILY_GREEN': return breakout.squeezeDaily === 'GREEN';
    case 'SQUEEZE_4H_GREEN': return breakout.squeeze4H === 'GREEN';
    case 'SQUEEZE_1H_GREEN': return breakout.squeeze1H === 'GREEN';
    case 'SQUEEZE_30M_GREEN': return breakout.squeeze30M === 'GREEN';
    case 'SQUEEZE_15M_GREEN': return breakout.squeeze15M === 'GREEN';
    case 'SQUEEZE_5M_GREEN': return breakout.squeeze5M === 'GREEN';
    case 'SQUEEZE_1M_GREEN': return breakout.squeeze1M === 'GREEN';
    
    case 'MULTIPLE_TF_GREEN_2': return getGreenTimeframes(breakout) >= 2;
    case 'MULTIPLE_TF_GREEN_3': return getGreenTimeframes(breakout) >= 3;
    case 'MULTIPLE_TF_GREEN_4': return getGreenTimeframes(breakout) >= 4;
    case 'MULTIPLE_TF_GREEN_5_PLUS': return getGreenTimeframes(breakout) >= 5;
    
    case 'TIGHT_COMPRESSION_BLACK': return hasCompressionState(breakout, 'BLACK');
    case 'TIGHT_COMPRESSION_YELLOW': return hasCompressionState(breakout, 'YELLOW');
    
    case 'MOMENTUM_DAILY_BULL': return breakout.momentumDaily === 'BULLISH';
    case 'MOMENTUM_4H_BULL': return breakout.momentum4H === 'BULLISH';
    case 'MOMENTUM_1H_BULL': return breakout.momentum1H === 'BULLISH';
    case 'MOMENTUM_ALIGNED_3_PLUS': return getBullishMomentum(breakout) >= 3;
    case 'MOMENTUM_ALIGNED_ALL': return getBullishMomentum(breakout) === 3;
    
    case 'CALL_PREMIUM_ELEVATED': return breakout.callPremiumElevated;
    case 'PUT_PREMIUM_COMPRESSED': return breakout.putPremiumCompressed;
    case 'PREMIUM_SKEW_CALL_HEAVY': return breakout.premiumSkewCallHeavy;
    
    case 'NEAR_KEY_LEVEL_1PCT': return breakout.nearKeyLevel && breakout.distanceFromKeyLevel < 1;
    case 'NEAR_KEY_LEVEL_HALF_PCT': return breakout.nearKeyLevel && breakout.distanceFromKeyLevel < 0.5;
    case 'AT_RESISTANCE': return breakout.keyLevelType === 'RESISTANCE';
    case 'AT_SUPPORT': return breakout.keyLevelType === 'SUPPORT';
    
    case 'VIX_LOW_15': return breakout.vixLevel < 15;
    case 'VIX_LOW_20': return breakout.vixLevel < 20;
    case 'VIX_HIGH_25': return breakout.vixLevel > 25;
    case 'VIX_HIGH_30': return breakout.vixLevel > 30;
    
    case 'MARKET_TRENDING_UP': return breakout.marketCondition === 'TRENDING_UP';
    case 'MARKET_SIDEWAYS': return breakout.marketCondition === 'SIDEWAYS';
    
    case 'CONSOLIDATION_15_25_DAYS': return breakout.consolidationDays >= 15 && breakout.consolidationDays <= 25;
    case 'CONSOLIDATION_25_PLUS_DAYS': return breakout.consolidationDays > 25;
    
    default: return false;
  }
}

// Helper functions
function getRandomSqueezeState(): string {
  const states = ['RED', 'BLACK', 'YELLOW', 'GREEN'];
  const weights = [0.4, 0.25, 0.15, 0.2]; // More compression, less firing
  
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < states.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return states[i];
  }
  
  return 'RED';
}

function getGreenTimeframes(breakout: any): number {
  const timeframes = [
    breakout.squeezeDaily, breakout.squeeze4H, breakout.squeeze1H,
    breakout.squeeze30M, breakout.squeeze15M, breakout.squeeze5M, breakout.squeeze1M
  ];
  return timeframes.filter(tf => tf === 'GREEN').length;
}

function hasCompressionState(breakout: any, state: string): boolean {
  const timeframes = [
    breakout.squeezeDaily, breakout.squeeze4H, breakout.squeeze1H,
    breakout.squeeze30M, breakout.squeeze15M, breakout.squeeze5M, breakout.squeeze1M
  ];
  return timeframes.some(tf => tf === state);
}

function getBullishMomentum(breakout: any): number {
  const momentum = [breakout.momentumDaily, breakout.momentum4H, breakout.momentum1H];
  return momentum.filter(m => m === 'BULLISH').length;
} 