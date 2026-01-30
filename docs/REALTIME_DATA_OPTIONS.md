# Real-Time Price Data Options for Portfolio Dashboard

This document evaluates various API options for pulling near-real-time price data into a Next.js portfolio dashboard, covering both equity options and cryptocurrency data sources.

## Equity Options Data APIs

### 1. Tradier API

**Overview**: Tradier offers a comprehensive brokerage API with extensive options data including Greeks through a partnership with ORATS.

**Cost**:
- Free tier: Limited access available
- Pro plan: $10/month (includes commission-free trading)
- API access requires a Tradier brokerage account

**Latency/Update Frequency**:
- Real-time streaming data via WebSocket
- REST API for snapshot quotes

**Data Coverage**:
- Full US options market coverage
- All options chains for stocks, ETFs, and indexes
- Greeks data (delta, gamma, theta, vega) via ORATS partnership
- Implied volatility calculations

**API Complexity**:
- RESTful API design
- OAuth 2.0 authentication
- WebSocket support for streaming
- Well-documented with examples

**Rate Limits**:
- Varies by endpoint
- Streaming connections have separate limits

### 2. TD Ameritrade/Schwab API

**Status**: ⚠️ **DISCONTINUED** - TD Ameritrade API was shut down in May 2024 after the Schwab merger.

**Alternative**: Schwab Trader API
- Now available for retail traders
- Similar functionality to the old TD Ameritrade API
- Requires Schwab brokerage account
- OAuth 2.0 authentication
- Documentation available at developer.schwab.com

### 3. Interactive Brokers (IBKR) API

**Overview**: Institutional-grade API with comprehensive market data access.

**Cost**:
- API access: Free with IBKR account
- Market data subscriptions required:
  - OPRA (US Options): $1.50/month (non-professional)
  - Level 1 options data included
  - Additional fees for depth of book

**Latency/Update Frequency**:
- Real-time streaming via WebSocket
- Snapshot quotes available

**Data Coverage**:
- Full options market coverage
- Greeks calculated automatically
- Global market access
- Depth of book available

**API Complexity**:
- Multiple API options (REST, WebSocket, TWS)
- Complex authentication process
- Requires understanding of IBKR's system
- Extensive documentation

**Rate Limits**:
- Based on commission activity
- Default 100 concurrent lines of data
- Can be increased with activity

### 4. Polygon.io (Now Massive)

**Overview**: Developer-focused financial data API with comprehensive options coverage.

**Cost**:
- Options Basic: Free (5 calls/minute, 2 years historical)
- Options Starter: $29/month (unlimited calls, 15-minute delayed)
- Options Developer: $79/month (4 years historical)
- Options Advanced: $199/month (real-time data)

**Latency/Update Frequency**:
- Real-time with Advanced plan
- 15-minute delay on lower tiers
- WebSocket streaming available

**Data Coverage**:
- 100% US options market coverage
- All options contracts
- Greeks, IV, and open interest
- Second-level aggregates

**API Complexity**:
- RESTful API
- WebSocket support
- Excellent documentation
- Multiple client libraries

**Rate Limits**:
- Free tier: 5 calls/minute
- Paid tiers: Unlimited calls

### 5. Unusual Whales API

**Overview**: Options flow and market data API with focus on unusual activity.

**Cost**:
- API access requires subscription
- Pricing not publicly listed
- Contact for enterprise pricing

**Latency/Update Frequency**:
- Real-time options flow data
- Near real-time pricing

**Data Coverage**:
- Options flow data
- Dark pool activity
- Unusual options activity
- Basic pricing data

**API Complexity**:
- RESTful API
- Limited documentation publicly available
- Focus on options flow rather than comprehensive pricing

**Rate Limits**:
- Not publicly disclosed

## Cryptocurrency Data APIs

### 1. Coinbase API

**Overview**: Direct access to Coinbase exchange data.

**Cost**:
- Free for basic market data
- No API usage fees
- Standard trading fees apply for transactions

**Latency/Update Frequency**:
- Real-time WebSocket streams
- REST API for snapshots

**Data Coverage**:
- All Coinbase listed cryptocurrencies
- 50+ trading pairs
- Order book data
- Historical data

**API Complexity**:
- Well-documented REST API
- WebSocket support
- OAuth 2.0 for account data
- Simple for public market data

**Rate Limits**:
- 10 requests/second for public endpoints
- Higher limits with authentication
- WebSocket connections: 10 per IP

### 2. Binance API

**Overview**: Comprehensive cryptocurrency exchange API.

**Cost**:
- Free for all public market data
- No API key required for public endpoints

**Latency/Update Frequency**:
- Real-time WebSocket streams
- REST API updates every second

**Data Coverage**:
- 600+ trading pairs
- Spot, futures, and options data
- Order book depth
- Historical kline data

**API Complexity**:
- Extensive REST API
- WebSocket streams
- Good documentation
- Multiple API types (spot, futures, etc.)

**Rate Limits**:
- 6000 request weight/minute
- 50 orders/10 seconds
- 160,000 orders/day
- IP-based limits

### 3. CoinGecko API

**Overview**: Aggregated cryptocurrency data from multiple exchanges.

**Cost**:
- Demo plan: Free (10,000 calls/month, 30 calls/minute)
- API Pro: Starts at $99/month (500 calls/minute)
- Higher tiers available

**Latency/Update Frequency**:
- 5-15 calls/minute on free tier
- Updates every 1-5 minutes

**Data Coverage**:
- 10,000+ cryptocurrencies
- Price, volume, market cap
- Exchange rates
- Limited real-time data

**API Complexity**:
- Simple REST API
- Easy to integrate
- Good documentation

**Rate Limits**:
- Demo: 30 calls/minute
- Pro: 500 calls/minute
- Enterprise: 1000+ calls/minute

### 4. CryptoCompare API

**Overview**: Cryptocurrency data aggregation platform.

**Cost**:
- Free tier: Limited requests
- Paid plans: Start at commercial rates
- Enterprise pricing available

**Latency/Update Frequency**:
- Updates every 1-5 minutes on free tier
- Real-time with paid plans

**Data Coverage**:
- 5000+ cryptocurrencies
- 250+ exchanges
- Historical data
- CCCAGG price index

**API Complexity**:
- REST API
- Proprietary CCCAGG index
- Good documentation

**Rate Limits**:
- Free tier has daily limits
- Higher limits with paid plans

## Recommendations

### Best Free Options

**Equity Options**: 
- **Tradier** - Best free option with real Greeks data, requires brokerage account
- **Polygon.io Basic** - 5 calls/minute, good for testing

**Crypto**:
- **Binance API** - Most comprehensive free crypto API
- **Coinbase API** - Simple and reliable for major coins

### Best Paid Options

**Equity Options**:
- **Polygon.io Advanced** ($199/month) - Best value for real-time options with Greeks
- **IBKR** - Most comprehensive but complex setup

**Crypto**:
- **Binance API** - Still free and most comprehensive
- **CoinGecko Pro** - Good for aggregated data from multiple sources

### Best Balance of Cost/Quality

**Equity Options**:
- **Polygon.io Starter** ($29/month) - 15-minute delayed data, unlimited calls
- **Tradier** - Free with brokerage account, real-time data

**Crypto**:
- **Binance API** - Free, comprehensive, reliable
- **CoinGecko Demo** - Free tier sufficient for basic portfolio tracking

## Implementation Notes

1. **Multiple Data Sources**: Consider using multiple APIs for redundancy
2. **Caching**: Implement caching to reduce API calls and improve performance
3. **WebSocket vs REST**: Use WebSocket for real-time updates, REST for historical data
4. **Rate Limiting**: Implement proper rate limiting and retry logic
5. **Error Handling**: Plan for API downtime and have fallback options

## Next Steps

1. Start with free tiers to test integration
2. Implement basic dashboard with delayed data
3. Upgrade to real-time data based on user needs
4. Consider building abstraction layer for multiple data sources
5. Monitor usage and costs as you scale