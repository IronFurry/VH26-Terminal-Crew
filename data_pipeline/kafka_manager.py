import json

from aiokafka import (
    AIOKafkaProducer,
    AIOKafkaConsumer
)


KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"

TOPICS = {
    "critical": "critical-events",
    "medium": "medium-events",
    "low": "low-events"
}


class KafkaManager:

    def __init__(self):

        self.producer = None


    async def start_producer(self):

        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda value:
                json.dumps(value).encode("utf-8")
        )

        await self.producer.start()


    async def stop_producer(self):

        if self.producer:

            await self.producer.stop()


    async def publish_decision(
        self,
        decision
    ):

        priority = decision.priority.lower()

        topic = TOPICS[priority]

        # SHED means the event does not enter Kafka.
        if decision.action == "SHED":

            return {
                "status": "shed",
                "topic": None
            }

        payload = decision.model_dump()

        await self.producer.send_and_wait(
            topic,
            payload
        )

        return {
            "status": "queued",
            "topic": topic
        }


    def create_consumer(
        self,
        priority: str,
        group_id: str
    ):

        topic = TOPICS[priority]

        return AIOKafkaConsumer(
            topic,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=group_id,
            value_deserializer=lambda value:
                json.loads(value.decode("utf-8")),
            enable_auto_commit=False
        )