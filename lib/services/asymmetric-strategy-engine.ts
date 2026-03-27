// Favors high-probability direction while ensuring hedge profitability if wrong
import { MarketScenario } from './scenario-intelligence-engine';

export interface HistoricalEventAnalysis {
  event_type: string;
  historical_bias: {
    directional_tendency: 'UPWARD' | 'DOWNWARD' | 'NEUTRAL';
    bias_strength: number; // 0-100
    reliability_score: number; // 0-100
    sample_size: number;
  };
  move_characteristics: {
    average_favorable_move: number;
    average_contrary_move: number;
    max_favorable_move: number;
    max_contrary_move: number;
    move_speed: 'FAST' | 'GRADUAL' | 'MIXED';
  };
  institutional_patterns: {
    pre_event_positioning: 'LONG' | 'SHORT' | 'NEUTRAL';
    typical_hedge_ratios: number;
    common_structures: string[];
  };
}

export interface AsymmetricPosition {
  primary_side: {
    direction: 'LONG' | 'SHORT';
    size: number; // Percentage of normal size
    structure: string;
    entry_price: number;
    target_price: number;
    initial_stop: number;
  };
  hedge_side: {
    structure: string;
    entry_price: number;
    size: number; // Percentage of primary position
    conversion_triggers: string[]; // When hedge becomes main position
    profit_zones: {
      start_price: number;
      end_price: number;
      max_profit: number;
    }[];
  };
}

export interface PositionTransformation {
  trigger_conditions: {
    price_triggers: string[];
    volume_triggers: string[];
    momentum_triggers: string[];
  };
  transformation_rules: {
    hedge_to_main: string[];
    size_adjustments: string[];
    stop_adjustments: string[];
  };
  execution_steps: {
    step: number;
    action: string;
    timing: string;
    size: string;
  }[];
}

export class AsymmetricStrategyEngine {
  private eventHistory: Map<string, HistoricalEventAnalysis> = new Map();
  private positionTemplates: Map<string, AsymmetricPosition[]> = new Map();
  private transformationRules: Map<string, PositionTransformation> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log('🎯 INITIALIZING ASYMMETRIC STRATEGY ENGINE');
    console.log('📊 Loading historical event patterns...');
    console.log('🔄 Setting up position templates...');
    console.log('⚡ Activating transformation rules...');
  }

  async generateAsymmetricStrategy(
    scenarios: MarketScenario[],
    current_price: number,
    market_conditions: any
  ): Promise<{
    position_strategy: AsymmetricPosition;
    transformation_plan: PositionTransformation;
    risk_management: any;
  } | null> {
    if (!scenarios || scenarios.length === 0) {
      return null;
    }

    // 1. Identify Dominant Scenario vs Shock Scenario
    const dominant = scenarios.reduce((prev, curr) => (curr.probability > prev.probability ? curr : prev), scenarios[0]);
    const shock = scenarios.find(s => s.scenario_id !== dominant.scenario_id && s.probability > 15) || scenarios[1] || scenarios[0];

    console.log(`🧠 ASYMMETRIC ENGINE: Ingesting Scenario Intelligence...`);
    console.log(`   - Dominant: ${dominant.scenario_name} (${dominant.probability}%)`);
    console.log(`   - Shock/Hedge: ${shock.scenario_name} (${shock.probability}%)`);

    // 2. Generate asymmetric position based on these scenarios
    const position = await this.createScenarioLedPosition(
      dominant,
      shock,
      current_price,
      market_conditions
    );

    // 3. Create transformation rules (how we flip to the shock scenario)
    const transformationPlan = this.createTransformationPlan(
      position,
      shock
    );

    // 4. Generate risk management rules
    const riskRules = this.generateRiskManagement(
      position,
      transformationPlan
    );

    return {
      position_strategy: position,
      transformation_plan: transformationPlan,
      risk_management: riskRules
    };
  }

  private async analyzeEventPatterns(
    event_type: string,
    historical_data: any
  ): Promise<HistoricalEventAnalysis> {
    // Example CPI Analysis
    if (event_type === 'CPI') {
      return {
        event_type: 'CPI',
        historical_bias: {
          directional_tendency: 'DOWNWARD',
          bias_strength: 75,
          reliability_score: 80,
          sample_size: 24
        },
        move_characteristics: {
          average_favorable_move: 2.5,
          average_contrary_move: 1.8,
          max_favorable_move: 4.2,
          max_contrary_move: 3.5,
          move_speed: 'FAST'
        },
        institutional_patterns: {
          pre_event_positioning: 'SHORT',
          typical_hedge_ratios: 0.5,
          common_structures: [
            'PUT_SPREAD',
            'CALL_BACKSPREAD'
          ]
        }
      };
    }

    // Example FOMC Analysis
    if (event_type === 'FOMC') {
      return {
        event_type: 'FOMC',
        historical_bias: {
          directional_tendency: 'UPWARD',
          bias_strength: 65,
          reliability_score: 70,
          sample_size: 32
        },
        move_characteristics: {
          average_favorable_move: 2.8,
          average_contrary_move: 2.2,
          max_favorable_move: 5.5,
          max_contrary_move: 4.2,
          move_speed: 'GRADUAL'
        },
        institutional_patterns: {
          pre_event_positioning: 'LONG',
          typical_hedge_ratios: 0.4,
          common_structures: [
            'CALL_SPREAD',
            'PUT_BACKSPREAD'
          ]
        }
      };
    }

    // Default analysis
    return {
      event_type: 'GENERIC',
      historical_bias: {
        directional_tendency: 'NEUTRAL',
        bias_strength: 50,
        reliability_score: 60,
        sample_size: 20
      },
      move_characteristics: {
        average_favorable_move: 2.0,
        average_contrary_move: 2.0,
        max_favorable_move: 3.5,
        max_contrary_move: 3.5,
        move_speed: 'MIXED'
      },
      institutional_patterns: {
        pre_event_positioning: 'NEUTRAL',
        typical_hedge_ratios: 0.5,
        common_structures: [
          'STRADDLE',
          'STRANGLE'
        ]
      }
    };
  }

  private async createScenarioLedPosition(
    dominant: MarketScenario,
    shock: MarketScenario,
    current_price: number,
    market_conditions: any
  ): Promise<AsymmetricPosition> {
    const primaryOutcome = dominant.expected_outcomes[0];
    const shockOutcome = shock.expected_outcomes[0];

    // Determine structures based on volatility
    const vix = market_conditions?.vix || 20;
    const structure_primary = vix > 25 ? 'VERTICAL_SPREAD' : 'LONG_OPTIONS';
    const structure_hedge = 'BACKSPREAD'; // Predators favor backspreads for hedges

    return {
      primary_side: {
        direction: primaryOutcome.direction === 'UP' ? 'LONG' : 'SHORT',
        size: dominant.probability > 60 ? 100 : 75,
        structure: structure_primary,
        entry_price: current_price,
        target_price: current_price * (1 + (primaryOutcome.direction === 'UP' ? 1 : -1) * primaryOutcome.magnitude),
        initial_stop: current_price * (1 - (primaryOutcome.direction === 'UP' ? 1 : -1) * (primaryOutcome.magnitude * 0.5))
      },
      hedge_side: {
        structure: structure_hedge,
        entry_price: current_price,
        size: shock.probability > 30 ? 60 : 40, // Hedge size based on shock probability
        conversion_triggers: shock.trigger_conditions.map(c => c.condition),
        profit_zones: shock.expected_outcomes.map(o => ({
          start_price: current_price * (1 + (o.direction === 'UP' ? 0.01 : -0.01)),
          end_price: current_price * (1 + (o.direction === 'UP' ? 1 : -1) * o.magnitude),
          max_profit: current_price * o.magnitude * 2 // Backspread power
        }))
      }
    };
  }

  private createTransformationPlan(
    position: AsymmetricPosition,
    shock: MarketScenario
  ): PositionTransformation {
    return {
      trigger_conditions: {
        price_triggers: [
          'Break of initial stop level',
          'Move beyond 1.5x average range',
          'Key level breach with volume'
        ],
        volume_triggers: [
          'Volume > 2x average on reversal',
          'Block trades against position',
          'Dark pool absorption'
        ],
        momentum_triggers: [
          'RSI divergence confirmation',
          'Trend line break',
          'Moving average crossover'
        ]
      },
      transformation_rules: {
        hedge_to_main: [
          'Exit 50% of primary position',
          'Double hedge position size',
          'Tighten stops on remaining primary'
        ],
        size_adjustments: [
          'Scale out of primary in thirds',
          'Scale into hedge in halves',
          'Maintain total exposure limits'
        ],
        stop_adjustments: [
          'Move primary stop to breakeven',
          'Widen hedge stops for room',
          'Trail stops on new trend'
        ]
      },
      execution_steps: [
        {
          step: 1,
          action: 'Reduce primary position',
          timing: 'Immediately on trigger',
          size: '50% reduction'
        },
        {
          step: 2,
          action: 'Increase hedge position',
          timing: 'After primary reduction',
          size: '100% increase'
        },
        {
          step: 3,
          action: 'Adjust stops',
          timing: 'After position adjustment',
          size: 'Per rules'
        }
      ]
    };
  }

  private generateRiskManagement(
    position: AsymmetricPosition,
    transformation: PositionTransformation
  ): any {
    return {
      position_limits: {
        max_total_size: 150, // Percentage of normal size
        max_single_side: 100,
        min_hedge_ratio: 0.3
      },
      stop_management: {
        initial_stops: {
          primary: position.primary_side.initial_stop,
          hedge: 'Wide initially'
        },
        stop_adjustments: {
          after_partial_exit: 'Move to breakeven',
          after_transformation: 'Trail new trend',
          profit_protection: 'Lock in 50% at 2R'
        }
      },
      transformation_risk: {
        max_transformation_loss: '1R',
        position_overlap_rules: [
          'No more than 50% overlap',
          'Scale out before scaling in'
        ],
        timing_requirements: [
          'Complete within 5 minutes',
          'Use limit orders when possible'
        ]
      },
      profit_protection: {
        primary_side: {
          first_target: '1.5R partial exit',
          runner_management: 'Trail with 2ATR',
          final_target: 'Based on structure'
        },
        hedge_side: {
          initial: 'Wide stops for room',
          after_trigger: 'Tighten to 1ATR',
          full_transformation: 'Normal trailing stop'
        }
      },
      exposure_management: {
        delta_limits: {
          max_positive_delta: 0.75,
          max_negative_delta: 0.75,
          rebalance_triggers: 'Every 0.25 change'
        },
        vega_exposure: {
          max_vega_risk: '2% of position',
          volatility_stops: 'Exit if IV drops 30%'
        }
      }
    };
  }
}

export const asymmetricStrategyEngine = new AsymmetricStrategyEngine(); 