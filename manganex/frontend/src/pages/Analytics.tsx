import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api, ModelMetrics, FeatureImportance } from "../services/api";
import { Panel, StatCard, SampleDataTag } from "../components/ui";

const PIPELINE_STEPS = [
  "Satellite / Remote Sensing Data",
  "Data Preprocessing",
  "Spectral + Geo Features",
  "AI / ML Model",
  "Prospectivity Map",
  "Exploration Target",
];

const DATA_SOURCES = [
  { name: "Sentinel-2 multispectral imagery", note: "10–20 m bands for NDVI, NDWI, iron-oxide indices" },
  { name: "Landsat 8/9 imagery", note: "Long-baseline historical spectral comparison" },
  { name: "Hyperspectral satellite data", note: "Finer mineral spectral signatures (e.g. EMIT, PRISMA)" },
  { name: "DEM / elevation data", note: "SRTM or Copernicus DEM for elevation & slope" },
  { name: "Geological survey datasets", note: "GSI lithology & structural maps" },
  { name: "Mineral occurrence databases", note: "GSI/IBM known-occurrence records" },
];

export default function Analytics() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [importance, setImportance] = useState<FeatureImportance | null>(null);

  useEffect(() => {
    api.modelMetrics().then(setMetrics);
    api.featureImportance().then(setImportance);
  }, []);

  const chartData =
    importance?.feature_importance.map((f) => ({
      name: f.label,
      importance: f.importance,
    })) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-100">Model Analytics &amp; Space Technology Layer</h1>
        <p className="text-sm text-slate-500">
          How the prospectivity model performs, and how it would ingest real satellite data
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Accuracy" value={`${(metrics.accuracy * 100).toFixed(1)}%`} tone="signal" />
          <StatCard label="Precision" value={`${(metrics.precision * 100).toFixed(1)}%`} />
          <StatCard label="Recall" value={`${(metrics.recall * 100).toFixed(1)}%`} />
          <StatCard label="F1 Score" value={`${(metrics.f1_score * 100).toFixed(1)}%`} />
        </div>
      )}
      {metrics && (
        <p className="text-xs text-slate-500">
          {metrics.label} — trained on {metrics.train_size} synthetic points, evaluated on{" "}
          {metrics.test_size} held-out points across {metrics.n_features} features. Real-world
          geological accuracy has not been demonstrated by this prototype.
        </p>
      )}

      <Panel title="Feature Importance" subtitle="RandomForest global importance across the 13 model features" action={<SampleDataTag />}>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid stroke="#182842" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={180} />
              <Tooltip
                contentStyle={{ background: "#101c30", border: "1px solid #243657", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="importance" radius={[0, 3, 3, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? "#5fd8ff" : "#2bb8f0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Space Technology Layer" subtitle="From satellite data to an exploration target">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-md border border-abyss-700 bg-abyss-800/60 text-xs text-slate-300 font-mono">
                {step}
              </span>
              {i < PIPELINE_STEPS.length - 1 && <span className="text-signal-500">→</span>}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400 mb-3">
          This prototype uses locally generated sample data at every stage above. The data sources
          below are what a production system would substitute in — see the exploration dataset
          generator in the backend for exactly which fields each source would replace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DATA_SOURCES.map((s) => (
            <div key={s.name} className="border border-abyss-700/60 rounded-md px-3 py-2">
              <p className="text-sm text-slate-200 font-medium">{s.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.note}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
