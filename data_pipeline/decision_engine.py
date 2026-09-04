from models import ClassifiedEvent, Decision


NORMAL_TRAFFIC_RATE = 1000

SHED_TRAFFIC_THRESHOLD = 5000


QUEUE_THRESHOLDS = {

    "critical": {
        "backpressure": 500
    },

    "medium": {
        "batch": 50,
        "defer": 300
    },

    "low": {
        "batch": 20,
        "defer": 100,
        "shed": 400
    }
}


DRAIN_RATE = {

    "critical": 1.0,
    "medium": 0.6,
    "low": 0.3
}


class DecisionEngine:

    def __init__(self):

        self.queue_depth = {
            "critical": 0.0,
            "medium": 0.0,
            "low": 0.0
        }


    def decide(
        self,
        event: ClassifiedEvent,
        traffic_rate: float
    ) -> Decision:

        tier = event.priority.lower()

        self.queue_depth[tier] = max(
            0.0,
            self.queue_depth[tier]
            + 1
            - DRAIN_RATE[tier]
        )

        depth = self.queue_depth[tier]


        # ==========================================
        # CRITICAL
        # ==========================================

        if tier == "critical":

            action = "STREAM"

            reason = (
                "Critical priority - "
                "immediate streaming"
            )

            if depth > QUEUE_THRESHOLDS[
                "critical"
            ]["backpressure"]:

                reason = (
                    "Critical priority - streaming "
                    "with upstream backpressure"
                )


        # ==========================================
        # MEDIUM
        # ==========================================

        elif tier == "medium":

            thresholds = QUEUE_THRESHOLDS["medium"]

            if depth < thresholds["batch"]:

                action = "STREAM"

                reason = (
                    "Medium priority - "
                    "normal queue pressure"
                )

            elif depth < thresholds["defer"]:

                action = "BATCH"

                reason = (
                    "Medium priority - "
                    "micro-batching under load"
                )

            else:

                action = "DEFER"

                reason = (
                    "Medium priority - "
                    "deferred under high pressure"
                )


        # ==========================================
        # LOW
        # ==========================================

        else:

            thresholds = QUEUE_THRESHOLDS["low"]

            if traffic_rate <= NORMAL_TRAFFIC_RATE:

                if depth < thresholds["batch"]:

                    action = "STREAM"

                    reason = (
                        "Low priority - normal traffic"
                    )

                else:

                    action = "BATCH"

                    reason = (
                        "Low priority - "
                        "micro-batching"
                    )

            else:

                if depth < thresholds["batch"]:

                    action = "STREAM"

                    reason = (
                        "Low priority - elevated traffic"
                    )

                elif depth < thresholds["defer"]:

                    action = "BATCH"

                    reason = (
                        "Low priority - "
                        "micro-batching"
                    )

                elif depth < thresholds["shed"]:

                    action = "DEFER"

                    reason = (
                        "Low priority - "
                        "deferred under pressure"
                    )

                else:

                    if traffic_rate >= SHED_TRAFFIC_THRESHOLD:

                        action = "SHED"

                        reason = (
                            "Low priority - extreme "
                            "traffic and queue pressure"
                        )

                    else:

                        action = "DEFER"

                        reason = (
                            "Low priority - queue pressure "
                            "but shedding threshold not reached"
                        )


        batch_size = self.calculate_batch_size(
            event,
            traffic_rate,
            tier
        )

        return Decision(

            **event.model_dump(),

            traffic_rate=round(
                traffic_rate,
                2
            ),

            queue_depth_at_decision=round(
                depth,
                2
            ),

            action=action,

            batch_size=batch_size,

            decision_reason=reason
        )


    def calculate_batch_size(
        self,
        event: ClassifiedEvent,
        traffic_rate: float,
        tier: str
    ) -> int:

        if tier == "critical":

            return 1

        processing_cost = event.processing_cost

        if processing_cost >= 0.75:

            batch_size = 10

        elif processing_cost >= 0.40:

            batch_size = 25

        else:

            batch_size = 50

        if traffic_rate >= 15000:

            batch_size *= 2

        elif traffic_rate >= 10000:

            batch_size = int(
                batch_size * 1.5
            )

        return batch_size