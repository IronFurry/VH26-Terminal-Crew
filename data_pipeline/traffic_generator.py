import random
import time
import json
import uuid
from datetime import datetime


# ============================================================
# CONFIGURATION
# ============================================================

NORMAL_RATE = 1_000       # events/minute
SPIKE_RATE = 20_000       # events/minute

EVENT_TYPES = [
    "payment",
    "activity",
    "auth",
    "order",
    "log",
    "inventory"
]

INDIAN_REGIONS = [
    "mumbai",
    "delhi",
    "bangalore",
    "hyderabad",
    "chennai",
    "pune",
    "kolkata",
    "ahmedabad",
    "jaipur",
    "lucknow",
    "surat",
    "kochi",
    "indore",
    "chandigarh",
    "nagpur"
]


# ============================================================
# EVENT GENERATOR
# ============================================================

def generate_event():
    event_type = random.choice(EVENT_TYPES)

    # -----------------------------
    # Customer value
    # 0.0 = low value customer
    # 1.0 = high value customer
    # -----------------------------
    customer_value = round(random.uniform(0.05, 1.00), 2)

    # -----------------------------
    # Transaction value
    # Different event types have
    # different realistic ranges
    # -----------------------------
    if event_type == "payment":
        transaction_value = random.uniform(100, 100000)

    elif event_type == "order":
        transaction_value = random.uniform(300, 50000)

    elif event_type == "inventory":
        transaction_value = random.uniform(500, 25000)

    elif event_type == "auth":
        transaction_value = 0

    elif event_type == "activity":
        transaction_value = random.uniform(0, 5000)

    else:  # log
        transaction_value = 0

    # -----------------------------
    # Processing cost
    # Simulated compute cost
    # -----------------------------
    if event_type in ["payment", "order"]:
        processing_cost = random.uniform(0.50, 1.00)

    elif event_type == "auth":
        processing_cost = random.uniform(0.20, 0.60)

    elif event_type == "inventory":
        processing_cost = random.uniform(0.30, 0.80)

    elif event_type == "activity":
        processing_cost = random.uniform(0.10, 0.50)

    else:  # log
        processing_cost = random.uniform(0.05, 0.30)

    # -----------------------------
    # Data size in MB
    # -----------------------------
    if event_type in ["payment", "order"]:
        data_size = random.uniform(1.0, 10.0)

    elif event_type == "inventory":
        data_size = random.uniform(1.0, 8.0)

    elif event_type == "auth":
        data_size = random.uniform(0.2, 2.0)

    elif event_type == "activity":
        data_size = random.uniform(0.1, 5.0)

    else:  # log
        data_size = random.uniform(0.05, 2.0)

    # -----------------------------
    # Build event
    # -----------------------------
    event = {
        "event_id": f"evt_{random.randint(100000, 999999)}",
        "event_type": event_type,
        "timestamp": int(time.time()),
        "customer_value": customer_value,
        "transaction_value": round(transaction_value, 2),
        "processing_cost": round(processing_cost, 2),
        "data_size": round(data_size, 2),
        "region": random.choice(INDIAN_REGIONS)
    }

    return event


# ============================================================
# TRAFFIC GENERATOR
# ============================================================

def generate_traffic(rate_per_minute):
    """
    Generate traffic at the requested rate.

    Example:
        1000 events/minute
        20000 events/minute
    """

    interval = 60 / rate_per_minute

    print("=" * 60)
    print(f"Traffic Generator Started")
    print(f"Rate: {rate_per_minute:,} events/minute")
    print(f"Rate: {rate_per_minute / 60:.2f} events/second")
    print("=" * 60)

    while True:

        event = generate_event()

        # This is the generated request
        print(json.dumps(event))

        time.sleep(interval)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    # Change this to SPIKE_RATE for 20K events/minute
    generate_traffic(NORMAL_RATE)