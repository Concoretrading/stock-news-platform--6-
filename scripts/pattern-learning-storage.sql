-- PATTERN LEARNING STORAGE SCHEMA
-- Optimized for 3-stock focus with comprehensive historical analysis

-- Historical Price Data (Multi-timeframe OHLCV)
CREATE TABLE IF NOT EXISTS historical_prices (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    timeframe VARCHAR(5) NOT NULL, -- '1m', '5m', '15m', '1h', '1d'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(12,4) NOT NULL,
    high DECIMAL(12,4) NOT NULL,
    low DECIMAL(12,4) NOT NULL,
    close DECIMAL(12,4) NOT NULL,
    volume BIGINT NOT NULL,
    vwap DECIMAL(12,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, timeframe, timestamp)
);

-- Options Premium History (Core learning data)
CREATE TABLE IF NOT EXISTS options_premium_history (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    option_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    strike_price DECIMAL(10,2) NOT NULL,
    option_type VARCHAR(4) NOT NULL, -- 'CALL' or 'PUT'
    
    -- Pricing data
    bid DECIMAL(8,4),
    ask DECIMAL(8,4),
    last DECIMAL(8,4),
    mark DECIMAL(8,4),
    
    -- Greeks and IV
    delta DECIMAL(6,4),
    gamma DECIMAL(8,6),
    theta DECIMAL(8,6),
    vega DECIMAL(8,6),
    implied_volatility DECIMAL(6,4),
    
    -- Volume and Interest
    volume INTEGER DEFAULT 0,
    open_interest INTEGER DEFAULT 0,
    
    -- Market context
    underlying_price DECIMAL(12,4),
    days_to_expiration INTEGER,
    moneyness DECIMAL(6,4), -- strike/underlying
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, option_date, expiration_date, strike_price, option_type)
);

-- Squeeze Pattern Analysis (Multi-timeframe states)
CREATE TABLE IF NOT EXISTS squeeze_patterns (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL,
    timeframe VARCHAR(5) NOT NULL,
    
    -- Bollinger Band Squeeze
    bb_squeeze_active BOOLEAN NOT NULL,
    bb_squeeze_color VARCHAR(10), -- 'red', 'orange', 'yellow', 'green'
    bb_squeeze_intensity DECIMAL(4,2), -- 0-100
    
    -- Momentum
    momentum_direction VARCHAR(10), -- 'bullish', 'bearish', 'neutral'
    momentum_strength DECIMAL(4,2), -- 0-100
    momentum_histogram DECIMAL(8,4),
    
    -- Keltner Channels
    kc_upper DECIMAL(12,4),
    kc_lower DECIMAL(12,4),
    kc_middle DECIMAL(12,4),
    
    -- Bollinger Bands
    bb_upper DECIMAL(12,4),
    bb_lower DECIMAL(12,4),
    bb_middle DECIMAL(12,4),
    
    price_at_analysis DECIMAL(12,4),
    volume_at_analysis BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, analysis_date, timeframe)
);

-- Volume Pattern Analysis
CREATE TABLE IF NOT EXISTS volume_patterns (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL,
    timeframe VARCHAR(5) NOT NULL,
    
    -- Volume metrics
    current_volume BIGINT NOT NULL,
    avg_volume_5d BIGINT,
    avg_volume_20d BIGINT,
    avg_volume_50d BIGINT,
    
    -- Volume ratios
    volume_ratio_5d DECIMAL(6,2),
    volume_ratio_20d DECIMAL(6,2),
    volume_ratio_50d DECIMAL(6,2),
    
    -- Volume patterns
    volume_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable', 'spiking'
    volume_confirmation BOOLEAN,
    accumulation_phase BOOLEAN,
    distribution_phase BOOLEAN,
    
    -- Price context
    price_at_analysis DECIMAL(12,4),
    price_change_percent DECIMAL(6,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, analysis_date, timeframe)
);

-- Breakout Events (Learning outcomes)
CREATE TABLE IF NOT EXISTS breakout_events (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    
    -- Event timing
    breakout_date DATE NOT NULL,
    consolidation_start DATE NOT NULL,
    consolidation_end DATE NOT NULL,
    consolidation_duration INTEGER, -- days
    
    -- Breakout details
    breakout_type VARCHAR(20) NOT NULL, -- 'bullish_breakout', 'bearish_breakdown'
    breakout_price DECIMAL(12,4) NOT NULL,
    pre_breakout_price DECIMAL(12,4) NOT NULL,
    breakout_magnitude DECIMAL(6,2), -- percentage
    
    -- Pattern context
    squeeze_timeframes TEXT[], -- array of active timeframes
    volume_confirmation BOOLEAN,
    volume_ratio DECIMAL(6,2),
    
    -- Outcome tracking
    peak_price DECIMAL(12,4),
    peak_date DATE,
    max_move_percent DECIMAL(6,2),
    days_to_peak INTEGER,
    
    -- Pattern success
    pattern_success BOOLEAN,
    profit_target_hit BOOLEAN,
    stop_loss_hit BOOLEAN,
    
    -- Options outcomes (if applicable)
    best_option_strike DECIMAL(10,2),
    best_option_return DECIMAL(8,2),
    option_expiration_used DATE,
    
    -- Learning metadata
    confidence_score DECIMAL(4,1), -- 0-100
    pattern_category VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market Context Data
CREATE TABLE IF NOT EXISTS market_context_daily (
    id SERIAL PRIMARY KEY,
    context_date DATE NOT NULL UNIQUE,
    
    -- Market indices
    spy_close DECIMAL(8,2),
    spy_change_percent DECIMAL(6,2),
    qqq_close DECIMAL(8,2),
    qqq_change_percent DECIMAL(6,2),
    iwm_close DECIMAL(8,2),
    iwm_change_percent DECIMAL(6,2),
    
    -- Key ratios
    vix_spy_ratio DECIMAL(6,4),
    hyg_tlt_ratio DECIMAL(6,4),
    
    -- Sector rotation
    strongest_sector VARCHAR(10),
    weakest_sector VARCHAR(10),
    sector_rotation_intensity DECIMAL(4,2),
    
    -- Economic events
    economic_events_count INTEGER DEFAULT 0,
    high_impact_events INTEGER DEFAULT 0,
    
    -- Market sentiment
    market_sentiment VARCHAR(20), -- 'bullish', 'bearish', 'neutral', 'uncertain'
    sentiment_score DECIMAL(4,1), -- -100 to +100
    
    -- News impact
    major_news_events TEXT[],
    news_sentiment VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern Learning Results (AI insights)
CREATE TABLE IF NOT EXISTS pattern_learning_insights (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    learning_date DATE NOT NULL,
    
    -- Pattern identification
    pattern_name VARCHAR(100) NOT NULL,
    pattern_description TEXT,
    pattern_frequency INTEGER, -- how often this pattern occurs
    
    -- Success metrics
    success_rate DECIMAL(5,2), -- percentage
    avg_return DECIMAL(6,2), -- average return when pattern succeeds
    avg_hold_days DECIMAL(4,1), -- average holding period
    max_drawdown DECIMAL(6,2), -- worst case scenario
    
    -- Pattern components
    required_timeframes TEXT[], -- which timeframes must show squeeze
    min_consolidation_days INTEGER,
    max_consolidation_days INTEGER,
    min_volume_ratio DECIMAL(6,2),
    optimal_market_context JSONB, -- market conditions that improve success
    
    -- Options strategy
    optimal_strike_offset DECIMAL(6,2), -- % from current price
    optimal_expiration_days INTEGER,
    optimal_position_size DECIMAL(4,2), -- % of portfolio
    
    -- Risk management
    stop_loss_percent DECIMAL(4,2),
    profit_target_percent DECIMAL(6,2),
    max_hold_days INTEGER,
    
    -- Confidence and validation
    confidence_level VARCHAR(10), -- 'HIGH', 'MEDIUM', 'LOW'
    sample_size INTEGER, -- number of historical examples
    validation_score DECIMAL(4,1), -- out-of-sample testing score
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_prices_ticker_timeframe ON historical_prices(ticker, timeframe, timestamp);
CREATE INDEX IF NOT EXISTS idx_options_premium_ticker_date ON options_premium_history(ticker, option_date);
CREATE INDEX IF NOT EXISTS idx_options_premium_expiration ON options_premium_history(expiration_date, strike_price);
CREATE INDEX IF NOT EXISTS idx_squeeze_patterns_ticker_date ON squeeze_patterns(ticker, analysis_date);
CREATE INDEX IF NOT EXISTS idx_volume_patterns_ticker_date ON volume_patterns(ticker, analysis_date);
CREATE INDEX IF NOT EXISTS idx_breakout_events_ticker_date ON breakout_events(ticker, breakout_date);
CREATE INDEX IF NOT EXISTS idx_market_context_date ON market_context_daily(context_date);
CREATE INDEX IF NOT EXISTS idx_pattern_insights_ticker ON pattern_learning_insights(ticker, learning_date);

-- Functions for data analysis
CREATE OR REPLACE FUNCTION get_pattern_success_rate(
    p_ticker VARCHAR(10),
    p_pattern_name VARCHAR(100)
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    success_rate DECIMAL(5,2);
BEGIN
    SELECT 
        ROUND(
            (COUNT(*) FILTER (WHERE pattern_success = true) * 100.0 / COUNT(*)), 
            2
        )
    INTO success_rate
    FROM breakout_events
    WHERE ticker = p_ticker 
    AND pattern_category = p_pattern_name;
    
    RETURN COALESCE(success_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get current squeeze states across timeframes
CREATE OR REPLACE FUNCTION get_current_squeeze_state(
    p_ticker VARCHAR(10)
)
RETURNS TABLE (
    timeframe VARCHAR(5),
    squeeze_active BOOLEAN,
    squeeze_color VARCHAR(10),
    momentum_direction VARCHAR(10),
    momentum_strength DECIMAL(4,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.timeframe,
        sp.bb_squeeze_active,
        sp.bb_squeeze_color,
        sp.momentum_direction,
        sp.momentum_strength
    FROM squeeze_patterns sp
    WHERE sp.ticker = p_ticker
    AND sp.analysis_date = (
        SELECT MAX(analysis_date) 
        FROM squeeze_patterns 
        WHERE ticker = p_ticker
    )
    ORDER BY 
        CASE sp.timeframe 
            WHEN '1m' THEN 1
            WHEN '5m' THEN 2  
            WHEN '15m' THEN 3
            WHEN '1h' THEN 4
            WHEN '1d' THEN 5
        END;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE historical_prices IS 'Multi-timeframe OHLCV data for pattern analysis';
COMMENT ON TABLE options_premium_history IS 'Historical options pricing for premium pattern learning';
COMMENT ON TABLE squeeze_patterns IS 'Bollinger Band squeeze states across timeframes';
COMMENT ON TABLE volume_patterns IS 'Volume analysis and confirmation patterns';
COMMENT ON TABLE breakout_events IS 'Historical breakout events with outcomes for learning';
COMMENT ON TABLE market_context_daily IS 'Daily market conditions and sentiment';
COMMENT ON TABLE pattern_learning_insights IS 'AI-derived pattern insights and strategies'; 