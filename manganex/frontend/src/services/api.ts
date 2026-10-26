// Thin typed fetch wrapper around the MANGANEX FastAPI backend.
// Base path is relative ("/api/...") so it works through the Vite dev
// proxy (see vite.config.ts) in development and behind any reverse proxy
// in production.

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface Region {
  id: string;
  label: string;
  center: [number, number];
  zoom: number;
}

export interface Target {
  target_id: string;
  state: string;
  latitude: number;
  longitude: number;
  prospectivity: number;
  confidence: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface TargetDetail extends Target {
  parameters: {
    spectral_similarity: string;
    geological_suitability: string;
    terrain_suitability: string;
    vegetation_interference: string;
    distance_from_known_occurrence_km: number;
  };
  explanation: {
    summary: string;
    feature_contributions: { factor: string; contribution_pct: number }[];
  };
  disclaimer: string;
  label: string;
}

export interface HeatmapCell {
  latitude: number;
  longitude: number;
  prospectivity: number;
  level: "HIGH" | "MEDIUM" | "LOW";
}

export interface Heatmap {
  state: string;
  grid_size: number;
  cells: HeatmapCell[];
  legend: Record<string, string>;
  label: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  train_size: number;
  test_size: number;
  n_features: number;
  label: string;
}

export interface FeatureImportance {
  feature_importance: { feature: string; label: string; importance: number }[];
}

export interface ProductionStatus {
  date: string;
  production_mt: number;
  demand_mt: number;
  supply_gap_mt: number;
  risk_level: "LOW" | "MODERATE" | "HIGH";
  label: string;
}

export interface ForecastRow {
  date: string;
  production_mt: number;
  demand_mt: number;
  supply_gap_mt: number;
  risk_level: "LOW" | "MODERATE" | "HIGH";
}

export interface HistoryRow {
  date: string;
  production_mt: number;
  demand_mt: number;
  supply_gap_mt: number;
  ore_grade_pct: number;
  recovery_rate_pct: number;
  mine_utilization_pct: number;
  equipment_downtime_pct: number;
  rainfall_impact_index: number;
  logistics_disruption_index: number;
  inventory_mt: number;
}

export interface ScenarioOverrides {
  name: string;
  mine_utilization_pct?: number;
  recovery_rate_pct?: number;
  ore_grade_pct?: number;
  equipment_downtime_pct?: number;
  demand_growth_pct?: number;
  exploration_success_rate?: number;
  new_mine_capacity_mt?: number;
  months_ahead?: number;
}

export interface ScenarioResult {
  scenario_name: string;
  overrides: Record<string, number>;
  forecast: ForecastRow[];
  avg_supply_gap_mt: number;
  risk_level: "LOW" | "MODERATE" | "HIGH";
}

export interface Recommendation {
  priority: string;
  action: string;
}

export const api = {
  regions: () => get<{ regions: Region[] }>("/regions"),
  targets: (state: string, limit = 20) =>
    get<{ state: string; count: number; targets: Target[]; label: string }>(
      `/exploration/targets?state=${state}&limit=${limit}`
    ),
  heatmap: (state: string, gridSize = 22) =>
    get<Heatmap>(`/exploration/heatmap?state=${state}&grid_size=${gridSize}`),
  targetDetail: (targetId: string) =>
    get<TargetDetail>(`/exploration/target/${targetId}`),
  modelMetrics: () => get<ModelMetrics>("/model/metrics"),
  featureImportance: () => get<FeatureImportance>("/model/feature-importance"),
  productionStatus: () => get<ProductionStatus>("/production/status"),
  productionHistory: (months = 24) =>
    get<{ history: HistoryRow[]; label: string }>(
      `/production/history?months=${months}`
    ),
  productionForecast: (monthsAhead = 12) =>
    get<{ forecast: ForecastRow[]; months_ahead: number; label: string }>(
      `/production/forecast?months_ahead=${monthsAhead}`
    ),
  runScenario: (payload: ScenarioOverrides) =>
    post<ScenarioResult>("/production/scenario", payload),
  recommendations: (state: string) =>
    get<{ state: string; recommendations: Recommendation[]; label: string }>(
      `/recommendations?state=${state}`
    ),
};
