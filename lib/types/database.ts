export interface CommodityFlowRow {
  id: number;
  report_date: string;
  port: string;
  data_source: string;
  ship_name: string;
  commodity: string;
  weight_mt: number | null;
  imp_exp: string;
  agent: string | null;
  terminal: string | null;
  loading_port: string | null;
  source_file: string | null;
  created_at: string;
  weight_24h_mt: number | null;
  commodity_standard: string | null;
  commodity_category: string | null;
}

// One row per vessel call x commodity line (ETL: etl/marts.py). Tonnage is
// counted once per call, so summing weight_mt by arrival month is safe.
export interface VesselCall {
  visit_key: string;
  port: string; // "PQ" | "KPT"
  source: string; // "history" | "live"
  ship_name: string | null;
  arrival_date: string | null;
  berth_date: string | null;
  last_seen: string | null;
  status: string | null; // "waiting" | "berthed" | "sailed"
  commodity_standard: string | null;
  commodity_category: string | null;
  weight_mt: number | null;
  balance_mt: number | null;
  imp_exp: string | null; // "Import" | "Export" | null
  agent: string | null;
  loading_port: string | null;
  next_port: string | null;
  origin_country: string | null;
  destination_country: string | null;
  terminal: string | null;
  wait_days: number | null;
  berth_days: number | null;
  is_outlier: number;
}

export interface CoverageRow {
  port: string;
  month: string; // YYYY-MM
  source: string;
  days_observed: number;
  days_in_month: number;
  is_complete: number;
}

export interface PortActivityRow {
  report_date: string;
  port: string;
  ships_waiting: number | null;
  ships_berthed: number | null;
}
