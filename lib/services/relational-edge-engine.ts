
/**
 * Relational Edge Engine (The Network)
 * Tracks inter-market dependencies and correlations between tickers.
 * Logic: "If NVDA rips, AMD follows. If bonds crash, tech fades."
 */

export interface CorrelationNode {
    ticker: string;
    sector: string;
    current_strength: number;
    connections: {
        target: string;
        correlation: number; // -1.0 to 1.0
        lead_lag_factor: number; // >1 means this node leads, <1 means it lags
    }[];
}

export class RelationalEdgeEngine {
    private graph: Map<string, CorrelationNode> = new Map();

    constructor() {
        console.log('🕸️ RELATIONAL EDGE ENGINE ONLINE');
        this.initializeBaseNetwork();
    }

    private initializeBaseNetwork() {
        // High-correlation clusters (Grok Upgrade)
        this.addNode('NVDA', 'SEMIS', 95, [
            { target: 'AMD', correlation: 0.85, lead_lag_factor: 1.2 },
            { target: 'SMCI', correlation: 0.75, lead_lag_factor: 1.1 },
            { target: 'TSM', correlation: 0.82, lead_lag_factor: 0.9 }
        ]);

        this.addNode('SPY', 'INDEX', 80, [
            { target: 'QQQ', correlation: 0.92, lead_lag_factor: 1.0 },
            { target: 'IWM', correlation: 0.65, lead_lag_factor: 0.8 }
        ]);

        this.addNode('TLT', 'BONDS', 60, [
            { target: 'QQQ', correlation: -0.72, lead_lag_factor: 1.1 } // Inverse correlation
        ]);
    }

    public addNode(ticker: string, sector: string, strength: number, connections: CorrelationNode['connections']) {
        this.graph.set(ticker, { ticker, sector, current_strength: strength, connections });
    }

    /**
     * Get the "Impact Network" for a ticker
     * Tells you what else should be moving and what is leading.
     */
    public analyzeImpact(ticker: string): {
        primary_drivers: string[],
        lagging_opportunities: string[],
        market_drag: string[]
    } {
        const node = this.graph.get(ticker);
        if (!node) return { primary_drivers: [], lagging_opportunities: [], market_drag: [] };

        const drivers: string[] = [];
        const laggards: string[] = [];
        const drag: string[] = [];

        node.connections.forEach(conn => {
            if (conn.correlation > 0.7 && conn.lead_lag_factor > 1.0) {
                drivers.push(conn.target);
            } else if (conn.correlation > 0.7 && conn.lead_lag_factor < 1.0) {
                laggards.push(conn.target);
            } else if (conn.correlation < -0.5) {
                drag.push(conn.target);
            }
        });

        return {
            primary_drivers: drivers,
            lagging_opportunities: laggards,
            market_drag: drag
        };
    }

    /**
     * Identify Sector Rotation Lead
     */
    public getSectorLeader(sector: string): string | null {
        const sectorNodes = Array.from(this.graph.values()).filter(n => n.sector === sector);
        if (sectorNodes.length === 0) return null;

        return sectorNodes.sort((a, b) => b.current_strength - a.current_strength)[0].ticker;
    }
}

export const relationalEdgeEngine = new RelationalEdgeEngine();
