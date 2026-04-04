import { localDBService } from '../lib/services/local-db-service';

/**
 * Setup Local Database (Day 1)
 * Initializes the schema for the "Owned Power" Historical Library.
 */
async function setup() {
    console.log('🏛️  INITIALIZING LOCAL PREDATOR LIBRARY SCHEMA...\n');

    try {
        await localDBService.connect();

        // 1. Historical Bars Table (Price Action & VPA)
        await localDBService.query(`
            CREATE TABLE IF NOT EXISTS historical_bars (
                id SERIAL PRIMARY KEY,
                ticker TEXT NOT NULL,
                timeframe TEXT NOT NULL, -- '1m', '5m', '1d'
                timestamp TIMESTAMPTZ NOT NULL,
                open NUMERIC NOT NULL,
                high NUMERIC NOT NULL,
                low NUMERIC NOT NULL,
                close NUMERIC NOT NULL,
                volume NUMERIC NOT NULL,
                vwap NUMERIC,
                UNIQUE(ticker, timeframe, timestamp)
            );
        `);
        console.log('✅ Table: historical_bars');

        // 2. Option Chains Table (Premium & Flow)
        await localDBService.query(`
            CREATE TABLE IF NOT EXISTS option_chains (
                id SERIAL PRIMARY KEY,
                ticker TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                strike NUMERIC NOT NULL,
                expiration DATE NOT NULL,
                call_put TEXT NOT NULL,
                bid NUMERIC,
                ask NUMERIC,
                last NUMERIC,
                volume INTEGER,
                open_interest INTEGER,
                iv NUMERIC,
                delta NUMERIC,
                gamma NUMERIC,
                theta NUMERIC,
                vega NUMERIC,
                UNIQUE(ticker, timestamp, strike, expiration, call_put)
            );
        `);
        console.log('✅ Table: option_chains');

        // 3. Distilled Patterns Table (Wisdom Extraction)
        await localDBService.query(`
            CREATE TABLE IF NOT EXISTS distilled_patterns (
                id SERIAL PRIMARY KEY,
                pattern_type TEXT NOT NULL, -- 'SQUEEZE', 'GAP_REVERSAL', 'VOL_SPIKE'
                ticker TEXT NOT NULL,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                confidence_score NUMERIC,
                metrics JSONB, -- VPA results, $TICK extremes, etc.
                outcome_pnl NUMERIC, -- Learned from backtesting
                UNIQUE(pattern_type, ticker, start_time)
            );
        `);
        console.log('✅ Table: distilled_patterns\n');

        console.log('🏆 LOCAL LIBRARY SCHEMA READY FOR HARVEST.');
        process.exit(0);

    } catch (error) {
        console.error('❌ SETUP FAILED:', error);
        process.exit(1);
    }
}

setup();
