import React from 'react';

/* ─────────────────────────────────────────────────────────────
   SpinningCards
   Three wide-landscape RAPID data widgets orbiting in 3D space
   with clockwise motion direction.
───────────────────────────────────────────────────────────────── */

export const SpinningCards: React.FC = () => (
  <div className="sc-scene" aria-hidden="true" role="presentation">
    <div className="sc-orbit">

      {/* ══ Card 1 — RAPID Dashboard (Landscape) ══ */}
      <div className="sc-card sc-card-1">
        <div className="sc-inner">
          {/* Header */}
          <div className="sc-hdr">
            <div className="sc-hdr-left">
              <span className="sc-ico">🌧️</span>
              <div>
                <div className="sc-card-title">RAPID Live Telemetry</div>
                <div className="sc-card-sub">Real-Time Dewatering Node</div>
              </div>
            </div>
            <div className="sc-live-pill">
              <span className="sc-live-dot" />
              LIVE
            </div>
          </div>

          {/* Body Content */}
          <div className="sc-body-ls">
            {/* Metric bars column */}
            <div className="sc-metrics">
              {[
                { lbl: 'Water Level',      val: 63, unit: '%',     clr: '#06B6D4' },
                { lbl: 'Rain Probability', val: 85, unit: '%',     clr: '#8B5CF6' },
                { lbl: 'Solar Capacity',   val: 72, unit: '% cap', clr: '#F59E0B' },
              ].map(m => (
                <div key={m.lbl} className="sc-metric">
                  <div className="sc-metric-top">
                    <span className="sc-metric-lbl">{m.lbl}</span>
                    <span className="sc-metric-val" style={{ color: m.clr }}>
                      {m.val}{m.unit}
                    </span>
                  </div>
                  <div className="sc-bar">
                    <div
                      className="sc-bar-fill"
                      style={{ width: `${m.val}%`, background: m.clr }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pump-mode badges footer */}
          <div className="sc-pump-row">
            <span className="sc-row-lbl">PUMP MODE:</span>
            <div className="sc-pbadge sc-p-off">OFF</div>
            <div className="sc-pbadge sc-p-low">LOW</div>
            <div className="sc-pbadge sc-p-hi sc-p-active">HIGH ●</div>
            <div className="sc-pbadge sc-p-emg">EMG</div>
          </div>
        </div>
      </div>

      {/* ══ Card 2 — AI Prediction (Landscape) ══ */}
      <div className="sc-card sc-card-2">
        <div className="sc-inner sc-inner-ai">
          <div className="sc-hdr">
            <div className="sc-hdr-left">
              <span className="sc-ico">🧠</span>
              <div>
                <div className="sc-card-title">AI Predictive Intelligence</div>
                <div className="sc-card-sub">+60 Min Water Rise Model</div>
              </div>
            </div>
            <div className="sc-risk-badge sc-risk-high">HIGH RISK</div>
          </div>

          <div className="sc-body-split">
            {/* Left: Big number */}
            <div className="sc-pred-main">
              <div className="sc-pred-num">
                +18<span className="sc-pred-unit">cm</span>
              </div>
              <div className="sc-pred-desc">Forecasted Rise (1 hr)</div>
            </div>

            {/* Right: Mini bar chart */}
            <div className="sc-mini-bars">
              {[
                { t: '+15m', v: 48, c: '#22D3EE' },
                { t: '+30m', v: 67, c: '#06B6D4' },
                { t: '+45m', v: 80, c: '#F59E0B' },
                { t: '+60m', v: 89, c: '#EF4444' },
              ].map(b => (
                <div key={b.t} className="sc-mbar-col">
                  <div className="sc-mbar-track">
                    <div
                      className="sc-mbar-fill"
                      style={{ height: `${b.v}%`, background: b.c }}
                    />
                  </div>
                  <span className="sc-mbar-lbl">{b.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sc-ai-alert">
            <span>⚡</span>
            <span>Auto-Trigger: Switching to <strong>HIGH SPEED PUMPING</strong></span>
          </div>
        </div>
      </div>

      {/* ══ Card 3 — Pump Control System (Landscape) ══ */}
      <div className="sc-card sc-card-3">
        <div className="sc-inner sc-inner-pump">
          <div className="sc-hdr">
            <div className="sc-hdr-left">
              <span className="sc-ico">⚡</span>
              <div>
                <div className="sc-card-title">Smart Pump Automation</div>
                <div className="sc-card-sub">Autonomous Controller</div>
              </div>
            </div>
            <div className="sc-risk-badge sc-risk-active">ACTIVE</div>
          </div>

          {/* 4 Stats Grid in 1 Row */}
          <div className="sc-stat-grid-row">
            {[
              { lbl: 'Battery',   val: '87%',   clr: '#22C55E' },
              { lbl: 'Solar Gen', val: '720W',  clr: '#F59E0B' },
              { lbl: 'Flow Rate', val: '340L/m',clr: '#06B6D4' },
              { lbl: 'Uptime',    val: '99.9%', clr: '#8B5CF6' },
            ].map(s => (
              <div key={s.lbl} className="sc-stat">
                <div className="sc-stat-val" style={{ color: s.clr }}>{s.val}</div>
                <div className="sc-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="sc-alert-strip">
            <span className="sc-alert-ico">🚨</span>
            <span>Emergency Flood Protocol Engaged — Pump Operational</span>
          </div>
        </div>
      </div>

    </div>
  </div>
);
