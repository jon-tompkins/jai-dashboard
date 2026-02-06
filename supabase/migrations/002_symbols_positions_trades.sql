-- Almanack Dashboard: Symbol → Position → Trade Schema
-- Migration: 002_symbols_positions_trades.sql
-- This migration creates the core data model for portfolio management

-- =============================================================================
-- SYMBOLS TABLE
-- Master list of all tradeable symbols with metadata
-- =============================================================================
CREATE TABLE IF NOT EXISTS symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Symbol identification
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    
    -- Classification
    asset_class TEXT NOT NULL DEFAULT 'equity' 
        CHECK (asset_class IN ('equity', 'crypto', 'option', 'future', 'cash', 'etf', 'fund')),
    
    -- Metadata
    industry TEXT,
    sector TEXT,
    underlying_symbol TEXT,  -- For options/derivatives, the underlying asset
    exchange TEXT,
    
    -- Custom tags (stored as JSONB array for flexibility)
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_symbols_symbol ON symbols(symbol);
CREATE INDEX IF NOT EXISTS idx_symbols_asset_class ON symbols(asset_class);
CREATE INDEX IF NOT EXISTS idx_symbols_industry ON symbols(industry);
CREATE INDEX IF NOT EXISTS idx_symbols_sector ON symbols(sector);
CREATE INDEX IF NOT EXISTS idx_symbols_tags ON symbols USING GIN(tags);

-- =============================================================================
-- CUSTOM LISTS TABLE
-- User-defined groupings of symbols (e.g., "Uranium Plays", "AI Victims")
-- =============================================================================
CREATE TABLE IF NOT EXISTS custom_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#58a6ff',  -- Hex color for UI display
    icon TEXT DEFAULT 'folder',     -- Icon name for UI
    
    -- List type
    list_type TEXT NOT NULL DEFAULT 'manual' 
        CHECK (list_type IN ('manual', 'smart')),  -- smart = rule-based auto-population
    
    -- For smart lists: filter rules
    filter_rules JSONB,  -- e.g., {"sector": "Energy", "tags": ["uranium"]}
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LIST SYMBOLS TABLE (Junction table)
-- Many-to-many relationship between lists and symbols
-- =============================================================================
CREATE TABLE IF NOT EXISTS list_symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
    symbol_id UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
    
    -- Optional ordering within list
    sort_order INTEGER DEFAULT 0,
    
    -- Notes specific to this symbol in this list
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(list_id, symbol_id)
);

CREATE INDEX IF NOT EXISTS idx_list_symbols_list_id ON list_symbols(list_id);
CREATE INDEX IF NOT EXISTS idx_list_symbols_symbol_id ON list_symbols(symbol_id);

-- =============================================================================
-- TRADES TABLE
-- Represents a trading thesis/strategy grouping positions
-- =============================================================================
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trade identification
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'closed', 'partial')),
    
    -- Thesis and notes
    thesis TEXT,           -- Investment thesis
    entry_notes TEXT,      -- Why entering
    exit_notes TEXT,       -- Why exiting (for closed trades)
    
    -- Targets
    target_price DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    target_return DECIMAL(5, 4),  -- As decimal, e.g., 0.25 = 25%
    max_loss DECIMAL(5, 4),       -- As decimal
    
    -- Dates
    entry_date DATE,
    exit_date DATE,
    
    -- Theme/category (for grouping trades)
    theme TEXT,  -- e.g., "uranium-nuclear", "ai-victims", "hedges"
    color TEXT DEFAULT '#58a6ff',  -- For UI display
    
    -- Performance metrics (calculated)
    realized_pnl DECIMAL(15, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_theme ON trades(theme);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date);

-- =============================================================================
-- POSITIONS TABLE
-- Individual line items (holdings) - the core of the portfolio
-- =============================================================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Symbol reference
    symbol_id UUID NOT NULL REFERENCES symbols(id) ON DELETE RESTRICT,
    
    -- Optional trade grouping (NULL = not assigned to a trade)
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    
    -- Position type
    position_type TEXT NOT NULL DEFAULT 'spot' 
        CHECK (position_type IN ('spot', 'option', 'future', 'crypto', 'margin')),
    
    -- Source of data
    source TEXT NOT NULL DEFAULT 'manual' 
        CHECK (source IN ('manual', 'plaid', 'sheets', 'api')),
    source_account TEXT,  -- Account name/ID for tracking
    
    -- Position details
    quantity DECIMAL(15, 6) NOT NULL,
    cost_basis DECIMAL(15, 4),          -- Per-unit cost
    total_cost DECIMAL(15, 2),          -- Total cost basis
    
    -- Current pricing (updated by sync)
    current_price DECIMAL(15, 4),
    current_value DECIMAL(15, 2),
    last_price_update TIMESTAMPTZ,
    
    -- For options
    option_type TEXT CHECK (option_type IN ('call', 'put', NULL)),
    strike_price DECIMAL(15, 2),
    expiry_date DATE,
    contracts INTEGER,  -- Number of contracts (each = 100 shares usually)
    
    -- Position-level targets (override trade-level if set)
    target_price DECIMAL(15, 4),
    stop_loss DECIMAL(15, 4),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'closed', 'pending')),
    
    -- Entry/exit dates
    entry_date DATE,
    exit_date DATE,
    exit_price DECIMAL(15, 4),
    
    -- Notes
    notes TEXT,
    
    -- External IDs (for Plaid integration)
    plaid_holding_id TEXT,
    plaid_account_id TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_positions_symbol_id ON positions(symbol_id);
CREATE INDEX IF NOT EXISTS idx_positions_trade_id ON positions(trade_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_source ON positions(source);
CREATE INDEX IF NOT EXISTS idx_positions_expiry_date ON positions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_positions_plaid_holding_id ON positions(plaid_holding_id);

-- =============================================================================
-- PLAID LINKED ACCOUNTS TABLE
-- Stores Plaid access tokens and account metadata
-- =============================================================================
CREATE TABLE IF NOT EXISTS plaid_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plaid identifiers
    plaid_item_id TEXT NOT NULL UNIQUE,
    plaid_access_token TEXT NOT NULL,  -- ENCRYPTED AT APPLICATION LEVEL
    
    -- Institution info
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    
    -- Account details
    account_id TEXT NOT NULL,
    account_name TEXT,
    account_type TEXT,
    account_subtype TEXT,
    account_mask TEXT,  -- Last 4 digits
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'error', 'pending_reauth')),
    error_message TEXT,
    
    -- Sync info
    last_successful_sync TIMESTAMPTZ,
    sync_cursor TEXT,  -- For incremental syncs
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plaid_accounts_item_id ON plaid_accounts(plaid_item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_accounts_status ON plaid_accounts(status);

-- =============================================================================
-- POSITION HISTORY TABLE
-- Track position changes over time for charting
-- =============================================================================
CREATE TABLE IF NOT EXISTS position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    
    -- Snapshot data
    snapshot_date DATE NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 4),
    value DECIMAL(15, 2),
    cost_basis DECIMAL(15, 4),
    
    -- Source of snapshot
    source TEXT DEFAULT 'sync',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(position_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_position_history_position_id ON position_history(position_id);
CREATE INDEX IF NOT EXISTS idx_position_history_date ON position_history(snapshot_date);

-- =============================================================================
-- PORTFOLIO SNAPSHOTS TABLE
-- Daily portfolio-level snapshots for performance tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    snapshot_date DATE NOT NULL UNIQUE,
    
    -- Totals
    total_value DECIMAL(15, 2) NOT NULL,
    cash_value DECIMAL(15, 2) DEFAULT 0,
    equity_value DECIMAL(15, 2) DEFAULT 0,
    crypto_value DECIMAL(15, 2) DEFAULT 0,
    options_value DECIMAL(15, 2) DEFAULT 0,
    
    -- Day's performance
    day_change DECIMAL(15, 2),
    day_change_pct DECIMAL(8, 4),
    
    -- Cumulative performance
    total_cost_basis DECIMAL(15, 2),
    total_pnl DECIMAL(15, 2),
    total_pnl_pct DECIMAL(8, 4),
    
    -- Breakdown by theme (JSONB for flexibility)
    theme_breakdown JSONB,  -- {"uranium": 25000, "crypto": 15000, ...}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (single-user dashboard)
-- Adjust these for production multi-user setup
CREATE POLICY "Allow all on symbols" ON symbols FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on custom_lists" ON custom_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on list_symbols" ON list_symbols FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on trades" ON trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on positions" ON positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plaid_accounts" ON plaid_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on position_history" ON position_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on portfolio_snapshots" ON portfolio_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON symbols TO anon;
GRANT ALL ON custom_lists TO anon;
GRANT ALL ON list_symbols TO anon;
GRANT ALL ON trades TO anon;
GRANT ALL ON positions TO anon;
GRANT ALL ON plaid_accounts TO anon;
GRANT ALL ON position_history TO anon;
GRANT ALL ON portfolio_snapshots TO anon;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER symbols_updated_at BEFORE UPDATE ON symbols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER custom_lists_updated_at BEFORE UPDATE ON custom_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER plaid_accounts_updated_at BEFORE UPDATE ON plaid_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View: Positions with symbol details and trade info
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
    -- Calculated fields
    COALESCE(p.current_value, 0) - COALESCE(p.total_cost, 0) as unrealized_pnl,
    CASE WHEN p.total_cost > 0 
         THEN (COALESCE(p.current_value, 0) - COALESCE(p.total_cost, 0)) / p.total_cost 
         ELSE 0 
    END as unrealized_pnl_pct
FROM positions p
JOIN symbols s ON p.symbol_id = s.id
LEFT JOIN trades t ON p.trade_id = t.id;

-- View: Portfolio summary by theme
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

-- View: Upcoming option expirations
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
