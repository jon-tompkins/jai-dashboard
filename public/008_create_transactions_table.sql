-- Create transactions table for trade history
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_key TEXT UNIQUE,  -- Dedup key
    trade_date DATE NOT NULL,
    broker TEXT NOT NULL,
    account TEXT,
    action TEXT NOT NULL,  -- buy, sell, unknown
    symbol TEXT NOT NULL,
    raw_symbol TEXT,
    description TEXT,
    quantity DECIMAL(15, 6) NOT NULL,
    price DECIMAL(15, 4),
    amount DECIMAL(15, 2),
    commission DECIMAL(10, 2) DEFAULT 0,
    fees DECIMAL(10, 2) DEFAULT 0,
    is_option BOOLEAN DEFAULT FALSE,
    option_type TEXT,  -- call, put
    strike_price DECIMAL(15, 2),
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_broker ON transactions(broker);
CREATE INDEX IF NOT EXISTS idx_transactions_key ON transactions(trade_key);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on transactions" ON transactions;
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON transactions TO anon;
