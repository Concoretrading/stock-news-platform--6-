-- Create price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('price_revisit', 'manual', 'threshold')),
  trigger_price DECIMAL(10,2) NOT NULL,
  original_news_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  original_price_movement DECIMAL(10,2),
  tolerance_points DECIMAL(10,2) DEFAULT 2.0,
  minimum_movement DECIMAL(10,2) DEFAULT 10.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP WITH TIME ZONE,
  current_price DECIMAL(10,2),
  alert_message TEXT,
  news_headline TEXT,
  news_date DATE,
  news_snippet TEXT,
  custom_settings JSONB DEFAULT '{}'
);

-- Create alert triggers table for tracking when alerts fire
CREATE TABLE IF NOT EXISTS alert_triggers (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER REFERENCES price_alerts(id) ON DELETE CASCADE,
  triggered_price DECIMAL(10,2) NOT NULL,
  trigger_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  news_context TEXT,
  price_difference DECIMAL(10,2)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_alerts_ticker ON price_alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_trigger_price ON price_alerts(trigger_price);
CREATE INDEX IF NOT EXISTS idx_alert_triggers_alert_id ON alert_triggers(alert_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_news_date ON price_alerts(news_date);

-- Add stock-specific alert settings table
CREATE TABLE IF NOT EXISTS stock_alert_settings (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL UNIQUE,
  default_tolerance_points DECIMAL(5,2) DEFAULT 2.0,
  default_minimum_movement DECIMAL(5,2) DEFAULT 10.0,
  auto_create_alerts BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"email": false, "push": true, "sms": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_alert_settings_ticker ON stock_alert_settings(ticker);

-- Create function to automatically create alerts from significant news events
CREATE OR REPLACE FUNCTION create_price_revisit_alerts()
RETURNS TRIGGER AS $$
DECLARE
  stock_ticker VARCHAR(10);
  alert_price DECIMAL(10,2);
  news_info RECORD;
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
  WHERE ticker = stock_ticker;
  
  -- Use stock-specific settings or defaults
  min_movement := COALESCE(stock_settings.default_minimum_movement, 10.0);
  tolerance := COALESCE(stock_settings.default_tolerance_points, 2.0);
  
  -- Only create alerts if enabled for this stock and movement is significant
  IF (stock_settings.auto_create_alerts IS NULL OR stock_settings.auto_create_alerts = TRUE) 
     AND ABS(NEW.price_change) >= min_movement THEN
    
    -- Get news article details
    SELECT headline, published_at::DATE as news_date, snippet
    INTO news_info
    FROM news_articles
    WHERE id = NEW.news_id;
    
    -- Set alert price based on the "after" price from the news event
    alert_price := NEW.price_after;
    
    -- Create the alert with full news context
    INSERT INTO price_alerts (
      ticker,
      alert_type,
      trigger_price,
      original_news_id,
      original_price_movement,
      tolerance_points,
      minimum_movement,
      news_headline,
      news_date,
      news_snippet,
      alert_message
    ) VALUES (
      stock_ticker,
      'price_revisit',
      alert_price,
      NEW.news_id,
      NEW.price_change,
      tolerance,
      min_movement,
      news_info.headline,
      news_info.news_date,
      news_info.snippet,
      FORMAT('Alert: %s revisited price level $%.2f from %s news event (%.1f point movement)', 
             stock_ticker, alert_price, news_info.news_date::TEXT, NEW.price_change)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create alerts when significant price movements are recorded
CREATE OR REPLACE TRIGGER trigger_create_price_alerts
  AFTER INSERT ON stock_prices
  FOR EACH ROW
  EXECUTE FUNCTION create_price_revisit_alerts();
