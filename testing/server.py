from fastapi import FastAPI
import os
import time
import psutil

app = FastAPI()

process = psutil.Process(os.getpid())

# Use only CPU core 0
try:
    process.cpu_affinity([0])
    print("Server restricted to CPU core:", process.cpu_affinity())
except Exception as e:
    print("CPU affinity error:", e)


@app.get("/process")
def process_request():

    start = time.perf_counter()

    # Simulate some processing
    time.sleep(0.05)

    processing_time = time.perf_counter() - start

    cpu = process.cpu_num() if hasattr(process, "cpu_num") else (process.cpu_affinity() if hasattr(process, "cpu_affinity") else None)

    return {
        "status": "processed",
        "pid": os.getpid(),
        "cpu": cpu,
        "processing_time_ms": round(processing_time * 1000, 3)
    }