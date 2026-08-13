import React, { useState, useEffect } from 'react';
import { useWokwiBridge } from '../hooks/useWokwiBridge';

interface ThresholdState {
  waterWarning: number;
  waterDanger:  number;
  batteryLow:   number;
  rainAlertAt:  number;
}

// ── Toggle Switch Component ────────────────────────────────────────────────
const Toggle: React.FC<{ on: boolean; onToggle: () => void; label?: string }> = ({ on, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={on}
    aria-label={label}
    style={{
      width: 42,
      height: 24,
      borderRadius: 12,
      background: on ? '#B7F34A' : '#22252A',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.25s ease',
      flexShrink: 0,
      padding: 2,
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 18,
      height: 18,
      borderRadius: '50%',
      background: on ? '#0B0D0F' : '#8B9298',
      transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
      display: 'block',
    }} />
  </button>
);

// ── Card component ─────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    ...style,
  }}>
    {children}
  </div>
);

// ── Card header ────────────────────────────────────────────────────────────
const CardHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{
      width: 32,
      height: 32,
      borderRadius: 6,
      background: 'rgba(183,243,74,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 15,
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <h3 style={{
      margin: 0,
      fontFamily: "'Geist', 'Inter', sans-serif",
      fontWeight: 600,
      fontSize: 18,
      color: '#F5F7F2',
    }}>
      {title}
    </h3>
  </div>
);

// ── Input field ────────────────────────────────────────────────────────────
const SettingsInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: string;
}> = ({ label, value, onChange, placeholder, type = 'text', icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 12,
      fontFamily: "'Geist', sans-serif",
      fontWeight: 500,
      color: '#8B9298',
      letterSpacing: '0.03em',
    }}>
      {label}
    </label>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: '#0B0D0F',
      border: '1px solid #22252A',
      borderRadius: 6,
      padding: '10px 12px',
      transition: 'border-color 0.2s',
    }}>
      {icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: '#F5F7F2',
          fontSize: 13,
          fontFamily: "'Geist', 'Inter', sans-serif",
        }}
      />
    </div>
  </div>
);

export const Settings: React.FC = () => {
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [weatherKey,  setWeatherKey]  = useState(import.meta.env.VITE_WEATHER_API_KEY  || '');
  const [weatherLoc,  setWeatherLoc]  = useState(import.meta.env.VITE_WEATHER_LOCATION  || 'Kolkata');
  const [saved, setSaved] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  // Hardware mode
  const [hardwareMode, setHardwareMode] = useState(
    () => localStorage.getItem('rapid_hardware_mode') === 'true'
  );
  const [bridgeUrl, setBridgeUrl] = useState(
    () => localStorage.getItem('rapid_bridge_url') || 'wss://bridge.rapid.local:8443'
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

  const toggle = (key: keyof typeof toggles) =>
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    console.log('[Settings] Saved:', { supabaseUrl, weatherKey, thresholds, toggles });
  };

  const handleTestConnection = () => {
    setTestingConn(true);
    setConnStatus('idle');
    setTimeout(() => {
      setTestingConn(false);
      setConnStatus(supabaseUrl ? 'ok' : 'err');
    }, 1500);
  };

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL;

  const thresholdConfig = [
    { label: 'Water Level Warning', key: 'waterWarning' as const, unit: '%', min: 30, max: 80,  color: '#F59E0B' },
    { label: 'Water Level Danger',  key: 'waterDanger'  as const, unit: '%', min: 50, max: 100, color: '#EF4444' },
    { label: 'Battery Low Alert',   key: 'batteryLow'   as const, unit: '%', min: 5,  max: 50,  color: '#63D9FF' },
    { label: 'Rain Alert Trigger',  key: 'rainAlertAt'  as const, unit: '%', min: 20, max: 90,  color: '#A78BFA' },
  ];

  const automationConfig = [
    { label: 'AI Automatic Pump Control', desc: 'Let AI schedule pump staging automatically', key: 'autoControl' as const },
    { label: 'Rain Forecast Alerts',      desc: 'Notify when rain probability exceeds threshold', key: 'rainAlert'   as const },
    { label: 'Email Notifications',       desc: 'Send critical alerts to registered email', key: 'emailAlerts' as const },
    { label: 'Dark Mode',                 desc: 'Use dark theme across the dashboard', key: 'darkMode'    as const },
  ];

  const debugLogs = [
    { time: '14:32:15', event: 'bridge.connect', msg: 'WebSocket handshake OK' },
    { time: '14:32:08', event: 'sensor.read',    msg: 'water_level: 4.85m, ok' },
    { time: '14:31:55', event: 'pump.status',    msg: 'pump_3 → ACTIVE @ 75%' },
  ];

  return (
    <div style={S.page}>
      {/* ── PAGE HEADER ── */}
      <div style={S.pageHeader}>
        <div style={S.headerText}>
          <h1 style={S.pageTitle}>System Settings</h1>
          <p style={S.pageSubtitle}>
            Configure your RAPID platform services, hardware connections, and automation rules.
          </p>
        </div>
        <div style={S.headerActions}>
          <button type="button" style={S.discardBtn} onClick={() => window.location.reload()}>
            Discard
          </button>
          <button type="button" style={S.saveBtn} onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Demo mode banner */}
      {isDemoMode && (
        <div style={S.demoBanner}>
          <span style={{ fontSize: 15 }}>ℹ️</span>
          <span>
            <strong style={{ color: '#63D9FF' }}>DEMO MODE</strong> — No Supabase connection active.
            Add API keys below and restart to connect to real hardware.
          </span>
        </div>
      )}

      {/* ── ROW 1: API + HARDWARE ── */}
      <div style={S.gridRow}>

        {/* API & Cloud Services */}
        <Card>
          <CardHeader icon="🌐" title="API & Cloud Services" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SettingsInput
              label="API Endpoint (Supabase URL)"
              value={supabaseUrl}
              onChange={setSupabaseUrl}
              placeholder="https://your-project.supabase.co"
              icon="🔗"
            />
            <SettingsInput
              label="Auth Token (Anon Key)"
              value={supabaseKey}
              onChange={setSupabaseKey}
              placeholder="eyJhbGciOiJIUzI1NiIsInR..."
              type="password"
              icon="🔑"
            />
            <SettingsInput
              label="Weather API Key"
              value={weatherKey}
              onChange={setWeatherKey}
              placeholder="your-weatherapi.com-key"
              type="password"
              icon="🌦️"
            />
            <SettingsInput
              label="Location / Region"
              value={weatherLoc}
              onChange={setWeatherLoc}
              placeholder="Kolkata"
              icon="📍"
            />
          </div>

          {/* Footer: Test Connection */}
          <div style={{ borderTop: '1px solid #22252A', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              style={S.testConnBtn}
              onClick={handleTestConnection}
              disabled={testingConn}
            >
              {testingConn ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={S.spinnerSmall} /> Testing...
                </span>
              ) : 'Test Connection'}
            </button>
            {connStatus !== 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: connStatus === 'ok' ? '#B7F34A' : '#EF4444',
                  boxShadow: connStatus === 'ok' ? '0 0 6px #B7F34A' : '0 0 6px #EF4444',
                  display: 'inline-block',
                }} />
                <span style={{ color: connStatus === 'ok' ? '#B7F34A' : '#EF4444', fontFamily: "'Geist', sans-serif" }}>
                  {connStatus === 'ok' ? 'Connected — 12ms latency' : 'Connection failed — check credentials'}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Hardware & IoT Bridge */}
        <Card>
          <CardHeader icon="🔌" title="Hardware & IoT Bridge" />

          {/* Hardware toggle row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
                Hardware Connection
              </div>
              <div style={{ fontSize: 12, color: '#8B9298', marginTop: 2 }}>
                Stream live ESP32 ultrasonic telemetry
              </div>
            </div>
            <Toggle on={hardwareMode} onToggle={toggleHardwareMode} label="Toggle Hardware Mode" />
          </div>

          {/* WebSocket URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#8B9298', fontWeight: 500, fontFamily: "'Geist', sans-serif" }}>
              WebSocket URL
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#0B0D0F',
              border: '1px solid #22252A',
              borderRadius: 6,
              padding: '10px 12px',
            }}>
              <span style={{ fontSize: 13 }}>🔌</span>
              <input
                type="text"
                value={bridgeUrl}
                onChange={e => setBridgeUrl(e.target.value)}
                placeholder="wss://bridge.rapid.local:8443"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#F5F7F2',
                  fontSize: 13,
                  fontFamily: "'Geist Mono', monospace",
                }}
              />
              {hardwareMode && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: bridge.status === 'connected' ? 'rgba(183,243,74,0.12)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${bridge.status === 'connected' ? 'rgba(183,243,74,0.3)' : 'rgba(239,68,68,0.25)'}`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  color: bridge.status === 'connected' ? '#B7F34A' : '#EF4444',
                  fontWeight: 600,
                  fontFamily: "'Geist', sans-serif",
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  {bridge.status.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Debug terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>
              DEBUG ACTIVITY
            </div>
            <div style={{
              background: '#0B0D0F',
              borderRadius: 6,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
              fontSize: 11,
            }}>
              {debugLogs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#8B9298', flexShrink: 0 }}>{log.time}</span>
                  <span style={{ color: '#B7F34A', flexShrink: 0 }}>{log.event}</span>
                  <span style={{ color: '#F5F7F2', opacity: 0.75 }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: THRESHOLDS + AUTOMATION ── */}
      <div style={S.gridRow}>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader icon="🔔" title="Alert Thresholds" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {thresholdConfig.map(({ label, key, unit, min, max, color }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontFamily: "'Geist Mono', monospace",
                    fontWeight: 700,
                    color,
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    borderRadius: 4,
                    padding: '2px 8px',
                  }}>
                    {thresholds[key]}{unit}
                  </span>
                </div>
                <div style={{ position: 'relative', height: 4 }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#22252A',
                    borderRadius: 2,
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${((thresholds[key] - min) / (max - min)) * 100}%`,
                    background: color,
                    borderRadius: 2,
                    transition: 'width 0.15s ease',
                  }} />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={thresholds[key]}
                    onChange={e => setThresholds(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                      height: 20,
                      top: -8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Automation & Notifications */}
        <Card>
          <CardHeader icon="⚙️" title="Automation & Notifications" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {automationConfig.map(({ label, desc, key }, idx) => (
              <React.Fragment key={key}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#F5F7F2',
                      fontFamily: "'Geist', sans-serif",
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: '#8B9298',
                      fontFamily: "'Geist', sans-serif",
                    }}>
                      {desc}
                    </span>
                  </div>
                  <Toggle on={toggles[key]} onToggle={() => toggle(key)} label={`Toggle ${label}`} />
                </div>
                {idx < automationConfig.length - 1 && (
                  <div style={{ height: 1, background: '#22252A' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Save area within automation card */}
          <div style={{ borderTop: '1px solid #22252A', paddingTop: 16, marginTop: 4 }}>
            <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 12 }}>
              ⚠️ Changes to API keys require a page refresh to take effect.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={S.discardBtn} onClick={() => window.location.reload()}>
                Discard
              </button>
              <button type="button" style={{ ...S.saveBtn, flex: 1 }} onClick={handleSave}>
                {saved ? '✓ Settings Saved!' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── STYLES ─────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    padding: 48,
    minHeight: '100vh',
    background: '#0B0D0F',
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pageTitle: {
    margin: 0,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    color: '#F5F7F2',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    margin: 0,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 400,
    fontSize: 15,
    color: '#8B9298',
    lineHeight: 1.5,
    maxWidth: 540,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexShrink: 0,
  },
  discardBtn: {
    background: 'transparent',
    border: '1px solid #22252A',
    borderRadius: 8,
    color: '#F5F7F2',
    padding: '10px 18px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  saveBtn: {
    background: '#B7F34A',
    border: 'none',
    borderRadius: 8,
    color: '#0B0D0F',
    padding: '10px 18px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  demoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(99,217,255,0.06)',
    border: '1px solid rgba(99,217,255,0.2)',
    borderRadius: 8,
    fontSize: 13,
    color: '#F5F7F2',
    fontFamily: "'Geist', sans-serif",
    lineHeight: 1.5,
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
  },
  testConnBtn: {
    background: 'transparent',
    border: '1px solid #22252A',
    borderRadius: 6,
    color: '#F5F7F2',
    padding: '8px 16px',
    fontSize: 13,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    alignSelf: 'flex-start',
  },
  spinnerSmall: {
    width: 12,
    height: 12,
    border: '2px solid rgba(255,255,255,0.15)',
    borderTopColor: '#F5F7F2',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
};
