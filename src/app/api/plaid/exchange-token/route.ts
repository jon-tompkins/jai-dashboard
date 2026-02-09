import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { public_token, institution } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: 'public_token required' }, { status: 400 });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const accounts = accountsResponse.data.accounts;

    // Store in database - one row per account
    for (const account of accounts) {
      const { error } = await supabase.from('plaid_accounts').upsert({
        plaid_item_id: item_id,
        plaid_access_token: access_token, // TODO: encrypt this
        institution_id: institution?.institution_id || 'unknown',
        institution_name: institution?.name || 'Unknown Institution',
        account_id: account.account_id,
        account_name: account.name,
        account_type: account.type,
        account_subtype: account.subtype,
        account_mask: account.mask,
        status: 'active',
      }, {
        onConflict: 'plaid_item_id',
      });

      if (error) {
        console.error('Error storing account:', error);
      }
    }

    return NextResponse.json({
      success: true,
      item_id,
      institution: institution?.name,
      accounts: accounts.map(a => ({
        id: a.account_id,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
      })),
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
