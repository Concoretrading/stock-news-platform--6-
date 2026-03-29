// Edge Decay Tracker - Monitor Pattern Success Rates Over Time
// Detects when trading edges stop working and alerts for strategy adjustments

export interface PatternPerformance {
    pattern_id: string;
    pattern_name: string;
    pattern_type: 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT' | 'FLOW' | 'HYBRID';
    historical_success_rate: number; // 0-100%
    recent_success_rate: number; // Last 30 trades, 0-100%
    performance_history: {
        date: string;
        success_rate: number;
        sample_size: number;
    }[];
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
}

export interface EdgeDecayAnalysis {
    pattern_id: string;
    pattern_name: string;
    decay_status: 'STRONG' | 'STABLE' | 'WEAKENING' | 'DECAYING' | 'FAILED';
    decay_percentage: number; // How much has performance degraded
    confidence: number; // 0-100, confidence in decay assessment
    recent_performance: {
        last_10_trades: number; // Win rate
        last_30_trades: number;
        last_90_trades: number;
    };
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    recommended_action: 'INCREASE_SIZE' | 'MAINTAIN' | 'REDUCE_SIZE' | 'DISABLE' | 'REVIEW';
    warnings: string[];
    insights: string[];
}

export interface EdgeDecayReport {
    timestamp: string;
    patterns_analyzed: number;
    strong_edges: EdgeDecayAnalysis[];
    decaying_edges: EdgeDecayAnalysis[];
    failed_edges: EdgeDecayAnalysis[];
    overall_health: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    recommendations: string[];
}

export class EdgeDecayTracker {
    private patternPerformance: Map<string, PatternPerformance> = new Map();
    private decayThreshold: number = 0.7; // 30% decay triggers warning

    constructor(decayThreshold?: number) {
        this.decayThreshold = decayThreshold || 0.7;

        console.log('📉 INITIALIZING EDGE DECAY TRACKER');
        console.log(`⚠️  Decay Threshold: ${(1 - this.decayThreshold) * 100}% degradation`);
    }

    /**
     * Record a trade result for a pattern
     */
    recordTrade(
        patternId: string,
        patternName: string,
        patternType: PatternPerformance['pattern_type'],
        wasSuccessful: boolean
    ): void {
        let pattern = this.patternPerformance.get(patternId);

        if (!pattern) {
            // Initialize new pattern
            pattern = {
                pattern_id: patternId,
                pattern_name: patternName,
                pattern_type: patternType,
                historical_success_rate: 0,
                recent_success_rate: 0,
                performance_history: [],
                total_trades: 0,
                winning_trades: 0,
                losing_trades: 0
            };
        }

        // Update trade counts
        pattern.total_trades++;
        if (wasSuccessful) {
            pattern.winning_trades++;
        } else {
            pattern.losing_trades++;
        }

        // Update historical success rate
        pattern.historical_success_rate = (pattern.winning_trades / pattern.total_trades) * 100;

        // Add to performance history
        pattern.performance_history.push({
            date: new Date().toISOString(),
            success_rate: pattern.historical_success_rate,
            sample_size: pattern.total_trades
        });

        // Calculate recent success rate (last 30 trades)
        const recentTrades = pattern.performance_history.slice(-30);
        if (recentTrades.length > 0) {
            const recentWins = recentTrades.filter((_, i) => {
                const tradeIndex = pattern.total_trades - 30 + i;
                return tradeIndex >= 0 && tradeIndex < pattern.winning_trades;
            }).length;
            pattern.recent_success_rate = (recentWins / recentTrades.length) * 100;
        }

        this.patternPerformance.set(patternId, pattern);
    }

    /**
     * Check if an edge is decaying
     */
    checkEdge(patternId: string): EdgeDecayAnalysis | null {
        const pattern = this.patternPerformance.get(patternId);

        if (!pattern) {
            console.warn(`Pattern ${patternId} not found`);
            return null;
        }

        console.log(`📉 Checking edge decay for: ${pattern.pattern_name}`);

        // Calculate recent performance windows
        const recentPerf = this.calculateRecentPerformance(pattern);

        // Calculate decay percentage
        const decayPercentage = pattern.historical_success_rate > 0
            ? ((pattern.historical_success_rate - recentPerf.last_30_trades) / pattern.historical_success_rate) * 100
            : 0;

        // Determine decay status
        const decayStatus = this.determineDecayStatus(pattern, recentPerf, decayPercentage);

        // Determine trend
        const trend = this.determineTrend(pattern);

        // Generate recommended action
        const recommendedAction = this.generateRecommendedAction(decayStatus, trend);

        // Generate warnings and insights
        const warnings = this.generateWarnings(pattern, decayStatus, decayPercentage);
        const insights = this.generateInsights(pattern, trend, recentPerf);

        // Calculate confidence in assessment
        const confidence = this.calculateConfidence(pattern);

        return {
            pattern_id: pattern.pattern_id,
            pattern_name: pattern.pattern_name,
            decay_status: decayStatus,
            decay_percentage: decayPercentage,
            confidence,
            recent_performance: recentPerf,
            trend,
            recommended_action: recommendedAction,
            warnings,
            insights
        };
    }

    /**
     * Generate full edge decay report
     */
    generateReport(): EdgeDecayReport {
        console.log('📊 Generating edge decay report...');

        const analyses: EdgeDecayAnalysis[] = [];

        for (const patternId of Array.from(this.patternPerformance.keys())) {
            const analysis = this.checkEdge(patternId);
            if (analysis) {
                analyses.push(analysis);
            }
        }

        // Categorize edges
        const strongEdges = analyses.filter(a => a.decay_status === 'STRONG' || a.decay_status === 'STABLE');
        const decayingEdges = analyses.filter(a => a.decay_status === 'WEAKENING' || a.decay_status === 'DECAYING');
        const failedEdges = analyses.filter(a => a.decay_status === 'FAILED');

        // Determine overall health
        const overallHealth = this.determineOverallHealth(strongEdges.length, decayingEdges.length, failedEdges.length);

        // Generate recommendations
        const recommendations = this.generateSystemRecommendations(strongEdges, decayingEdges, failedEdges);

        return {
            timestamp: new Date().toISOString(),
            patterns_analyzed: analyses.length,
            strong_edges: strongEdges,
            decaying_edges: decayingEdges,
            failed_edges: failedEdges,
            overall_health: overallHealth,
            recommendations
        };
    }

    /**
     * Get all pattern performance data
     */
    getAllPatterns(): PatternPerformance[] {
        return Array.from(this.patternPerformance.values());
    }

    /**
     * Reset a pattern's performance data
     */
    resetPattern(patternId: string): void {
        this.patternPerformance.delete(patternId);
        console.log(`✅ Reset pattern: ${patternId}`);
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private calculateRecentPerformance(pattern: PatternPerformance): EdgeDecayAnalysis['recent_performance'] {
        const last10 = this.calculateWindowSuccessRate(pattern, 10);
        const last30 = this.calculateWindowSuccessRate(pattern, 30);
        const last90 = this.calculateWindowSuccessRate(pattern, 90);

        return {
            last_10_trades: last10,
            last_30_trades: last30,
            last_90_trades: last90
        };
    }

    private calculateWindowSuccessRate(pattern: PatternPerformance, window: number): number {
        if (pattern.total_trades < window) {
            return pattern.historical_success_rate; // Not enough data
        }

        const recentHistory = pattern.performance_history.slice(-window);
        if (recentHistory.length === 0) return 0;

        // Average success rate over window
        const avgSuccessRate = recentHistory.reduce((sum, h) => sum + h.success_rate, 0) / recentHistory.length;
        return avgSuccessRate;
    }

    private determineDecayStatus(
        pattern: PatternPerformance,
        recentPerf: EdgeDecayAnalysis['recent_performance'],
        decayPercentage: number
    ): EdgeDecayAnalysis['decay_status'] {
        const historical = pattern.historical_success_rate;
        const recent = recentPerf.last_30_trades;

        // Not enough data
        if (pattern.total_trades < 20) {
            return 'STABLE';
        }

        // Strong: recent performance exceeds historical
        if (recent >= historical * 1.1) {
            return 'STRONG';
        }

        // Stable: recent performance within 10% of historical
        if (recent >= historical * 0.9) {
            return 'STABLE';
        }

        // Weakening: 10-30% degradation
        if (recent >= historical * this.decayThreshold) {
            return 'WEAKENING';
        }

        // Decaying: 30-50% degradation
        if (recent >= historical * 0.5) {
            return 'DECAYING';
        }

        // Failed: >50% degradation
        return 'FAILED';
    }

    private determineTrend(pattern: PatternPerformance): EdgeDecayAnalysis['trend'] {
        if (pattern.performance_history.length < 10) {
            return 'STABLE';
        }

        const recent = pattern.performance_history.slice(-10);
        const older = pattern.performance_history.slice(-20, -10);

        if (older.length === 0) return 'STABLE';

        const recentAvg = recent.reduce((sum, h) => sum + h.success_rate, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.success_rate, 0) / older.length;

        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (change > 10) return 'IMPROVING';
        if (change < -10) return 'DECLINING';
        return 'STABLE';
    }

    private generateRecommendedAction(
        status: EdgeDecayAnalysis['decay_status'],
        trend: EdgeDecayAnalysis['trend']
    ): EdgeDecayAnalysis['recommended_action'] {
        if (status === 'STRONG' && trend === 'IMPROVING') return 'INCREASE_SIZE';
        if (status === 'STRONG' || status === 'STABLE') return 'MAINTAIN';
        if (status === 'WEAKENING') return 'REDUCE_SIZE';
        if (status === 'DECAYING') return 'REVIEW';
        if (status === 'FAILED') return 'DISABLE';
        return 'MAINTAIN';
    }

    private generateWarnings(
        pattern: PatternPerformance,
        status: EdgeDecayAnalysis['decay_status'],
        decayPercentage: number
    ): string[] {
        const warnings: string[] = [];

        if (status === 'FAILED') {
            warnings.push('⚠️  CRITICAL: Edge has failed - disable immediately');
        }

        if (status === 'DECAYING') {
            warnings.push(`⚠️  Edge is decaying rapidly (${decayPercentage.toFixed(1)}% degradation)`);
        }

        if (pattern.total_trades < 20) {
            warnings.push('⚠️  Insufficient sample size - results may not be reliable');
        }

        if (decayPercentage > 50) {
            warnings.push('⚠️  Performance has degraded by >50% - urgent review needed');
        }

        return warnings;
    }

    private generateInsights(
        pattern: PatternPerformance,
        trend: EdgeDecayAnalysis['trend'],
        recentPerf: EdgeDecayAnalysis['recent_performance']
    ): string[] {
        const insights: string[] = [];

        if (trend === 'IMPROVING') {
            insights.push('✅ Pattern performance is improving over time');
        }

        if (recentPerf.last_10_trades > pattern.historical_success_rate) {
            insights.push('✅ Recent trades outperforming historical average');
        }

        if (pattern.total_trades > 100) {
            insights.push(`✅ Large sample size (${pattern.total_trades} trades) - results are statistically significant`);
        }

        return insights;
    }

    private calculateConfidence(pattern: PatternPerformance): number {
        // Confidence based on sample size
        if (pattern.total_trades < 20) return 30;
        if (pattern.total_trades < 50) return 60;
        if (pattern.total_trades < 100) return 80;
        return 95;
    }

    private determineOverallHealth(
        strong: number,
        decaying: number,
        failed: number
    ): EdgeDecayReport['overall_health'] {
        const total = strong + decaying + failed;
        if (total === 0) return 'FAIR';

        const strongPct = (strong / total) * 100;

        if (strongPct >= 80) return 'EXCELLENT';
        if (strongPct >= 60) return 'GOOD';
        if (strongPct >= 40) return 'FAIR';
        return 'POOR';
    }

    private generateSystemRecommendations(
        strong: EdgeDecayAnalysis[],
        decaying: EdgeDecayAnalysis[],
        failed: EdgeDecayAnalysis[]
    ): string[] {
        const recommendations: string[] = [];

        if (failed.length > 0) {
            recommendations.push(`🚨 Disable ${failed.length} failed pattern(s) immediately`);
        }

        if (decaying.length > 0) {
            recommendations.push(`⚠️  Review ${decaying.length} decaying pattern(s) - consider re-optimization`);
        }

        if (strong.length > 0) {
            recommendations.push(`✅ ${strong.length} pattern(s) performing well - consider increasing allocation`);
        }

        if (strong.length === 0 && decaying.length === 0 && failed.length === 0) {
            recommendations.push('ℹ️  No patterns tracked yet - start recording trades');
        }

        return recommendations;
    }
}

export const edgeDecayTracker = new EdgeDecayTracker();
