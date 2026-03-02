# MEMORY.md — Long-Term Memory

*Last updated: 2026-02-09*

## Who We Are

**Jai** — AI cofounder / co-pilot for Jon. Sharp, direct, resourceful. Not corporate.

**Jon** — 41yo, California. Background in fintech/hedge funds → crypto/DeFi. Advisor, trader, builder. Wife (doctor), 8yo son.

---

## Jon's Situation

- Currently "less employed" — using time to level up with AI + trading
- Heavy crypto allocation, wants to diversify into energy, uranium, defense, AI, drones
- Not a developer but AI-enabled to build things
- Works from home, struggles with solo motivation (why I exist)

---

## Active Projects

### Portfolio Management
- Heavy uranium/energy theme: URA, DNN, NNE, UUUU, AES, OXY, ET, BEP
- Daily 6am PT briefings via Telegram
- **Tracking:** Fidelity + E*Trade via CSV/XLSX exports
- **Dashboard:** jai-dashboard.vercel.app with Supabase backend (project: lsqlqssigerzghlxfxjl)
- Plaid integration built but pending production access

### Research Publishing
- **URL:** myjunto.xyz/research
- **Backend:** `https://github.com/jon-tompkins/Agent-Reports`
  - Cloned at: `~/clawd/Agent-Reports/`
  - Reports go in `reports/` folder
  - **MUST update BOTH** `index.json` (root) AND `reports/index.json`
  - Deep dives always get published here

### Research Library
- **URL:** myjunto.xyz/research (27+ reports)
- **Backend:** GitHub repo `jon-tompkins/Agent-Reports`
- All reports public by default unless Jon says private
- Deep dives on: energy, uranium, short candidates, macro theses

### Trade Ideas
- **SLV puts** — fade silver rally, 5% allocation (~$9k), layered entry on technical signals

### myjunto.xyz
- AI-powered daily newsletters from curated Twitter accounts
- Wants to expand and potentially productize

### Content / Public Profile
- Building a resume, not chasing followers
- Topics: crypto/DeFi, AI, equities, convergence of all three
- Style: dry humor, not combative, proof of work
- 1 tweet/day weekdays, longer posts every 1-2 weeks

### Fitness
- Big goals: 225 shoulder press, 315 bench, 405 squat, 495 deadlift, sub-25 5k, 178 lbs
- 40 min/day, 5 days/week
- Back and shoulders injury-prone — mobility is key

---

## Preferences & Style

- Dry humor
- Direct communication
- Not super technical on web stuff (needs hand-holding on browser DevTools etc.)
- Good with SQL/databases
- Edits content drafts himself — I learn his voice over time

---

## Accounts & Connections

- **Telegram:** @jontom (id: 380299589) — primary channel
- **Twitter:** @jonto21 — has auth set up via bird CLI
- **GitHub:** jon-tompkins — token configured 2026-01-28, expires ~Apr 28, 2026
- **Brokers:** Fidelity, E*Trade
- **Crypto:** Coinbase (plus public addresses TBD)

---

## GitHub Repositories (updated 2026-02-17)

| Repo | Purpose | Local Path |
|------|---------|------------|
| `jai-workshop` | Shared workspace: kanban, memory, research, reviews, content | `~/jai-workshop` |
| `jai-dashboard` | Portfolio dashboard app & tools | `~/clawd` |
| `Trading-Data` | Jon's position/trade exports (CSV drops) | `~/clawd/Trading-Data` |
| `Agent-Reports` | Research reports for myjunto.xyz/research | `~/clawd/Agent-Reports` |
| `myjunto` | MyJunto newsletter platform | TBD |
| `veil-protocol` | Agent trading project (commit-reveal mechanism) | TBD - to be created |

**Auth:** PAT configured, same token works for all repos.
**Workflow:** 
- Trading-Data = Jon drops exports → I pull and process
- Agent-Reports = I write reports → push → shows on myjunto.xyz/research
- jai-workshop = shared home base for collaboration

---

## Important Context

- Twitter monitoring: 6 accounts + cashtags for portfolio
- Discord monitoring: TBD (manual relay for now, exploring bot setup)
- Wants suggestions for new Twitter follows based on who his monitored accounts recommend

---

*This file = curated long-term memory. Daily notes in memory/YYYY-MM-DD.md.*

## Key Workflow Rule (2026-02-17)

**Jon won't see local files.** Anything I want him to read MUST be pushed to GitHub:
- Reviews/specs → `jai-workshop/reviews/`
- Research → `jai-workshop/research/` or `Agent-Reports/`
- Content drafts → `jai-workshop/content/`
- Notes for Jon → `jai-workshop/notes/`

Local = my scratch space. GitHub = shared reality.

## Clawstreet (2026-02-17)

AI agent trading competition. Agents make directional bets, earn points, compete on leaderboard.

- **Domain:** clawstreet.club
- **Repo:** jon-tompkins/clawstreet (`~/clawstreet`)
- **Chain:** Base (x402 for payments)
- **Entry fee:** $10
- **Stack:** Next.js + Postgres (Supabase) + Vercel
