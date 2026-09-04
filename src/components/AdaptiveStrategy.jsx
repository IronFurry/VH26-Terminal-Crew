import React from 'react';

export function AdaptiveStrategy({ systemMode, workerUtilization, queueUtilization }) {
  let medRule = 'STREAM';
  let medClass = 'rule-stream';
  let lowRule = 'STREAM';
  let lowClass = 'rule-stream';

  if (systemMode === 'PRESSURE') {
    medRule = 'STREAM';
    medClass = 'rule-stream';
    lowRule = 'BATCH (250ms)';
    lowClass = 'rule-batch';
  } else if (systemMode === 'OVERLOAD') {
    medRule = 'BATCH (100ms)';
    medClass = 'rule-batch';
    lowRule = 'DEFER (1.5s)';
    lowClass = 'rule-batch';
  } else if (systemMode === 'EXTREME') {
    medRule = 'MICRO-BATCH (80)';
    medClass = 'rule-batch';
    lowRule = 'SHED 68% LOGS';
    lowClass = 'rule-defer-shed';
  }

  return (
    <div className="strategy-card">
      <div>
        <div className="card-label" style={{ marginBottom: 4 }}>Adaptive Decision Engine</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          Dynamic Routing Policies
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="strategy-row">
          <div>
            <div className="strategy-p-name text-emerald">Critical (Payments, Orders)</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Zero queue buildup &bull; Dedicated high-priority lane</div>
          </div>
          <span className="strategy-rule-badge rule-stream">STREAM &rarr; PROCESS NOW</span>
        </div>

        <div className="strategy-row">
          <div>
            <div className="strategy-p-name text-orange">Medium (Inventory Sync)</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Elastic window micro-batching (100ms)</div>
          </div>
          <span className={`strategy-rule-badge ${medClass}`}>{medRule}</span>
        </div>

        <div className="strategy-row">
          <div>
            <div className="strategy-p-name text-cyan">Low (Clicks, Telemetry Logs)</div>
            <div className="text-muted" style={{ fontSize: 11 }}>Intelligent backpressure & load shedding</div>
          </div>
          <span className={`strategy-rule-badge ${lowClass}`}>{lowRule}</span>
        </div>
      </div>

      <div className="pressure-gauges">
        <div className="pressure-gauge-item">
          <div className="gauge-label-row">
            <span>Worker Saturation</span>
            <span className="mono text-orange">{workerUtilization}%</span>
          </div>
          <div className="gauge-bar-outer">
            <div className="gauge-bar-fill" style={{ width: `${workerUtilization}%` }}></div>
          </div>
        </div>
        <div className="pressure-gauge-item">
          <div className="gauge-label-row">
            <span>Buffer Pressure</span>
            <span className="mono text-emerald">{queueUtilization}%</span>
          </div>
          <div className="gauge-bar-outer">
            <div className="gauge-bar-fill" style={{ width: `${queueUtilization}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
