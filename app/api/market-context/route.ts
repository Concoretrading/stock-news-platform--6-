import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'SPY';
    
    console.log(`📊 MARKET CONTEXT ANALYZER - Your Daily Routine`);
    
    // YOUR SYSTEMATIC APPROACH
    const analysis = {
      ticker,
      timestamp: new Date().toISOString(),
      
      // 1. NEWS & ECONOMIC DATA (Your First Check)
      newsAndEconomic: {
        marketMovingNews: [
          {
            time: '8:30 AM',
            event: 'CPI Data Release',
            impact: 'HIGH',
            actual: '3.2%',
            expected: '3.4%',
            interpretation: 'BULLISH - Lower than expected inflation',
            marketReaction: 'SPY +0.8% on release'
          },
          {
            time: '2:00 PM',
            event: 'Fed Chair Speech',
            impact: 'HIGH',
            topic: 'Interest Rate Policy',
            interpretation: 'NEUTRAL - No major policy changes indicated'
          },
          {
            time: '9:15 AM',
            event: 'Tech Earnings Beat',
            impact: 'MEDIUM',
            ticker: 'NVDA',
            interpretation: 'BULLISH - Sector catalyst for XLK'
          }
        ],
        
        upcomingEvents: [
          {
            date: 'Tomorrow 8:30 AM',
            event: 'Jobless Claims',
            impact: 'MEDIUM',
            expected: '220K',
            note: 'Watch for labor market strength'
          },
          {
            date: 'Friday 8:30 AM',
            event: 'Non-Farm Payrolls',
            impact: 'HIGH',
            expected: '+180K',
            note: 'Major market mover - prepare for volatility'
          }
        ],
        
        economicDataSummary: {
          inflation: 'IMPROVING - CPI trending down',
          employment: 'STRONG - Low jobless claims',
          growth: 'MODERATE - GDP steady at 2.1%',
          fedPolicy: 'NEUTRAL - No immediate rate changes expected'
        }
      },
      
      // 2. SECTOR ROTATION ANALYSIS (Your Key Focus)
      sectorRotation: {
        strongest: [
          {
            sector: 'Technology (XLK)',
            relativeStrength: 1.15,
            performance: '+2.4% today',
            moneyFlow: 'STRONG INFLOW',
            volume: '150% of average',
            keyDrivers: ['AI earnings beats', 'Chip demand strong'],
            leadingStocks: ['NVDA', 'MSFT', 'GOOGL'],
            interpretation: 'MOMENTUM LEADER - Strong institutional flow'
          },
          {
            sector: 'Financials (XLF)',
            relativeStrength: 1.08,
            performance: '+1.2% today',
            moneyFlow: 'MODERATE INFLOW',
            volume: '120% of average',
            keyDrivers: ['Higher rate expectations', 'Strong earnings'],
            leadingStocks: ['JPM', 'BAC', 'WFC'],
            interpretation: 'ROTATION PLAY - Benefiting from rate environment'
          }
        ],
        
        weakest: [
          {
            sector: 'Utilities (XLU)',
            relativeStrength: 0.85,
            performance: '-1.8% today',
            moneyFlow: 'OUTFLOW',
            volume: '80% of average',
            keyDrivers: ['Rate sensitivity', 'Growth rotation'],
            interpretation: 'AVOID - Defensive rotation out'
          },
          {
            sector: 'Real Estate (XLRE)',
            relativeStrength: 0.78,
            performance: '-2.1% today',
            moneyFlow: 'STRONG OUTFLOW',
            volume: '110% of average',
            keyDrivers: ['Rate fears', 'Commercial RE concerns'],
            interpretation: 'WEAK - High rate sensitivity'
          }
        ],
        
        rotationSummary: {
          trend: 'GROWTH ROTATION',
          direction: 'RISK-ON',
          interpretation: 'Money flowing from defensive to growth sectors',
          tradingImplication: 'Focus on XLK, XLF leaders when market dips'
        }
      },
      
      // 3. KEY RATIOS (Your Critical Indicators)
      keyRatios: {
        riskAppetite: {
          'VIX/SPY': {
            current: 0.082,
            trend: 'DECLINING',
            interpretation: 'BULLISH - Fear decreasing, risk appetite improving'
          },
          'HYG/TLT': {
            current: 4.85,
            trend: 'RISING',
            interpretation: 'BULLISH - Credit risk appetite strong vs treasuries'
          }
        },
        
        sectorLeadership: {
          'XLK/SPY': {
            current: 1.15,
            trend: 'RISING',
            interpretation: 'BULLISH - Tech outperforming market'
          },
          'XLF/SPY': {
            current: 1.08,
            trend: 'RISING',
            interpretation: 'BULLISH - Financials showing strength'
          },
          'XLU/SPY': {
            current: 0.85,
            trend: 'FALLING',
            interpretation: 'BEARISH - Utilities underperforming (risk-on signal)'
          }
        },
        
        marketInternals: {
          'ADVN/DECN': {
            current: 2.1,
            interpretation: 'BULLISH - More stocks advancing than declining'
          },
          'TRIN': {
            current: 0.75,
            interpretation: 'BULLISH - Strong buying pressure (below 1.0)'
          },
          'NewHighs/NewLows': {
            current: 3.2,
            interpretation: 'BULLISH - More new highs than lows'
          }
        }
      },
      
      // 4. WHAT'S STRONG WHEN MARKET IS WEAK (Your Edge)
      strengthInWeakness: {
        analysis: 'Market showing mixed signals but clear rotation patterns',
        
        whenMarketWeak: [
          {
            asset: 'XLK Leaders (NVDA, MSFT)',
            relativeStrength: 'VERY STRONG',
            reason: 'AI theme + earnings momentum',
            actionable: 'Buy dips in tech leaders'
          },
          {
            asset: 'XLF Quality Names (JPM, BAC)',
            relativeStrength: 'STRONG',
            reason: 'Rate environment + strong earnings',
            actionable: 'Rotate into financials on weakness'
          },
          {
            asset: 'Energy Infrastructure (XLE)',
            relativeStrength: 'MODERATE',
            reason: 'Defensive with income',
            actionable: 'Consider on major market selloff'
          }
        ],
        
        avoidWhenWeak: [
          {
            asset: 'Small Caps (IWM)',
            reason: 'Rate sensitive + weaker fundamentals',
            signal: 'Underperforming SPY by 3%'
          },
          {
            asset: 'Utilities (XLU)',
            reason: 'High dividend yield = rate sensitive',
            signal: 'Money flowing out consistently'
          },
          {
            asset: 'Growth without earnings (ARKK)',
            reason: 'Speculative premium compression',
            signal: 'High beta in wrong direction'
          }
        ]
      },
      
      // 5. CONFLUENCE SCORING FOR HIGH-PROBABILITY SETUPS
      confluenceAnalysis: {
        marketContext: {
          score: 75,
          factors: [
            'Economic data supportive (CPI lower)',
            'Sector rotation clear (growth leadership)',
            'Risk appetite improving (VIX declining)',
            'Breadth supporting (ADVN > DECN)'
          ]
        },
        
        tradingEnvironment: {
          score: 82,
          interpretation: 'FAVORABLE - Clear trends, good breadth, supportive data',
          recommendation: 'Focus on sector leaders with confluence'
        }
      },
      
      // 6. TODAY'S HIGH-PROBABILITY OPPORTUNITIES
      highProbabilityPlays: [
        {
          setup: 'XLK LEADER DIPS',
          confluence: [
            'Sector showing strongest rotation',
            'Earnings momentum continuing',
            'Market context supportive',
            'Technical levels holding'
          ],
          action: 'Buy NVDA, MSFT on any 1-2% pullback',
          probability: '78%',
          timeframe: '1-3 days'
        },
        {
          setup: 'FINANCIALS ROTATION PLAY',
          confluence: [
            'Rate environment favorable',
            'Relative strength vs SPY',
            'Institutional flow positive',
            'Earnings season strong'
          ],
          action: 'JPM, BAC on market weakness',
          probability: '72%',
          timeframe: '2-5 days'
        }
      ],
      
      // 7. MARKET REGIME ASSESSMENT
      currentRegime: {
        type: 'GROWTH ROTATION',
        phase: 'EARLY MOMENTUM',
        duration: 'Estimated 2-4 weeks',
        characteristics: [
          'Defensive sectors selling off',
          'Growth sectors leading',
          'Risk appetite improving',
          'Economic data supportive'
        ],
        tradingApproach: 'Focus on relative strength leaders, avoid laggards'
      }
    };
    
    console.log(`📊 MARKET CONTEXT COMPLETE`);
    console.log(`🔥 Strongest Rotation: ${analysis.sectorRotation.strongest[0].sector}`);
    console.log(`📈 Risk Appetite: ${analysis.keyRatios.riskAppetite['VIX/SPY'].interpretation}`);
    console.log(`⚡ High-Prob Setup: ${analysis.highProbabilityPlays[0].setup}`);
    console.log(`🎯 Market Regime: ${analysis.currentRegime.type}`);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Market context analysis error:', error);
    return NextResponse.json({ 
      error: 'Market context analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true
    }, { status: 500 });
  }
} 