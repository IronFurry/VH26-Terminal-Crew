import random
import time
import requests
from concurrent.futures import ThreadPoolExecutor


NORMAL_RATE = 1000
SPIKE_RATE = 20000

PIPELINE_URL = "http://localhost:8000/events"

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


def generate_event():

    event_type = random.choice(EVENT_TYPES)

    customer_value = round(random.uniform(0.05, 1.00), 2)

    if event_type == "payment":
        transaction_value = random.uniform(100, 100000)
        processing_cost = random.uniform(0.50, 1.00)
        data_size = random.uniform(1.0, 10.0)

    elif event_type == "order":
        transaction_value = random.uniform(300, 50000)
        processing_cost = random.uniform(0.50, 1.00)
        data_size = random.uniform(1.0, 10.0)

    elif event_type == "inventory":
        transaction_value = random.uniform(500, 25000)
        processing_cost = random.uniform(0.30, 0.80)
        data_size = random.uniform(1.0, 8.0)

    elif event_type == "auth":
        transaction_value = 0
        processing_cost = random.uniform(0.20, 0.60)
        data_size = random.uniform(0.2, 2.0)

    elif event_type == "activity":
        transaction_value = random.uniform(0, 5000)
        processing_cost = random.uniform(0.10, 0.50)
        data_size = random.uniform(0.1, 5.0)

    else:
        transaction_value = 0
        processing_cost = random.uniform(0.05, 0.30)
        data_size = random.uniform(0.05, 2.0)

    return {
        "event_id": f"evt_{random.randint(100000, 999999)}",
        "event_type": event_type,
        "timestamp": int(time.time()),
        "customer_value": customer_value,
        "transaction_value": round(transaction_value, 2),
        "processing_cost": round(processing_cost, 2),
        "data_size": round(data_size, 2),
        "region": random.choice(INDIAN_REGIONS)
    }


def send_event(event):

    try:
        response = requests.post(
            PIPELINE_URL,
            json=event,
            timeout=5
        )

        if response.status_code == 200:

            result = response.json()

            print(
                f"{event['event_id']} | "
                f"{result['priority']:8} | "
                f"{result['action']:6} | "
                f"{result['traffic_rate']:8.0f}/min"
            )

        else:
            print(
                f"ERROR {response.status_code}: "
                f"{response.text}"
            )

    except Exception as e:
        print(f"Request failed: {e}")


def generate_traffic(rate_per_minute):

    requests_per_second = rate_per_minute / 60

    print("=" * 70)
    print("INTELLIGENT PIPELINE TRAFFIC GENERATOR")
    print("=" * 70)
    print(f"Target rate : {rate_per_minute:,} events/minute")
    print(f"Target rate : {requests_per_second:.2f} events/second")
    print(f"Pipeline    : {PIPELINE_URL}")
    print("=" * 70)

    # Number of concurrent HTTP requests
    workers = 100

    with ThreadPoolExecutor(max_workers=workers) as executor:

        while True:

            start = time.time()

            # Generate approximately one second
            # worth of traffic
            batch_size = int(requests_per_second)

            futures = []

            for _ in range(batch_size):

                event = generate_event()

                futures.append(
                    executor.submit(
                        send_event,
                        event
                    )
                )

            # Maintain target requests/sec
            elapsed = time.time() - start

            if elapsed < 1:
                time.sleep(1 - elapsed)


if __name__ == "__main__":

    # 1K/min
    generate_traffic(NORMAL_RATE)

    # For 20K/min:
    # generate_traffic(SPIKE_RATE)

