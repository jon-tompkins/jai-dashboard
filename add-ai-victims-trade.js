// Script to add the new "AI Victims" trade to Supabase
// Run this with: node add-ai-victims-trade.js

const SUPABASE_URL = "https://lsqlqssigerzghlxfxjl.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s";

async function addAITrade() {
  try {
    // First, create the trade
    const tradeResponse = await fetch(`${SUPABASE_URL}/rest/v1/trades`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: 'ai-victims',
        name: 'AI Victims',
        direction: 'short',
        timeframe: 'medium',
        status: 'active',
        conviction: 4,
        thesis: 'Betting against companies that are vulnerable to AI disruption - Oracle (database), Duolingo (language learning), Adobe (creative tools)',
        entry_signals: ['AI competition', 'Market share loss', 'Legacy tech'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!tradeResponse.ok) {
      throw new Error(`Failed to create trade: ${tradeResponse.status}`);
    }

    console.log('✅ AI Victims trade created successfully');

    // Now add the positions
    const positions = [
      {
        trade_id: 'ai-victims',
        symbol: 'ORCL',
        role: 'position',
        created_at: new Date().toISOString()
      },
      {
        trade_id: 'ai-victims',
        symbol: 'DUOL',
        role: 'position',
        created_at: new Date().toISOString()
      },
      {
        trade_id: 'ai-victims',
        symbol: 'ADBE',
        role: 'position',
        created_at: new Date().toISOString()
      }
    ];

    for (const position of positions) {
      const positionResponse = await fetch(`${SUPABASE_URL}/rest/v1/trade_positions`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(position)
      });

      if (!positionResponse.ok) {
        console.error(`Failed to add position ${position.symbol}: ${positionResponse.status}`);
      } else {
        console.log(`✅ Added position: ${position.symbol}`);
      }
    }

    console.log('🎉 All done! AI Victims trade has been added with ORCL, DUOL, and ADBE positions.');

  } catch (error) {
    console.error('Error adding AI Victims trade:', error);
  }
}

addAITrade();