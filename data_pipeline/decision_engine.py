from models import ClassifiedEvent, Decision


# ============================================================
# CONFIGURATION
# ============================================================

NORMAL_TRAFFIC_RATE = 1000

# Shedding is allowed only when traffic is significantly
# above normal traffic.
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


# Simulated processing/drain capacity
DRAIN_RATE = {

    "critical": 1.0,
    "medium": 0.6,
    "low": 0.3
}


# ============================================================
# DECISION ENGINE
# ============================================================

class DecisionEngine:

    def __init__(self):

        self.queue_depth = {

            "critical": 0.0,
            "medium": 0.0,
            "low": 0.0
        }


    # ========================================================
    # MAIN DECISION FUNCTION
    # ========================================================

    def decide(
        self,
        event: ClassifiedEvent,
        traffic_rate: float
    ) -> Decision:

        tier = event.priority.lower()


        # ====================================================
        # SIMULATED QUEUE GROWTH
        # ====================================================

        self.queue_depth[tier] = max(

            0.0,

            self.queue_depth[tier]
            + 1
            - DRAIN_RATE[tier]
        )

        depth = self.queue_depth[tier]


        # ====================================================
        # CRITICAL
        # ====================================================

        if tier == "critical":

            # Critical events are ALWAYS streamed.
            # They are NEVER batched, deferred or shed.

            action = "STREAM"

            reason = (
                "Critical priority - "
                "immediate streaming"
            )


            # Informational backpressure signal.
            # It does NOT stop the critical event.

            if depth > QUEUE_THRESHOLDS[
                "critical"
            ]["backpressure"]:

                reason = (
                    "Critical priority - immediate "
                    "streaming with upstream "
                    "backpressure signal"
                )


        # ====================================================
        # MEDIUM
        # ====================================================

        elif tier == "medium":

            thresholds = QUEUE_THRESHOLDS["medium"]


            # -----------------------------------------------
            # LOW QUEUE PRESSURE
            # -----------------------------------------------

            if depth < thresholds["batch"]:

                action = "STREAM"

                reason = (
                    "Medium priority - "
                    "normal queue pressure"
                )


            # -----------------------------------------------
            # MODERATE QUEUE PRESSURE
            # -----------------------------------------------

            elif depth < thresholds["defer"]:

                action = "BATCH"

                reason = (
                    "Medium priority - "
                    "micro-batching under load"
                )


            # -----------------------------------------------
            # HIGH QUEUE PRESSURE
            # -----------------------------------------------

            else:

                action = "DEFER"

                reason = (
                    "Medium priority - "
                    "deferred under high queue pressure"
                )


        # ====================================================
        # LOW
        # ====================================================

        else:

            thresholds = QUEUE_THRESHOLDS["low"]


            # =================================================
            # NORMAL TRAFFIC
            # =================================================
            #
            # <= 1000 requests/minute
            #
            # IMPORTANT:
            # NEVER SHED AT NORMAL TRAFFIC.
            # =================================================

            if traffic_rate <= NORMAL_TRAFFIC_RATE:

                if depth < thresholds["batch"]:

                    action = "STREAM"

                    reason = (
                        "Low priority - normal traffic, "
                        "streaming"
                    )

                else:

                    action = "BATCH"

                    reason = (
                        "Low priority - normal traffic, "
                        "micro-batching, no shedding"
                    )


            # =================================================
            # ABOVE NORMAL TRAFFIC
            # =================================================

            else:

                # ---------------------------------------------
                # TRAFFIC ABOVE NORMAL
                # ---------------------------------------------

                if depth < thresholds["batch"]:

                    action = "STREAM"

                    reason = (
                        "Low priority - elevated traffic, "
                        "pressure manageable"
                    )


                # ---------------------------------------------
                # BATCH
                # ---------------------------------------------

                elif depth < thresholds["defer"]:

                    action = "BATCH"

                    reason = (
                        "Low priority - elevated traffic, "
                        "micro-batching"
                    )


                # ---------------------------------------------
                # DEFER
                # ---------------------------------------------

                elif depth < thresholds["shed"]:

                    action = "DEFER"

                    reason = (
                        "Low priority - high traffic, "
                        "deferred"
                    )


                # ---------------------------------------------
                # SHED
                # ---------------------------------------------
                #
                # Shedding is allowed ONLY when:
                #
                # 1. Traffic > 5000/min
                # 2. Queue depth >= 400
                #
                # Therefore normal traffic can NEVER shed.
                # ---------------------------------------------

                else:

                    if traffic_rate >= SHED_TRAFFIC_THRESHOLD:

                        action = "SHED"

                        reason = (
                            "Low priority - extreme traffic "
                            "and queue pressure, "
                            "shedding allowed"
                        )

                    else:

                        # Traffic is above normal but has
                        # not reached the shedding threshold.
                        #
                        # Instead of dropping the event,
                        # defer it.

                        action = "DEFER"

                        reason = (
                            "Low priority - high queue "
                            "pressure but traffic below "
                            "shedding threshold, deferred"
                        )


        # ====================================================
        # CALCULATE BATCH SIZE
        # ====================================================

        batch_size = self.calculate_batch_size(

            event,
            traffic_rate,
            tier
        )


        # ====================================================
        # RETURN DECISION
        # ====================================================

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


    # ========================================================
    # ADAPTIVE BATCH SIZE
    # ========================================================

    def calculate_batch_size(

        self,
        event: ClassifiedEvent,
        traffic_rate: float,
        tier: str
        
    ) -> int:

        # ----------------------------------------------------
        # Critical events are never batched
        # ----------------------------------------------------

        if tier == "critical":

            return 1


        processing_cost = event.processing_cost


        # ----------------------------------------------------
        # Processing cost
        #
        # Expensive events -> smaller batches
        # Cheap events     -> larger batches
        # ----------------------------------------------------

        if processing_cost >= 0.75:

            batch_size = 10

        elif processing_cost >= 0.40:

            batch_size = 25

        else:

            batch_size = 50


        # ----------------------------------------------------
        # Traffic adaptation
        # ----------------------------------------------------

        if traffic_rate >= 15000:

            batch_size *= 2

        elif traffic_rate >= 10000:

            batch_size = int(
                batch_size * 1.5
            )


        return batch_size      