# Intelligent Data Pipeline — React Edition

A modern, componentized **React + Vite** real-time monitoring dashboard for the **Intelligent Data Pipeline** project.

## Architecture

Built with **React 18** and **Vite**:
- `src/simulator.js`: Deterministic streaming Poisson event generator and 3-tier priority scheduler.
- `src/components/`: Modular React components:
  - `Header.jsx`: Navigation, 20× Spike trigger, theme switcher, and stream controls.
  - `SystemBanner.jsx`: Dynamic state progression ladder (`NORMAL` → `PRESSURE` → `OVERLOAD` → `EXTREME`).
  - `KpiGrid.jsx`: 6 core KPI telemetry cards.
  - `ProtectionCard.jsx`: SLA shield proving zero dropped critical payments and orders.
  - `PriorityQueues.jsx`: Side-by-side priority queues with dynamic fill meters.
  - `ChartsSection.jsx`: Chart.js Traffic vs Capacity and Latency separation charts.
  - `AdaptiveStrategy.jsx`: Policy matrix and worker saturation gauges.
  - `EventDistribution.jsx`: Donut chart of event types.
  - `BatchPanel.jsx`: Micro-batch compression metrics and animated conveyors.
  - `LiveEventFeed.jsx`: Real-time streaming log feed with interactive filters.
  - `BenchmarkComparison.jsx`: Side-by-side comparison against naive FIFO queues.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5174/](http://localhost:5174/) in your browser.

### 3. Production Build
```bash
npm run build
```

## Keyboard Shortcuts
- `Spacebar`: Toggle 20× Spike simulation
- `T`: Toggle Theme (Light / Dark)
- `P`: Pause / Resume stream
- `R`: Reset pipeline
