import time
from collections import deque


class TrafficMonitor:

    def __init__(
        self,
        window_seconds: int = 10
    ):

        self.window_seconds = window_seconds

        self.timestamps = deque()


    def record_event(self):

        now = time.time()

        self.timestamps.append(now)

        self._cleanup(now)


    def _cleanup(self, now):

        cutoff = (
            now - self.window_seconds
        )

        while (
            self.timestamps
            and self.timestamps[0] < cutoff
        ):

            self.timestamps.popleft()


    def get_events_per_minute(self) -> float:

        now = time.time()

        self._cleanup(now)

        count = len(self.timestamps)

        return (
            count
            / self.window_seconds
            * 60
        )


    def get_current_count(self) -> int:

        self._cleanup(time.time())

        return len(self.timestamps)