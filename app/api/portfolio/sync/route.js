export const dynamic = 'force-dynamic';

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

const SHEETS = {
  stocks: 'https://docs.google.com/spreadsheets/d/1mNJ51mIRjcaBKHJpyQKHr_DrMnKnaN8nK1kwRfcQw44/export?format=csv&gid=1179985516',
  options: 'https://docs.google.com/spreadsheets/d/1mNJ51mIRjcaBKHJpyQKHr_DrMnKnaN8nK1kwRfcQw44/export?format=csv&gid=163011260'
};

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
    return obj;
  });
}

// POST /api/portfolio/sync - Sync from Google Sheets to Supabase
export async function POST(request) {
  try {
    // Fetch from Sheets
    const [stocksRes, optionsRes] = await Promise.all([
      fetch(SHEETS.stocks, { cache: 'no-store' }),
      fetch(SHEETS.options, { cache: 'no-store' })
    ]);

    const stocksCSV = await stocksRes.text();
    const optionsCSV = await optionsRes.text();

    const stocksRaw = parseCSV(stocksCSV);
    const optionsRaw = parseCSV(optionsCSV);

    // Clear existing data
    await fetch(`${SUPABASE_URL}/rest/v1/positions?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { 
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json'
      }
    });

    await fetch(`${SUPABASE_URL}/rest/v1/options?id=neq.00000000-0000-0000-0000-000000000000`, {
      method: 'DELETE',
      headers: { 
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json'
      }
    });

    // Transform and insert positions
    const positions = stocksRaw.map(row => {
      let type = 'equity';
      if (row.Type === 'Open Ended Fund') type = 'fund';
      else if (row.Exchange === 'COIN') type = 'crypto';
      
      return {
        symbol: row.Symbol,
        name: row.Name,
        type: type,
        units: parseFloat(row.Units) || 0,
        cost_basis: parseFloat(row['Average Purchase Price']) || 0,
        current_price: parseFloat(row.Price) || 0,
        market_value: parseFloat(row['Market Value']) || 0,
        profit_loss: parseFloat(row['Total Profit/Loss']) || 0,
        profit_loss_pct: parseFloat(row['Total Profit/Loss (%)']) || 0,
        account: row.Account || 'default',
        exchange: row.Exchange
      };
    }).filter(p => p.symbol); // Remove empty rows

    if (positions.length > 0) {
      const posRes = await fetch(`${SUPABASE_URL}/rest/v1/positions`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(positions)
      });
      
      if (!posRes.ok) {
        const err = await posRes.text();
        throw new Error(`Failed to insert positions: ${err}`);
      }
    }

    // Transform and insert options
    const options = optionsRaw.map(row => {
      // Parse expiry date
      let expiry = null;
      if (row['Expiration Date']) {
        const parts = row['Expiration Date'].split('/');
        if (parts.length === 3) {
          expiry = `20${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }
      
      return {
        contract_symbol: row['Contract Symbol']?.trim(),
        underlying: row.Symbol,
        name: row.Name,
        option_type: row['Option Type']?.toLowerCase(),
        strike: parseFloat(row['Strike Price']) || 0,
        expiry: expiry,
        qty: parseInt(row.Units) || 0,
        price: parseFloat(row.Price) || 0,
        market_value: (parseFloat(row.Price) || 0) * (parseInt(row.Units) || 0) * 100,
        underlying_price: parseFloat(row.UnderPrc) || 0,
        days_to_expiry: parseInt(row['Days till']) || 0,
        status: row['in/out'],
        notional: (parseInt(row.Units) || 0) * (parseFloat(row.UnderPrc) || 0) * 100,
        account: row.Account || 'default'
      };
    }).filter(o => o.underlying); // Remove empty rows

    if (options.length > 0) {
      const optRes = await fetch(`${SUPABASE_URL}/rest/v1/options`, {
        method: 'POST',
        headers: { 
          'apikey': SUPABASE_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(options)
      });
      
      if (!optRes.ok) {
        const err = await optRes.text();
        throw new Error(`Failed to insert options: ${err}`);
      }
    }

    return Response.json({
      success: true,
      synced: {
        positions: positions.length,
        options: options.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET - Show sync status/info
export async function GET() {
  return Response.json({
    endpoint: '/api/portfolio/sync',
    method: 'POST',
    description: 'Syncs portfolio data from Google Sheets to Supabase',
    usage: 'POST to this endpoint to sync. Data will be replaced, not merged.'
  });
}
