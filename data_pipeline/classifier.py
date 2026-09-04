import math

from models import Event, ClassifiedEvent


BASE_WEIGHTS = {
    "payment": (4.0, 0.5, -2.0),
    "order": (3.5, 0.5, -1.5),
    "inventory": (0.5, 2.0, -0.5),
    "activity": (-1.0, 1.0, 2.0),
    "log": (-2.0, 0.0, 3.0),
}


def softmax(scores):

    maximum = max(scores)

    exps = [
        math.exp(score - maximum)
        for score in scores
    ]

    total = sum(exps)

    return [
        value / total
        for value in exps
    ]


def classify(event: Event) -> ClassifiedEvent:

    event_type = event.event_type.lower()

    base_c, base_m, base_l = BASE_WEIGHTS.get(
        event_type,
        (0.0, 0.0, 0.0)
    )

    transaction_normalized = min(
        event.transaction_value / 50000,
        1.0
    )

    critical_score = (
        base_c
        + 2.0 * transaction_normalized
        + 1.5 * event.customer_value
    )

    medium_score = (
        base_m
        + 0.2 * event.data_size
    )

    low_score = (
        base_l
        + 0.4 * event.data_size
        - 0.5 * event.customer_value
    )

    probabilities = softmax([
        critical_score,
        medium_score,
        low_score
    ])

    labels = [
        "critical",
        "medium",
        "low"
    ]

    probability_map = {
        label: round(probability, 4)
        for label, probability in zip(
            labels,
            probabilities
        )
    }

    priority = max(
        probability_map,
        key=probability_map.get
    )

    confidence = probability_map[priority]

    return ClassifiedEvent(
        **event.model_dump(),

        priority=priority,

        priority_probability=probability_map,

        confidence=confidence
    )