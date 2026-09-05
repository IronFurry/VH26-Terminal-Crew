import os
import json
import time
import asyncio
from dotenv import load_dotenv
import redis
import certifi
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rohitkhanolkar72_db_user:YGeaSw8pDuy8dC1I@vh26.nyplbdq.mongodb.net/?appName=VH26")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
STREAM_NAME = os.getenv("STREAM_NAME", "pipeline_stream")
GROUP_NAME = os.getenv("GROUP_NAME", "pipeline_mongo_workers")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 100))


class StorageManager:
    def __init__(self):
        self.redis_client = None
        self.mongo_client = None
        self.db = None
        self.transactions = None
        self.is_connected = False
        self.total_inserted_to_mongo = 0

    def connect(self):
        # 1. Connect Redis
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                decode_responses=True
            )
            self.redis_client.ping()
            print("[StorageManager] Redis connected successfully!")
        except Exception as e:
            print(f"[StorageManager] Redis connection warning: {e}")
            self.redis_client = None

        # 2. Setup Redis Consumer Group
        if self.redis_client:
            try:
                self.redis_client.xgroup_create(
                    STREAM_NAME,
                    GROUP_NAME,
                    id="0",
                    mkstream=True
                )
            except redis.exceptions.ResponseError as e:
                if "BUSYGROUP" not in str(e):
                    print(f"[StorageManager] Consumer group setup warning: {e}")

        # 3. Connect MongoDB with proper SSL certificate authority
        try:
            self.mongo_client = MongoClient(
                MONGO_URI,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=15000
            )
            self.db = self.mongo_client["pipeline_test"]
            self.transactions = self.db["transactions"]
            print("[StorageManager] MongoDB Atlas connected successfully!")
            self.is_connected = True
        except Exception as e:
            print(f"[StorageManager] MongoDB connection warning: {e}")
            self.mongo_client = None
            self.transactions = None

    def push_event(self, event_data: dict):
        """Pushes an event document to the Redis stream."""
        if not self.redis_client:
            return None
        try:
            return self.redis_client.xadd(
                STREAM_NAME,
                {"data": json.dumps(event_data)}
            )
        except Exception as e:
            print(f"[StorageManager] Failed to push event to Redis: {e}")
            return None

    def push_events_batch(self, events: list):
        """Pushes a list of events to Redis stream in bulk via pipeline."""
        if not self.redis_client or not events:
            return []
        try:
            pipe = self.redis_client.pipeline()
            for ev in events:
                pipe.xadd(STREAM_NAME, {"data": json.dumps(ev)})
            return pipe.execute()
        except Exception as e:
            print(f"[StorageManager] Failed to push batch to Redis: {e}")
            return []

    def drain_batch_to_mongo(self, batch_size: int = BATCH_SIZE, worker_name: str = "pipeline-flusher"):
        """Reads a batch of events from Redis stream and bulk-inserts them into MongoDB."""
        if not self.redis_client or self.transactions is None:
            return {"processed": 0, "status": "unavailable"}

        try:
            # 1. First check for pending unacknowledged messages
            entries = self.redis_client.xreadgroup(
                groupname=GROUP_NAME,
                consumername=worker_name,
                streams={STREAM_NAME: "0"},
                count=batch_size
            )

            # 2. If no pending messages, read new incoming messages (">")
            if not entries or not entries[0][1]:
                entries = self.redis_client.xreadgroup(
                    groupname=GROUP_NAME,
                    consumername=worker_name,
                    streams={STREAM_NAME: ">"},
                    count=batch_size,
                    block=500
                )
        except Exception as e:
            print(f"[StorageManager] Error reading from Redis: {e}")
            return {"processed": 0, "error": str(e)}

        if not entries:
            return {"processed": 0, "remaining_queue": self.get_queue_size()}

        batch_docs = []
        message_ids = []

        for stream_name, messages in entries:
            for redis_id, fields in messages:
                try:
                    doc = json.loads(fields["data"])
                    batch_docs.append(doc)
                    message_ids.append(redis_id)
                except Exception:
                    continue

        if not batch_docs:
            return {"processed": 0, "remaining_queue": self.get_queue_size()}

        try:
            result = self.transactions.insert_many(batch_docs, ordered=False)
            inserted_count = len(result.inserted_ids)
            self.total_inserted_to_mongo += inserted_count

            # Acknowledge messages in Redis
            if message_ids:
                self.redis_client.xack(STREAM_NAME, GROUP_NAME, *message_ids)

            return {
                "processed": inserted_count,
                "total_inserted": self.total_inserted_to_mongo,
                "remaining_queue": self.get_queue_size()
            }
        except Exception as e:
            print(f"[StorageManager] MongoDB bulk insert error: {e}")
            # If partial insert succeeded, still ack or retry
            return {"processed": 0, "error": str(e)}

    def get_queue_size(self):
        if not self.redis_client:
            return 0
        try:
            return self.redis_client.xlen(STREAM_NAME)
        except Exception:
            return 0

    def get_mongo_count(self):
        if self.transactions is None:
            return 0
        try:
            return self.transactions.count_documents({})
        except Exception:
            return 0

    def get_stats(self):
        return {
            "redis_connected": self.redis_client is not None,
            "mongo_connected": self.transactions is not None,
            "redis_queue_size": self.get_queue_size(),
            "mongo_total_records": self.get_mongo_count(),
            "session_inserted": self.total_inserted_to_mongo,
            "stream_name": STREAM_NAME,
            "consumer_group": GROUP_NAME
        }

    async def auto_flush_loop(self):
        """Background coroutine that continuously drains Redis batches into MongoDB."""
        print("[StorageManager] Auto-flush background worker started.")
        while True:
            try:
                # Run synchronous blocking DB / Redis call in executor to not block async loop
                loop = asyncio.get_running_loop()
                result = await loop.run_in_executor(None, self.drain_batch_to_mongo, BATCH_SIZE)

                processed = result.get("processed", 0)
                if processed > 0:
                    # Has more data: continue draining quickly
                    await asyncio.sleep(0.05)
                else:
                    # Queue is empty: sleep briefly before checking again
                    await asyncio.sleep(0.5)
            except asyncio.CancelledError:
                print("[StorageManager] Auto-flush worker cancelled.")
                break
            except Exception as e:
                print(f"[StorageManager] Error in auto-flush loop: {e}")
                await asyncio.sleep(1.0)
