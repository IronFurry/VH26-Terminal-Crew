import asyncio
import random
import time
import httpx

PIPELINE_URL = "http://192.168.137.210:8000/events"

RATE_PER_MINUTE = 20000
REQUESTS_PER_SECOND = RATE_PER_MINUTE / 60
INTERVAL = 1 / REQUESTS_PER_SECOND

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
        "customer_value": round(random.uniform(0.05, 1.00), 2),
        "transaction_value": round(transaction_value, 2),
        "processing_cost": round(processing_cost, 2),
        "data_size": round(data_size, 2),
        "region": random.choice(INDIAN_REGIONS)
    }


async def send_event(client, event):

    try:
        response = await client.post(
            PIPELINE_URL,
            json=event
        )

        if response.status_code == 200:

            result = response.json()

            print(
                f"{event['event_id']} | "
                f"{result['priority']} | "
                f"{result['action']} | "
                f"{result['traffic_rate']:.0f}/min"
            )

        else:
            print(
                f"Pipeline error: "
                f"{response.status_code}"
            )

    except Exception as e:
        print(f"Request failed: {e}")


async def main():

    print("Starting traffic generator...")
    print(f"Pipeline: {PIPELINE_URL}")
    print(f"Rate: {RATE_PER_MINUTE} events/min")
    print(f"Rate: {REQUESTS_PER_SECOND:.2f} events/sec")

    async with httpx.AsyncClient(
        timeout=5.0
    ) as client:

        next_request = time.perf_counter()

        while True:

            event = generate_event()

            # Call existing pipeline
            asyncio.create_task(
                send_event(client, event)
            )

            # Schedule next individual request
            next_request += INTERVAL

            delay = (
                next_request
                - time.perf_counter()
            )

            if delay > 0:
                await asyncio.sleep(delay)
            else:
                next_request = time.perf_counter()


if __name__ == "__main__":
    asyncio.run(main())