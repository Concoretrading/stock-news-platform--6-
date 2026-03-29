import { EventEmitter } from 'events';

// Event Types for the Trading System
export enum SystemEvent {
    // Market Data Events
    MARKET_DATA_UPDATE = 'MARKET_DATA_UPDATE',

    // Historical Analysis Events
    HISTORY_PATTERN_IDENTIFIED = 'HISTORY_PATTERN_IDENTIFIED',
    KNOWLEDGE_BASE_UPDATED = 'KNOWLEDGE_BASE_UPDATED',

    // Real-Time Analysis Events
    OPPORTUNITY_DETECTED = 'OPPORTUNITY_DETECTED',
    OPPORTUNITY_INVALIDATED = 'OPPORTUNITY_INVALIDATED',

    // Execution Events
    TRADE_SIGNAL_GENERATED = 'TRADE_SIGNAL_GENERATED',
    PSYCHOLOGY_CHECK_PASSED = 'PSYCHOLOGY_CHECK_PASSED',
    PSYCHOLOGY_CHECK_FAILED = 'PSYCHOLOGY_CHECK_FAILED',
    ORDER_SUBMITTED = 'ORDER_SUBMITTED',
    ORDER_FILLED = 'ORDER_FILLED',
    ORDER_REJECTED = 'ORDER_REJECTED',

    // Post-Trade Events
    TRADE_CLOSED = 'TRADE_CLOSED',
    REVIEW_COMPLETED = 'REVIEW_COMPLETED',
    FEEDBACK_LOOP_UPDATED = 'FEEDBACK_LOOP_UPDATED'
}

export interface SystemPayload {
    [SystemEvent.MARKET_DATA_UPDATE]: { ticker: string, price: number, timestamp: string, source: 'POLYGON' | 'THINKORSWIM' };
    [SystemEvent.HISTORY_PATTERN_IDENTIFIED]: { ticker: string, pattern: string, confidence: number, historicalSuccess: number };
    [SystemEvent.KNOWLEDGE_BASE_UPDATED]: { module: string, itemsLearned: number };

    [SystemEvent.OPPORTUNITY_DETECTED]: {
        opportunityId: string,
        ticker: string,
        type: string,
        timeframe: string,
        score: number
    };

    [SystemEvent.TRADE_SIGNAL_GENERATED]: {
        ticker: string,
        action: 'BUY' | 'SELL',
        type: 'MARKET' | 'LIMIT',
        price?: number,
        confidence: number,
        reasoning: string[]
    };

    [SystemEvent.PSYCHOLOGY_CHECK_PASSED]: {
        signalId: string,
        emotionalState: string,
        confidenceAdjustment: number
    };

    [SystemEvent.PSYCHOLOGY_CHECK_FAILED]: {
        signalId: string,
        emotionalState: string,
        confidenceAdjustment: number
    };

    [SystemEvent.ORDER_SUBMITTED]: {
        ticker: string,
        action: 'BUY' | 'SELL',
        type: 'MARKET' | 'LIMIT',
        confidence: number,
        reasoning: string[]
    };

    [SystemEvent.ORDER_REJECTED]: {
        ticker: string,
        reason: string,
        timestamp: string
    };

    [SystemEvent.ORDER_FILLED]: {
        orderId: string,
        ticker: string,
        price: number,
        size: number,
        timestamp: string
    };

    [SystemEvent.TRADE_CLOSED]: {
        tradeId: string,
        ticker: string,
        entryPrice: number,
        exitPrice: number,
        pnl: number,
        duration: number // seconds
    };

    [SystemEvent.REVIEW_COMPLETED]: {
        tradeId: string,
        rating: number, // 0-100
        lessonsLearned: string[],
        improvements: string[]
    };
}

class CommunicationHub extends EventEmitter {
    private static instance: CommunicationHub;
    private eventLog: Array<{ timestamp: string, event: string, payload: any }> = [];

    private constructor() {
        super();
        this.setMaxListeners(50); // Allow many managers to listen
    }

    public static getInstance(): CommunicationHub {
        if (!CommunicationHub.instance) {
            CommunicationHub.instance = new CommunicationHub();
        }
        return CommunicationHub.instance;
    }

    public emitEvent<K extends keyof SystemPayload>(event: K, payload: SystemPayload[K]) {
        const timestamp = new Date().toISOString();

        // Log for accountability
        this.eventLog.push({ timestamp, event, payload });
        console.log(`[CENTRAL_COMMAND] 📡 ${event} - ${JSON.stringify(payload).slice(0, 100)}...`);

        // Emit to listeners
        this.emit(event, payload);
    }

    public getRecentLogs(count: number = 20) {
        return this.eventLog.slice(-count);
    }

    public clearLogs() {
        this.eventLog = [];
    }
}

// Export the singleton instance
export const systemBus = CommunicationHub.getInstance();
