# MANGANEX

**AI/ML and Space Technology Enabled Manganese Reserve Identification and Production Shortfall Prediction System**
*Prototype built for Smart India Hackathon (SIH)*

> ⚠️ **All exploration and production data in this prototype is synthetic** ("Prototype / Sample
> Data"), generated locally so the system runs without paid satellite APIs or licensed geological
> datasets. The ML pipeline itself (training, evaluation, forecasting, explainability) is real and
> runs end-to-end. See [Real data integration](#real-data-integration) below.

---

## 1. Architecture

```
                 SPACE TECHNOLOGY
                       |
        Satellite / Remote Sensing Data   (synthetic, prototype)
                       |
              Data Preprocessing
                       |
             Spectral + Geo Features   (NDVI, NDWI, iron-oxide index,
                       |                elevation, slope, geology score...)
                    AI / ML
          +------------+------------+
          |                         |
 Manganese Prospectivity       Supply Forecast
  (RandomForest classifier)    (Linear regression + scenario simulator)
          |                         |
 Exploration Targets          Shortfall Prediction
          |                         |
          +------------+------------+
                       |
                AI Recommendations   (rule-based, driven by live values)
                       |
             React Dashboard (MANGANEX)
```

```
manganex/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── core/config.py       # regions, CORS config
│   │   ├── api/routes.py        # all /api/* endpoints
│   │   ├── data/                # synthetic dataset generators
│   │   ├── ml/                  # prospectivity model + forecast model
│   │   └── services/            # exploration service, recommendation engine
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/                # Exploration, ProductionForecast, SupplyRisk, Analytics, About
    │   ├── components/           # Shell (nav), shared UI primitives
    │   └── services/api.ts       # typed API client
    └── package.json
```

## 2. Technology stack

- **Frontend**: React + TypeScript + Tailwind CSS + Leaflet (map) + Recharts (charts) + lucide-react (icons)
- **Backend**: Python + FastAPI + Pandas + NumPy + Scikit-learn
- **ML**: RandomForestClassifier (prospectivity) + LinearRegression (production/demand forecasting)

## 3. Setup & run

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).
On startup it trains the RandomForest prospectivity model and the forecasting models in-memory
(a few seconds) — no separate training step is required.

To regenerate the underlying synthetic datasets from scratch:

```bash
python3 -m app.data.generate_exploration_data
python3 -m app.data.generate_production_data
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `http://localhost:8000`
(see `vite.config.ts`), so make sure the backend is running first.

## 4. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/regions` | List of sample study regions (Odisha, Karnataka, MP, Maharashtra) |
| GET | `/api/exploration/targets?state=` | Ranked candidate exploration targets |
| GET | `/api/exploration/heatmap?state=` | Prospectivity grid for the map heatmap |
| GET | `/api/exploration/target/{id}` | Full AI prospectivity report for one target |
| POST | `/api/exploration/predict` | Run the model on a custom feature vector |
| GET | `/api/model/metrics` | Accuracy / precision / recall / F1 (demo, synthetic data) |
| GET | `/api/model/feature-importance` | Global RandomForest feature importance |
| GET | `/api/production/history?months=` | Historical production/demand/ops data |
| GET | `/api/production/status` | Current production, demand, supply gap, risk |
| GET | `/api/production/forecast?months_ahead=` | Forward production/demand/gap forecast |
| POST | `/api/production/scenario` | Run a what-if scenario (utilization, recovery, downtime, demand growth, etc.) |
| GET | `/api/recommendations?state=` | AI recommendations generated from live target + forecast data |

## 5. SIH demo flow

1. **Dashboard** — note the current Supply Risk badge (MODERATE/HIGH).
2. **Exploration** — open the India map, select a state (Odisha / Karnataka / Madhya Pradesh / Maharashtra).
3. View the **prospectivity heatmap** — colored grid, high/medium/low potential.
4. **Click a high-potential target marker** — see its prospectivity %, confidence, parameters, and the "Why this target?" explanation.
5. Open **Production Forecast** — production vs demand, historical + 12-month forecast.
6. Open **Supply Risk** — run the "10% Production Improvement" scenario preset and watch the supply gap and risk level drop.
7. Review the **AI Recommendations** panel — generated from the actual target list and forecast, not static text.
8. Close with: *"Explore smarter → validate faster → anticipate shortages → improve supply resilience."*

## 6. Real data integration

To move from prototype to production, each synthetic input has a documented real-world replacement
(see the module docstrings in `backend/app/data/generate_exploration_data.py` and
`generate_production_data.py` for full detail):

| Prototype (synthetic) | Real-world replacement |
|---|---|
| Spectral bands (red/green/blue/nir/swir1/swir2) | Sentinel-2 L2A or Landsat 8/9 Collection 2 surface reflectance |
| Elevation / slope | SRTM or Copernicus DEM |
| Geology score | Geological Survey of India (GSI) lithology/geology maps |
| Distance to known occurrence | GSI/IBM mineral occurrence database |
| Prospectivity label | Actual assay / drilling / known deposit outcomes |
| Production/demand history | Ministry of Mines / IBM production statistics, industry demand forecasts |

The feature-engineering → RandomForest → API → dashboard pipeline requires no structural changes
to accept real data — only the generator functions need to be swapped for real data-ingestion code.

## 7. Limitations

- All figures are synthetic; no claims are made about actual manganese deposits or real production numbers.
- The prospectivity score is an exploration-priority indicator, not a confirmed reserve estimate — field validation, geophysical survey, and drilling would be required before any reserve could be confirmed.
- The forecasting model is a transparent linear-regression approach (per prototype scope), not a full time-series model (e.g. SARIMAX/Prophet).
- Local-explanation (per-target feature contribution) is a lightweight approximation, not a full SHAP computation.
