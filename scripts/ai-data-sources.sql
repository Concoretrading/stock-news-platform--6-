-- AI Data Sources and Processing Pipeline
-- This extends the AI calendar events with multiple data sources

-- Create data sources table for tracking reliable sources
CREATE TABLE IF NOT EXISTS ai_data_sources (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('company_website', 'twitter_handle', 'earnings_calendar', 'sec_filing', 'press_release', 'analyst_report')),
  source_name VARCHAR(255) NOT NULL,
  source_url TEXT,
  source_identifier VARCHAR(255), -- e.g., Twitter handle, RSS feed URL
  is_active BOOLEAN DEFAULT TRUE,
  reliability_score DECIMAL(3,2) DEFAULT 0.8 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  last_checked TIMESTAMP WITH TIME ZONE,
  check_frequency_minutes INTEGER DEFAULT 60, -- How often to check this source
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content processing queue for AI analysis
CREATE TABLE IF NOT EXISTS ai_content_queue (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  source_id INTEGER REFERENCES ai_data_sources(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('screenshot', 'twitter_tweet', 'website_content', 'earnings_transcript', 'press_release', 'sec_filing')),
  raw_content TEXT,
  processed_content TEXT,
  source_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'no_events_found')),
  ai_analysis JSONB, -- Detailed AI analysis results
  confidence_score DECIMAL(3,2),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create earnings calendar integration
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  earnings_date DATE NOT NULL,
  earnings_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  call_type VARCHAR(20) CHECK (call_type IN ('before_market', 'after_market')),
  call_url TEXT,
  webcast_url TEXT,
  transcript_url TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Twitter monitoring for specific handles
CREATE TABLE IF NOT EXISTS twitter_monitoring (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  twitter_handle VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  is_official BOOLEAN DEFAULT FALSE, -- Is this the official company account?
  is_verified BOOLEAN DEFAULT FALSE,
  follower_count INTEGER,
  reliability_score DECIMAL(3,2) DEFAULT 0.7,
  last_tweet_id VARCHAR(50),
  last_checked TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create company website monitoring
CREATE TABLE IF NOT EXISTS website_monitoring (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  website_url TEXT NOT NULL,
  press_release_url TEXT,
  investor_relations_url TEXT,
  earnings_url TEXT,
  rss_feed_url TEXT,
  last_checked TIMESTAMP WITH TIME ZONE,
  last_content_hash VARCHAR(64), -- To detect changes
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_data_sources_ticker ON ai_data_sources(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_ai_data_sources_type ON ai_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_queue_ticker ON ai_content_queue(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_ai_content_queue_status ON ai_content_queue(processing_status);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_ticker ON earnings_calendar(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_earnings_calendar_date ON earnings_calendar(earnings_date);
CREATE INDEX IF NOT EXISTS idx_twitter_monitoring_ticker ON twitter_monitoring(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_twitter_monitoring_handle ON twitter_monitoring(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_website_monitoring_ticker ON website_monitoring(stock_ticker);

-- Insert sample data sources for the 3 monitored stocks
INSERT INTO ai_data_sources (stock_ticker, source_type, source_name, source_url, source_identifier, reliability_score) VALUES
-- Apple Inc. (AAPL)
('AAPL', 'company_website', 'Apple Newsroom', 'https://www.apple.com/newsroom/', 'https://www.apple.com/newsroom/rss-feed.rss', 0.95),
('AAPL', 'twitter_handle', 'Apple', '@Apple', 'Apple', 0.95),
('AAPL', 'twitter_handle', 'Tim Cook', '@tim_cook', 'tim_cook', 0.90),
('AAPL', 'earnings_calendar', 'Apple Earnings', 'https://investor.apple.com/earnings/', 'earnings_calendar', 0.98),

-- Tesla Inc. (TSLA)
('TSLA', 'company_website', 'Tesla News', 'https://www.tesla.com/blog', 'https://www.tesla.com/blog/rss.xml', 0.95),
('TSLA', 'twitter_handle', 'Tesla', '@Tesla', 'Tesla', 0.95),
('TSLA', 'twitter_handle', 'Elon Musk', '@elonmusk', 'elonmusk', 0.85),
('TSLA', 'earnings_calendar', 'Tesla Earnings', 'https://ir.tesla.com/events-and-presentations', 'earnings_calendar', 0.98),

-- NVIDIA Corporation (NVDA)
('NVDA', 'company_website', 'NVIDIA News', 'https://nvidianews.nvidia.com/', 'https://nvidianews.nvidia.com/feed/', 0.95),
('NVDA', 'twitter_handle', 'NVIDIA', '@nvidia', 'nvidia', 0.95),
('NVDA', 'twitter_handle', 'Jensen Huang', '@jensenhuang', 'jensenhuang', 0.90),
('NVDA', 'earnings_calendar', 'NVIDIA Earnings', 'https://investor.nvidia.com/events-and-presentations/', 'earnings_calendar', 0.98)
ON CONFLICT DO NOTHING;

-- Insert sample Twitter monitoring
INSERT INTO twitter_monitoring (stock_ticker, twitter_handle, display_name, is_official, is_verified, reliability_score) VALUES
('AAPL', 'Apple', 'Apple', true, true, 0.95),
('AAPL', 'tim_cook', 'Tim Cook', true, true, 0.90),
('TSLA', 'Tesla', 'Tesla', true, true, 0.95),
('TSLA', 'elonmusk', 'Elon Musk', true, true, 0.85),
('NVDA', 'nvidia', 'NVIDIA', true, true, 0.95),
('NVDA', 'jensenhuang', 'Jensen Huang', true, true, 0.90)
ON CONFLICT DO NOTHING;

-- Insert sample website monitoring
INSERT INTO website_monitoring (stock_ticker, company_name, website_url, press_release_url, investor_relations_url) VALUES
('AAPL', 'Apple Inc.', 'https://www.apple.com', 'https://www.apple.com/newsroom/', 'https://investor.apple.com'),
('TSLA', 'Tesla Inc.', 'https://www.tesla.com', 'https://www.tesla.com/blog', 'https://ir.tesla.com'),
('NVDA', 'NVIDIA Corporation', 'https://www.nvidia.com', 'https://nvidianews.nvidia.com/', 'https://investor.nvidia.com')
ON CONFLICT DO NOTHING;

-- Insert sample earnings calendar data
INSERT INTO earnings_calendar (stock_ticker, earnings_date, earnings_time, call_type, is_confirmed) VALUES
('AAPL', '2024-02-01', '16:30:00', 'after_market', true),
('TSLA', '2024-01-24', '16:30:00', 'after_market', true),
('NVDA', '2024-02-21', '16:30:00', 'after_market', true)
ON CONFLICT DO NOTHING; 