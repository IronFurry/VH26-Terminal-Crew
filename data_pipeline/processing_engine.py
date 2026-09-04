import asyncio

from models import Decision


class ProcessingEngine:

    async def process(
        self,
        decision: Decision
    ):

        action = decision.action

        # ======================================
        # SHED
        # ======================================

        if action == "SHED":

            return {
                "event_id": decision.event_id,
                "status": "shed"
            }

        # ======================================
        # DEFER
        # ======================================

        if action == "DEFER":

            return {
                "event_id": decision.event_id,
                "status": "deferred"
            }

        # ======================================
        # STREAM
        # ======================================

        if action == "STREAM":

            await asyncio.sleep(
                decision.processing_cost
            )

            return {
                "event_id": decision.event_id,
                "status": "processed",
                "mode": "stream"
            }

        # ======================================
        # BATCH
        # ======================================

        if action == "BATCH":

            await asyncio.sleep(
                decision.processing_cost
            )

            return {
                "event_id": decision.event_id,
                "status": "processed",
                "mode": "batch",
                "batch_size": decision.batch_size
            }

        return {
            "event_id": decision.event_id,
            "status": "unknown"
        }