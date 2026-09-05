import requests
import time

URL = "http://127.0.0.1:9000/process"

print("Sending request...")

start = time.perf_counter()

response = requests.get(URL)

end = time.perf_counter()

print("\nResponse:")
if response.status_code == 200:
    print(response.json())
else:
    print(f"Error {response.status_code}: {response.text}")

print(f"\nTotal round-trip time: {(end - start) * 1000:.3f} ms")