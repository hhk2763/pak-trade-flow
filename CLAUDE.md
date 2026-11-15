# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this repo is

The customer-facing website for **PAK Trade Flow**: port cargo data for Pakistan
equity research. Next.js 14 (App Router, Server Components, TypeScript),
Tailwind, Recharts, deployed on Vercel. It only *reads* data; everything is
produced by the private ETL repo `hhk2763/ship-codex-etl`.

**This repository is public.** Never commit data snapshots (`.data/`), keys, or
business material (pricing, customer names, sales notes). Those live in the
private ETL repo's `HANDOVER.md`, which is also the master "where things
stand" document for the whole project. Read it first when resuming.

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npx tsc --noEmit       # type-check; must stay clean
npm run build          # must pass before pushing; pages are prerendered
```

There is no test suite. Verify changes by building and looking at the pages.

### Running without Supabase

```bash
# in ship-codex-etl, after a pipeline run:
python -m etl.export_snapshot --out ../pak-trade-flow/.data
# here:
echo "LOCAL_DATA_DIR=$(pwd)/.data" > .env.local
npm run dev
```

`LOCAL_DATA_DIR` makes `lib/data/source.ts` read JSON files instead of
Supabase. This is how the site is developed and how the sample weekly note
PDF is produced.

## Architecture

```
lib/data/source.ts        where rows come from (Supabase or local JSON) + 1h memory cache
lib/data/vesselCalls.ts   analytics on vessel_calls: monthly series, MoM/YoY, line-up, origin mix
lib/data/commodityFlow.ts analytics on commodity_flow (daily grain): the older pages + AI briefing
lib/sectors.ts            THE sector config: sector -> tickers -> cargo flows. Client-safe.
lib/report.ts             weekly-note talking points, assembled in code (no LLM)
lib/ai/                   weekly email briefing (DeepSeek), validated against computed facts

app/page.tsx              Sector Monitor (home)
app/sectors/[slug]        sector detail
app/vessels               vessel line-up
app/report                weekly note, print-ready (Save as PDF)
app/daily, commodity-flows, market-trends   original daily-tonnage views
app/about                 methodology        app/contact  "Request a pilot"
```

### Two tables, two grains: do not mix them

- `vessel_calls`: one row per vessel call. Tonnage counted **once**. Use it
  for "cargo that arrived" and anything monthly.
- `commodity_flow`: one row per vessel per day in port. `weight_mt` repeats
  daily, so only `weight_24h_mt` may be summed.

### Rules the analytics enforce (keep them)

- **Coverage decides what is comparable.** `data_coverage` says which
  port-months were fully observed. Incomplete months are drawn lighter and
  never used in a comparison.
- **Year-on-year is like-for-like or absent.** Karachi Port data on today's
  basis starts March 2026, so YoY uses Port Qasim only and is marked "PQ".
  If Port Qasim carries under half of a flow, no YoY is shown at all
  (`compare()` in `lib/data/vesselCalls.ts`). Do not "fix" the n/a values by
  loosening this: a wrong YoY in front of an analyst is worse than none.
- **LNG is counted in cargoes**, not tonnes (`unit: "calls"`); the ports record
  its volume inconsistently.
- **Outliers** (`is_outlier`) count as a call but contribute no tonnage.

### Adding or changing a sector

Edit `lib/sectors.ts` only. `standards` are `commodity_standard` values from
the ETL's `etl/commodity_map.py`, upper case. Pages, the weekly note and
static params are all generated from that list. Tickers are an editorial
judgement: check them against the current PSX listing before publishing.

## Gotchas

- **Marts may not exist yet.** `fetchOptionalTable` returns `[]` when
  `vessel_calls` / `data_coverage` are missing, and pages render
  `<DataPending />`. This lets the site deploy before the ETL release that
  creates those tables.
- **Do not wrap table fetches in `unstable_cache`.** Next refuses to cache
  items over 2 MB and `commodity_flow` passed that long ago; the old wrapper
  silently re-fetched the whole table on every request. `fetchTable` keeps an
  in-memory copy per server instance instead, and `revalidate = 3600` in
  `app/layout.tsx` rebuilds pages hourly.
- **The access gate is CSS only** (`components/gating/`). It blurs rows that
  are already in the HTML. It is lead capture, not security. Real access
  control needs login plus server-side filtering.
- **Layout is desktop-only** (fixed 288px sidebar). It does not work on phones.
- The Supabase read path cannot be exercised without credentials; after a
  change to `lib/data/source.ts`, check the Vercel preview deployment.
- Charts follow one palette: `#00897b` full month, `#9fd3cc` partial month.
