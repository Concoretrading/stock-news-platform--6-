// Multi-Contract Position Manager - Dynamic Mission-Based Execution
// Manages multiple contracts with different objectives and scenario-based rules

export interface ContractMission {
    contract_id: string;
    mission_type: 'QUICK_PROFIT' | 'RUNNER' | 'HEDGE' | 'BREAKEVEN_PROTECTION' | 'SCALE_OUT';
    direction: 'CALL' | 'PUT';
    entry_price: number;
    quantity: number;
    target_profit_percentage?: number; // Optional target
    stop_loss_percentage?: number; // Optional stop
    mission_description: string;
    priority: number; // 1 = highest priority to close first
    status: 'ACTIVE' | 'CLOSED' | 'MODIFIED';
}

export interface PositionSetup {
    setup_id: string;
    ticker: string;
    entry_date: string;
    core_direction: 'BULLISH' | 'BEARISH';
    contracts: ContractMission[];
    initial_cost: number; // Total cost of all contracts
    current_pnl: number;
    scenario_rules: ScenarioRule[];
}

export interface ScenarioRule {
    scenario_name: string;
    trigger_conditions: {
        condition_type: 'PRICE_MOVE' | 'TIME_ELAPSED' | 'PROFIT_TARGET' | 'LOSS_THRESHOLD' | 'TECHNICAL_SIGNAL';
        threshold: number;
        current_value: number;
        triggered: boolean;
    }[];
    actions: {
        contract_id: string;
        action: 'CLOSE' | 'HOLD' | 'ADD_HEDGE' | 'SCALE_OUT_PARTIAL';
        reasoning: string;
    }[];
    scenario_status: 'ACTIVE' | 'TRIGGERED' | 'COMPLETED';
}

export interface ScenarioExecution {
    scenario_name: string;
    triggered_at: string;
    actions_taken: {
        contract_id: string;
        action: string;
        execution_price: number;
        pnl: number;
        reasoning: string;
    }[];
    remaining_contracts: ContractMission[];
    position_status: string;
}

export class MultiContractPositionManager {
    private activePositions: Map<string, PositionSetup> = new Map();

    constructor() {
        console.log('🎯 INITIALIZING MULTI-CONTRACT POSITION MANAGER');
        console.log('📊 Mission-based execution with scenario planning');
    }

    /**
     * Create a new position with multiple contracts
     */
    createPosition(
        ticker: string,
        coreDirection: 'BULLISH' | 'BEARISH',
        contracts: Omit<ContractMission, 'contract_id' | 'status'>[]
    ): PositionSetup {
        const setupId = `${ticker}_${Date.now()}`;

        // Assign contract IDs and status
        const fullContracts: ContractMission[] = contracts.map((c, i) => ({
            ...c,
            contract_id: `${setupId}_contract_${i + 1}`,
            status: 'ACTIVE'
        }));

        // Calculate initial cost
        const initialCost = fullContracts.reduce((sum, c) => sum + (c.entry_price * c.quantity), 0);

        // Generate scenario rules
        const scenarioRules = this.generateScenarioRules(fullContracts, coreDirection);

        const position: PositionSetup = {
            setup_id: setupId,
            ticker,
            entry_date: new Date().toISOString(),
            core_direction: coreDirection,
            contracts: fullContracts,
            initial_cost: initialCost,
            current_pnl: 0,
            scenario_rules: scenarioRules
        };

        this.activePositions.set(setupId, position);

        console.log(`\n🎯 POSITION CREATED: ${ticker}`);
        console.log(`📊 Direction: ${coreDirection}`);
        console.log(`💰 Initial Cost: $${initialCost.toFixed(2)}`);
        console.log(`📝 Contracts:`);
        fullContracts.forEach(c => {
            console.log(`   - ${c.direction} x${c.quantity}: ${c.mission_type} (Priority ${c.priority})`);
        });

        return position;
    }

    /**
     * Example: 3 Calls + 1 Put (Your Strategy)
     */
    createBullishRatioPosition(
        ticker: string,
        callEntryPrice: number,
        putEntryPrice: number
    ): PositionSetup {
        console.log(`\n🎯 Creating Bullish Ratio Position: 3 Calls + 1 Put`);

        return this.createPosition(ticker, 'BULLISH', [
            {
                mission_type: 'QUICK_PROFIT',
                direction: 'CALL',
                entry_price: callEntryPrice,
                quantity: 1,
                target_profit_percentage: 50, // Close at 50% profit
                mission_description: 'Quick profit to cover hedge cost or protect capital',
                priority: 1 // First to close
            },
            {
                mission_type: 'SCALE_OUT',
                direction: 'CALL',
                entry_price: callEntryPrice,
                quantity: 1,
                target_profit_percentage: 100, // Close at 100% profit
                mission_description: 'Scale out at key level, take profit on strength',
                priority: 2
            },
            {
                mission_type: 'RUNNER',
                direction: 'CALL',
                entry_price: callEntryPrice,
                quantity: 1,
                mission_description: 'Runner - hold until actual selling pressure or target',
                priority: 3 // Last to close
            },
            {
                mission_type: 'HEDGE',
                direction: 'PUT',
                entry_price: putEntryPrice,
                quantity: 1,
                mission_description: 'Hedge to cover losses if wrong, expected to lose or offset core position cost',
                priority: 4 // Hold as protection
            }
        ]);
    }

    /**
     * Update position with current market data and check scenarios
     */
    updatePosition(
        setupId: string,
        currentPrices: { callPrice: number; putPrice: number },
        marketConditions: {
            price_change_from_entry: number; // Percentage
            momentum: 'STRONG_UP' | 'WEAK_UP' | 'CONSOLIDATING' | 'WEAK_DOWN' | 'STRONG_DOWN';
            key_level_proximity: number; // Distance to key level, percentage
            internals_healthy: boolean;
            atr_coverage: number; // How much of ATR has been covered, 0-100%
        }
    ): ScenarioExecution | null {
        const position = this.activePositions.get(setupId);
        if (!position) return null;

        console.log(`\n🔄 Updating position: ${position.ticker}`);
        console.log(`📊 Price Change: ${marketConditions.price_change_from_entry > 0 ? '+' : ''}${marketConditions.price_change_from_entry.toFixed(2)}%`);
        console.log(`💪 Momentum: ${marketConditions.momentum}`);

        // Update current P&L
        position.current_pnl = this.calculateCurrentPnL(position, currentPrices);

        // Check which scenario is triggered
        const triggeredScenario = this.checkScenarios(position, marketConditions, currentPrices);

        if (triggeredScenario) {
            console.log(`\n🎯 SCENARIO TRIGGERED: ${triggeredScenario.scenario_name}`);
            return this.executeScenario(position, triggeredScenario, currentPrices);
        }

        return null;
    }

    /**
     * Generate scenario rules based on contracts
     */
    private generateScenarioRules(
        contracts: ContractMission[],
        coreDirection: 'BULLISH' | 'BEARISH'
    ): ScenarioRule[] {
        const rules: ScenarioRule[] = [];

        // Scenario 1: Goes Against Us (Immediate Weakness)
        rules.push({
            scenario_name: 'SCENARIO_1_AGAINST_US',
            trigger_conditions: [
                {
                    condition_type: 'PRICE_MOVE',
                    threshold: -3, // -3% from entry
                    current_value: 0,
                    triggered: false
                }
            ],
            actions: [
                {
                    contract_id: contracts.find(c => c.mission_type === 'QUICK_PROFIT')?.contract_id || '',
                    action: 'CLOSE',
                    reasoning: 'Cut 1 call to save capital, hold 2 calls + hedge for potential recovery'
                }
            ],
            scenario_status: 'ACTIVE'
        });

        // Scenario 2: Rip Off Then Pullback
        rules.push({
            scenario_name: 'SCENARIO_2_RIP_PULLBACK',
            trigger_conditions: [
                {
                    condition_type: 'PRICE_MOVE',
                    threshold: 5, // +5% quick move
                    current_value: 0,
                    triggered: false
                },
                {
                    condition_type: 'PROFIT_TARGET',
                    threshold: 50, // Quick profit contract at 50%
                    current_value: 0,
                    triggered: false
                }
            ],
            actions: [
                {
                    contract_id: contracts.find(c => c.mission_type === 'QUICK_PROFIT')?.contract_id || '',
                    action: 'CLOSE',
                    reasoning: 'Close 1 call after strong open to cover cost of others'
                },
                {
                    contract_id: contracts.find(c => c.mission_type === 'SCALE_OUT')?.contract_id || '',
                    action: 'HOLD',
                    reasoning: 'Hold for breakeven or small profit if pullback occurs'
                }
            ],
            scenario_status: 'ACTIVE'
        });

        // Scenario 3: Strong Rip Off (Best Case)
        rules.push({
            scenario_name: 'SCENARIO_3_STRONG_RIP',
            trigger_conditions: [
                {
                    condition_type: 'PRICE_MOVE',
                    threshold: 8, // +8% strong move
                    current_value: 0,
                    triggered: false
                },
                {
                    condition_type: 'PROFIT_TARGET',
                    threshold: 100, // Scale-out contract at 100%
                    current_value: 0,
                    triggered: false
                }
            ],
            actions: [
                {
                    contract_id: contracts.find(c => c.mission_type === 'QUICK_PROFIT')?.contract_id || '',
                    action: 'CLOSE',
                    reasoning: 'Close first call to cover cost of all others'
                },
                {
                    contract_id: contracts.find(c => c.mission_type === 'SCALE_OUT')?.contract_id || '',
                    action: 'CLOSE',
                    reasoning: 'Take profit on second call at key level'
                },
                {
                    contract_id: contracts.find(c => c.mission_type === 'RUNNER')?.contract_id || '',
                    action: 'HOLD',
                    reasoning: 'Let runner ride until selling pressure or target'
                },
                {
                    contract_id: contracts.find(c => c.mission_type === 'HEDGE')?.contract_id || '',
                    action: 'CLOSE',
                    reasoning: 'Close hedge (it lost, but that\'s expected in winning scenario)'
                }
            ],
            scenario_status: 'ACTIVE'
        });

        // Scenario 4: Consolidation Above Resistance (Add Position)
        rules.push({
            scenario_name: 'SCENARIO_4_CONSOLIDATION_STRENGTH',
            trigger_conditions: [
                {
                    condition_type: 'PRICE_MOVE',
                    threshold: 5, // +5% move
                    current_value: 0,
                    triggered: false
                },
                {
                    condition_type: 'TECHNICAL_SIGNAL',
                    threshold: 1, // Consolidating above resistance
                    current_value: 0,
                    triggered: false
                }
            ],
            actions: [
                {
                    contract_id: 'NEW_CALL_WITH_PROFITS',
                    action: 'SCALE_OUT_PARTIAL',
                    reasoning: 'Take profit on 1 call, add new position with profits + new hedge'
                },
                {
                    contract_id: 'NEW_HEDGE',
                    action: 'ADD_HEDGE',
                    reasoning: 'Add small hedge to protect new position'
                }
            ],
            scenario_status: 'ACTIVE'
        });

        return rules;
    }

    /**
     * Check if any scenario is triggered
     */
    private checkScenarios(
        position: PositionSetup,
        marketConditions: any,
        currentPrices: any
    ): ScenarioRule | null {
        for (const rule of position.scenario_rules) {
            if (rule.scenario_status !== 'ACTIVE') continue;

            // Update condition values
            rule.trigger_conditions.forEach(condition => {
                if (condition.condition_type === 'PRICE_MOVE') {
                    condition.current_value = marketConditions.price_change_from_entry;
                    condition.triggered = Math.abs(condition.current_value) >= Math.abs(condition.threshold);
                }
                // Add more condition types as needed
            });

            // Check if all conditions are met
            const allTriggered = rule.trigger_conditions.every(c => c.triggered);

            if (allTriggered) {
                rule.scenario_status = 'TRIGGERED';
                return rule;
            }
        }

        return null;
    }

    /**
     * Execute scenario actions
     */
    private executeScenario(
        position: PositionSetup,
        scenario: ScenarioRule,
        currentPrices: { callPrice: number; putPrice: number }
    ): ScenarioExecution {
        console.log(`\n⚡ EXECUTING SCENARIO: ${scenario.scenario_name}`);

        const actionsTaken: ScenarioExecution['actions_taken'] = [];

        scenario.actions.forEach(action => {
            const contract = position.contracts.find(c => c.contract_id === action.contract_id);

            if (!contract || contract.status !== 'ACTIVE') return;

            const executionPrice = contract.direction === 'CALL' ? currentPrices.callPrice : currentPrices.putPrice;
            const pnl = ((executionPrice - contract.entry_price) / contract.entry_price) * 100;

            if (action.action === 'CLOSE') {
                contract.status = 'CLOSED';
                console.log(`   ✅ CLOSED: ${contract.mission_type} ${contract.direction} at ${pnl > 0 ? '+' : ''}${pnl.toFixed(1)}%`);
            }

            actionsTaken.push({
                contract_id: contract.contract_id,
                action: action.action,
                execution_price: executionPrice,
                pnl,
                reasoning: action.reasoning
            });
        });

        scenario.scenario_status = 'COMPLETED';

        const remainingContracts = position.contracts.filter(c => c.status === 'ACTIVE');

        return {
            scenario_name: scenario.scenario_name,
            triggered_at: new Date().toISOString(),
            actions_taken: actionsTaken,
            remaining_contracts: remainingContracts,
            position_status: this.getPositionStatus(position)
        };
    }

    /**
     * Calculate current P&L
     */
    private calculateCurrentPnL(
        position: PositionSetup,
        currentPrices: { callPrice: number; putPrice: number }
    ): number {
        let totalPnL = 0;

        position.contracts.forEach(contract => {
            if (contract.status !== 'ACTIVE') return;

            const currentPrice = contract.direction === 'CALL' ? currentPrices.callPrice : currentPrices.putPrice;
            const contractPnL = (currentPrice - contract.entry_price) * contract.quantity;
            totalPnL += contractPnL;
        });

        return totalPnL;
    }

    /**
     * Get position status summary
     */
    private getPositionStatus(position: PositionSetup): string {
        const activeContracts = position.contracts.filter(c => c.status === 'ACTIVE');
        const closedContracts = position.contracts.filter(c => c.status === 'CLOSED');

        return `${activeContracts.length} active, ${closedContracts.length} closed | P&L: $${position.current_pnl.toFixed(2)}`;
    }

    /**
     * Get active position
     */
    getPosition(setupId: string): PositionSetup | undefined {
        return this.activePositions.get(setupId);
    }

    /**
     * Get all active positions
     */
    getAllPositions(): PositionSetup[] {
        return Array.from(this.activePositions.values());
    }
}

export const multiContractPositionManager = new MultiContractPositionManager();
