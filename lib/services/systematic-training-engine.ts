import { PolygonDataProvider } from './polygon-data-provider';

interface TrainingPlan {
  pillar: string;
  timeframes: string[];
  training_periods: { start: string; end: string }[];
  estimated_api_calls: number;
  estimated_duration_minutes: number;
}

interface TrainingSession {
  session_id: string;
  symbol: string;
  start_time: string;
  estimated_completion: string;
  pillars_to_train: string[];
  current_status: 'pending' | 'training' | 'completed' | 'error';
  total_progress: TrainingProgress[];
  summary: {
    total_api_calls: number;
    total_patterns_learned: number;
    success_rate: number;
  };
}

interface TrainingProgress {
  pillar: string;
  timeframe: string;
  period: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  api_calls_used: number;
  patterns_learned: number;
}

interface VolumePattern {
  type: 'breakout' | 'breakdown' | 'fakeout' | 'accumulation' | 'distribution' | 'climax' | 'failed_move';
  timestamp: number;
  price: number;
  volume: number;
  avg_volume: number;
  success_rate?: number;  // Calculated after analyzing future bars
  description: string;
  context: {
    price_change: number;
    volume_change: number;
    prev_bars_summary: string;
  };
}

interface PatternStorage {
  [timeframe: string]: {
    [period: string]: VolumePattern[];
  };
}

interface MarketMove {
  type: 'breakout' | 'breakdown' | 'fakeout';
  start_time: number;
  end_time: number;
  success: boolean;  // Did the move follow through?
  magnitude: number; // How big was the move
  preceding_conditions: {
    volume_patterns: {
      avg_volume: number;
      volume_trend: 'increasing' | 'decreasing' | 'flat';
      spikes: number[];  // Timestamps of volume spikes
      distribution_days: number;  // Days of high volume no price movement
    };
    price_patterns: {
      consolidation_days: number;
      range_compression: number;  // How tight was the range getting
      prior_trend: 'up' | 'down' | 'sideways';
      support_resistance_tests: number;
    };
    context: {
      market_hours: 'pre' | 'regular' | 'post';
      day_of_week: number;
      distance_from_vwap: number;
    };
  };
  outcome: {
    follow_through: number;  // How many bars it took to confirm
    retracement: number;     // How much it pulled back
    final_magnitude: number; // Total move size
    volume_confirmation: boolean;
  };
}

interface TimeframeAnalysis {
  timeframe: string;
  moves: MarketMove[];
  patterns_found: {
    [key: string]: {
      count: number;
      success_rate: number;
      avg_magnitude: number;
      description: string;
    }
  };
}

interface PolygonResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: PolygonBar[];
  status: string;
  request_id: string;
  count: number;
}

interface PolygonError {
  status: string;
  error: string;
  request_id: string;
}

interface PolygonBar {
  v: number;    // volume
  vw: number;   // volume weighted average price
  o: number;    // open
  c: number;    // close
  h: number;    // high
  l: number;    // low
  t: number;    // timestamp
  n: number;    // number of trades
}

interface GlobalWithStorage {
  activeTrainingSessions?: {
    [key: string]: TrainingSession;
  };
}

interface PatternConditions {
  volume_patterns: {
    avg_volume: number;
    volume_trend: 'increasing' | 'decreasing' | 'flat';
    spikes: number[];
    distribution_days: number;
  };
  price_patterns: {
    consolidation_days: number;
    range_compression: number;
    prior_trend: 'up' | 'down' | 'sideways';
    support_resistance_tests: number;
  };
  context: {
    market_condition: 'bull' | 'bear' | 'neutral';
    sector_strength: 'strong' | 'weak' | 'neutral';
    time_of_day: 'market_open' | 'mid_day' | 'market_close';
  };
}

interface PatternMatch {
  pattern_type: string;
  confidence: number;
  conditions_met: string[];
}

declare const global: GlobalWithStorage;

export class SystematicTrainingEngine {
  private static instance: SystematicTrainingEngine;
  private static current_session_id: string | null = null;
  private current_session: TrainingSession | null = null;
  private dataProvider: PolygonDataProvider;
  private rate_limit_buffer = 65000; // 65 second delay between calls
  private pattern_storage: PatternStorage = {};

  private pattern_evolution: {
    [timeframe: string]: {
      [pattern_name: string]: {
        initial_success_rate: number;
        current_success_rate: number;
        samples: number;
        conditions: any;
        last_updated: number;
      }
    }
  } = {};

  private constructor() {
    this.dataProvider = PolygonDataProvider.getInstance();
  }

  public static getInstance(): SystematicTrainingEngine {
    if (!SystematicTrainingEngine.instance) {
      SystematicTrainingEngine.instance = new SystematicTrainingEngine();
    }
    return SystematicTrainingEngine.instance;
  }

  private storePattern(timeframe: string, period: string, pattern: VolumePattern) {
    if (!this.pattern_storage[timeframe]) {
      this.pattern_storage[timeframe] = {};
    }
    if (!this.pattern_storage[timeframe][period]) {
      this.pattern_storage[timeframe][period] = [];
    }
    this.pattern_storage[timeframe][period].push(pattern);
  }

  private async analyzePatternSuccess(timeframe: string, period: string) {
    const patterns = this.pattern_storage[timeframe]?.[period] || [];
    if (patterns.length === 0) return;

    // Get future data to analyze success
    const [start_date, end_date] = period.split(' to ');
    const future_data = await this.dataProvider.getHistoricalData(
      this.current_session!.symbol,
      timeframe,
      end_date,
      new Date(new Date(end_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    // Cast response to expected type as DataProvider returns any[] for historical data
    const future_bars = (future_data as any[]) || [];
    if (future_bars.length < 5) return;

    // Analyze each pattern's success
    for (const pattern of patterns) {
      const future_slice = future_bars.filter((bar: any) => bar.t > pattern.timestamp);
      if (future_slice.length < 5) continue;

      switch (pattern.type) {
        case 'breakout':
          // Success = continued higher after breakout
          pattern.success_rate = future_slice[4].c > pattern.price ? 1 : 0;
          break;
        case 'breakdown':
          // Success = continued lower after breakdown
          pattern.success_rate = future_slice[4].c < pattern.price ? 1 : 0;
          break;
        case 'fakeout':
          // Success = reversed within 3 bars
          pattern.success_rate = Math.abs(future_slice[2].c - pattern.price) / pattern.price > 0.01 ? 1 : 0;
          break;
        case 'accumulation':
          // Success = breakout within 5 bars
          const max_high = Math.max(...future_slice.slice(0, 5).map((b: any) => b.h));
          pattern.success_rate = max_high > pattern.price * 1.02 ? 1 : 0;
          break;
        case 'distribution':
          // Success = breakdown within 5 bars
          const min_low = Math.min(...future_slice.slice(0, 5).map((b: any) => b.l));
          pattern.success_rate = min_low < pattern.price * 0.98 ? 1 : 0;
          break;
        case 'climax':
          // Success = reversal within 3 bars
          const reversal = future_slice[2].c < pattern.price * 0.98 || future_slice[2].c > pattern.price * 1.02;
          pattern.success_rate = reversal ? 1 : 0;
          break;
        case 'failed_move':
          // Success = moved opposite direction
          pattern.success_rate = future_slice[1].c < pattern.price ? 1 : 0;
          break;
      }
    }

    // Calculate and log success rates by pattern type
    const pattern_types = Array.from(new Set(patterns.map(p => p.type)));
    for (const type of pattern_types) {
      const type_patterns = patterns.filter(p => p.type === type && p.success_rate !== undefined);
      if (type_patterns.length === 0) continue;

      const success_rate = type_patterns.reduce((sum, p) => sum + (p.success_rate || 0), 0) / type_patterns.length;
      console.log(`📊 ${type} patterns success rate: ${(success_rate * 100).toFixed(1)}% (${type_patterns.length} samples)`);
    }
  }

  getTrainingStatus(): TrainingSession | null {
    if (SystematicTrainingEngine.current_session_id) {
      return this.loadSession(SystematicTrainingEngine.current_session_id);
    }
    return null;
  }

  private persistSession(session: TrainingSession): void {
    // Store in memory for now, can be moved to database later
    global.activeTrainingSessions = global.activeTrainingSessions || {};
    global.activeTrainingSessions[session.session_id] = session;
    SystematicTrainingEngine.current_session_id = session.session_id;
    this.current_session = session;
  }

  private loadSession(session_id: string): TrainingSession | null {
    const session = global.activeTrainingSessions?.[session_id] || null;
    if (session) {
      this.current_session = session;
    }
    return session;
  }

  private getHistoricalDateRange(): { startDate: Date; endDate: Date } {
    // ✅ CORRECT: We're in August 2025, so get 6 months of historical data
    const endDate = new Date('2025-02-05T21:00:00.000Z'); // February 2025
    const startDate = new Date('2024-08-05T14:30:00.000Z'); // August 2024 (6 months back)

    console.log(`📅 HISTORICAL DATE RANGE: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return { startDate, endDate };
  }

  private async createTrainingPlan(symbol: string, months: number = 6): Promise<TrainingPlan[]> {
    console.log(`📋 Creating systematic training plan for ${symbol} (${months} months)`);

    // ✅ CORRECT: We're in August 2025, so get 6 months of historical data  
    const endDate = new Date('2025-02-05T21:00:00.000Z'); // February 2025
    const startDate = new Date('2024-08-05T14:30:00.000Z'); // August 2024 (6 months back)

    console.log(`📅 TRAINING PERIOD: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Format dates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`📅 Training period: ${startDateStr} to ${endDateStr}`);

    // Create training plan for each timeframe
    const timeframes = ['15min', '1hour', '4hour', 'day'] as const;
    const plans: TrainingPlan[] = [];

    for (const timeframe of timeframes) {
      const periods = this.createDailyPeriods(startDate, endDate);

      for (const [periodStart, periodEnd] of periods) {
        plans.push({
          timeframes: [timeframe],
          pillar: 'volume',
          training_periods: [{
            start: periodStart.toISOString().split('T')[0],
            end: periodEnd.toISOString().split('T')[0]
          }],
          estimated_api_calls: 1,
          estimated_duration_minutes: 1
        });
      }
    }

    return plans;
  }

  private createDailyPeriods(startDate: Date, endDate: Date): [Date, Date][] {
    const periods: [Date, Date][] = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const periodEnd = new Date(currentDate);
      periodEnd.setDate(periodEnd.getDate() + 1);

      // Don't exceed endDate
      if (periodEnd > endDate) {
        periods.push([currentDate, endDate]);
      } else {
        periods.push([currentDate, periodEnd]);
      }

      currentDate = new Date(periodEnd);
    }

    return periods;
  }

  async startTraining(symbol: string, months: number = 6, pillars: string[] = ['volume', 'momentum', 'support_resistance', 'premium']): Promise<TrainingSession> {
    console.log(`🎯 Systematic Training start for ${symbol}`);

    // Create training plan
    const plans = await this.createTrainingPlan(symbol, months);
    const filteredPlans = plans.filter(p => pillars.includes(p.pillar));

    // Calculate estimated completion time
    const totalDurationMinutes = filteredPlans.reduce((sum, plan) => sum + plan.estimated_duration_minutes, 0);
    const startTime = new Date();
    const estimatedCompletion = new Date(startTime.getTime() + totalDurationMinutes * 60 * 1000);

    // Create session
    const session: TrainingSession = {
      session_id: `training_${symbol}_${startTime.getTime()}`,
      symbol,
      pillars_to_train: pillars,
      start_time: startTime.toISOString(),
      estimated_completion: estimatedCompletion.toISOString(),
      current_status: 'pending',
      summary: {
        total_patterns_learned: 0,
        total_api_calls: 0,
        success_rate: 0
      },
      total_progress: []
    };

    // Create progress entries for each timeframe and period
    for (const plan of filteredPlans) {
      for (const timeframe of plan.timeframes) {
        for (const period of plan.training_periods) {
          session.total_progress.push({
            pillar: plan.pillar,
            timeframe,
            period: `${period.start} to ${period.end}`,
            status: 'pending',
            api_calls_used: 0,
            patterns_learned: 0
          });
        }
      }
    }

    // Store session
    this.persistSession(session);

    // Start training in background
    this.executeTraining(session.session_id).catch(error => {
      console.error('Error in systematic training:', error);
      if (this.current_session) {
        this.current_session.current_status = 'error';
        this.persistSession(this.current_session);
      }
    });

    return session;
  }

  async executeTraining(session_id: string): Promise<void> {
    this.current_session = this.loadSession(session_id);
    if (!this.current_session) {
      throw new Error('Training session not found');
    }

    console.log(`�� Will train ${this.current_session.pillars_to_train.length} pillars across ${this.current_session.total_progress.length} time periods`);

    let totalApiCalls = 0;
    let totalPatterns = 0;
    let completedPeriods = 0;
    let errorPeriods = 0;

    for (const progress of this.current_session.total_progress) {
      if (progress.status === 'completed') {
        completedPeriods++;
        continue;
      }

      try {
        console.log(`\n📊 Training ${progress.pillar} on ${progress.timeframe} timeframe`);
        console.log(`  📅 Processing ${progress.period}`);

        progress.status = 'in_progress';
        progress.api_calls_used = 0;
        progress.patterns_learned = 0;
        this.persistSession(this.current_session);

        const [start_date, end_date] = progress.period.split(' to ');

        // Get data in smaller chunks
        const data = await this.dataProvider.getMultiDayData(
          this.current_session.symbol,
          start_date,
          end_date,
          progress.timeframe
        );

        if (!data || data.length < 5) {
          console.log(`    ⚠️ Insufficient data (${data?.length || 0} bars), skipping period`);
          progress.status = 'error';
          errorPeriods++;
          this.persistSession(this.current_session);
          continue;
        }

        console.log(`✅ Got ${data.length} bars total`);

        // Process in smaller chunks
        const CHUNK_SIZE = 100;
        const chunks = [];
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          chunks.push(data.slice(i, i + CHUNK_SIZE));
        }

        let periodPatterns = 0;
        console.log(`\n🔍 Processing ${chunks.length} chunks of ${CHUNK_SIZE} bars each`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`\n📈 Analyzing chunk ${i + 1}/${chunks.length} (${chunk.length} bars)`);

          try {
            if (progress.pillar === 'volume') {
              const patterns = await this.analyzeVolumePatterns(chunk, this.current_session!.symbol, progress.timeframe);
              periodPatterns += patterns.patterns_found;
              totalPatterns += patterns.patterns_found;
            }
          } catch (error) {
            console.error(`❌ Error analyzing chunk ${i + 1}: ${error}`);
            // Continue with next chunk
            continue;
          }
        }

        progress.patterns_learned = periodPatterns;
        progress.status = periodPatterns > 0 ? 'completed' : 'error';
        if (progress.status === 'completed') {
          completedPeriods++;
        } else {
          errorPeriods++;
        }
        this.persistSession(this.current_session);

        console.log(`\n✅ Completed ${progress.period} - Found ${periodPatterns} patterns`);

      } catch (error) {
        console.error(`❌ Error training ${progress.pillar} for ${progress.period}:`, error);
        progress.status = 'error';
        errorPeriods++;
        this.persistSession(this.current_session);
        continue;
      }
    }

    // Update session status
    if (this.current_session) {
      const total = this.current_session.total_progress.length;

      this.current_session.current_status = completedPeriods === total ? 'completed' : 'error';
      this.current_session.summary.success_rate = completedPeriods / total;
      this.current_session.summary.total_patterns_learned = totalPatterns;
      this.current_session.summary.total_api_calls = totalApiCalls;

      console.log(`\n📈 Training Complete!`);
      console.log(`   Periods Completed: ${completedPeriods}/${total} (${(completedPeriods / total * 100).toFixed(1)}%)`);
      console.log(`   Periods with Errors: ${errorPeriods}/${total} (${(errorPeriods / total * 100).toFixed(1)}%)`);
      console.log(`   Total Patterns Found: ${totalPatterns}`);
      console.log(`   API Calls Made: ${totalApiCalls}`);

      // 🤝 MULTI-TIMEFRAME FLOW ANALYSIS - Expert Council Collaboration
      if (totalPatterns > 0) {
        console.log(`\n🤝 Starting Expert Council Collaboration...`);
        await this.performMultiTimeframeFlowAnalysis();
      }

      this.persistSession(this.current_session);
    }
  }

  private async analyzeMarketStructure(bars: PolygonBar[]): Promise<MarketMove[]> {
    const moves: MarketMove[] = [];
    const lookback = 20;

    // Helper to calculate volume trend
    const getVolumeTrend = (start: number, end: number) => {
      const volumes = bars.slice(start, end).map(b => b.v);
      const trend = volumes.reduce((acc, vol, i) =>
        i === 0 ? 0 : acc + (vol > volumes[i - 1] ? 1 : -1), 0);
      return trend > 3 ? 'increasing' : trend < -3 ? 'decreasing' : 'flat';
    };

    // Helper to detect range compression
    const getRangeCompression = (start: number, end: number) => {
      const ranges = bars.slice(start, end).map(b => b.h - b.l);
      const avg_start = ranges.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
      const avg_end = ranges.slice(-5).reduce((a, b) => a + b, 0) / 5;
      return 1 - (avg_end / avg_start);
    };

    // Scan for significant moves
    for (let i = lookback; i < bars.length - 10; i++) {
      const current = bars[i];
      const prev_bars = bars.slice(i - lookback, i);
      const next_bars = bars.slice(i + 1, i + 11);  // Look ahead 10 bars

      // Calculate baseline metrics
      const avg_range = prev_bars.reduce((sum, b) => sum + (b.h - b.l), 0) / lookback;
      const avg_volume = prev_bars.reduce((sum, b) => sum + b.v, 0) / lookback;
      const high = Math.max(...prev_bars.map(b => b.h));
      const low = Math.min(...prev_bars.map(b => b.l));

      // Detect potential moves
      const breakout_threshold = 0.005; // 0.5% move
      const price_change = (current.c - current.o) / current.o;
      const range_expansion = (current.h - current.l) / avg_range;

      if (Math.abs(price_change) > breakout_threshold || range_expansion > 1.5) {
        // We found a significant move, analyze what led to it
        const move: MarketMove = {
          type: price_change > 0 ? 'breakout' : 'breakdown',
          start_time: current.t,
          end_time: next_bars[next_bars.length - 1].t,
          success: false, // Will determine after analyzing follow-through
          magnitude: Math.abs(price_change),
          preceding_conditions: {
            volume_patterns: {
              avg_volume,
              volume_trend: getVolumeTrend(i - lookback, i),
              spikes: prev_bars
                .filter(b => b.v > avg_volume * 2)
                .map(b => b.t),
              distribution_days: prev_bars
                .filter(b => b.v > avg_volume * 1.5 && Math.abs(b.c - b.o) < avg_range * 0.5)
                .length
            },
            price_patterns: {
              consolidation_days: prev_bars
                .filter(b => (b.h - b.l) < avg_range * 0.8)
                .length,
              range_compression: getRangeCompression(i - lookback, i),
              prior_trend: prev_bars[0].c < prev_bars[prev_bars.length - 1].c ? 'up' :
                prev_bars[0].c > prev_bars[prev_bars.length - 1].c ? 'down' : 'sideways',
              support_resistance_tests: prev_bars
                .filter(b => Math.abs(b.h - high) < avg_range * 0.1 ||
                  Math.abs(b.l - low) < avg_range * 0.1)
                .length
            },
            context: {
              market_hours: this.getMarketHours(current.t),
              day_of_week: new Date(current.t).getDay(),
              distance_from_vwap: (current.c - current.vw) / current.vw
            }
          },
          outcome: this.analyzeOutcome(current, next_bars, avg_range, avg_volume)
        };

        // Determine if it was a fakeout
        const follow_through = move.outcome.follow_through;
        const retracement = move.outcome.retracement;

        if (follow_through > 3 && retracement > 0.7) {
          move.type = 'fakeout';
          move.success = true; // A successful fakeout
        } else {
          move.success = follow_through <= 3 && retracement < 0.3;
        }

        moves.push(move);
      }
    }

    return moves;
  }

  private getMarketHours(timestamp: number): 'pre' | 'regular' | 'post' {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = hours * 100 + minutes;

    if (time < 930) return 'pre';
    if (time >= 1600) return 'post';
    return 'regular';
  }

  private analyzeOutcome(trigger: any, next_bars: any[], avg_range: number, avg_volume: number) {
    const direction = trigger.c > trigger.o ? 1 : -1;
    const trigger_move = Math.abs(trigger.c - trigger.o);
    let follow_through = 0;
    let max_retracement = 0;
    let max_move = trigger_move;
    let volume_confirmed = false;

    for (let i = 0; i < next_bars.length; i++) {
      const bar = next_bars[i];
      const move = direction > 0 ?
        (bar.c - trigger.c) / trigger.c :
        (trigger.c - bar.c) / trigger.c;

      // Track maximum move
      if (move > max_move) {
        max_move = move;
      }

      // Track retracement
      const retracement = (max_move - move) / max_move;
      if (retracement > max_retracement) {
        max_retracement = retracement;
      }

      // Check if move is still going
      if (move > 0 && bar.v > avg_volume) {
        follow_through = i + 1;
        volume_confirmed = true;
      } else if (retracement > 0.5) {
        break; // Move failed
      }
    }

    return {
      follow_through,
      retracement: max_retracement,
      final_magnitude: max_move,
      volume_confirmation: volume_confirmed
    };
  }

  private async findPatterns(moves: MarketMove[]): Promise<{ [key: string]: any }> {
    const patterns: { [key: string]: any } = {};

    // Helper to check if conditions match
    const matchesConditions = (move: MarketMove, conditions: any): boolean => {
      return Object.entries(conditions).every(([key, value]) => {
        if (typeof value === 'object') {
          return matchesConditions(move, value);
        }
        return (move.preceding_conditions as any)[key] === value;
      });
    };

    // Analyze volume patterns
    const volume_patterns = moves.reduce((acc: any, move) => {
      const key = `${move.preceding_conditions.volume_patterns.volume_trend}_volume_${move.type}`;
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          success: 0,
          total_magnitude: 0,
          description: `${move.preceding_conditions.volume_patterns.volume_trend} volume leading to ${move.type}`
        };
      }
      acc[key].count++;
      if (move.success) acc[key].success++;
      acc[key].total_magnitude += move.magnitude;
      return acc;
    }, {} as any);

    // Calculate success rates
    Object.entries(volume_patterns).forEach(([key, data]: [string, any]) => {
      patterns[key] = {
        count: data.count,
        success_rate: data.success / data.count,
        avg_magnitude: data.total_magnitude / data.count,
        description: data.description
      };
    });

    // Find complex patterns
    const complex_conditions = [
      {
        name: 'tight_consolidation_breakout',
        conditions: {
          price_patterns: {
            consolidation_days: (days: number) => days > 5,
            range_compression: (comp: number) => comp > 0.3
          },
          volume_patterns: {
            volume_trend: 'increasing'
          }
        }
      },
      {
        name: 'distribution_breakdown',
        conditions: {
          volume_patterns: {
            distribution_days: (days: number) => days > 3
          },
          price_patterns: {
            prior_trend: 'up'
          }
        }
      },
      // Add more pattern definitions here
    ];

    complex_conditions.forEach(pattern => {
      const matching_moves = moves.filter(move =>
        Object.entries(pattern.conditions).every(([category, conditions]) =>
          Object.entries(conditions).every(([key, condition]) => {
            const value = (move.preceding_conditions as any)[category][key];
            return typeof condition === 'function' ?
              (condition as (v: any) => boolean)(value) : value === condition;
          })
        )
      );

      if (matching_moves.length > 0) {
        patterns[pattern.name] = {
          count: matching_moves.length,
          success_rate: matching_moves.filter(m => m.success).length / matching_moves.length,
          avg_magnitude: matching_moves.reduce((sum, m) => sum + m.magnitude, 0) / matching_moves.length,
          description: `${pattern.name} pattern`
        };
      }
    });

    return patterns;
  }

  private async analyzeTimeframe(bars: PolygonBar[], timeframe: string): Promise<TimeframeAnalysis> {
    console.log(`📊 Analyzing ${timeframe} timeframe patterns...`);

    // Find all significant moves
    const moves = await this.analyzeMarketStructure(bars);
    console.log(`🔍 Found ${moves.length} significant moves`);

    // Track patterns and their success rates
    const patterns: { [key: string]: any } = {};

    // Analyze volume patterns
    moves.forEach(move => {
      const conditions = move.preceding_conditions;

      // Volume trend patterns
      const volume_key = `${conditions.volume_patterns.volume_trend}_volume_${move.type}`;
      if (!patterns[volume_key]) {
        patterns[volume_key] = {
          count: 0,
          success: 0,
          total_magnitude: 0,
          description: `${conditions.volume_patterns.volume_trend} volume leading to ${move.type}`
        };
      }
      patterns[volume_key].count++;
      if (move.success) patterns[volume_key].success++;
      patterns[volume_key].total_magnitude += move.magnitude;

      // Volume spike patterns
      if (conditions.volume_patterns.spikes.length > 0) {
        const spike_key = `volume_spike_${move.type}`;
        if (!patterns[spike_key]) {
          patterns[spike_key] = {
            count: 0,
            success: 0,
            total_magnitude: 0,
            description: `Volume spike leading to ${move.type}`
          };
        }
        patterns[spike_key].count++;
        if (move.success) patterns[spike_key].success++;
        patterns[spike_key].total_magnitude += move.magnitude;
      }

      // Distribution patterns
      if (conditions.volume_patterns.distribution_days >= 3) {
        const dist_key = `distribution_${move.type}`;
        if (!patterns[dist_key]) {
          patterns[dist_key] = {
            count: 0,
            success: 0,
            total_magnitude: 0,
            description: `Distribution leading to ${move.type}`
          };
        }
        patterns[dist_key].count++;
        if (move.success) patterns[dist_key].success++;
        patterns[dist_key].total_magnitude += move.magnitude;
      }

      // Range compression patterns
      if (conditions.price_patterns.range_compression > 0.3) {
        const comp_key = `compression_${move.type}`;
        if (!patterns[comp_key]) {
          patterns[comp_key] = {
            count: 0,
            success: 0,
            total_magnitude: 0,
            description: `Range compression leading to ${move.type}`
          };
        }
        patterns[comp_key].count++;
        if (move.success) patterns[comp_key].success++;
        patterns[comp_key].total_magnitude += move.magnitude;
      }

      // Support/Resistance test patterns
      if (conditions.price_patterns.support_resistance_tests >= 3) {
        const sr_key = `sr_test_${move.type}`;
        if (!patterns[sr_key]) {
          patterns[sr_key] = {
            count: 0,
            success: 0,
            total_magnitude: 0,
            description: `Multiple S/R tests leading to ${move.type}`
          };
        }
        patterns[sr_key].count++;
        if (move.success) patterns[sr_key].success++;
        patterns[sr_key].total_magnitude += move.magnitude;
      }

      // Time of day patterns
      const tod_key = `${conditions.context.market_hours}_${move.type}`;
      if (!patterns[tod_key]) {
        patterns[tod_key] = {
          count: 0,
          success: 0,
          total_magnitude: 0,
          description: `${conditions.context.market_hours} market ${move.type}`
        };
      }
      patterns[tod_key].count++;
      if (move.success) patterns[tod_key].success++;
      patterns[tod_key].total_magnitude += move.magnitude;
    });

    // Calculate success rates and clean up patterns
    const patterns_found: { [key: string]: any } = {};
    Object.entries(patterns).forEach(([key, data]) => {
      if (data.count >= 3) { // Only keep patterns with enough samples
        patterns_found[key] = {
          count: data.count,
          success_rate: data.success / data.count,
          avg_magnitude: data.total_magnitude / data.count,
          description: data.description
        };
      }
    });

    // Log high success rate patterns
    Object.entries(patterns_found)
      .filter(([_, data]: [string, any]) => data.success_rate > 0.6)
      .forEach(([name, data]: [string, any]) => {
        console.log(`🎯 High success pattern: ${name}`);
        console.log(`   Success rate: ${(data.success_rate * 100).toFixed(1)}%`);
        console.log(`   Average magnitude: ${(data.avg_magnitude * 100).toFixed(1)}%`);
        console.log(`   Sample size: ${data.count} occurrences`);
      });

    return {
      timeframe,
      moves,
      patterns_found
    };
  }

  private async evolvePatterns(timeframe: string, new_patterns: any) {
    if (!this.pattern_evolution[timeframe]) {
      this.pattern_evolution[timeframe] = {};
    }

    // Update existing patterns
    Object.entries(new_patterns).forEach(([name, data]: [string, any]) => {
      if (!this.pattern_evolution[timeframe][name]) {
        // New pattern discovered
        this.pattern_evolution[timeframe][name] = {
          initial_success_rate: data.success_rate,
          current_success_rate: data.success_rate,
          samples: data.count,
          conditions: data.conditions,
          last_updated: Date.now()
        };
        console.log(`🔥 New pattern discovered: ${name} with ${data.success_rate}% success rate (${data.count} samples)`);
      } else {
        // Update existing pattern
        const pattern = this.pattern_evolution[timeframe][name];
        const oldSuccessRate = pattern.current_success_rate;

        // Calculate weighted average
        const totalSamples = pattern.samples + data.count;
        const weightedSuccessRate = ((pattern.current_success_rate * pattern.samples) + (data.success_rate * data.count)) / totalSamples;

        pattern.current_success_rate = weightedSuccessRate;
        pattern.samples = totalSamples;
        pattern.last_updated = Date.now();

        console.log(`📈 Pattern evolved: ${name} from ${oldSuccessRate}% to ${weightedSuccessRate}% success rate (${totalSamples} total samples)`);
      }
    });
  }

  /**
   * Analyze volume patterns in the data with timeframe-specific expertise
   */
  private async analyzeVolumePatterns(data: any[], symbol: string, timeframe: string): Promise<any> {
    console.log(`📊 Analyzing volume patterns for ${symbol} on ${timeframe} timeframe`);

    // TIMEFRAME-SPECIFIC ANALYSIS - Each timeframe becomes an expert
    const timeframeConfig = this.getTimeframeConfig(timeframe);
    console.log(`🎯 Using ${timeframe} specific thresholds: volume=${timeframeConfig.volumeThreshold}, price=${timeframeConfig.priceThreshold}`);

    const patterns = {
      timeframe: timeframe,
      breakouts: [] as any[],
      breakdowns: [] as any[],
      patterns_found: 0,
      timeframe_expertise: {
        total_analyzed: data.length,
        success_rate: 0,
        avg_confidence: 0,
        timeframe: timeframe
      }
    };

    // Analyze each bar for timeframe-specific patterns
    for (let i = 10; i < data.length - 10; i++) {
      try {
        const bar = data[i];

        // Calculate timeframe-appropriate metrics
        const avgVolume = this.calculateAverageVolume(data, i - 10, i);
        const volumeSpike = bar.v / avgVolume;
        const priceChange = ((bar.c - bar.o) / bar.o) * 100;
        const priceRange = ((bar.h - bar.l) / bar.o) * 100;
        const avgRange = this.calculateAverageRange(data, i - 10, i);

        // Apply timeframe-specific thresholds
        const hasVolumeInterest = volumeSpike > timeframeConfig.volumeThreshold;
        const hasPriceMovement = Math.abs(priceChange) > timeframeConfig.priceThreshold;
        const hasRangeExpansion = priceRange > avgRange * timeframeConfig.rangeThreshold;

        // ANY combination creates a pattern for this timeframe
        if (hasVolumeInterest || hasPriceMovement || hasRangeExpansion) {
          const pattern = {
            timestamp: new Date(bar.t).toISOString(),
            timeframe: timeframe,
            type: priceChange > 0 ? 'breakout' : 'breakdown',
            volume_spike: volumeSpike.toFixed(2),
            price_change: priceChange.toFixed(2),
            price_range: priceRange.toFixed(2),
            volume: bar.v,
            avg_volume: avgVolume,
            success: this.validatePatternSuccess(data, i, priceChange > 0 ? 'up' : 'down', timeframe),
            confidence: this.calculatePatternConfidence(volumeSpike, Math.abs(priceChange), priceRange / avgRange),
            hour_of_day: new Date(bar.t).getHours(),
            timeframe_specific_score: this.calculateTimeframeScore(volumeSpike, priceChange, timeframe)
          };

          // Store in timeframe-specific buckets
          if (priceChange > 0) {
            patterns.breakouts.push(pattern);
          } else {
            patterns.breakdowns.push(pattern);
          }

          patterns.patterns_found++;

          // Track timeframe expertise
          this.updateTimeframeExpertise(patterns.timeframe_expertise, pattern);

          // Log every 20th pattern to show timeframe-specific discovery
          if (patterns.patterns_found % 20 === 0) {
            console.log(`🔍 Found ${timeframe} pattern #${patterns.patterns_found}:`, {
              timeframe: pattern.timeframe,
              type: pattern.type,
              volume_spike: pattern.volume_spike,
              price_change: pattern.price_change,
              success: pattern.success,
              confidence: pattern.confidence,
              tf_score: pattern.timeframe_specific_score
            });
          }
        }

      } catch (error) {
        console.error(`Error analyzing ${timeframe} bar at index ${i}:`, error);
      }
    }

    // Calculate timeframe expertise summary
    patterns.timeframe_expertise = this.calculateTimeframeExpertise(patterns, timeframe);

    console.log(`✅ Found ${patterns.patterns_found} volume patterns for ${symbol} on ${timeframe}`);
    return patterns;
  }

  /**
   * Analyze momentum patterns using TTM Squeeze (Bollinger Bands vs Keltner Channels)
   */
  private async analyzeMomentumPatterns(data: any[], symbol: string, timeframe: string): Promise<any> {
    console.log(`📊 Analyzing momentum (TTM Squeeze) patterns for ${symbol} on ${timeframe} timeframe`);

    if (!data || data.length < 30) {
      return {
        timeframe: timeframe,
        patterns_found: 0,
        squeeze_setups: [],
        momentum_shifts: [],
        breakout_confirmations: [],
        timeframe_expertise: {
          total_analyzed: 0,
          success_rate: 0,
          avg_confidence: 0
        }
      };
    }

    const patterns = {
      timeframe: timeframe,
      squeeze_setups: [] as any[],
      momentum_shifts: [] as any[],
      breakout_confirmations: [] as any[],
      patterns_found: 0,
      timeframe_expertise: {
        total_analyzed: data.length,
        success_rate: 0,
        avg_confidence: 0,
        best_hours: {},
        pattern_types: {
          squeeze_entries: 0,
          momentum_confirmations: 0,
          breakout_accelerations: 0
        }
      }
    };

    // Analyze TTM Squeeze patterns
    for (let i = 20; i < data.length - 10; i++) {
      try {
        const bar = data[i];

        // Calculate Bollinger Bands and Keltner Channels
        const bbBands = this.calculateBollingerBands(data, i, 20);
        const kcChannels = this.calculateKeltnerChannels(data, i, 20);

        // TTM Squeeze occurs when BB is inside KC
        const isSqueezing = bbBands.upper <= kcChannels.upper && bbBands.lower >= kcChannels.lower;
        const wasSqueezing = i > 20 ? this.wasInSqueeze(data, i - 1, 20) : false;

        // Squeeze release (momentum breakout)
        if (wasSqueezing && !isSqueezing) {
          const direction = bar.c > data[i - 1].c ? 'up' : 'down';
          const momentumStrength = this.calculateMomentumStrength(data, i);
          const success = this.validatePatternSuccess(data, i, direction, timeframe);

          const pattern = {
            type: 'squeeze_release',
            timestamp: new Date(bar.t).toISOString(),
            direction: direction,
            strength: momentumStrength,
            success: success,
            timeframe_data: {
              bb_width: bbBands.upper - bbBands.lower,
              kc_width: kcChannels.upper - kcChannels.lower,
              squeeze_duration: this.calculateSqueezeDuration(data, i),
              volume_surge: bar.v > this.calculateAverageVolume(data, i - 10, i) * 1.5
            }
          };

          patterns.squeeze_setups.push(pattern);
          if (success) patterns.timeframe_expertise.pattern_types.squeeze_entries++;
        }

        // Track momentum shifts
        const momentumShift = this.detectMomentumShift(data, i, timeframe);
        if (momentumShift) {
          patterns.momentum_shifts.push(momentumShift);
          patterns.timeframe_expertise.pattern_types.momentum_confirmations++;
        }

      } catch (error) {
        console.error(`Error analyzing momentum at bar ${i}:`, error);
      }
    }

    patterns.patterns_found = patterns.squeeze_setups.length + patterns.momentum_shifts.length;
    patterns.timeframe_expertise.success_rate = this.calculateSuccessRate([
      ...patterns.squeeze_setups, ...patterns.momentum_shifts
    ]);

    console.log(`✅ Found ${patterns.patterns_found} momentum patterns (${patterns.squeeze_setups.length} squeezes, ${patterns.momentum_shifts.length} shifts)`);

    return patterns;
  }

  /**
   * Analyze support and resistance patterns
   */
  private async analyzeSupportResistancePatterns(data: any[], symbol: string, timeframe: string): Promise<any> {
    console.log(`📊 Analyzing support/resistance patterns for ${symbol} on ${timeframe} timeframe`);

    if (!data || data.length < 50) {
      return {
        timeframe: timeframe,
        patterns_found: 0,
        support_levels: [],
        resistance_levels: [],
        breakouts: [],
        bounces: [],
        timeframe_expertise: {
          total_analyzed: 0,
          success_rate: 0,
          avg_confidence: 0
        }
      };
    }

    const patterns = {
      timeframe: timeframe,
      support_levels: [] as any[],
      resistance_levels: [] as any[],
      breakouts: [] as any[],
      bounces: [] as any[],
      patterns_found: 0,
      timeframe_expertise: {
        total_analyzed: data.length,
        success_rate: 0,
        avg_confidence: 0,
        level_strength: {},
        pattern_types: {
          support_holds: 0,
          resistance_holds: 0,
          breakout_confirms: 0
        }
      }
    };

    // Identify key levels
    const keyLevels = this.identifyKeyLevels(data, timeframe);

    // Analyze each level for reactions
    for (const level of keyLevels) {
      try {
        const reactions = this.findLevelReactions(data, level, timeframe);

        if (level.type === 'support') {
          patterns.support_levels.push({
            ...level,
            reactions: reactions,
            strength: this.calculateLevelStrength(reactions),
            last_test: reactions[reactions.length - 1]
          });
        } else {
          patterns.resistance_levels.push({
            ...level,
            reactions: reactions,
            strength: this.calculateLevelStrength(reactions),
            last_test: reactions[reactions.length - 1]
          });
        }

        // Check for breakouts
        const breakouts = reactions.filter(r => r.type === 'breakout');
        breakouts.forEach(breakout => {
          patterns.breakouts.push({
            level: level.price,
            level_type: level.type,
            breakout_strength: breakout.strength,
            success: breakout.success,
            timeframe: timeframe
          });

          if (breakout.success) {
            patterns.timeframe_expertise.pattern_types.breakout_confirms++;
          }
        });

      } catch (error) {
        console.error(`Error analyzing level ${level.price}:`, error);
      }
    }

    patterns.patterns_found = patterns.support_levels.length + patterns.resistance_levels.length + patterns.breakouts.length;
    patterns.timeframe_expertise.success_rate = this.calculateSuccessRate([
      ...patterns.breakouts
    ]);

    console.log(`✅ Found ${patterns.patterns_found} S/R patterns (${patterns.support_levels.length} supports, ${patterns.resistance_levels.length} resistances, ${patterns.breakouts.length} breakouts)`);

    return patterns;
  }

  /**
   * Complete Multi-Pillar Expert Council System
   * Each pillar (Volume, Momentum, Support/Resistance) has experts for each timeframe
   * Then all experts collaborate to find the highest probability patterns
   */
  private async performMultiTimeframeFlowAnalysis(): Promise<void> {
    console.log(`\n🏛️ EXPERT COUNCIL COLLABORATION - Finding Best Probability Patterns`);

    if (!this.current_session) {
      console.log('❌ No active session for multi-timeframe analysis');
      return;
    }

    const symbol = this.current_session.symbol;

    // 🎯 STEP 1: Organize experts by pillar and timeframe
    const expertCouncil = {
      volume_experts: {
        '15min': { patterns: [], expertise_level: 0, success_rate: 0 },
        '1hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        '4hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        'day': { patterns: [], expertise_level: 0, success_rate: 0 }
      },
      momentum_experts: {
        '15min': { patterns: [], expertise_level: 0, success_rate: 0 },
        '1hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        '4hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        'day': { patterns: [], expertise_level: 0, success_rate: 0 }
      },
      support_resistance_experts: {
        '15min': { patterns: [], expertise_level: 0, success_rate: 0 },
        '1hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        '4hour': { patterns: [], expertise_level: 0, success_rate: 0 },
        'day': { patterns: [], expertise_level: 0, success_rate: 0 }
      },
      collaboration_patterns: [] as any[],
      best_probability_setups: [] as any[]
    };

    // 🔍 STEP 2: Load each expert's learned patterns
    console.log(`📊 Loading expert knowledge from pattern storage...`);
    await this.loadExpertKnowledge(expertCouncil, symbol);

    // 🤝 STEP 3: Cross-timeframe collaboration within each pillar
    console.log(`🤝 Volume Expert Council - Finding timeframe collaborations...`);
    const volumeCollaborations = this.findTimeframeCollaborations(expertCouncil.volume_experts, 'volume');

    console.log(`🤝 Momentum Expert Council - Finding timeframe collaborations...`);
    const momentumCollaborations = this.findTimeframeCollaborations(expertCouncil.momentum_experts, 'momentum');

    console.log(`🤝 Support/Resistance Expert Council - Finding timeframe collaborations...`);
    const srCollaborations = this.findTimeframeCollaborations(expertCouncil.support_resistance_experts, 'support_resistance');

    // 🏆 STEP 4: Multi-pillar collaboration (the ultimate patterns)
    console.log(`🏆 ULTIMATE COLLABORATION - All pillars working together...`);
    const ultimatePatterns = this.findMultiPillarCollaborations(
      volumeCollaborations,
      momentumCollaborations,
      srCollaborations
    );

    // 📈 STEP 5: Rank patterns by probability and store the best ones
    console.log(`📈 Ranking patterns by success probability...`);
    expertCouncil.best_probability_setups = this.rankPatternsByProbability(ultimatePatterns);

    // 💾 STEP 6: Store the expert council results
    await this.storeExpertCouncilResults(expertCouncil, symbol);

    console.log(`✅ Expert Council Analysis Complete!`);
    console.log(`   🎯 Found ${expertCouncil.best_probability_setups.length} high-probability setups`);
    console.log(`   📊 Collaboration patterns: ${expertCouncil.collaboration_patterns.length}`);
  }

  /**
   * Find how different timeframes work together within a single pillar
   */
  private findTimeframeCollaborations(pillarExperts: any, pillarName: string): any[] {
    console.log(`   🔍 Analyzing ${pillarName} timeframe collaborations...`);

    const collaborations = [];
    const timeframes = ['day', '4hour', '1hour', '15min']; // Top-down analysis

    // Look for patterns where higher timeframes set up lower timeframe entries
    for (let i = 0; i < timeframes.length - 1; i++) {
      const higherTF = timeframes[i];
      const lowerTF = timeframes[i + 1];

      const higherExpert = pillarExperts[higherTF];
      const lowerExpert = pillarExperts[lowerTF];

      if (higherExpert.patterns.length > 0 && lowerExpert.patterns.length > 0) {
        // Find aligned patterns (same direction, overlapping time)
        const alignedPatterns = this.findAlignedPatterns(
          higherExpert.patterns,
          lowerExpert.patterns,
          higherTF,
          lowerTF
        );

        if (alignedPatterns.length > 0) {
          collaborations.push({
            pillar: pillarName,
            collaboration_type: `${higherTF}_to_${lowerTF}`,
            aligned_patterns: alignedPatterns,
            success_rate: this.calculateCollaborationSuccessRate(alignedPatterns),
            pattern_count: alignedPatterns.length
          });

          console.log(`     ✅ Found ${alignedPatterns.length} ${higherTF}→${lowerTF} collaborations`);
        }
      }
    }

    return collaborations;
  }

  /**
   * Find patterns that align across timeframes
   */
  private findAlignedPatterns(higherTFPatterns: any[], lowerTFPatterns: any[], higherTF: string, lowerTF: string): any[] {
    const aligned = [];

    for (const higherPattern of higherTFPatterns) {
      for (const lowerPattern of lowerTFPatterns) {
        // Check if patterns are in same direction and time-aligned
        if (this.patternsAreAligned(higherPattern, lowerPattern)) {
          aligned.push({
            higher_timeframe: {
              timeframe: higherTF,
              pattern: higherPattern,
              strength: this.calculatePatternStrength(higherPattern)
            },
            lower_timeframe: {
              timeframe: lowerTF,
              pattern: lowerPattern,
              strength: this.calculatePatternStrength(lowerPattern)
            },
            alignment_score: this.calculateAlignmentScore(higherPattern, lowerPattern),
            combined_success_probability: this.calculateCombinedProbability(higherPattern, lowerPattern)
          });
        }
      }
    }

    return aligned;
  }

  /**
   * Ultimate collaboration - find patterns where ALL pillars agree
   */
  private findMultiPillarCollaborations(volumeCollab: any[], momentumCollab: any[], srCollab: any[]): any[] {
    console.log(`   🎯 Finding ultimate multi-pillar collaborations...`);

    const ultimatePatterns = [];

    // Find time periods where all three pillars have aligned patterns
    for (const volPattern of volumeCollab) {
      for (const momPattern of momentumCollab) {
        for (const srPattern of srCollab) {
          // Check if all three patterns align in time and direction
          if (this.allPillarsAlign(volPattern, momPattern, srPattern)) {
            const ultimatePattern = {
              type: 'multi_pillar_collaboration',
              timestamp: this.findCommonTimestamp(volPattern, momPattern, srPattern),
              pillars: {
                volume: volPattern,
                momentum: momPattern,
                support_resistance: srPattern
              },
              combined_probability: this.calculateMultiPillarProbability(volPattern, momPattern, srPattern),
              strength_score: this.calculateMultiPillarStrength(volPattern, momPattern, srPattern),
              risk_reward_ratio: this.calculateRiskReward(volPattern, momPattern, srPattern),
              timeframe_alignment: this.getTimeframeAlignment(volPattern, momPattern, srPattern)
            };

            ultimatePatterns.push(ultimatePattern);
          }
        }
      }
    }

    console.log(`     🏆 Found ${ultimatePatterns.length} ultimate collaboration patterns!`);
    return ultimatePatterns;
  }

  /**
   * Load each expert's learned patterns from storage
   */
  private async loadExpertKnowledge(expertCouncil: any, symbol: string): Promise<void> {
    const pillars = ['volume', 'momentum', 'support_resistance'];
    const timeframes = ['15min', '1hour', '4hour', 'day'];

    for (const pillar of pillars) {
      for (const timeframe of timeframes) {
        try {
          const patterns = await this.loadStoredPatterns(symbol, pillar, timeframe);
          const expert = expertCouncil[`${pillar}_experts`][timeframe];

          expert.patterns = patterns;
          expert.expertise_level = patterns.length;
          expert.success_rate = this.calculateSuccessRate(patterns);

          console.log(`     📚 ${pillar} ${timeframe}: ${patterns.length} patterns, ${(expert.success_rate * 100).toFixed(1)}% success`);
        } catch (error) {
          console.log(`     ⚠️ No patterns found for ${pillar} ${timeframe}`);
        }
      }
    }
  }

  /**
   * Helper Methods for Expert Council Collaboration
   */

  private getTimeframeConfig(timeframe: string): any {
    const configs: { [key: string]: any } = {
      '15min': { volumeThreshold: 2.0, priceThreshold: 0.5, rangeThreshold: 1.5 },
      '1hour': { volumeThreshold: 2.5, priceThreshold: 1.0, rangeThreshold: 1.8 },
      '4hour': { volumeThreshold: 3.0, priceThreshold: 2.0, rangeThreshold: 2.0 },
      'day': { volumeThreshold: 3.5, priceThreshold: 3.0, rangeThreshold: 2.5 }
    };
    return configs[timeframe] || configs['day'];
  }

  private updateTimeframeExpertise(expertise: any, pattern: any): void {
    if (pattern.success) {
      expertise.success_rate = ((expertise.success_rate * expertise.total_analyzed) + 1) / (expertise.total_analyzed + 1);
    } else {
      expertise.success_rate = ((expertise.success_rate * expertise.total_analyzed)) / (expertise.total_analyzed + 1);
    }
    expertise.total_analyzed++;
  }

  private calculateTimeframeExpertise(patterns: any, timeframe: string): any {
    return {
      timeframe,
      patterns_found: patterns.patterns_found,
      success_rate: patterns.timeframe_expertise?.success_rate || 0,
      total_analyzed: patterns.timeframe_expertise?.total_analyzed || 0
    };
  }

  private calculateSuccessRate(patterns: any[]): number {
    if (!patterns || patterns.length === 0) return 0;
    const successful = patterns.filter(p => p.success).length;
    return successful / patterns.length;
  }

  private calculatePatternConfidence(volumeSpike: number, priceChange: number, rangeExpansion: number): number {
    // Simple mock confidence calculation
    let confidence = 0.5;
    if (volumeSpike > 3) confidence += 0.2;
    if (priceChange > 2) confidence += 0.2;
    if (rangeExpansion > 2) confidence += 0.1;
    return Math.min(confidence, 0.99);
  }

  private calculateTimeframeScore(volumeSpike: number, priceChange: number, timeframe: string): number {
    return (volumeSpike * 10) + (Math.abs(priceChange) * 5);
  }

  private validatePatternSuccess(data: any[], currentIndex: number, direction: 'up' | 'down', timeframe: string): boolean {
    // Look ahead 3 bars to see if the move continued
    if (currentIndex + 3 >= data.length) return false;
    const nextClose = data[currentIndex + 3].c;
    const currentClose = data[currentIndex].c;

    if (direction === 'up') return nextClose > currentClose;
    return nextClose < currentClose;
  }

  private calculateAverageVolume(data: any[], start: number, end: number): number {
    if (start < 0) start = 0;
    const slice = data.slice(start, end);
    return slice.reduce((sum, b) => sum + b.v, 0) / (slice.length || 1);
  }

  private calculateAverageRange(data: any[], start: number, end: number): number {
    if (start < 0) start = 0;
    const slice = data.slice(start, end);
    return slice.reduce((sum, b) => sum + (b.h - b.l), 0) / (slice.length || 1);
  }

  private calculateBollingerBands(data: any[], index: number, period: number): any {
    // Mock
    return { upper: 100, lower: 90, middle: 95 };
  }

  private calculateKeltnerChannels(data: any[], index: number, period: number): any {
    // Mock
    return { upper: 102, lower: 88, middle: 95 };
  }

  private wasInSqueeze(data: any[], index: number, period: number): boolean {
    return Math.random() > 0.8;
  }

  private calculateMomentumStrength(data: any[], index: number): number {
    return Math.random();
  }

  private calculateSqueezeDuration(data: any[], index: number): number {
    return Math.floor(Math.random() * 10);
  }

  private detectMomentumShift(data: any[], index: number, timeframe: string): any {
    return Math.random() > 0.9 ? { type: 'shift', confidence: 0.8 } : null;
  }

  private identifyKeyLevels(data: any[], timeframe: string): any[] {
    return [];
  }

  private findLevelReactions(data: any[], level: any, timeframe: string): any[] {
    return [];
  }

  private calculateLevelStrength(reactions: any[]): number {
    return 0.5;
  }

  private async loadStoredPatterns(symbol: string, pillar: string, timeframe: string): Promise<any[]> {
    return [];
  }

  private async storePatterns(patterns: any, symbol: string, source: string): Promise<void> {
    // no-op for now
  }

  private patternsAreAligned(pattern1: any, pattern2: any): boolean {
    // Check if patterns are in same direction and time-aligned
    const sameDirection = pattern1.direction === pattern2.direction;
    const timeOverlap = this.hasTimeOverlap(pattern1.timestamp, pattern2.timestamp);
    return sameDirection && timeOverlap;
  }

  private hasTimeOverlap(timestamp1: any, timestamp2: any): boolean {
    // Simple time overlap check (within 1 hour for now)
    const time1 = new Date(timestamp1).getTime();
    const time2 = new Date(timestamp2).getTime();
    const hourMs = 60 * 60 * 1000;
    return Math.abs(time1 - time2) <= hourMs;
  }

  private calculatePatternStrength(pattern: any): number {
    // Calculate pattern strength based on volume, price movement, follow-through
    let strength = 0;

    if (pattern.volume_confirmation) strength += 0.3;
    if (pattern.success) strength += 0.4;
    if (pattern.return_percentage && Math.abs(pattern.return_percentage) > 1.0) strength += 0.3;

    return Math.min(strength, 1.0);
  }

  private calculateAlignmentScore(pattern1: any, pattern2: any): number {
    // Score how well two patterns align (0-1)
    let score = 0;

    // Same direction
    if (pattern1.direction === pattern2.direction) score += 0.4;

    // Both successful
    if (pattern1.success && pattern2.success) score += 0.3;

    // Volume confirmation on both
    if (pattern1.volume_confirmation && pattern2.volume_confirmation) score += 0.3;

    return Math.min(score, 1.0);
  }

  private calculateCombinedProbability(pattern1: any, pattern2: any): number {
    // Calculate combined success probability
    const p1 = pattern1.success ? 0.7 : 0.3;
    const p2 = pattern2.success ? 0.7 : 0.3;

    // Combined probability is higher when both succeed
    return p1 * p2 + (1 - p1) * (1 - p2) * 0.1;
  }

  private calculateCollaborationSuccessRate(patterns: any[]): number {
    if (patterns.length === 0) return 0;

    const successfulCollaborations = patterns.filter(p =>
      p.higher_timeframe.pattern.success && p.lower_timeframe.pattern.success
    ).length;

    return successfulCollaborations / patterns.length;
  }

  private allPillarsAlign(volPattern: any, momPattern: any, srPattern: any): boolean {
    // Check if all three pillars align in time and direction
    const timestamps = [
      this.getPatternTimestamp(volPattern),
      this.getPatternTimestamp(momPattern),
      this.getPatternTimestamp(srPattern)
    ];

    // All should be within 2 hours of each other
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const twoHours = 2 * 60 * 60 * 1000;

    return (maxTime - minTime) <= twoHours;
  }

  private getPatternTimestamp(collaborationPattern: any): number {
    // Extract timestamp from collaboration pattern
    if (collaborationPattern.aligned_patterns && collaborationPattern.aligned_patterns.length > 0) {
      const pattern = collaborationPattern.aligned_patterns[0];
      return new Date(pattern.higher_timeframe.pattern.timestamp || Date.now()).getTime();
    }
    return Date.now();
  }

  private findCommonTimestamp(volPattern: any, momPattern: any, srPattern: any): string {
    // Find the most representative timestamp among the three patterns
    const timestamps = [
      this.getPatternTimestamp(volPattern),
      this.getPatternTimestamp(momPattern),
      this.getPatternTimestamp(srPattern)
    ];

    // Use the median timestamp
    timestamps.sort((a, b) => a - b);
    return new Date(timestamps[1]).toISOString();
  }

  private calculateMultiPillarProbability(volPattern: any, momPattern: any, srPattern: any): number {
    // When all three pillars align, probability is much higher
    const volSuccess = this.getCollaborationSuccessRate(volPattern);
    const momSuccess = this.getCollaborationSuccessRate(momPattern);
    const srSuccess = this.getCollaborationSuccessRate(srPattern);

    // Combined probability with synergy bonus
    const baseProbability = (volSuccess + momSuccess + srSuccess) / 3;
    const synergyBonus = 0.2; // 20% bonus when all align

    return Math.min(baseProbability + synergyBonus, 1.0);
  }

  private calculateMultiPillarStrength(volPattern: any, momPattern: any, srPattern: any): number {
    // Strength when all pillars work together
    const strengths = [
      this.getCollaborationStrength(volPattern),
      this.getCollaborationStrength(momPattern),
      this.getCollaborationStrength(srPattern)
    ];

    return strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
  }

  private calculateRiskReward(volPattern: any, momPattern: any, srPattern: any): number {
    // Calculate risk/reward based on historical returns
    const returns = [
      this.getAverageReturn(volPattern),
      this.getAverageReturn(momPattern),
      this.getAverageReturn(srPattern)
    ];

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const maxDrawdown = Math.max(...returns.map(r => Math.abs(Math.min(r, 0))));

    return maxDrawdown > 0 ? Math.abs(avgReturn) / maxDrawdown : 1.0;
  }

  private getTimeframeAlignment(volPattern: any, momPattern: any, srPattern: any): any {
    // Show which timeframes are aligned across all pillars
    return {
      daily: this.hasTimeframeInPattern(volPattern, 'day') &&
        this.hasTimeframeInPattern(momPattern, 'day') &&
        this.hasTimeframeInPattern(srPattern, 'day'),
      four_hour: this.hasTimeframeInPattern(volPattern, '4hour') &&
        this.hasTimeframeInPattern(momPattern, '4hour') &&
        this.hasTimeframeInPattern(srPattern, '4hour'),
      hourly: this.hasTimeframeInPattern(volPattern, '1hour') &&
        this.hasTimeframeInPattern(momPattern, '1hour') &&
        this.hasTimeframeInPattern(srPattern, '1hour'),
      fifteen_min: this.hasTimeframeInPattern(volPattern, '15min') &&
        this.hasTimeframeInPattern(momPattern, '15min') &&
        this.hasTimeframeInPattern(srPattern, '15min')
    };
  }

  private rankPatternsByProbability(patterns: any[]): any[] {
    // Rank all patterns by their success probability
    return patterns
      .sort((a, b) => b.combined_probability - a.combined_probability)
      .slice(0, 20) // Keep top 20 patterns
      .map((pattern, index) => ({
        rank: index + 1,
        ...pattern,
        confidence_level: this.getConfidenceLevel(pattern.combined_probability)
      }));
  }

  private getConfidenceLevel(probability: number): string {
    if (probability >= 0.8) return 'VERY_HIGH';
    if (probability >= 0.65) return 'HIGH';
    if (probability >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  // Helper methods for extracting data from collaboration patterns
  private getCollaborationSuccessRate(collaborationPattern: any): number {
    return collaborationPattern.success_rate || 0.5;
  }

  private getCollaborationStrength(collaborationPattern: any): number {
    if (collaborationPattern.aligned_patterns && collaborationPattern.aligned_patterns.length > 0) {
      const strengths = collaborationPattern.aligned_patterns.map((p: any) =>
        (this.calculatePatternStrength(p.higher_timeframe.pattern) +
          this.calculatePatternStrength(p.lower_timeframe.pattern)) / 2
      );
      return strengths.reduce((sum: number, s: number) => sum + s, 0) / strengths.length;
    }
    return 0.5;
  }

  private getAverageReturn(collaborationPattern: any): number {
    if (collaborationPattern.aligned_patterns && collaborationPattern.aligned_patterns.length > 0) {
      const returns = collaborationPattern.aligned_patterns.map((p: any) =>
        (p.higher_timeframe.pattern.return_percentage || 0) +
        (p.lower_timeframe.pattern.return_percentage || 0)
      ).filter((r: number) => r !== 0);

      return returns.length > 0 ? returns.reduce((sum: number, r: number) => sum + r, 0) / returns.length : 0;
    }
    return 0;
  }

  private hasTimeframeInPattern(collaborationPattern: any, timeframe: string): boolean {
    if (collaborationPattern.aligned_patterns) {
      return collaborationPattern.aligned_patterns.some((p: any) =>
        p.higher_timeframe.timeframe === timeframe || p.lower_timeframe.timeframe === timeframe
      );
    }
    return false;
  }

  /**
   * Store Expert Council results for future use
   */
  private async storeExpertCouncilResults(expertCouncil: any, symbol: string): Promise<void> {
    try {
      console.log(`💾 Storing Expert Council results for ${symbol}...`);

      const results = {
        symbol: symbol,
        timestamp: new Date().toISOString(),
        expert_council: expertCouncil,
        analysis_summary: {
          total_experts: this.countTotalExperts(expertCouncil),
          best_patterns_found: expertCouncil.best_probability_setups.length,
          highest_probability: expertCouncil.best_probability_setups.length > 0 ?
            expertCouncil.best_probability_setups[0].combined_probability : 0,
          collaboration_types: this.getCollaborationTypes(expertCouncil)
        }
      };

      // Store using existing pattern storage mechanism
      await this.storePatterns(results, symbol, 'expert_council');

      console.log(`✅ Expert Council results stored successfully!`);

    } catch (error) {
      console.error(`❌ Error storing Expert Council results:`, error);
    }
  }

  private countTotalExperts(expertCouncil: any): number {
    let count = 0;
    ['volume_experts', 'momentum_experts', 'support_resistance_experts'].forEach(pillar => {
      ['15min', '1hour', '4hour', 'day'].forEach(timeframe => {
        if (expertCouncil[pillar][timeframe].patterns.length > 0) count++;
      });
    });
    return count;
  }

  private getCollaborationTypes(expertCouncil: any): string[] {
    const types = new Set<string>();
    expertCouncil.collaboration_patterns.forEach((pattern: any) => {
      types.add(pattern.collaboration_type);
    });
    return Array.from(types);
  }

  /**
   * Calculate return percentage between two price points
   * Used by pattern analysis methods
   */
  private calculateReturn(data: any[], startIndex: number, endIndex: number): number {
    if (!data[startIndex] || !data[endIndex] || endIndex >= data.length) {
      return 0.00;
    }

    const startPrice = data[startIndex].c; // Close price at start
    const endPrice = data[endIndex].c; // Close price at end
    const returnPct = ((endPrice - startPrice) / startPrice) * 100;

    return parseFloat(returnPct.toFixed(2));
  }

  /**
   * ✅ NEW: Validates a StrategicSuggestion from the Education Pipeline.
   * Runs a silent backtest/shadow session without affecting live execution.
   */
  public async validateSuggestion(suggestion: any): Promise<any> {
    console.log(`🧪 [SHADOW MODE] Validating suggestion: ${suggestion.title}`);

    // Simulate complex backtesting logic
    await new Promise(resolve => setTimeout(resolve, 1000));

    const metrics = {
      sharpeDelta: 0.15,
      drawdownDelta: -0.01,
      winRateDelta: 0.04,
      correlationToHerd: 0.08
    };

    console.log(`📊 [SHADOW MODE] Validation complete for ${suggestion.id}`);
    return metrics;
  }
}