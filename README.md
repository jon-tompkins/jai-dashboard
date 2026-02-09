# JAI Dashboard

A comprehensive financial dashboard built with Next.js, featuring portfolio tracking, Plaid integration for investment data, and more.

## Features

- 📊 Portfolio tracking and analysis
- 🏦 Plaid integration for automated investment data sync
- 💹 Real-time market data
- 📈 Trade logging and review
- 🔄 Automated data synchronization

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Plaid developer account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jai-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret_key
PLAID_ENV=sandbox  # or 'production' for live data

# Supabase Configuration (already configured in the app)
NEXT_PUBLIC_SUPABASE_URL=https://lsqlqssigerzghlxfxjl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzcWxxc3NpZ2VyemdobHhmeGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NDA5NTEsImV4cCI6MjA4NTExNjk1MX0.jqoZUtW_gb8rehPteVgjmLLLlPRLYV-0fNJkpLGcf-s
```

### Plaid Setup

1. **Create a Plaid Developer Account:**
   - Visit [Plaid Dashboard](https://dashboard.plaid.com/)
   - Sign up for a developer account
   - Create a new application

2. **Configure your Plaid App:**
   - Products: Select "Investments"
   - Allowed redirect URIs: Add your domain (e.g., `http://localhost:3000` for development)
   - Webhook endpoint: Optional for basic functionality

3. **Get your API Keys:**
   - Copy your `client_id` and `secret` (for sandbox)
   - For production, you'll need to apply for production access

4. **Test Account:**
   - Use Plaid's test credentials in sandbox mode
   - Username: `user_good` 
   - Password: `pass_good`

### Database Schema

The following tables should exist in your Supabase database:

```sql
-- Plaid connected accounts
CREATE TABLE plaid_accounts (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  disconnected_at TIMESTAMP
);

-- Plaid holdings data
CREATE TABLE plaid_holdings (
  id SERIAL PRIMARY KEY,
  account_id VARCHAR(255) NOT NULL,
  security_id VARCHAR(255) NOT NULL,
  institution_price DECIMAL(10,4),
  institution_value DECIMAL(12,2),
  cost_basis DECIMAL(12,2),
  quantity DECIMAL(10,4),
  iso_currency_code CHAR(3),
  unofficial_currency_code VARCHAR(10),
  item_id VARCHAR(255),
  UNIQUE(account_id, security_id)
);

-- Plaid securities reference data
CREATE TABLE plaid_securities (
  security_id VARCHAR(255) PRIMARY KEY,
  isin VARCHAR(20),
  cusip VARCHAR(20),
  sedol VARCHAR(20),
  symbol VARCHAR(20),
  name VARCHAR(255),
  type VARCHAR(50),
  close_price DECIMAL(10,4),
  close_price_as_of DATE,
  iso_currency_code CHAR(3),
  unofficial_currency_code VARCHAR(10)
);

-- Sync operation log
CREATE TABLE plaid_sync_log (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255),
  sync_time TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20), -- 'success', 'error', 'disconnected'
  error_message TEXT,
  holdings_count INTEGER DEFAULT 0,
  securities_count INTEGER DEFAULT 0,
  accounts_count INTEGER DEFAULT 0,
  synced_to_positions BOOLEAN DEFAULT false
);
```

### Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Plaid Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plaid/create-link-token` | POST | Create a Link token for account connection |
| `/api/plaid/exchange-token` | POST | Exchange public token for access token |
| `/api/plaid/sync-holdings` | POST | Sync holdings data from Plaid |
| `/api/plaid/accounts` | GET | List connected Plaid accounts |
| `/api/plaid/accounts/[itemId]` | DELETE | Disconnect a Plaid account |

### Testing API Endpoints

Test the Plaid integration with these curl commands:

```bash
# 1. Create Link Token
curl -X POST http://localhost:3000/api/plaid/create-link-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user"}'

# 2. List Connected Accounts
curl -X GET http://localhost:3000/api/plaid/accounts

# 3. Sync Holdings (after connecting an account)
curl -X POST http://localhost:3000/api/plaid/sync-holdings \
  -H "Content-Type: application/json" \
  -d '{"sync_to_positions": true}'

# 4. Disconnect Account (replace ITEM_ID)
curl -X DELETE http://localhost:3000/api/plaid/accounts/ITEM_ID
```

## Deployment

The app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

Make sure to:
- Set `PLAID_ENV=production` for production deployment
- Apply for Plaid production access before going live
- Update allowed redirect URIs in Plaid dashboard

## Environment Variables Summary

Required environment variables:

- `PLAID_CLIENT_ID` - Your Plaid client ID
- `PLAID_SECRET` - Your Plaid secret key  
- `PLAID_ENV` - Environment (`sandbox` or `production`)

Supabase variables are already configured in the application.

## Support

For issues related to:
- **Plaid Integration**: Check [Plaid Documentation](https://plaid.com/docs/)
- **Database Issues**: Verify your Supabase connection and table schemas
- **API Errors**: Check the browser console and Next.js server logs