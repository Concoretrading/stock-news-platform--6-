
// Timeframe Council
// "The Council of Three: Investor, Swing Trader, Scalper"

// --- Interface Definitions ---

export interface TimeframeAnalysis {
    timeframe: 'weekly' | 'daily' | '4h' | '1h' | '5min';
    trend: 'uptrend' | 'downtrend' | 'neutral' | 'volatile';
    key_levels: {
        nearest_resistance: number;
        nearest_support: number;
        distance_to_resistance_pct: number;
        distance_to_support_pct: number;
    };
    structure: 'breakout' | 'breakdown' | 'consolidation' | 'extension';
    momentum: 'accelerating' | 'decelerating' | 'divergence' | 'neutral';
}

export interface CouncilVote {
    voter: 'Investor' | 'Swing' | 'Scalper';
    vote: 'bullish' | 'bearish' | 'neutral';
    confidence: number; // 0-100
    rationale: string;
    management_preference: 'hold_runners' | 'scalp_only' | 'defensive' | 'no_trade';
}

export interface CouncilDecision {
    overall_bias: 'bullish' | 'bearish' | 'neutral';
    trade_grade: 'A+' | 'B' | 'C' | 'No Trade';
    alignment_score: number; // 0-100
    runner_mode: boolean; // True if Investor/Swing agree with Scalper
    suggested_sizing_multiplier: number; // 1.0 = standard, 2.0 = A+, 0.5 = C
    rationale_summary: string;
    votes: CouncilVote[];
}

// --- Service Implementation ---

export class TimeframeCouncil {
    constructor() {
        console.log('🏛️ TIMEFRAME COUNCIL INITIALIZED');
    }

    /**
     * Convene the council to analyze a potential trade setup.
     */
    public conveneCouncil(
        ticker: string,
        weeklyData: TimeframeAnalysis,
        dailyData: TimeframeAnalysis,
        scalpData: TimeframeAnalysis
    ): CouncilDecision {
        console.log(`🔔 Convening Council for ${ticker}...`);

        // 1. Get Votes
        const investorVote = this.getInvestorVote(weeklyData);
        const swingVote = this.getSwingVote(dailyData);
        const scalperVote = this.getScalperVote(scalpData);

        // 2. Tally Votes and Determine Alignment
        const votes = [investorVote, swingVote, scalperVote];
        return this.synthesizeDecision(votes);
    }

    // --- Persona: The Investor (Weekly/Monthly) ---
    private getInvestorVote(analysis: TimeframeAnalysis): CouncilVote {
        // Investor cares about Macro Structure and Valuation (simplified here as Trend/Levels)

        // Veto Logic: If at major resistance in a downtrend, Investor says NO efficiently.
        if (analysis.trend === 'downtrend' && analysis.key_levels.distance_to_resistance_pct < 0.02) {
            return {
                voter: 'Investor',
                vote: 'bearish',
                confidence: 90,
                rationale: "Major Weekly resistance reached in downtrend. Rallies are for selling.",
                management_preference: 'defensive'
            };
        }

        if (analysis.trend === 'uptrend' && analysis.structure === 'breakout') {
            return {
                voter: 'Investor',
                vote: 'bullish',
                confidence: 85,
                rationale: "Weekly structural breakout. Blue skies ahead.",
                management_preference: 'hold_runners'
            };
        }

        return {
            voter: 'Investor',
            vote: 'neutral',
            confidence: 50,
            rationale: "Weekly chart is chopping/neutral. No strong opinion.",
            management_preference: 'scalp_only'
        };
    }

    // --- Persona: The Swing Trader (Daily/4H) ---
    private getSwingVote(analysis: TimeframeAnalysis): CouncilVote {
        // Swing Trader cares about Momentum and Squeezes

        if (analysis.momentum === 'accelerating' && analysis.structure === 'breakout') {
            return {
                voter: 'Swing',
                vote: 'bullish',
                confidence: 90,
                rationale: "Daily momentum accelerating into breakout. Squeeze firing.",
                management_preference: 'hold_runners'
            };
        }

        if (analysis.momentum === 'divergence' && analysis.trend === 'uptrend') {
            return {
                voter: 'Swing',
                vote: 'bearish', // Contrarian swing thought
                confidence: 75,
                rationale: "Daily signals bearish divergence at highs. Expecting rotation.",
                management_preference: 'scalp_only'
            };
        }

        return {
            voter: 'Swing',
            vote: analysis.trend === 'uptrend' ? 'bullish' : 'bearish',
            confidence: 60,
            rationale: `Daily trend is ${analysis.trend}, following flow.`,
            management_preference: 'scalp_only'
        };
    }

    // --- Persona: The Scalper (1min/5min) ---
    private getScalperVote(analysis: TimeframeAnalysis): CouncilVote {
        // Scalper cares about immediate execution
        if (analysis.momentum === 'accelerating') {
            return {
                voter: 'Scalper',
                vote: analysis.trend === 'uptrend' ? 'bullish' : 'bearish',
                confidence: 80,
                rationale: `Intraday momentum is ${analysis.momentum}.`,
                management_preference: 'scalp_only' // Scalpers naturally want to scalp
            };
        }

        return {
            voter: 'Scalper',
            vote: 'neutral',
            confidence: 50,
            rationale: "Intraday chop.",
            management_preference: 'no_trade'
        };
    }

    // --- Council Logic: Synthesizing the Decision ---
    private synthesizeDecision(votes: CouncilVote[]): CouncilDecision {
        const bullishVotes = votes.filter(v => v.vote === 'bullish').length;
        const bearishVotes = votes.filter(v => v.vote === 'bearish').length;

        let overallBias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (bullishVotes > bearishVotes) overallBias = 'bullish';
        else if (bearishVotes > bullishVotes) overallBias = 'bearish';

        // Calculate Grade based on Alignment
        let grade: 'A+' | 'B' | 'C' | 'No Trade' = 'C';
        let sizing = 1.0;
        let runnerMode = false;

        // A+ Setup: Complete Alignment (Unanimous)
        if (bullishVotes === 3 || bearishVotes === 3) {
            grade = 'A+';
            sizing = 2.0; // Double size
            runnerMode = true; // Hold for swing
        }
        // B Setup: Investor + Scalper Agree (Swing might be neutral/divergent)
        else if ((overallBias === 'bullish' && bullishVotes === 2) || (overallBias === 'bearish' && bearishVotes === 2)) {
            grade = 'B';
            sizing = 1.0;
            const swingVote = votes.find(v => v.voter === 'Swing');
            // If Swing agrees, use runners. If Swing disagrees, scalp only.
            runnerMode = swingVote?.vote === overallBias;
        }
        // C Setup: Scalper Alone (Fighting the Big Picture)
        else if (overallBias !== 'neutral') { // Only Scalper has conviction
            grade = 'C';
            sizing = 0.5; // Half size
            runnerMode = false; // Definitely scalp only
        } else {
            grade = 'No Trade';
            sizing = 0.0;
        }

        return {
            overall_bias: overallBias,
            trade_grade: grade,
            alignment_score: (bullishVotes === 3 || bearishVotes === 3) ? 100 : (Math.max(bullishVotes, bearishVotes) / 3 * 100),
            runner_mode: runnerMode,
            suggested_sizing_multiplier: sizing,
            rationale_summary: `Council Decision: ${grade} Grade. ${runnerMode ? 'RUNNER MODE ACTIVE.' : 'SCALP MODE ONLY.'} (Investor: ${votes[0].vote}, Swing: ${votes[1].vote}, Scalper: ${votes[2].vote})`,
            votes: votes
        };
    }
}

export const timeframeCouncil = new TimeframeCouncil();
