-- Add user_id column to stocks table if it doesn't exist
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 1;

-- Update existing stocks to have user_id = 1 (default user)
UPDATE stocks SET user_id = 1 WHERE user_id IS NULL;

-- Insert sample stocks if they don't exist
INSERT INTO stocks (symbol, name, user_id) VALUES 
('AAPL', 'Apple Inc.', 1),
('GOOGL', 'Alphabet Inc.', 1),
('MSFT', 'Microsoft Corporation', 1),
('TSLA', 'Tesla Inc.', 1),
('AMZN', 'Amazon.com Inc.', 1),
('META', 'Meta Platforms Inc.', 1),
('NVDA', 'NVIDIA Corporation', 1),
('NFLX', 'Netflix Inc.', 1),
('AMD', 'Advanced Micro Devices Inc.', 1),
('CRM', 'Salesforce Inc.', 1)
ON CONFLICT (symbol) DO NOTHING;

-- Add some sample catalysts for AAPL to demonstrate the system
INSERT INTO news_catalysts (stock_id, headline, content, user_notes, published_at, source, image_url) VALUES 
(
  (SELECT id FROM stocks WHERE symbol = 'AAPL' LIMIT 1),
  'Apple Reports Record Q4 Earnings',
  'Apple Inc. reported record fourth-quarter earnings, beating analyst expectations across all product categories.',
  'Strong iPhone sales drove the beat. Services revenue also exceeded expectations.',
  '2024-11-01 16:30:00',
  'Apple Press Release',
  NULL
),
(
  (SELECT id FROM stocks WHERE symbol = 'AAPL' LIMIT 1),
  'New iPhone 16 Launch Event',
  'Apple unveiled the iPhone 16 series with advanced AI capabilities and improved camera systems.',
  'Market responded positively to AI integration. Pre-orders exceeded expectations.',
  '2024-10-15 13:00:00',
  'Apple Event',
  NULL
),
(
  (SELECT id FROM stocks WHERE symbol = 'AAPL' LIMIT 1),
  'Apple Services Revenue Milestone',
  'Apple Services division reaches new all-time high, contributing significantly to overall revenue growth.',
  'Services now represent 25% of total revenue. Recurring revenue model showing strength.',
  '2024-09-20 10:00:00',
  'Financial Times',
  NULL
)
ON CONFLICT DO NOTHING;

-- Add corresponding stock prices for the catalysts
INSERT INTO stock_prices (catalyst_id, price_before, price_after, price_change, recorded_at) VALUES 
(
  (SELECT id FROM news_catalysts WHERE headline = 'Apple Reports Record Q4 Earnings' LIMIT 1),
  220.50,
  235.80,
  15.30,
  '2024-11-01 20:00:00'
),
(
  (SELECT id FROM news_catalysts WHERE headline = 'New iPhone 16 Launch Event' LIMIT 1),
  215.20,
  228.90,
  13.70,
  '2024-10-15 20:00:00'
),
(
  (SELECT id FROM news_catalysts WHERE headline = 'Apple Services Revenue Milestone' LIMIT 1),
  210.80,
  218.45,
  7.65,
  '2024-09-20 16:00:00'
)
ON CONFLICT DO NOTHING;
