-- Earnings Calendar Tables
-- This manages earnings calendar data with automatic updates from Alpaca API

-- Table to store earnings calendar data
CREATE TABLE IF NOT EXISTS earnings_calendar (
    id SERIAL PRIMARY KEY,
    stock_ticker VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    earnings_date TIMESTAMP NOT NULL,
    earnings_type VARCHAR(50) DEFAULT 'After Close', -- 'Before Open', 'After Close', 'Pre-Market'
    is_confirmed BOOLEAN DEFAULT true,
    estimated_eps DECIMAL(10,2),
    estimated_revenue DECIMAL(15,2),
    previous_eps DECIMAL(10,2),
    previous_revenue DECIMAL(15,2),
    conference_call_url VARCHAR(500),
    notes TEXT,
    source VARCHAR(50) DEFAULT 'alpaca_api', -- 'alpaca_api', 'manual', 'other'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_ticker, earnings_date)
);

-- Table to track earnings updates and sync history
CREATE TABLE IF NOT EXISTS earnings_sync_log (
    id SERIAL PRIMARY KEY,
    sync_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    error_message TEXT,
    source_api VARCHAR(50) DEFAULT 'alpaca',
    sync_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store earnings alerts and notifications
CREATE TABLE IF NOT EXISTS earnings_alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stock_ticker VARCHAR(10) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'earnings_reminder', 'pre_earnings', 'post_earnings'
    alert_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_stock_ticker ON earnings_calendar(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON earnings_calendar(earnings_date);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_confirmed ON earnings_calendar(is_confirmed) WHERE is_confirmed = true;
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_source ON earnings_calendar(source);
CREATE INDEX IF NOT EXISTS idx_earnings_sync_log_timestamp ON earnings_sync_log(sync_timestamp);
CREATE INDEX IF NOT EXISTS idx_earnings_sync_log_status ON earnings_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_earnings_alerts_user_id ON earnings_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_alerts_stock_ticker ON earnings_alerts(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_alerts_active ON earnings_alerts(is_active) WHERE is_active = true;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_earnings_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_earnings_calendar_updated_at
    BEFORE UPDATE ON earnings_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_earnings_calendar_updated_at();

-- Function to log earnings sync results
CREATE OR REPLACE FUNCTION log_earnings_sync(
    p_sync_status VARCHAR(50),
    p_records_added INTEGER DEFAULT 0,
    p_records_updated INTEGER DEFAULT 0,
    p_records_failed INTEGER DEFAULT 0,
    p_total_records INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL,
    p_source_api VARCHAR(50) DEFAULT 'alpaca',
    p_sync_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO earnings_sync_log (
        sync_status,
        records_added,
        records_updated,
        records_failed,
        total_records,
        error_message,
        source_api,
        sync_duration_ms
    ) VALUES (
        p_sync_status,
        p_records_added,
        p_records_updated,
        p_records_failed,
        p_total_records,
        p_error_message,
        p_source_api,
        p_sync_duration_ms
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming earnings
CREATE OR REPLACE FUNCTION get_upcoming_earnings(
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    id INTEGER,
    stock_ticker VARCHAR(10),
    company_name VARCHAR(255),
    earnings_date TIMESTAMP,
    earnings_type VARCHAR(50),
    is_confirmed BOOLEAN,
    estimated_eps DECIMAL(10,2),
    estimated_revenue DECIMAL(15,2),
    days_until_earnings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.stock_ticker,
        ec.company_name,
        ec.earnings_date,
        ec.earnings_type,
        ec.is_confirmed,
        ec.estimated_eps,
        ec.estimated_revenue,
        EXTRACT(DAY FROM (ec.earnings_date - CURRENT_TIMESTAMP))::INTEGER as days_until_earnings
    FROM earnings_calendar ec
    WHERE ec.earnings_date >= CURRENT_TIMESTAMP
    AND ec.earnings_date <= CURRENT_TIMESTAMP + INTERVAL '1 day' * p_days_ahead
    AND ec.is_confirmed = true
    ORDER BY ec.earnings_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get earnings for a specific stock
CREATE OR REPLACE FUNCTION get_stock_earnings(
    p_stock_ticker VARCHAR(10),
    p_months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
    id INTEGER,
    stock_ticker VARCHAR(10),
    company_name VARCHAR(255),
    earnings_date TIMESTAMP,
    earnings_type VARCHAR(50),
    is_confirmed BOOLEAN,
    estimated_eps DECIMAL(10,2),
    actual_eps DECIMAL(10,2),
    estimated_revenue DECIMAL(15,2),
    actual_revenue DECIMAL(15,2),
    eps_surprise DECIMAL(10,2),
    revenue_surprise DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.stock_ticker,
        ec.company_name,
        ec.earnings_date,
        ec.earnings_type,
        ec.is_confirmed,
        ec.estimated_eps,
        ec.previous_eps as actual_eps,
        ec.estimated_revenue,
        ec.previous_revenue as actual_revenue,
        (ec.previous_eps - ec.estimated_eps) as eps_surprise,
        (ec.previous_revenue - ec.estimated_revenue) as revenue_surprise
    FROM earnings_calendar ec
    WHERE ec.stock_ticker = UPPER(p_stock_ticker)
    AND ec.earnings_date >= CURRENT_TIMESTAMP - INTERVAL '1 month' * p_months_back
    ORDER BY ec.earnings_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample earnings data
INSERT INTO earnings_calendar (stock_ticker, company_name, earnings_date, earnings_type, is_confirmed, estimated_eps, estimated_revenue, previous_eps, previous_revenue, conference_call_url, notes, source) VALUES
('AAPL', 'Apple Inc.', '2024-01-25 16:00:00', 'After Close', true, 2.10, 118.5, 1.46, 89.5, 'https://investor.apple.com/earnings-call/', 'Q1 2024 earnings call', 'alpaca_api'),
('TSLA', 'Tesla Inc.', '2024-01-24 16:00:00', 'After Close', true, 0.73, 25.6, 0.66, 23.4, 'https://ir.tesla.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api'),
('MSFT', 'Microsoft Corporation', '2024-01-30 16:00:00', 'After Close', true, 2.78, 61.1, 2.99, 56.5, 'https://investor.microsoft.com/earnings-call/', 'Q2 2024 earnings call', 'alpaca_api'),
('GOOGL', 'Alphabet Inc.', '2024-01-30 16:00:00', 'After Close', true, 1.60, 85.3, 1.55, 76.7, 'https://investor.google.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api'),
('AMZN', 'Amazon.com Inc.', '2024-02-01 16:00:00', 'After Close', true, 0.80, 166.2, 0.94, 143.1, 'https://ir.amazon.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api'),
('NVDA', 'NVIDIA Corporation', '2024-02-21 16:00:00', 'After Close', true, 4.59, 20.4, 4.02, 18.1, 'https://investor.nvidia.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api'),
('META', 'Meta Platforms Inc.', '2024-02-01 16:00:00', 'After Close', true, 4.82, 39.2, 4.39, 34.1, 'https://investor.fb.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api'),
('NFLX', 'Netflix Inc.', '2024-01-23 16:00:00', 'After Close', true, 2.15, 8.7, 3.73, 8.5, 'https://ir.netflix.com/earnings-call/', 'Q4 2023 earnings call', 'alpaca_api')
ON CONFLICT (stock_ticker, earnings_date) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE earnings_calendar IS 'Stores earnings calendar data with automatic updates from Alpaca API';
COMMENT ON TABLE earnings_sync_log IS 'Tracks earnings calendar sync operations and results';
COMMENT ON TABLE earnings_alerts IS 'Stores user alerts for earnings events';
COMMENT ON FUNCTION get_upcoming_earnings() IS 'Returns upcoming earnings within specified days';
COMMENT ON FUNCTION get_stock_earnings() IS 'Returns earnings history for a specific stock'; 