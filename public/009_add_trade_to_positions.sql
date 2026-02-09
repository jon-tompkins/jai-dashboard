-- Migration: Add trade_id columns to positions and options tables
-- Run this on your Supabase database

-- Add trade_id to positions table
ALTER TABLE positions ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id);

-- Add trade_id to options table  
ALTER TABLE options ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_positions_trade_id ON positions(trade_id);
CREATE INDEX IF NOT EXISTS idx_options_trade_id ON options(trade_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'positions' AND column_name = 'trade_id';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'options' AND column_name = 'trade_id';