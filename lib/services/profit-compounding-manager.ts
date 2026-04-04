// Profit Compounding Manager - Playing with House Money
// Takes half of each winning trade's profit and uses it as risk for the next setup

export interface TradeResult {
    trade_id: string;
    ticker: string;
    entry_date: string;
    exit_date: string;
    position_cost: number;
    exit_value: number;
    profit_loss: number;
    profit_loss_percentage: number;
    was_winner: boolean;
}

export interface CompoundingState {
    initial_account_balance: number;
    current_account_balance: number;
    total_profit_banked: number; // Half of all wins, saved
    house_money_available: number; // Half of all wins, available to risk
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    largest_win: number;
    largest_loss: number;
    current_streak: {
        type: 'WIN' | 'LOSS';
        count: number;
    };
}

export interface NextTradeRisk {
    base_risk: number; // Standard 2% of account
    house_money_bonus: number; // Half of last win
    total_risk_allowed: number; // Base + house money
    risk_source: 'OWN_MONEY' | 'HOUSE_MONEY' | 'MIXED';
    reasoning: string;
}

export class ProfitCompoundingManager {
    private state: CompoundingState;
    private tradeHistory: TradeResult[] = [];
    private baseRiskPercentage: number = 2; // 2% of account

    constructor(initialBalance: number) {
        this.state = {
            initial_account_balance: initialBalance,
            current_account_balance: initialBalance,
            total_profit_banked: 0,
            house_money_available: 0,
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0,
            largest_win: 0,
            largest_loss: 0,
            current_streak: {
                type: 'WIN',
                count: 0
            }
        };

        console.log('💰 INITIALIZING PROFIT COMPOUNDING MANAGER');
        console.log(`💵 Initial Balance: $${initialBalance.toLocaleString()}`);
        console.log(`📊 Base Risk: ${this.baseRiskPercentage}% per trade`);
        console.log(`🎯 Strategy: Half of each win → banked, half → next trade risk\n`);
    }

    /**
     * Record a trade result and update compounding state
     */
    recordTrade(trade: TradeResult): void {
        console.log(`\n📊 RECORDING TRADE: ${trade.ticker}`);
        console.log(`   Entry: $${trade.position_cost.toFixed(2)}`);
        console.log(`   Exit: $${trade.exit_value.toFixed(2)}`);
        console.log(`   P&L: ${trade.profit_loss > 0 ? '+' : ''}$${trade.profit_loss.toFixed(2)} (${trade.profit_loss_percentage > 0 ? '+' : ''}${trade.profit_loss_percentage.toFixed(1)}%)`);

        // Add to history
        this.tradeHistory.push(trade);

        // Update account balance
        this.state.current_account_balance += trade.profit_loss;

        // Update trade counts
        this.state.total_trades++;
        if (trade.was_winner) {
            this.state.winning_trades++;
            this.handleWinningTrade(trade);
        } else {
            this.state.losing_trades++;
            this.handleLosingTrade(trade);
        }

        // Update win rate
        this.state.win_rate = (this.state.winning_trades / this.state.total_trades) * 100;

        // Update largest win/loss
        if (trade.profit_loss > this.state.largest_win) {
            this.state.largest_win = trade.profit_loss;
        }
        if (trade.profit_loss < this.state.largest_loss) {
            this.state.largest_loss = trade.profit_loss;
        }

        // Update streak
        this.updateStreak(trade.was_winner);

        console.log(`\n   💰 Account Balance: $${this.state.current_account_balance.toLocaleString()}`);
        console.log(`   🏦 Profit Banked: $${this.state.total_profit_banked.toLocaleString()}`);
        console.log(`   🎰 House Money Available: $${this.state.house_money_available.toLocaleString()}`);
    }

    /**
     * Handle winning trade - split profit 50/50
     */
    private handleWinningTrade(trade: TradeResult): void {
        const profit = trade.profit_loss;
        const halfProfit = profit / 2;

        // Half goes to bank (saved)
        this.state.total_profit_banked += halfProfit;

        // Half goes to house money (available to risk)
        this.state.house_money_available += halfProfit;

        console.log(`\n   ✅ WINNER! Profit Split:`);
        console.log(`      💰 Banked (saved): $${halfProfit.toFixed(2)}`);
        console.log(`      🎰 House Money (risk): $${halfProfit.toFixed(2)}`);
    }

    /**
     * Handle losing trade - deduct from house money first if available
     */
    private handleLosingTrade(trade: TradeResult): void {
        const loss = Math.abs(trade.profit_loss);

        if (this.state.house_money_available >= loss) {
            // Loss covered entirely by house money
            this.state.house_money_available -= loss;
            console.log(`\n   ❌ LOSER - Covered by house money`);
            console.log(`      🎰 House Money Used: $${loss.toFixed(2)}`);
            console.log(`      💵 Your Money: $0 (protected!)`);
        } else if (this.state.house_money_available > 0) {
            // Loss partially covered by house money
            const houseMoneyCoverage = this.state.house_money_available;
            const yourMoneyCoverage = loss - houseMoneyCoverage;
            this.state.house_money_available = 0;

            console.log(`\n   ❌ LOSER - Partially covered by house money`);
            console.log(`      🎰 House Money Used: $${houseMoneyCoverage.toFixed(2)}`);
            console.log(`      💵 Your Money: $${yourMoneyCoverage.toFixed(2)}`);
        } else {
            // Loss from your own money
            console.log(`\n   ❌ LOSER - From your money`);
            console.log(`      💵 Your Money: $${loss.toFixed(2)}`);
        }
    }

    /**
     * Update win/loss streak
     */
    private updateStreak(wasWinner: boolean): void {
        const streakType = wasWinner ? 'WIN' : 'LOSS';

        if (this.state.current_streak.type === streakType) {
            this.state.current_streak.count++;
        } else {
            this.state.current_streak = {
                type: streakType,
                count: 1
            };
        }
    }

    /**
     * Calculate risk for next trade
     */
    calculateNextTradeRisk(): NextTradeRisk {
        // Base risk: 2% of current account balance
        const baseRisk = (this.baseRiskPercentage / 100) * this.state.current_account_balance;

        // House money bonus: all available house money
        const houseMoney = this.state.house_money_available;

        // Total risk allowed
        const totalRisk = baseRisk + houseMoney;

        // Determine risk source
        let riskSource: NextTradeRisk['risk_source'];
        let reasoning: string;

        if (houseMoney === 0) {
            riskSource = 'OWN_MONEY';
            reasoning = 'No house money available - using standard 2% risk';
        } else if (houseMoney >= baseRisk) {
            riskSource = 'HOUSE_MONEY';
            reasoning = `Playing with house money! Last win's profit covers this trade`;
        } else {
            riskSource = 'MIXED';
            reasoning = `Using ${this.baseRiskPercentage}% base risk + $${houseMoney.toFixed(2)} house money bonus`;
        }

        return {
            base_risk: baseRisk,
            house_money_bonus: houseMoney,
            total_risk_allowed: totalRisk,
            risk_source: riskSource,
            reasoning: reasoning
        };
    }

    /**
     * Get current compounding state
     */
    getState(): CompoundingState {
        return { ...this.state };
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): string {
        const totalPnL = this.state.current_account_balance - this.state.initial_account_balance;
        const totalReturn = ((totalPnL / this.state.initial_account_balance) * 100).toFixed(2);

        return `
📊 PERFORMANCE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Account Performance:
   Initial Balance: $${this.state.initial_account_balance.toLocaleString()}
   Current Balance: $${this.state.current_account_balance.toLocaleString()}
   Total P&L: ${totalPnL > 0 ? '+' : ''}$${totalPnL.toLocaleString()} (${totalReturn}%)

🏦 Profit Management:
   Banked (Saved): $${this.state.total_profit_banked.toLocaleString()}
   House Money Available: $${this.state.house_money_available.toLocaleString()}

📈 Trade Statistics:
   Total Trades: ${this.state.total_trades}
   Winners: ${this.state.winning_trades}
   Losers: ${this.state.losing_trades}
   Win Rate: ${this.state.win_rate.toFixed(1)}%
   Largest Win: $${this.state.largest_win.toFixed(2)}
   Largest Loss: $${this.state.largest_loss.toFixed(2)}
   Current Streak: ${this.state.current_streak.count} ${this.state.current_streak.type}${this.state.current_streak.count > 1 ? 'S' : ''}

🎯 Next Trade Risk:
   ${this.calculateNextTradeRisk().reasoning}
   Total Risk Allowed: $${this.calculateNextTradeRisk().total_risk_allowed.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim();
    }

    /**
     * Reset house money (e.g., after a big loss or at end of week)
     */
    resetHouseMoney(): void {
        console.log(`\n🔄 Resetting house money: $${this.state.house_money_available.toFixed(2)} → $0`);
        this.state.house_money_available = 0;
    }

    /**
     * Withdraw banked profits (take money off the table)
     */
    withdrawBankedProfits(amount: number): boolean {
        if (amount > this.state.total_profit_banked) {
            console.log(`❌ Cannot withdraw $${amount} - only $${this.state.total_profit_banked.toFixed(2)} banked`);
            return false;
        }

        this.state.total_profit_banked -= amount;
        this.state.current_account_balance -= amount;

        console.log(`\n💸 WITHDRAWAL: $${amount.toLocaleString()}`);
        console.log(`   Remaining Banked: $${this.state.total_profit_banked.toLocaleString()}`);
        console.log(`   Account Balance: $${this.state.current_account_balance.toLocaleString()}`);

        return true;
    }
}

// Example usage
export const profitCompoundingManager = new ProfitCompoundingManager(50000);
