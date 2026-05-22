# Devin Dollars — ACU Project Tracker

A demo web app for IT leaders and CFOs to track "Devin Dollars" (ACU) allocation, consumption, and ROI across IT initiatives. Built as a self-contained Next.js application with seeded data so it works offline and tells a complete story in a five-minute walkthrough.

## Setup

```bash
npm install
npm run dev
# Open http://localhost:3000
```

The database seeds automatically on first run — no additional setup required.

## Demo Flow (5 minutes)

1. **Global KPIs** — Point to the dark strip at the top: total ACUs allocated/consumed, projected savings, and session tagging rate.
2. **`/pitch`** — Submit a new initiative with realistic numbers. Watch the savings math compute live and see the Devin Funding Score update in real time.
3. **`/decisions`** — Review the funding queue. Expand a pending pitch to see the full details and score breakdown. Approve it.
4. **`/projects/[id]`** — Open an active project. Show the three headline cards: ACU consumption pacing, initiative financials with the **BU Reinvestment Pool** callout, and use case fit. Scroll to the burn chart and linked tickets table.
5. **`/leaderboard`** — Show which BUs have untagged Devin sessions. Internal Tools is the clear worst offender. Send a nudge.

## Architecture

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Database | SQLite via better-sqlite3 |
| Icons | Lucide React |

### Key directories

```
src/
  app/           — Routes and API endpoints
  components/    — Layout, charts
  lib/           — Database, queries, scoring, utilities
```

### Data model

- **BusinessUnit** — 6 seeded BUs
- **Initiative** — 12 seeded (3 Pending, 6 Approved, 2 Completed, 1 Rejected)
- **UseCaseFit** — Category + ranking per initiative
- **DevinSession** — ~400 sessions (75% tagged, 25% untagged)
- **Ticket** — Jira/Rally tickets linked to initiatives

### Scoring

The **Devin Funding Score** (0–100) is computed from four components:
- Savings percentage: 0–40 pts (linear, capped at 50%+)
- Absolute savings: 0–20 pts (linear, capped at $500k+)
- Strategic priority: Critical 20 / High 12 / Medium 6
- Use case fit (best selection): Strong 20 / Good 12 / Moderate 6

### Persona switcher

Top-right dropdown switches between IT Leader, Finance Approver, and BU Admin. All personas see all data — the switcher adjusts sidebar emphasis to guide the demo narrative.

## Integration seams

These are stubbed behind the data layer and ready for real APIs:

| Integration | Current | Swap to |
|------------|---------|---------|
| Jira/Rally tickets | SQLite seed data | Jira/Rally REST API |
| Devin sessions | SQLite seed data | Devin Platform API |
| Nudge delivery | Toast notification | Email/Slack webhook |
| Authentication | Persona switcher | SSO/OIDC |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ACU_RATE_USD` | `2.25` | USD-per-ACU conversion rate |
