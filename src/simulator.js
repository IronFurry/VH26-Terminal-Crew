/**
 * Intelligent Data Pipeline - Real-time Simulation Engine
 * Models a high-throughput streaming architecture with 3-tier priority queues,
 * adaptive micro-batching, backpressure, and load-shedding safeguards.
 */

export class PipelineSimulator {
  constructor() {
    this.reset();
  }

  reset() {
    this.isPaused = false;
    this.isSpikeActive = false;
    this.spikeTimestamp = null;
    this.startTime = Date.now();

    // Target arrival rate (events per second)
    // Normal: 1,000/min ≈ 16.67/s; Spike: 20,000/min ≈ 333.33/s
    this.targetRate = 16.67; 
    this.actualIncomingRate = 16.7;
    this.processedRate = 16.5;
    this.processingCapacity = 40.0; // scales adaptively

    // Current State: 'NORMAL' | 'PRESSURE' | 'OVERLOAD' | 'EXTREME'
    this.systemMode = 'NORMAL';
    this.modeDescription = 'Processing events individually via stream channels';

    // Priority Queues
    this.queues = {
      critical: {
        depth: 2,
        maxSafe: 50,
        rate: 3.3,
        p50: 38,
        p95: 52,
        types: ['Payment', 'Order'],
        status: 'PROTECTED',
        workers: 16
      },
      medium: {
        depth: 5,
        maxSafe: 200,
        rate: 3.0,
        p50: 65,
        p95: 98,
        types: ['Inventory'],
        status: 'STREAMING',
        workers: 8
      },
      low: {
        depth: 12,
        maxSafe: 1000,
        rate: 10.2,
        p50: 120,
        p95: 220,
        types: ['Clicks', 'Logs'],
        status: 'STREAMING',
        workers: 8
      }
    };

    // Global Counters
    this.stats = {
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
      workerUtilization: 24,
      queueUtilization: 3,
      eventsByType: {
        Payment: 0,
        Order: 0,
        Inventory: 0,
        Clicks: 0,
        Logs: 0
      },
      eventsByStrategy: {
        Streamed: 0,
        Batched: 0,
        Deferred: 0,
        Shed: 0
      }
    };

    // Live Feed (ring buffer of last 40 events)
    this.liveEvents = [];
    this.eventIdCounter = 1000;

    // Time-series history for charts (40 data points)
    this.history = {
      labels: [],
      incoming: [],
      processed: [],
      capacity: [],
      latencyCritical: [],
      latencyMedium: [],
      latencyLow: []
    };

    // Naive baseline comparison stats
    this.naive = {
      criticalP95: 55,
      throughput: 16.5,
      queueDepth: 19,
      eventsShed: 0,
      criticalDropped: 0
    };

    // Pre-seed 30 historical data points for instant smooth graph
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      const timeStr = t.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
      this.history.labels.push(timeStr);
      this.history.incoming.push(16.7 + (Math.random() * 2 - 1));
      this.history.processed.push(16.5 + (Math.random() * 2 - 1));
      this.history.capacity.push(40);
      this.history.latencyCritical.push(48 + Math.floor(Math.random() * 8));
      this.history.latencyMedium.push(75 + Math.floor(Math.random() * 15));
      this.history.latencyLow.push(140 + Math.floor(Math.random() * 30));
    }
  }

  setSpike(active) {
    this.isSpikeActive = active;
    if (active) {
      this.targetRate = 333.33; // 20,000/min
      this.spikeTimestamp = Date.now();
    } else {
      this.targetRate = 16.67; // 1,000/min
      this.spikeTimestamp = null;
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * Main simulation step called at 1000ms / 500ms intervals
   */
  tick(dt = 1.0) {
    if (this.isPaused) return;

    // Smooth ramp towards target incoming rate
    const lerpFactor = this.isSpikeActive ? 0.6 : 0.3;
    this.actualIncomingRate = this.actualIncomingRate + (this.targetRate - this.actualIncomingRate) * lerpFactor;
    // Add realistic jitter
    const jitter = (Math.random() - 0.5) * (this.isSpikeActive ? 15 : 1.5);
    const currentIncoming = Math.max(5, this.actualIncomingRate + jitter);

    // Incoming count this tick
    const incomingCount = Math.round(currentIncoming * dt);
    this.stats.totalReceived += incomingCount;

    // Determine System State based on incoming rate and queue build-up
    this.updateSystemMode(currentIncoming);

    // Simulate Event Ingestion and Queue Allocation
    this.processIngestion(incomingCount, currentIncoming);

    // Compute Adaptive Worker Capacity
    this.updateWorkerProcessing(dt);

    // Update Naive Comparison Model
    this.updateNaiveModel(currentIncoming, dt);

    // Append to charts history
    const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
    this.history.labels.push(nowStr);
    this.history.incoming.push(Number(currentIncoming.toFixed(1)));
    this.history.processed.push(Number(this.processedRate.toFixed(1)));
    this.history.capacity.push(Number(this.processingCapacity.toFixed(1)));
    this.history.latencyCritical.push(this.queues.critical.p95);
    this.history.latencyMedium.push(this.queues.medium.p95);
    this.history.latencyLow.push(this.queues.low.p95);

    if (this.history.labels.length > 40) {
      this.history.labels.shift();
      this.history.incoming.shift();
      this.history.processed.shift();
      this.history.capacity.shift();
      this.history.latencyCritical.shift();
      this.history.latencyMedium.shift();
      this.history.latencyLow.shift();
    }
  }

  updateSystemMode(incomingRate) {
    if (incomingRate < 45) {
      this.systemMode = 'NORMAL';
      this.modeDescription = 'Processing events individually via stream channels';
      this.queues.medium.status = 'STREAMING';
      this.queues.low.status = 'STREAMING';
      this.processingCapacity = 45;
    } else if (incomingRate < 120) {
      this.systemMode = 'PRESSURE';
      this.modeDescription = 'Moderate load detected: Low-priority micro-batching activated';
      this.queues.medium.status = 'STREAMING';
      this.queues.low.status = 'BATCHING';
      this.processingCapacity = 140;
    } else if (incomingRate < 240) {
      this.systemMode = 'OVERLOAD';
      this.modeDescription = 'High pressure: Deferring low-priority events, batching medium events';
      this.queues.medium.status = 'BATCHING';
      this.queues.low.status = 'DEFERRED';
      this.processingCapacity = 260;
    } else {
      this.systemMode = 'EXTREME';
      this.modeDescription = '20× Flash Spike: Load shedding discardable logs — Critical events 100% protected';
      this.queues.medium.status = 'BATCHING';
      this.queues.low.status = 'SHEDDING';
      this.processingCapacity = 340;
    }
  }

  processIngestion(count, currentIncoming) {
    // Proportions:
    // Payment: 12%, Order: 8% (Total Critical: 20%)
    // Inventory: 18% (Medium: 18%)
    // Clicks: 38%, Logs: 24% (Low: 62%)
    const critCount = Math.round(count * 0.20);
    const medCount = Math.round(count * 0.18);
    const lowCount = count - critCount - medCount;

    // Generate specific event instances for live log & queue adjustments
    const batchEvents = [];

    // Critical events
    for (let i = 0; i < critCount; i++) {
      const isPayment = Math.random() < 0.6;
      const type = isPayment ? 'Payment' : 'Order';
      this.stats.eventsByType[type]++;
      this.stats.eventsByStrategy.Streamed++;
      
      const pTime = 38 + Math.floor(Math.random() * 18);
      batchEvents.push({
        id: `${type.toUpperCase().substring(0, 3)}-${++this.eventIdCounter}`,
        type: type,
        priority: 'CRITICAL',
        decision: 'STREAM',
        time: pTime + 'ms',
        status: 'SUCCESS'
      });
    }

    // Medium events
    for (let i = 0; i < medCount; i++) {
      this.stats.eventsByType.Inventory++;
      let decision = 'STREAM';
      let status = 'SUCCESS';
      let timeStr = (60 + Math.floor(Math.random() * 30)) + 'ms';

      if (this.systemMode === 'OVERLOAD' || this.systemMode === 'EXTREME') {
        decision = 'BATCH';
        status = 'BATCHED';
        timeStr = (120 + Math.floor(Math.random() * 180)) + 'ms';
        this.stats.eventsByStrategy.Batched++;
        this.stats.totalBatched++;
      } else {
        this.stats.eventsByStrategy.Streamed++;
      }

      batchEvents.push({
        id: `INV-${++this.eventIdCounter}`,
        type: 'Inventory',
        priority: 'MEDIUM',
        decision: decision,
        time: timeStr,
        status: status
      });
    }

    // Low events (Clicks & Logs)
    for (let i = 0; i < lowCount; i++) {
      const isClick = Math.random() < 0.61;
      const type = isClick ? 'Clicks' : 'Logs';
      this.stats.eventsByType[type]++;

      let decision = 'STREAM';
      let status = 'SUCCESS';
      let timeStr = (110 + Math.floor(Math.random() * 80)) + 'ms';

      if (this.systemMode === 'EXTREME') {
        // Under extreme load, shed non-critical logs and some clicks
        const shouldShed = Math.random() < 0.68;
        if (shouldShed) {
          decision = 'SHED';
          status = 'SHED';
          timeStr = '—';
          this.stats.totalShed++;
          this.stats.eventsByStrategy.Shed++;
          if (type === 'Clicks') this.stats.clicksShed++;
          else this.stats.logsShed++;
        } else {
          decision = 'BATCH';
          status = 'BATCHED';
          timeStr = (1.2 + Math.random() * 1.8).toFixed(1) + 's';
          this.stats.totalBatched++;
          this.stats.eventsByStrategy.Batched++;
        }
      } else if (this.systemMode === 'OVERLOAD') {
        decision = 'DEFER';
        status = 'DEFERRED';
        timeStr = (1.0 + Math.random() * 1.5).toFixed(1) + 's';
        this.stats.eventsByStrategy.Deferred++;
        this.stats.totalBatched++;
      } else if (this.systemMode === 'PRESSURE') {
        decision = 'BATCH';
        status = 'BATCHED';
        timeStr = (400 + Math.floor(Math.random() * 600)) + 'ms';
        this.stats.eventsByStrategy.Batched++;
        this.stats.totalBatched++;
      } else {
        this.stats.eventsByStrategy.Streamed++;
      }

      batchEvents.push({
        id: `${type === 'Clicks' ? 'CLK' : 'LOG'}-${++this.eventIdCounter}`,
        type: type === 'Clicks' ? 'Click' : 'Log',
        priority: 'LOW',
        decision: decision,
        time: timeStr,
        status: status
      });
    }

    // Push new events to live stream (keep latest 35)
    // We pick 4-8 representative events to prepend to the live table
    const sample = [];
    if (batchEvents.length > 0) {
      // Ensure we sample at least one critical event if available
      const critSample = batchEvents.find(e => e.priority === 'CRITICAL');
      if (critSample) sample.push(critSample);
      
      for (let i = 0; i < Math.min(5, batchEvents.length); i++) {
        const randEvent = batchEvents[Math.floor(Math.random() * batchEvents.length)];
        if (!sample.includes(randEvent)) sample.push(randEvent);
      }
    }

    const timeHeader = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 900 + 100);
    sample.forEach(e => {
      this.liveEvents.unshift({
        ...e,
        timestamp: timeHeader
      });
    });

    if (this.liveEvents.length > 40) {
      this.liveEvents.length = 40;
    }
  }

  updateWorkerProcessing(dt) {
    if (this.systemMode === 'NORMAL') {
      this.queues.critical.depth = Math.floor(Math.random() * 4) + 1;
      this.queues.critical.p50 = 38 + Math.floor(Math.random() * 5);
      this.queues.critical.p95 = 51 + Math.floor(Math.random() * 6);

      this.queues.medium.depth = Math.floor(Math.random() * 10) + 3;
      this.queues.medium.p50 = 62 + Math.floor(Math.random() * 10);
      this.queues.medium.p95 = 95 + Math.floor(Math.random() * 12);

      this.queues.low.depth = Math.floor(Math.random() * 20) + 8;
      this.queues.low.p50 = 110 + Math.floor(Math.random() * 20);
      this.queues.low.p95 = 210 + Math.floor(Math.random() * 30);

      this.processedRate = Math.max(14, this.actualIncomingRate - (Math.random() * 1));
      this.stats.workerUtilization = 28 + Math.floor(Math.random() * 6);
      this.stats.queueUtilization = 4;
      this.stats.batchSize = 1;
      this.stats.activeBatches = 0;
      this.stats.avgBatchSize = 1;
      this.stats.batchEfficiency = '0%';
    } else if (this.systemMode === 'PRESSURE') {
      this.queues.critical.depth = Math.floor(Math.random() * 6) + 2;
      this.queues.critical.p50 = 40 + Math.floor(Math.random() * 6);
      this.queues.critical.p95 = 54 + Math.floor(Math.random() * 8);

      this.queues.medium.depth = 25 + Math.floor(Math.random() * 15);
      this.queues.medium.p50 = 90 + Math.floor(Math.random() * 20);
      this.queues.medium.p95 = 140 + Math.floor(Math.random() * 25);

      this.queues.low.depth = 80 + Math.floor(Math.random() * 40);
      this.queues.low.p50 = 320 + Math.floor(Math.random() * 50);
      this.queues.low.p95 = 620 + Math.floor(Math.random() * 80);

      this.processedRate = this.actualIncomingRate * 0.96;
      this.stats.workerUtilization = 62 + Math.floor(Math.random() * 8);
      this.stats.queueUtilization = 22;
      this.stats.batchSize = 25;
      this.stats.activeBatches = 4;
      this.stats.avgBatchSize = 22;
      this.stats.batchEfficiency = '48%';
    } else if (this.systemMode === 'OVERLOAD') {
      this.queues.critical.depth = Math.floor(Math.random() * 9) + 4;
      this.queues.critical.p50 = 44 + Math.floor(Math.random() * 6);
      this.queues.critical.p95 = 58 + Math.floor(Math.random() * 8);

      this.queues.medium.depth = 60 + Math.floor(Math.random() * 25);
      this.queues.medium.p50 = 180 + Math.floor(Math.random() * 30);
      this.queues.medium.p95 = 290 + Math.floor(Math.random() * 40);

      this.queues.low.depth = 260 + Math.floor(Math.random() * 90);
      this.queues.low.p50 = 950 + Math.floor(Math.random() * 120);
      this.queues.low.p95 = 1450 + Math.floor(Math.random() * 150);

      this.processedRate = this.actualIncomingRate * 0.91;
      this.stats.workerUtilization = 84 + Math.floor(Math.random() * 7);
      this.stats.queueUtilization = 54;
      this.stats.batchSize = 50;
      this.stats.activeBatches = 7;
      this.stats.avgBatchSize = 46;
      this.stats.batchEfficiency = '76%';
    } else { // EXTREME 20× SPIKE
      // CRITICAL QUEUE REMAINS SMALL & PROTECTED!
      this.queues.critical.depth = Math.floor(Math.random() * 8) + 3; // <= 11 events
      this.queues.critical.p50 = 45 + Math.floor(Math.random() * 7);
      this.queues.critical.p95 = 59 + Math.floor(Math.random() * 9); // strictly < 70ms!
      this.queues.critical.rate = 66.7; // 20% of 333/s

      // Medium queue holds bounded buffer
      this.queues.medium.depth = 110 + Math.floor(Math.random() * 40);
      this.queues.medium.p50 = 240 + Math.floor(Math.random() * 40);
      this.queues.medium.p95 = 410 + Math.floor(Math.random() * 60);
      this.queues.medium.rate = 60.0;

      // Low queue buffers and sheds
      this.queues.low.depth = 480 + Math.floor(Math.random() * 120);
      this.queues.low.p50 = 1600 + Math.floor(Math.random() * 200);
      this.queues.low.p95 = 2650 + Math.floor(Math.random() * 350);
      this.queues.low.rate = 180.0;

      // Pipeline dynamically achieves high processed throughput via micro-batching
      this.processedRate = 310 + Math.floor(Math.random() * 20);
      this.stats.workerUtilization = 94 + Math.floor(Math.random() * 5);
      this.stats.queueUtilization = 68;
      this.stats.batchSize = 80;
      this.stats.activeBatches = 12;
      this.stats.avgBatchSize = 74;
      this.stats.batchEfficiency = '88%';
    }

    // Calculate total queue depth
    this.totalQueueDepth = this.queues.critical.depth + this.queues.medium.depth + this.queues.low.depth;
    this.stats.totalProcessed += Math.round(this.processedRate * dt);
  }

  updateNaiveModel(incomingRate, dt) {
    if (!this.isSpikeActive) {
      this.naive.criticalP95 = 54 + Math.floor(Math.random() * 8);
      this.naive.throughput = this.processedRate;
      this.naive.queueDepth = 22 + Math.floor(Math.random() * 8);
      this.naive.eventsShed = 0;
      this.naive.criticalDropped = 0;
    } else {
      // In a naive FIFO queue, head-of-line blocking destroys performance
      this.naive.criticalP95 = Math.min(14500, this.naive.criticalP95 + 450);
      this.naive.throughput = Math.min(95, this.naive.throughput + 2); // capacity bottle-necked
      this.naive.queueDepth = Math.min(12500, this.naive.queueDepth + 260);
      this.naive.eventsShed += Math.floor(Math.random() * 25 + 10); // arbitrary drops
      // Naive queue randomly drops critical payments/orders!
      this.naive.criticalDropped += Math.floor(Math.random() * 5 + 2);
    }
  }
}
