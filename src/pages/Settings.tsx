import React, { useState, useEffect } from 'react';
import { useWokwiBridge } from '../hooks/useWokwiBridge';

interface ThresholdState {
  waterWarning:  number;
  waterDanger:   number;
  batteryLow:    number;
  rainAlertAt:   number;
}

export const Settings: React.FC = () => {
  const [supabaseUrl,  setSupabaseUrl]  = useState(import.meta.env.VITE_SUPABASE_URL  || '');
  const [supabaseKey,  setSupabaseKey]  = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [weatherKey,   setWeatherKey]   = useState(import.meta.env.VITE_WEATHER_API_KEY   || '');
  const [weatherLoc,   setWeatherLoc]   = useState(import.meta.env.VITE_WEATHER_LOCATION   || 'Kolkata');
  const [saved, setSaved] = useState(false);

  // ── Hardware mode ──────────────────────────────────────────────────
  const [hardwareMode, setHardwareMode] = useState(
    () => localStorage.getItem('rapid_hardware_mode') === 'true'
  );
  const [bridgeUrl, setBridgeUrl] = useState(
    () => localStorage.getItem('rapid_bridge_url') || 'ws://localhost:8080'
  );
  const bridge = useWokwiBridge(hardwareMode);

  const toggleHardwareMode = () => {
    const next = !hardwareMode;
    setHardwareMode(next);
    localStorage.setItem('rapid_hardware_mode', next ? 'true' : 'false');
    window.dispatchEvent(new Event('rapid_hardware_mode_changed'));
  };

  useEffect(() => {
    localStorage.setItem('rapid_bridge_url', bridgeUrl);
  }, [bridgeUrl]);

  const [thresholds, setThresholds] = useState<ThresholdState>({
    waterWarning: 60,
    waterDanger:  80,
    batteryLow:   20,
    rainAlertAt:  70,
  });

  const [toggles, setToggles] = useState({
    autoControl: true,
    rainAlert:   true,
    emailAlerts: false,
    darkMode:    true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // In production: POST to backend to update env vars or save to DB
    console.log('[Settings] Saved:', { supabaseUrl, weatherKey, thresholds, toggles });
  };

  const toggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ RAPID — System Settings</h1>
        <p>Configure API keys, alert thresholds, and system behavior</p>
      </div>

      {isDemoMode && (
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          background: 'rgba(0,200,255,0.06)',
          border: '1px solid rgba(0,200,255,0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)',
          fontSize: 13,
          color: 'var(--accent-cyan)',
        }}>
          ℹ️ <strong>DEMO MODE ACTIVE</strong> — No Supabase connection. Using simulated sensor data. Add API keys below and restart to connect RAPID to real hardware.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        <div>
          {/* Supabase */}
          <div className="settings-section card">
            <h2>🗄️ Supabase Connection</h2>
            <div className="settings-field">
              <label className="settings-label" htmlFor="supabase-url">Project URL</label>
              <input
                id="supabase-url"
                className="settings-input"
                type="text"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="supabase-key">Anon Key</label>
              <input
                id="supabase-key"
                className="settings-input"
                type="password"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              />
            </div>
          </div>

          {/* Weather API */}
          <div className="settings-section card" style={{ marginTop: 'var(--space-md)' }}>
            <h2>🌦️ WeatherAPI.com</h2>
            <div className="settings-field">
              <label className="settings-label" htmlFor="weather-key">API Key (Free at weatherapi.com)</label>
              <input
                id="weather-key"
                className="settings-input"
                type="password"
                value={weatherKey}
                onChange={e => setWeatherKey(e.target.value)}
                placeholder="your-free-api-key"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="weather-loc">Location (city name or lat,lon)</label>
              <input
                id="weather-loc"
                className="settings-input"
                type="text"
                value={weatherLoc}
                onChange={e => setWeatherLoc(e.target.value)}
                placeholder="Kolkata"
              />
            </div>
          </div>

          {/* Wokwi ESP32 Hardware Bridge */}
          <div className="settings-section card" style={{ marginTop: 'var(--space-md)' }}>
            <h2>🔌 Hardware Bridge (Wokwi ESP32)</h2>
            <div className="settings-row" style={{ marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Enable Hardware Bridge</span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Stream live physical/simulated ESP32 ultrasonic telemetry.
                </div>
              </div>
              <button
                className={`settings-toggle ${hardwareMode ? 'on' : ''}`}
                onClick={toggleHardwareMode}
                aria-pressed={hardwareMode}
                aria-label="Toggle Hardware Mode"
              />
            </div>

            {hardwareMode && (
              <div className="settings-field">
                <label className="settings-label" htmlFor="bridge-url">WebSocket Server URL</label>
                <input
                  id="bridge-url"
                  type="text"
                  className="settings-input"
                  value={bridgeUrl}
                  onChange={e => setBridgeUrl(e.target.value)}
                  placeholder="ws://localhost:8080"
                />
                <div style={{ marginTop: 6, fontSize: 11, color: bridge.status === 'connected' ? 'var(--status-safe)' : 'var(--status-warn)' }}>
                  Status: <strong>{bridge.status.toUpperCase()}</strong> {bridge.latency !== null ? `(${bridge.latency}s latency)` : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Thresholds */}
          <div className="settings-section card">
            <h2>🎚️ Alert Thresholds</h2>
            {[
              { label: 'Water Level Warning (%)', key: 'waterWarning' as const, min: 30, max: 80,  color: 'var(--status-warn)' },
              { label: 'Water Level Danger (%)',  key: 'waterDanger'  as const, min: 50, max: 100, color: 'var(--status-danger)' },
              { label: 'Battery Low Alert (%)',   key: 'batteryLow'   as const, min: 5,  max: 50,  color: 'var(--accent-cyan)' },
              { label: 'Rain Alert Trigger (%)',  key: 'rainAlertAt'  as const, min: 20, max: 90,  color: 'var(--accent-purple)' },
            ].map(({ label, key, min, max, color }) => (
              <div key={key} className="settings-field">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="settings-label">{label}</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color }}>
                    {thresholds[key]}%
                  </span>
                </div>
                <input
                  type="range"
                  className="settings-range"
                  min={min}
                  max={max}
                  value={thresholds[key]}
                  onChange={e => setThresholds(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  style={{ accentColor: color }}
                />
              </div>
            ))}
          </div>

          {/* Feature toggles */}
          <div className="settings-section card" style={{ marginTop: 'var(--space-md)' }}>
            <h2>🔧 Feature Toggles</h2>
            {[
              { label: 'AI Automatic Pump Control', key: 'autoControl' as const },
              { label: 'Rain Forecast Alerts',       key: 'rainAlert'  as const },
              { label: 'Email Notifications',         key: 'emailAlerts' as const },
              { label: 'Dark Mode',                   key: 'darkMode'   as const },
            ].map(({ label, key }) => (
              <div key={key} className="settings-row">
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <button
                  className={`settings-toggle ${toggles[key] ? 'on' : ''}`}
                  onClick={() => toggle(key)}
                  aria-pressed={toggles[key]}
                  aria-label={`Toggle ${label}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
        <button id="save-settings-btn" className="save-btn" onClick={handleSave}>
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          ⚠️ Changes to API keys require a page refresh to take effect.
        </span>
      </div>
    </div>
  );
};
