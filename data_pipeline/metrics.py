import time
from collections import defaultdict

from models import Decision


class Metrics:

    def __init__(self):

        self.total_events = 0
        self.processed_events = 0
        self.deferred_events = 0
        self.shed_events = 0

        self.priority_counts = {
            "critical": 0,
            "medium": 0,
            "low": 0
        }

        self.action_counts = {
            "STREAM": 0,
            "BATCH": 0,
            "DEFER": 0,
            "SHED": 0
        }

        self.queue_depth = {
            "critical": 0,
            "medium": 0,
            "low": 0
        }

        self.current_traffic_rate = 0.0

        self.total_processing_cost = 0.0

        self.region_counts = defaultdict(int)

        self.last_updated = time.time()

    def record(self, decision: Decision):

        self.total_events += 1

        priority = decision.priority.lower()
        action = decision.action

        # Priority
        if priority in self.priority_counts:

            self.priority_counts[priority] += 1

        # Action
        if action in self.action_counts:

            self.action_counts[action] += 1

        # Status
        if action == "SHED":

            self.shed_events += 1

        elif action == "DEFER":

            self.deferred_events += 1

        else:

            self.processed_events += 1

        # Queue
        self.queue_depth[priority] = (
            decision.queue_depth_at_decision
        )

        # Traffic
        self.current_traffic_rate = (
            decision.traffic_rate
        )

        # Processing cost
        self.total_processing_cost += (
            decision.processing_cost
        )

        # Region
        self.region_counts[
            decision.region
        ] += 1

        self.last_updated = time.time()

    def get_status(self):

        if self.total_events > 0:

            average_cost = (
                self.total_processing_cost
                / self.total_events
            )

        else:

            average_cost = 0.0

        return {

            "total_events":
                self.total_events,

            "processed_events":
                self.processed_events,

            "deferred_events":
                self.deferred_events,

            "shed_events":
                self.shed_events,

            "traffic_rate":
                round(
                    self.current_traffic_rate,
                    2
                ),

            "priority_counts":
                dict(self.priority_counts),

            "action_counts":
                dict(self.action_counts),

            "queue_depth":
                dict(self.queue_depth),

            "average_processing_cost":
                round(
                    average_cost,
                    3
                ),

            "region_counts":
                dict(self.region_counts),

            "last_updated":
                self.last_updated
        }

    def reset(self):

        self.__init__()