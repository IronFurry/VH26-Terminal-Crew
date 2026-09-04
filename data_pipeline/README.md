# Data Pipeline

Simulated event pipeline for **Intelligent Data Pipeline for Optimized Data Processing**.

## Pipeline Stages

1. **Traffic Generator (`traffic_generator.py`)**:
   Generates baseline traffic (~1,000 events/min) and flash-sale spike traffic (~20,000 events/min) into JSONL files.

2. **Classifier (`classifier.py`)**:
   Applies multi-factor scoring (transaction value, customer lifetime value, data size, base weights) with softmax normalization to assign priorities (`CRITICAL`, `MEDIUM`, `LOW`) with confidence scores.

3. **Decision Engine (`decision_engine.py`)**:
   Simulates worker queue depth and adaptive routing decisions (`STREAM`, `BATCH`, `DEFER`, `SHED`) based on priority tier thresholds.

## Usage

Run the pipeline stages in sequence:

```bash
# 1. Generate events
py traffic_generator.py

# 2. Classify events
py classifier.py

# 3. Apply adaptive decisions
py decision_engine.py
```

Generated outputs are placed in `data/`:
- `baseline_1k.jsonl` / `spike_20k.jsonl`
- `baseline_1k_classified.jsonl` / `spike_20k_classified.jsonl`
- `baseline_1k_decided.jsonl` / `spike_20k_decided.jsonl`
