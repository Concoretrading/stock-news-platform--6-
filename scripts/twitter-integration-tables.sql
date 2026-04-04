-- Create Twitter handles table
CREATE TABLE IF NOT EXISTS twitter_handles (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Twitter tweets table
CREATE TABLE IF NOT EXISTS twitter_tweets (
  id SERIAL PRIMARY KEY,
  tweet_id VARCHAR(50) NOT NULL UNIQUE,
  handle_id INTEGER REFERENCES twitter_handles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_handle VARCHAR(100) NOT NULL,
  author_name VARCHAR(255),
  author_profile_image TEXT,
  tweet_url TEXT,
  like_count INTEGER DEFAULT 0,
  retweet_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_relevant BOOLEAN DEFAULT TRUE,
  mentioned_tickers TEXT[] DEFAULT '{}',
  sentiment VARCHAR(20) DEFAULT 'neutral'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_twitter_handles_handle ON twitter_handles(handle);
CREATE INDEX IF NOT EXISTS idx_twitter_handles_active ON twitter_handles(is_active);
CREATE INDEX IF NOT EXISTS idx_twitter_tweets_handle_id ON twitter_tweets(handle_id);
CREATE INDEX IF NOT EXISTS idx_twitter_tweets_posted_at ON twitter_tweets(posted_at);
CREATE INDEX IF NOT EXISTS idx_twitter_tweets_tweet_id ON twitter_tweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_twitter_tweets_mentioned_tickers ON twitter_tweets USING gin(mentioned_tickers);

-- Create function to extract potential stock tickers from tweet content
CREATE OR REPLACE FUNCTION extract_tickers_from_tweet(tweet_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
  tickers TEXT[];
  ticker_pattern TEXT := '\$([A-Z]{1,5})\b';
BEGIN
  -- Extract $ symbols followed by 1-5 capital letters
  SELECT array_agg(DISTINCT matches[1])
  INTO tickers
  FROM (
    SELECT regexp_matches(tweet_content, ticker_pattern, 'g') AS matches
  ) AS ticker_matches;
  
  RETURN COALESCE(tickers, '{}');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically extract tickers when inserting tweets
CREATE OR REPLACE FUNCTION update_tweet_tickers()
RETURNS TRIGGER AS $$
BEGIN
  NEW.mentioned_tickers := extract_tickers_from_tweet(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tweet_tickers
  BEFORE INSERT OR UPDATE ON twitter_tweets
  FOR EACH ROW EXECUTE FUNCTION update_tweet_tickers();

-- Insert some sample Twitter handles (you can modify these)
INSERT INTO twitter_handles (handle, display_name, follower_count) VALUES
('@elonmusk', 'Elon Musk', 150000000),
('@cathiedwood', 'Cathie Wood', 1200000),
('@chamath', 'Chamath Palihapitiya', 1500000),
('@DeItaone', 'Walter Bloomberg', 500000),
('@zerohedge', 'zerohedge', 2000000),
('@jimcramer', 'Jim Cramer', 2000000),
('@GaryBlack00', 'Gary Black', 100000),
('@unusual_whales', 'unusual_whales', 800000)
ON CONFLICT (handle) DO NOTHING;
