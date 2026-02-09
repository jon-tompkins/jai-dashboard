-- =============================================================================
-- ADD PLAID SUPPORT TO EXISTING TABLES
-- This works with your existing positions table structure
-- =============================================================================

-- =============================================================================
-- STEP 1: Add Plaid columns to existing positions table
-- =============================================================================
ALTER TABLE positions ADD COLUMN IF NOT EXISTS plaid_holding_id TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS plaid_account_id TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS source_account TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS position_type TEXT DEFAULT 'spot';
ALTER TABLE positions ADD COLUMN IF NOT EXISTS option_type TEXT;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS strike_price DECIMAL(15, 2);
ALTER TABLE positions ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS contracts INTEGER;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

CREATE INDEX IF NOT EXISTS idx_positions_plaid_holding_id ON positions(plaid_holding_id);
CREATE INDEX IF NOT EXISTS idx_positions_plaid_account_id ON positions(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_positions_source ON positions(source);

-- =============================================================================
-- STEP 2: Create plaid_accounts table
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
-- STEP 3: Create plaid_holdings table for raw Plaid data
-- =============================================================================
CREATE TABLE IF NOT EXISTS plaid_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_account_id TEXT NOT NULL,
    plaid_security_id TEXT NOT NULL,
    
    -- Security info
    ticker_symbol TEXT,
    name TEXT,
    security_type TEXT,
    
    -- Holding details
    quantity DECIMAL(15, 6) NOT NULL,
    institution_price DECIMAL(15, 4),
    institution_value DECIMAL(15, 2),
    cost_basis DECIMAL(15, 2),
    iso_currency_code TEXT DEFAULT 'USD',
    
    -- Sync metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(plaid_account_id, plaid_security_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_holdings_account ON plaid_holdings(plaid_account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_holdings_ticker ON plaid_holdings(ticker_symbol);

-- =============================================================================
-- STEP 4: Create plaid_securities table
-- =============================================================================
CREATE TABLE IF NOT EXISTS plaid_securities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_security_id TEXT UNIQUE NOT NULL,
    ticker_symbol TEXT,
    name TEXT,
    type TEXT,
    close_price DECIMAL(15, 4),
    close_price_as_of DATE,
    iso_currency_code TEXT DEFAULT 'USD',
    
    -- Option details
    is_option BOOLEAN DEFAULT FALSE,
    option_contract_type TEXT,
    option_expiration_date DATE,
    option_strike_price DECIMAL(15, 2),
    option_underlying_ticker TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaid_securities_ticker ON plaid_securities(ticker_symbol);

-- =============================================================================
-- STEP 5: Add missing columns to trades table
-- =============================================================================
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS target_price DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15, 2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#58a6ff';

-- =============================================================================
-- STEP 6: Create sync log table
-- =============================================================================
CREATE TABLE IF NOT EXISTS plaid_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_item_id TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'started',
    holdings_count INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_plaid_sync_log_item ON plaid_sync_log(plaid_item_id);

-- =============================================================================
-- STEP 7: Enable RLS
-- =============================================================================
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on plaid_accounts" ON plaid_accounts;
CREATE POLICY "Allow all on plaid_accounts" ON plaid_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on plaid_holdings" ON plaid_holdings;
CREATE POLICY "Allow all on plaid_holdings" ON plaid_holdings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on plaid_securities" ON plaid_securities;
CREATE POLICY "Allow all on plaid_securities" ON plaid_securities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on plaid_sync_log" ON plaid_sync_log;
CREATE POLICY "Allow all on plaid_sync_log" ON plaid_sync_log FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON plaid_accounts TO anon;
GRANT ALL ON plaid_holdings TO anon;
GRANT ALL ON plaid_securities TO anon;
GRANT ALL ON plaid_sync_log TO anon;

-- =============================================================================
-- STEP 8: Create view for combined positions (manual + plaid)
-- =============================================================================
DROP VIEW IF EXISTS all_positions CASCADE;
CREATE VIEW all_positions AS
SELECT 
    id,
    symbol,
    name,
    type,
    units as quantity,
    cost_basis,
    current_price,
    market_value as current_value,
    profit_loss,
    profit_loss_pct,
    account,
    COALESCE(source, 'manual') as source,
    plaid_account_id,
    plaid_holding_id,
    status,
    expiry_date,
    option_type,
    strike_price,
    created_at,
    updated_at
FROM positions;

GRANT SELECT ON all_positions TO anon;

-- =============================================================================
-- STEP 9: Updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plaid_accounts_updated_at ON plaid_accounts;
CREATE TRIGGER plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS plaid_holdings_updated_at ON plaid_holdings;
CREATE TRIGGER plaid_holdings_updated_at BEFORE UPDATE ON plaid_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS plaid_securities_updated_at ON plaid_securities;
CREATE TRIGGER plaid_securities_updated_at BEFORE UPDATE ON plaid_securities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- DONE! Plaid tables added alongside existing positions table
-- =============================================================================
