-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create news articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id SERIAL PRIMARY KEY,
  headline VARCHAR(255) NOT NULL,
  content TEXT,
  snippet TEXT,
  source VARCHAR(100),
  url VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for stocks and news articles
CREATE TABLE IF NOT EXISTS stock_news (
  stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
  news_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (stock_id, news_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_stock_news_stock_id ON stock_news(stock_id);
