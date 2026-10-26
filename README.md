# AEGIS AIR — Counter-Drone Intelligence & Airspace Surveillance Platform
> **Defence Hackathon Submission** · Track: *Counter-Drone Monitoring & Airspace Security*  
> **Architecture**: React 19 · TypeScript · Vite · Tailwind CSS · Leaflet GIS · Open-Meteo REST API · PWA Service Worker

---

## 1. System Overview

**AEGIS AIR** is a browser-based situational awareness console engineered for Counter-Unmanned Aerial Systems (C-UAS) defense monitoring. It delivers a hybrid operational model combining **real-world geographic mapping (Leaflet/OSM)**, **live atmospheric intelligence (Open-Meteo API)**, and an **airspace simulation engine** executing deterministic multi-target kinematic propagation, threat classification, and C-UAS electronic/kinetic countermeasure engagement.

### Core Capabilities
* **Dual-Mode Tactical Projection**: Switch dynamically between an **Orthographic Vector Schematic** (±10 km hairline radar grid with sweep animation) and a **Geographic WGS84 GIS Map** (Leaflet with CartoDB Positron / OSM Standard tiles).
* **Deterministic Simulation Engine**: Reproducible multi-threat scenarios (*High-Speed Fixed-Wing Incursion*, *Low-Altitude Kamikaze FPV*, *Multi-Node Swarm Mesh*, *Unidentified Reconnaissance*).
* **Live Environmental Intelligence**: Integration with Open-Meteo API providing real-time ambient temperature, 10m wind vector (speed & direction), relative humidity, and precipitation for UAS operational flight envelope assessment.
* **C-UAS Electronic Countermeasure Simulation**: Real-time simulation of directional RF Jamming (2.4/5.8 GHz C2 link severing), GNSS Spoofing, Net Capture, and High-Power Microwave EMP disruption with physics responses.
* **Incident Audit & Cryptographic Log**: Searchable, severity-filtered incident console with one-click operator acknowledgment and track jumping.
* **Empirical Telemetry & Performance Analytics**: Real-time SVG time-series density graphs, telemetry freshness distribution, kinematic prediction error calculations against synthetic ground truth, and execution latency benchmarks.
* **Mission Dossier & Multi-Format Export**: Incident debrief ledger with instant CSV export, structured JSON export, and print-ready stylesheet.

---

## 2. Setup and Execution Instructions

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Installation
```bash
# Clone or navigate into the project workspace
cd "c:/Users/prash/OneDrive/Desktop/New folder (2)"

# Install verified dependencies (including @supabase/supabase-js)
npm install
```

### Supabase Authentication & Database Configuration

AEGIS AIR is connected to your Supabase project with Row Level Security (RLS) and persistent session handling.

1. **Environment Variables**:
   Create or verify `.env` in the root directory (already added to `.gitignore`):
   ```env
   VITE_SUPABASE_URL=https://dwzmuukjolqunpjetpal.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Xkd8XoYczKmAooDosUGcxw_V2-5f4Ra
   ```
   > **Security Note**: Never expose the Supabase `service_role` secret key in frontend code. Only the publishable key is used.

2. **Run the Database SQL Migration**:
   To set up the `profiles` table and Row Level Security policies:
   - Navigate to your Supabase Dashboard: [https://supabase.com/dashboard/project/dwzmuukjolqunpjetpal](https://supabase.com/dashboard/project/dwzmuukjolqunpjetpal)
   - Click on the **SQL Editor** tab in the left-hand navigation bar.
   - Click **+ New query**.
   - Copy and paste the contents of `supabase/migrations/20261026_create_profiles.sql`.
   - Click **Run** (or press `Ctrl` + `Enter`).
   - The `public.profiles` table is now secured with RLS policies allowing users to only read and modify their own records.

### Running Locally (Development Server)
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:5173/`

### Production Build & Typecheck
```bash
npm run build
```
Executes `tsc -b && vite build`. Produces optimized production artifacts in `dist/`.

### Static Analysis & Linter Verification
```bash
npm run lint
```
Verified with **0 errors and 0 warnings** across all TypeScript files.

---

## 3. Architecture & File Structure

```
vayunet/
├── public/
│   ├── sw.js                     # Offline Application Shell Service Worker
│   ├── favicon.svg               # Vector brand radar mark
│   └── icons.svg                 # UI symbols
├── src/
│   ├── context/
│   │   ├── airspaceContextDef.ts # Context interface and provider definition
│   │   ├── AirspaceContext.tsx   # Simulation loop, physics, scenarios, timers
│   │   └── useAirspace.ts        # Typed consumer hook (Fast-Refresh compliant)
│   ├── types/
│   │   ├── telemetry.ts          # Tracks, IFF, KPIs, countermeasures, analytics
│   │   └── provenance.ts         # Provenance enum (LIVE_API, SIMULATED, CACHED, etc.)
│   ├── services/
│   │   └── weatherService.ts     # Open-Meteo REST client with caching & fallback
│   ├── utils/
│   │   ├── seedData.ts           # Deterministic baseline tracks & events
│   │   ├── geoAreas.ts           # Safe civilian demonstration areas & coordinates
│   │   ├── telemetryQuality.ts   # Composite track quality index formula
│   │   └── audio.ts              # Synthesized Web Audio API tactical alert sounder
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx        # Brand, clock, online/offline status, sim controls
│   │   │   └── Navigation.tsx    # Tab bar (Live Airspace, Incidents, Telemetry, Dossier)
│   │   ├── monitor/
│   │   │   ├── MonitorView.tsx   # Primary dashboard container & view switcher
│   │   │   ├── SummaryCards.tsx  # KPI summary metrics
│   │   │   ├── WeatherWidget.tsx # Live Open-Meteo atmospheric telemetry panel
│   │   │   ├── AirspaceMap.tsx   # Canvas 2D orthographic radar vector plot
│   │   │   ├── GeoAirspaceMap.tsx# Leaflet real-world map with synthetic track overlay
│   │   │   ├── TrackList.tsx     # Filterable active contacts list
│   │   │   ├── TrackDetail.tsx   # Selected target telemetry, IFF & countermeasures
│   │   │   └── EventTicker.tsx   # Real-time event ticker tape
│   │   ├── events/
│   │   │   └── EventConsole.tsx  # Incident log audit console & acknowledgement
│   │   ├── analytics/
│   │   │   └── AnalyticsView.tsx # Time-series density, error table, latency benchmark
│   │   └── reports/
│   │   │   └── ReportsView.tsx   # Mission dossier, CSV/JSON export, print view
│   ├── App.tsx                   # Main layout shell
│   ├── main.tsx                  # Root mount & Service Worker registration
│   └── index.css                 # Editorial serif typography & print styles
```

---

## 4. Mathematical Models & Physics Simulation Algorithms

### A. Kinematic Trajectory Prediction & Ground-Truth Deviation
The model predicts track displacement using dead reckoning:
$$\Delta x_{\text{pred}} = \frac{v}{3600} \cdot \Delta t \cdot \sin(\theta_{\text{hdg}}), \quad \Delta y_{\text{pred}} = \frac{v}{3600} \cdot \Delta t \cdot \cos(\theta_{\text{hdg}})$$

Synthetic ground truth simulates realistic atmospheric boundary layer crosswinds and micro-gust perturbations:
$$x_{\text{actual}} = x_{\text{pred}} + \sin(\phi_{\text{azimuth}} + h_{\text{alt}}) \cdot 0.003$$
$$y_{\text{actual}} = y_{\text{pred}} + \sin(\phi_{\text{azimuth}} + h_{\text{alt}}) \cdot 0.0015$$

The **Kinematic Prediction Error** $\epsilon_{\text{pred}}$ is computed on every simulation tick:
$$\epsilon_{\text{pred}} = \sqrt{(x_{\text{actual}} - x_{\text{pred}})^2 + (y_{\text{actual}} - y_{\text{pred}})^2} \times 1000 \quad \text{(meters)}$$
This produces empirical Root Mean Square Error (RMSE) and Mean Absolute Error (MAE) dynamically charted in the Telemetry section.

### B. Geodesic WGS84 Coordinate Conversion
To project Cartesian grid kilometers $(x, y)$ onto real-world geodesic coordinates $(\text{Lat}, \text{Lng})$ relative to a demonstration anchor point $(\text{Lat}_0, \text{Lng}_0)$:
$$\text{Lat} = \text{Lat}_0 + \frac{y}{110.574}, \quad \text{Lng} = \text{Lng}_0 + \frac{x}{111.320 \cdot \cos\left(\frac{\text{Lat}_0 \cdot \pi}{180}\right)}$$

### C. Multi-Sensor Data Quality Index (DQI)
Data Quality Percentage ($Q$) is evaluated continuously using multi-variable telemetry weighting:
$$Q = 0.35 \cdot S_{\text{RSSI}} + 0.25 \cdot S_{\text{Payload}} + 0.20 \cdot S_{\text{Protocol}} + 0.20 \cdot S_{\text{Continuity}} - P_{\text{Jamming}}$$
Where:
* $S_{\text{RSSI}} = \min\left(100, \max\left(0, \frac{\text{RSSI} + 95}{45} \times 100\right)\right)$
* $P_{\text{Jamming}} = 35$ when active countermeasure is detected.

### D. Electronic Countermeasure (C-UAS) Attenuation
* **RF Jamming (`RF_JAM`)**: Induces stochastic heading deviation $\Delta \theta \sim \mathcal{U}(-20^\circ, +20^\circ)$, exponentially degrades speed ($v_{t+1} = \max(5, 0.85 \cdot v_t)$), and initiates controlled forced descent ($\Delta h = -15\,\text{m/s}$). Status transitions to `NEUTRALIZED` upon ground contact ($h \le 5\,\text{m}$).
* **GNSS Spoofing (`GPS_SPOOF`)**: Injects false navigational waypoints causing circular loitering away from the protected core perimeter.

---

## 5. Data Provenance & Trust Model

Every panel and telemetry metric displays explicit, typed provenance labels to prevent operator ambiguity:

| Provenance Label | Color Code | Description | Example in Application |
| :--- | :--- | :--- | :--- |
| `LIVE_API` | Emerald Badge | Verified real-time external API response | Open-Meteo Weather & Live Geolocation API |
| `LIVE_TILES` | Slate/Emerald | Live tile server network response | OpenStreetMap Standard / Esri Tactical Gray |
| `SIMULATED` | Indigo/Cyan Badge | Synthetically calculated mathematical model | Radar drone tracks, IFF, predictions |
| `CACHED` | Amber Badge | Stored previous response used due to network/offline | Stale weather reading when offline |
| `UNAVAILABLE` | Rose Badge | External source unreachable; honest fallback | Offline network notification |
| `LOCAL` | Stone Badge | Generated locally in client sandbox | System IST clock, performance timings |

> **Operational Notice**: Atmospheric weather telemetry is integrated solely for UAS flight envelope evaluation. Weather parameters do **not** constitute radar contact detections.

---

## 6. Verification Checklist & Test Outcomes

| Feature / Acceptance Criteria | Status | Verification Method |
| :--- | :---: | :--- |
| **Deterministic Simulation Loop** | **VERIFIED** | Pauses truly halt physics and sweep; Reset restores initial 6 tracks deterministically. |
| **Orthographic Vector Schematic** | **VERIFIED** | Canvas-based ±10 km grid renders diamond track symbols, headings, projected dots, range rings. |
| **Geographic Map (Leaflet)** | **VERIFIED** | Real-world map renders OpenStreetMap & Esri Tactical Gray tiles (100% free, no watermarks). |
| **Live Location API & Nominatim** | **VERIFIED** | Single-click Live Geolocation API (IP/GPS) + OpenStreetMap Nominatim global live city search. |
| **Safe Demo Area Switcher** | **VERIFIED** | Switches between Bengaluru, Northern Proving Ground, Coastal Grid, Hyderabad, and Eastern Hub. |
| **Live Open-Meteo Weather** | **VERIFIED** | Fetches live temperature, wind speed/direction, and precipitation with `[LIVE_API]` badge. |
| **Offline Weather Resilience** | **VERIFIED** | Caches responses in `localStorage`; falls back gracefully to `[CACHED]` state if offline. |
| **Countermeasure Engagement** | **VERIFIED** | RF Jamming triggers audio, modifies physics (speed/alt decay), and logs audit event. |
| **Incident Audit Console** | **VERIFIED** | Severity filters (Critical, Warning, Info, Success), operator acknowledgment, clear resolved. |
| **Telemetry Analytics** | **VERIFIED** | SVG time-series density plot, freshness distribution, prediction error table, latency sparkline. |
| **Incident Dossier & Exports** | **VERIFIED** | Generates real CSV export (`vayunet_incident_log_*.csv`) and JSON dossier; print preview view. |
| **PWA Service Worker** | **VERIFIED** | `public/sw.js` caches application shell (`/`, `index.html`, SVGs); handles offline navigation. |
| **Mobile Responsiveness (390px)** | **VERIFIED** | Verified at 390x844 viewport: controls wrap neatly, horizontal tab scroll, clean card stacking. |
| **Production Build** | **VERIFIED** | `npm run build` succeeds with exit code 0 (`dist/` generated cleanly). |
| **Linter / Typecheck** | **VERIFIED** | `npx oxlint` reports **0 warnings and 0 errors** across 33 files. |

---

## 7. 3-Minute Hackathon Demonstration Script

### Minute 0:00 – 0:45: The Problem & Live Situation Overview
* **Narrative**: *"Judges, in modern defense environments, counter-drone security requires immediate situational clarity without operator confusion. Welcome to AEGIS AIR."*
* **Action**:
  1. Open dashboard. Point out the top status bar: IST Clock, **Sensors Online** indicator, and **SIMULATION MODE** badge.
  2. Highlight the 4 KPI summary cards (Active Radar Contacts, Sensor Clock Rate, Pending Incursions, Defense Integrity Score).
  3. Point to the **Environmental Intelligence Widget** showing live atmospheric data retrieved directly from Open-Meteo (`[LIVE_API]` badge), noting nominal drone flight conditions.

### Minute 0:45 – 1:30: Dual-Mode Tactical Airspace & Geographic Realism
* **Narrative**: *"AEGIS AIR bridges high-precision vector schematics with real-world geospatial context."*
* **Action**:
  1. Click **Geographic Map** toggle. Show the real-world Leaflet map loading over the **Bengaluru Aero Innovation Corridor**.
  2. Point out how synthetic contacts (`[SIM]`) are georeferenced with heading vectors and 10-second trajectory projection lines.
  3. Click the area selector and select **Northern Civilian Drone Proving Ground**. Observe the map pan seamlessly to New Delhi outer sector and the weather widget update automatically.
  4. Switch back to **Vector Schematic** to demonstrate the offline-resilient ±10 km canvas radar sweep.

### Minute 1:30 – 2:15: Threat Injection & C-UAS Electronic Countermeasure
* **Narrative**: *"Now, let's inject an active drone swarm threat and execute a countermeasure."*
* **Action**:
  1. Click the **+ Swarm** button. Observe 3 coordinated FPV swarm nodes penetrate Sector Bravo.
  2. Select hostile contact `TRK-7082 (SPECTRE-01)`. Review its telemetry in the right panel (speed, altitude, RF frequency 2.442 GHz, RSSI -68 dBm, optical pod munition payload).
  3. Under C-UAS Countermeasures, click **RF Jamming**. Listen to the audio alert, observe the countermeasure pulse to active state, and watch the drone's speed and altitude decay as the C2 link is severed.
  4. Note the automated incident recorded in the bottom Event Ticker.

### Minute 2:15 – 3:00: Incidents, Analytics, Dossier Export & Resilience
* **Narrative**: *"All telemetry and incident forensics are tracked deterministically with complete data provenance."*
* **Action**:
  1. Click **Incident Log (02)**: Show the chronological audit trail; click **Acknowledge** on the incursion event.
  2. Click **Telemetry (03)**: Show the SVG time-series density plot, signal freshness distribution, prediction error table against ground truth, and real-time execution latency benchmark.
  3. Click **Dossier (04)**: Highlight the executive debrief; click **Export CSV** (downloads incident ledger file) and click **Print Preview** to demonstrate the defense-ready printed brief.
  4. Return to **Live Airspace (01)**, click **Running (Pause)** to freeze simulation physics, and click **Reset** to return to the deterministic baseline.
* **Closing**: *"AEGIS AIR delivers a robust, responsive, defense-grade C-UAS situational awareness solution. Thank you."*

---

## 8. Current Limitations & Future Roadmap

* **Synthetic RF Sensors**: In the prototype, RF triangulation and radar cross-section data are generated synthetically; in future phases, this can be bound to SDR feeds (e.g. HackRF, USRP) over WebSockets.
* **Map Tile Offline Cache**: Geographic tiles require an initial internet connection or local tile server cache; when completely offline, the system automatically falls back to the 100% offline-capable Vector Schematic.
* **Kinetic Countermeasure Hardware**: Interceptor nets and EMP pulses are simulated via aerodynamic decay algorithms; physical effector hardware APIs are not coupled in this demonstrator.
