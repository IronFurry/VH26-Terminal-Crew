import React from 'react';

export function BatchPanel({ batchSize, activeBatches, avgBatchSize, batchEfficiency, isSpikeActive }) {
  const conveyorChunks = Array.from({ length: 8 });

  return (
    <div className="batch-panel-card">
      <div>
        <div className="card-label" style={{ marginBottom: 4 }}>Batch Processing Engine</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          Micro-Batch Compression
        </div>
      </div>

      <div className="batch-stats-grid">
        <div className="batch-stat-box">
          <div className="batch-stat-num">{batchSize}</div>
          <div className="batch-stat-desc">Current Batch Size</div>
        </div>
        <div className="batch-stat-box">
          <div className="batch-stat-num">{activeBatches}</div>
          <div className="batch-stat-desc">Active Batches</div>
        </div>
        <div className="batch-stat-box">
          <div className="batch-stat-num">{avgBatchSize}</div>
          <div className="batch-stat-desc">Avg Events / Batch</div>
        </div>
        <div className="batch-stat-box">
          <div className="batch-stat-num text-emerald">{batchEfficiency}</div>
          <div className="batch-stat-desc">I/O Reduction Ratio</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Micro-Batch Pipeline Lanes</span>
          <span className="mono">{isSpikeActive ? 'Active Micro-batches' : 'Individual Streams'}</span>
        </div>
        <div className="batch-conveyor-anim">
          {conveyorChunks.map((_, idx) => (
            <div
              key={idx}
              className={`conveyor-chunk ${idx < activeBatches ? 'packed' : ''}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
