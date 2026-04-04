-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rename news_articles to news_catalysts and add user_id
ALTER TABLE news_articles RENAME TO news_catalysts;

-- Add user_id to news_catalysts
ALTER TABLE news_catalysts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Update stock_news table to reference news_catalysts
ALTER TABLE stock_news RENAME COLUMN news_id TO catalyst_id;

-- Update stock_prices table to reference news_catalysts
ALTER TABLE stock_prices RENAME COLUMN news_id TO catalyst_id;

-- Update price_alerts table to reference news_catalysts
ALTER TABLE price_alerts RENAME COLUMN original_news_id TO original_catalyst_id;
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to stocks table for user-specific watchlists
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to stock_prices
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Create screenshot_uploads table for drag-and-drop functionality
CREATE TABLE IF NOT EXISTS screenshot_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  detected_tickers TEXT[] DEFAULT '{}',
  suggested_catalyst_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Drop Twitter-related tables
DROP TABLE IF EXISTS twitter_tweets CASCADE;
DROP TABLE IF EXISTS twitter_handles CASCADE;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_news_catalysts_user_id ON news_catalysts(user_id);
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_prices_user_id ON stock_prices(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_uploads_user_id ON screenshot_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_uploads_status ON screenshot_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Update the search vector trigger function name
DROP TRIGGER IF EXISTS trigger_update_news_search_vector ON news_catalysts;
DROP FUNCTION IF EXISTS update_news_search_vector();

CREATE OR REPLACE FUNCTION update_catalyst_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.headline, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' || 
    COALESCE(NEW.snippet, '') || ' ' ||
    COALESCE(NEW.user_notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_catalyst_search_vector
  BEFORE INSERT OR UPDATE ON news_catalysts
  FOR EACH ROW EXECUTE FUNCTION update_catalyst_search_vector();

-- Update the price alert creation function
DROP TRIGGER IF EXISTS trigger_create_price_alerts ON stock_prices;
DROP FUNCTION IF EXISTS create_price_revisit_alerts();

CREATE OR REPLACE FUNCTION create_catalyst_revisit_alerts()
RETURNS TRIGGER AS $$
DECLARE
  stock_ticker VARCHAR(10);
  alert_price DECIMAL(10,2);
  catalyst_info RECORD;
  stock_settings RECORD;
  min_movement DECIMAL(10,2);
  tolerance DECIMAL(10,2);
BEGIN
  -- Get the stock ticker and settings
  SELECT s.ticker INTO stock_ticker
  FROM stocks s
  WHERE s.id = NEW.stock_id;
  
  -- Get stock-specific settings or use defaults
  SELECT * INTO stock_settings
  FROM stock_alert_settings
  WHERE ticker = stock_ticker AND user_id = NEW.user_id;
  
  -- Use stock-specific settings or defaults
  min_movement := COALESCE(stock_settings.default_minimum_movement, 10.0);
  tolerance := COALESCE(stock_settings.default_tolerance_points, 2.0);
  
  -- Only create alerts if enabled for this stock and movement is significant
  IF (stock_settings.auto_create_alerts IS NULL OR stock_settings.auto_create_alerts = TRUE) 
     AND ABS(NEW.price_change) >= min_movement THEN
    
    -- Get catalyst details
    SELECT headline, published_at::DATE as catalyst_date, snippet
    INTO catalyst_info
    FROM news_catalysts
    WHERE id = NEW.catalyst_id;
    
    -- Set alert price based on the "after" price from the catalyst event
    alert_price := NEW.price_after;
    
    -- Create the alert with full catalyst context
    INSERT INTO price_alerts (
      user_id,
      ticker,
      alert_type,
      trigger_price,
      original_catalyst_id,
      original_price_movement,
      tolerance_points,
      minimum_movement,
      news_headline,
      news_date,
      news_snippet,
      alert_message
    ) VALUES (
      NEW.user_id,
      stock_ticker,
      'catalyst_revisit',
      alert_price,
      NEW.catalyst_id,
      NEW.price_change,
      tolerance,
      min_movement,
      catalyst_info.headline,
      catalyst_info.catalyst_date,
      catalyst_info.snippet,
      FORMAT('Alert: %s revisited price level $%.2f from %s catalyst event (%.1f point movement)', 
             stock_ticker, alert_price, catalyst_info.catalyst_date::TEXT, NEW.price_change)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_catalyst_alerts
  AFTER INSERT ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION create_catalyst_revisit_alerts();

-- Add user_id to stock_alert_settings
ALTER TABLE stock_alert_settings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_stock_alert_settings_user_id ON stock_alert_settings(user_id);

-- Update sample data with a demo user
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('demo@concoretrading.com', '$2b$10$example_hash_here', 'Demo', 'User')
ON CONFLICT (email) DO NOTHING;
