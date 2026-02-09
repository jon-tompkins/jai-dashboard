import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { item_id } = await request.json().catch(() => ({}));

    // Get all active Plaid accounts (or specific one if item_id provided)
    let query = supabase.from('plaid_accounts').select('*').eq('status', 'active');
    if (item_id) {
      query = query.eq('plaid_item_id', item_id);
    }
    
    const { data: accounts, error: accountsError } = await query;
    
    if (accountsError || !accounts?.length) {
      return NextResponse.json({ 
        error: 'No active Plaid accounts found',
        details: accountsError?.message 
      }, { status: 404 });
    }

    const results: any[] = [];
    
    // Process each unique item (access token)
    const processedItems = new Set<string>();
    
    for (const account of accounts) {
      if (processedItems.has(account.plaid_item_id)) continue;
      processedItems.add(account.plaid_item_id);

      // Log sync start
      const { data: syncLog } = await supabase.from('plaid_sync_log').insert({
        plaid_item_id: account.plaid_item_id,
        sync_type: 'holdings',
        status: 'started',
      }).select().single();

      try {
        // Fetch holdings from Plaid
        const holdingsResponse = await plaidClient.investmentsHoldingsGet({
          access_token: account.plaid_access_token,
        });

        const { holdings, securities, accounts: plaidAccounts } = holdingsResponse.data;

        // Upsert securities
        for (const security of securities) {
          await supabase.from('plaid_securities').upsert({
            plaid_security_id: security.security_id,
            ticker_symbol: security.ticker_symbol,
            name: security.name,
            type: security.type,
            close_price: security.close_price,
            close_price_as_of: security.close_price_as_of,
            iso_currency_code: security.iso_currency_code,
            is_option: security.type === 'derivative',
          }, { onConflict: 'plaid_security_id' });
        }

        // Upsert holdings
        for (const holding of holdings) {
          const security = securities.find(s => s.security_id === holding.security_id);
          
          await supabase.from('plaid_holdings').upsert({
            plaid_account_id: holding.account_id,
            plaid_security_id: holding.security_id,
            ticker_symbol: security?.ticker_symbol,
            name: security?.name,
            security_type: security?.type,
            quantity: holding.quantity,
            institution_price: holding.institution_price,
            institution_value: holding.institution_value,
            cost_basis: holding.cost_basis,
            iso_currency_code: holding.iso_currency_code,
            last_synced_at: new Date().toISOString(),
            raw_data: holding,
          }, { onConflict: 'plaid_account_id,plaid_security_id' });

          // Also sync to main positions table
          if (security?.ticker_symbol) {
            await supabase.from('positions').upsert({
              symbol: security.ticker_symbol,
              name: security.name,
              type: security.type === 'equity' ? 'equity' : 
                    security.type === 'etf' ? 'etf' : 
                    security.type === 'mutual fund' ? 'fund' : 'equity',
              units: holding.quantity,
              cost_basis: holding.cost_basis ? holding.cost_basis / holding.quantity : null,
              current_price: holding.institution_price,
              market_value: holding.institution_value,
              profit_loss: holding.cost_basis ? holding.institution_value - holding.cost_basis : null,
              profit_loss_pct: holding.cost_basis ? 
                (holding.institution_value - holding.cost_basis) / holding.cost_basis : null,
              account: account.institution_name,
              source: 'plaid',
              plaid_account_id: holding.account_id,
              plaid_holding_id: `${holding.account_id}-${holding.security_id}`,
            }, { 
              onConflict: 'symbol',
              ignoreDuplicates: false,
            });
          }
        }

        // Update sync log
        await supabase.from('plaid_sync_log').update({
          status: 'completed',
          holdings_count: holdings.length,
          completed_at: new Date().toISOString(),
        }).eq('id', syncLog?.id);

        // Update last sync time
        await supabase.from('plaid_accounts')
          .update({ last_successful_sync: new Date().toISOString() })
          .eq('plaid_item_id', account.plaid_item_id);

        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          holdings_count: holdings.length,
          securities_count: securities.length,
          status: 'success',
        });

      } catch (error: any) {
        // Update sync log with error
        await supabase.from('plaid_sync_log').update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString(),
        }).eq('id', syncLog?.id);

        results.push({
          item_id: account.plaid_item_id,
          institution: account.institution_name,
          status: 'error',
          error: error.response?.data?.error_message || error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      results,
    });

  } catch (error: any) {
    console.error('Error syncing holdings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync holdings' },
      { status: 500 }
    );
  }
}

// GET to trigger sync without body
export async function GET() {
  return POST(new Request('http://localhost', { method: 'POST' }) as NextRequest);
}
