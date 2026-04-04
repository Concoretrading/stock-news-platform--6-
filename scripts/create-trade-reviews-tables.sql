-- Trade Reviews Database Schema
-- This creates the tables needed for the trade review feature

-- Main trade reviews table
CREATE TABLE IF NOT EXISTS trade_reviews (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    trade_date DATE NOT NULL,
    position_type VARCHAR(10) NOT NULL CHECK (position_type IN ('LONG', 'SHORT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    total_sections INTEGER DEFAULT 0,
    is_template BOOLEAN DEFAULT FALSE
);

-- Trade review sections table
CREATE TABLE IF NOT EXISTS trade_review_sections (
    id SERIAL PRIMARY KEY,
    trade_review_id INTEGER REFERENCES trade_reviews(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_order INTEGER NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade review images table
CREATE TABLE IF NOT EXISTS trade_review_images (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES trade_review_sections(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    image_order INTEGER NOT NULL,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_reviews_user_id ON trade_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_reviews_ticker ON trade_reviews(ticker);
CREATE INDEX IF NOT EXISTS idx_trade_reviews_date ON trade_reviews(trade_date);
CREATE INDEX IF NOT EXISTS idx_trade_review_sections_review_id ON trade_review_sections(trade_review_id);
CREATE INDEX IF NOT EXISTS idx_trade_review_images_section_id ON trade_review_images(section_id);

-- Insert default section templates
INSERT INTO trade_reviews (user_id, ticker, trade_date, position_type, is_template, status) VALUES
('template', 'TEMPLATE', '2025-01-01', 'LONG', TRUE, 'published');

-- Get the template review ID
DO $$
DECLARE
    template_review_id INTEGER;
BEGIN
    SELECT id INTO template_review_id FROM trade_reviews WHERE is_template = TRUE LIMIT 1;
    
    -- Insert default sections
    INSERT INTO trade_review_sections (trade_review_id, section_name, section_order, content) VALUES
    (template_review_id, 'Overview', 1, 'Describe the trade setup, catalyst, and initial analysis'),
    (template_review_id, 'Emotions', 2, 'How did you feel during the trade? What emotions influenced your decisions?'),
    (template_review_id, 'Momentum', 3, 'Analyze the momentum indicators and price action'),
    (template_review_id, 'Key Levels', 4, 'Identify and analyze key support/resistance levels'),
    (template_review_id, 'Volume', 5, 'Volume analysis and its impact on the trade'),
    (template_review_id, 'Keltners', 6, 'Keltner Channel analysis and volatility assessment'),
    (template_review_id, 'What I Need to Improve On', 7, 'Self-reflection on areas for improvement'),
    (template_review_id, 'Final Notes', 8, 'Overall assessment and key takeaways');
END $$; 