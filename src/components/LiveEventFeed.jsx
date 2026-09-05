import React, { useState } from 'react';

export function LiveEventFeed({ liveEvents }) {
  const [filter, setFilter] = useState('all');

  const filtered = liveEvents.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'CRITICAL') return event.priority === 'CRITICAL';
    if (filter === 'BATCH') return event.decision === 'BATCH';
    if (filter === 'SHED') return event.decision === 'SHED';
    return true;
  });

  return (
    <section className="live-feed-card">
      <div className="feed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="card-label">Live Event Processing Stream</span>
          <span className="badge badge-live" style={{ fontSize: 10, padding: '2px 8px' }}>
            <span className="pulse-dot"></span>
            REALTIME
          </span>
          <span className="badge" style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {Math.min(filtered.length, 50)} / 50 stored
          </span>
        </div>

        <div className="feed-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Events
          </button>
          <button
            className={`filter-btn ${filter === 'CRITICAL' ? 'active' : ''}`}
            onClick={() => setFilter('CRITICAL')}
          >
            Critical Only
          </button>
          <button
            className={`filter-btn ${filter === 'BATCH' ? 'active' : ''}`}
            onClick={() => setFilter('BATCH')}
          >
            Batched
          </button>
          <button
            className={`filter-btn ${filter === 'SHED' ? 'active' : ''}`}
            onClick={() => setFilter('SHED')}
          >
            Shed
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Time</th>
              <th style={{ width: 140 }}>Event ID</th>
              <th style={{ width: 110 }}>Event Type</th>
              <th style={{ width: 110 }}>Priority</th>
              <th style={{ width: 90 }}>Confidence</th>
              <th style={{ width: 110 }}>Decision</th>
              <th style={{ width: 90 }}>Region</th>
              <th style={{ width: 95 }}>Proc. Time</th>
              <th style={{ width: 100 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(event => {
              let pBadgeClass = 'p-low';
              if (event.priority === 'CRITICAL') pBadgeClass = 'p-critical';
              if (event.priority === 'MEDIUM') pBadgeClass = 'p-medium';

              let decBadgeClass = 'dec-stream';
              if (event.decision === 'BATCH') decBadgeClass = 'dec-batch';
              if (event.decision === 'DEFER') decBadgeClass = 'dec-defer';
              if (event.decision === 'SHED') decBadgeClass = 'dec-shed';

              // Confidence as a coloured percentage (from classifier.py output)
              const confPct = event.confidence != null ? Math.round(event.confidence * 100) : null;
              const confColor =
                confPct >= 80 ? 'var(--success)' :
                confPct >= 55 ? 'var(--warning)' :
                'var(--muted)';

              let statusNode = (
                <span className="status-cell st-success">
                  <span className="status-cell-dot"></span>SUCCESS
                </span>
              );
              if (event.status === 'BATCHED') {
                statusNode = (
                  <span className="status-cell st-batched">
                    <span className="status-cell-dot"></span>BATCHED
                  </span>
                );
              } else if (event.status === 'DEFERRED') {
                statusNode = (
                  <span className="status-cell st-deferred">
                    <span className="status-cell-dot"></span>DEFERRED
                  </span>
                );
              } else if (event.status === 'SHED') {
                statusNode = (
                  <span className="status-cell st-shed">
                    <span className="status-cell-dot"></span>SHED
                  </span>
                );
              }

              return (
                <tr key={`${event.id}-${event.timestamp}`} className={event.priority === 'CRITICAL' ? 'row-critical' : ''}>
                  <td className="text-muted mono" style={{ fontSize: 11 }}>{event.timestamp}</td>
                  <td><strong style={{ fontFamily: 'monospace', fontSize: 12 }}>{event.id}</strong></td>
                  <td>{event.type}</td>
                  <td><span className={`priority-badge ${pBadgeClass}`}>{event.priority}</span></td>
                  <td className="mono" style={{ color: confColor, fontWeight: 600 }}>
                    {confPct != null ? `${confPct}%` : '—'}
                  </td>
                  <td><span className={`decision-badge ${decBadgeClass}`}>{event.decision}</span></td>
                  <td className="text-muted" style={{ fontSize: 11, textTransform: 'capitalize' }}>{event.region || '—'}</td>
                  <td className="mono">{event.time}</td>
                  <td>{statusNode}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
