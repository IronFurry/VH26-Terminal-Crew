# Intelligent Data Pipeline — Real-Time Adaptive Observability Dashboard

A modern, high-performance real-time monitoring dashboard designed to demonstrate how an adaptive streaming data pipeline handles a sudden **20× traffic spike** (1,000 events/min → 20,000 events/min).

The architecture prioritizes critical revenue-generating transactions (Payments, Orders) while adaptively micro-batching, deferring, and shedding low-priority telemetry (Clicks, Logs) to maintain strict SLAs.

## Key Features

- **20× Spike Simulation Engine**: Visually models the transition from normal load (16.7 events/s) to peak flash sale surge (333.3 events/s).
- **Critical Event Protection (SLA Shield)**: Guarantees **Payments Dropped: 0** and **Orders Dropped: 0** with dedicated queue isolation and backpressure.
- **3-Tier Priority Queues**: Side-by-side buffer meters for **CRITICAL**, **MEDIUM**, and **LOW** priority events.
- **Real-Time Streaming Charts**:
  - *Traffic vs Processing Capacity*: Ingress vs adaptive worker throughput with flash sale milestone markers.
  - *End-to-End Latency by Priority*: Demonstrates flat critical latency (~50ms) while low-priority telemetry absorbs delay.
- **Dual-Theme Mode**: Instant toggle between clean **White & Orange Light Mode** and **Cyber Obsidian Dark Mode**.
- **Live Event Feed**: Real-time event log with priority badges, status dots, and filter chips (`All`, `Critical Only`, `Batched`, `Shed`).
- **Architectural Benchmark**: Head-to-head comparison against naive FIFO queues.

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Spacebar` | Toggle 20× Spike simulation |
| `T` | Toggle Theme (Light / Dark) |
| `P` | Pause / Resume pipeline |
| `R` | Reset pipeline to baseline |

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Build for Production
```bash
npm run build
```
