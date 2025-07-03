-- Add columns for manual news entries and stock price tracking
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS user_notes TEXT;
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create stock price tracking table
CREATE TABLE IF NOT EXISTS stock_prices (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
  price_before DECIMAL(10,2),
  price_after DECIMAL(10,2),
  price_change DECIMAL(10,2),
  price_change_percent DECIMAL(5,2),
  news_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  tracking_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_prices_news_id ON stock_prices(news_id);
CREATE INDEX IF NOT EXISTS idx_stock_prices_tracking_date ON stock_prices(tracking_date);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_manual ON news_articles(is_manual);
CREATE INDEX IF NOT EXISTS idx_news_articles_entry_date ON news_articles(entry_date);

-- Add full text search capability
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_news_search_vector ON news_articles USING gin(search_vector);

-- Create trigger to update search vector
CREATE OR REPLACE FUNCTION update_news_search_vector()
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

CREATE TRIGGER trigger_update_news_search_vector
  BEFORE INSERT OR UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_news_search_vector();
