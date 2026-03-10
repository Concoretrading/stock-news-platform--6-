// Walk-Forward Optimization Engine - Edge Persistence Validation
// Validates that trading edges persist over time using rolling windows

export interface WalkForwardConfig {
    train_window_months: number; // Default: 6 months
    test_window_months: number; // Default: 1 month
    step_size_months: number; // How much to slide window, default: 1 month
    min_trades_per_window: number; // Minimum trades to consider valid, default: 20
    performance_threshold: number; // Minimum Sharpe ratio to pass, default: 1.0
}

export interface WindowResult {
    window_id: number;
    train_period: {
        start_date: string;
        end_date: string;
        num_trades: number;
    };
    test_period: {
        start_date: string;
        end_date: string;
        num_trades: number;
    };
    train_performance: {
        total_return: number;
        sharpe_ratio: number;
        win_rate: number;
        max_drawdown: number;
    };
    test_performance: {
        total_return: number;
        sharpe_ratio: number;
        win_rate: number;
        max_drawdown: number;
    };
    performance_degradation: number; // Percentage drop from train to test
    edge_status: 'PERSISTENT' | 'DEGRADED' | 'FAILED';
}

export interface WalkForwardResults {
    config: WalkForwardConfig;
    windows: WindowResult[];
    overall_statistics: {
        total_windows: number;
        persistent_windows: number;
        degraded_windows: number;
        failed_windows: number;
        average_train_sharpe: number;
        average_test_sharpe: number;
        average_degradation: number;
        edge_persistence_rate: number; // Percentage of windows that passed
    };
    recommendations: {
        edge_is_robust: boolean;
        confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
        suggested_actions: string[];
        warnings: string[];
    };
}

export interface TradeRecord {
    date: string;
    ticker: string;
    direction: 'LONG' | 'SHORT';
    entry_price: number;
    exit_price: number;
    pnl_percentage: number;
    holding_period_days: number;
}

export class WalkForwardOptimizer {
    private config: WalkForwardConfig;

    constructor(config?: Partial<WalkForwardConfig>) {
        this.config = {
            train_window_months: 6,
            test_window_months: 1,
            step_size_months: 1,
            min_trades_per_window: 20,
            performance_threshold: 1.0,
            ...config
        };

        console.log('📊 INITIALIZING WALK-FORWARD OPTIMIZER');
        console.log(`🔄 Train Window: ${this.config.train_window_months} months`);
        console.log(`🧪 Test Window: ${this.config.test_window_months} month(s)`);
        console.log(`📈 Performance Threshold: Sharpe ≥ ${this.config.performance_threshold}`);
    }

    /**
     * Run walk-forward optimization on historical trades
     */
    async optimize(trades: TradeRecord[]): Promise<WalkForwardResults> {
        console.log(`\n📊 Running walk-forward optimization on ${trades.length} trades...`);

        // Sort trades by date
        const sortedTrades = trades.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Determine date range
        const startDate = new Date(sortedTrades[0].date);
        const endDate = new Date(sortedTrades[sortedTrades.length - 1].date);

        console.log(`📅 Date Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

        // Generate windows
        const windows = this.generateWindows(startDate, endDate);
        console.log(`🔄 Generated ${windows.length} windows\n`);

        // Run optimization for each window
        const results: WindowResult[] = [];
        for (let i = 0; i < windows.length; i++) {
            const window = windows[i];
            const result = this.evaluateWindow(window, sortedTrades, i + 1);

            if (result) {
                results.push(result);
                console.log(`   Window ${i + 1}/${windows.length}: ${result.edge_status} (Test Sharpe: ${result.test_performance.sharpe_ratio.toFixed(2)})`);
            }
        }

        // Calculate overall statistics
        const overallStats = this.calculateOverallStatistics(results);

        // Generate recommendations
        const recommendations = this.generateRecommendations(results, overallStats);

        return {
            config: this.config,
            windows: results,
            overall_statistics: overallStats,
            recommendations
        };
    }

    /**
     * Generate rolling windows
     */
    private generateWindows(startDate: Date, endDate: Date): Array<{
        train_start: Date;
        train_end: Date;
        test_start: Date;
        test_end: Date;
    }> {
        const windows = [];
        let currentStart = new Date(startDate);

        while (true) {
            const trainEnd = this.addMonths(currentStart, this.config.train_window_months);
            const testStart = trainEnd;
            const testEnd = this.addMonths(testStart, this.config.test_window_months);

            // Stop if test window exceeds data range
            if (testEnd > endDate) break;

            windows.push({
                train_start: new Date(currentStart),
                train_end: new Date(trainEnd),
                test_start: new Date(testStart),
                test_end: new Date(testEnd)
            });

            // Slide window forward
            currentStart = this.addMonths(currentStart, this.config.step_size_months);
        }

        return windows;
    }

    /**
     * Evaluate a single window
     */
    private evaluateWindow(
        window: { train_start: Date; train_end: Date; test_start: Date; test_end: Date },
        trades: TradeRecord[],
        windowId: number
    ): WindowResult | null {
        // Split trades into train and test
        const trainTrades = trades.filter(t => {
            const date = new Date(t.date);
            return date >= window.train_start && date < window.train_end;
        });

        const testTrades = trades.filter(t => {
            const date = new Date(t.date);
            return date >= window.test_start && date < window.test_end;
        });

        // Skip if insufficient trades
        if (trainTrades.length < this.config.min_trades_per_window ||
            testTrades.length < this.config.min_trades_per_window) {
            return null;
        }

        // Calculate performance metrics
        const trainPerf = this.calculatePerformance(trainTrades);
        const testPerf = this.calculatePerformance(testTrades);

        // Calculate degradation
        const degradation = ((trainPerf.sharpe_ratio - testPerf.sharpe_ratio) / trainPerf.sharpe_ratio) * 100;

        // Determine edge status
        let edgeStatus: WindowResult['edge_status'];
        if (testPerf.sharpe_ratio >= this.config.performance_threshold) {
            edgeStatus = 'PERSISTENT';
        } else if (testPerf.sharpe_ratio >= this.config.performance_threshold * 0.7) {
            edgeStatus = 'DEGRADED';
        } else {
            edgeStatus = 'FAILED';
        }

        return {
            window_id: windowId,
            train_period: {
                start_date: window.train_start.toISOString().split('T')[0],
                end_date: window.train_end.toISOString().split('T')[0],
                num_trades: trainTrades.length
            },
            test_period: {
                start_date: window.test_start.toISOString().split('T')[0],
                end_date: window.test_end.toISOString().split('T')[0],
                num_trades: testTrades.length
            },
            train_performance: trainPerf,
            test_performance: testPerf,
            performance_degradation: degradation,
            edge_status: edgeStatus
        };
    }

    /**
     * Calculate performance metrics for a set of trades
     */
    private calculatePerformance(trades: TradeRecord[]): {
        total_return: number;
        sharpe_ratio: number;
        win_rate: number;
        max_drawdown: number;
    } {
        if (trades.length === 0) {
            return { total_return: 0, sharpe_ratio: 0, win_rate: 0, max_drawdown: 0 };
        }

        const returns = trades.map(t => t.pnl_percentage);
        const totalReturn = returns.reduce((sum, r) => sum + r, 0);
        const avgReturn = totalReturn / returns.length;
        const stdDev = this.standardDeviation(returns);
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

        const wins = trades.filter(t => t.pnl_percentage > 0).length;
        const winRate = (wins / trades.length) * 100;

        const maxDrawdown = this.calculateMaxDrawdown(returns);

        return {
            total_return: totalReturn,
            sharpe_ratio: sharpeRatio,
            win_rate: winRate,
            max_drawdown: maxDrawdown
        };
    }

    /**
     * Calculate overall statistics
     */
    private calculateOverallStatistics(windows: WindowResult[]): WalkForwardResults['overall_statistics'] {
        const persistent = windows.filter(w => w.edge_status === 'PERSISTENT').length;
        const degraded = windows.filter(w => w.edge_status === 'DEGRADED').length;
        const failed = windows.filter(w => w.edge_status === 'FAILED').length;

        const avgTrainSharpe = this.mean(windows.map(w => w.train_performance.sharpe_ratio));
        const avgTestSharpe = this.mean(windows.map(w => w.test_performance.sharpe_ratio));
        const avgDegradation = this.mean(windows.map(w => w.performance_degradation));

        const persistenceRate = (persistent / windows.length) * 100;

        return {
            total_windows: windows.length,
            persistent_windows: persistent,
            degraded_windows: degraded,
            failed_windows: failed,
            average_train_sharpe: avgTrainSharpe,
            average_test_sharpe: avgTestSharpe,
            average_degradation: avgDegradation,
            edge_persistence_rate: persistenceRate
        };
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(
        windows: WindowResult[],
        stats: WalkForwardResults['overall_statistics']
    ): WalkForwardResults['recommendations'] {
        const edgeIsRobust = stats.edge_persistence_rate >= 70; // 70% threshold

        let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
        if (stats.edge_persistence_rate >= 80) confidenceLevel = 'HIGH';
        else if (stats.edge_persistence_rate >= 60) confidenceLevel = 'MEDIUM';
        else confidenceLevel = 'LOW';

        const suggestedActions: string[] = [];
        const warnings: string[] = [];

        if (edgeIsRobust) {
            suggestedActions.push('✅ Edge is robust - safe to deploy in live trading');
            suggestedActions.push('📈 Consider increasing position sizes gradually');
        } else {
            warnings.push('⚠️  Edge shows significant degradation over time');
            warnings.push('🔍 Review strategy parameters and market conditions');
            suggestedActions.push('🛠️  Re-optimize strategy on recent data');
            suggestedActions.push('📉 Reduce position sizes until edge improves');
        }

        if (stats.average_degradation > 30) {
            warnings.push('⚠️  High performance degradation (>30%) - possible overfitting');
        }

        if (stats.failed_windows > stats.total_windows * 0.3) {
            warnings.push('⚠️  >30% of windows failed - edge may be unstable');
        }

        return {
            edge_is_robust: edgeIsRobust,
            confidence_level: confidenceLevel,
            suggested_actions: suggestedActions,
            warnings: warnings
        };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private addMonths(date: Date, months: number): Date {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    private standardDeviation(arr: number[]): number {
        const avg = this.mean(arr);
        const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
        const avgSquareDiff = this.mean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    private mean(arr: number[]): number {
        return arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
    }

    private calculateMaxDrawdown(returns: number[]): number {
        let maxDrawdown = 0;
        let peak = 0;
        let cumulative = 0;

        for (const ret of returns) {
            cumulative += ret;
            if (cumulative > peak) peak = cumulative;
            const drawdown = peak - cumulative;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        return maxDrawdown;
    }
}

export const walkForwardOptimizer = new WalkForwardOptimizer();
