import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export function EventDistribution({ eventsByType, totalProcessed, theme }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const isDark = theme === 'dark';
  const tipBg = isDark ? '#0f172a' : '#ffffff';
  const tipBorder = isDark ? '#334155' : '#cbd5e1';
  const tipTitle = isDark ? '#f8fafc' : '#0f172a';
  const tipBody = isDark ? '#94a3b8' : '#475569';
  const chartFont = { family: "'JetBrains Mono', monospace", size: 10 };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Payment', 'Order', 'Inventory', 'Clicks', 'Logs'],
        datasets: [{
          data: [12, 8, 18, 38, 24],
          backgroundColor: ['#059669', '#10b981', '#ea580c', '#0284c7', '#64748b'],
          borderColor: isDark ? '#0e131f' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tipBg,
            borderColor: tipBorder,
            borderWidth: 1,
            titleColor: tipTitle,
            bodyColor: tipBody,
            bodyFont: chartFont
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.datasets[0].borderColor = isDark ? '#0e131f' : '#ffffff';
      chartRef.current.options.plugins.tooltip.backgroundColor = tipBg;
      chartRef.current.options.plugins.tooltip.borderColor = tipBorder;
      chartRef.current.options.plugins.tooltip.titleColor = tipTitle;
      chartRef.current.options.plugins.tooltip.bodyColor = tipBody;
      chartRef.current.update('none');
    }
  }, [theme, isDark, tipBg, tipBorder, tipTitle, tipBody]);

  return (
    <div className="distribution-card">
      <div>
        <div className="card-label" style={{ marginBottom: 4 }}>Ingestion Breakdown</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          Event Volume & Strategy
        </div>
      </div>

      <div className="donut-layout">
        <div className="donut-canvas-wrap">
          <canvas ref={canvasRef}></canvas>
        </div>

        <div className="strategy-breakdown-list">
          <div className="strategy-item">
            <div className="strategy-item-name">
              <span className="legend-dot" style={{ background: '#059669' }}></span>
              <span>Payments (12%)</span>
            </div>
            <span className="strategy-item-val text-emerald">{eventsByType.Payment.toLocaleString()}</span>
          </div>
          <div className="strategy-item">
            <div className="strategy-item-name">
              <span className="legend-dot" style={{ background: '#10b981' }}></span>
              <span>Orders (8%)</span>
            </div>
            <span className="strategy-item-val text-emerald">{eventsByType.Order.toLocaleString()}</span>
          </div>
          <div className="strategy-item">
            <div className="strategy-item-name">
              <span className="legend-dot" style={{ background: '#ea580c' }}></span>
              <span>Inventory (18%)</span>
            </div>
            <span className="strategy-item-val text-orange">{eventsByType.Inventory.toLocaleString()}</span>
          </div>
          <div className="strategy-item">
            <div className="strategy-item-name">
              <span className="legend-dot" style={{ background: '#0284c7' }}></span>
              <span>Clicks (38%)</span>
            </div>
            <span className="strategy-item-val text-cyan">{eventsByType.Clicks.toLocaleString()}</span>
          </div>
          <div className="strategy-item">
            <div className="strategy-item-name">
              <span className="legend-dot" style={{ background: '#64748b' }}></span>
              <span>Logs (24%)</span>
            </div>
            <span className="strategy-item-val text-muted">{eventsByType.Logs.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
        <span className="text-muted">Total Events Processed:</span>
        <span className="mono text-orange" style={{ fontWeight: 700 }}>
          {totalProcessed.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
