-- First, let's check and fix the foreign key relationships

-- Drop existing foreign key constraints if they exist
ALTER TABLE stock_news DROP CONSTRAINT IF EXISTS stock_news_news_id_fkey;
ALTER TABLE stock_news DROP CONSTRAINT IF EXISTS stock_news_catalyst_id_fkey;

-- Ensure the column is named correctly
DO $$ 
BEGIN
    -- Check if news_id column exists and rename it to catalyst_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stock_news' AND column_name = 'news_id') THEN
        ALTER TABLE stock_news RENAME COLUMN news_id TO catalyst_id;
    END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE stock_news 
ADD CONSTRAINT stock_news_catalyst_id_fkey 
FOREIGN KEY (catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Also fix stock_prices table
ALTER TABLE stock_prices DROP CONSTRAINT IF EXISTS stock_prices_news_id_fkey;
ALTER TABLE stock_prices DROP CONSTRAINT IF EXISTS stock_prices_catalyst_id_fkey;

DO $$ 
BEGIN
    -- Check if news_id column exists and rename it to catalyst_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'stock_prices' AND column_name = 'news_id') THEN
        ALTER TABLE stock_prices RENAME COLUMN news_id TO catalyst_id;
    END IF;
END $$;

-- Add the correct foreign key constraint for stock_prices
ALTER TABLE stock_prices 
ADD CONSTRAINT stock_prices_catalyst_id_fkey 
FOREIGN KEY (catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Fix price_alerts table
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_original_news_id_fkey;
ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_original_catalyst_id_fkey;

DO $$ 
BEGIN
    -- Check if original_news_id column exists and rename it to original_catalyst_id
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'price_alerts' AND column_name = 'original_news_id') THEN
        ALTER TABLE price_alerts RENAME COLUMN original_news_id TO original_catalyst_id;
    END IF;
END $$;

-- Add the correct foreign key constraint for price_alerts
ALTER TABLE price_alerts 
ADD CONSTRAINT price_alerts_original_catalyst_id_fkey 
FOREIGN KEY (original_catalyst_id) REFERENCES news_catalysts(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_stock_news_news_id;
CREATE INDEX IF NOT EXISTS idx_stock_news_catalyst_id ON stock_news(catalyst_id);

DROP INDEX IF EXISTS idx_stock_prices_news_id;
CREATE INDEX IF NOT EXISTS idx_stock_prices_catalyst_id ON stock_prices(catalyst_id);

-- Verify the relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('stock_news', 'stock_prices', 'price_alerts');
