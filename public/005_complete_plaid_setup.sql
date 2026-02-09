-- =============================================================================
-- COMPLETE PLAID SETUP - Run this entire file in Supabase SQL Editor
-- Project: lsqlqssigerzghlxfxjl
-- =============================================================================

-- =============================================================================
-- STEP 1: Fix trades table - add missing columns
-- =============================================================================
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS target_price DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS target_return DECIMAL(5, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS max_loss DECIMAL(5, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#58a6ff';

-- =============================================================================
-- STEP 2: Drop existing views (clean slate)
-- =============================================================================
DROP VIEW IF EXISTS portfolio_by_theme CASCADE;
DROP VIEW IF EXISTS positions_detailed CASCADE;
DROP VIEW IF EXISTS upcoming_expirations CASCADE;

-- =============================================================================
-- STEP 3: Ensure symbols table exists
-- =============================================================================
CREATE TABLE IF NOT EXISTS symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    asset_class TEXT NOT NULL DEFAULT 'equity' 
        CHECK (asset_class IN ('equity', 'crypto', 'option', 'future', 'cash', 'etf', 'fund')),
    industry TEXT,
    sector TEXT,
    underlying_symbol TEXT,
    exchange TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symbols_symbol ON symbols(symbol);
CREATE INDEX IF NOT EXISTS idx_symbols_asset_class ON symbols(asset_class);
CREATE INDEX IF NOT EXISTS idx_symbols_tags ON symbols USING GIN(tags);

-- =============================================================================
-- STEP 4: Ensure positions table exists with Plaid fields
-- =============================================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol_id UUID REFERENCES symbols(id) ON DELETE RESTRICT,
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    position_type TEXT NOT NULL DEFAULT 'spot' 
        CHECK (position_type IN ('spot', 'option', 'future', 'crypto', 'margin')),
    source TEXT NOT NULL DEFAULT 'manual' 
        CHECK (source IN ('manual', 'plaid', 'sheets', 'api')),
    source_account TEXT,
    quantity DECIMAL(15, 6) NOT NULL,
    cost_basis DECIMAL(15, 4),
    total_cost DECIMAL(15, 2),
    current_price DECIMAL(15, 4),
    current_value DECIMAL(15, 2),
    last_price_update TIMESTAMPTZ,
    option_type TEXT CHECK (option_type IN ('call', 'put', NULL)),
    strike_price DECIMAL(15, 2),
    expiry_date DATE,
    contracts INTEGER,
    target_price DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'closed', 'pending')),
    entry_date DATE,
    exit_date DATE,
    exit_price DECIMAL(15, 4),
    notes TEXT,
    plaid_holding_id TEXT,
    plaid_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_positions_symbol_id ON positions(symbol_id);
CREATE INDEX IF NOT EXISTS idx_positions_trade_id ON positions(trade_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_source ON positions(source);
CREATE INDEX IF NOT EXISTS idx_positions_plaid_holding_id ON positions(plaid_holding_id);

-- =============================================================================
-- STEP 5: Plaid accounts table
-- =============================================================================
CREATE TABLE IF NOT EXISTS plaid_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_item_id TEXT NOT NULL UNIQUE,
    plaid_access_token TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    account_type TEXT,
    account_subtype TEXT,
    account_mask TEXT,
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'error', 'pending_reauth')),
    error_message TEXT,
    last_successful_sync TIMESTAMPTZ,
    sync_cursor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON plaid_accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_status ON plaid_accounts(status);

-- =============================================================================
-- STEP 6: Position history for tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 4),
    value DECIMAL(15, 2),
    cost_basis DECIMAL(15, 4),
    source TEXT DEFAULT 'sync',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(position_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_position_history_position_id ON position_history(position_id);
CREATE INDEX IF NOT EXISTS idx_position_history_date ON position_history(snapshot_date);

-- =============================================================================
-- STEP 7: Portfolio snapshots for performance
-- =============================================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_value DECIMAL(15, 2) DEFAULT 0,
    equity_value DECIMAL(15, 2) DEFAULT 0,
    crypto_value DECIMAL(15, 2) DEFAULT 0,
    options_value DECIMAL(15, 2) DEFAULT 0,
    day_change DECIMAL(15, 2),
    day_change_pct DECIMAL(8, 4),
    total_cost_basis DECIMAL(15, 2),
    total_pnl DECIMAL(15, 2),
    total_pnl_pct DECIMAL(8, 4),
    theme_breakdown JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- =============================================================================
-- STEP 8: Custom lists
-- =============================================================================
CREATE TABLE IF NOT EXISTS custom_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#58a6ff',
    icon TEXT DEFAULT 'folder',
    list_type TEXT NOT NULL DEFAULT 'manual' 
        CHECK (list_type IN ('manual', 'smart')),
    filter_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
    symbol_id UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, symbol_id)
);

CREATE INDEX IF NOT EXISTS idx_list_symbols_list_id ON list_symbols(list_id);
CREATE INDEX IF NOT EXISTS idx_list_symbols_symbol_id ON list_symbols(symbol_id);

-- =============================================================================
-- STEP 9: Create views
-- =============================================================================
CREATE OR REPLACE VIEW positions_detailed AS
SELECT 
    p.*,
    s.symbol,
    s.name as symbol_name,
    s.asset_class,
    s.industry,
    s.sector,
    s.tags as symbol_tags,
    t.name as trade_name,
    t.thesis as trade_thesis,
    t.theme as trade_theme,
    t.status as trade_status,
    COALESCE(p.current_value, 0) - COALESCE(p.total_cost, 0) as unrealized_pnl,
    CASE WHEN p.total_cost > 0 
         THEN (COALESCE(p.current_value, 0) - COALESCE(p.total_cost, 0)) / p.total_cost 
         ELSE 0 
    END as unrealized_pnl_pct
FROM positions p
JOIN symbols s ON p.symbol_id = s.id
LEFT JOIN trades t ON p.trade_id = t.id;

CREATE OR REPLACE VIEW portfolio_by_theme AS
SELECT 
    COALESCE(t.theme, 'unassigned') as theme,
    COUNT(DISTINCT p.id) as position_count,
    SUM(p.current_value) as total_value,
    SUM(p.total_cost) as total_cost,
    SUM(COALESCE(p.current_value, 0) - COALESCE(p.total_cost, 0)) as total_pnl
FROM positions p
LEFT JOIN trades t ON p.trade_id = t.id
WHERE p.status = 'open'
GROUP BY t.theme;

CREATE OR REPLACE VIEW upcoming_expirations AS
SELECT 
    p.*,
    s.symbol,
    p.expiry_date - CURRENT_DATE as days_to_expiry
FROM positions p
JOIN symbols s ON p.symbol_id = s.id
WHERE p.position_type = 'option'
  AND p.status = 'open'
  AND p.expiry_date IS NOT NULL
ORDER BY p.expiry_date ASC;

-- =============================================================================
-- STEP 10: Enable RLS and grant access
-- =============================================================================
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_symbols ENABLE ROW LEVEL SECURITY;

-- Allow all for single-user dashboard
CREATE POLICY IF NOT EXISTS "Allow all on symbols" ON symbols FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on positions" ON positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on plaid_accounts" ON plaid_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on position_history" ON position_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on portfolio_snapshots" ON portfolio_snapshots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on custom_lists" ON custom_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on list_symbols" ON list_symbols FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON symbols TO anon;
GRANT ALL ON positions TO anon;
GRANT ALL ON plaid_accounts TO anon;
GRANT ALL ON position_history TO anon;
GRANT ALL ON portfolio_snapshots TO anon;
GRANT ALL ON custom_lists TO anon;
GRANT ALL ON list_symbols TO anon;
GRANT SELECT ON positions_detailed TO anon;
GRANT SELECT ON portfolio_by_theme TO anon;
GRANT SELECT ON upcoming_expirations TO anon;

-- =============================================================================
-- STEP 11: Updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS symbols_updated_at ON symbols;
CREATE TRIGGER symbols_updated_at BEFORE UPDATE ON symbols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS positions_updated_at ON positions;
CREATE TRIGGER positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS plaid_accounts_updated_at ON plaid_accounts;
CREATE TRIGGER plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- DONE! All tables and views created for Plaid integration
-- =============================================================================
