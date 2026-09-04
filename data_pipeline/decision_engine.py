import json
from pathlib import Path

# Queue depth thresholds per tier (tunable)
QUEUE_THRESHOLDS = {
    "critical": {"backpressure": 500},
    "medium":   {"batch": 50, "defer": 300},
    "low":      {"batch": 20, "defer": 100, "shed": 400},
}

# Simulated worker drain rate per tier (events cleared per incoming event)
DRAIN_RATE = {
    "critical": 1.0,
    "medium": 0.6,
    "low": 0.3,
}


class DecisionEngine:
    def __init__(self):
        self.queue_depth = {"critical": 0.0, "medium": 0.0, "low": 0.0}

    def decide(self, event):
        tier = event["priority"].lower()
        self.queue_depth[tier] = max(0.0, self.queue_depth[tier] + 1 - DRAIN_RATE[tier])
        depth = self.queue_depth[tier]

        if tier == "critical":
            action = "STREAM"
            reason = f"critical priority, always streamed (queue depth {depth:.1f})"
            if depth > QUEUE_THRESHOLDS["critical"]["backpressure"]:
                reason = f"critical priority, backpressure signaled upstream, still streamed (queue depth {depth:.1f})"

        elif tier == "medium":
            th = QUEUE_THRESHOLDS["medium"]
            if depth < th["batch"]:
                action, reason = "STREAM", f"medium priority, queue depth {depth:.1f} below batch threshold"
            elif depth < th["defer"]:
                action, reason = "BATCH", f"medium priority, micro-batching (queue depth {depth:.1f})"
            else:
                action, reason = "DEFER", f"medium priority, deferred under high load (queue depth {depth:.1f})"

        else:  # low
            th = QUEUE_THRESHOLDS["low"]
            if depth < th["batch"]:
                action, reason = "STREAM", f"low priority, queue depth {depth:.1f} below batch threshold"
            elif depth < th["defer"]:
                action, reason = "BATCH", f"low priority, micro-batching (queue depth {depth:.1f})"
            elif depth < th["shed"]:
                action, reason = "DEFER", f"low priority, deferred under high load (queue depth {depth:.1f})"
            else:
                action, reason = "SHED", f"low priority, shed under extreme load (queue depth {depth:.1f})"

        return {
            **event,
            "queue_depth_at_decision": round(depth, 2),
            "action": action,
            "decision_reason": reason,
        }


def process_file(in_path, out_path):
    in_path = Path(in_path)
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not in_path.exists():
        print(f"Error: Input file {in_path} not found. Please run classifier.py first.")
        return {}

    engine = DecisionEngine()
    action_counts = {"STREAM": 0, "BATCH": 0, "DEFER": 0, "SHED": 0}

    with open(in_path, "r", encoding="utf-8") as fin, open(out_path, "w", encoding="utf-8") as fout:
        for line in fin:
            line = line.strip()
            if not line:
                continue
            event = json.loads(line)
            decided = engine.decide(event)
            fout.write(json.dumps(decided) + "\n")
            action_counts[decided["action"]] += 1

    print(f"{in_path} -> {out_path}")
    print(f"  action breakdown: {action_counts}")
    return action_counts


def main():
    data_dir = Path(__file__).resolve().parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    process_file(
        data_dir / "baseline_1k_classified.jsonl",
        data_dir / "baseline_1k_decided.jsonl",
    )
    process_file(
        data_dir / "spike_20k_classified.jsonl",
        data_dir / "spike_20k_decided.jsonl",
    )


if __name__ == "__main__":
    main()
