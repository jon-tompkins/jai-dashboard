-- =============================================================================
-- FIX: Add missing columns to trades table and recreate views
-- Run this in Supabase SQL Editor for project lsqlqssigerzghlxfxjl
-- =============================================================================

-- Add missing columns to trades table (IF NOT EXISTS handles already-present columns)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS target_price DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(15, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS target_return DECIMAL(5, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS max_loss DECIMAL(5, 4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_pnl DECIMAL(15, 2);

-- Drop existing views before recreating
DROP VIEW IF EXISTS portfolio_by_theme CASCADE;
DROP VIEW IF EXISTS positions_detailed CASCADE;
DROP VIEW IF EXISTS upcoming_expirations CASCADE;

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

-- Grant access (in case RLS is enabled)
GRANT SELECT ON positions_detailed TO anon;
GRANT SELECT ON portfolio_by_theme TO anon;
GRANT SELECT ON upcoming_expirations TO anon;
