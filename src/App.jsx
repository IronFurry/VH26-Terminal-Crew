import React, { useState, useEffect, useRef } from 'react';
import { PipelineSimulator } from './simulator.js';
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

export function App() {
  const simRef = useRef(new PipelineSimulator());
  const audioCtxRef = useRef(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('pipeline-theme') || 'light');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [, setTickCount] = useState(0);

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

  // Main 1s Simulation Tick Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const sim = simRef.current;
      sim.tick(1.0);
      setTickCount(c => c + 1);

      if (sim.isSpikeActive && Math.random() < 0.25) {
        playTone(280, 0.04, 'triangle');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  const sim = simRef.current;

  // Handlers
  const handleToggleSpike = () => {
    const newSpike = !sim.isSpikeActive;
    sim.setSpike(newSpike);
    if (newSpike) {
      playTone(520, 0.3, 'sine');
    } else {
      playTone(330, 0.2, 'sine');
    }
    setTickCount(c => c + 1);
  };

  const handleReset = () => {
    sim.reset();
    setIsPaused(false);
    playTone(440, 0.15, 'sine');
    setTickCount(c => c + 1);
  };

  const handleTogglePause = () => {
    const paused = sim.togglePause();
    setIsPaused(paused);
    setTickCount(c => c + 1);
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
  }, [soundEnabled]);

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

      {/* 3. 6 KPI Cards */}
      <KpiGrid
        actualIncomingRate={sim.actualIncomingRate}
        targetRate={sim.targetRate}
        isSpikeActive={sim.isSpikeActive}
        processedRate={sim.processedRate}
        processingCapacity={sim.processingCapacity}
        criticalP95={sim.queues.critical.p95}
        criticalP50={sim.queues.critical.p50}
        totalQueueDepth={sim.totalQueueDepth || 19}
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
