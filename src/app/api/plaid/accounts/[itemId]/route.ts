import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const { itemId } = params;

    // Get the account to find access token
    const { data: account, error: fetchError } = await supabase
      .from('plaid_accounts')
      .select('plaid_access_token')
      .eq('plaid_item_id', itemId)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Remove from Plaid
    try {
      await plaidClient.itemRemove({
        access_token: account.plaid_access_token,
      });
    } catch (plaidError: any) {
      console.error('Plaid removal error (continuing anyway):', plaidError.message);
    }

    // Delete from our database
    const { error: deleteError } = await supabase
      .from('plaid_accounts')
      .delete()
      .eq('plaid_item_id', itemId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Also delete associated holdings
    await supabase
      .from('plaid_holdings')
      .delete()
      .eq('plaid_account_id', itemId);

    // Mark positions from this account as disconnected (don't delete)
    await supabase
      .from('positions')
      .update({ source: 'manual', plaid_account_id: null })
      .eq('plaid_account_id', itemId);

    return NextResponse.json({ success: true, removed: itemId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
