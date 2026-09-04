import asyncio

from aiokafka import AIOKafkaConsumer

from models import Decision
from processing_engine import ProcessingEngine
from kafka_manager import (
    KafkaManager,
    TOPICS
)


class KafkaWorkers:

    def __init__(
        self,
        metrics,
        broadcast
    ):

        self.metrics = metrics

        self.broadcast = broadcast

        self.processing_engine = (
            ProcessingEngine()
        )

        self.kafka = KafkaManager()

        self.consumers = []


    async def start(self):

        # ==========================================
        # CRITICAL CONSUMER
        # ==========================================

        critical_consumer = (
            self.kafka.create_consumer(
                "critical",
                "critical-workers"
            )
        )

        # ==========================================
        # MEDIUM CONSUMER
        # ==========================================

        medium_consumer = (
            self.kafka.create_consumer(
                "medium",
                "medium-workers"
            )
        )

        # ==========================================
        # LOW CONSUMER
        # ==========================================

        low_consumer = (
            self.kafka.create_consumer(
                "low",
                "low-workers"
            )
        )

        self.consumers = [
            critical_consumer,
            medium_consumer,
            low_consumer
        ]

        for consumer in self.consumers:

            await consumer.start()


        await asyncio.gather(

            self.consume_stream(
                critical_consumer,
                "critical"
            ),

            self.consume_medium(
                medium_consumer
            ),

            self.consume_low(
                low_consumer
            )
        )


    async def consume_stream(
        self,
        consumer,
        priority
    ):

        try:

            async for message in consumer:

                decision = Decision(
                    **message.value
                )

                result = (
                    await self.processing_engine
                    .process(decision)
                )

                self.metrics.record_processed(
                    decision,
                    result
                )

                await consumer.commit()

                await self.broadcast()

        finally:

            await consumer.stop()


    async def consume_medium(
        self,
        consumer
    ):

        try:

            while True:

                records = await consumer.getmany(
                    timeout_ms=500,
                    max_records=100
                )

                batch = []

                for messages in records.values():

                    for message in messages:

                        decision = Decision(
                            **message.value
                        )

                        if decision.action == "BATCH":

                            batch.append(decision)

                        else:

                            result = (
                                await self.processing_engine
                                .process(decision)
                            )

                            self.metrics.record_processed(
                                decision,
                                result
                            )


                if batch:

                    await self.process_batch(
                        batch
                    )


                await consumer.commit()

                await self.broadcast()

        finally:

            await consumer.stop()


    async def consume_low(
        self,
        consumer
    ):

        try:

            while True:

                records = await consumer.getmany(
                    timeout_ms=1000,
                    max_records=200
                )

                batch = []

                for messages in records.values():

                    for message in messages:

                        decision = Decision(
                            **message.value
                        )

                        if decision.action == "BATCH":

                            batch.append(decision)

                        elif decision.action == "DEFER":

                            self.metrics.record_deferred(
                                decision
                            )

                        else:

                            result = (
                                await self.processing_engine
                                .process(decision)
                            )

                            self.metrics.record_processed(
                                decision,
                                result
                            )


                if batch:

                    await self.process_batch(
                        batch
                    )


                await consumer.commit()

                await self.broadcast()

        finally:

            await consumer.stop()


    async def process_batch(
        self,
        decisions
    ):

        if not decisions:

            return

        # In a real implementation this would be
        # a single bulk processing operation.

        total_cost = max(
            decision.processing_cost
            for decision in decisions
        )

        await asyncio.sleep(
            total_cost
        )

        for decision in decisions:

            result = {
                "event_id": decision.event_id,
                "status": "processed",
                "mode": "batch",
                "batch_size": len(decisions),
                "priority": decision.priority
            }

            self.metrics.record_processed(
                decision,
                result
            )