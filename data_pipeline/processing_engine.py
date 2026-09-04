import asyncio

from models import Decision


class ProcessingEngine:

    async def process(
        self,
        decision: Decision
    ):

        action = decision.action


        # ==========================================
        # STREAM
        # ==========================================

        if action == "STREAM":

            await asyncio.sleep(
                decision.processing_cost
            )

            return {
                "event_id": decision.event_id,
                "status": "processed",
                "mode": "stream",
                "priority": decision.priority
            }


        # ==========================================
        # BATCH
        # ==========================================

        if action == "BATCH":

            await asyncio.sleep(
                decision.processing_cost
            )

            return {
                "event_id": decision.event_id,
                "status": "processed",
                "mode": "batch",
                "batch_size": decision.batch_size,
                "priority": decision.priority
            }


        # ==========================================
        # DEFER
        # ==========================================

        if action == "DEFER":

            return {
                "event_id": decision.event_id,
                "status": "deferred",
                "priority": decision.priority
            }


        return {
            "event_id": decision.event_id,
            "status": "unknown"
        }