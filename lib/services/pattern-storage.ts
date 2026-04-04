interface PatternData {
  symbol: string;
  pattern_type: 'SQUEEZE' | 'BREAKOUT' | 'CONSOLIDATION';
  timeframe: string;
  start_date: string;
  end_date: string;
  success_rate: number;
  avg_profit: number;
  volume_profile: {
    avg_volume: number;
    volume_trend: 'increasing' | 'decreasing' | 'neutral';
  };
  key_levels: number[];
  momentum: {
    trend: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    timeframe_alignment: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

interface PatternQueryOptions {
  symbol?: string;
  pattern_type?: string;
  timeframe?: string;
  min_success_rate?: number;
  min_profit?: number;
  date_range?: {
    start: string;
    end: string;
  };
}

export class PatternStorage {
  private static instance: PatternStorage;
  private patterns: Map<string, PatternData> = new Map();

  private constructor() { }

  public static getInstance(): PatternStorage {
    if (!PatternStorage.instance) {
      PatternStorage.instance = new PatternStorage();
    }
    return PatternStorage.instance;
  }

  /**
   * Store a new pattern
   */
  async storePattern(pattern: PatternData): Promise<string> {
    try {
      const patternId = `${pattern.symbol}_${pattern.pattern_type}_${Date.now()}`;

      this.patterns.set(patternId, {
        ...pattern,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log(`✅ Stored pattern: ${patternId}`);
      return patternId;

    } catch (error) {
      console.error('Pattern storage error:', error);
      throw error;
    }
  }

  /**
   * Store multiple patterns
   */
  async storePatterns(patterns: PatternData[]): Promise<string[]> {
    try {
      const patternIds = await Promise.all(
        patterns.map(pattern => this.storePattern(pattern))
      );

      console.log(`✅ Stored ${patternIds.length} patterns`);
      return patternIds;

    } catch (error) {
      console.error('Bulk pattern storage error:', error);
      throw error;
    }
  }

  /**
   * Query patterns with filters
   */
  async queryPatterns(options: PatternQueryOptions): Promise<PatternData[]> {
    try {
      let patterns = Array.from(this.patterns.values());

      // Apply filters
      if (options.symbol) {
        patterns = patterns.filter(p => p.symbol === options.symbol);
      }
      if (options.pattern_type) {
        patterns = patterns.filter(p => p.pattern_type === options.pattern_type);
      }
      if (options.timeframe) {
        patterns = patterns.filter(p => p.timeframe === options.timeframe);
      }
      if (options.min_success_rate !== undefined) {
        patterns = patterns.filter(p => p.success_rate >= options.min_success_rate!);
      }
      if (options.min_profit !== undefined) {
        patterns = patterns.filter(p => p.avg_profit >= options.min_profit!);
      }
      if (options.date_range) {
        patterns = patterns.filter(p =>
          p.start_date >= options.date_range!.start &&
          p.start_date <= options.date_range!.end
        );
      }

      console.log(`📊 Found ${patterns.length} matching patterns`);
      return patterns;

    } catch (error) {
      console.error('Pattern query error:', error);
      throw error;
    }
  }

  /**
   * Get pattern by ID
   */
  async getPattern(patternId: string): Promise<PatternData | null> {
    try {
      const pattern = this.patterns.get(patternId);
      return pattern || null;

    } catch (error) {
      console.error('Pattern retrieval error:', error);
      throw error;
    }
  }

  /**
   * Get patterns for symbol
   */
  async getPatternsForSymbol(
    symbol: string,
    limit: number = 100
  ): Promise<PatternData[]> {
    try {
      const patterns = Array.from(this.patterns.values())
        .filter(p => p.symbol === symbol && p.success_rate >= 0.5)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      console.error(`Error getting patterns for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get best performing patterns
   */
  async getBestPatterns(
    minSuccessRate: number = 0.7,
    limit: number = 20
  ): Promise<PatternData[]> {
    try {
      const patterns = Array.from(this.patterns.values())
        .filter(p => p.success_rate >= minSuccessRate)
        .sort((a, b) => b.success_rate - a.success_rate)
        .slice(0, limit);

      return patterns;

    } catch (error) {
      console.error('Error getting best patterns:', error);
      throw error;
    }
  }

  /**
   * Get pattern statistics
   */
  async getPatternStats(): Promise<{
    total_patterns: number;
    patterns_by_type: { [key: string]: number };
    patterns_by_symbol: { [key: string]: number };
    avg_success_rate: number;
    avg_profit: number;
  }> {
    try {
      const patterns = Array.from(this.patterns.values());

      const stats = {
        total_patterns: patterns.length,
        patterns_by_type: {} as { [key: string]: number },
        patterns_by_symbol: {} as { [key: string]: number },
        avg_success_rate: 0,
        avg_profit: 0
      };

      patterns.forEach(pattern => {
        // Count by type
        stats.patterns_by_type[pattern.pattern_type] =
          (stats.patterns_by_type[pattern.pattern_type] || 0) + 1;

        // Count by symbol
        stats.patterns_by_symbol[pattern.symbol] =
          (stats.patterns_by_symbol[pattern.symbol] || 0) + 1;

        // Add to averages
        stats.avg_success_rate += pattern.success_rate;
        stats.avg_profit += pattern.avg_profit;
      });

      // Calculate averages
      if (patterns.length > 0) {
        stats.avg_success_rate /= patterns.length;
        stats.avg_profit /= patterns.length;
      }

      return stats;

    } catch (error) {
      console.error('Error getting pattern stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const patternStorage = PatternStorage.getInstance(); 