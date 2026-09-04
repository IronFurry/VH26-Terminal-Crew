import React from 'react';

export function SystemBanner({ systemMode, modeDescription }) {
  const modeKey = systemMode.toLowerCase();

  return (
    <section className={`system-banner banner-${modeKey}`}>
      <div className="banner-left">
        <span className={`banner-state-dot dot-${modeKey}`}></span>
        <div>
          <span className={`banner-state-title ${
            systemMode === 'NORMAL' ? 'text-emerald' :
            systemMode === 'PRESSURE' ? 'text-orange' :
            systemMode === 'OVERLOAD' ? '' : 'text-rose'
          }`} style={systemMode === 'OVERLOAD' ? { color: '#c2410c' } : {}}>
            MODE: {systemMode}
          </span>
          <span className="step-divider">&bull;</span>
          <span className="banner-state-desc">{modeDescription}</span>
        </div>
      </div>
      <div className="banner-steps">
        <div className={`step-node ${systemMode === 'NORMAL' ? 'active-step active-normal' : ''}`}>
          1. NORMAL
        </div>
        <div className="step-divider">&rarr;</div>
        <div className={`step-node ${systemMode === 'PRESSURE' ? 'active-step active-pressure' : ''}`}>
          2. PRESSURE
        </div>
        <div className="step-divider">&rarr;</div>
        <div className={`step-node ${systemMode === 'OVERLOAD' ? 'active-step active-overload' : ''}`}>
          3. OVERLOAD
        </div>
        <div className="step-divider">&rarr;</div>
        <div className={`step-node ${systemMode === 'EXTREME' ? 'active-step active-extreme' : ''}`}>
          4. EXTREME (20×)
        </div>
      </div>
    </section>
  );
}
