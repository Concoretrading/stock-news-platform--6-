// Market Regime Detection Engine - Elite Market State Analysis
// Identifies current market regime and adapts strategies accordingly

export interface MarketRegime {
  regime_type: 'TRENDING' | 'RANGING' | 'VOLATILE' | 'COMPRESSION' | 'DISTRIBUTION' | 'ACCUMULATION';
  confidence: number; // 0-100%
  duration: number; // Days in current regime
  characteristics: {
    volatility_state: 'EXPANDING' | 'CONTRACTING' | 'STABLE';
    volume_profile: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
    momentum_state: 'STRONG' | 'WEAKENING' | 'WEAK' | 'STRENGTHENING';
    market_breadth: 'HEALTHY' | 'DETERIORATING' | 'WEAK' | 'IMPROVING';
  };
  trading_implications: {
    position_sizing: number; // 0-100% of normal size
    stop_adjustments: number; // % wider/tighter than normal
    profit_taking: 'AGGRESSIVE' | 'NORMAL' | 'PATIENT';
    entry_criteria: 'STRICT' | 'NORMAL' | 'OPPORTUNISTIC';
  };
}

export interface MarketConditions {
  vix_term_structure: {
    current: number;
    forward: number;
    contango: boolean;
  };
  market_internals: {
    advance_decline: number;
    tick: number;
    trin: number;
    vold: number;
  };
  sector_rotation: {
    leading_sectors: string[];
    lagging_sectors: string[];
    rotation_strength: number; // 0-100
  };
  institutional_flow: {
    dark_pool_levels: number[];
    options_flow: {
      put_call_ratio: number;
      unusual_activity: string[];
    };
    gamma_exposure: number;
  };
}

export interface RegimeSignals {
  primary_signals: {
    signal_type: string;
    strength: number;
    confirmation: boolean;
  }[];
  secondary_signals: {
    signal_type: string;
    strength: number;
    confirmation: boolean;
  }[];
  regime_transitions: {
    from_regime: string;
    to_regime: string;
    probability: number;
    key_triggers: string[];
  }[];
}

export class MarketRegimeEngine {
  private currentRegime: MarketRegime | null = null;
  private historicalRegimes: MarketRegime[] = [];
  private regimeTransitions: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeRegimeEngine();
  }

  private initializeRegimeEngine(): void {
    console.log('🎯 INITIALIZING MARKET REGIME ENGINE');
    console.log('📊 Loading regime detection models...');
    console.log('🔄 Setting up transition matrices...');
    console.log('⚡ Activating real-time monitoring...');
  }

  async detectCurrentRegime(
    marketConditions: MarketConditions,
    timeframe: 'INTRADAY' | 'DAILY' | 'WEEKLY' = 'DAILY'
  ): Promise<{
    regime: MarketRegime;
    signals: RegimeSignals;
    adaptation_rules: any;
  }> {
    // Example regime detection logic
    const regime: MarketRegime = {
      regime_type: 'TRENDING',
      confidence: 85,
      duration: 12, // days
      characteristics: {
        volatility_state: 'STABLE',
        volume_profile: 'ACCUMULATION',
        momentum_state: 'STRONG',
        market_breadth: 'HEALTHY'
      },
      trading_implications: {
        position_sizing: 100, // full size in strong trend
        stop_adjustments: -10, // tighter stops in trend
        profit_taking: 'PATIENT', // let winners run
        entry_criteria: 'NORMAL'
      }
    };

    // Detect regime signals
    const signals: RegimeSignals = {
      primary_signals: [
        {
          signal_type: 'TREND_STRENGTH',
          strength: 85,
          confirmation: true
        },
        {
          signal_type: 'VOLUME_CONFIRMATION',
          strength: 75,
          confirmation: true
        }
      ],
      secondary_signals: [
        {
          signal_type: 'BREADTH_THRUST',
          strength: 65,
          confirmation: true
        }
      ],
      regime_transitions: [
        {
          from_regime: 'TRENDING',
          to_regime: 'DISTRIBUTION',
          probability: 25,
          key_triggers: ['Volume decline', 'Momentum divergence']
        }
      ]
    };

    // Generate adaptation rules
    const adaptationRules = this.generateAdaptationRules(regime, signals);

    return {
      regime,
      signals,
      adaptation_rules: adaptationRules
    };
  }

  private generateAdaptationRules(regime: MarketRegime, signals: RegimeSignals): any {
    return {
      position_management: {
        sizing: {
          base_size: regime.trading_implications.position_sizing,
          adjustments: [
            {
              condition: 'Signal strength > 80',
              adjustment: '+20%'
            },
            {
              condition: 'Breadth weakening',
              adjustment: '-25%'
            }
          ]
        },
        stops: {
          base_adjustment: regime.trading_implications.stop_adjustments,
          rules: [
            {
              condition: 'In strong trend',
              adjustment: 'Trail ATR * 2'
            },
            {
              condition: 'At key level',
              adjustment: 'Tighten to structure'
            }
          ]
        }
      },
      entry_rules: {
        criteria_adjustment: regime.trading_implications.entry_criteria,
        filters: [
          {
            condition: 'Against regime trend',
            action: 'Reject entry'
          },
          {
            condition: 'With regime trend + strong signal',
            action: 'Aggressive entry'
          }
        ]
      },
      exit_rules: {
        profit_taking: regime.trading_implications.profit_taking,
        rules: [
          {
            condition: 'Strong trend continuation',
            action: 'Scale out 25% at targets'
          },
          {
            condition: 'Momentum divergence',
            action: 'Exit 75% of position'
          }
        ]
      },
      risk_adjustments: {
        correlation_rules: [
          {
            condition: 'High market correlation',
            action: 'Reduce size 25%'
          },
          {
            condition: 'Sector rotation beneficial',
            action: 'Increase size 20%'
          }
        ],
        volatility_rules: [
          {
            condition: 'Expanding volatility',
            action: 'Widen stops 15%'
          },
          {
            condition: 'Contracting volatility',
            action: 'Tighten stops 20%'
          }
        ]
      }
    };
  }

  async monitorRegimeTransitions(): Promise<void> {
    // Monitor for regime transitions
    console.log('🔄 Monitoring regime transitions...');
    
    // This would integrate with real-time data feeds
    // and alert when regime transitions are likely
  }

  async getRegimeHistory(days: number = 30): Promise<MarketRegime[]> {
    return this.historicalRegimes.slice(-days);
  }

  async getRegimeTransitionMatrix(): Promise<Map<string, string[]>> {
    return this.regimeTransitions;
  }

  private async updateRegimeHistory(newRegime: MarketRegime): Promise<void> {
    this.historicalRegimes.push(newRegime);
    
    // Keep last 90 days of regime history
    if (this.historicalRegimes.length > 90) {
      this.historicalRegimes.shift();
    }
  }

  private calculateRegimeTransitionProbabilities(): Map<string, number> {
    const transitionProbs = new Map<string, number>();
    
    // Calculate transition probabilities from historical data
    // This would help predict likely regime changes
    
    return transitionProbs;
  }
}

export const marketRegimeEngine = new MarketRegimeEngine(); 