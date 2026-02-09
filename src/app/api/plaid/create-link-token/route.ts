import { NextResponse } from 'next/server';
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '@/lib/plaid';

export async function POST() {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'user-1' }, // Single user for now
      client_name: 'Almanack Dashboard',
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
    });

    return NextResponse.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('Error creating link token:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error_message || 'Failed to create link token' },
      { status: 500 }
    );
  }
}
