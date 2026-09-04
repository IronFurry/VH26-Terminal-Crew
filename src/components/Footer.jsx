import React from 'react';

export function Footer() {
  return (
    <footer className="demo-hud-footer">
      <div className="hud-left">
        <span>Shortcuts:</span>
        <span className="hud-pill">Space: Trigger Spike</span>
        <span className="hud-pill">T: Toggle Theme</span>
        <span className="hud-pill">P: Pause</span>
        <span className="hud-pill">R: Reset</span>
      </div>
      <div>
        <span>Engine: <strong>SimStream v2.4 (React 18 + Vite)</strong> &bull; Zero external backend required</span>
      </div>
    </footer>
  );
}
