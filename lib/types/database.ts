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

export interface Database {
  public: {
    Tables: {
      commodity_flow: {
        Row: CommodityFlowRow;
        Insert: Partial<CommodityFlowRow>;
        Update: Partial<CommodityFlowRow>;
      };
    };
  };
}
