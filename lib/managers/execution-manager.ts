import { systemBus, SystemEvent } from '../central-command/communication-hub';

// Mock Agents
interface PsychologyAgent {
    checkEmotionalState(): Promise<{ state: string, isStable: boolean }>;
}

interface StrategyAgent {
    validateSignal(opportunity: any): Promise<{ approved: boolean, confidence: number }>;
}

export class ExecutionManager {
    private psychologyAgent: PsychologyAgent;
    private strategyAgent: StrategyAgent;

    constructor() {
        console.log('[EXECUTION_MANAGER] 🦅 Initializing (Elite Psychology Mode)...');

        // Initialize Agents
        this.psychologyAgent = {
            checkEmotionalState: async () => ({ state: 'FOCUSED', isStable: true })
        };
        this.strategyAgent = {
            validateSignal: async (opp) => ({ approved: true, confidence: 92 })
        };

        this.setupListeners();
    }

    private setupListeners() {
        systemBus.on(SystemEvent.OPPORTUNITY_DETECTED, this.evaluateOpportunity.bind(this));
    }

    private async evaluateOpportunity(payload: any) {
        console.log(`[EXECUTION_MANAGER] 🤔 Evaluating Opportunity: ${payload.ticker}`);

        // 1. PSYCHOLOGY CHECK FIRST (The "Gatekeeper")
        const psychology = await this.psychologyAgent.checkEmotionalState();

        if (!psychology.isStable) {
            console.log('[EXECUTION_MANAGER] 🛑 BLOCKED by Psychology Agent: Unstable State');
            systemBus.emitEvent(SystemEvent.PSYCHOLOGY_CHECK_FAILED, {
                signalId: payload.opportunityId,
                emotionalState: psychology.state,
                confidenceAdjustment: 0
            });
            return;
        }

        systemBus.emitEvent(SystemEvent.PSYCHOLOGY_CHECK_PASSED, {
            signalId: payload.opportunityId,
            emotionalState: psychology.state,
            confidenceAdjustment: 1.0
        });

        // 2. STRATEGY VALIDATION
        const validation = await this.strategyAgent.validateSignal(payload);

        if (validation.approved && validation.confidence > 85) {
            console.log('[EXECUTION_MANAGER] ✅ ELITE TRADE APPROVED. Executing...');

            // Simulate Order Execution
            const orderId = `ORD-${Date.now()}`;

            systemBus.emitEvent(SystemEvent.ORDER_SUBMITTED, {
                ticker: payload.ticker,
                action: 'BUY',
                type: 'LIMIT',
                confidence: validation.confidence,
                reasoning: ['High Momentum', 'Psychology Stable', 'Flow Aligned']
            });

            // Simulate Fill (in real system, this comes from Broker API)
            setTimeout(() => {
                systemBus.emitEvent(SystemEvent.ORDER_FILLED, {
                    orderId,
                    ticker: payload.ticker,
                    price: 150.00, // Mock price
                    size: 100,
                    timestamp: new Date().toISOString()
                });
            }, 500);
        }
    }
}

export const executionManager = new ExecutionManager();
