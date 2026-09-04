import { PipelineSimulator } from './simulator.js';

// DOM Element References
const el = {
  headerHealth: document.getElementById('headerHealthStatus'),
  headerMode: document.getElementById('headerModeBadge'),
  headerTrafficRate: document.getElementById('headerTrafficRate'),
  btnSpike: document.getElementById('btnSpike'),
  spikeBtnText: document.getElementById('spikeBtnText'),
  btnReset: document.getElementById('btnReset'),
  btnPause: document.getElementById('btnPause'),
  pauseBtnText: document.getElementById('pauseBtnText'),
  btnSound: document.getElementById('btnSound'),
  soundSvg: document.getElementById('soundSvg'),

  // Theme elements
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeBtnText: document.getElementById('themeBtnText'),

  // Banner
  systemBanner: document.getElementById('systemBanner'),
  bannerDot: document.getElementById('bannerDot'),
  bannerTitle: document.getElementById('bannerTitle'),
  bannerDesc: document.getElementById('bannerDesc'),
  stepNormal: document.getElementById('stepNormal'),
  stepPressure: document.getElementById('stepPressure'),
  stepOverload: document.getElementById('stepOverload'),
  stepExtreme: document.getElementById('stepExtreme'),

  // KPI Cards
  kpiIncomingRate: document.getElementById('kpiIncomingRate'),
  kpiIncomingTrend: document.getElementById('kpiIncomingTrend'),
  kpiTargetRate: document.getElementById('kpiTargetRate'),
  kpiProcessedRate: document.getElementById('kpiProcessedRate'),
  kpiCapacityMax: document.getElementById('kpiCapacityMax'),
  kpiCritP95: document.getElementById('kpiCritP95'),
  kpiCritP50: document.getElementById('kpiCritP50'),
  kpiQueueDepth: document.getElementById('kpiQueueDepth'),
  kpiQueueUtil: document.getElementById('kpiQueueUtil'),
  kpiQueueCritSub: document.getElementById('kpiQueueCritSub'),
  kpiEventsBatched: document.getElementById('kpiEventsBatched'),
  kpiBatchEfficiency: document.getElementById('kpiBatchEfficiency'),
  kpiActiveBatches: document.getElementById('kpiActiveBatches'),
  kpiEventsShed: document.getElementById('kpiEventsShed'),

  // Protection Panel
  protPaymentsDropped: document.getElementById('protPaymentsDropped'),
  protOrdersDropped: document.getElementById('protOrdersDropped'),
  protClicksShed: document.getElementById('protClicksShed'),
  protLogsShed: document.getElementById('protLogsShed'),

  // Priority Queues
  qCritStatus: document.getElementById('qCritStatus'),
  qCritSize: document.getElementById('qCritSize'),
  qCritRate: document.getElementById('qCritRate'),
  qCritP95: document.getElementById('qCritP95'),
  qCritBufferPct: document.getElementById('qCritBufferPct'),
  qCritBufferFill: document.getElementById('qCritBufferFill'),

  qMedStatus: document.getElementById('qMedStatus'),
  qMedSize: document.getElementById('qMedSize'),
  qMedRate: document.getElementById('qMedRate'),
  qMedP95: document.getElementById('qMedP95'),
  qMedBufferPct: document.getElementById('qMedBufferPct'),
  qMedBufferFill: document.getElementById('qMedBufferFill'),

  qLowStatus: document.getElementById('qLowStatus'),
  qLowSize: document.getElementById('qLowSize'),
  qLowRate: document.getElementById('qLowRate'),
  qLowP95: document.getElementById('qLowP95'),
  qLowBufferPct: document.getElementById('qLowBufferPct'),
  qLowBufferFill: document.getElementById('qLowBufferFill'),

  // Middle panel elements
  ruleMediumBadge: document.getElementById('ruleMediumBadge'),
  ruleLowBadge: document.getElementById('ruleLowBadge'),
  gaugeWorkersVal: document.getElementById('gaugeWorkersVal'),
  gaugeWorkersFill: document.getElementById('gaugeWorkersFill'),
  gaugePressureVal: document.getElementById('gaugePressureVal'),
  gaugePressureFill: document.getElementById('gaugePressureFill'),

  distPaymentCount: document.getElementById('distPaymentCount'),
  distOrderCount: document.getElementById('distOrderCount'),
  distInventoryCount: document.getElementById('distInventoryCount'),
  distClickCount: document.getElementById('distClickCount'),
  distLogCount: document.getElementById('distLogCount'),
  distTotalProcessed: document.getElementById('distTotalProcessed'),

  batchPanelSize: document.getElementById('batchPanelSize'),
  batchPanelActive: document.getElementById('batchPanelActive'),
  batchPanelAvg: document.getElementById('batchPanelAvg'),
  batchPanelEfficiency: document.getElementById('batchPanelEfficiency'),
  conveyorLabel: document.getElementById('conveyorLabel'),

  chartSpikeBadge: document.getElementById('chartSpikeBadge'),
  liveEventsBody: document.getElementById('liveEventsBody'),

  // Comparison
  naiveCritP95: document.getElementById('naiveCritP95'),
  naiveCritDropped: document.getElementById('naiveCritDropped'),
  naiveQueueDepth: document.getElementById('naiveQueueDepth'),
  naiveThroughput: document.getElementById('naiveThroughput'),
  adaptCritP95: document.getElementById('adaptCritP95'),
  adaptCritDropped: document.getElementById('adaptCritDropped'),
  adaptQueueDepth: document.getElementById('adaptQueueDepth'),
  adaptThroughput: document.getElementById('adaptThroughput')
};

// Initialize Simulator
const sim = new PipelineSimulator();

// ================= THEME CONTROLLER =================
let currentTheme = localStorage.getItem('pipeline-theme') || 'light';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('pipeline-theme', theme);

  if (theme === 'dark') {
    el.themeBtnText.textContent = 'Light';
    // Sun icon
    el.themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    updateChartTheme(true);
  } else {
    el.themeBtnText.textContent = 'Dark';
    // Moon icon
    el.themeIcon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    updateChartTheme(false);
  }
}

el.btnThemeToggle.addEventListener('click', () => {
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
});

// Audio FX synthesizer (Web Audio API)
let audioCtx = null;
let soundEnabled = false;

function playTone(freq, duration, type = 'sine') {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // audio context blocked
  }
}

// Global Filter state for live event log
let currentFilter = 'all';

// Setup Chart.js
const chartFont = { family: "'JetBrains Mono', monospace", size: 10 };

// 1. Traffic vs Capacity Chart
const trafficCtx = document.getElementById('trafficChart').getContext('2d');
const trafficChart = new Chart(trafficCtx, {
  type: 'line',
  data: {
    labels: sim.history.labels,
    datasets: [
      {
        label: 'Incoming (events/s)',
        data: sim.history.incoming,
        borderColor: '#ea580c',
        backgroundColor: 'rgba(234, 88, 12, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0
      },
      {
        label: 'Processed (events/s)',
        data: sim.history.processed,
        borderColor: '#0d9488',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0
      },
      {
        label: 'Capacity (events/s)',
        data: sim.history.capacity,
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
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b', font: chartFont, maxTicksLimit: 8 }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b', font: chartFont },
        suggestedMin: 0,
        suggestedMax: 360
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        titleColor: '#0f172a',
        bodyColor: '#475569',
        bodyFont: chartFont
      }
    }
  }
});

// 2. Latency by Priority Chart
const latencyCtx = document.getElementById('latencyChart').getContext('2d');
const latencyChart = new Chart(latencyCtx, {
  type: 'line',
  data: {
    labels: sim.history.labels,
    datasets: [
      {
        label: 'Critical (P95 ms)',
        data: sim.history.latencyCritical,
        borderColor: '#059669',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Medium (P95 ms)',
        data: sim.history.latencyMedium,
        borderColor: '#ea580c',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0
      },
      {
        label: 'Low (P95 ms)',
        data: sim.history.latencyLow,
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
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b', font: chartFont, maxTicksLimit: 8 }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#64748b', font: chartFont },
        suggestedMin: 0,
        suggestedMax: 1000
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        titleColor: '#0f172a',
        bodyColor: '#475569',
        bodyFont: chartFont
      }
    }
  }
});

// 3. Event Breakdown Donut Chart
const donutCtx = document.getElementById('eventDonutChart').getContext('2d');
const donutChart = new Chart(donutCtx, {
  type: 'doughnut',
  data: {
    labels: ['Payment', 'Order', 'Inventory', 'Clicks', 'Logs'],
    datasets: [{
      data: [12, 8, 18, 38, 24],
      backgroundColor: ['#059669', '#10b981', '#ea580c', '#0284c7', '#64748b'],
      borderColor: '#ffffff',
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
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        titleColor: '#0f172a',
        bodyColor: '#475569',
        bodyFont: chartFont
      }
    }
  }
});

// Update Chart styling for Light vs Dark
function updateChartTheme(isDark) {
  const gridLine = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tipBg = isDark ? '#0f172a' : '#ffffff';
  const tipBorder = isDark ? '#334155' : '#cbd5e1';
  const tipTitle = isDark ? '#f8fafc' : '#0f172a';
  const tipBody = isDark ? '#94a3b8' : '#475569';

  [trafficChart, latencyChart].forEach(chart => {
    chart.options.scales.x.grid.color = gridLine;
    chart.options.scales.x.ticks.color = tickColor;
    chart.options.scales.y.grid.color = gridLine;
    chart.options.scales.y.ticks.color = tickColor;
    chart.options.plugins.tooltip.backgroundColor = tipBg;
    chart.options.plugins.tooltip.borderColor = tipBorder;
    chart.options.plugins.tooltip.titleColor = tipTitle;
    chart.options.plugins.tooltip.bodyColor = tipBody;
  });

  donutChart.data.datasets[0].borderColor = isDark ? '#0e131f' : '#ffffff';
  donutChart.options.plugins.tooltip.backgroundColor = tipBg;
  donutChart.options.plugins.tooltip.borderColor = tipBorder;
  donutChart.options.plugins.tooltip.titleColor = tipTitle;
  donutChart.options.plugins.tooltip.bodyColor = tipBody;

  trafficChart.update('none');
  latencyChart.update('none');
  donutChart.update('none');
}

// Update UI view from Simulator State
function updateUI() {
  // Header values
  const totalEventsMin = Math.round(sim.actualIncomingRate * 60).toLocaleString();
  el.headerTrafficRate.textContent = `${totalEventsMin} events/min`;
  el.headerMode.textContent = sim.systemMode;
  el.headerMode.className = `badge-mode mode-${sim.systemMode.toLowerCase()}`;

  // Mode Banner
  el.systemBanner.className = `system-banner banner-${sim.systemMode.toLowerCase()}`;
  el.bannerTitle.textContent = `MODE: ${sim.systemMode}`;
  el.bannerDesc.textContent = sim.modeDescription;
  el.bannerDot.className = `banner-state-dot dot-${sim.systemMode.toLowerCase()}`;

  if (sim.systemMode === 'NORMAL') {
    el.bannerTitle.className = 'banner-state-title text-emerald';
  } else if (sim.systemMode === 'PRESSURE') {
    el.bannerTitle.className = 'banner-state-title text-orange';
  } else if (sim.systemMode === 'OVERLOAD') {
    el.bannerTitle.className = 'banner-state-title';
    el.bannerTitle.style.color = '#c2410c';
  } else {
    el.bannerTitle.className = 'banner-state-title text-rose';
  }

  // Active step ladder
  el.stepNormal.className = `step-node ${sim.systemMode === 'NORMAL' ? 'active-step active-normal' : ''}`;
  el.stepPressure.className = `step-node ${sim.systemMode === 'PRESSURE' ? 'active-step active-pressure' : ''}`;
  el.stepOverload.className = `step-node ${sim.systemMode === 'OVERLOAD' ? 'active-step active-overload' : ''}`;
  el.stepExtreme.className = `step-node ${sim.systemMode === 'EXTREME' ? 'active-step active-extreme' : ''}`;

  // KPI Cards
  el.kpiIncomingRate.textContent = sim.actualIncomingRate.toFixed(1);
  if (sim.isSpikeActive) {
    el.kpiIncomingTrend.textContent = '20× FLASH SPIKE';
    el.kpiIncomingTrend.className = 'trend-badge trend-spike';
  } else {
    el.kpiIncomingTrend.textContent = 'Baseline 1k/min';
    el.kpiIncomingTrend.className = 'trend-badge trend-neutral';
  }
  el.kpiTargetRate.textContent = `Target: ${sim.targetRate.toFixed(1)}/s`;

  el.kpiProcessedRate.textContent = sim.processedRate.toFixed(1);
  el.kpiCapacityMax.textContent = `Cap: ${Math.round(sim.processingCapacity)}/s`;

  el.kpiCritP95.textContent = sim.queues.critical.p95;
  el.kpiCritP50.textContent = `P50: ${sim.queues.critical.p50}ms`;

  el.kpiQueueDepth.textContent = sim.totalQueueDepth.toLocaleString();
  el.kpiQueueUtil.textContent = `Util: ${sim.stats.queueUtilization}%`;
  el.kpiQueueCritSub.textContent = `Crit: ${sim.queues.critical.depth}`;

  el.kpiEventsBatched.textContent = sim.stats.totalBatched.toLocaleString();
  el.kpiBatchEfficiency.textContent = `Ratio: ${sim.stats.batchEfficiency}`;
  el.kpiActiveBatches.textContent = `${sim.stats.activeBatches} active`;

  el.kpiEventsShed.textContent = sim.stats.totalShed.toLocaleString();

  // Protection Panel
  el.protPaymentsDropped.textContent = sim.stats.paymentsDropped;
  el.protOrdersDropped.textContent = sim.stats.ordersDropped;
  el.protClicksShed.textContent = sim.stats.clicksShed.toLocaleString();
  el.protLogsShed.textContent = sim.stats.logsShed.toLocaleString();

  // Priority Queues
  // Critical
  el.qCritSize.textContent = sim.queues.critical.depth;
  el.qCritRate.textContent = sim.queues.critical.rate.toFixed(1) + '/s';
  el.qCritP95.textContent = sim.queues.critical.p95 + 'ms';
  const critBufPct = Math.min(100, Math.round((sim.queues.critical.depth / sim.queues.critical.maxSafe) * 100));
  el.qCritBufferPct.textContent = `${critBufPct}%`;
  el.qCritBufferFill.style.width = `${Math.max(4, critBufPct)}%`;

  // Medium
  el.qMedStatus.textContent = sim.queues.medium.status;
  el.qMedStatus.className = `queue-status-pill ${sim.queues.medium.status === 'STREAMING' ? 'status-streaming' : 'status-batching'}`;
  el.qMedSize.textContent = sim.queues.medium.depth;
  el.qMedRate.textContent = sim.queues.medium.rate.toFixed(1) + '/s';
  el.qMedP95.textContent = sim.queues.medium.p95 + 'ms';
  const medBufPct = Math.min(100, Math.round((sim.queues.medium.depth / sim.queues.medium.maxSafe) * 100));
  el.qMedBufferPct.textContent = `${medBufPct}%`;
  el.qMedBufferFill.style.width = `${Math.max(3, medBufPct)}%`;

  // Low
  el.qLowStatus.textContent = sim.queues.low.status;
  let lowClass = 'status-streaming';
  if (sim.queues.low.status === 'BATCHING') lowClass = 'status-batching';
  if (sim.queues.low.status === 'DEFERRED') lowClass = 'status-deferred';
  if (sim.queues.low.status === 'SHEDDING') lowClass = 'status-shedding';
  el.qLowStatus.className = `queue-status-pill ${lowClass}`;
  
  el.qLowSize.textContent = sim.queues.low.depth;
  el.qLowRate.textContent = sim.queues.low.rate.toFixed(1) + '/s';
  el.qLowP95.textContent = sim.queues.low.p95 + 'ms';
  const lowBufPct = Math.min(100, Math.round((sim.queues.low.depth / sim.queues.low.maxSafe) * 100));
  el.qLowBufferPct.textContent = `${lowBufPct}%`;
  el.qLowBufferFill.style.width = `${Math.max(2, lowBufPct)}%`;
  if (sim.queues.low.status === 'SHEDDING') {
    el.qLowBufferFill.className = 'queue-buffer-fill fill-low shedding';
  } else {
    el.qLowBufferFill.className = 'queue-buffer-fill fill-low';
  }

  // Middle Strategy Policies
  if (sim.systemMode === 'NORMAL') {
    el.ruleMediumBadge.textContent = 'STREAM';
    el.ruleMediumBadge.className = 'strategy-rule-badge rule-stream';
    el.ruleLowBadge.textContent = 'STREAM';
    el.ruleLowBadge.className = 'strategy-rule-badge rule-stream';
  } else if (sim.systemMode === 'PRESSURE') {
    el.ruleMediumBadge.textContent = 'STREAM';
    el.ruleMediumBadge.className = 'strategy-rule-badge rule-stream';
    el.ruleLowBadge.textContent = 'BATCH (250ms)';
    el.ruleLowBadge.className = 'strategy-rule-badge rule-batch';
  } else if (sim.systemMode === 'OVERLOAD') {
    el.ruleMediumBadge.textContent = 'BATCH (100ms)';
    el.ruleMediumBadge.className = 'strategy-rule-badge rule-batch';
    el.ruleLowBadge.textContent = 'DEFER (1.5s)';
    el.ruleLowBadge.className = 'strategy-rule-badge rule-batch';
  } else {
    el.ruleMediumBadge.textContent = 'MICRO-BATCH (80)';
    el.ruleMediumBadge.className = 'strategy-rule-badge rule-batch';
    el.ruleLowBadge.textContent = 'SHED 68% LOGS';
    el.ruleLowBadge.className = 'strategy-rule-badge rule-defer-shed';
  }

  // Gauges
  el.gaugeWorkersVal.textContent = `${sim.stats.workerUtilization}%`;
  el.gaugeWorkersFill.style.width = `${sim.stats.workerUtilization}%`;
  el.gaugePressureVal.textContent = `${sim.stats.queueUtilization}%`;
  el.gaugePressureFill.style.width = `${sim.stats.queueUtilization}%`;

  // Distribution
  el.distPaymentCount.textContent = sim.stats.eventsByType.Payment.toLocaleString();
  el.distOrderCount.textContent = sim.stats.eventsByType.Order.toLocaleString();
  el.distInventoryCount.textContent = sim.stats.eventsByType.Inventory.toLocaleString();
  el.distClickCount.textContent = sim.stats.eventsByType.Clicks.toLocaleString();
  el.distLogCount.textContent = sim.stats.eventsByType.Logs.toLocaleString();
  el.distTotalProcessed.textContent = sim.stats.totalProcessed.toLocaleString();

  // Batch Panel
  el.batchPanelSize.textContent = sim.stats.batchSize;
  el.batchPanelActive.textContent = sim.stats.activeBatches;
  el.batchPanelAvg.textContent = sim.stats.avgBatchSize;
  el.batchPanelEfficiency.textContent = sim.stats.batchEfficiency;
  el.conveyorLabel.textContent = sim.isSpikeActive ? 'Active Micro-batches' : 'Individual Streams';

  // Animate conveyor chunks
  const conveyorChunks = document.querySelectorAll('.conveyor-chunk');
  conveyorChunks.forEach((chunk, idx) => {
    if (idx < sim.stats.activeBatches) {
      chunk.classList.add('packed');
    } else {
      chunk.classList.remove('packed');
    }
  });

  // Chart Spike Marker
  if (sim.isSpikeActive) {
    el.chartSpikeBadge.className = 'chart-marker-badge visible';
  } else {
    el.chartSpikeBadge.className = 'chart-marker-badge';
  }

  // Update Charts
  trafficChart.data.labels = sim.history.labels;
  trafficChart.data.datasets[0].data = sim.history.incoming;
  trafficChart.data.datasets[1].data = sim.history.processed;
  trafficChart.data.datasets[2].data = sim.history.capacity;
  trafficChart.update('none');

  latencyChart.data.labels = sim.history.labels;
  latencyChart.data.datasets[0].data = sim.history.latencyCritical;
  latencyChart.data.datasets[1].data = sim.history.latencyMedium;
  latencyChart.data.datasets[2].data = sim.history.latencyLow;
  latencyChart.update('none');

  // Naive comparison panel
  el.naiveCritP95.textContent = `${sim.naive.criticalP95.toLocaleString()} ms`;
  el.naiveCritDropped.textContent = `${sim.naive.criticalDropped.toLocaleString()} (Order Loss)`;
  el.naiveQueueDepth.textContent = `${sim.naive.queueDepth.toLocaleString()} queued (Overflow)`;
  el.naiveThroughput.textContent = `${Math.round(sim.naive.throughput)} events/s (Throttled)`;

  el.adaptCritP95.textContent = `${sim.queues.critical.p95} ms (Protected)`;
  el.adaptCritDropped.textContent = `0 (Strict SLA)`;
  el.adaptQueueDepth.textContent = `< ${sim.queues.critical.depth + 4} critical items`;
  el.adaptThroughput.textContent = `${Math.round(sim.processedRate)} events/s (Scaled)`;

  // Render live event table
  renderLiveEvents();
}

function renderLiveEvents() {
  const filtered = sim.liveEvents.filter(event => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'CRITICAL') return event.priority === 'CRITICAL';
    if (currentFilter === 'BATCH') return event.decision === 'BATCH';
    if (currentFilter === 'SHED') return event.decision === 'SHED';
    return true;
  });

  const rowsHtml = filtered.slice(0, 15).map(event => {
    let pBadgeClass = 'p-low';
    if (event.priority === 'CRITICAL') pBadgeClass = 'p-critical';
    if (event.priority === 'MEDIUM') pBadgeClass = 'p-medium';

    let decBadgeClass = 'dec-stream';
    if (event.decision === 'BATCH') decBadgeClass = 'dec-batch';
    if (event.decision === 'DEFER') decBadgeClass = 'dec-defer';
    if (event.decision === 'SHED') decBadgeClass = 'dec-shed';

    let statusHtml = `<span class="status-cell st-success"><span class="status-cell-dot"></span>SUCCESS</span>`;
    if (event.status === 'BATCHED') statusHtml = `<span class="status-cell st-batched"><span class="status-cell-dot"></span>BATCHED</span>`;
    if (event.status === 'DEFERRED') statusHtml = `<span class="status-cell st-deferred"><span class="status-cell-dot"></span>DEFERRED</span>`;
    if (event.status === 'SHED') statusHtml = `<span class="status-cell st-shed"><span class="status-cell-dot"></span>SHED</span>`;

    const isCritRow = event.priority === 'CRITICAL' ? 'row-critical' : '';

    return `
      <tr class="${isCritRow}">
        <td class="text-muted">${event.timestamp}</td>
        <td><strong>${event.id}</strong></td>
        <td>${event.type}</td>
        <td><span class="priority-badge ${pBadgeClass}">${event.priority}</span></td>
        <td><span class="decision-badge ${decBadgeClass}">${event.decision}</span></td>
        <td class="mono">${event.time}</td>
        <td>${statusHtml}</td>
      </tr>
    `;
  }).join('');

  el.liveEventsBody.innerHTML = rowsHtml;
}

// Event Listeners

// 20x Spike Button
function toggleSpike() {
  const newSpikeState = !sim.isSpikeActive;
  sim.setSpike(newSpikeState);

  if (newSpikeState) {
    el.btnSpike.classList.add('active-spike');
    el.spikeBtnText.textContent = 'NORMALIZE TRAFFIC (1k/min)';
    playTone(520, 0.3, 'sine');
  } else {
    el.btnSpike.classList.remove('active-spike');
    el.spikeBtnText.textContent = 'TRIGGER 20× SPIKE';
    playTone(330, 0.2, 'sine');
  }
}

el.btnSpike.addEventListener('click', toggleSpike);

// Reset Button
el.btnReset.addEventListener('click', () => {
  sim.reset();
  el.btnSpike.classList.remove('active-spike');
  el.spikeBtnText.textContent = 'TRIGGER 20× SPIKE';
  el.btnPause.classList.remove('active');
  el.pauseBtnText.textContent = 'Pause';
  playTone(440, 0.15, 'sine');
  updateUI();
});

// Pause Button
el.btnPause.addEventListener('click', () => {
  const paused = sim.togglePause();
  el.pauseBtnText.textContent = paused ? 'Resume' : 'Pause';
  if (paused) {
    el.btnPause.style.borderColor = '#ea580c';
  } else {
    el.btnPause.style.borderColor = '';
  }
});

// Audio FX Toggle
el.btnSound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    el.soundSvg.innerHTML = `
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    `;
    el.btnSound.style.color = '#ea580c';
    playTone(660, 0.1, 'sine');
  } else {
    el.soundSvg.innerHTML = `
      <line x1="1" y1="1" x2="23" y2="23"></line>
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    `;
    el.btnSound.style.color = '';
  }
});

// Filter Chips
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.getAttribute('data-filter');
    renderLiveEvents();
  });
});

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    toggleSpike();
  } else if (e.code === 'KeyT') {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  } else if (e.code === 'KeyP') {
    el.btnPause.click();
  } else if (e.code === 'KeyR') {
    el.btnReset.click();
  }
});

// Initialize Theme on startup
applyTheme(currentTheme);

// Simulation Loop (runs every 1000ms)
setInterval(() => {
  sim.tick(1.0);
  updateUI();
  if (sim.isSpikeActive && Math.random() < 0.25) {
    playTone(280, 0.04, 'triangle');
  }
}, 1000);

// Initial UI Render
updateUI();
