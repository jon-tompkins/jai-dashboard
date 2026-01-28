export const dynamic = 'force-dynamic';

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

export async function GET() {
  try {
    const [stocksRes, optionsRes] = await Promise.all([
      fetch(SHEETS.stocks, { cache: 'no-store' }),
      fetch(SHEETS.options, { cache: 'no-store' })
    ]);

    const stocksCSV = await stocksRes.text();
    const optionsCSV = await optionsRes.text();

    const stocksRaw = parseCSV(stocksCSV);
    const optionsRaw = parseCSV(optionsCSV);

    // Process stocks
    const cash = [];
    const equities = [];
    const crypto = [];

    stocksRaw.forEach(row => {
      const item = {
        symbol: row.Symbol,
        name: row.Name,
        price: parseFloat(row.Price) || 0,
        value: parseFloat(row['Market Value']) || 0,
        pl: parseFloat(row['Total Profit/Loss']) || 0,
        plPct: parseFloat(row['Total Profit/Loss (%)']) || 0,
        units: parseFloat(row.Units) || 0,
        cost: parseFloat(row['Average Purchase Price']) || 0,
        type: row.Type
      };

      if (row.Type === 'Open Ended Fund') {
        cash.push(item);
      } else if (row.Exchange === 'COIN') {
        crypto.push(item);
      } else {
        equities.push(item);
      }
    });

    // Process options
    const options = optionsRaw.map(row => ({
      contract: row['Contract Symbol']?.trim(),
      symbol: row.Symbol,
      name: row.Name,
      type: row['Option Type'],
      strike: parseFloat(row['Strike Price']) || 0,
      expiry: row['Expiration Date'],
      price: parseFloat(row.Price) || 0,
      qty: parseFloat(row.Units) || 0,
      value: (parseFloat(row.Price) || 0) * (parseFloat(row.Units) || 0) * 100,
      underlyingPrice: parseFloat(row.UnderPrc) || 0,
      daysToExpiry: parseInt(row['Days till']) || 0,
      status: row['in/out']
    }));

    // Calculate totals
    const cashTotal = cash.reduce((sum, c) => sum + c.value, 0);
    const equitiesTotal = equities.reduce((sum, e) => sum + e.value, 0);
    const cryptoTotal = crypto.reduce((sum, c) => sum + c.value, 0);
    const optionsTotal = options.reduce((sum, o) => sum + o.value, 0);

    return Response.json({
      lastUpdated: new Date().toISOString(),
      summary: {
        cash: cashTotal,
        equities: equitiesTotal,
        crypto: cryptoTotal,
        options: optionsTotal,
        total: cashTotal + equitiesTotal + cryptoTotal + optionsTotal
      },
      cash,
      equities,
      crypto,
      options
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
