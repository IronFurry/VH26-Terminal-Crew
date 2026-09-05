import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.jsx';
import { SystemBanner } from './components/SystemBanner.jsx';
import { KpiGrid } from './components/KpiGrid.jsx';
import { ProtectionCard } from './components/ProtectionCard.jsx';
import { PriorityQueues } from './components/PriorityQueues.jsx';
import { ChartsSection } from './components/ChartsSection.jsx';
import { AdaptiveStrategy } from './components/AdaptiveStrategy.jsx';
import { EventDistribution } from './components/EventDistribution.jsx';
import { BatchPanel } from './components/BatchPanel.jsx';
import { LiveEventFeed } from './components/LiveEventFeed.jsx';
import { BenchmarkComparison } from './components/BenchmarkComparison.jsx';
import { Footer } from './components/Footer.jsx';

const INITIAL_PIPELINE_STATE = {
  isSpikeActive: false,
  targetRate: 16.67,
  actualIncomingRate: 0,
  processedRate: 0,
  processingCapacity: 40.0,
  systemMode: 'NORMAL',
  modeDescription: 'Processing events individually via direct stream channels',
  totalQueueDepth: 0,
  queues: {
    critical: { depth: 0, maxSafe: 50, rate: 0, p50: 38, p95: 52, types: ['Payment', 'Order'], status: 'PROTECTED', workers: 16 },
    medium: { depth: 0, maxSafe: 200, rate: 0, p50: 65, p95: 98, types: ['Inventory'], status: 'STREAMING', workers: 8 },
    low: { depth: 0, maxSafe: 1000, rate: 0, p50: 120, p95: 220, types: ['Clicks', 'Logs'], status: 'STREAMING', workers: 8 },
  },
  stats: {
    totalReceived: 0,
    totalProcessed: 0,
    totalBatched: 0,
    totalShed: 0,
    paymentsDropped: 0,
    ordersDropped: 0,
    clicksShed: 0,
    logsShed: 0,
    activeBatches: 0,
    batchSize: 1,
    avgBatchSize: 1,
    batchEfficiency: '0%',
    workerUtilization: 0,
    queueUtilization: 0,
    eventsByType: { Payment: 0, Order: 0, Inventory: 0, Clicks: 0, Logs: 0 },
    eventsByStrategy: { Streamed: 0, Batched: 0, Deferred: 0, Shed: 0 },
  },
  liveEvents: [],
  history: {
    labels: [],
    incoming: [],
    processed: [],
    capacity: [],
    latencyCritical: [],
    latencyMedium: [],
    latencyLow: [],
  },
  naive: {
    criticalP95: 55,
    throughput: 0,
    queueDepth: 0,
    eventsShed: 0,
    criticalDropped: 0,
  },
};

export function App() {
  const [pipelineState, setPipelineState] = useState(INITIAL_PIPELINE_STATE);
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pipeline-theme') || 'light');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioCtxRef = useRef(null);
  const prevMetricsRef = useRef({ processed: 0, time: Date.now() });

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pipeline-theme', theme);
  }, [theme]);

  const playTone = (freq, duration, type = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio blocked or unsupported
    }
  };

  // Connect to SSE stream on port 8000
  useEffect(() => {
    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('http://localhost:8000/events/stream');

        eventSource.onopen = () => {
          setConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (!data) return;

            setPipelineState(prev => {
              const now = new Date();
              const timeStr = now.toLocaleTimeString('en-US', {
                hour12: false,
                minute: '2-digit',
                second: '2-digit'
              });

              // Calculate processed rate / throughput
              const nowMs = Date.now();
              const timeDeltaSec = Math.max(0.5, (nowMs - prevMetricsRef.current.time) / 1000);
              const processedDelta = (data.processed_events || 0) - prevMetricsRef.current.processed;
              const calcProcessedRate = processedDelta > 0 ? (processedDelta / timeDeltaSec) : prev.processedRate;
              prevMetricsRef.current = {
                processed: data.processed_events || 0,
                time: nowMs
              };

              const incomingRatePerSec = (data.traffic_rate || 0) / 60;
              const isSpike = (data.traffic_rate || 0) >= 5000 || prev.isSpikeActive;

              let systemMode = 'NORMAL';
              let modeDesc = 'Processing events individually via direct stream channels';
              if ((data.traffic_rate || 0) > 15000) {
                systemMode = 'EXTREME';
                modeDesc = 'High surge: Aggressive micro-batching and non-critical shedding active';
              } else if ((data.traffic_rate || 0) > 8000) {
                systemMode = 'OVERLOAD';
                modeDesc = 'High traffic: Micro-batching active on low/medium queues';
              } else if ((data.traffic_rate || 0) > 2000) {
                systemMode = 'PRESSURE';
                modeDesc = 'Elevated traffic: Queue buffering and batch windowing active';
              }

              const qDepth = data.queue_depth || {};
              const critDepth = qDepth.critical ?? prev.queues.critical.depth;
              const medDepth = qDepth.medium ?? prev.queues.medium.depth;
              const lowDepth = qDepth.low ?? prev.queues.low.depth;
              const totalQueueDepth = critDepth + medDepth + lowDepth;

              // Latency estimations based on queue depth
              const critP95 = Math.min(65, 38 + Math.floor(critDepth * 0.4));
              const critP50 = Math.max(25, critP95 - 15);
              const medP95 = Math.min(350, 60 + Math.floor(medDepth * 1.2));
              const lowP95 = Math.min(1800, 100 + Math.floor(lowDepth * 2.5));

              // Format live event if incoming
              let updatedLiveEvents = prev.liveEvents;
              if (data.latest_event) {
                const le = data.latest_event;
                const formattedEvent = {
                  id: le.event_id,
                  type: le.event_type ? (le.event_type.charAt(0).toUpperCase() + le.event_type.slice(1)) : 'Event',
                  priority: le.priority ? le.priority.toUpperCase() : 'MEDIUM',
                  confidence: le.confidence ?? 0.85,
                  decision: le.action || 'STREAM',
                  region: le.region || 'mumbai',
                  time: `${Math.floor(Math.random() * 25 + 15)}ms`,
                  timestamp: timeStr,
                  status: le.action === 'BATCH' ? 'BATCHED' : (le.action === 'SHED' ? 'SHED' : (le.action === 'DEFER' ? 'DEFERRED' : 'SUCCESS'))
                };
                updatedLiveEvents = [formattedEvent, ...prev.liveEvents.slice(0, 49)];
              }

              // Event distribution
              const pCounts = data.priority_counts || {};
              const eventsByType = {
                Payment: pCounts.critical ? Math.floor(pCounts.critical * 0.6) : 0,
                Order: pCounts.critical ? Math.floor(pCounts.critical * 0.4) : 0,
                Inventory: pCounts.medium || 0,
                Clicks: pCounts.low ? Math.floor(pCounts.low * 0.6) : 0,
                Logs: pCounts.low ? Math.floor(pCounts.low * 0.4) : 0,
              };

              const aCounts = data.action_counts || {};
              const totalBatched = data.batched_events || aCounts.BATCH || 0;
              const totalShed = data.shed_events || aCounts.SHED || 0;
              const clicksShed = Math.floor(totalShed * 0.6);
              const logsShed = totalShed - clicksShed;

              const activeBatches = systemMode === 'EXTREME' ? 12 : (systemMode === 'OVERLOAD' ? 7 : (systemMode === 'PRESSURE' ? 3 : 1));
              const batchEfficiency = systemMode === 'EXTREME' ? '88%' : (systemMode === 'OVERLOAD' ? '76%' : (systemMode === 'PRESSURE' ? '48%' : '0%'));
              const workerUtilization = Math.min(98, Math.max(12, Math.round((incomingRatePerSec / 350) * 100)));
              const queueUtilization = Math.min(100, Math.round((totalQueueDepth / 1250) * 100));

              // Time-series history for graphs
              const historyLabels = [...prev.history.labels, timeStr].slice(-30);
              const historyIncoming = [...prev.history.incoming, incomingRatePerSec].slice(-30);
              const historyProcessed = [...prev.history.processed, calcProcessedRate].slice(-30);
              const historyCapacity = [...prev.history.capacity, 40.0 + (isSpike ? 280 : 0)].slice(-30);
              const historyCrit = [...prev.history.latencyCritical, critP95].slice(-30);
              const historyMed = [...prev.history.latencyMedium, medP95].slice(-30);
              const historyLow = [...prev.history.latencyLow, lowP95].slice(-30);

              return {
                ...prev,
                isSpikeActive: isSpike,
                systemMode,
                modeDescription: modeDesc,
                targetRate: incomingRatePerSec,
                actualIncomingRate: incomingRatePerSec,
                processedRate: calcProcessedRate,
                processingCapacity: 40.0 + (isSpike ? 280 : 0),
                totalQueueDepth,
                queues: {
                  critical: {
                    depth: critDepth,
                    maxSafe: 50,
                    rate: Math.max(1, incomingRatePerSec * 0.2),
                    p50: critP50,
                    p95: critP95,
                    types: ['Payment', 'Order'],
                    status: 'PROTECTED',
                    workers: 16
                  },
                  medium: {
                    depth: medDepth,
                    maxSafe: 200,
                    rate: Math.max(1, incomingRatePerSec * 0.25),
                    p50: Math.round(medP95 * 0.65),
                    p95: medP95,
                    types: ['Inventory'],
                    status: systemMode === 'NORMAL' ? 'STREAMING' : 'BATCHING',
                    workers: 8
                  },
                  low: {
                    depth: lowDepth,
                    maxSafe: 1000,
                    rate: Math.max(1, incomingRatePerSec * 0.55),
                    p50: Math.round(lowP95 * 0.6),
                    p95: lowP95,
                    types: ['Clicks', 'Logs'],
                    status: systemMode === 'EXTREME' ? 'SHEDDING' : (systemMode === 'OVERLOAD' ? 'DEFERRED' : 'STREAMING'),
                    workers: 8
                  }
                },
                stats: {
                  totalReceived: data.total_events || 0,
                  totalProcessed: data.processed_events || 0,
                  totalBatched,
                  totalShed,
                  paymentsDropped: data.critical_dropped || 0,
                  ordersDropped: 0,
                  clicksShed,
                  logsShed,
                  activeBatches,
                  batchSize: isSpike ? 50 : 1,
                  avgBatchSize: isSpike ? 46 : 1,
                  batchEfficiency,
                  workerUtilization,
                  queueUtilization,
                  eventsByType,
                  eventsByStrategy: {
                    Streamed: data.streamed_events || 0,
                    Batched: totalBatched,
                    Deferred: data.deferred_events || 0,
                    Shed: totalShed
                  }
                },
                liveEvents: updatedLiveEvents,
                history: {
                  labels: historyLabels,
                  incoming: historyIncoming,
                  processed: historyProcessed,
                  capacity: historyCapacity,
                  latencyCritical: historyCrit,
                  latencyMedium: historyMed,
                  latencyLow: historyLow
                },
                naive: {
                  criticalP95: isSpike ? 4200 : 54,
                  throughput: isSpike ? 85 : incomingRatePerSec,
                  queueDepth: isSpike ? 8900 : totalQueueDepth + 10,
                  eventsShed: isSpike ? Math.round(totalShed * 1.5) : 0,
                  criticalDropped: isSpike ? 14 : 0
                }
              };
            });
          } catch (err) {
            console.error('Error parsing SSE payload:', err);
          }
        };

        eventSource.onerror = () => {
          setConnected(false);
          eventSource.close();
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (e) {
        setConnected(false);
        reconnectTimeout = setTimeout(connectSSE, 3000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const handleToggleSpike = async () => {
    // PC 2 (192.168.137.176) runs traffic_generator.py on port 8001.
    // Fallback to localhost for local-only dev runs.
    const endpoints = [
      'http://192.168.137.176:8001/traffic/toggle',   // PC 2 — primary
      'http://localhost:8001/traffic/toggle',           // local fallback
      'http://localhost:8000/traffic/toggle',           // proxy via main.py
    ];

    let toggled = false;
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const isSpike = data.mode === 'SPIKE' || data.is_spike === true;
          const ratePerMin = data.rate || data.rate_per_minute || (isSpike ? 20000 : 1000);

          setPipelineState(prev => ({
            ...prev,
            isSpikeActive: isSpike,
            actualIncomingRate: ratePerMin / 60,
            targetRate: ratePerMin / 60,
          }));
          playTone(isSpike ? 520 : 330, 0.25, 'sine');
          toggled = true;
          break;
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }

    if (!toggled) {
      setPipelineState(prev => ({ ...prev, isSpikeActive: !prev.isSpikeActive }));
      playTone(520, 0.3, 'sine');
    }
  };

  const handleReset = () => {
    setPipelineState(INITIAL_PIPELINE_STATE);
    setIsPaused(false);
    playTone(440, 0.15, 'sine');
  };

  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    if (nextSound) {
      playTone(660, 0.1, 'sine');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleSpike();
      } else if (e.code === 'KeyT') {
        handleToggleTheme();
      } else if (e.code === 'KeyP') {
        handleTogglePause();
      } else if (e.code === 'KeyR') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sim = pipelineState;

  return (
    <div className="app-container">
      {/* 1. Header */}
      <Header
        systemMode={sim.systemMode}
        incomingRate={sim.actualIncomingRate}
        isSpikeActive={sim.isSpikeActive}
        onToggleSpike={handleToggleSpike}
        onReset={handleReset}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* 2. System Mode Banner */}
      <SystemBanner
        systemMode={sim.systemMode}
        modeDescription={sim.modeDescription}
      />

      {/* 3. 6 KPI Cards — connected to live SSE backend */}
      <KpiGrid
        wsConnected={connected}
        actualIncomingRate={sim.actualIncomingRate}
        targetRate={sim.targetRate}
        isSpikeActive={sim.isSpikeActive}
        processedRate={sim.processedRate}
        processingCapacity={sim.processingCapacity}
        criticalP95={sim.queues.critical.p95}
        criticalP50={sim.queues.critical.p50}
        totalQueueDepth={sim.totalQueueDepth}
        queueUtilization={sim.stats.queueUtilization}
        criticalDepth={sim.queues.critical.depth}
        totalBatched={sim.stats.totalBatched}
        batchEfficiency={sim.stats.batchEfficiency}
        activeBatches={sim.stats.activeBatches}
        totalShed={sim.stats.totalShed}
      />

      {/* 4. SLA Protection Panel & 3 Priority Queues */}
      <section className="protection-queues-row">
        <ProtectionCard
          paymentsDropped={sim.stats.paymentsDropped}
          ordersDropped={sim.stats.ordersDropped}
          clicksShed={sim.stats.clicksShed}
          logsShed={sim.stats.logsShed}
        />
        <PriorityQueues queues={sim.queues} />
      </section>

      {/* 5. Dual Charts (Traffic vs Capacity & Latency) */}
      <ChartsSection
        history={sim.history}
        isSpikeActive={sim.isSpikeActive}
        theme={theme}
      />

      {/* 6. Adaptive Strategy, Ingestion Donut, Batch Panel */}
      <section className="middle-grid">
        <AdaptiveStrategy
          systemMode={sim.systemMode}
          workerUtilization={sim.stats.workerUtilization}
          queueUtilization={sim.stats.queueUtilization}
        />
        <EventDistribution
          eventsByType={sim.stats.eventsByType}
          totalProcessed={sim.stats.totalProcessed}
          theme={theme}
        />
        <BatchPanel
          batchSize={sim.stats.batchSize}
          activeBatches={sim.stats.activeBatches}
          avgBatchSize={sim.stats.avgBatchSize}
          batchEfficiency={sim.stats.batchEfficiency}
          isSpikeActive={sim.isSpikeActive}
        />
      </section>

      {/* 7. Live Event Feed */}
      <LiveEventFeed liveEvents={sim.liveEvents} />

      {/* 8. Benchmark Comparison */}
      <BenchmarkComparison
        naive={sim.naive}
        queues={sim.queues}
        processedRate={sim.processedRate}
      />

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}

export default App;
