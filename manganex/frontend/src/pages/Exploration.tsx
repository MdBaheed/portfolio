import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Rectangle, CircleMarker, Tooltip } from "react-leaflet";
import { api, Region, Target, TargetDetail, HeatmapCell } from "../services/api";
import { Panel, RiskBadge, SampleDataTag } from "../components/ui";

const LEVEL_COLOR: Record<string, string> = {
  HIGH: "#e2593f",
  MEDIUM: "#e8a33d",
  LOW: "#3fcf8e",
};

function cellSizeDeg(cells: HeatmapCell[], gridSize: number) {
  if (cells.length < 2) return 0.3;
  const lats = Array.from(new Set(cells.map((c) => c.latitude))).sort((a, b) => a - b);
  return lats.length > 1 ? lats[1] - lats[0] : 0.3;
}

export default function Exploration() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedState, setSelectedState] = useState("odisha");
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const [gridSize, setGridSize] = useState(22);
  const [targets, setTargets] = useState<Target[]>([]);
  const [detail, setDetail] = useState<TargetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.regions().then((r) => setRegions(r.regions));
  }, []);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    Promise.all([
      api.heatmap(selectedState, 20),
      api.targets(selectedState, 20),
    ])
      .then(([hm, t]) => {
        setHeatmapCells(hm.cells);
        setGridSize(hm.grid_size);
        setTargets(t.targets);
      })
      .finally(() => setLoading(false));
  }, [selectedState]);

  const region = regions.find((r) => r.id === selectedState);
  const cellDeg = useMemo(() => cellSizeDeg(heatmapCells, gridSize), [heatmapCells, gridSize]);

  const openTarget = (id: string) => {
    api.targetDetail(id).then(setDetail);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-slate-100">
            Exploration Intelligence
          </h1>
          <p className="text-sm text-slate-500">
            AI-generated manganese prospectivity across sample study regions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedState(r.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                selectedState === r.id
                  ? "bg-signal-500/15 border-signal-500/40 text-signal-400"
                  : "border-abyss-700 text-slate-400 hover:text-slate-200 hover:border-abyss-600"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          className="xl:col-span-2"
          title="Prospectivity Heatmap"
          subtitle={region ? `${region.label} — synthetic grid, click a target for details` : ""}
          action={<SampleDataTag />}
        >
          <div className="h-[520px] rounded-md overflow-hidden border border-abyss-700/60">
            {region && (
              <MapContainer
                key={selectedState}
                center={region.center as [number, number]}
                zoom={region.zoom}
                className="h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {heatmapCells.map((c, i) => (
                  <Rectangle
                    key={i}
                    bounds={[
                      [c.latitude - cellDeg / 2, c.longitude - cellDeg / 2],
                      [c.latitude + cellDeg / 2, c.longitude + cellDeg / 2],
                    ]}
                    pathOptions={{
                      color: LEVEL_COLOR[c.level],
                      weight: 0,
                      fillOpacity: 0.18 + c.prospectivity * 0.35,
                    }}
                  />
                ))}
                {targets.map((t) => (
                  <CircleMarker
                    key={t.target_id}
                    center={[t.latitude, t.longitude]}
                    radius={t.priority === "HIGH" ? 7 : t.priority === "MEDIUM" ? 5 : 4}
                    pathOptions={{
                      color: "#0a1220",
                      weight: 1.5,
                      fillColor: LEVEL_COLOR[t.priority],
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{ click: () => openTarget(t.target_id) }}
                  >
                    <Tooltip direction="top" offset={[0, -4]}>
                      {t.target_id} — {Math.round(t.prospectivity * 100)}%
                    </Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LEVEL_COLOR.HIGH }} />
              High potential (≥ 75%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LEVEL_COLOR.MEDIUM }} />
              Medium potential (50–74%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LEVEL_COLOR.LOW }} />
              Low potential (&lt; 50%)
            </span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="AI Prospectivity Report" subtitle={detail ? undefined : "Click a target marker on the map"}>
            {!detail && (
              <p className="text-sm text-slate-500">
                Select a marker to view its full prospectivity breakdown and explanation.
              </p>
            )}
            {detail && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-signal-400">{detail.target_id}</span>
                  <RiskBadge level={detail.priority} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Prospectivity</p>
                    <p className="text-slate-100 font-display font-semibold">
                      {Math.round(detail.prospectivity * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Confidence</p>
                    <p className="text-slate-100 font-display font-semibold">
                      {Math.round(detail.confidence * 100)}%
                    </p>
                  </div>
                </div>
                <div className="border-t border-abyss-700/60 pt-3 space-y-1.5 text-sm">
                  <Row label="Spectral similarity" value={detail.parameters.spectral_similarity} />
                  <Row label="Geological suitability" value={detail.parameters.geological_suitability} />
                  <Row label="Terrain suitability" value={detail.parameters.terrain_suitability} />
                  <Row label="Vegetation interference" value={detail.parameters.vegetation_interference} />
                  <Row
                    label="Distance from known occurrence"
                    value={`${detail.parameters.distance_from_known_occurrence_km} km`}
                  />
                </div>
                <div className="border-t border-abyss-700/60 pt-3">
                  <p className="text-xs text-slate-500 mb-1">Why this target?</p>
                  <p className="text-sm text-slate-300">{detail.explanation.summary}</p>
                </div>
                <p className="text-[11px] text-slate-500 border-t border-abyss-700/60 pt-3">
                  {detail.disclaimer}
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Top Exploration Targets" subtitle={loading ? "Loading…" : `${targets.length} candidates`}>
            <div className="max-h-[260px] overflow-y-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-abyss-700/60">
                    <th className="px-1 py-1.5 font-medium">Target</th>
                    <th className="px-1 py-1.5 font-medium">Prospectivity</th>
                    <th className="px-1 py-1.5 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr
                      key={t.target_id}
                      onClick={() => openTarget(t.target_id)}
                      className="cursor-pointer hover:bg-abyss-800/60 border-b border-abyss-800/60"
                    >
                      <td className="px-1 py-1.5 font-mono text-signal-400">{t.target_id}</td>
                      <td className="px-1 py-1.5 text-slate-200">
                        {Math.round(t.prospectivity * 100)}%
                      </td>
                      <td className="px-1 py-1.5">
                        <RiskBadge level={t.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}
