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

// One row per ship visit and cargo line; built nightly by the ship-codex ETL
// (etl/vessel_calls.py). Dates are ISO strings.
export interface VesselCallRow {
  port: string;
  call_id: string;
  commodity: string;
  imp_exp: string; // "Import" | "Export" | "" when the source never says
  commodity_standard: string | null;
  commodity_category: string | null;
  ship_name: string | null;
  agent: string | null;
  terminal: string | null;
  berth_no: string | null;
  origin_port: string | null;
  quantity_reported: number | null;
  quantity_unit: string | null; // MT, M3 (PQ LNG) or UNITS (PQ containers)
  tonnage_mt: number | null;
  tonnage_source: string | null;
  anchorage_arrived: string | null;
  berthed_on: string | null;
  first_seen: string;
  last_seen: string;
  wait_days: number | null;
  status: "at_anchorage" | "at_berth" | "completed" | "left_anchorage";
}

export interface Database {
  public: {
    Tables: {
      commodity_flow: {
        Row: CommodityFlowRow;
        Insert: Partial<CommodityFlowRow>;
        Update: Partial<CommodityFlowRow>;
      };
      vessel_calls: {
        Row: VesselCallRow;
        Insert: Partial<VesselCallRow>;
        Update: Partial<VesselCallRow>;
      };
    };
  };
}
