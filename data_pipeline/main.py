import asyncio

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


# ==========================================
# COMPONENTS
# ==========================================

traffic_monitor = TrafficMonitor(
    window_seconds=10
)

decision_engine = DecisionEngine()

metrics = Metrics()

sse_manager = SSEManager()

kafka_manager = KafkaManager()

workers = KafkaWorkers(
    metrics=metrics,
    broadcast=lambda:
        sse_manager.broadcast(
            metrics.get_status()
        )
)

worker_task = None


# ==========================================
# STARTUP / SHUTDOWN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    global worker_task

    # Start Kafka producer
    await kafka_manager.start_producer()

    # Start Kafka consumers
    worker_task = asyncio.create_task(
        workers.start()
    )

    print("Kafka producer started")

    print("Kafka workers started")

    yield

    # Shutdown
    if worker_task:

        worker_task.cancel()

    await kafka_manager.stop_producer()

    print("Pipeline stopped")


app = FastAPI(
    title="Intelligent Data Pipeline",
    lifespan=lifespan
)


# ==========================================
# EVENT INGESTION
# ==========================================

@app.post("/events")
async def receive_event(
    event: Event
):

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
    # 5. KAFKA
    # ======================================

    kafka_result = (
        await kafka_manager
        .publish_decision(decision)
    )


    # ======================================
    # 6. SSE UPDATE
    # ======================================

    await sse_manager.broadcast(
        metrics.get_status()
    )


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

        "traffic_rate":
            decision.traffic_rate,

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

    return metrics.get_status()


# ==========================================
# SSE
# ==========================================

@app.get("/events/stream")
async def event_stream():

    return sse_manager.response()