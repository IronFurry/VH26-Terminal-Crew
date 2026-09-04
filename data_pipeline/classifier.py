import json
import math
from pathlib import Path

BASE_WEIGHTS = {
    "payment":   (4.0, 0.5, -2.0),
    "order":     (3.5, 0.5, -1.5),
    "inventory": (0.5, 2.0, -0.5),
    "activity":  (-1.0, 1.0, 2.0),
    "log":       (-2.0, 0.0, 3.0),
}

def softmax(scores):
    m = max(scores)
    exps = [math.exp(s - m) for s in scores]
    total = sum(exps)
    return [e / total for e in exps]


def classify(event):
    et = event["event_type"]
    base_c, base_m, base_l = BASE_WEIGHTS[et]

    txn_norm = min(event["transaction_value"] / 50000, 1.0)
    cust = event["customer_value"]
    size = event["data_size"]

    critical_score = base_c + 2.0 * txn_norm + 1.5 * cust
    medium_score = base_m + 0.2 * size
    low_score = base_l + 0.4 * size - 0.5 * cust

    probs = softmax([critical_score, medium_score, low_score])
    labels = ["critical", "medium", "low"]
    prob_map = {label: round(p, 4) for label, p in zip(labels, probs)}

    priority = max(prob_map, key=prob_map.get).upper()
    confidence = prob_map[priority.lower()]

    return {
        **event,
        "priority": priority,
        "priority_probability": prob_map,
        "confidence": confidence,
    }


def classify_file(in_path, out_path):
    in_path = Path(in_path)
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        print(f"Error: Input file {in_path} not found. Please run traffic_generator.py first.")
        return

    count = 0
    with open(in_path, "r", encoding="utf-8") as fin, open(out_path, "w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            event = json.loads(line)
            fout.write(json.dumps(classify(event)) + "\n")
            count += 1
    print(f"Classified {count} events -> {out_path}")


def main():
    data_dir = Path(__file__).resolve().parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    classify_file(data_dir / "baseline_1k.jsonl", data_dir / "baseline_1k_classified.jsonl")
    classify_file(data_dir / "spike_20k.jsonl", data_dir / "spike_20k_classified.jsonl")


if __name__ == "__main__":
    main()

