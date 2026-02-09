# Builder Spec: Positions Tab & Trade Management

## Overview
Add a Positions tab to jai-dashboard with trade tagging, and enhance the Trades tab with list view and trade creation.

## Current State
- `app/page.js` - Main dashboard (single-file React)
- `app/api/portfolio/route.js` - Fetches positions + options from Supabase
- `app/api/trades/route.js` - Fetches trades + trade_positions
- Supabase tables: `positions`, `options`, `trades`, `trade_positions`

## Requirements

### 1. New "Positions" Tab
Create a new tab showing ALL positions (equities + options) in a flat list:
- Columns: Symbol, Type (equity/option/crypto), Qty/Contracts, Price, Value, P&L, **Trade** (dropdown)
- **Trade dropdown**: Allow selecting from existing trades OR "No Trade"
- When trade is selected, update the `positions` table with a `trade_id` column (add if missing)
- Include options from the `options` table merged into this view
- Sortable columns

### 2. Trades Tab Enhancements

#### 2a. Add New Trade Form
- Simple form to create new trades
- Fields: Name, Thesis, Direction (long/short), Timeframe, Conviction (1-5), Status
- POST to `/api/trades`

#### 2b. Trade List View
Add a toggle between current "Card View" and new "List View":

**List View shows:**
- Trade name
- Total market value
- Equity/Options ratio bar
- Expandable rows that show underlying positions grouped by symbol

**Grouping logic:**
- Group positions by underlying symbol (LAC stock + LAC calls + LAC puts = one group)
- For options: extract underlying from contract symbol (e.g., `-LAC270115C10` → LAC)
- Show group total, then expandable to see individual positions

**"No Trade" section:**
- All positions without a trade_id grouped under "No Trade"
- Same grouping by underlying symbol

### 3. Database Changes
Add migration if needed:
```sql
-- Add trade_id to positions table
ALTER TABLE positions ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id);
ALTER TABLE options ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id);
CREATE INDEX IF NOT EXISTS idx_positions_trade_id ON positions(trade_id);
CREATE INDEX IF NOT EXISTS idx_options_trade_id ON options(trade_id);
```

### 4. API Changes
- `GET /api/positions` - Return all positions + options combined with trade info
- `PATCH /api/positions/:id` - Update position's trade_id
- `POST /api/trades` - Create new trade
- Update `GET /api/trades` to include unassigned positions for "No Trade" group

## Styling
Follow existing GitHub-dark theme in page.js:
- Background: #0d1117, #161b22
- Borders: #30363d
- Text: #e6edf3, #8b949e
- Green: #3fb950, Red: #f85149, Yellow: #d29922

## Files to Modify
1. `app/page.js` - Add Positions tab, enhance Trades tab
2. `app/api/positions/route.js` - NEW: Combined positions endpoint
3. `app/api/trades/route.js` - Add POST, enhance GET
4. `public/009_add_trade_to_positions.sql` - Migration for trade_id columns

## Deliverable
Working code + SQL migration file in `public/` for Jon to run.
