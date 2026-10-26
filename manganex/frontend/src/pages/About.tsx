import { Panel } from "../components/ui";

export default function About() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="font-display text-lg font-semibold text-slate-100">About MANGANEX</h1>
        <p className="text-sm text-slate-500">
          AI/ML and Space Technology Enabled Manganese Reserve Identification and Production
          Shortfall Prediction System
        </p>
      </div>

      <Panel title="What this prototype demonstrates">
        <p className="text-sm text-slate-300 leading-relaxed">
          MANGANEX is a Smart India Hackathon prototype demonstrating how satellite/geospatial
          data, geological information, and machine learning could be combined into a single
          decision-support platform for manganese exploration and supply-chain planning. It
          includes a real, runnable ML pipeline (RandomForest prospectivity model, regression-based
          production forecasting, a scenario simulator, and a rule-based recommendation engine)
          wired end-to-end through a FastAPI backend to this dashboard.
        </p>
      </Panel>

      <Panel title="What is and isn't real here">
        <ul className="space-y-2 text-sm text-slate-300">
          <li>
            <span className="text-signal-400 font-medium">Real:</span> the ML pipeline (feature
            engineering → train/test split → RandomForest → evaluation → explainability), the
            forecasting/scenario math, and the API/dashboard wiring.
          </li>
          <li>
            <span className="text-risk-medium font-medium">Synthetic:</span> every spectral band
            value, geological score, production/demand figure, and "known occurrence" location.
            None of this was measured from real satellite imagery, geological surveys, or
            production records — see the Analytics page for how real data sources would be
            substituted in.
          </li>
        </ul>
      </Panel>

      <Panel title="Important disclaimer">
        <p className="text-sm text-slate-300 leading-relaxed">
          Model outputs indicate exploration <span className="text-slate-100">prospectivity</span>,
          not confirmed mineral reserves. Any real-world use would require geological validation,
          field sampling, geophysical investigation, and drilling before a reserve could be
          confirmed. Production/demand forecasts are illustrative regression projections on
          synthetic data, not economic forecasts.
        </p>
      </Panel>

      <Panel title="Limitations & future improvements">
        <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300">
          <li>Replace synthetic spectral/geological features with real Sentinel-2/Landsat/GSI data</li>
          <li>Replace the synthetic prospectivity label with actual assay/drilling outcomes</li>
          <li>Add a true time-series model (e.g. SARIMAX/Prophet) once real historical production data is available</li>
          <li>Add authentication and persistent storage for production deployment</li>
          <li>Expand explainability from the current lightweight approximation to full SHAP values</li>
        </ul>
      </Panel>
    </div>
  );
}
