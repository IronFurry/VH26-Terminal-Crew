import asyncio
import httpx
import time

from contextlib import asynccontextmanager

from fastapi import FastAPI

from models import Event

from traffic_monitor import (
    TrafficMonitor
)

from classifier import classify

from decision_engine import (
    DecisionEngine
)

from metrics import Metrics

from kafka_manager import (
    KafkaManager
)

from kafka_workers import (
    KafkaWorkers
)

from sse import SSEManager
from storage_manager import StorageManager


# ==========================================
# COMPONENTS
# ==========================================

storage_manager = StorageManager()
storage_flush_task = None

traffic_monitor = TrafficMonitor(
    window_seconds=10
)

decision_engine = DecisionEngine()

metrics = Metrics()

sse_manager = SSEManager()

kafka_manager = KafkaManager()

_last_sse_time = 0.0

def _schedule_sse_broadcast(decision):
    """
    Non-blocking, throttled SSE broadcaster.
    Sends at most 10 updates per second so the FastAPI event loop and
    the browser's React renderer are not choked at high traffic volumes.
    """
    global _last_sse_time
    now = time.time()
    if now - _last_sse_time >= 0.1:
        _last_sse_time = now
        status = metrics.get_status()
        status["latest_event"] = {
            "event_id": decision.event_id,
            "event_type": decision.event_type,
            "priority": decision.priority,
            "confidence": decision.confidence,
            "action": decision.action,
            "region": decision.region,
            "transaction_value": decision.transaction_value,
            "timestamp": decision.timestamp,
            "queue_depth": decision.queue_depth_at_decision,
            "reason": decision.decision_reason
        }
        status["incoming_rate"] = round(incoming_rate_per_second, 2)
        status["incoming_rate_per_minute"] = round(incoming_rate_per_second * 60, 2)
        status["total_incoming"] = incoming_count
        asyncio.create_task(sse_manager.broadcast(status))

workers = KafkaWorkers(
    metrics=metrics,
    broadcast=lambda:
        sse_manager.broadcast(
            metrics.get_status()
        )
)

worker_task = None

incoming_rate_task = None


# ==========================================
# ACTUAL INCOMING TRAFFIC MONITOR
# ==========================================

# Total number of requests that have
# reached /events

incoming_count = 0

# Actual measured incoming rate
incoming_rate_per_second = 0.0


# ==========================================
# INCOMING TRAFFIC RATE MONITOR
# ==========================================

async def incoming_rate_monitor():

    global incoming_count
    global incoming_rate_per_second

    # Count at the beginning of the
    # measurement window

    previous_count = incoming_count

    while True:

        # ======================================
        # WAIT 1 SECOND
        # ======================================

        await asyncio.sleep(1)

        # ======================================
        # CURRENT COUNT
        # ======================================

        current_count = incoming_count

        # ======================================
        # EVENTS RECEIVED DURING LAST SECOND
        # ======================================

        incoming_rate_per_second = (
            current_count
            - previous_count
        )

        previous_count = current_count

        # ======================================
        # TERMINAL OUTPUT
        # ======================================

        print(
            f"ACTUAL INCOMING RATE: "
            f"{incoming_rate_per_second} events/sec | "
            f"{incoming_rate_per_second * 60} events/min | "
            f"TOTAL: {current_count}"
        )

        # ======================================
        # SEND DIRECTLY TO FRONTEND
        # ======================================

        await sse_manager.broadcast({

            "type":
                "incoming_traffic",

            "incoming_rate":
                round(
                    incoming_rate_per_second,
                    2
                ),

            "incoming_rate_per_minute":
                round(
                    incoming_rate_per_second * 60,
                    2
                ),

            "total_incoming":
                current_count
        })


# ==========================================
# STARTUP / SHUTDOWN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global worker_task
    global incoming_rate_task
    global storage_flush_task

    # ======================================
    # START STORAGE (REDIS & MONGO)
    # ======================================

    storage_manager.connect()
    storage_flush_task = asyncio.create_task(
        storage_manager.auto_flush_loop()
    )

    # ======================================
    # START KAFKA PRODUCER
    # ======================================

    await kafka_manager.start_producer()

    # ======================================
    # START KAFKA CONSUMERS
    # ======================================

    worker_task = asyncio.create_task(
        workers.start()
    )

    # ======================================
    # START INCOMING RATE MONITOR
    # ======================================

    incoming_rate_task = asyncio.create_task(
        incoming_rate_monitor()
    )

    print("Kafka producer started")
    print("Kafka workers started")
    print("Incoming traffic monitor started")
    print("Redis & MongoDB storage pipeline started")

    yield

    # ======================================
    # SHUTDOWN
    # ======================================

    if storage_flush_task:
        storage_flush_task.cancel()

    if worker_task:
        worker_task.cancel()

    if incoming_rate_task:
        incoming_rate_task.cancel()

    await kafka_manager.stop_producer()

    print("Pipeline stopped")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Intelligent Data Pipeline",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# EVENT INGESTION
# ==========================================

@app.post("/events")
async def receive_event(
    event: Event
):

    global incoming_count

    # ======================================
    # 0. ACTUAL INCOMING REQUEST
    # ======================================

    # Count the request immediately
    # when it reaches the pipeline.

    incoming_count += 1


    # ======================================
    # 1. TRAFFIC MONITOR
    # ======================================

    traffic_monitor.record_event()

    traffic_rate = (
        traffic_monitor
        .get_events_per_minute()
    )


    # ======================================
    # 2. CLASSIFIER
    # ======================================

    classified_event = classify(event)


    # ======================================
    # 3. DECISION ENGINE
    # ======================================

    decision = decision_engine.decide(
        event=classified_event,
        traffic_rate=traffic_rate
    )


    # ======================================
    # 4. METRICS
    # ======================================

    metrics.record_decision(
        decision
    )


    # ======================================
    # 5. STORAGE (REDIS STREAM -> MONGO)
    # ======================================

    storage_manager.push_event(decision.model_dump())


    # ======================================
    # 6. KAFKA
    # ======================================

    kafka_result = (
        await kafka_manager
        .publish_decision(decision)
    )


    # ======================================
    # 6. SSE UPDATE (Throttled & Non-blocking)
    # ======================================

    _schedule_sse_broadcast(decision)


    # ======================================
    # 7. RESPONSE
    # ======================================

    return {

        "event_id":
            decision.event_id,

        "event_type":
            decision.event_type,

        "priority":
            decision.priority,

        "priority_probability":
            decision.priority_probability,

        "confidence":
            decision.confidence,

        # Existing pipeline rate
        "traffic_rate":
            decision.traffic_rate,

        # Actual incoming rate
        "incoming_rate":
            round(
                incoming_rate_per_second,
                2
            ),

        "action":
            decision.action,

        "batch_size":
            decision.batch_size,

        "queue_depth":
            decision.queue_depth_at_decision,

        "reason":
            decision.decision_reason,

        "kafka":
            kafka_result,

        "status":
            "accepted"
    }


# ==========================================
# METRICS API
# ==========================================

@app.get("/metrics")
async def get_metrics():

    status = metrics.get_status()

    status["incoming_rate"] = round(
        incoming_rate_per_second,
        2
    )

    status["incoming_rate_per_minute"] = round(
        incoming_rate_per_second * 60,
        2
    )

    status["total_incoming"] = (
        incoming_count
    )

    status["storage"] = storage_manager.get_stats()

    return status


# ==========================================
# STORAGE API (REDIS & MONGODB)
# ==========================================

@app.get("/storage/stats")
async def get_storage_stats():
    """Returns telemetry on Redis Stream depth and MongoDB collection count."""
    return storage_manager.get_stats()


@app.post("/storage/flush")
async def flush_storage():
    """Manually flushes a batch of events from Redis into MongoDB."""
    return storage_manager.drain_batch_to_mongo()



# ==========================================
# TRAFFIC GENERATOR PROXY
# ==========================================

@app.post("/traffic/toggle")
async def proxy_traffic_toggle():
    """
    Proxy: forwards the toggle request to the traffic generator
    running on port 8001. This lets the frontend reach the toggle
    via either port 8000 or port 8001.
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post("http://localhost:8001/traffic/toggle")
            return resp.json()
    except Exception:
        return {
            "error": "Traffic generator not reachable on port 8001",
            "hint": "Start traffic_generator.py first"
        }


@app.get("/traffic/status")
async def proxy_traffic_status():
    """Proxy: returns live traffic generator status from port 8001."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:8001/traffic/status")
            return resp.json()
    except Exception:
        return {"error": "Traffic generator not reachable"}


# ==========================================
# SSE
# ==========================================

@app.get("/events/stream")
async def event_stream():

    return sse_manager.response()