import { tradeQualityFilterEngine } from './trade-quality-filter-engine';

interface TradeReview {
  trade_id: string;
  symbol: string;
  entry_time: string;
  exit_time: string;
  position_type: 'LONG' | 'SHORT';
  contract_type: 'CALL' | 'PUT';
  strike: number;
  expiration: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  pnl_percentage: number;
  max_favorable_excursion: number; // Best possible profit
  max_adverse_excursion: number;   // Worst drawdown
}

interface MarketContext {
  market_conditions: {
    spx_performance: number;
    vix_change: number;
    sector_performance: number;
    market_breadth: number;
  };
  key_events: {
    type: string;
    time: string;
    impact: string;
    market_reaction: string;
  }[];
  missed_opportunities: {
    symbol: string;
    setup_type: string;
    potential_profit: number;
    reason_missed: string;
  }[];
}

interface DecisionAnalysis {
  entry_analysis: {
    timing_score: number; // 0-100
    size_appropriateness: number;
    trigger_quality: number;
    alternative_entries: string[];
  };
  management_analysis: {
    scaling_decisions: {
      time: string;
      action: string;
      evaluation: string;
    }[];
    stop_adjustments: {
      time: string;
      action: string;
      evaluation: string;
    }[];
  };
  exit_analysis: {
    timing_score: number;
    reason: string;
    alternative_exits: string[];
    missed_profit: number;
  };
}

interface EmotionalAnalysis {
  emotional_state: {
    pre_trade: string;
    during_trade: string;
    post_trade: string;
  };
  psychological_factors: {
    factor: string;
    impact: string;
    improvement_plan: string;
  }[];
  discipline_score: number; // 0-100
}

interface DailyReview {
  date: string;
  overall_performance: {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    total_pnl: number;
    largest_win: number;
    largest_loss: number;
    average_win: number;
    average_loss: number;
    profit_factor: number;
  };
  trades: TradeReview[];
  market_context: MarketContext;
  decision_analysis: DecisionAnalysis[];
  emotional_analysis: EmotionalAnalysis;
  improvement_areas: string[];
  action_items: string[];
}

export class DailyTradingReviewEngine {
  private dailyReviews: Map<string, DailyReview> = new Map();

  async createDailyReview(date: string, trades: TradeReview[]): Promise<DailyReview> {
    // Calculate overall performance metrics
    const performance = this.calculatePerformanceMetrics(trades);
    
    // Analyze market context
    const marketContext = await this.analyzeMarketContext(date);
    
    // Analyze decisions for each trade
    const decisionAnalysis = await Promise.all(
      trades.map(trade => this.analyzeDecisions(trade))
    );
    
    // Analyze emotional factors
    const emotionalAnalysis = await this.analyzeEmotionalFactors(trades);
    
    // Generate improvement areas and action items
    const improvementAreas = this.identifyImprovementAreas(
      performance,
      decisionAnalysis,
      emotionalAnalysis
    );
    
    const actionItems = this.generateActionItems(improvementAreas);

    const review: DailyReview = {
      date,
      overall_performance: performance,
      trades,
      market_context: marketContext,
      decision_analysis: decisionAnalysis,
      emotional_analysis: emotionalAnalysis,
      improvement_areas: improvementAreas,
      action_items: actionItems
    };

    this.dailyReviews.set(date, review);
    return review;
  }

  private calculatePerformanceMetrics(trades: TradeReview[]): DailyReview['overall_performance'] {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0;
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;

    return {
      total_trades: trades.length,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: trades.length > 0 ? winningTrades.length / trades.length : 0,
      total_pnl: totalPnl,
      largest_win: Math.max(...trades.map(t => t.pnl)),
      largest_loss: Math.min(...trades.map(t => t.pnl)),
      average_win: avgWin,
      average_loss: avgLoss,
      profit_factor: avgLoss > 0 ? avgWin / avgLoss : 0
    };
  }

  private async analyzeMarketContext(date: string): Promise<MarketContext> {
    // Example market context for a strong day
    return {
      market_conditions: {
        spx_performance: 0.8,
        vix_change: -5.2,
        sector_performance: 1.2,
        market_breadth: 75
      },
      key_events: [
        {
          type: 'ECONOMIC_DATA',
          time: '08:30 ET',
          impact: 'POSITIVE',
          market_reaction: 'Initial volatility, then upward trend'
        },
        {
          type: 'FED_SPEAKER',
          time: '10:00 ET',
          impact: 'NEUTRAL',
          market_reaction: 'Brief consolidation, continued trend'
        }
      ],
      missed_opportunities: [
        {
          symbol: 'NVDA',
          setup_type: 'BREAKOUT',
          potential_profit: 2.5,
          reason_missed: 'Focused on existing position'
        },
        {
          symbol: 'AMD',
          setup_type: 'SECTOR_SYMPATHY',
          potential_profit: 1.8,
          reason_missed: 'Missed initial signal'
        }
      ]
    };
  }

  private async analyzeDecisions(trade: TradeReview): Promise<DecisionAnalysis> {
    return {
      entry_analysis: {
        timing_score: this.calculateTimingScore(trade, 'ENTRY'),
        size_appropriateness: this.evaluatePositionSize(trade),
        trigger_quality: this.evaluateTriggerQuality(trade),
        alternative_entries: this.findAlternativeEntries(trade)
      },
      management_analysis: {
        scaling_decisions: this.analyzeScalingDecisions(trade),
        stop_adjustments: this.analyzeStopAdjustments(trade)
      },
      exit_analysis: {
        timing_score: this.calculateTimingScore(trade, 'EXIT'),
        reason: this.determineExitReason(trade),
        alternative_exits: this.findAlternativeExits(trade),
        missed_profit: this.calculateMissedProfit(trade)
      }
    };
  }

  private calculateTimingScore(
    trade: TradeReview,
    type: 'ENTRY' | 'EXIT'
  ): number {
    if (type === 'ENTRY') {
      // Score based on entry relative to daily range and momentum
      return 85; // Example score
    } else {
      // Score based on exit efficiency and profit capture
      const profitCapture = (trade.exit_price - trade.entry_price) / 
        (trade.max_favorable_excursion - trade.entry_price);
      return Math.round(profitCapture * 100);
    }
  }

  private evaluatePositionSize(trade: TradeReview): number {
    // Evaluate if position size was appropriate given:
    // 1. Setup quality
    // 2. Market conditions
    // 3. Risk parameters
    return 90; // Example score
  }

  private evaluateTriggerQuality(trade: TradeReview): number {
    // Evaluate entry trigger based on:
    // 1. Technical confirmation
    // 2. Volume confirmation
    // 3. Market context
    return 85; // Example score
  }

  private findAlternativeEntries(trade: TradeReview): string[] {
    return [
      'Could have waited for first pullback',
      'Earlier entry on pre-market momentum',
      'Scale-in approach would have reduced risk'
    ];
  }

  private analyzeScalingDecisions(trade: TradeReview): DecisionAnalysis['management_analysis']['scaling_decisions'] {
    return [
      {
        time: '10:15 ET',
        action: 'Added 25% to position',
        evaluation: 'Good timing with momentum confirmation'
      },
      {
        time: '11:30 ET',
        action: 'Took partial profits',
        evaluation: 'Could have held longer given trend strength'
      }
    ];
  }

  private analyzeStopAdjustments(trade: TradeReview): DecisionAnalysis['management_analysis']['stop_adjustments'] {
    return [
      {
        time: '10:30 ET',
        action: 'Moved stop to breakeven',
        evaluation: 'Appropriate risk management'
      },
      {
        time: '11:45 ET',
        action: 'Tightened stop to lock profits',
        evaluation: 'Could have used wider trail given volatility'
      }
    ];
  }

  private determineExitReason(trade: TradeReview): string {
    // Analyze exit reason based on:
    // 1. Technical conditions
    // 2. Time-based factors
    // 3. Risk management rules
    return 'Technical target reached with momentum slowing';
  }

  private findAlternativeExits(trade: TradeReview): string[] {
    return [
      'Could have trailed stop looser',
      'Scale-out approach would have captured more upside',
      'Consider holding portion through close'
    ];
  }

  private calculateMissedProfit(trade: TradeReview): number {
    return trade.max_favorable_excursion - trade.exit_price;
  }

  private async analyzeEmotionalFactors(trades: TradeReview[]): Promise<EmotionalAnalysis> {
    return {
      emotional_state: {
        pre_trade: 'Confident but not overconfident',
        during_trade: 'Maintained objectivity',
        post_trade: 'Satisfied with execution'
      },
      psychological_factors: [
        {
          factor: 'PATIENCE',
          impact: 'Waited for proper setups',
          improvement_plan: 'Continue to avoid FOMO trades'
        },
        {
          factor: 'DISCIPLINE',
          impact: 'Followed trading plan',
          improvement_plan: 'Document all plan deviations'
        },
        {
          factor: 'ADAPTABILITY',
          impact: 'Adjusted to market conditions',
          improvement_plan: 'Develop specific criteria for strategy shifts'
        }
      ],
      discipline_score: 90
    };
  }

  private identifyImprovementAreas(
    performance: DailyReview['overall_performance'],
    decisionAnalysis: DecisionAnalysis[],
    emotionalAnalysis: EmotionalAnalysis
  ): string[] {
    const areas: string[] = [];

    // Performance-based improvements
    if (performance.win_rate < 0.65) {
      areas.push('Increase win rate through better entry criteria');
    }
    if (performance.profit_factor < 2.0) {
      areas.push('Improve profit factor by letting winners run');
    }

    // Decision-based improvements
    const avgEntryScore = decisionAnalysis.reduce(
      (sum, d) => sum + d.entry_analysis.timing_score, 0
    ) / decisionAnalysis.length;
    
    if (avgEntryScore < 85) {
      areas.push('Enhance entry timing through better triggers');
    }

    // Emotional improvements
    if (emotionalAnalysis.discipline_score < 95) {
      areas.push('Strengthen trading discipline and plan adherence');
    }

    return areas;
  }

  private generateActionItems(improvementAreas: string[]): string[] {
    return improvementAreas.map(area => {
      switch (area) {
        case 'Increase win rate through better entry criteria':
          return 'Review and document successful entry patterns';
        case 'Improve profit factor by letting winners run':
          return 'Implement scaled exit strategy for strong trends';
        case 'Enhance entry timing through better triggers':
          return 'Develop checklist for entry confirmation signals';
        case 'Strengthen trading discipline and plan adherence':
          return 'Create daily pre-market and post-market routines';
        default:
          return `Create specific action plan for: ${area}`;
      }
    });
  }

  async getReview(date: string): Promise<DailyReview | null> {
    return this.dailyReviews.get(date) || null;
  }

  async getPerformanceTrends(
    startDate: string,
    endDate: string
  ): Promise<any> {
    const reviews = Array.from(this.dailyReviews.values())
      .filter(review => 
        review.date >= startDate && 
        review.date <= endDate
      );

    return {
      win_rate_trend: this.calculateTrend(
        reviews.map(r => r.overall_performance.win_rate)
      ),
      profit_factor_trend: this.calculateTrend(
        reviews.map(r => r.overall_performance.profit_factor)
      ),
      discipline_score_trend: this.calculateTrend(
        reviews.map(r => r.emotional_analysis.discipline_score)
      )
    };
  }

  private calculateTrend(values: number[]): number {
    // Simple linear regression slope
    const n = values.length;
    if (n < 2) return 0;

    const indices = Array.from({length: n}, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}

export const dailyTradingReviewEngine = new DailyTradingReviewEngine(); 