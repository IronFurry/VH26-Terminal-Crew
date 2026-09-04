from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect
)

from models import Event
from traffic_monitor import TrafficMonitor
from classifier import classify
from decision_engine import DecisionEngine
from processing_engine import ProcessingEngine
from metrics import Metrics


app = FastAPI(
    title="Intelligent Data Pipeline"
)


# ==========================================
# Pipeline components
# ==========================================

traffic_monitor = TrafficMonitor(
    window_seconds=10
)

decision_engine = DecisionEngine()

processing_engine = ProcessingEngine()

metrics = Metrics()


# ==========================================
# WebSocket clients
# ==========================================

connected_clients = set()


# ==========================================
# EVENT INGESTION
# ==========================================

@app.post("/events")
async def receive_event(event: Event):

    # --------------------------------------
    # 1. Monitor traffic
    # --------------------------------------

    traffic_monitor.record_event()

    traffic_rate = (
        traffic_monitor
        .get_events_per_minute()
    )

    # --------------------------------------
    # 2. Classify
    # --------------------------------------

    classified_event = classify(event)

    # --------------------------------------
    # 3. Decision
    # --------------------------------------

    decision = decision_engine.decide(
        event=classified_event,
        traffic_rate=traffic_rate
    )

    # --------------------------------------
    # 4. Metrics
    # --------------------------------------

    metrics.record(decision)

    # --------------------------------------
    # 5. Processing
    # --------------------------------------

    processing_result = (
        await processing_engine.process(
            decision
        )
    )

    # --------------------------------------
    # 6. Update dashboard
    # --------------------------------------

    await broadcast_metrics()

    # --------------------------------------
    # 7. API response
    # --------------------------------------

    return {
        "event_id": decision.event_id,
        "event_type": decision.event_type,
        "region": decision.region,

        "traffic_rate": decision.traffic_rate,

        "priority": decision.priority,

        "priority_probability": (
            decision.priority_probability
        ),

        "confidence": decision.confidence,

        "action": decision.action,

        "batch_size": decision.batch_size,

        "queue_depth": (
            decision.queue_depth_at_decision
        ),

        "reason": decision.decision_reason,

        "processing": processing_result
    }


# ==========================================
# METRICS REST API
# ==========================================

@app.get("/metrics")
async def get_metrics():

    return metrics.get_status()


# ==========================================
# WEBSOCKET
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket
):

    await websocket.accept()

    connected_clients.add(websocket)

    try:

        # Send current state immediately
        await websocket.send_json(
            metrics.get_status()
        )

        while True:

            # Keep connection alive
            await websocket.receive_text()

    except WebSocketDisconnect:

        connected_clients.discard(
            websocket
        )

    except Exception:

        connected_clients.discard(
            websocket
        )


# ==========================================
# BROADCAST
# ==========================================

async def broadcast_metrics():

    if not connected_clients:
        return

    data = metrics.get_status()

    disconnected = []

    for websocket in connected_clients:

        try:

            await websocket.send_json(data)

        except Exception:

            disconnected.append(websocket)

    for websocket in disconnected:

        connected_clients.discard(websocket)