from pydantic import BaseModel
from typing import Dict


class Event(BaseModel):
    event_id: str
    event_type: str
    timestamp: int
    customer_value: float
    transaction_value: float
    processing_cost: float
    data_size: float
    region: str


class ClassifiedEvent(Event):
    priority: str
    priority_probability: Dict[str, float]
    confidence: float


class Decision(ClassifiedEvent):
    traffic_rate: float
    queue_depth_at_decision: float
    action: str
    batch_size: int
    decision_reason: str