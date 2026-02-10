export const dynamic = 'force-dynamic';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

// Crypto symbol to CoinGecko ID mapping
const CRYPTO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'ZRO': 'layerzero',
  'UNI': 'uniswap',
  'REN': 'republic-protocol',
  'HYPE': 'hyperliquid'
};

// Finnhub quote endpoint
async function getQuote(symbol) {
  if (!FINNHUB_KEY) return null;
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.c && data.c > 0) {
      return {
        price: data.c,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        high: data.h,
        low: data.l,
        open: data.o,
        prevClose: data.pc,
        timestamp: data.t,
        source: 'finnhub'
      };
    }
    return null;
  } catch (e) {
    console.error(`Finnhub error for ${symbol}:`, e.message);
    return null;
  }
}

// CoinGecko crypto prices (free, no API key needed)
async function getCryptoPrices(symbols) {
  const results = {};
  const cryptoSymbols = symbols.filter(s => CRYPTO_IDS[s]);
  
  if (cryptoSymbols.length === 0) return results;
  
  const ids = cryptoSymbols.map(s => CRYPTO_IDS[s]).join(',');
  
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { cache: 'no-store' }
    );
    if (!res.ok) return results;
    
    const data = await res.json();
    
    for (const symbol of cryptoSymbols) {
      const id = CRYPTO_IDS[symbol];
      if (data[id]) {
        const price = data[id].usd;
        const change24h = data[id].usd_24h_change || 0;
        results[symbol] = {
          price,
          change: price * (change24h / 100),
          changePercent: change24h,
          prevClose: price / (1 + change24h / 100),
          source: 'coingecko'
        };
      }
    }
  } catch (e) {
    console.error('CoinGecko error:', e.message);
  }
  
  return results;
}

// Batch fetch with rate limiting
async function batchFetchQuotes(symbols) {
  const results = {};
  const uniqueSymbols = [...new Set(symbols)].filter(s => s && !s.includes(' '));
  
  // Separate crypto and stock symbols
  const cryptoSymbols = uniqueSymbols.filter(s => CRYPTO_IDS[s]);
  const stockSymbols = uniqueSymbols.filter(s => 
    !CRYPTO_IDS[s] && !['SPAXX', 'SPRXX', 'FDRXX', 'CASH'].includes(s)
  );
  
  // Fetch crypto prices from CoinGecko (single batch call)
  const cryptoQuotes = await getCryptoPrices(cryptoSymbols);
  Object.assign(results, cryptoQuotes);
  
  // Fetch stock prices from Finnhub (one by one with rate limiting)
  for (const symbol of stockSymbols) {
    const quote = await getQuote(symbol);
    if (quote) {
      results[symbol] = quote;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}

// GET: Fetch current prices for all positions
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const updateDb = searchParams.get('update') === 'true';
  
  if (!FINNHUB_KEY) {
    return Response.json({ 
      error: 'FINNHUB_API_KEY not configured',
      hint: 'Add FINNHUB_API_KEY to environment variables'
    }, { status: 500 });
  }

  try {
    let symbols = [];
    
    if (symbolsParam) {
      symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    } else {
      const [posRes, optRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/positions?select=symbol`, {
          headers: { 'apikey': SUPABASE_ANON }
        }),
        fetch(`${SUPABASE_URL}/rest/v1/options?select=underlying`, {
          headers: { 'apikey': SUPABASE_ANON }
        })
      ]);
      
      const positions = await posRes.json();
      const options = await optRes.json();
      
      symbols = [
        ...positions.map(p => p.symbol),
        ...options.map(o => o.underlying)
      ];
    }

    // Fetch quotes from both sources
    const quotes = await batchFetchQuotes(symbols);
    const fetchedCount = Object.keys(quotes).length;
    
    // Optionally update database with new prices
    if (updateDb && fetchedCount > 0) {
      for (const [symbol, quote] of Object.entries(quotes)) {
        // Update positions table
        await fetch(`${SUPABASE_URL}/rest/v1/positions?symbol=eq.${symbol}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            current_price: quote.price,
            updated_at: new Date().toISOString()
          })
        });
        
        // Update options table (underlying price) for stocks
        if (quote.source === 'finnhub') {
          await fetch(`${SUPABASE_URL}/rest/v1/options?underlying=eq.${symbol}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              underlying_price: quote.price,
              updated_at: new Date().toISOString()
            })
          });
        }
      }
    }

    return Response.json({
      quotes,
      count: fetchedCount,
      requested: symbols.length,
      updated: updateDb,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Prices API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: Refresh prices and update database
export async function POST(request) {
  const url = new URL(request.url);
  url.searchParams.set('update', 'true');
  return GET(new Request(url));
}
