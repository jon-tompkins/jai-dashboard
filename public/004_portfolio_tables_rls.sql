-- =====================================================
-- Portfolio Tables with Row Level Security
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Create positions table (stocks, crypto, cash)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  type TEXT CHECK (type IN ('equity', 'crypto', 'cash', 'fund')),
  units DECIMAL(18, 8),
  cost_basis DECIMAL(18, 4),
  current_price DECIMAL(18, 4),
  market_value DECIMAL(18, 4),
  profit_loss DECIMAL(18, 4),
  profit_loss_pct DECIMAL(8, 4),
  account TEXT, -- 'fidelity', 'etrade', 'coinbase'
  exchange TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create options table (separate due to extra fields)
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_symbol TEXT,
  underlying TEXT NOT NULL,
  name TEXT,
  option_type TEXT CHECK (option_type IN ('call', 'put')),
  strike DECIMAL(10, 2),
  expiry DATE,
  qty INTEGER,
  price DECIMAL(10, 4),
  market_value DECIMAL(18, 4),
  underlying_price DECIMAL(10, 4),
  days_to_expiry INTEGER,
  status TEXT, -- 'ITM', 'OTM', 'ATM'
  notional DECIMAL(18, 4),
  account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create portfolio_snapshots table (for historical tracking)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  cash_total DECIMAL(18, 4),
  equities_total DECIMAL(18, 4),
  crypto_total DECIMAL(18, 4),
  options_total DECIMAL(18, 4),
  total_value DECIMAL(18, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Positions: Users can only see/modify their own
CREATE POLICY "Users can view own positions" ON positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions" ON positions
  FOR DELETE USING (auth.uid() = user_id);

-- Options: Users can only see/modify their own
CREATE POLICY "Users can view own options" ON options
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own options" ON options
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own options" ON options
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own options" ON options
  FOR DELETE USING (auth.uid() = user_id);

-- Snapshots: Users can only see/modify their own
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" ON portfolio_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots" ON portfolio_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots" ON portfolio_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_type ON positions(type);

CREATE INDEX IF NOT EXISTS idx_options_user_id ON options(user_id);
CREATE INDEX IF NOT EXISTS idx_options_underlying ON options(underlying);
CREATE INDEX IF NOT EXISTS idx_options_expiry ON options(expiry);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date);

-- =====================================================
-- Helper function to update timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS positions_updated_at ON positions;
CREATE TRIGGER positions_updated_at
  BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS options_updated_at ON options;
CREATE TRIGGER options_updated_at
  BEFORE UPDATE ON options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Done! Tables are now RLS-protected.
-- Only authenticated users can see their own data.
-- =====================================================
