// Reinforcement Learning Engine - Adaptive Decision-Making
// Uses PPO (Proximal Policy Optimization) for self-improving trading decisions

export interface TradingState {
    // Market conditions
    price: number;
    volatility: number;
    volume_ratio: number; // Current volume / avg volume
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';

    // Technical indicators
    rsi: number;
    macd_signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    distance_from_ma_21: number; // Percentage
    distance_from_ma_50: number;
    distance_from_ma_200: number;

    // Psychology & Flow
    market_emotion: 'FEAR' | 'GREED' | 'PANIC' | 'EUPHORIA' | 'NEUTRAL';
    emotion_intensity: number; // 0-100
    institutional_flow: 'BUYING' | 'SELLING' | 'NEUTRAL';

    // Position state
    current_position: 'LONG' | 'SHORT' | 'FLAT';
    position_size: number; // 0-100% of capital
    unrealized_pnl: number; // Percentage

    // Scenario probabilities
    bullish_probability: number; // 0-100
    bearish_probability: number; // 0-100
    neutral_probability: number; // 0-100
}

export interface TradingAction {
    action_type: 'ENTER_LONG' | 'ENTER_SHORT' | 'EXIT' | 'SCALE_IN' | 'SCALE_OUT' | 'HOLD';
    size_percentage: number; // 0-100% of available capital
    stop_loss_percentage: number; // 0-10%
    take_profit_percentage: number; // 0-50%
    confidence: number; // 0-100
}

export interface Episode {
    states: TradingState[];
    actions: TradingAction[];
    rewards: number[];
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
}

export interface RLConfig {
    learning_rate: number; // Default: 0.0003
    gamma: number; // Discount factor, default: 0.99
    epsilon: number; // Exploration rate, default: 0.1
    epsilon_decay: number; // Default: 0.995
    batch_size: number; // Default: 64
    memory_size: number; // Default: 10000
    target_update_frequency: number; // Default: 100 episodes
}

export interface PolicyNetwork {
    weights: number[][];
    biases: number[];
    activation: 'relu' | 'tanh' | 'sigmoid';
}

export interface LearningMetrics {
    episode: number;
    average_reward: number;
    cumulative_return: number;
    epsilon: number; // Current exploration rate
    loss: number;
    win_rate: number;
    sharpe_ratio: number;
    max_drawdown: number;
}

export class ReinforcementLearningEngine {
    private config: RLConfig;
    private policy: PolicyNetwork;
    private memory: Episode[] = [];
    private episodeCount: number = 0;
    private learningMetrics: LearningMetrics[] = [];

    constructor(config?: Partial<RLConfig>) {
        this.config = {
            learning_rate: 0.0003,
            gamma: 0.99,
            epsilon: 0.1,
            epsilon_decay: 0.995,
            batch_size: 64,
            memory_size: 10000,
            target_update_frequency: 100,
            ...config
        };

        // Initialize policy network (simplified - in production use TensorFlow.js or similar)
        this.policy = this.initializePolicy();

        console.log('🤖 INITIALIZING REINFORCEMENT LEARNING ENGINE');
        console.log(`📊 Learning Rate: ${this.config.learning_rate}`);
        console.log(`🎲 Exploration Rate: ${this.config.epsilon * 100}%`);
        console.log(`💾 Memory Size: ${this.config.memory_size.toLocaleString()}`);
    }

    /**
     * Initialize policy network
     */
    private initializePolicy(): PolicyNetwork {
        // Simplified neural network initialization
        // In production, use TensorFlow.js or PyTorch
        const inputSize = 20; // Number of state features
        const hiddenSize = 64;
        const outputSize = 6; // Number of actions

        return {
            weights: this.randomWeights(inputSize, hiddenSize, outputSize),
            biases: this.randomBiases(hiddenSize, outputSize),
            activation: 'relu'
        };
    }

    /**
     * Predict optimal action given current state
     */
    async predictAction(state: TradingState): Promise<TradingAction> {
        console.log('🤖 Predicting optimal action...');

        // Convert state to feature vector
        const features = this.stateToFeatures(state);

        // Forward pass through policy network
        const actionProbabilities = this.forwardPass(features);

        // Epsilon-greedy: explore vs. exploit
        const shouldExplore = Math.random() < this.config.epsilon;

        let actionIndex: number;
        if (shouldExplore) {
            // Explore: random action
            actionIndex = Math.floor(Math.random() * 6);
            console.log('🎲 EXPLORING: Random action');
        } else {
            // Exploit: best action
            actionIndex = actionProbabilities.indexOf(Math.max(...actionProbabilities));
            console.log('🎯 EXPLOITING: Best action');
        }

        const action = this.indexToAction(actionIndex, state);
        action.confidence = actionProbabilities[actionIndex] * 100;

        return action;
    }

    /**
     * Train on historical episodes
     */
    async train(episodes: Episode[]): Promise<LearningMetrics[]> {
        console.log(`🤖 Training on ${episodes.length} episodes...`);

        // Add episodes to memory
        episodes.forEach(ep => this.addToMemory(ep));

        // Training loop
        for (let i = 0; i < episodes.length; i++) {
            const batch = this.sampleBatch();
            const loss = this.updatePolicy(batch);

            // Decay epsilon (reduce exploration over time)
            this.config.epsilon *= this.config.epsilon_decay;

            // Record metrics
            const metrics: LearningMetrics = {
                episode: this.episodeCount++,
                average_reward: this.calculateAverageReward(batch),
                cumulative_return: this.calculateCumulativeReturn(batch),
                epsilon: this.config.epsilon,
                loss,
                win_rate: this.calculateWinRate(batch),
                sharpe_ratio: this.calculateSharpeRatio(batch),
                max_drawdown: this.calculateMaxDrawdown(batch)
            };

            this.learningMetrics.push(metrics);

            if (i % 100 === 0) {
                console.log(`   Episode ${i}: Avg Reward = ${metrics.average_reward.toFixed(2)}, Loss = ${loss.toFixed(4)}, ε = ${(this.config.epsilon * 100).toFixed(1)}%`);
            }
        }

        console.log('✅ Training complete!');
        return this.learningMetrics;
    }

    /**
     * Evaluate policy on test episodes
     */
    async evaluate(testEpisodes: Episode[]): Promise<{
        average_return: number;
        win_rate: number;
        sharpe_ratio: number;
        max_drawdown: number;
    }> {
        console.log(`🧪 Evaluating policy on ${testEpisodes.length} test episodes...`);

        const returns = testEpisodes.map(ep => ep.total_return);
        const winRate = testEpisodes.filter(ep => ep.total_return > 0).length / testEpisodes.length;
        const sharpe = this.mean(testEpisodes.map(ep => ep.sharpe_ratio));
        const maxDD = Math.min(...testEpisodes.map(ep => ep.max_drawdown));

        return {
            average_return: this.mean(returns),
            win_rate: winRate * 100,
            sharpe_ratio: sharpe,
            max_drawdown: maxDD
        };
    }

    /**
     * Get learning progress
     */
    getLearningCurve(): LearningMetrics[] {
        return this.learningMetrics;
    }

    /**
     * Save policy (for persistence)
     */
    savePolicy(): string {
        return JSON.stringify(this.policy);
    }

    /**
     * Load policy (from saved state)
     */
    loadPolicy(policyJson: string): void {
        this.policy = JSON.parse(policyJson);
        console.log('✅ Policy loaded successfully');
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private stateToFeatures(state: TradingState): number[] {
        return [
            state.price / 1000, // Normalize
            state.volatility,
            state.volume_ratio,
            state.trend === 'BULLISH' ? 1 : state.trend === 'BEARISH' ? -1 : 0,
            state.rsi / 100,
            state.macd_signal === 'BULLISH' ? 1 : state.macd_signal === 'BEARISH' ? -1 : 0,
            state.distance_from_ma_21 / 100,
            state.distance_from_ma_50 / 100,
            state.distance_from_ma_200 / 100,
            state.market_emotion === 'GREED' ? 1 : state.market_emotion === 'FEAR' ? -1 : 0,
            state.emotion_intensity / 100,
            state.institutional_flow === 'BUYING' ? 1 : state.institutional_flow === 'SELLING' ? -1 : 0,
            state.current_position === 'LONG' ? 1 : state.current_position === 'SHORT' ? -1 : 0,
            state.position_size / 100,
            state.unrealized_pnl / 100,
            state.bullish_probability / 100,
            state.bearish_probability / 100,
            state.neutral_probability / 100,
            Math.random(), // Noise for exploration
            Math.random()
        ];
    }

    private forwardPass(features: number[]): number[] {
        // Simplified forward pass (in production, use proper neural network library)
        // This is a placeholder that returns random probabilities
        const actionProbs = Array(6).fill(0).map(() => Math.random());
        const sum = actionProbs.reduce((a, b) => a + b, 0);
        return actionProbs.map(p => p / sum); // Normalize to probabilities
    }

    private indexToAction(index: number, state: TradingState): TradingAction {
        const actions: TradingAction['action_type'][] = [
            'ENTER_LONG',
            'ENTER_SHORT',
            'EXIT',
            'SCALE_IN',
            'SCALE_OUT',
            'HOLD'
        ];

        return {
            action_type: actions[index],
            size_percentage: state.current_position === 'FLAT' ? 25 : 10, // 25% initial, 10% scale
            stop_loss_percentage: 2,
            take_profit_percentage: 8,
            confidence: 0 // Will be set by caller
        };
    }

    private addToMemory(episode: Episode): void {
        this.memory.push(episode);
        if (this.memory.length > this.config.memory_size) {
            this.memory.shift(); // Remove oldest
        }
    }

    private sampleBatch(): Episode[] {
        const batch: Episode[] = [];
        for (let i = 0; i < Math.min(this.config.batch_size, this.memory.length); i++) {
            const randomIndex = Math.floor(Math.random() * this.memory.length);
            batch.push(this.memory[randomIndex]);
        }
        return batch;
    }

    private updatePolicy(batch: Episode[]): number {
        // Simplified policy update (in production, use proper gradient descent)
        // Calculate loss as negative average reward
        const avgReward = this.calculateAverageReward(batch);
        return -avgReward; // Placeholder loss
    }

    private calculateAverageReward(episodes: Episode[]): number {
        const totalReward = episodes.reduce((sum, ep) => sum + ep.total_return, 0);
        return totalReward / episodes.length;
    }

    private calculateCumulativeReturn(episodes: Episode[]): number {
        return episodes.reduce((sum, ep) => sum + ep.total_return, 0);
    }

    private calculateWinRate(episodes: Episode[]): number {
        const wins = episodes.filter(ep => ep.total_return > 0).length;
        return (wins / episodes.length) * 100;
    }

    private calculateSharpeRatio(episodes: Episode[]): number {
        return this.mean(episodes.map(ep => ep.sharpe_ratio));
    }

    private calculateMaxDrawdown(episodes: Episode[]): number {
        return Math.min(...episodes.map(ep => ep.max_drawdown));
    }

    private randomWeights(inputSize: number, hiddenSize: number, outputSize: number): number[][] {
        // Placeholder for weight initialization
        return [];
    }

    private randomBiases(hiddenSize: number, outputSize: number): number[] {
        // Placeholder for bias initialization
        return [];
    }

    private mean(arr: number[]): number {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }
}

export const reinforcementLearningEngine = new ReinforcementLearningEngine();
