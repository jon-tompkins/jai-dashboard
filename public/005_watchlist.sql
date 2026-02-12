-- User watchlist for tracking specific tickers
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Tweets fetched for watchlist tickers
CREATE TABLE IF NOT EXISTS watchlist_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) NOT NULL,
  tweet_id VARCHAR(30) NOT NULL UNIQUE,
  author_handle VARCHAR(50) NOT NULL,
  author_name VARCHAR(100),
  author_followers INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL,
  likes INTEGER DEFAULT 0,
  retweets INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watchlist_tweets_ticker ON watchlist_tweets(ticker);
CREATE INDEX IF NOT EXISTS idx_watchlist_tweets_posted ON watchlist_tweets(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_tweets_quality ON watchlist_tweets(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist(user_id);
