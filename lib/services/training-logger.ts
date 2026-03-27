
import fs from 'fs';
import path from 'path';

export interface TrainingLogEntry {
    ticker: string;
    timestamp: string;
    price_action: {
        price: number;
        volume: number;
        change_pct: number;
    };
    narrative_context: {
        sentiment: string;
        baton_phase: string;
        catalysts: string[];
        intel_score: number;
    };
    outcome?: {
        continuation_30m: number;
        continuation_EOD: number;
        success: boolean;
    };
}

export class TrainingLogger {
    private logPath: string;

    constructor() {
        this.logPath = path.join(process.cwd(), 'logs', 'training_data.jsonl');
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    public async logObservation(entry: TrainingLogEntry): Promise<void> {
        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(this.logPath, logLine);
        console.log(`📝 [TRAINING LOGGER] Logged observation for ${entry.ticker}`);
    }

    public async getRecentObservations(limit: number = 100): Promise<TrainingLogEntry[]> {
        if (!fs.existsSync(this.logPath)) return [];
        const content = fs.readFileSync(this.logPath, 'utf8');
        return content.trim().split('\n').slice(-limit).map(line => JSON.parse(line));
    }
}

export const trainingLogger = new TrainingLogger();
