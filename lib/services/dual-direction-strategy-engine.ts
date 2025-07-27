// Dual-Direction Strategy Engine - Elite Event Positioning
// Positions to profit from big moves in either direction

export interface EventVolatilityProfile {
  event_type: 'EARNINGS' | 'CPI' | 'FOMC' | 'NFP' | 'GDP';
  historical_moves: {
    average_magnitude: number;
    up_move_frequency: number; // 0-1
    down_move_frequency: number; // 0-1
    no_move_frequency: number; // 0-1
    largest_up_move: number;
    largest_down_move: number;
  };
  volatility_characteristics: {
    pre_event_iv: number;
    post_event_iv: number;
    expected_iv_crush: number;
    skew_pattern: 'BALANCED' | 'PUT_HEAVY' | 'CALL_HEAVY';
  };
}

export interface StraddleStrangleSetup {
  structure_type: 'STRADDLE' | 'STRANGLE' | 'CUSTOM';
  strikes: {
    call_strike: number;
    put_strike: number;
    call_delta: number;
    put_delta: number;
  };
  risk_profile: {
    max_loss: number;
    breakeven_up: number;
    breakeven_down: number;
    profit_probability: number;
  };
  optimal_entry: {
    timing: 'NOW' | 'WAIT' | 'SCALE_IN';
    iv_conditions: string[];
    price_conditions: string[];
  };
}

export interface BackspreadSetup {
  structure: {
    sell_strike: number;
    buy_strikes: number[];
    ratio: string; // e.g., "1x2", "1x3"
    side: 'CALL' | 'PUT';
  };
  risk_profile: {
    max_loss: number;
    profit_zones: {
      zone_type: 'PRIMARY' | 'SECONDARY';
      start_price: number;
      end_price: number;
      max_profit: number;
    }[];
    breakeven_points: number[];
  };
  optimal_conditions: {
    iv_setup: string[];
    price_setup: string[];
    timing_factors: string[];
  };
}

export interface IronCondorButterfly {
  structure_type: 'IRON_CONDOR' | 'IRON_BUTTERFLY';
  strikes: {
    outer_wings: [number, number];
    inner_strikes: [number, number];
  };
  width: {
    wing_width: number;
    body_width: number;
  };
  risk_profile: {
    max_profit: number;
    max_loss: number;
    profit_probability: number;
    optimal_profit_zone: [number, number];
  };
}

export interface DualDirectionStrategy {
  primary_structure: StraddleStrangleSetup | BackspreadSetup | IronCondorButterfly;
  hedge_structure?: StraddleStrangleSetup | BackspreadSetup | IronCondorButterfly;
  management_rules: {
    profit_targets: {
      first_target: number;
      runner_target: number;
      time_based_exits: string[];
    };
    stop_conditions: {
      max_loss_point: number;
      time_stops: string[];
      volatility_stops: string[];
    };
    adjustment_rules: {
      condition: string;
      action: string;
      reasoning: string;
    }[];
  };
}

export class DualDirectionStrategyEngine {
  private volatilityProfiles: Map<string, EventVolatilityProfile> = new Map();
  private optimalStructures: Map<string, DualDirectionStrategy[]> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    console.log('🎯 INITIALIZING DUAL-DIRECTION STRATEGY ENGINE');
    console.log('📊 Loading volatility profiles...');
    console.log('🔄 Setting up structure optimization...');
    console.log('⚡ Activating strategy generation...');
  }

  async generateDualDirectionStrategy(
    event_type: string,
    current_price: number,
    current_iv: number,
    days_to_event: number
  ): Promise<{
    recommended_strategy: DualDirectionStrategy;
    alternative_strategies: DualDirectionStrategy[];
    execution_plan: any;
  }> {
    // Get event volatility profile
    const volatilityProfile = await this.analyzeEventVolatility(event_type);

    // Generate optimal structures
    const strategies = await this.generateOptimalStructures(
      volatilityProfile,
      current_price,
      current_iv,
      days_to_event
    );

    // Select best strategy
    const recommendedStrategy = this.selectOptimalStrategy(strategies, volatilityProfile);

    // Generate execution plan
    const executionPlan = this.createExecutionPlan(recommendedStrategy, volatilityProfile);

    return {
      recommended_strategy: recommendedStrategy,
      alternative_strategies: strategies.filter(s => s !== recommendedStrategy),
      execution_plan: executionPlan
    };
  }

  private async analyzeEventVolatility(event_type: string): Promise<EventVolatilityProfile> {
    // Example CPI event profile
    if (event_type === 'CPI') {
      return {
        event_type: 'CPI',
        historical_moves: {
          average_magnitude: 2.5,
          up_move_frequency: 0.45,
          down_move_frequency: 0.45,
          no_move_frequency: 0.10,
          largest_up_move: 4.2,
          largest_down_move: -3.8
        },
        volatility_characteristics: {
          pre_event_iv: 35,
          post_event_iv: 25,
          expected_iv_crush: 28,
          skew_pattern: 'PUT_HEAVY'
        }
      };
    }

    // Example FOMC event profile
    if (event_type === 'FOMC') {
      return {
        event_type: 'FOMC',
        historical_moves: {
          average_magnitude: 3.0,
          up_move_frequency: 0.40,
          down_move_frequency: 0.40,
          no_move_frequency: 0.20,
          largest_up_move: 5.5,
          largest_down_move: -4.8
        },
        volatility_characteristics: {
          pre_event_iv: 40,
          post_event_iv: 28,
          expected_iv_crush: 30,
          skew_pattern: 'BALANCED'
        }
      };
    }

    // Default profile
    return {
      event_type: 'EARNINGS',
      historical_moves: {
        average_magnitude: 2.0,
        up_move_frequency: 0.4,
        down_move_frequency: 0.4,
        no_move_frequency: 0.2,
        largest_up_move: 3.5,
        largest_down_move: -3.5
      },
      volatility_characteristics: {
        pre_event_iv: 30,
        post_event_iv: 22,
        expected_iv_crush: 25,
        skew_pattern: 'BALANCED'
      }
    };
  }

  private async generateOptimalStructures(
    profile: EventVolatilityProfile,
    current_price: number,
    current_iv: number,
    days_to_event: number
  ): Promise<DualDirectionStrategy[]> {
    const strategies: DualDirectionStrategy[] = [];

    // Strategy 1: ATM Straddle with Outer Wing Protection
    if (profile.historical_moves.average_magnitude > 2.0) {
      strategies.push({
        primary_structure: {
          structure_type: 'STRADDLE',
          strikes: {
            call_strike: current_price,
            put_strike: current_price,
            call_delta: 0.50,
            put_delta: -0.50
          },
          risk_profile: {
            max_loss: current_price * 0.02, // 2% of stock price
            breakeven_up: current_price * 1.025,
            breakeven_down: current_price * 0.975,
            profit_probability: 0.65
          },
          optimal_entry: {
            timing: 'SCALE_IN',
            iv_conditions: [
              'IV below 30-day average',
              'Balanced skew'
            ],
            price_conditions: [
              'Price near VWAP',
              'Low intraday volatility'
            ]
          }
        },
        management_rules: {
          profit_targets: {
            first_target: 50, // Percentage of max profit
            runner_target: 100,
            time_based_exits: [
              'Take 50% at 2x average move',
              'Scale out remaining at 3x average move'
            ]
          },
          stop_conditions: {
            max_loss_point: -30, // Percentage of premium
            time_stops: [
              'Exit if no movement by event + 1 day',
              'Full exit by event + 2 days'
            ],
            volatility_stops: [
              'Exit if IV drops below historical post-event average',
              'Exit if movement less than 0.5x average move'
            ]
          },
          adjustment_rules: [
            {
              condition: 'Price moves beyond 1 ATR',
              action: 'Roll untested side to collect premium',
              reasoning: 'Maintain position delta neutrality'
            },
            {
              condition: 'IV increases > 20% pre-event',
              action: 'Convert to iron butterfly',
              reasoning: 'Protect against IV crush'
            }
          ]
        }
      });
    }

    // Strategy 2: Put Backspread for High Impact Events
    if (profile.volatility_characteristics.skew_pattern === 'PUT_HEAVY') {
      strategies.push({
        primary_structure: {
          structure: {
            sell_strike: current_price,
            buy_strikes: [
              current_price * 0.95,
              current_price * 0.93
            ],
            ratio: '1x2',
            side: 'PUT'
          },
          risk_profile: {
            max_loss: current_price * 0.015,
            profit_zones: [
              {
                zone_type: 'PRIMARY',
                start_price: current_price * 0.93,
                end_price: current_price * 0.90,
                max_profit: current_price * 0.05
              }
            ],
            breakeven_points: [
              current_price * 0.97,
              current_price * 0.92
            ]
          },
          optimal_conditions: {
            iv_setup: [
              'Put skew > 75th percentile',
              'Overall IV > 30-day average'
            ],
            price_setup: [
              'Price near upper range',
              'Overbought conditions'
            ],
            timing_factors: [
              'Enter 2-3 days before event',
              'Scale in on volatility dips'
            ]
          }
        },
        management_rules: {
          profit_targets: {
            first_target: 40,
            runner_target: 100,
            time_based_exits: [
              'Take profit on front strike at 40% max profit',
              'Let back strikes run for larger move'
            ]
          },
          stop_conditions: {
            max_loss_point: -25,
            time_stops: [
              'Exit if no downside movement by event',
              'Exit all if upside breakout confirmed'
            ],
            volatility_stops: [
              'Exit if put skew normalizes',
              'Exit if IV drops significantly pre-event'
            ]
          },
          adjustment_rules: [
            {
              condition: 'Price moves above entry + 1%',
              action: 'Roll up sold put to reduce risk',
              reasoning: 'Protect against upside movement'
            },
            {
              condition: 'Put skew decreases significantly',
              action: 'Convert to straddle',
              reasoning: 'Adapt to changing volatility surface'
            }
          ]
        }
      });
    }

    // Strategy 3: Iron Butterfly for High IV Crush Events
    if (profile.volatility_characteristics.expected_iv_crush > 25) {
      strategies.push({
        primary_structure: {
          structure_type: 'IRON_BUTTERFLY',
          strikes: {
            outer_wings: [
              current_price * 0.93,
              current_price * 1.07
            ],
            inner_strikes: [
              current_price,
              current_price
            ]
          },
          width: {
            wing_width: current_price * 0.07,
            body_width: 0
          },
          risk_profile: {
            max_profit: current_price * 0.02,
            max_loss: current_price * 0.015,
            profit_probability: 0.60,
            optimal_profit_zone: [
              current_price * 0.98,
              current_price * 1.02
            ]
          }
        },
        management_rules: {
          profit_targets: {
            first_target: 50,
            runner_target: 80,
            time_based_exits: [
              'Take 50% profit immediately after event',
              'Exit remainder within 24 hours'
            ]
          },
          stop_conditions: {
            max_loss_point: -30,
            time_stops: [
              'Exit if large move pre-event',
              'Full exit by event + 1 day'
            ],
            volatility_stops: [
              'Exit if IV increases > 15% pre-event',
              'Exit if expected move increases significantly'
            ]
          },
          adjustment_rules: [
            {
              condition: 'Price approaches wing strike',
              action: 'Roll threatened side further OTM',
              reasoning: 'Maintain profit zone width'
            },
            {
              condition: 'IV increases dramatically',
              action: 'Widen wings for more protection',
              reasoning: 'Adapt to higher expected move'
            }
          ]
        }
      });
    }

    return strategies;
  }

  private selectOptimalStrategy(
    strategies: DualDirectionStrategy[],
    profile: EventVolatilityProfile
  ): DualDirectionStrategy {
    // Score each strategy based on event characteristics
    const scoredStrategies = strategies.map(strategy => ({
      strategy,
      score: this.calculateStrategyScore(strategy, profile)
    }));

    // Return highest scoring strategy
    return scoredStrategies.reduce((prev, current) => 
      prev.score > current.score ? prev : current
    ).strategy;
  }

  private calculateStrategyScore(
    strategy: DualDirectionStrategy,
    profile: EventVolatilityProfile
  ): number {
    let score = 0;

    // Score based on historical move patterns
    if (strategy.primary_structure.structure_type === 'STRADDLE' && 
        profile.historical_moves.average_magnitude > 2.0) {
      score += 30;
    }

    // Score based on IV crush expectations
    if (strategy.primary_structure.structure_type === 'IRON_BUTTERFLY' && 
        profile.volatility_characteristics.expected_iv_crush > 25) {
      score += 25;
    }

    // Score based on skew patterns
    if ('structure' in strategy.primary_structure && 
        strategy.primary_structure.structure.side === 'PUT' && 
        profile.volatility_characteristics.skew_pattern === 'PUT_HEAVY') {
      score += 25;
    }

    return score;
  }

  private createExecutionPlan(
    strategy: DualDirectionStrategy,
    profile: EventVolatilityProfile
  ): any {
    return {
      entry_plan: {
        timing: this.determineEntryTiming(strategy, profile),
        sizing: this.calculatePositionSize(strategy, profile),
        execution_steps: this.generateExecutionSteps(strategy)
      },
      management_plan: {
        profit_taking: this.generateProfitTakingRules(strategy),
        stop_conditions: this.generateStopConditions(strategy),
        adjustment_triggers: this.generateAdjustmentTriggers(strategy)
      },
      risk_management: {
        max_loss_points: this.calculateMaxLossPoints(strategy),
        position_deltas: this.calculatePositionDeltas(strategy),
        hedge_requirements: this.determineHedgeRequirements(strategy)
      }
    };
  }

  private determineEntryTiming(
    strategy: DualDirectionStrategy,
    profile: EventVolatilityProfile
  ): any {
    return {
      optimal_entry_window: '2-3 days before event',
      iv_conditions: [
        'Enter when IV is below 30-day average',
        'Enter when skew is favorable for strategy'
      ],
      scaling_rules: [
        'Initial 50% position on optimal conditions',
        'Add 25% on first IV dip',
        'Final 25% day before event'
      ]
    };
  }

  private calculatePositionSize(
    strategy: DualDirectionStrategy,
    profile: EventVolatilityProfile
  ): any {
    return {
      base_size: '100% of normal size',
      adjustments: [
        {
          condition: 'High IV environment',
          adjustment: 'Reduce size by 25%'
        },
        {
          condition: 'Extreme skew',
          adjustment: 'Reduce size by 20%'
        }
      ],
      scaling_plan: [
        'Enter 50% at optimal conditions',
        'Scale remaining 50% into event'
      ]
    };
  }

  private generateExecutionSteps(strategy: DualDirectionStrategy): any {
    return [
      {
        step: 1,
        action: 'Enter initial position',
        size: '50% of planned size',
        conditions: [
          'IV below 30-day average',
          'Price near VWAP'
        ]
      },
      {
        step: 2,
        action: 'Scale in remaining position',
        size: '25% increments',
        conditions: [
          'On IV dips',
          'When price tests support/resistance'
        ]
      }
    ];
  }

  private generateProfitTakingRules(strategy: DualDirectionStrategy): any {
    return {
      first_target: {
        percentage: 50,
        action: 'Take partial profits',
        conditions: [
          'Price moves 1.5x average move',
          'IV begins to normalize'
        ]
      },
      runner_management: {
        criteria: [
          'Hold runners if trend strong',
          'Exit on momentum weakness'
        ],
        scaling_rules: [
          'Scale out 25% at each target',
          'Leave 25% for home run scenario'
        ]
      }
    };
  }

  private generateStopConditions(strategy: DualDirectionStrategy): any {
    return {
      time_stops: [
        'Exit if no movement by event + 1 day',
        'Full exit by event + 2 days'
      ],
      volatility_stops: [
        'Exit if IV drops below historical average',
        'Exit if expected move decreases significantly'
      ],
      price_stops: [
        'Exit if price moves against position > 2x average move',
        'Exit if technical structure broken'
      ]
    };
  }

  private generateAdjustmentTriggers(strategy: DualDirectionStrategy): any {
    return {
      pre_event_adjustments: [
        {
          trigger: 'IV increases > 20%',
          action: 'Convert to iron butterfly',
          reasoning: 'Protect against IV crush'
        },
        {
          trigger: 'Price approaches wing strike',
          action: 'Roll threatened side',
          reasoning: 'Maintain profit zone'
        }
      ],
      post_event_adjustments: [
        {
          trigger: 'Initial move > expected',
          action: 'Roll untested side for credit',
          reasoning: 'Reduce cost basis'
        },
        {
          trigger: 'Move smaller than expected',
          action: 'Convert to calendar spread',
          reasoning: 'Capitalize on time decay'
        }
      ]
    };
  }

  private calculateMaxLossPoints(strategy: DualDirectionStrategy): any {
    return {
      absolute_stops: [
        {
          level: 'Maximum loss threshold',
          action: 'Exit full position',
          reasoning: 'Risk management rule'
        }
      ],
      scaling_stops: [
        {
          level: '50% of max loss',
          action: 'Exit half position',
          reasoning: 'Preserve capital'
        }
      ]
    };
  }

  private calculatePositionDeltas(strategy: DualDirectionStrategy): any {
    return {
      target_deltas: {
        initial: 'Neutral',
        adjustment_zones: [
          {
            condition: 'Strong directional move',
            target: 'Slightly biased to direction'
          }
        ]
      },
      delta_management: [
        'Maintain near-neutral through event',
        'Allow bias post-event based on movement'
      ]
    };
  }

  private determineHedgeRequirements(strategy: DualDirectionStrategy): any {
    return {
      primary_hedges: [
        'Outer wings for tail risk',
        'Calendar spreads for time decay'
      ],
      adjustment_rules: [
        'Add hedges if volatility expands',
        'Remove hedges post-event'
      ],
      hedge_ratios: {
        initial: 1.0,
        maximum: 1.5,
        minimum: 0.5
      }
    };
  }
}

export const dualDirectionStrategyEngine = new DualDirectionStrategyEngine(); 