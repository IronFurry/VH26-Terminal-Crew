import json
import random
import time
from pathlib import Path

REGIONS = ["mumbai", "delhi", "bangalore", "chennai", "pune", "hyderabad"]
EVENT_TYPES = ["payment", "order", "inventory", "activity", "log"]
DATA_DIR = Path(__file__).resolve().parent / "data"


def generate_event():
    event_type = random.choices(
        EVENT_TYPES, weights=[15, 15, 20, 30, 20]
    )[0]

    if event_type == "payment":
        transaction_value = round(random.uniform(500, 50000), 2)
        customer_value = round(random.uniform(0.4, 1.0), 2)
    elif event_type == "order":
        transaction_value = round(random.uniform(200, 20000), 2)
        customer_value = round(random.uniform(0.3, 0.9), 2)
    else:
        transaction_value = round(random.uniform(0, 500), 2)
        customer_value = round(random.uniform(0.0, 0.6), 2)

    return {
        "event_id": f"evt_{random.randint(100000, 999999)}",
        "event_type": event_type,
        "timestamp": int(time.time()),
        "customer_value": customer_value,
        "transaction_value": transaction_value,
        "processing_cost": round(random.uniform(0.05, 1.0), 2),
        "data_size": round(random.uniform(0.5, 10.0), 2),
        "region": random.choice(REGIONS),
    }


def write_events(n_events, out_path):
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for _ in range(n_events):
            f.write(json.dumps(generate_event()) + "\n")
    print(f"Wrote {n_events} events to {out_path}")


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Baseline load: ~1,000 events/minute
    write_events(1000, DATA_DIR / "baseline_1k.jsonl")

    # Flash sale spike: ~20,000 events/minute (20x surge)
    write_events(20000, DATA_DIR / "spike_20k.jsonl")


if __name__ == "__main__":
    main()
