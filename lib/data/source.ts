import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * One place that knows where rows come from.
 *
 *  - Production: Supabase (PostgREST), read with the service-role key.
 *  - LOCAL_DATA_DIR set: JSON files written by the ETL's
 *    `python -m etl.export_snapshot`. Used for local development, offline
 *    demos and generating the weekly report PDF without touching Supabase.
 *
 * Rows are cached in memory per server instance for an hour. The earlier
 * `unstable_cache` wrapper silently stopped caching once commodity_flow
 * outgrew Next's 2 MB data-cache limit (~4,500 rows), so every request was
 * re-reading the whole table.
 */

const PAGE_SIZE = 1000;
const TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  at: number;
  rows: Promise<unknown[]>;
}

const cache = new Map<string, CacheEntry>();

export interface TableQuery {
  table: string;
  /** Comma-separated column list; "*" for all. Fewer columns = faster cold load. */
  columns?: string;
  /** Stable sort key. PostgREST pagination without one can skip or repeat rows. */
  orderBy: string;
}

async function readLocal(dir: string, table: string): Promise<unknown[]> {
  const file = path.join(dir, `${table}.json`);
  const text = await fs.readFile(file, "utf8");
  return JSON.parse(text) as unknown[];
}

async function readSupabase({ table, columns = "*", orderBy }: TableQuery): Promise<unknown[]> {
  // Imported lazily so LOCAL_DATA_DIR mode never needs Supabase credentials.
  const { supabaseServer } = await import("@/lib/supabase/server");
  const client = supabaseServer();

  const head = await client.from(table).select(orderBy, { count: "exact", head: true });
  if (head.error) {
    throw new Error(`Failed to count ${table}: ${head.error.message}`);
  }
  const total = head.count ?? 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  // Pages are independent, so fetch them together rather than one by one.
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      client
        .from(table)
        .select(columns)
        .order(orderBy, { ascending: true })
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
    )
  );

  const rows: unknown[] = [];
  for (const res of results) {
    if (res.error) throw new Error(`Failed to fetch ${table}: ${res.error.message}`);
    rows.push(...(res.data ?? []));
  }
  return rows;
}

export function isLocalData(): boolean {
  return Boolean(process.env.LOCAL_DATA_DIR);
}

export async function fetchTable<T>(query: TableQuery): Promise<T[]> {
  const key = `${query.table}|${query.columns ?? "*"}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.rows as Promise<T[]>;
  }

  const localDir = process.env.LOCAL_DATA_DIR;
  const rows = localDir ? readLocal(localDir, query.table) : readSupabase(query);

  cache.set(key, { at: Date.now(), rows });
  // A failed load must not be served from cache for the next hour.
  rows.catch(() => cache.delete(key));
  return rows as Promise<T[]>;
}

/**
 * Like fetchTable, but a missing table yields [] instead of an error.
 *
 * The marts (vessel_calls, data_coverage, mart_port_activity) only exist once
 * the ETL release that builds them has run. Until then the pages that use
 * them show an empty state rather than taking the whole site down.
 */
export async function fetchOptionalTable<T>(query: TableQuery): Promise<T[]> {
  try {
    return await fetchTable<T>(query);
  } catch (err) {
    console.error(`[data] ${query.table} unavailable:`, err);
    return [];
  }
}
