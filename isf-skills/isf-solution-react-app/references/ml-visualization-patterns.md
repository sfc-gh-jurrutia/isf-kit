# ML Visualization Patterns

Bridge between `isf-ml-models` (which exports SHAP, metrics, and predictions to the ML schema) and the React frontend. This reference covers API endpoint patterns, component specifications, and the end-to-end integration flow.

---

## Integration Flow

```
Snowflake ML Schema                  FastAPI Backend                   React Frontend
┌─────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│ GLOBAL_FEATURE_      │     │ GET /api/ml/features     │     │ FeatureImportanceChart   │
│   IMPORTANCE         │────▶│   ?model={name}          │────▶│   (horizontal SHAP bars) │
│                      │     │                          │     │                          │
│ PREDICTION_          │     │ GET /api/{type}/{id}/    │     │ RiskFactorPanel          │
│   EXPLANATIONS       │────▶│   detail-bundle          │────▶│   (factor decomposition) │
│                      │     │   → includes predictions │     │                          │
│ MODEL_METRICS        │     │                          │     │ PredictionCard           │
│                      │────▶│ GET /api/ml/metrics      │────▶│   (score + confidence)   │
│                      │     │   ?model={name}          │     │                          │
│ CALIBRATION_CURVES   │     │                          │     │ ModelConfidenceBar       │
│                      │────▶│ (bundled in metrics)     │────▶│   (calibrated score bar) │
└─────────────────────┘     └──────────────────────────┘     └──────────────────────────┘
```

---

## Backend API Patterns

### Feature Importance Endpoint

Serves global SHAP feature importance for a model. Used by the `FeatureImportanceChart` component.

```python
@router.get("/api/ml/features")
async def get_feature_importance(model: str, limit: int = 10):
    cached = cache_get(f"ml:features:{model}", ttl=TTL_ML)
    if cached is not None:
        return cached

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT FEATURE_NAME, SHAP_IMPORTANCE, IMPORTANCE_RANK
            FROM {DATABASE}.ML.GLOBAL_FEATURE_IMPORTANCE
            WHERE MODEL_NAME = %s
            ORDER BY IMPORTANCE_RANK ASC
            LIMIT %s
        """, (model, limit))
        cols = [d[0] for d in cursor.description]
        rows = [serialize_row(cols, r) for r in cursor.fetchall()]
    finally:
        return_connection(conn)

    cache_set(f"ml:features:{model}", rows)
    return rows
```

### Entity Prediction Endpoint

Returns per-entity predictions with factor decomposition. Bundle this into the detail-bundle endpoint (see `performance-patterns.md` pattern #4).

```python
@router.get("/api/{entity_type}/{entity_id}/detail-bundle")
async def get_detail_bundle(entity_type: str, entity_id: str):
    cached = cache_get(f"bundle:{entity_id}", ttl=TTL_DETAIL)
    if cached is not None:
        return cached

    conn = get_connection()
    result = {}
    try:
        cursor = conn.cursor()

        # Header
        cursor.execute("SELECT * FROM {DATA_MART}.{ENTITY_VIEW} WHERE ID = %s", (entity_id,))
        result["header"] = serialize_row(
            [d[0] for d in cursor.description], cursor.fetchone()
        )

        # Risk factors / metric decomposition
        cursor.execute("""
            SELECT FACTOR_NAME, FACTOR_VALUE, FACTOR_WEIGHT, SEVERITY
            FROM {DATA_MART}.{FACTOR_VIEW}
            WHERE ENTITY_ID = %s
            ORDER BY FACTOR_WEIGHT DESC
        """, (entity_id,))
        cols = [d[0] for d in cursor.description]
        result["factors"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        # Per-entity SHAP explanations
        cursor.execute("""
            SELECT FEATURE_NAME, SHAP_VALUE, FEATURE_VALUE, BASE_VALUE
            FROM {DATABASE}.ML.PREDICTION_EXPLANATIONS
            WHERE ENTITY_ID = %s AND MODEL_NAME = %s
            ORDER BY ABS(SHAP_VALUE) DESC
            LIMIT 10
        """, (entity_id, MODEL_NAME))
        cols = [d[0] for d in cursor.description]
        result["shap"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        # Prediction score
        cursor.execute("""
            SELECT PREDICTION, PROBABILITY, MODEL_NAME
            FROM {DATA_MART}.{PREDICTIONS_VIEW}
            WHERE ENTITY_ID = %s
        """, (entity_id,))
        cols = [d[0] for d in cursor.description]
        result["prediction"] = serialize_row(cols, cursor.fetchone())

        cache_set(f"bundle:{entity_id}", result)
    finally:
        return_connection(conn)

    return result
```

### Model Metrics Endpoint

Serves accuracy, precision, recall, F1, and calibration data.

```python
@router.get("/api/ml/metrics")
async def get_model_metrics(model: str):
    cached = cache_get(f"ml:metrics:{model}", ttl=TTL_METADATA)
    if cached is not None:
        return cached

    conn = get_connection()
    result = {}
    try:
        cursor = conn.cursor()

        # Scalar metrics
        cursor.execute("""
            SELECT METRIC_NAME, METRIC_VALUE, METRIC_CONTEXT, SAMPLE_COUNT
            FROM {DATABASE}.ML.MODEL_METRICS
            WHERE MODEL_NAME = %s
        """, (model,))
        cols = [d[0] for d in cursor.description]
        result["metrics"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        # Calibration curve
        cursor.execute("""
            SELECT PREDICTED_PROB_BIN, ACTUAL_FREQUENCY, BIN_COUNT
            FROM {DATABASE}.ML.CALIBRATION_CURVES
            WHERE MODEL_NAME = %s
            ORDER BY PREDICTED_PROB_BIN ASC
        """, (model,))
        cols = [d[0] for d in cursor.description]
        result["calibration"] = [serialize_row(cols, r) for r in cursor.fetchall()]

        cache_set(f"ml:metrics:{model}", result)
    finally:
        return_connection(conn)

    return result
```

---

## Component Specifications

### FeatureImportanceChart

Horizontal bar chart showing SHAP feature importance. Matches the IROP "Risk Explainability (SHAP)" panel.

**Data shape:**

```typescript
interface FeatureImportance {
  featureName: string;
  shapImportance: number;
  importanceRank: number;
}
```

**Visual spec:**

- Horizontal bars, sorted by importance (highest at top)
- Bar color: `var(--chart-danger)` for high-magnitude features, `var(--chart-warning)` for medium, `var(--chart-primary)` for low
- Bar width proportional to `shapImportance / maxImportance`
- Feature name label on the left (140px min-width)
- Value label at the end of the bar
- Optional: base rate line as a vertical dashed rule
- Optional: show a "Score: {value}" badge in the header

**Layout:**

```
┌─────────────────────────────────────────┐
│ Risk Explainability (SHAP)  Score: 87%  │
├─────────────────────────────────────────┤
│ Misconnect Prob ████████████████████  42%│
│ ATC Max Delay   █████████████████    38% │
│ High-Rev PAX    ██████████████       31% │
│ Dest Wind       ████████████         27% │
│ Turn Time       ██████████           22% │
│ Connecting Pax  ████████             18% │
│ Flight Duration ██████               14% │
│ KDP Compliance  ████                 10% │
└─────────────────────────────────────────┘
```

See `templates/components/FeatureImportanceChart.tsx` for the implementation.

### RiskFactorPanel

Factor decomposition with labeled progress bars. Matches the IROP "Risk Factors" panel (Weather 63%, Crew 67%, etc.).

**Data shape:**

```typescript
interface RiskFactor {
  name: string;
  value: number;      // 0-100 percentage
  severity?: 'low' | 'medium' | 'high' | 'critical';
  icon?: ReactNode;
}
```

**Visual spec:**

- Vertical stack of factor rows
- Each row: icon (optional) + label + progress bar + percentage value
- Progress bar fill color by severity:
  - `low`: `var(--chart-success)`
  - `medium`: `var(--chart-warning)`
  - `high`: `var(--chart-danger)`
  - `critical`: `var(--status-danger)` with `animate-crisis-glow`
- Track background: `var(--border-subtle)`
- Progress bar height: 8px with border-radius 4px
- Click-to-ask on each factor row

**Layout:**

```
┌─────────────────────────────┐
│ Risk Factors                │
├─────────────────────────────┤
│ ☁ Weather     ████████  63% │
│ 👤 Crew        █████████ 67% │
│ ✈ Aircraft    ██         8% │
│ 🔗 Connections ████      28% │
│ 📡 ATC         ███       17% │
└─────────────────────────────┘
```

See `templates/components/RiskFactorPanel.tsx` for the implementation.

### ModelConfidenceBar

A single confidence/probability score displayed as a labeled progress bar with threshold coloring.

**Visual spec:**

- Horizontal bar (full container width)
- Fill color transitions at thresholds: green (>80%), amber (50-80%), red (<50%)
- Numeric label showing percentage
- Optional: threshold marker line at the decision boundary

```tsx
function ModelConfidenceBar({ value, label, threshold = 0.5 }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = pct >= 80
    ? 'var(--status-success)'
    : pct >= 50
      ? 'var(--status-warning)'
      : 'var(--status-danger)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 3, position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: 3, transition: 'width 0.3s ease',
        }} />
        {threshold && (
          <div style={{
            position: 'absolute', left: `${threshold * 100}%`, top: -2, bottom: -2,
            width: 1, background: 'var(--text-muted)', opacity: 0.5,
          }} />
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}
```

### PredictionCard

Card showing a model prediction with confidence score and top contributing factors. Combines `ModelConfidenceBar` and a mini factor list.

**Visual spec:**

- `theme-card` surface with `onClick` for click-to-ask
- Header: prediction label (e.g., "At Risk" or "On Track") with `Badge`
- Confidence bar below the header
- Top 3 contributing factors as compact rows

```tsx
function PredictionCard({ prediction, factors, onAsk }: PredictionCardProps) {
  return (
    <Card
      variant="surface"
      onClick={() => onAsk?.(`Why is this entity predicted as ${prediction.label}?`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Prediction</span>
        <Badge variant={prediction.probability > 0.7 ? 'danger' : prediction.probability > 0.4 ? 'warning' : 'success'}>
          {prediction.label}
        </Badge>
      </div>
      <ModelConfidenceBar value={prediction.probability} label="Confidence" />
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Top Factors
        </span>
        {factors.slice(0, 3).map(f => (
          <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

---

## Detail Section Integration

When an entity is selected in the data table, the detail section should render ML visualizations alongside domain-specific content. The standard 3-column layout for the detail section:

```
┌────────────────────┬────────────────────────┬──────────────────────────┐
│  FACTOR PANEL      │  DOMAIN VISUALIZATION  │  ML EXPLAINABILITY       │
│  (RiskFactorPanel) │  (domain-specific)     │  (FeatureImportanceChart)│
│                    │                        │                          │
│  Factor breakdown  │  Route map, timeline,  │  SHAP horizontal bars    │
│  with progress     │  heatmap, or other     │  for this entity         │
│  bars              │  domain chart          │                          │
└────────────────────┴────────────────────────┴──────────────────────────┘
```

```tsx
{selectedEntity && (
  <DetailSection entityId={selectedEntity} isLoading={!detailData}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: 16 }}>
      <Card variant="surface">
        <SectionHeader title="Risk Factors" />
        <RiskFactorPanel factors={detailData.factors} onAsk={setPendingPrompt} />
      </Card>
      <Card variant="surface">
        <SectionHeader title={domainVizTitle} />
        <DomainVisualization data={detailData.domain} />
      </Card>
      <Card variant="surface">
        <SectionHeader title="Risk Explainability (SHAP)" />
        <FeatureImportanceChart
          features={detailData.shap}
          score={detailData.prediction?.probability}
        />
      </Card>
    </div>
  </DetailSection>
)}
```

---

## ML Schema to Component Mapping

| ML Schema Table | API Endpoint | React Component | Where Rendered |
|-----------------|-------------|-----------------|----------------|
| `GLOBAL_FEATURE_IMPORTANCE` | `GET /api/ml/features?model=X` | `FeatureImportanceChart` | Detail section, model info modal |
| `PREDICTION_EXPLANATIONS` | Bundled in detail-bundle | `FeatureImportanceChart` (per-entity) | Detail section |
| `MODEL_METRICS` | `GET /api/ml/metrics?model=X` | Metric cards, `DataLineageModal` | Header tooltip, settings page |
| `CALIBRATION_CURVES` | Bundled in ml/metrics | Line chart in model info | Settings / model info modal |
| Risk factors (domain tables) | Bundled in detail-bundle | `RiskFactorPanel` | Detail section |
| Predictions (domain tables) | Bundled in detail-bundle | `PredictionCard`, `Badge` | Data table column, detail section |

---

## Caching Strategy

ML data changes infrequently (only when notebooks are re-run). Use aggressive TTLs:

| Data Type | TTL | Constant |
|-----------|-----|----------|
| Feature importance (global) | 120s | `TTL_ML` |
| Per-entity predictions | 60s | `TTL_DETAIL` (bundled) |
| Model metrics | 300s | `TTL_METADATA` |
| Calibration curves | 300s | `TTL_METADATA` |
