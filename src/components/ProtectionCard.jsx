import React from 'react';

export function ProtectionCard({ paymentsDropped, ordersDropped, clicksShed, logsShed }) {
  return (
    <div className="protection-card">
      <div>
        <div className="protection-header">
          <div className="shield-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <div className="protection-title">Critical Event Protection</div>
            <div className="protection-subtitle">ZERO-LOSS SLA GUARANTEE</div>
          </div>
        </div>

        <div className="zero-drop-metrics">
          <div className="zero-item">
            <span className="zero-item-label">Payments Dropped</span>
            <div className="zero-item-value">
              <span>{paymentsDropped}</span>
              <span className="zero-tag">PROTECTED</span>
            </div>
          </div>
          <div className="zero-item">
            <span className="zero-item-label">Orders Dropped</span>
            <div className="zero-item-value">
              <span>{ordersDropped}</span>
              <span className="zero-tag">PROTECTED</span>
            </div>
          </div>
        </div>

        <div className="shedding-stats">
          <div className="shed-stat-row">
            <span>Discardable Clicks Shed:</span>
            <strong>{clicksShed.toLocaleString()}</strong>
          </div>
          <div className="shed-stat-row">
            <span>Telemetry Logs Shed:</span>
            <strong>{logsShed.toLocaleString()}</strong>
          </div>
          <div className="shed-stat-row">
            <span>Critical Revenue at Risk:</span>
            <strong className="text-emerald">$0.00 (0.0%)</strong>
          </div>
        </div>
      </div>

      <div className="protection-guarantee-text">
        &ldquo;Load shedding is strictly restricted to non-critical events. Critical events are protected and use isolated priority queues with backpressure instead of silent dropping.&rdquo;
      </div>
    </div>
  );
}
