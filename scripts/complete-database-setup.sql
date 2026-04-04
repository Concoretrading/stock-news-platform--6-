-- First, ensure all relationships are correct
ALTER TABLE stock_news DROP CONSTRAINT IF EXISTS stock_news_news_id_fkey;
ALTER TABLE stock_news DROP CONSTRAINT IF EXISTS stock_news_catalyst_id_fkey;

-- Ensure the column is named correctly
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stock_news' AND column_name = 'news_id') THEN
        ALTER TABLE stock_news RENAME COLUMN news_id TO catalyst_id;
    END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE stock_news 
ADD CONSTRAINT stock_news_catalyst_id_fkey 
FOREIGN KEY (catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Fix stock_prices table
ALTER TABLE stock_prices DROP CONSTRAINT IF EXISTS stock_prices_news_id_fkey;
ALTER TABLE stock_prices DROP CONSTRAINT IF EXISTS stock_prices_catalyst_id_fkey;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stock_prices' AND column_name = 'news_id') THEN
        ALTER TABLE stock_prices RENAME COLUMN news_id TO catalyst_id;
    END IF;
END $$;

ALTER TABLE stock_prices 
ADD CONSTRAINT stock_prices_catalyst_id_fkey 
FOREIGN KEY (catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Fix price_alerts table
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_original_news_id_fkey;
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_original_catalyst_id_fkey;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'price_alerts' AND column_name = 'original_news_id') THEN
        ALTER TABLE price_alerts RENAME COLUMN original_news_id TO original_catalyst_id;
    END IF;
END $$;

ALTER TABLE price_alerts 
ADD CONSTRAINT price_alerts_original_catalyst_id_fkey 
FOREIGN KEY (original_catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Create demo user if not exists
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
(1, 'demo@concoretrading.com', '$2b$10$example_hash_here', 'Demo', 'User')
ON CONFLICT (id) DO NOTHING;

-- Insert sample stocks for demo user
INSERT INTO stocks (ticker, name, user_id) VALUES
('AAPL', 'Apple Inc.', 1),
('MSFT', 'Microsoft Corporation', 1),
('GOOGL', 'Alphabet Inc.', 1),
('AMZN', 'Amazon.com Inc.', 1),
('META', 'Meta Platforms Inc.', 1),
('TSLA', 'Tesla Inc.', 1),
('NVDA', 'NVIDIA Corporation', 1),
('NFLX', 'Netflix Inc.', 1),
('CRM', 'Salesforce Inc.', 1),
('ORCL', 'Oracle Corporation', 1)
ON CONFLICT (ticker, user_id) DO NOTHING;

-- Insert sample catalysts with realistic data
INSERT INTO news_catalysts (headline, content, snippet, source, published_at, is_manual, user_notes, user_id) VALUES
-- AAPL Catalysts
('Apple announces revolutionary AI chip breakthrough with 40% performance boost', 
 'Apple unveiled its next-generation AI processing chip, promising unprecedented performance improvements that could revolutionize mobile computing and set new industry standards.',
 'Apple unveiled its next-generation AI processing chip, promising unprecedented performance improvements...',
 'TechCrunch', 
 '2024-01-15 10:30:00+00', 
 true,
 'Major product announcement that could drive significant sales growth. This is a game-changer for Apple.',
 1),

('Apple reports record Q4 earnings, beats expectations across all segments',
 'Apple delivered exceptional quarterly results with iPhone sales up 12%, Services revenue hitting new highs, and strong Mac and iPad performance.',
 'Apple delivered exceptional quarterly results with iPhone sales up 12%...',
 'CNBC',
 '2024-01-10 14:20:00+00',
 true,
 'Strong earnings beat. All segments performing well. Bullish outlook.',
 1),

('Apple faces production delays in China, iPhone shipments expected to drop 15%',
 'Supply chain disruptions at key manufacturing facilities in China are expected to significantly impact iPhone production, with analysts predicting a 15% reduction in Q1 shipments.',
 'Supply chain disruptions at key manufacturing facilities in China...',
 'Bloomberg',
 '2023-12-28 09:15:00+00',
 true,
 'Concerning supply chain issues. Could impact near-term performance.',
 1),

-- TSLA Catalysts  
('Tesla delivers record 500K vehicles in Q4, exceeds guidance',
 'Tesla announced record quarterly deliveries of 500,000 vehicles, surpassing company guidance and analyst expectations despite supply chain challenges.',
 'Tesla announced record quarterly deliveries of 500,000 vehicles...',
 'Reuters',
 '2024-01-08 16:45:00+00',
 true,
 'Exceptional delivery numbers. Tesla executing well on production ramp.',
 1),

('Tesla Cybertruck production begins, first deliveries scheduled',
 'Tesla has officially started Cybertruck production at its Austin facility, with first customer deliveries expected within the next month.',
 'Tesla has officially started Cybertruck production at its Austin facility...',
 'Electrek',
 '2024-01-05 11:30:00+00',
 true,
 'Major milestone for Tesla. Cybertruck could be a significant revenue driver.',
 1),

-- NVDA Catalysts
('NVIDIA announces next-gen AI chips with 3x performance improvement',
 'NVIDIA unveiled its latest AI processing chips featuring groundbreaking architecture that delivers 3x performance improvement over previous generation.',
 'NVIDIA unveiled its latest AI processing chips featuring groundbreaking architecture...',
 'The Verge',
 '2024-01-12 13:15:00+00',
 true,
 'Massive performance leap. NVIDIA maintaining AI leadership position.',
 1),

-- MSFT Catalysts
('Microsoft secures $10B government cloud contract, largest in company history',
 'Microsoft announced a landmark government cloud services contract worth $10 billion over five years, significantly expanding its presence in the public sector.',
 'Microsoft announced a landmark government cloud services contract...',
 'Wall Street Journal',
 '2024-01-06 12:00:00+00',
 true,
 'Huge contract win. Validates Microsoft cloud strategy and competitive position.',
 1)

ON CONFLICT DO NOTHING;

-- Get the catalyst IDs and stock IDs for associations
DO $$
DECLARE
    aapl_stock_id INTEGER;
    tsla_stock_id INTEGER;
    nvda_stock_id INTEGER;
    msft_stock_id INTEGER;
    catalyst_record RECORD;
BEGIN
    -- Get stock IDs
    SELECT id INTO aapl_stock_id FROM stocks WHERE ticker = 'AAPL' AND user_id = 1;
    SELECT id INTO tsla_stock_id FROM stocks WHERE ticker = 'TSLA' AND user_id = 1;
    SELECT id INTO nvda_stock_id FROM stocks WHERE ticker = 'NVDA' AND user_id = 1;
    SELECT id INTO msft_stock_id FROM stocks WHERE ticker = 'MSFT' AND user_id = 1;

    -- Associate AAPL catalysts
    FOR catalyst_record IN 
        SELECT id FROM news_catalysts 
        WHERE user_id = 1 AND (
            headline LIKE '%Apple%' OR 
            headline LIKE '%iPhone%'
        )
    LOOP
        INSERT INTO stock_news (stock_id, catalyst_id) 
        VALUES (aapl_stock_id, catalyst_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Associate TSLA catalysts
    FOR catalyst_record IN 
        SELECT id FROM news_catalysts 
        WHERE user_id = 1 AND (
            headline LIKE '%Tesla%' OR 
            headline LIKE '%Cybertruck%'
        )
    LOOP
        INSERT INTO stock_news (stock_id, catalyst_id) 
        VALUES (tsla_stock_id, catalyst_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Associate NVDA catalysts
    FOR catalyst_record IN 
        SELECT id FROM news_catalysts 
        WHERE user_id = 1 AND headline LIKE '%NVIDIA%'
    LOOP
        INSERT INTO stock_news (stock_id, catalyst_id) 
        VALUES (nvda_stock_id, catalyst_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Associate MSFT catalysts
    FOR catalyst_record IN 
        SELECT id FROM news_catalysts 
        WHERE user_id = 1 AND headline LIKE '%Microsoft%'
    LOOP
        INSERT INTO stock_news (stock_id, catalyst_id) 
        VALUES (msft_stock_id, catalyst_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Add sample price data
INSERT INTO stock_prices (stock_id, catalyst_id, price_before, price_after, price_change, price_change_percent, tracking_date, user_id)
SELECT 
    sn.stock_id,
    sn.catalyst_id,
    CASE 
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%AI chip%' THEN 173.20
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%earnings%' THEN 185.50
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%production delays%' THEN 204.20
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%500K vehicles%' THEN 238.45
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%Cybertruck%' THEN 245.80
        WHEN s.ticker = 'NVDA' AND nc.headline LIKE '%AI chips%' THEN 485.20
        WHEN s.ticker = 'MSFT' AND nc.headline LIKE '%government cloud%' THEN 378.20
        ELSE 100.00
    END as price_before,
    CASE 
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%AI chip%' THEN 185.50
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%earnings%' THEN 192.30
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%production delays%' THEN 192.80
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%500K vehicles%' THEN 251.20
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%Cybertruck%' THEN 253.15
        WHEN s.ticker = 'NVDA' AND nc.headline LIKE '%AI chips%' THEN 512.80
        WHEN s.ticker = 'MSFT' AND nc.headline LIKE '%government cloud%' THEN 393.90
        ELSE 105.00
    END as price_after,
    CASE 
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%AI chip%' THEN 12.30
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%earnings%' THEN 6.80
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%production delays%' THEN -11.40
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%500K vehicles%' THEN 12.75
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%Cybertruck%' THEN 7.35
        WHEN s.ticker = 'NVDA' AND nc.headline LIKE '%AI chips%' THEN 27.60
        WHEN s.ticker = 'MSFT' AND nc.headline LIKE '%government cloud%' THEN 15.70
        ELSE 5.00
    END as price_change,
    CASE 
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%AI chip%' THEN 7.10
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%earnings%' THEN 3.67
        WHEN s.ticker = 'AAPL' AND nc.headline LIKE '%production delays%' THEN -5.58
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%500K vehicles%' THEN 5.35
        WHEN s.ticker = 'TSLA' AND nc.headline LIKE '%Cybertruck%' THEN 2.99
        WHEN s.ticker = 'NVDA' AND nc.headline LIKE '%AI chips%' THEN 5.69
        WHEN s.ticker = 'MSFT' AND nc.headline LIKE '%government cloud%' THEN 4.15
        ELSE 5.00
    END as price_change_percent,
    nc.published_at::DATE as tracking_date,
    1 as user_id
FROM stock_news sn
JOIN stocks s ON sn.stock_id = s.id
JOIN news_catalysts nc ON sn.catalyst_id = nc.id
WHERE s.user_id = 1
ON CONFLICT DO NOTHING;
