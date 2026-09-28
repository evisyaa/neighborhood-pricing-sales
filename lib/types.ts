export type Radius = "P25" | "P50" | "P75";

export type SalesProfile = {
  auth_uid: string;
  sales_code: string;
  sales_name: string;
  depo: string | null;
  region: string | null;
  role: "salesman" | "manager";
  active: boolean;
};

export type EngineStore = {
  sales_code: string;
  sales_name: string | null;
  outlet_code: string;
  outlet_name: string;
  region: string | null;
  depo: string | null;
  segment: string | null;
  lat: number;
  lon: number;
  roa_3m: boolean;
  radius: Radius;
  quadrant_code: number;
  quadrant: string;
  action: string | null;
  retail_roa_pct: number | null;
  retail_base: number;
  benchmark: number;
  opportunity_score: number | null;
  confidence: string | null;
  profile: string | null;
  radius_km: number;
  current_month: number;
  target_month: number;
  gross_gap: number;
  potential_month: number;
  ec_avg: number | null;
  recommended_order: number;
  strata: string;
};

export type RetailPoint = {
  sales_code: string;
  outlet_code: string;
  outlet_name: string;
  lat: number;
  lon: number;
  roa_3m: boolean;
};

export type UsageEvent = {
  id?: number;
  created_at?: string;
  sales_code: string;
  outlet_code?: string | null;
  event_type: string;
  radius?: string | null;
  recommended_order?: number | null;
  actual_order?: number | null;
  lat?: number | null;
  lon?: number | null;
  extra?: Record<string, unknown> | null;
};
