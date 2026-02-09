import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: accounts, error } = await supabase
      .from('plaid_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Don't expose access tokens
    const safeAccounts = accounts?.map(a => ({
      id: a.id,
      item_id: a.plaid_item_id,
      institution_id: a.institution_id,
      institution_name: a.institution_name,
      account_id: a.account_id,
      account_name: a.account_name,
      account_type: a.account_type,
      account_subtype: a.account_subtype,
      account_mask: a.account_mask,
      status: a.status,
      last_sync: a.last_successful_sync,
      created_at: a.created_at,
    }));

    return NextResponse.json({ accounts: safeAccounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
