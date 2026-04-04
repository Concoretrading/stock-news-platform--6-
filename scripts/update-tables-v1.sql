-- Add importance field to news_articles table
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 3;
-- Importance scale: 1 (highest) to 5 (lowest)

-- Add index for importance to improve sorting performance
CREATE INDEX IF NOT EXISTS idx_news_importance ON news_articles(importance);

-- Add timestamp fields to help with historical data
ALTER TABLE news_articles ADD COLUMN IF NOT EXISTS published_date DATE GENERATED ALWAYS AS (published_at::DATE) STORED;
CREATE INDEX IF NOT EXISTS idx_news_published_date ON news_articles(published_date);
