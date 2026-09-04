import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export function ChartsSection({ history, isSpikeActive, theme }) {
  const trafficCanvasRef = useRef(null);
  const latencyCanvasRef = useRef(null);
  const trafficChartRef = useRef(null);
  const latencyChartRef = useRef(null);

  const isDark = theme === 'dark';
  const gridLine = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tipBg = isDark ? '#0f172a' : '#ffffff';
  const tipBorder = isDark ? '#334155' : '#cbd5e1';
  const tipTitle = isDark ? '#f8fafc' : '#0f172a';
  const tipBody = isDark ? '#94a3b8' : '#475569';
  const chartFont = { family: "'JetBrains Mono', monospace", size: 10 };

  // Initialize Traffic Chart
  useEffect(() => {
    if (!trafficCanvasRef.current) return;
    const ctx = trafficCanvasRef.current.getContext('2d');

    trafficChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.labels,
        datasets: [
          {
            label: 'Incoming (events/s)',
            data: history.incoming,
            borderColor: '#ea580c',
            backgroundColor: 'rgba(234, 88, 12, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0
          },
          {
            label: 'Processed (events/s)',
            data: history.processed,
            borderColor: '#0d9488',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0
          },
          {
            label: 'Capacity (events/s)',
            data: history.capacity,
            borderColor: '#64748b',
            borderDash: [4, 4],
            borderWidth: 1.5,
            tension: 0.2,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: {
            grid: { color: gridLine },
            ticks: { color: tickColor, font: chartFont, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: gridLine },
            ticks: { color: tickColor, font: chartFont },
            suggestedMin: 0,
            suggestedMax: 360
          }
        },
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
      trafficChartRef.current?.destroy();
    };
  }, []);

  // Initialize Latency Chart
  useEffect(() => {
    if (!latencyCanvasRef.current) return;
    const ctx = latencyCanvasRef.current.getContext('2d');

    latencyChartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.labels,
        datasets: [
          {
            label: 'Critical (P95 ms)',
            data: history.latencyCritical,
            borderColor: '#059669',
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Medium (P95 ms)',
            data: history.latencyMedium,
            borderColor: '#ea580c',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0
          },
          {
            label: 'Low (P95 ms)',
            data: history.latencyLow,
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.06)',
            fill: true,
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            grid: { color: gridLine },
            ticks: { color: tickColor, font: chartFont, maxTicksLimit: 8 }
          },
          y: {
            grid: { color: gridLine },
            ticks: { color: tickColor, font: chartFont },
            suggestedMin: 0,
            suggestedMax: 1000
          }
        },
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
      latencyChartRef.current?.destroy();
    };
  }, []);

  // Update Charts on state / theme changes
  useEffect(() => {
    if (trafficChartRef.current) {
      trafficChartRef.current.data.labels = history.labels;
      trafficChartRef.current.data.datasets[0].data = history.incoming;
      trafficChartRef.current.data.datasets[1].data = history.processed;
      trafficChartRef.current.data.datasets[2].data = history.capacity;

      trafficChartRef.current.options.scales.x.grid.color = gridLine;
      trafficChartRef.current.options.scales.x.ticks.color = tickColor;
      trafficChartRef.current.options.scales.y.grid.color = gridLine;
      trafficChartRef.current.options.scales.y.ticks.color = tickColor;
      trafficChartRef.current.options.plugins.tooltip.backgroundColor = tipBg;
      trafficChartRef.current.options.plugins.tooltip.borderColor = tipBorder;
      trafficChartRef.current.options.plugins.tooltip.titleColor = tipTitle;
      trafficChartRef.current.options.plugins.tooltip.bodyColor = tipBody;

      trafficChartRef.current.update('none');
    }

    if (latencyChartRef.current) {
      latencyChartRef.current.data.labels = history.labels;
      latencyChartRef.current.data.datasets[0].data = history.latencyCritical;
      latencyChartRef.current.data.datasets[1].data = history.latencyMedium;
      latencyChartRef.current.data.datasets[2].data = history.latencyLow;

      latencyChartRef.current.options.scales.x.grid.color = gridLine;
      latencyChartRef.current.options.scales.x.ticks.color = tickColor;
      latencyChartRef.current.options.scales.y.grid.color = gridLine;
      latencyChartRef.current.options.scales.y.ticks.color = tickColor;
      latencyChartRef.current.options.plugins.tooltip.backgroundColor = tipBg;
      latencyChartRef.current.options.plugins.tooltip.borderColor = tipBorder;
      latencyChartRef.current.options.plugins.tooltip.titleColor = tipTitle;
      latencyChartRef.current.options.plugins.tooltip.bodyColor = tipBody;

      latencyChartRef.current.update('none');
    }
  }, [history, theme, gridLine, tickColor, tipBg, tipBorder, tipTitle, tipBody]);

  return (
    <section className="charts-grid">
      {/* CHART 1: TRAFFIC VS CAPACITY */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <div className="chart-title">Traffic vs Processing Capacity</div>
            <div className="chart-desc">Real-time incoming ingress vs worker capacity & adaptive scaling</div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ea580c' }}></span>
              <span>Incoming</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#0d9488' }}></span>
              <span>Processed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#64748b' }}></span>
              <span>Capacity</span>
            </div>
          </div>
        </div>

        <div className="chart-container-inner">
          <div className={`chart-marker-badge ${isSpikeActive ? 'visible' : ''}`}>
            FLASH SALE: 20× TRAFFIC SPIKE
          </div>
          <canvas ref={trafficCanvasRef}></canvas>
        </div>
      </div>

      {/* CHART 2: END-TO-END LATENCY BY PRIORITY */}
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <div className="chart-title">End-to-End Latency by Priority</div>
            <div className="chart-desc">Demonstrating critical SLA isolation while low-priority absorbs delay</div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#059669' }}></span>
              <span>Critical (P95)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#ea580c' }}></span>
              <span>Medium (P95)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#dc2626' }}></span>
              <span>Low (P95)</span>
            </div>
          </div>
        </div>

        <div className="chart-container-inner">
          <canvas ref={latencyCanvasRef}></canvas>
        </div>
      </div>
    </section>
  );
}
