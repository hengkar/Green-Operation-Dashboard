# Green Ops Dashboard: Standalone HTML5 Landing Page for GitHub Pages

A portable, single-file HTML5 web application for industrial energy monitoring and carbon footprint analytics, designed for effortless deployment as a GitHub repository landing page or GitHub Pages site with zero server-side dependencies.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1 and will guide the HTML5 build:

- **Confirmed Decision 1 (Packaging Format)**: Delivered as a clean, single standalone `index.html` file with embedded scripts and styling. This enables instant zero-config hosting on GitHub Pages (or root GitHub repository) and allows the dashboard to open directly in any browser offline.
- **Confirmed Decision 2 (AI Recommendations Engine)**: Runs an intelligent client-side Plant Energy Audit Engine directly in the browser. It synthesizes facility totals (kWh by line, non-production share, peak diurnal demand hour, and metric tons CO2e) to generate 3 actionable, plain-language engineering recommendations citing exact computed plant figures.
- **Confirmed Decision 3 (Landing Page Quick-Start Experience)**: Features a dedicated "Load Sample Plant Data" 1-click action alongside standard drag-and-drop CSV upload, enabling prospective GitHub visitors, recruiters, and facility managers to explore live interactive metrics instantly without needing an existing dataset.

---

### 1. Overview & Core Concept

- **What It Does**: A production-grade industrial energy monitoring dashboard that ingests hourly plant sub-metering data (`timestamp`, `line`, `kWh`), visualizes energy consumption and carbon emissions, filters by operational shift (Production vs. Non-Production vs. All), and delivers audit-level efficiency recommendations.
- **Target Audience / Persona**: Plant managers, sustainability leads, manufacturing electrical engineers, and GitHub visitors evaluating industrial telemetry frontends.
- **Key Value**: Delivers complete analytical power (sub-meter tracking, emission factor adjustments, diurnal peak heatmaps, and shift-based energy baselines) without requiring any backend infrastructure, cloud databases, or Node.js runtime environments.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Landing & Ingestion**:
   - The user opens the page and is greeted by a clean, industrial header with plant metadata and quick actions.
   - The user can either drop their plant's CSV file (with columns `timestamp`, `line`, `kWh`) or click **"Load Sample Plant Data"** to immediately populate 14 days of realistic manufacturing sub-meter logs (Press Line, Paint Line, Assembly Line, CNC Machine Bay, and Utilities / HVAC).
2. **Top-Level KPI Assessment**:
   - The top metrics row updates in real time: Total Consumption (kWh), Total Carbon Footprint (t CO2e), Peak Demand Hour (e.g., `14:00 (682 kWh)`), and Top Consuming Line (e.g., `Paint Line (42.5%)`).
   - The user adjusts the emission factor inline (default `0.740 kg/kWh`) to recalculate plant carbon emissions instantly.
3. **Operational Shift Filtering**:
   - A 3-state segmented toggle (`All Hours`, `Production (Mon-Sat 07:00-23:00)`, `Non-Production (Off-Shift)`) filters every chart, metric card, and table row synchronously.
4. **Visual Analytics**:
   - **Daily Trend Chart**: An interactive multi-line / stacked area visualization mapping daily kilowatt-hours per sub-metered line over time with synchronized tooltips.
   - **Line Breakdown Bar Chart**: Horizontal/vertical consumption distribution comparing total kWh and off-shift waste shares across manufacturing lines.
   - **Diurnal Peak Heatmap / Distribution**: 24-hour hourly profile showing exactly when facility demand spikes occur relative to peak utility tariff windows.
   - **Raw Hourly Log Table**: Tabular view with instant live search, line filtering, sortable columns, and tabular numerals.
5. **Client-Side AI Efficiency Audit**:
   - Clicking **"Run Energy Audit"** synthesizes all computed plant metrics into exactly 3 prioritized engineering recommendations formatted as:
     `Title · Evidence (quoting exact computed numbers) · Est. kWh/month saved · Effort (L/M/H)`.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-precision industrial analytics, clean utilitarian modernism, avoiding generic AI slop (zero floating cards, zero decorative pulsing dots, zero unnecessary pill tags).
- **Color Palette**:
  - Dominant Neutral Canvas (60%): Clean crisp slate background (`#F8FAFC` light / subtle `#0F172A` deep surfaces).
  - Structural Surfaces (30%): Pure white card containers (`#FFFFFF`) with crisp 1px borders (`#E2E8F0`), high-density tabular padding.
  - Emerald Accent Budget (10%): Industrial emerald green (`#059669` / `#10B981`) reserved exclusively for primary buttons, active shift tabs, and eco-efficiency highlights.
  - Sub-meter Line Palette: High-contrast accessible tones (Emerald, Indigo, Amber, Teal, Rose).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` / clean system sans-serif with balanced headline wrapping (`text-wrap: balance`).
  - Numbers & Metrics: Tabular monospace figures (`font-variant-numeric: tabular-nums`) preventing layout jitter.
  - Metadata: Quiet inline text with typographic separators (`·`), avoiding colored capsule pill enclosures.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single-File Architecture vs. Multi-File Build Output**
  - *Chosen Approach*: Deliver a self-contained `index.html` file using modern ESM script imports (Preact/React or standalone modular vanilla JS engine with lightweight Canvas/SVG chart rendering and Tailwind CDN / scoped styles).
  - *Why*: Enables seamless GitHub Pages hosting without requiring GitHub Actions build pipelines or `npm run build` steps. Anyone can clone the repo and double-click `index.html` to run it offline.
  - *Alternatives Considered*: Vite multi-file build (`dist/` directory) was passed over to ensure the output is directly editable and runnable anywhere without node toolchains.
- **Decision 2: Client-Side Heuristic Audit Engine vs. External API Calls**
  - *Chosen Approach*: Fully client-side mathematical energy audit heuristics calculating baseload waste, peak-shaving potential, and off-shift utility leaks.
  - *Why*: Eliminates CORS issues, server proxy requirements, API rate limits, and exposed API keys on public GitHub Pages sites.
  - *Alternatives Considered*: Client-side Gemini API key prompts were rejected in favor of guaranteed instant offline execution for every landing page visitor.
- **Decision 3: Canvas / SVG Vector Charting vs. Heavy Heavyweight Chart Libraries**
  - *Chosen Approach*: Lightweight, high-performance SVG/Canvas charting with crisp retina scaling and native tooltip hover tracking.
  - *Why*: Zero external bundle lag, zero dependency vulnerabilities, and instant render performance under large hourly datasets (3,000+ data points).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Standalone index.html                           │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Top Bar: Brand, Plant Status, Emission Factor Input, Load Demo     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Dropzone & CSV Parser  (Streaming parser for timestamp, line, kWh) │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Shift Filter Engine: [All Hours] [Production] [Non-Production]      │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Top KPI Cards: Total kWh | Total t CO2e | Peak Hour | Top Line     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────┬────────────────────────────────┐ │
│ │ Stacked Area Trend Chart (Daily)  │ Line Breakdown Bar Chart       │ │
│ ├───────────────────────────────────┴────────────────────────────────┤ │
│ │ 24-Hour Diurnal Peak Demand Heatmap                                │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ AI Energy Recommendations Engine (3 Items: Title · Evidence · kWh) │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │ Raw Log Data Table (Search, Filter, Pagination, Tabular Numerals)  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Parsing Logic
- **Hourly Record**: `{ timestamp: Date, line: string, kwh: number, isProduction: boolean, hour: number, dayKey: string }`
- **Shift Classification**:
  - `isProduction = (dayOfWeek >= 1 && dayOfWeek <= 6) && (hour >= 7 && hour < 23)`
  - Matches prompt rule: Monday through Saturday, 07:00 to 23:00.
- **Computed Plant Summary**:
  - `totalKwh`: Sum of filtered hourly consumption.
  - `emissionFactor`: Configurable kg CO2e / kWh (default 0.740).
  - `totalCo2eKg` & `totalCo2eTons`: Computed carbon equivalent footprint.
  - `peakHour`: Hour with the highest aggregated kWh and its consumption.
  - `lineTotals`: Array of `{ line, totalKwh, percentage, nonProductionKwh, nonProductionShare }`.

#### GitHub Repository Deployment Guide (Included in Output)
1. **GitHub Pages Direct Host**: Push `index.html` to the repository's root, navigate to *Settings > Pages*, and select `Deploy from a branch` -> `main` / `root`.
2. **README.md Documentation**: Provide a clear project overview, live demo link, and sample CSV schema description for visitors.
