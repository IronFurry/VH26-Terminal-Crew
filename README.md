# ⚡ Intelligent Data Pipeline — Observability & Adaptive Stream Engine

> **An adaptive, high-throughput stream processing architecture and real-time observability dashboard built to survive 20× flash traffic spikes with 100% SLA protection for critical transactions, zero dropped payments, and automated Redis-to-MongoDB batch persistence.**

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384.svg?style=flat&logo=chartdotjs)](https://www.chartjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Streaming-231F20.svg?style=flat&logo=apachekafka)](https://kafka.apache.org/)
[![Redis](https://img.shields.io/badge/Redis-Stream_Buffer-DC382D.svg?style=flat&logo=redis)](https://redis.io/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Batch_Storage-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/atlas)

---

## 📑 Table of Contents

- [System Overview](#-system-overview)
- [Architecture & End-to-End Flow](#-architecture--end-to-end-flow)
  - [1. Multi-Factor Dynamic Classification](#1-multi-factor-dynamic-classification)
  - [2. Adaptive Decision Engine & Backpressure](#2-adaptive-decision-engine--backpressure)
  - [3. SLA Shield Guarantee](#3-sla-shield-guarantee)
  - [4. Redis Stream Buffer & MongoDB Batch Persistence](#4-redis-stream-buffer--mongodb-batch-persistence)
- [System State Progression Matrix](#-system-state-progression-matrix)
- [Dual Operational Modes](#-dual-operational-modes)
- [Interactive Observability Dashboard](#-interactive-observability-dashboard)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start (Docker + Backend + Frontend)](#quick-start-docker--backend--frontend)
  - [Running the Traffic Spike Generator](#running-the-traffic-spike-generator)
- [API Reference](#-api-reference)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting & Gotchas](#-troubleshooting--gotchas)

---

## ⚡ System Overview

During flash sales, ticket drops, or peak promotional events, traditional First-In-First-Out (FIFO) queuing architectures experience catastrophic failure: queue depths explode, system memory exhausts, and mission-critical orders fail alongside low-priority background analytics.

The **Intelligent Data Pipeline** solves this problem by combining:
1. **Dynamic Multi-Factor Classification** (Softmax Scoring)
2. **Adaptive Decision Routing** (`STREAM`, `BATCH`, `DEFER`, `SHED`)
3. **Real-time Kafka Event Streaming** with partitioned priority queues
4. **Redis Stream High-Throughput Buffering**
5. **MongoDB Atlas Batch Persistence** with offset acknowledgment (`xack`)
6. **Live Observability Dashboard** with a 50-entry live telemetry ring buffer and sub-second SSE updates

---

## 🏗️ Architecture & End-to-End Flow

```mermaid
flowchart TD
    TG[Traffic Generator<br/>Normal: ~1k/min | 20x Spike: ~20k/min] -->|POST /events| API[FastAPI Ingestion Gateway<br/>port 8000]
    
    API --> CLF[Multi-Factor Classifier<br/>Softmax Normalization]
    CLF --> DEC{Adaptive Decision Engine<br/>Queue Depths + Traffic Rate}
    
    DEC -->|CRITICAL| Q_CRIT[Critical Stream<br/>Priority: High | Direct Stream]
    DEC -->|MEDIUM| Q_MED[Medium Stream<br/>Stream ➔ Micro-Batch ➔ Defer]
    DEC -->|LOW| Q_LOW[Low Stream<br/>Stream ➔ Batch ➔ Defer ➔ Load Shed]
    
    DEC -->|Async Buffered Ingestion| REDIS[(Redis Stream<br/>pipeline_stream)]
    REDIS -->|Background Worker<br/>100 items / batch| MONGO[(MongoDB Atlas<br/>transactions collection)]
    
    Q_CRIT --> KAFKA[Apache Kafka Broker<br/>critical-events]
    Q_MED --> KAFKA2[Apache Kafka Broker<br/>medium-events]
    Q_LOW --> KAFKA3[Apache Kafka Broker<br/>low-events]
    
    API -->|SSE Broadcast| DASH[React Dashboard<br/>50-Entry Live Event Table + Metrics]
```

### 1. Multi-Factor Dynamic Classification
Every incoming payload is extracted across key dimensions:
- **Transaction Value**: Direct financial impact
- **Customer Lifetime Value (CLV)**: Customer VIP tier rating (0.05 – 1.0)
- **Processing Cost**: CPU/time required to execute
- **Payload Data Size**: Network overhead

Weighted inputs are normalized via **Softmax probabilities** to assign:
- **`CRITICAL`** (Payments, Orders): Always streamed immediately. Guaranteed protected SLA.
- **`MEDIUM`** (Inventory, Auth): Micro-batched under moderate load; deferred under high pressure.
- **`LOW`** (Clicks, Telemetry Logs): Micro-batched under load, deferred, or dropped (load-shed) during extreme surges.

### 2. Adaptive Decision Engine & Backpressure
The pipeline continuously samples queue saturation and traffic velocity to decide action per event:
- **`STREAM`**: Sent immediately through Kafka with zero queue delay.
- **`BATCH`**: Compacted into micro-batches of 5 – 50 items to maximize database write throughput and reduce network calls.
- **`DEFER`**: Held in backpressure buffers until queue drain rates normalize.
- **`SHED`**: Selectively discarded (telemetry/clicks only) to free bandwidth for critical financial transactions.

### 3. SLA Shield Guarantee
- **Zero Dropped Critical Transactions**: Even during sustained 20,000 events/min spikes, payments and orders achieve a 100% success rate.
- **Latency Separation**: Critical transactions maintain a p95 latency of < 55ms, while non-critical queues absorb backpressure.

### 4. Redis Stream Buffer & MongoDB Batch Persistence
- Ingestion writes events to a lightweight **Redis Stream** (`pipeline_stream`) in `< 0.2ms`.
- An asynchronous **Storage Manager** background worker automatically polls Redis using consumer groups (`xreadgroup`), bulk-inserts batches of 100 documents into **MongoDB Atlas** (`transactions.insert_many(ordered=False)`), and acknowledges offsets (`xack`).
- Supports automatic recovery of pending unacknowledged messages upon restart.

---

## 📊 System State Progression Matrix

| State | Ingestion Rate | Pipeline Strategy | Tier Behavior | Critical Protection |
|:---|:---:|:---|:---|:---:|
| **NORMAL** | < 45 req/s (~1k/min) | Direct Stream Channels | All tiers streaming with zero delay | 100% SLA |
| **PRESSURE** | 45 – 120 req/s | Micro-Batching Activated | Low-priority batched in groups of 5-10 | 100% SLA |
| **OVERLOAD** | 120 – 240 req/s | Priority Queuing & Deferral | Medium batched, Low deferred | 100% SLA |
| **EXTREME** | > 240 req/s (20× Spike) | Selective Load Shedding | Low shed, Medium batched, Critical streamed | **100% SLA Guaranteed** |

---

## 🔄 Dual Operational Modes

The project can be operated in two distinct modes:

1. **Full Production Pipeline Mode (Recommended)**:
   - Real FastAPI backend on `http://localhost:8000`
   - Real Apache Kafka container (`localhost:9092`)
   - Real Redis Stream container (`localhost:6379`)
   - Real MongoDB Atlas cloud database
   - Real-time Server-Sent Events (SSE) streaming live metrics to the React dashboard

2. **Standalone Simulation Engine Mode**:
   - When the backend is offline, the React frontend automatically falls back to an embedded JavaScript simulation engine ([`src/simulator.js`](src/simulator.js)).
   - Simulates Poisson distribution event traffic, dynamic multi-factor scoring, adaptive routing, and naive FIFO benchmarking directly in-browser with zero external dependencies.

---

## 🖥️ Interactive Observability Dashboard

The React + Vite frontend delivers deep real-time observability:

- **Live Mode Pill & Traffic Counter**: Real-time indication of backend connection status (`LIVE BACKEND` vs `SIMULATOR ACTIVE`).
- **Dynamic System Mode Banner**: Transitions across `NORMAL` → `PRESSURE` → `OVERLOAD` → `EXTREME`.
- **6-KPI Telemetry Cards**: Incoming rate, target rate, processed rate, processing capacity, p95/p50 critical latencies, queue depths, and batched/shed totals.
- **SLA Protection Audit**: Live audit counters confirming 0 critical transactions dropped.
- **Dual Time-Series Charts**: High-frequency Chart.js monitors comparing Traffic vs. Capacity and Latency Separation across tiers.
- **50-Entry Live Event Table**: Real-time ring buffer displaying the latest 50 events with interactive filters (`All`, `Critical Only`, `Batched`, `Shed`), confidence scores, regions, and execution status.
- **Head-to-Head Benchmark**: Real-time side-by-side comparison between the Intelligent Pipeline and a traditional Naive FIFO architecture.

---

## 📁 Project Directory Structure

```
VH26-Terminal-Crew/
├── index.html                   # HTML entry point
├── package.json                 # Frontend dependencies (React, Vite, Chart.js)
├── vite.config.js               # Vite build configuration
├── src/                         # Frontend Application Source
│   ├── main.jsx                 # React root render
│   ├── App.jsx                  # Main dashboard orchestrator, SSE receiver & state
│   ├── simulator.js             # Standalone in-browser simulation engine
│   ├── style.css                # CSS design system (tokens, themes, tables, animations)
│   └── components/
│       ├── Header.jsx           # Top bar, theme toggle, audio telemetry & spike trigger
│       ├── SystemBanner.jsx     # Dynamic state indicator banner
│       ├── KpiGrid.jsx          # 6 Telemetry KPI cards
│       ├── ProtectionCard.jsx   # SLA audit & safety guarantees
│       ├── PriorityQueues.jsx   # Side-by-side queue meters & worker pools
│       ├── ChartsSection.jsx    # Real-time Chart.js time-series graphs
│       ├── AdaptiveStrategy.jsx # Saturation gauges and policy matrix
│       ├── EventDistribution.jsx# Event type distribution donut chart
│       ├── BatchPanel.jsx       # Micro-batching performance panel
│       ├── LiveEventFeed.jsx    # 50-entry live event stream table
│       ├── BenchmarkComparison.jsx # Naive FIFO vs. Intelligent Pipeline
│       └── Footer.jsx           # Application footer
│
├── data_pipeline/               # Python Production Backend Service
│   ├── main.py                  # FastAPI REST, SSE streaming & storage gateway
│   ├── storage_manager.py       # Redis Stream buffer & MongoDB Atlas batch sync
│   ├── classifier.py            # Multi-factor scoring & softmax classification
│   ├── decision_engine.py       # Adaptive routing & backpressure policies
│   ├── kafka_manager.py         # Async Kafka producer & topic management
│   ├── kafka_workers.py         # Priority-based consumer worker pools
│   ├── processing_engine.py     # Worker execution simulation engine
│   ├── traffic_generator.py     # Multi-process high-throughput load generator
│   ├── traffic_monitor.py       # Rolling window traffic measurement
│   ├── metrics.py               # Aggregated pipeline metrics & counters
│   ├── models.py                # Pydantic data schemas (Event, Decision, etc.)
│   ├── docker-compose.yml       # Kafka (9092) & Redis (6379) container definition
│   └── .env                     # MongoDB Atlas URI & Redis configuration
│
└── mongo_test/                  # Decoupled Persistence Prototyping Module
    ├── app.py                   # Lightweight FastAPI endpoint for Redis/Mongo
    ├── connect.py               # MongoDB Atlas connection test with SSL verification
    ├── redis_client.py          # Redis stream reader, batch sync & offsets
    ├── worker.py                # Standalone background consumer process
    └── traffic_generator.py     # Standalone event generator
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.10+ recommended, tested on Python 3.12)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Kafka & Redis)

---

### Quick Start (Docker + Backend + Frontend)

#### 1. Start Infrastructure Services (Kafka & Redis)
```powershell
cd data_pipeline
docker compose up -d
```
*Starts Kafka on port `9092` and Redis on port `6379`.*

#### 2. Install Python Dependencies & Start FastAPI Backend
```powershell
cd data_pipeline
python -m pip install fastapi uvicorn httpx redis pymongo certifi python-dotenv aiokafka pydantic
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
*Startup logs will confirm:*
```
[StorageManager] Redis connected successfully!
[StorageManager] MongoDB Atlas connected successfully!
[StorageManager] Auto-flush background worker started.
Kafka producer started
Kafka workers started
Redis & MongoDB storage pipeline started
```

#### 3. Start Frontend Dashboard
In a new terminal window:
```powershell
cd ..
npm install
npm run dev
```
Open **`http://localhost:5173`** (or the port displayed in your terminal). The dashboard will indicate **`LIVE BACKEND · ws://localhost:8000`**.

---

### Running the Traffic Spike Generator

To simulate live baseline traffic and flash sales spikes:

```powershell
cd data_pipeline
python traffic_generator.py
```
- **Normal baseline**: ~1,000 events/min
- **Spike surge**: ~20,000 events/min (toggleable via frontend button or <kbd>Space</kbd>)

---

## 🔌 API Reference

### Backend Gateway (`http://localhost:8000`)

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/events` | Ingests and classifies a single event payload |
| `GET` | `/metrics` | Returns live pipeline metrics, priority distributions, and storage telemetry |
| `GET` | `/events/stream` | Server-Sent Events (SSE) stream delivering throttled telemetry to dashboard |
| `GET` | `/storage/stats` | Returns real-time Redis queue size and total documents in MongoDB Atlas |
| `POST` | `/storage/flush` | Manually triggers an immediate batch write to MongoDB Atlas |
| `POST` | `/traffic/toggle` | Toggles traffic mode between `NORMAL` (1k/min) and `SPIKE` (20k/min) |
| `GET` | `/traffic/status` | Returns current state of the multiprocessing load generator |

---

## 🕹️ Keyboard Shortcuts

| Shortcut | Action | Description |
|:---:|:---|:---|
| <kbd>Space</kbd> | **Toggle 20× Spike** | Triggers flash surge from ~1,000/min to ~20,000/min |
| <kbd>T</kbd> | **Toggle Theme** | Switches between Dark Mode and Light Mode |
| <kbd>P</kbd> | **Pause / Resume** | Freezes the real-time simulation tick loop |
| <kbd>R</kbd> | **Reset** | Restores all queues, counters, and charts to baseline |

---

## 🛠️ Troubleshooting & Gotchas

1. **`KafkaConnectionError: Unable to bootstrap from localhost:9092`**:
   - Ensure Docker Desktop is running.
   - Run `docker compose up -d` inside `data_pipeline/`.

2. **MongoDB Atlas `No replica set members found yet`**:
   - Caused by missing Root CA certificates on Windows.
   - Fixed by installing `certifi` and passing `tlsCAFile=certifi.where()` to `MongoClient` (already implemented in [`storage_manager.py`](data_pipeline/storage_manager.py) and [`connect.py`](mongo_test/connect.py)).

3. **Running Without Docker / Kafka**:
   - The frontend includes a complete in-browser simulation engine. Simply run `npm run dev` and leave the backend offline. The dashboard automatically runs the simulation in standalone mode.

---

## 🛡️ License

Built for real-time observability, high-load stress testing, and resilient stream processing demonstrations.
