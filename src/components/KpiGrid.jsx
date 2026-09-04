import React from 'react';

export function KpiGrid({
  actualIncomingRate,
  targetRate,
  isSpikeActive,
  processedRate,
  processingCapacity,
  criticalP95,
  criticalP50,
  totalQueueDepth,
  queueUtilization,
  criticalDepth,
  totalBatched,
  batchEfficiency,
  activeBatches,
  totalShed
}) {
  return (
    <section className="kpi-grid">
      {/* 1. Incoming Rate */}
      <div className="card">
        <div className="card-top">
          <span className="card-label">Incoming Rate</span>
          <div className="card-icon text-orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value text-orange">{actualIncomingRate.toFixed(1)}</span>
          <span className="card-unit">events/s</span>
        </div>
        <div className="card-footer">
          <span className={`trend-badge ${isSpikeActive ? 'trend-spike' : 'trend-neutral'}`}>
            {isSpikeActive ? '20× FLASH SPIKE' : 'Baseline 1k/min'}
          </span>
          <span className="mono text-muted">Target: ~{targetRate.toFixed(1)}/s</span>
        </div>
      </div>

      {/* 2. Processed Rate */}
      <div className="card">
        <div className="card-top">
          <span className="card-label">Processed Rate</span>
          <div className="card-icon text-emerald">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value text-emerald">{processedRate.toFixed(1)}</span>
          <span className="card-unit">events/s</span>
        </div>
        <div className="card-footer">
          <span className="trend-badge trend-up">Throughput: 99.4%</span>
          <span className="mono text-muted">Cap: {Math.round(processingCapacity)}/s</span>
        </div>
      </div>

      {/* 3. Critical Latency */}
      <div className="card card-hero-latency">
        <div className="card-top">
          <span className="card-label">Critical Latency</span>
          <div className="card-icon text-emerald">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value text-emerald">{criticalP95}</span>
          <span className="card-unit">ms (P95)</span>
        </div>
        <div className="card-footer">
          <span className="trend-badge trend-up">SLA: &lt;100ms MET</span>
          <span className="mono text-muted">P50: {criticalP50}ms</span>
        </div>
      </div>

      {/* 4. Queue Depth */}
      <div className="card">
        <div className="card-top">
          <span className="card-label">Queue Depth</span>
          <div className="card-icon text-muted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value">{totalQueueDepth.toLocaleString()}</span>
          <span className="card-unit">queued</span>
        </div>
        <div className="card-footer">
          <span className="trend-badge trend-neutral">Util: {queueUtilization}%</span>
          <span className="mono text-muted">Crit: {criticalDepth}</span>
        </div>
      </div>

      {/* 5. Events Batched */}
      <div className="card">
        <div className="card-top">
          <span className="card-label">Events Batched</span>
          <div className="card-icon text-orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value text-orange">{totalBatched.toLocaleString()}</span>
          <span className="card-unit">events</span>
        </div>
        <div className="card-footer">
          <span className="trend-badge trend-neutral">Efficiency: {batchEfficiency}</span>
          <span className="mono text-muted">{activeBatches} batches</span>
        </div>
      </div>

      {/* 6. Events Shed */}
      <div className="card card-shed">
        <div className="card-top">
          <span className="card-label">Events Shed</span>
          <div className="card-icon text-rose">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </div>
        </div>
        <div className="card-value-wrap">
          <span className="card-value text-rose">{totalShed.toLocaleString()}</span>
          <span className="card-unit">low-priority</span>
        </div>
        <div className="card-footer">
          <span className="trend-badge trend-up">Critical Shed: 0</span>
          <span className="mono text-muted">Non-critical only</span>
        </div>
      </div>
    </section>
  );
}
