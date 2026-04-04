-- Insert sample stocks
INSERT INTO stocks (ticker, name) VALUES
('AAPL', 'Apple Inc.'),
('MSFT', 'Microsoft Corporation'),
('GOOGL', 'Alphabet Inc.'),
('AMZN', 'Amazon.com Inc.'),
('META', 'Meta Platforms Inc.')
ON CONFLICT (ticker) DO NOTHING;

-- Insert sample news articles with importance and impact
INSERT INTO news_articles (headline, content, snippet, source, url, published_at, importance, impact) VALUES
('Apple announces new iPhone models with improved AI capabilities', 
 'Full article content would go here...', 
 'The tech giant revealed its latest smartphone lineup featuring enhanced machine learning features...', 
 'TechCrunch', 
 'https://example.com/article1', 
 NOW() - INTERVAL '1 day', 
 1, -- Critical importance
 'positive'),

('Microsoft and Google partner on new AI initiative', 
 'Full article content would go here...', 
 'The two tech giants announced a surprising partnership focused on artificial intelligence standards...', 
 'The Verge', 
 'https://example.com/article2', 
 NOW() - INTERVAL '3 days', 
 2, -- High importance
 'positive'),

('Amazon faces regulatory scrutiny over new acquisition', 
 'Full article content would go here...', 
 'Regulators are examining the e-commerce giant''s latest purchase for potential antitrust concerns...', 
 'Wall Street Journal', 
 'https://example.com/article3', 
 NOW() - INTERVAL '5 days', 
 2, -- High importance
 'negative'),

('Meta reports lower than expected quarterly earnings', 
 'Full article content would go here...', 
 'The social media company missed analyst projections for the third quarter...', 
 'CNBC', 
 'https://example.com/article4', 
 NOW() - INTERVAL '10 days', 
 3, -- Medium importance
 'negative'),

('Apple supplier reports production delays', 
 'Full article content would go here...', 
 'A key component manufacturer is experiencing setbacks that could impact product availability...', 
 'Bloomberg', 
 'https://example.com/article5', 
 NOW() - INTERVAL '15 days', 
 3, -- Medium importance
 'negative'),

('Google launches new cloud service for enterprise customers', 
 'Full article content would go here...', 
 'The new offering aims to simplify AI implementation for large businesses...', 
 'Reuters', 
 'https://example.com/article6', 
 NOW() - INTERVAL '1 month', 
 4, -- Low importance
 'positive'),

('Microsoft CEO speaks at industry conference', 
 'Full article content would go here...', 
 'The executive shared insights on future technology trends and company direction...', 
 'ZDNet', 
 'https://example.com/article7', 
 NOW() - INTERVAL '2 months', 
 5, -- Minimal importance
 'neutral'),

('Amazon opens new fulfillment center', 
 'Full article content would go here...', 
 'The facility will create hundreds of jobs and improve delivery times in the region...', 
 'Business Insider', 
 'https://example.com/article8', 
 NOW() - INTERVAL '3 months', 
 4, -- Low importance
 'positive');

-- Create associations between stocks and news
WITH stock_data AS (
  SELECT id, ticker FROM stocks
),
news_data AS (
  SELECT id, headline FROM news_articles
)
INSERT INTO stock_news (stock_id, news_id)
SELECT 
  stock_data.id,
  news_data.id
FROM 
  stock_data,
  news_data
WHERE 
  (stock_data.ticker = 'AAPL' AND news_data.headline LIKE '%Apple%') OR
  (stock_data.ticker = 'MSFT' AND news_data.headline LIKE '%Microsoft%') OR
  (stock_data.ticker = 'GOOGL' AND news_data.headline LIKE '%Google%') OR
  (stock_data.ticker = 'AMZN' AND news_data.headline LIKE '%Amazon%') OR
  (stock_data.ticker = 'META' AND news_data.headline LIKE '%Meta%')
ON CONFLICT DO NOTHING;
