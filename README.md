# Intelligent Data Pipeline — Observability & Simulation Engine

> An adaptive real-time streaming architecture and observability dashboard designed to handle 20× flash traffic spikes while guaranteeing zero dropped critical transactions.

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384.svg?style=flat&logo=chartdotjs)](https://www.chartjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)

---

## ⚡ Overview

The **Intelligent Data Pipeline** demonstrates how modern high-throughput streaming systems survive sudden, massive traffic surges (e.g., flash sales, ticket drops, Black Friday spikes). Instead of traditional FIFO queues where queues overflow and critical transactions fail, this system implements:

- **Dynamic Multi-Factor Classification**: Uses transaction value, customer value, and payload size with softmax probabilities to categorize events into `CRITICAL`, `MEDIUM`, and `LOW` priority tiers.
- **Adaptive Decision Routing**: Automatically transitions between `STREAM`, `BATCH`, `DEFER`, and `SHED` based on queue depth thresholds and backpressure signals.
- **SLA Shield**: Ensures **100% protection for critical events** (Payments & Orders) even under extreme load, dropping non-critical logs and batching background clicks.
- **Standalone Simulation Engine (`src/simulator.js`)**: A complete in-browser JavaScript port of the Python data pipeline algorithms, enabling real-time telemetry, interactive controls, and visual benchmarking without external server dependencies.

---

## 🏗️ Architecture & Pipeline Flow

```mermaid
flowchart LR
    A[Traffic Generator<br/>Normal: ~1k/min | Spike: ~20k/min] --> B[Multi-Factor Classifier<br/>Softmax Normalization]
    B --> C{Priority Tier}
    C -->|CRITICAL| D[Critical Queue<br/>Direct Streaming · Protected SLA]
    C -->|MEDIUM| E[Medium Queue<br/>Stream ➔ Micro-Batch ➔ Defer]
    C -->|LOW| F[Low Queue<br/>Stream ➔ Batch ➔ Defer ➔ Load Shed]
    D --> G[Processing Engine / Dashboard KPIs]
    E --> G
    F --> G
```

### 1. Multi-Factor Classification
Events (`payment`, `order`, `inventory`, `activity`, `auth`, `log`) are assigned priority scores:
- **`CRITICAL`** (Payments, Orders): Always streamed immediately. Protected SLA.
- **`MEDIUM`** (Inventory, Auth): Micro-batched under moderate load; deferred under high pressure.
- **`LOW`** (Clicks, Telemetry Logs): Micro-batched under load, deferred, or dropped (load-shed) during extreme 20× flash spikes.

### 2. System State Progression
| State | Ingestion Rate | Pipeline Strategy | Queues Behavior |
|---|---|---|---|
| **NORMAL** | < 45 events/s (~1k/min) | Direct Stream Channels | All tiers streaming smoothly |
| **PRESSURE** | 45 – 120 events/s | Micro-Batching Activated | Low-priority micro-batched |
| **OVERLOAD** | 120 – 240 events/s | Priority Queuing & Deferral | Medium batched, Low deferred |
| **EXTREME** | > 240 events/s (20× Spike) | Selective Load Shedding | Non-critical logs shed, Payments 100% protected |

---

## 🖥️ Dashboard Components

The React interface provides deep, real-time observability:

- **Header Bar**: Live status pill, dynamic traffic counter, 20× Spike trigger button, theme toggle (Dark/Light), audio telemetry toggle, and pause/reset controls.
- **System Mode Banner**: Animated alert badge tracking progression across `NORMAL` → `PRESSURE` → `OVERLOAD` → `EXTREME`.
- **6-KPI Telemetry Grid**: Real-time metrics for Incoming Rate, Target Rate, Processed Rate, Processing Capacity, p95/p50 Critical Latencies, Total Queue Depth, and Total Batched/Shed events.
- **SLA Protection Panel**: Real-time audit counters confirming zero payments/orders dropped.
- **Priority Queues**: Side-by-side queue meters showing depths, worker pools, drain rates, and status tags for each tier.
- **Dual Time-Series Charts**: Real-time Chart.js graphs comparing Incoming Traffic vs. Processing Capacity and Latency Separation across tiers.
- **Adaptive Strategy Matrix & Gauges**: Worker and queue saturation meters alongside policy summaries.
- **Ingestion Donut & Micro-Batching Panel**: Breakdown of event distributions and micro-batch compression efficiency.
- **Live Event Feed**: Real-time ring buffer of classified events with filters (`All`, `Critical`, `Batched`, `Shed`).
- **Benchmark Comparison**: Real-time head-to-head metrics comparing the Intelligent Pipeline against a traditional Naive FIFO model.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (comes with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/IronFurry/VH26-Terminal-Crew.git
cd VH26-Terminal-Crew
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5174/](http://localhost:5174/) (or the port displayed in your terminal).

### 3. Build for Production
```bash
npm run build
```
Build output will be generated inside the `dist/` directory.

---

## 🕹️ Interactive Controls & Shortcuts

| Shortcut | Action | Description |
|:---:|:---|:---|
| <kbd>Space</kbd> | **Toggle 20× Spike** | Triggers instantaneous flash surge from ~1,000/min to ~20,000/min |
| <kbd>T</kbd> | **Toggle Theme** | Switches between Dark Mode and Light Mode |
| <kbd>P</kbd> | **Pause / Resume** | Freezes the real-time simulation tick loop |
| <kbd>R</kbd> | **Reset** | Restores all queues, counters, and charts to baseline |

---

## 📁 Repository Structure

```
├── index.html                   # HTML entry point
├── package.json                 # Node dependencies and scripts
├── vite.config.js               # Vite build configuration
├── src/
│   ├── main.jsx                 # React root renderer
│   ├── App.jsx                  # Main application orchestrator & state
│   ├── simulator.js             # Standalone JS simulation engine (Poisson generator, Classifier, DecisionEngine)
│   ├── index.css                # Custom CSS design system (tokens, themes, animations)
│   └── components/
│       ├── Header.jsx           # Top navigation, spike hero trigger & controls
│       ├── SystemBanner.jsx     # Dynamic state indicator banner
│       ├── KpiGrid.jsx          # 6 Telemetry KPI cards
│       ├── ProtectionCard.jsx   # SLA protection guarantees card
│       ├── PriorityQueues.jsx   # 3-tier queue depth visualizations
│       ├── ChartsSection.jsx    # Dual Chart.js time-series charts
│       ├── AdaptiveStrategy.jsx # Saturation gauges and policy matrix
│       ├── EventDistribution.jsx# Event type donut chart
│       ├── BatchPanel.jsx       # Micro-batching performance panel
│       ├── LiveEventFeed.jsx    # Filterable live streaming event log
│       ├── BenchmarkComparison.jsx # Naive FIFO vs. Intelligent Pipeline comparison
│       └── Footer.jsx           # Application footer
└── data_pipeline/               # Python reference implementations
    ├── traffic_generator.py     # Multi-threaded event generator
    ├── classifier.py            # Feature extraction & softmax priority classification
    ├── decision_engine.py       # Queue management and routing policies
    ├── processing_engine.py     # Worker execution model
    ├── traffic_monitor.py       # Rate calculation window
    ├── metrics.py               # Aggregated pipeline metrics
    ├── models.py                # Pydantic data schemas
    └── main.py                  # FastAPI WebSocket & REST backend service
```

---

## 🛡️ License

Built for real-time observability, high-load stress testing, and resilient stream processing demonstrations.
