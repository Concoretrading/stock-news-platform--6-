-- Website Monitoring Tables for AI Data Collection
-- This tracks company websites and their content changes for AI event detection

-- Table to track which company websites we're monitoring
CREATE TABLE IF NOT EXISTS website_monitoring (
    id SERIAL PRIMARY KEY,
    stock_ticker VARCHAR(10) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_scan_at TIMESTAMP,
    last_content_hash VARCHAR(64), -- SHA-256 hash of last content
    scan_frequency_hours INTEGER DEFAULT 24, -- How often to scan
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id VARCHAR(255) NOT NULL,
    UNIQUE(stock_ticker)
);

-- Table to store website content snapshots
CREATE TABLE IF NOT EXISTS website_content_snapshots (
    id SERIAL PRIMARY KEY,
    website_monitoring_id INTEGER REFERENCES website_monitoring(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,
    raw_content TEXT,
    processed_content TEXT, -- Cleaned content for AI processing
    content_size_bytes INTEGER,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_changes BOOLEAN DEFAULT false,
    change_summary TEXT, -- Brief description of what changed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track website scanning history
CREATE TABLE IF NOT EXISTS website_scan_log (
    id SERIAL PRIMARY KEY,
    website_monitoring_id INTEGER REFERENCES website_monitoring(id) ON DELETE CASCADE,
    scan_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'no_changes'
    scan_duration_ms INTEGER,
    content_size_bytes INTEGER,
    error_message TEXT,
    scan_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_website_monitoring_stock_ticker ON website_monitoring(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_website_monitoring_active ON website_monitoring(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_website_monitoring_last_scan ON website_monitoring(last_scan_at);
CREATE INDEX IF NOT EXISTS idx_website_content_snapshots_monitoring_id ON website_content_snapshots(website_monitoring_id);
CREATE INDEX IF NOT EXISTS idx_website_content_snapshots_timestamp ON website_content_snapshots(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_website_scan_log_monitoring_id ON website_scan_log(website_monitoring_id);
CREATE INDEX IF NOT EXISTS idx_website_scan_log_status ON website_scan_log(scan_status);
CREATE INDEX IF NOT EXISTS idx_website_scan_log_timestamp ON website_scan_log(scan_timestamp);

-- Insert some sample website monitoring data
INSERT INTO website_monitoring (stock_ticker, company_name, website_url, created_by_user_id) VALUES
('AAPL', 'Apple Inc.', 'https://www.apple.com', 'admin'),
('TSLA', 'Tesla Inc.', 'https://www.tesla.com', 'admin'),
('NVDA', 'NVIDIA Corporation', 'https://www.nvidia.com', 'admin'),
('MSFT', 'Microsoft Corporation', 'https://www.microsoft.com', 'admin'),
('GOOGL', 'Alphabet Inc.', 'https://www.google.com', 'admin')
ON CONFLICT (stock_ticker) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_monitoring_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_website_monitoring_updated_at
    BEFORE UPDATE ON website_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION update_website_monitoring_updated_at();

-- Function to log website scan results
CREATE OR REPLACE FUNCTION log_website_scan(
    p_website_monitoring_id INTEGER,
    p_scan_status VARCHAR(50),
    p_scan_duration_ms INTEGER DEFAULT NULL,
    p_content_size_bytes INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO website_scan_log (
        website_monitoring_id,
        scan_status,
        scan_duration_ms,
        content_size_bytes,
        error_message
    ) VALUES (
        p_website_monitoring_id,
        p_scan_status,
        p_scan_duration_ms,
        p_content_size_bytes,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get websites that need scanning
CREATE OR REPLACE FUNCTION get_websites_needing_scan()
RETURNS TABLE (
    id INTEGER,
    stock_ticker VARCHAR(10),
    company_name VARCHAR(255),
    website_url VARCHAR(500),
    last_scan_at TIMESTAMP,
    scan_frequency_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.id,
        wm.stock_ticker,
        wm.company_name,
        wm.website_url,
        wm.last_scan_at,
        wm.scan_frequency_hours
    FROM website_monitoring wm
    WHERE wm.is_active = true
    AND (
        wm.last_scan_at IS NULL 
        OR wm.last_scan_at < (CURRENT_TIMESTAMP - INTERVAL '1 hour' * wm.scan_frequency_hours)
    )
    ORDER BY wm.last_scan_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE website_monitoring IS 'Tracks company websites being monitored for AI event detection';
COMMENT ON TABLE website_content_snapshots IS 'Stores snapshots of website content for change detection';
COMMENT ON TABLE website_scan_log IS 'Logs all website scanning attempts and results';
COMMENT ON FUNCTION get_websites_needing_scan() IS 'Returns websites that need to be scanned based on their frequency settings'; 