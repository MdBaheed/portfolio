import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api, HistoryRow, ForecastRow, ProductionStatus } from "../services/api";
import { Panel, StatCard, RiskBadge, SampleDataTag } from "../components/ui";

export default function ProductionForecast() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [status, setStatus] = useState<ProductionStatus | null>(null);

  useEffect(() => {
    api.productionStatus().then(setStatus);
    api.productionHistory(18).then((r) => setHistory(r.history));
    api.productionForecast(12).then((r) => setForecast(r.forecast));
  }, []);

  const combined = [
    ...history.map((h) => ({
      date: h.date,
      production: h.production_mt,
      demand: h.demand_mt,
      kind: "actual",
    })),
    ...forecast.map((f) => ({
      date: f.date,
      forecastProduction: f.production_mt,
      forecastDemand: f.demand_mt,
      kind: "forecast",
    })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-100">
          Manganese Supply Risk Predictor
        </h1>
        <p className="text-sm text-slate-500">Production vs demand, with a 12-month forecast</p>
      </div>

      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Current Production" value={`${status.production_mt.toFixed(2)} Mt`} />
          <StatCard label="Current Demand" value={`${status.demand_mt.toFixed(2)} Mt`} />
          <StatCard
            label="Supply Gap"
            value={`${status.supply_gap_mt.toFixed(3)} Mt`}
            tone={status.risk_level === "HIGH" ? "risk-high" : status.risk_level === "MODERATE" ? "risk-medium" : "risk-low"}
          />
          <div className="bg-abyss-900/60 border border-abyss-700/60 rounded-lg px-4 py-3 flex flex-col justify-center">
            <p className="text-xs text-slate-500 mb-1">Risk Level</p>
            <RiskBadge level={status.risk_level} />
          </div>
        </div>
      )}

      <Panel title="Production vs Demand" subtitle="Last 18 months, actual + 12-month forecast" action={<SampleDataTag />}>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combined} margin={{ left: 0, right: 12 }}>
              <CartesianGrid stroke="#182842" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickMargin={8} />
              <YAxis stroke="#64748b" fontSize={11} width={50} />
              <Tooltip
                contentStyle={{ background: "#101c30", border: "1px solid #243657", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="production" name="Production (actual)" stroke="#5fd8ff" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="demand" name="Demand (actual)" stroke="#e8a33d" dot={false} strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="forecastProduction"
                name="Production (forecast)"
                stroke="#5fd8ff"
                strokeDasharray="5 4"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="forecastDemand"
                name="Demand (forecast)"
                stroke="#e8a33d"
                strokeDasharray="5 4"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
