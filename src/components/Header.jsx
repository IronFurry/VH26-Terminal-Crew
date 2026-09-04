import React from 'react';

export function Header({
  systemMode,
  incomingRate,
  isSpikeActive,
  onToggleSpike,
  onReset,
  isPaused,
  onTogglePause,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound
}) {
  const totalEventsMin = Math.round(incomingRate * 60).toLocaleString();

  return (
    <header className="header-bar">
      <div className="header-left">
        <div className="brand-badge">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <div className="brand-title">Intelligent Data Pipeline</div>
            <div className="brand-subtitle">Adaptive Stream Architecture &bull; React Observability</div>
          </div>
        </div>

        <div className="status-badge-group">
          <div className="badge badge-live">
            <span className="pulse-dot"></span>
            <span>LIVE</span>
          </div>
          <div className="badge badge-health">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>SYSTEM HEALTHY</span>
          </div>
          <div className={`badge-mode mode-${systemMode.toLowerCase()}`}>
            {systemMode}
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="traffic-pill">
          <span className="traffic-pill-label">Traffic Rate</span>
          <span className="traffic-pill-value">{totalEventsMin} events/min</span>
        </div>
      </div>

      <div className="header-right">
        {/* 20x Spike Hero Button */}
        <button
          className={`btn-spike ${isSpikeActive ? 'active-spike' : ''}`}
          onClick={onToggleSpike}
          title="Simulate sudden 20x traffic surge"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>{isSpikeActive ? 'NORMALIZE TRAFFIC (1k/min)' : 'TRIGGER 20× SPIKE'}</span>
        </button>

        {/* Theme Switch Button */}
        <button
          className="btn-theme-toggle"
          onClick={onToggleTheme}
          title="Switch Theme (Shortcut: T)"
        >
          {theme === 'dark' ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <span>Light</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Reset Button */}
        <button className="btn-control" onClick={onReset} title="Reset pipeline to baseline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>Reset</span>
        </button>

        {/* Pause Button */}
        <button
          className="btn-control"
          onClick={onTogglePause}
          style={isPaused ? { borderColor: 'var(--orange-primary)' } : {}}
          title="Pause simulation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Audio Toggle */}
        <button
          className="btn-control"
          onClick={onToggleSound}
          style={soundEnabled ? { color: 'var(--orange-primary)' } : {}}
          title="Toggle audio telemetry effects"
        >
          {soundEnabled ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
