import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, ScenarioResult, Recommendation } from "../services/api";
import { Panel, RiskBadge, SampleDataTag } from "../components/ui";

const PRESETS: { name: string; overrides: Record<string, number> }[] = [
  { name: "Business as Usual", overrides: {} },
  {
    name: "10% Production Improvement",
    overrides: { mine_utilization_pct: 0.1, recovery_rate_pct: 0.05 },
  },
  {
    name: "New Exploration Target Activated",
    overrides: { exploration_success_rate: 0.12, new_mine_capacity_mt: 0.02 },
  },
];

function Slider({
  label,
  value,
  onChange,
  min = -0.3,
  max = 0.3,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-signal-400 font-mono">
          {value >= 0 ? "+" : ""}
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-signal-500"
      />
    </div>
  );
}

export default function SupplyRisk() {
  const [state] = useState("odisha");
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [scenarioName, setScenarioName] = useState("Custom Scenario");
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const runScenario = (name: string, ov: Record<string, number>) => {
    setLoading(true);
    api
      .runScenario({ name, ...ov, months_ahead: 12 })
      .then(setResult)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runScenario("Business as Usual", {});
    api.recommendations(state).then((r) => setRecs(r.recommendations));
  }, [state]);

  const set = (key: string) => (v: number) => setOverrides((o) => ({ ...o, [key]: v }));

  const chartData =
    result?.forecast.map((f) => ({
      date: f.date,
      gap: f.supply_gap_mt,
    })) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-100">Supply Risk &amp; Scenario Simulator</h1>
        <p className="text-sm text-slate-500">
          Adjust operating conditions and see the projected effect on the supply gap
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Scenario Simulator" className="xl:col-span-1">
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setOverrides(p.overrides);
                  setScenarioName(p.name);
                  runScenario(p.name, p.overrides);
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-abyss-700 text-slate-400 hover:text-slate-200 hover:border-signal-500/50"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <Slider label="Mine Utilization" value={overrides.mine_utilization_pct ?? 0} onChange={set("mine_utilization_pct")} />
            <Slider label="Ore Recovery Rate" value={overrides.recovery_rate_pct ?? 0} onChange={set("recovery_rate_pct")} />
            <Slider label="Equipment Downtime" value={overrides.equipment_downtime_pct ?? 0} onChange={set("equipment_downtime_pct")} />
            <Slider label="Demand Growth" value={overrides.demand_growth_pct ?? 0} onChange={set("demand_growth_pct")} />
            <Slider
              label="Exploration Success (new capacity)"
              value={overrides.exploration_success_rate ?? 0}
              onChange={set("exploration_success_rate")}
              min={0}
              max={0.3}
            />
          </div>

          <button
            onClick={() => {
              setScenarioName("Custom Scenario");
              runScenario("Custom Scenario", overrides);
            }}
            disabled={loading}
            className="mt-4 w-full bg-signal-500/15 border border-signal-500/40 text-signal-400 rounded-md py-2 text-sm font-medium hover:bg-signal-500/25 transition-colors disabled:opacity-50"
          >
            {loading ? "Recalculating…" : "Run Scenario"}
          </button>
        </Panel>

        <Panel
          title={`Forecast — ${result?.scenario_name ?? scenarioName}`}
          subtitle="Projected monthly supply gap (Mt), next 12 months"
          className="xl:col-span-2"
          action={<SampleDataTag />}
        >
          <div className="flex items-center gap-4 mb-3">
            <div>
              <p className="text-xs text-slate-500">Avg. Supply Gap</p>
              <p className="font-display text-xl font-semibold text-slate-100">
                {result ? `${result.avg_supply_gap_mt.toFixed(3)} Mt` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Risk Level</p>
              {result && <RiskBadge level={result.risk_level} />}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
                <CartesianGrid stroke="#182842" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickMargin={8} />
                <YAxis stroke="#64748b" fontSize={11} width={50} />
                <Tooltip
                  contentStyle={{ background: "#101c30", border: "1px solid #243657", borderRadius: 8 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="gap" name="Supply gap (Mt)" fill="#2bb8f0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="AI Recommendations" subtitle="Generated from current targets and supply-risk forecast">
        <ul className="space-y-2">
          {recs.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <RiskBadge level={r.priority} />
              <span className="text-slate-300">{r.action}</span>
            </li>
          ))}
          {recs.length === 0 && <p className="text-sm text-slate-500">Loading recommendations…</p>}
        </ul>
      </Panel>
    </div>
  );
}
