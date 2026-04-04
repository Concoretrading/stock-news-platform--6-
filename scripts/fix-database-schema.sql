-- Drop existing tables if they exist
DROP TABLE IF EXISTS stock_prices CASCADE;
DROP TABLE IF EXISTS catalysts CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stocks table
CREATE TABLE stocks (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker, user_id)
);

-- Create catalysts table
CREATE TABLE catalysts (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
    headline VARCHAR(500) NOT NULL,
    notes TEXT,
    source VARCHAR(255),
    image_url TEXT,
    catalyst_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_prices table
CREATE TABLE stock_prices (
    id SERIAL PRIMARY KEY,
    catalyst_id INTEGER REFERENCES catalysts(id) ON DELETE CASCADE,
    price_before DECIMAL(10,2),
    price_after DECIMAL(10,2),
    price_change DECIMAL(10,2),
    percentage_change DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample user
INSERT INTO users (id, email, password_hash) VALUES 
(1, 'demo@example.com', 'demo_hash') 
ON CONFLICT (email) DO NOTHING;

-- Insert sample stocks
INSERT INTO stocks (id, ticker, name, user_id) VALUES 
(1, 'AAPL', 'Apple Inc.', 1),
(2, 'MSFT', 'Microsoft Corporation', 1),
(3, 'GOOGL', 'Alphabet Inc.', 1)
ON CONFLICT (ticker, user_id) DO NOTHING;

-- Insert sample catalysts for AAPL across different months
INSERT INTO catalysts (stock_id, headline, notes, source, catalyst_date) VALUES 
(1, 'Apple announces Q4 earnings beat with record iPhone sales', 'Strong quarterly performance driven by iPhone 15 sales and services growth', 'Apple Press Release', '2024-11-01'),
(1, 'Apple Vision Pro production reportedly scaled back due to weak demand', 'Supply chain sources indicate reduced manufacturing orders', 'Bloomberg', '2024-10-15'),
(1, 'Apple Intelligence features rolling out to iOS 18.1 users', 'AI-powered features now available including improved Siri and writing tools', 'TechCrunch', '2024-10-28'),
(1, 'Apple supplier Foxconn reports strong September quarter', 'Key supplier performance indicates healthy iPhone demand', 'Reuters', '2024-09-12'),
(1, 'iPhone 15 Pro Max faces production delays in China', 'Manufacturing issues affecting premium model availability', 'Wall Street Journal', '2024-09-25'),
(1, 'Apple Services revenue hits new all-time high', 'App Store, iCloud, and subscription services drive growth', 'Apple Investor Relations', '2024-08-08'),
(1, 'Apple stock splits 4-for-1 to improve accessibility', 'Board approves stock split to make shares more accessible to retail investors', 'SEC Filing', '2024-08-20'),
(1, 'Apple faces EU antitrust investigation over App Store policies', 'European regulators examining app distribution and payment practices', 'Financial Times', '2024-07-10'),
(1, 'Apple WWDC 2024 showcases major iOS 18 updates', 'Developer conference reveals significant software improvements and AI integration', 'Apple Developer', '2024-06-10'),
(1, 'Apple supplier diversification accelerates amid geopolitical tensions', 'Company expanding manufacturing partnerships beyond China', 'Nikkei Asia', '2024-05-22'),
(1, 'Apple iPad Pro with M4 chip launches to strong pre-orders', 'New tablet featuring advanced processor sees high initial demand', 'Apple Newsroom', '2024-05-07')
ON CONFLICT DO NOTHING;

-- Insert corresponding stock prices
INSERT INTO stock_prices (catalyst_id, price_before, price_after, price_change, percentage_change) VALUES 
(1, 220.50, 235.20, 14.70, 6.67),
(2, 225.80, 218.30, -7.50, -3.32),
(3, 218.30, 228.90, 10.60, 4.86),
(4, 175.20, 182.40, 7.20, 4.11),
(5, 182.40, 176.80, -5.60, -3.07),
(6, 195.30, 208.70, 13.40, 6.86),
(7, 208.70, 224.80, 16.10, 7.71),
(8, 224.80, 218.90, -5.90, -2.62),
(9, 190.50, 205.20, 14.70, 7.72),
(10, 185.60, 192.30, 6.70, 3.61),
(11, 180.20, 188.90, 8.70, 4.83)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_catalysts_stock_id ON catalysts(stock_id);
CREATE INDEX IF NOT EXISTS idx_catalysts_date ON catalysts(catalyst_date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_catalyst_id ON stock_prices(catalyst_id);
CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_stocks_user_id ON stocks(user_id);
