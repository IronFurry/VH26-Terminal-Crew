"""
traffic_generator.py  v3  — multiprocessing edition
=====================================================

Architecture
------------
  Main process  :  FastAPI control server on port 8001
                   smooth_ramp coroutine (updates shared_rate)
  Worker processes (NUM_PROCS):
                   Each spawns its own asyncio event loop
                   Each has its own httpx connection pool
                   Each has its own token bucket capped at
                       shared_rate / NUM_PROCS  events/min
                   Workers run completely independently — no GIL contention.

Why multiprocessing?
--------------------
Python GIL limits one process to ~100-110 req/sec across a Wi-Fi
network (observed ceiling). Spawning N independent processes:

    4 processes × ~110 req/sec = ~440 req/sec = 26 400 events/min

Token buckets in each process cap the total to exactly the target rate.

  NORMAL mode : 1 worker process  →  1 000 events/min total
  SPIKE  mode : 4 worker processes → 20 000 events/min total

Toggling from the frontend (POST /traffic/toggle on port 8001) updates
shared ctypes memory visible to all processes instantly.
"""

import asyncio
import ctypes
import math
import multiprocessing as mp
import os
import random
import signal
import sys
import time

import httpx
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ============================================================
# CONFIGURATION  — edit these to match your network
# ============================================================

# PC 1 (backend host) IP — traffic generator runs on PC 2 and sends here
PIPELINE_URL = "http://192.168.137.210:8000/events"

# Rate modes (events / minute)
NORMAL_RATE = 1_000
SPIKE_RATE  = 20_000

# How many independent worker processes to run in SPIKE mode.
# More processes = higher throughput ceiling, more CPU.
# 4 is a safe default; increase to 6-8 if you have spare cores.
NUM_PROCS_NORMAL = 1
NUM_PROCS_SPIKE  = 6         # More processes = more throughput ceiling

# Async workers inside each process.
# With a persistent shared client, more workers = more concurrent in-flight reqs.
# 40 workers × 6 processes = 240 concurrent HTTP slots total.
ASYNC_WORKERS_PER_PROC = 40

# Ramp
RAMP_STEPS    = 15
RAMP_DURATION = 3.0   # seconds

# httpx pool per process — must be >= ASYNC_WORKERS_PER_PROC
MAX_CONNECTIONS            = 80
MAX_KEEPALIVE_CONNECTIONS  = 60

# ============================================================
# EVENT TYPES
# ============================================================

EVENT_TYPES = [
    "payment", "activity", "auth",
    "order", "log", "inventory"
]

INDIAN_REGIONS = [
    "mumbai", "delhi", "bangalore", "hyderabad", "chennai",
    "pune", "kolkata", "ahmedabad", "jaipur", "lucknow",
    "surat", "kochi", "indore", "chandigarh", "nagpur"
]


def generate_event():
    event_type = random.choice(EVENT_TYPES)
    if event_type == "payment":
        tv, pc, ds = random.uniform(100, 100_000), random.uniform(0.50, 1.00), random.uniform(1.0, 10.0)
    elif event_type == "order":
        tv, pc, ds = random.uniform(300, 50_000),  random.uniform(0.50, 1.00), random.uniform(1.0, 10.0)
    elif event_type == "inventory":
        tv, pc, ds = random.uniform(500, 25_000),  random.uniform(0.30, 0.80), random.uniform(1.0, 8.0)
    elif event_type == "auth":
        tv, pc, ds = 0, random.uniform(0.20, 0.60), random.uniform(0.2, 2.0)
    elif event_type == "activity":
        tv, pc, ds = random.uniform(0, 5_000), random.uniform(0.10, 0.50), random.uniform(0.1, 5.0)
    else:
        tv, pc, ds = 0, random.uniform(0.05, 0.30), random.uniform(0.05, 2.0)
    return {
        "event_id":          f"evt_{random.randint(100_000, 999_999)}",
        "event_type":        event_type,
        "timestamp":         int(time.time()),
        "customer_value":    round(random.uniform(0.05, 1.00), 2),
        "transaction_value": round(tv, 2),
        "processing_cost":   round(pc, 2),
        "data_size":         round(ds, 2),
        "region":            random.choice(INDIAN_REGIONS),
    }


# ============================================================
# WORKER PROCESS ENTRY POINT
# ============================================================

def run_worker_process(
    proc_id:          int,
    shared_num_procs: mp.Value,    # dynamic count of active processes (ctypes int)
    shared_rate:      mp.Value,    # ctypes double — total cluster events/min
    shared_running:   mp.Value,    # ctypes bool
):
    """
    Runs in a child process. Starts its own asyncio event loop.
    Reads shared_rate and shared_num_procs dynamically.
    Uses a zero-contention pacer with an asyncio.Queue to dispatch requests
    to a pool of async workers sharing a persistent httpx connection pool.
    """
    signal.signal(signal.SIGINT, signal.SIG_IGN)

    async def _async_main():
        limits = httpx.Limits(
            max_connections=MAX_CONNECTIONS,
            max_keepalive_connections=MAX_KEEPALIVE_CONNECTIONS,
        )

        dispatch_queue = asyncio.Queue(maxsize=500)
        sent = 0

        async with httpx.AsyncClient(
            limits=limits,
            timeout=httpx.Timeout(5.0, connect=2.0),
        ) as client:

            async def single_worker(wid: int):
                nonlocal sent
                while shared_running.value:
                    try:
                        await asyncio.wait_for(dispatch_queue.get(), timeout=0.5)
                    except asyncio.TimeoutError:
                        continue

                    event = generate_event()
                    try:
                        r = await client.post(PIPELINE_URL, json=event)
                        if r.status_code == 200:
                            sent += 1
                    except Exception:
                        pass

            async def pacer():
                """
                High-precision, drift-free token generator.
                Ticks every 20ms. Uses time.perf_counter() so timer jitter
                never causes rate drift.
                """
                tokens = 0.0
                last_time = time.perf_counter()

                while shared_running.value:
                    await asyncio.sleep(0.02)
                    now = time.perf_counter()
                    elapsed = now - last_time
                    last_time = now

                    procs = max(1, shared_num_procs.value)
                    target_rate_sec = (shared_rate.value / procs) / 60.0
                    tokens += elapsed * target_rate_sec

                    # Prevent token explosion if network stalls
                    tokens = min(tokens, 50.0)

                    num_to_emit = int(tokens)
                    if num_to_emit > 0:
                        tokens -= num_to_emit
                        for _ in range(num_to_emit):
                            try:
                                dispatch_queue.put_nowait(True)
                            except asyncio.QueueFull:
                                break

            async def status_printer():
                """Periodically prints throughput rate for this process and cluster estimate."""
                nonlocal sent
                while shared_running.value:
                    await asyncio.sleep(3.0)
                    rate = sent / 3.0
                    sent = 0
                    procs = max(1, shared_num_procs.value)
                    cluster_est = rate * procs * 60.0
                    target = shared_rate.value
                    print(
                        f"[P{proc_id}] {rate:5.1f} req/s | Cluster est: {cluster_est:6,.0f}/min | Target: {target:6,.0f}/min",
                        flush=True
                    )

            workers = [
                asyncio.create_task(single_worker(i))
                for i in range(ASYNC_WORKERS_PER_PROC)
            ]
            pacer_task = asyncio.create_task(pacer())
            printer_task = asyncio.create_task(status_printer())

            while shared_running.value:
                await asyncio.sleep(0.5)

            pacer_task.cancel()
            printer_task.cancel()
            for w in workers:
                w.cancel()

    asyncio.run(_async_main())


# ============================================================
# PROCESS POOL MANAGER  (runs in main process)
# ============================================================

class ProcessPool:
    def __init__(
        self,
        shared_rate: mp.Value,
        shared_running: mp.Value,
        shared_num_procs: mp.Value
    ):
        self.shared_rate      = shared_rate
        self.shared_running   = shared_running
        self.shared_num_procs = shared_num_procs
        self.procs: list[mp.Process] = []
        self.target_n = NUM_PROCS_NORMAL

    def _spawn_one(self):
        n = len(self.procs) + 1
        p = mp.Process(
            target=run_worker_process,
            args=(n, self.shared_num_procs, self.shared_rate, self.shared_running),
            daemon=True,
        )
        p.start()
        self.procs.append(p)
        print(f"[pool] Spawned worker process P{n} (PID={p.pid})")

    def scale_to(self, n: int):
        """Scale pool up or down to n processes."""
        self.target_n = n
        self.shared_num_procs.value = n
        while len(self.procs) < n:
            self._spawn_one()
        while len(self.procs) > n:
            p = self.procs.pop()
            p.terminate()
            p.join(timeout=2)
            print(f"[pool] Terminated worker process PID={p.pid} ({len(self.procs)}/{n})")

    def stop_all(self):
        self.shared_running.value = False
        for p in self.procs:
            p.terminate()
            p.join(timeout=3)
        self.procs.clear()
        print("[pool] All worker processes stopped.")


# ============================================================
# SMOOTH RAMP  (async, runs in main process event loop)
# ============================================================

async def smooth_ramp(
    pool:        "ProcessPool",
    shared_rate: mp.Value,
    from_rate:   float,
    to_rate:     float,
    to_procs:    int,
):
    log_from   = math.log(max(from_rate, 1))
    log_to     = math.log(max(to_rate, 1))
    step_sleep = RAMP_DURATION / RAMP_STEPS

    # If scaling up, expand process pool first so workers are ready
    if to_procs > pool.target_n:
        pool.scale_to(to_procs)

    for step in range(1, RAMP_STEPS + 1):
        t = step / RAMP_STEPS
        rate = math.exp(log_from + t * (log_to - log_from))
        shared_rate.value = rate
        await asyncio.sleep(step_sleep)

    shared_rate.value = to_rate

    # If scaling down, reduce process pool after rate has stabilized
    if to_procs < pool.target_n:
        pool.scale_to(to_procs)

    print(f"[ramp] Done → {to_rate:,.0f} events/min across {to_procs} processes")


# ============================================================
# SHARED STATE  (between main process and FastAPI)
# ============================================================

shared_rate      = mp.Value(ctypes.c_double, float(NORMAL_RATE))
shared_running   = mp.Value(ctypes.c_bool,   True)
shared_num_procs = mp.Value(ctypes.c_int,    NUM_PROCS_NORMAL)

current_mode = "NORMAL"
ramp_task    = None
pool: "ProcessPool | None" = None


# ============================================================
# FASTAPI CONTROL SERVER  (port 8001)
# ============================================================

control_app = FastAPI(title="Traffic Generator Control v3")

control_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@control_app.post("/traffic/toggle")
async def toggle_traffic():
    global current_mode, ramp_task

    from_rate = shared_rate.value

    if current_mode == "NORMAL":
        current_mode = "SPIKE"
        if ramp_task and not ramp_task.done():
            ramp_task.cancel()
        ramp_task = asyncio.create_task(
            smooth_ramp(pool, shared_rate, from_rate, SPIKE_RATE, NUM_PROCS_SPIKE)
        )
        return {"mode": "SPIKE",  "rate": SPIKE_RATE,  "rate_per_minute": SPIKE_RATE,  "is_spike": True}
    else:
        current_mode = "NORMAL"
        if ramp_task and not ramp_task.done():
            ramp_task.cancel()
        ramp_task = asyncio.create_task(
            smooth_ramp(pool, shared_rate, from_rate, NORMAL_RATE, NUM_PROCS_NORMAL)
        )
        return {"mode": "NORMAL", "rate": NORMAL_RATE, "rate_per_minute": NORMAL_RATE, "is_spike": False}


@control_app.get("/traffic/status")
async def traffic_status():
    return {
        "mode":             current_mode,
        "rate_per_minute":  round(shared_rate.value),
        "active_processes": len(pool.procs) if pool else 0,
        "async_workers":    ASYNC_WORKERS_PER_PROC,
        "is_spike":         current_mode == "SPIKE",
        "pipeline_url":     PIPELINE_URL,
    }


# ============================================================
# ENTRYPOINT
# ============================================================

async def serve_control_api():
    config = uvicorn.Config(
        control_app,
        host="0.0.0.0",
        port=8001,
        log_level="warning",
    )
    server = uvicorn.Server(config)
    await server.serve()


def main():
    global pool

    print("=" * 60)
    print("  Traffic Generator v3  (multiprocessing edition)")
    print(f"  Pipeline  : {PIPELINE_URL}")
    print(f"  Control   : http://0.0.0.0:8001")
    print(f"  NORMAL    : {NORMAL_RATE:,}/min  ({NUM_PROCS_NORMAL} processes × {ASYNC_WORKERS_PER_PROC} workers)")
    print(f"  SPIKE     : {SPIKE_RATE:,}/min  ({NUM_PROCS_SPIKE} processes × {ASYNC_WORKERS_PER_PROC} workers)")
    print("=" * 60)

    # Required on Windows for multiprocessing
    mp.set_start_method("spawn", force=True)

    # Create and start initial worker pool (NORMAL mode)
    pool = ProcessPool(shared_rate, shared_running, shared_num_procs)
    pool.scale_to(NUM_PROCS_NORMAL)

    try:
        asyncio.run(serve_control_api())
    except KeyboardInterrupt:
        print("\n[main] Shutting down...")
    finally:
        pool.stop_all()


if __name__ == "__main__":
    main()

