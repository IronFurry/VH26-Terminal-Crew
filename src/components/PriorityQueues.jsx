import React from 'react';

export function PriorityQueues({ queues }) {
  const { critical, medium, low } = queues;

  const critBufPct = Math.min(100, Math.round((critical.depth / critical.maxSafe) * 100));
  const medBufPct = Math.min(100, Math.round((medium.depth / medium.maxSafe) * 100));
  const lowBufPct = Math.min(100, Math.round((low.depth / low.maxSafe) * 100));

  let lowStatusClass = 'status-streaming';
  if (low.status === 'BATCHING') lowStatusClass = 'status-batching';
  if (low.status === 'DEFERRED') lowStatusClass = 'status-deferred';
  if (low.status === 'SHEDDING') lowStatusClass = 'status-shedding';

  return (
    <div className="queues-grid">
      {/* CRITICAL QUEUE */}
      <div className="queue-card queue-critical">
        <div className="queue-header">
          <div className="queue-title-wrap">
            <span className="queue-priority-name text-emerald">CRITICAL</span>
            <span className="queue-event-types">Payment, Order</span>
          </div>
          <span className="queue-status-pill status-protected">PROTECTED</span>
        </div>

        <div className="queue-metric-row">
          <div className="q-metric">
            <span className="q-metric-label">Queue Size</span>
            <span className="q-metric-value text-emerald">{critical.depth}</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">Proc Rate</span>
            <span className="q-metric-value">{critical.rate.toFixed(1)}/s</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">P95 Latency</span>
            <span className="q-metric-value text-emerald">{critical.p95}ms</span>
          </div>
        </div>

        <div className="queue-buffer-wrap">
          <div className="queue-buffer-header">
            <span>Buffer Depth (Safe &lt; 50)</span>
            <span className="mono">{critBufPct}%</span>
          </div>
          <div className="queue-buffer-bar">
            <div className="queue-buffer-fill fill-critical" style={{ width: `${Math.max(4, critBufPct)}%` }}></div>
          </div>
        </div>

        <div className="queue-footer-info">
          <span>Worker Threads: <strong>16 dedicated</strong></span>
          <span className="text-emerald mono">0% Drops</span>
        </div>
      </div>

      {/* MEDIUM QUEUE */}
      <div className="queue-card queue-medium">
        <div className="queue-header">
          <div className="queue-title-wrap">
            <span className="queue-priority-name text-orange">MEDIUM</span>
            <span className="queue-event-types">Inventory, Cart Sync</span>
          </div>
          <span className={`queue-status-pill ${medium.status === 'STREAMING' ? 'status-streaming' : 'status-batching'}`}>
            {medium.status}
          </span>
        </div>

        <div className="queue-metric-row">
          <div className="q-metric">
            <span className="q-metric-label">Queue Size</span>
            <span className="q-metric-value text-orange">{medium.depth}</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">Proc Rate</span>
            <span className="q-metric-value">{medium.rate.toFixed(1)}/s</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">P95 Latency</span>
            <span className="q-metric-value">{medium.p95}ms</span>
          </div>
        </div>

        <div className="queue-buffer-wrap">
          <div className="queue-buffer-header">
            <span>Buffer Depth (Threshold 200)</span>
            <span className="mono">{medBufPct}%</span>
          </div>
          <div className="queue-buffer-bar">
            <div className="queue-buffer-fill fill-medium" style={{ width: `${Math.max(3, medBufPct)}%` }}></div>
          </div>
        </div>

        <div className="queue-footer-info">
          <span>Adaptive Window: <strong>50ms-150ms</strong></span>
          <span className="text-secondary mono">8 Workers</span>
        </div>
      </div>

      {/* LOW QUEUE */}
      <div className="queue-card queue-low">
        <div className="queue-header">
          <div className="queue-title-wrap">
            <span className="queue-priority-name text-cyan">LOW</span>
            <span className="queue-event-types">Clicks, Logs</span>
          </div>
          <span className={`queue-status-pill ${lowStatusClass}`}>{low.status}</span>
        </div>

        <div className="queue-metric-row">
          <div className="q-metric">
            <span className="q-metric-label">Queue Size</span>
            <span className="q-metric-value text-cyan">{low.depth}</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">Proc Rate</span>
            <span className="q-metric-value">{low.rate.toFixed(1)}/s</span>
          </div>
          <div className="q-metric">
            <span className="q-metric-label">P95 Latency</span>
            <span className="q-metric-value">{low.p95}ms</span>
          </div>
        </div>

        <div className="queue-buffer-wrap">
          <div className="queue-buffer-header">
            <span>Buffer Depth (Max 1000)</span>
            <span className="mono">{lowBufPct}%</span>
          </div>
          <div className="queue-buffer-bar">
            <div
              className={`queue-buffer-fill fill-low ${low.status === 'SHEDDING' ? 'shedding' : ''}`}
              style={{ width: `${Math.max(2, lowBufPct)}%` }}
            ></div>
          </div>
        </div>

        <div className="queue-footer-info">
          <span>Strategy: <strong>Micro-batch / Shed</strong></span>
          <span className="text-secondary mono">8 Workers</span>
        </div>
      </div>
    </div>
  );
}
