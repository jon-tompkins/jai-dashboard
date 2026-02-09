-- =============================================================================
-- ADD TRADE TAGGING TO POSITIONS
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Add trade_id to positions table (TEXT to match trades.id)
ALTER TABLE positions ADD COLUMN IF NOT EXISTS trade_id TEXT REFERENCES trades(id);
CREATE INDEX IF NOT EXISTS idx_positions_trade_id ON positions(trade_id);

-- Add trade_id to options table
ALTER TABLE options ADD COLUMN IF NOT EXISTS trade_id TEXT REFERENCES trades(id);
CREATE INDEX IF NOT EXISTS idx_options_trade_id ON options(trade_id);

-- Grant permissions
GRANT ALL ON positions TO anon;
GRANT ALL ON options TO anon;
