
/**
 * Distribution Drift Detector (The Guard)
 * Uses Kolmogorov-Smirnov (KS) test to compare current market distributions
 * to historical training distributions.
 */

export interface DriftReport {
    timestamp: string;
    factor_id: string;
    ks_statistic: number;
    p_value: number;
    drift_detected: boolean;
    confidence_level: number; // 0-100
    regime_shift_probability: number; // 0-100
}

export class DistributionDriftDetector {
    private static instance: DistributionDriftDetector;
    private baselineDistributions: Map<string, number[]> = new Map();
    private currentWindow: Map<string, number[]> = new Map();
    private windowSize = 100; // Number of samples for "current" window

    private constructor() {
        console.log('🛡️ DISTRIBUTION DRIFT DETECTOR ONLINE');
    }

    public static getInstance(): DistributionDriftDetector {
        if (!DistributionDriftDetector.instance) {
            DistributionDriftDetector.instance = new DistributionDriftDetector();
        }
        return DistributionDriftDetector.instance;
    }

    /**
     * Set the ground truth (what the system was trained on)
     */
    public setBaseline(factorId: string, distribution: number[]) {
        console.log(`📊 Defining baseline distribution for: ${factorId} (${distribution.length} samples)`);
        this.baselineDistributions.set(factorId, [...distribution].sort((a, b) => a - b));
    }

    /**
     * Record a new data point and check for drift
     */
    public recordAndCheck(factorId: string, value: number): DriftReport | null {
        const samples = this.currentWindow.get(factorId) || [];
        samples.push(value);

        if (samples.length > this.windowSize) {
            samples.shift(); // Keep moving window
        }

        this.currentWindow.set(factorId, samples);

        // Only run analysis once we have enough samples to be statistically significant
        if (samples.length >= this.windowSize / 2) {
            return this.performKSTest(factorId, samples);
        }

        return null;
    }

    /**
     * Kolmogorov-Smirnov (KS) Test: Non-parametric test for equality of distributions
     */
    private performKSTest(factorId: string, currentSamples: number[]): DriftReport {
        const baseline = this.baselineDistributions.get(factorId);
        if (!baseline) {
            return this.createEmptyReport(factorId);
        }

        const sortedCurrent = [...currentSamples].sort((a, b) => a - b);

        // Calculate the maximum difference between empirical cumulative distribution functions (ECDFs)
        let maxD = 0;
        const n1 = baseline.length;
        const n2 = sortedCurrent.length;

        // Simplified D statistic calculation
        const allPointsSet = new Set([...baseline, ...sortedCurrent]);
        const allPoints = Array.from(allPointsSet).sort((a, b) => a - b);

        for (const x of allPoints) {
            const ecdf1 = baseline.filter(v => v <= x).length / n1;
            const ecdf2 = sortedCurrent.filter(v => v <= x).length / n2;
            const d = Math.abs(ecdf1 - ecdf2);
            if (d > maxD) maxD = d;
        }

        // Calculate simplified p-value approximation
        // In a real production system, we'd use a math library (e.g., d3-random or similar)
        // But the essential logic is: D > sqrt(-0.5 * ln(alpha/2) * (n1+n2)/(n1*n2))
        const alpha = 0.05; // 5% significance level
        const criticalValue = 1.36 * Math.sqrt((n1 + n2) / (n1 * n2));
        const driftDetected = maxD > criticalValue;

        return {
            timestamp: new Date().toISOString(),
            factor_id: factorId,
            ks_statistic: parseFloat(maxD.toFixed(4)),
            p_value: driftDetected ? 0.04 : 0.2, // Mocked for now
            drift_detected: driftDetected,
            confidence_level: driftDetected ? 95 : 50,
            regime_shift_probability: driftDetected ? Math.min(99, maxD * 200) : 0
        };
    }

    private createEmptyReport(factorId: string): DriftReport {
        return {
            timestamp: new Date().toISOString(),
            factor_id: factorId,
            ks_statistic: 0,
            p_value: 1,
            drift_detected: false,
            confidence_level: 0,
            regime_shift_probability: 0
        };
    }
}

export const distributionDriftDetector = DistributionDriftDetector.getInstance();
