import { NextRequest, NextResponse } from 'next/server';
import polygonClient from '@/lib/services/polygon-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const lookbackYears = parseInt(searchParams.get('years') || '3');
    
    if (!ticker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Ticker parameter is required' 
      }, { status: 400 });
    }
    
    console.log(`🔍 Analyzing ${lookbackYears}-year recurring patterns for ${ticker}...`);
    
    // Comprehensive recurring pattern analysis
    const recurringPatterns = await polygonClient.analyzeRecurringPatterns(ticker, lookbackYears);
    
    return NextResponse.json({
      success: true,
      ticker,
      analysis: recurringPatterns,
      summary: {
        analysisScope: {
          totalBreakouts: recurringPatterns.analysisHistory.totalBreakouts,
          lookbackYears: recurringPatterns.analysisHistory.lookbackYears,
          dateRange: recurringPatterns.analysisHistory.dateRange
        },
        keyFindings: {
          mostReliablePattern: {
            name: recurringPatterns.mostReliablePatterns.highestSuccessRate.pattern,
            successRate: recurringPatterns.mostReliablePatterns.highestSuccessRate.successRate,
            frequency: recurringPatterns.mostReliablePatterns.highestSuccessRate.frequency
          },
          mostFrequentPattern: {
            name: recurringPatterns.mostReliablePatterns.mostFrequent.pattern,
            frequency: recurringPatterns.mostReliablePatterns.mostFrequent.frequency,
            successRate: recurringPatterns.mostReliablePatterns.mostFrequent.successRate
          },
          mostProfitablePattern: {
            name: recurringPatterns.mostReliablePatterns.highestReturn.pattern,
            avgReturn: recurringPatterns.mostReliablePatterns.highestReturn.avgReturn,
            frequency: recurringPatterns.mostReliablePatterns.highestReturn.frequency
          }
        },
        patternTypes: {
          timeframeSqueezePatterns: Object.keys(recurringPatterns.timeframeSqueezePatterns).length,
          volumePatterns: Object.keys(recurringPatterns.volumePatterns).length,
          premiumPatterns: Object.keys(recurringPatterns.premiumPatterns).length,
          combinedPatterns: Object.keys(recurringPatterns.combinedPatterns).length
        },
        topCombinedPatterns: Object.entries(recurringPatterns.combinedPatterns)
          .sort(([,a], [,b]: [string, any]) => b.successRate - a.successRate)
          .slice(0, 3)
          .map(([pattern, data]: [string, any]) => ({
            pattern,
            successRate: data.successRate,
            frequency: data.frequency,
            avgReturn: data.avgReturn,
            confidence: data.confidence,
            description: data.description
          }))
      },
      patterns: {
        timeframeAnalysis: {
          description: "Which timeframe combinations fire together consistently",
          patterns: recurringPatterns.timeframeSqueezePatterns,
          insights: "Studies Daily→4hr→1hr→30min→15min→5min→1min squeeze progressions and color combinations"
        },
        volumeAnalysis: {
          description: "Volume behavior patterns during breakouts",
          patterns: recurringPatterns.volumePatterns,
          insights: "Categorizes volume spikes: Extreme (3x+), High (2-3x), Moderate (1.5-2x), Normal (1-1.5x), Low (<1x)"
        },
        premiumAnalysis: {
          description: "Option premium behavior during breakouts",
          patterns: recurringPatterns.premiumPatterns,
          insights: "Tracks premium performance: Explosive (100%+), Strong (50-100%), Moderate (25-50%), Weak (0-25%)"
        },
        combinedAnalysis: {
          description: "What fires together consistently for successful breakouts",
          patterns: recurringPatterns.combinedPatterns,
          insights: "Identifies multi-component patterns that repeat with high success rates"
        }
      },
      evolution: {
        description: "How patterns have evolved over time",
        patterns: recurringPatterns.patternEvolution,
        insights: "Shows which patterns dominated in different years and their success rates"
      },
      actionableInsights: {
        whatToLookFor: [
          `Most reliable: ${recurringPatterns.mostReliablePatterns.highestSuccessRate.pattern} (${recurringPatterns.mostReliablePatterns.highestSuccessRate.successRate.toFixed(1)}% success)`,
          `Most frequent: ${recurringPatterns.mostReliablePatterns.mostFrequent.pattern} (${recurringPatterns.mostReliablePatterns.mostFrequent.frequency} occurrences)`,
          `Most profitable: ${recurringPatterns.mostReliablePatterns.highestReturn.pattern} (${recurringPatterns.mostReliablePatterns.highestReturn.avgReturn.toFixed(1)}% avg return)`
        ],
        tradingStrategy: {
          timeframes: "Monitor multiple timeframes for squeeze progressions - look for color changes from compression to firing",
          volume: "Wait for volume confirmation above historical patterns - higher volume = higher success rate",
          premium: "Target options strikes based on historical optimal levels - typically 2 ATR from breakout level",
          timing: "Best breakouts show coordinated firing across timeframes with volume confirmation"
        },
        riskManagement: {
          avoidPatterns: "Low confidence patterns with <60% success rate or <5 frequency",
          stopLoss: "Use support/resistance levels from consolidation analysis",
          positionSizing: "Increase size on HIGH confidence combined patterns, reduce on LOW confidence"
        }
      },
      methodology: {
        patternDetection: "Scans all historical consolidations and tracks what happens during breakouts",
        timeframeAnalysis: "Studies which timeframes fire together and in what sequence",
        volumeCorrelation: "Categorizes volume patterns and measures success rates",
        premiumTracking: "Simulates option premium behavior during historical breakouts",
        combinedPatterns: "Identifies recurring multi-component patterns with confidence levels",
        scientificApproach: "All success rates and returns derived from actual historical performance data"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'unknown';
    
    console.error('Recurring pattern analysis error for', ticker, ':', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Pattern analysis failed',
      ticker,
      fallback: {
        message: 'Recurring pattern analysis requires extensive historical data',
        suggestion: 'Try with a major stock ticker (AAPL, TSLA, NVDA) or reduce lookback period',
        minDataRequired: '50+ historical breakouts for reliable pattern identification'
      }
    }, { status: 500 });
  }
} 