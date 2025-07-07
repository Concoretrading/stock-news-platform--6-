-- AI Calendar Events Database Schema
-- This adds the infrastructure for AI-powered event detection and calendar management

-- Create AI monitoring subscriptions table (3 stocks per user limit)
CREATE TABLE IF NOT EXISTS ai_monitoring_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stock_ticker VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, stock_ticker)
);

-- Create AI detected events table
CREATE TABLE IF NOT EXISTS ai_detected_events (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('earnings_call', 'product_announcement', 'conference', 'regulatory_filing', 'analyst_event')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('earnings_transcript', 'press_release', 'sec_filing', 'conference_call', 'analyst_report', 'news_article')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  event_date DATE,
  event_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  raw_text TEXT, -- Original text that was analyzed
  ai_analysis JSONB, -- Detailed AI analysis results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user calendar events table (user-specific events)
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ai_event_id INTEGER REFERENCES ai_detected_events(id) ON DELETE CASCADE,
  stock_ticker VARCHAR(10) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  is_reminder_set BOOLEAN DEFAULT FALSE,
  reminder_time TIMESTAMP WITH TIME ZONE,
  is_confirmed BOOLEAN DEFAULT FALSE, -- User confirmed this event is real
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create AI processing queue table
CREATE TABLE IF NOT EXISTS ai_processing_queue (
  id SERIAL PRIMARY KEY,
  stock_ticker VARCHAR(10) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  source_url TEXT,
  raw_content TEXT,
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_user_id ON ai_monitoring_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_monitoring_ticker ON ai_monitoring_subscriptions(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_ai_detected_events_ticker ON ai_detected_events(stock_ticker);
CREATE INDEX IF NOT EXISTS idx_ai_detected_events_date ON ai_detected_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ai_detected_events_type ON ai_detected_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_id ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_date ON user_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ai_processing_queue_status ON ai_processing_queue(processing_status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_queue_ticker ON ai_processing_queue(stock_ticker);

-- Create function to enforce 3-stock limit per user
CREATE OR REPLACE FUNCTION enforce_ai_monitoring_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has 3 active subscriptions
  IF (SELECT COUNT(*) FROM ai_monitoring_subscriptions 
      WHERE user_id = NEW.user_id AND is_active = TRUE) >= 3 THEN
    RAISE EXCEPTION 'User can only monitor 3 stocks with AI';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the limit
CREATE TRIGGER trigger_enforce_ai_monitoring_limit
  BEFORE INSERT ON ai_monitoring_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_ai_monitoring_limit();

-- Create function to automatically create user calendar events from AI detected events
CREATE OR REPLACE FUNCTION create_user_calendar_events()
RETURNS TRIGGER AS $$
BEGIN
  -- For each user monitoring this stock, create a calendar event
  INSERT INTO user_calendar_events (
    user_id,
    ai_event_id,
    stock_ticker,
    event_type,
    title,
    description,
    event_date,
    event_time
  )
  SELECT 
    ams.user_id,
    NEW.id,
    NEW.stock_ticker,
    NEW.event_type,
    NEW.title,
    NEW.description,
    NEW.event_date,
    NEW.event_time
  FROM ai_monitoring_subscriptions ams
  WHERE ams.stock_ticker = NEW.stock_ticker 
    AND ams.is_active = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create user events
CREATE TRIGGER trigger_create_user_calendar_events
  AFTER INSERT ON ai_detected_events
  FOR EACH ROW
  EXECUTE FUNCTION create_user_calendar_events();

-- Insert sample AI monitoring subscriptions for demo user
INSERT INTO ai_monitoring_subscriptions (user_id, stock_ticker) VALUES
(1, 'AAPL'),
(1, 'TSLA'),
(1, 'NVDA')
ON CONFLICT (user_id, stock_ticker) DO NOTHING;

-- Insert sample AI detected events
INSERT INTO ai_detected_events (
  stock_ticker,
  event_type,
  title,
  description,
  source_type,
  confidence_score,
  event_date,
  event_time,
  raw_text
) VALUES
(
  'AAPL',
  'earnings_call',
  'Apple Q1 2024 Earnings Call',
  'Apple will report Q1 2024 earnings results. Expected to discuss iPhone sales, Services growth, and AI initiatives.',
  'earnings_transcript',
  0.95,
  '2024-02-01',
  '16:30:00',
  'Apple Inc. (AAPL) will hold its quarterly earnings conference call on February 1, 2024 at 5:00 PM Eastern Time.'
),
(
  'TSLA',
  'product_announcement',
  'Tesla Cybertruck Production Update',
  'Tesla expected to provide updates on Cybertruck production ramp and delivery timeline.',
  'press_release',
  0.87,
  '2024-02-15',
  '14:00:00',
  'Tesla to announce Cybertruck production milestones and delivery schedule updates in February 2024.'
),
(
  'NVDA',
  'conference',
  'NVIDIA GTC 2024 Conference',
  'NVIDIA GPU Technology Conference featuring AI and graphics announcements.',
  'conference_call',
  0.92,
  '2024-03-18',
  '09:00:00',
  'NVIDIA GTC 2024 conference scheduled for March 18-21, 2024 in San Jose, California.'
)
ON CONFLICT DO NOTHING; 