from contextlib import asynccontextmanager
from typing import List, Union

from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from redis_client import (
    connect,
    push_event,
    push_events_batch,
    ensure_consumer_group,
    get_queue_size,
    sync_batch_to_db
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs when the API starts
    try:
        connect()
        ensure_consumer_group()
        print("Redis connected and consumer group ready!")
    except Exception as e:
        print(f"Warning on startup connecting to Redis: {e}")

    print("API started successfully!")

    yield
    # Runs when the API shuts down
    print("API shutting down...")


app = FastAPI(
    title="Intelligent Pipeline API - Redis & Mongo Storage",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "Intelligent Pipeline API - Redis & Mongo Storage"
    }


@app.get("/health")
def health():
    try:
        redis = connect()
        redis.ping()

        return {
            "status": "healthy",
            "redis": "connected",
            "queue_size": get_queue_size()
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/stats")
def get_stats():
    """Returns real-time telemetry on Redis Stream depth and MongoDB collection count."""
    try:
        from connect import transactions
        mongo_count = transactions.count_documents({})
    except Exception as e:
        mongo_count = f"Unavailable: {e}"

    try:
        redis_size = get_queue_size()
    except Exception as e:
        redis_size = f"Unavailable: {e}"

    return {
        "redis_queue_size": redis_size,
        "mongo_total_records": mongo_count,
        "stream_name": "pipeline_stream",
        "consumer_group": "mongo_workers"
    }


# ==========================================
# 1. STORE DATA IN REDIS (Single & Batch)
# ==========================================

@app.post("/events")
def receive_event(event: dict):
    """Stores a single event into Redis Stream."""
    try:
        redis_id = push_event(event)

        # Decide priority based on transaction value
        if event.get("transaction_value", 0) >= 50000:
            priority = "critical"
            action = "fast"
        elif event.get("transaction_value", 0) >= 10000:
            priority = "high"
            action = "process"
        else:
            priority = "normal"
            action = "process"

        return {
            "status": "accepted",
            "redis_id": redis_id,
            "priority": priority,
            "action": action,
            "queue_size": get_queue_size()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store event in Redis: {e}")


@app.post("/events/batch")
def receive_events_batch(payload: Union[List[dict], dict] = Body(...)):
    """
    Stores an entire batch of events into Redis Stream using a Redis pipeline.
    Accepts either a JSON array of events or an object {"events": [...]}.
    """
    if isinstance(payload, dict):
        events = payload.get("events", [])
    elif isinstance(payload, list):
        events = payload
    else:
        raise HTTPException(status_code=400, detail="Invalid payload format. Expected list or {'events': [...]}")

    if not events:
        return {
            "status": "accepted",
            "stored_count": 0,
            "queue_size": get_queue_size()
        }

    try:
        push_events_batch(events)
        return {
            "status": "accepted",
            "stored_count": len(events),
            "queue_size": get_queue_size()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to batch store in Redis: {e}")


# ==========================================
# 2. SEND DATA FROM REDIS TO MONGO IN BATCHES
# ==========================================

@app.post("/db/process-batch")
def process_batch_to_mongo(
    batch_size: int = Query(100, ge=1, le=5000, description="Number of events to read and insert per batch"),
    all_available: bool = Query(False, description="Whether to drain all available events in Redis into Mongo in successive batches")
):
    """
    Pulls buffered events from Redis Stream, inserts them in batch into MongoDB,
    and acknowledges processed message IDs (xack).
    """
    try:
        if not all_available:
            result = sync_batch_to_db(batch_size=batch_size)
            return {
                "status": "completed",
                "batches_run": 1,
                "total_inserted": result.get("processed", 0),
                "remaining_queue": result.get("remaining_queue", 0)
            }

        # Drain loop if all_available is True
        total_inserted = 0
        batches_run = 0

        while True:
            result = sync_batch_to_db(batch_size=batch_size)
            processed = result.get("processed", 0)
            if processed == 0:
                break
            total_inserted += processed
            batches_run += 1

        return {
            "status": "completed",
            "batches_run": batches_run,
            "total_inserted": total_inserted,
            "remaining_queue": get_queue_size()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed during MongoDB batch sync: {e}")