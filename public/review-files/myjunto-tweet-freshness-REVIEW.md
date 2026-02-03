# MyJunto Tweet Freshness Fix - Complete Resolution

## 🔍 Root Cause Analysis

The newsletter content was stale because **the tweet ingestion infrastructure was never deployed**. The database was missing three critical tables:

| Missing Table | Purpose |
|--------------|---------|
| `profiles` | Stores Twitter accounts being tracked |
| `tweets` | Stores fetched tweets from those accounts |
| `user_profiles` | Links users to profiles they want to follow |

Without these tables:
- Tweet fetching silently failed (no place to store tweets)
- Newsletter generation found 0 tweets to synthesize
- Newsletters were empty or used old cached content

Additionally, there were schema mismatches:
- `newsletters` table used `title` but code expected `subject`
- `users` table missing `twitter_handle` and `has_access` columns

## ✅ What I Fixed

### 1. Created Database Migration
**File:** `junto/migrations/002_tweet_freshness_fix.sql`

This migration:
- Creates `profiles`, `tweets`, `user_profiles` tables
- Adds missing columns to `users` table (`twitter_handle`, `has_access`)
- Adds missing columns to `newsletters` table for proper tracking
- Seeds initial profiles (crypto_condom, cburniske, krugman87)
- Sets up Jon's user with access and profile links
- Enables RLS policies

### 2. Fixed Config File
**File:** `junto/src/lib/utils/config.ts`

Added Twitter proxy configuration support:
```typescript
twitter: {
  proxyUrl: getEnvVar('TWITTER_PROXY_URL', false),
  proxyToken: getEnvVar('TWITTER_PROXY_TOKEN', false),
},
```

## 📋 Jon's Action Items

### Step 1: Run Database Migration (5 minutes)

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/lsqlqssigerzghlxfxjl/sql/new

2. Copy the entire contents of `junto/migrations/002_tweet_freshness_fix.sql`

3. Paste and run in the SQL editor

4. Verify success - you should see:
   - 3 profiles created
   - Your user with `has_access = true`
   - User-profile mappings for your account

### Step 2: Configure Twitter Proxy (Required!)

The app needs a Twitter proxy to fetch tweets. You need to set these in Vercel:

1. Go to Vercel Dashboard → myjunto → Settings → Environment Variables

2. Add these variables:
   ```
   TWITTER_PROXY_URL=<your-twitter-proxy-url>
   TWITTER_PROXY_TOKEN=<your-proxy-auth-token>
   ```

**Don't have a Twitter proxy?** You need one. Options:
- **Apify Twitter Scraper**: https://apify.com/quacker/twitter-scraper
- **RapidAPI Twitter API**: https://rapidapi.com/category/Social
- **Self-hosted Nitter**: https://github.com/zedeus/nitter

The proxy should accept requests like:
```
GET ${TWITTER_PROXY_URL}/tweets?handle=crypto_condom&count=30
Authorization: Bearer ${TWITTER_PROXY_TOKEN}
```

And return:
```json
{
  "success": true,
  "handle": "crypto_condom",
  "count": 15,
  "tweets": [
    {
      "id": "123...",
      "text": "...",
      "createdAt": "2024-01-15T10:30:00Z",
      "likeCount": 100,
      "retweetCount": 20
    }
  ]
}
```

### Step 3: Redeploy (2 minutes)

After adding env vars, trigger a redeploy:
1. Go to Vercel Dashboard → myjunto → Deployments
2. Click "..." on latest deployment → Redeploy

### Step 4: Test Tweet Fetching

Call the tweet fetch endpoint:
```bash
curl -X POST https://www.myjunto.xyz/api/tweets/fetch \
  -H "Content-Type: application/json" \
  -d '{"seed": false}'
```

Expected response:
```json
{
  "success": true,
  "profiles": 3,
  "results": {
    "crypto_condom": { "fetched": 30, "stored": 25 },
    "cburniske": { "fetched": 15, "stored": 15 },
    "krugman87": { "fetched": 10, "stored": 10 }
  }
}
```

### Step 5: Verify Newsletter Generation

Generate a test newsletter:
```bash
curl -X POST https://www.myjunto.xyz/api/newsletter/generate \
  -H "Content-Type: application/json"
```

This should now find tweets and create a fresh newsletter!

## 🧪 Multi-User Profile Tracking

The system now supports multiple users tracking multiple profiles:

**Schema:**
```
users (1) --< user_profiles >-- (many) profiles (1) --< tweets
```

**How it works:**
1. Each user selects profiles via `/api/user/profiles`
2. Cron job fetches tweets for ALL profiles that ANY user follows
3. Newsletter generation filters tweets to only the user's selected profiles
4. Each user gets a personalized newsletter

**Scaling considerations:**
- Tweet fetching is deduplicated (each profile fetched once even if multiple users follow)
- Tweets stored once, queried per-user
- Add more profiles via the `profiles` table; link users via `user_profiles`

## 📁 Files Changed

```
junto/
├── migrations/
│   ├── 001_add_tweet_tables.sql     # Initial migration (unused)
│   └── 002_tweet_freshness_fix.sql  # COMPLETE MIGRATION - RUN THIS
└── src/lib/utils/
    └── config.ts                     # Added twitter proxy config
```

## 🚨 Critical: Without Twitter Proxy

If no Twitter proxy is configured, the system will:
- Fail to fetch any tweets
- Log errors in the console
- Generate newsletters with 0 tweets (stale/empty content)

**You MUST configure a Twitter data source** (proxy URL + token) for fresh content.

## Expected Timeline

| Step | Time |
|------|------|
| Run migration | 2-3 min |
| Configure env vars | 5 min |
| Redeploy | 2-3 min |
| Test & verify | 5 min |
| **Total** | **~15 min** |

## Questions?

If you encounter issues:
1. Check Vercel function logs for errors
2. Verify env vars are set correctly
3. Test the proxy endpoint directly with curl
4. Check Supabase for data in the new tables

---

**Status: Ready for deployment** ✅
