import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAlerts }     from '../hooks/useAlerts';
import { useSensorData } from '../hooks/useSensorData';
import type { Alert }    from '../types';

/* ─────────────────────────────────────────────────────────────
   AlertsPage — Real-time alert center
   Monitors:
   • Water level threshold breaches (warn / critical / emergency)
   • Pump failure: water rising even though pump is on HIGH
   • Battery critically low
   • Sensor health / hardware disconnection
   • Rain surge warnings from rain probability
   All alerts stored in Supabase `alerts` table so ESP32 can
   also trigger alerts by inserting rows via WiFi.
───────────────────────────────────────────────────────────── */

/* ── Severity styling ── */
const SEVERITY_STYLE: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.06)',    icon: '🚨', label: 'CRITICAL'  },
  WARNING:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.06)',   icon: '⚠️', label: 'WARNING'   },
  INFO:     { color: '#63D9FF', bg: 'rgba(99,217,255,0.05)',   icon: 'ℹ️', label: 'INFO'      },
};

/* ── Type label mapping ── */
const TYPE_LABEL: Record<string, string> = {
  WATER_RISING:     'Water Level Alert',
  PUMP_FAILURE:     'Pump System Failure',
  PUMP_OVERRIDE:    'Pump Mode Override',
  BATTERY_LOW:      'Low Battery',
  RAIN_ALERT:       'Rainfall Warning',
  SENSOR_FAULT:     'Sensor Fault',
  HARDWARE_OFFLINE: 'Hardware Disconnected',
  EMERGENCY_PUMP:   'Emergency Pump Activated',
  WATER_NORMAL:     'System Normal',
};

/* ── Single alert card ── */
const AlertCard: React.FC<{ alert: Alert; onAck: (id: string) => void }> = ({ alert, onAck }) => {
  const sev  = SEVERITY_STYLE[alert.severity] ?? SEVERITY_STYLE.INFO;
  const date = alert.created_at ? new Date(alert.created_at) : new Date();
  const typeLabel = TYPE_LABEL[alert.type] ?? alert.type;

  return (
    <div style={{
      background: alert.acknowledged ? '#12151A' : sev.bg,
      border: `1px solid ${alert.acknowledged ? '#1A1D21' : `${sev.color}30`}`,
      borderLeft: `3px solid ${alert.acknowledged ? '#22252A' : sev.color}`,
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      opacity: alert.acknowledged ? 0.55 : 1,
      transition: 'all 0.3s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: alert.acknowledged ? '#1A1D21' : `${sev.color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {sev.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: alert.acknowledged ? '#8B9298' : sev.color, background: `${sev.color}12`, border: `1px solid ${sev.color}25`, padding: '2px 8px', borderRadius: 20, fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>
              {sev.label}
            </span>
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{typeLabel}</span>
          </div>
          <span style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap' as const }}>
            {date.toLocaleString()}
          </span>
        </div>
        <div style={{ fontSize: 13, color: alert.acknowledged ? '#4A5158' : '#F5F7F2', fontFamily: "'Geist', sans-serif", marginTop: 6, lineHeight: 1.5 }}>
          {alert.message}
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAck(alert.id)}
            style={{ marginTop: 8, background: 'transparent', border: `1px solid ${sev.color}40`, borderRadius: 7, color: sev.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '5px 12px', fontFamily: "'Geist', sans-serif", transition: 'background 0.2s' }}>
            ✓ Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Stat badge ── */
const Stat: React.FC<{ count: number; label: string; color: string }> = ({ count, label, color }) => (
  <div style={{ background: '#15181B', border: `1px solid ${color}20`, borderRadius: 12, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
    <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "'Geist Mono', monospace" }}>{count}</div>
    <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{label}</div>
  </div>
);

export const AlertsPage: React.FC = () => {
  const { alerts, acknowledge } = useAlerts();
  const { latest, hardwareMode, bridgeStatus } = useSensorData();
  const [filter, setFilter]       = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'UNREAD'>('ALL');
  const [localAlerts, setLocal]   = useState<Alert[]>([]);
  const prevWaterRef              = useRef<number | null>(null);
  const prevPumpRef               = useRef<string | null>(null);

  /* ── Merge Supabase + locally-detected alerts ── */
  const allAlerts = [...localAlerts, ...alerts].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  /* ── Local alert generator — monitors sensor data in real-time ── */
  const addLocal = useCallback((partial: Omit<Alert, 'id' | 'created_at' | 'acknowledged'>) => {
    const newAlert: Alert = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      acknowledged: false,
      ...partial,
    };
    setLocal(prev => {
      // Deduplicate: don't add same type within 30 seconds
      const recentSame = prev.find(a => a.type === newAlert.type &&
        (Date.now() - new Date(a.created_at).getTime()) < 30000
      );
      if (recentSame) return prev;
      return [newAlert, ...prev].slice(0, 30);
    });
  }, []);

  /* ── Watch sensor readings for conditions that generate alerts ── */
  useEffect(() => {
    if (!latest) return;
    const wl   = latest.water_level;
    const pump = latest.pump_status;
    const batt = latest.battery_level;
    const rain = latest.rain_probability;
    const prev = prevWaterRef.current;

    // Water critical
    if (wl >= 80) {
      addLocal({ type: 'EMERGENCY_PUMP', severity: 'CRITICAL', message: `🚨 EMERGENCY: Water level at ${wl.toFixed(1)}% — immediate evacuation and maximum pumping required!` });
    } else if (wl >= 65) {
      addLocal({ type: 'WATER_RISING', severity: 'CRITICAL', message: `Water level critically high at ${wl.toFixed(1)}%. Pump set to HIGH SPEED.` });
    } else if (wl >= 50) {
      addLocal({ type: 'WATER_RISING', severity: 'WARNING', message: `Water level elevated at ${wl.toFixed(1)}%. Pre-emptive pumping started.` });
    }

    // Pump failure detection: water rising despite pump on HIGH
    if (prev !== null && pump === 'HIGH' && wl > prev + 1.5) {
      addLocal({
        type: 'PUMP_FAILURE',
        severity: 'CRITICAL',
        message: `🔧 PUMP FAILURE DETECTED: Water level is rising (+${(wl - prev).toFixed(1)}%) despite pump running at HIGH SPEED. Immediate maintenance required!`,
      });
    }

    // Pump change
    if (prevPumpRef.current && prevPumpRef.current !== pump) {
      addLocal({
        type: 'PUMP_OVERRIDE',
        severity: 'INFO',
        message: `Pump mode changed: ${prevPumpRef.current} → ${pump} (water level: ${wl.toFixed(1)}%, rain: ${rain.toFixed(0)}%)`,
      });
    }

    // Battery low
    if (batt <= 20 && batt > 0) {
      addLocal({ type: 'BATTERY_LOW', severity: 'CRITICAL', message: `⚡ Battery critically low at ${batt.toFixed(0)}%. Solar charging may be insufficient. Grid fallback recommended.` });
    } else if (batt <= 30) {
      addLocal({ type: 'BATTERY_LOW', severity: 'WARNING', message: `Battery at ${batt.toFixed(0)}%. Monitor solar input closely.` });
    }

    // Heavy rain incoming
    if (rain >= 80) {
      addLocal({ type: 'RAIN_ALERT', severity: 'CRITICAL', message: `🌧️ Extreme rainfall probability: ${rain.toFixed(0)}%. Pre-activate HIGH SPEED pump immediately.` });
    } else if (rain >= 60) {
      addLocal({ type: 'RAIN_ALERT', severity: 'WARNING', message: `Heavy rain forecasted: ${rain.toFixed(0)}% probability. Recommend switching pump to LOW SPEED.` });
    }

    prevWaterRef.current = wl;
    prevPumpRef.current  = pump;
  }, [latest, addLocal]);

  /* ── Hardware disconnection alert ── */
  useEffect(() => {
    if (hardwareMode && bridgeStatus === 'error') {
      addLocal({
        type: 'HARDWARE_OFFLINE',
        severity: 'CRITICAL',
        message: '📡 Hardware connection lost. ESP32 bridge is not responding. Check network connection and bridge server.',
      });
    }
  }, [hardwareMode, bridgeStatus, addLocal]);

  /* ── No sensor update for 30s (stale data) ── */
  useEffect(() => {
    if (!latest) return;
    const lastTs = latest.created_at ? new Date(latest.created_at).getTime() : Date.now();
    const timer = setTimeout(() => {
      if (Date.now() - lastTs > 30000) {
        addLocal({
          type: 'SENSOR_FAULT',
          severity: 'WARNING',
          message: 'Sensor data has not been updated in 30+ seconds. Check ESP32 WiFi connection and bridge server.',
        });
      }
    }, 32000);
    return () => clearTimeout(timer);
  }, [latest, addLocal]);

  const ackAll = () => {
    allAlerts.filter(a => !a.acknowledged).forEach(a => {
      if (a.id.startsWith('local-')) {
        setLocal(prev => prev.map(x => x.id === a.id ? { ...x, acknowledged: true } : x));
      } else {
        acknowledge(a.id);
      }
    });
  };

  const ackOne = (id: string) => {
    if (id.startsWith('local-')) {
      setLocal(prev => prev.map(x => x.id === id ? { ...x, acknowledged: true } : x));
    } else {
      acknowledge(id);
    }
  };

  const filtered = allAlerts.filter(a => {
    if (filter === 'ALL')      return true;
    if (filter === 'UNREAD')   return !a.acknowledged;
    return a.severity === filter;
  });

  const unread    = allAlerts.filter(a => !a.acknowledged).length;
  const critical  = allAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warnings  = allAlerts.filter(a => a.severity === 'WARNING').length;
  const info      = allAlerts.filter(a => a.severity === 'INFO').length;

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Active Alerts</h1>
          <p style={S.subtitle}>Real-time alerts from sensors, hardware, and the AI prediction engine</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {unread > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#EF4444', fontFamily: "'Geist', sans-serif" }}>
              🔴 {unread} UNREAD
            </span>
          )}
          <button
            onClick={ackAll}
            style={{ background: 'rgba(183,243,74,0.08)', border: '1px solid rgba(183,243,74,0.25)', borderRadius: 8, color: '#B7F34A', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '8px 16px', fontFamily: "'Geist', sans-serif" }}>
            ✓ Acknowledge All
          </button>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Stat count={unread}   label="Unacknowledged" color="#EF4444" />
        <Stat count={critical} label="Critical"       color="#EF4444" />
        <Stat count={warnings} label="Warnings"       color="#F59E0B" />
        <Stat count={info}     label="Info"           color="#63D9FF" />
        <Stat count={allAlerts.length} label="Total Alerts" color="#8B9298" />
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 6, background: '#15181B', border: '1px solid #22252A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['ALL', 'UNREAD', 'CRITICAL', 'WARNING', 'INFO'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
              background: filter === f ? (f === 'CRITICAL' ? '#EF4444' : f === 'WARNING' ? '#F59E0B' : f === 'UNREAD' ? '#EF4444' : '#B7F34A') : 'transparent',
              color: filter === f ? '#0B0D0F' : '#8B9298',
            }}
          >
            {f === 'UNREAD' && unread > 0 ? `UNREAD (${unread})` : f}
          </button>
        ))}
      </div>

      {/* ── Alert list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '48px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
              {filter === 'ALL' ? 'No alerts at this time' : `No ${filter.toLowerCase()} alerts`}
            </div>
            <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 6 }}>
              All systems nominal. RAPID is monitoring in real-time.
            </div>
          </div>
        ) : (
          filtered.map(a => <AlertCard key={a.id} alert={a} onAck={ackOne} />)
        )}
      </div>

      {/* ── Alert sources guide ── */}
      <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 14 }}>
          📋 Alert Source Guide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { type: 'Water Level', trigger: 'Ultrasonic sensor on ESP32 reads > 50%, 65%, 80%', severity: 'CRITICAL' },
            { type: 'Pump Failure', trigger: 'Water rising despite pump on HIGH SPEED (sensor confirms)', severity: 'CRITICAL' },
            { type: 'Battery Low', trigger: 'Battery ADC reads < 30% charge', severity: 'WARNING' },
            { type: 'Rain Alert', trigger: 'Rain probability from WeatherAPI exceeds 60%', severity: 'WARNING' },
            { type: 'Sensor Fault', trigger: 'No new sensor readings in 30+ seconds', severity: 'WARNING' },
            { type: 'Hardware Offline', trigger: 'ESP32 Wokwi Bridge not responding', severity: 'CRITICAL' },
          ].map(row => (
            <div key={row.type} style={{ background: '#0B0D0F', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 4 }}>{row.type}</div>
              <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.5 }}>{row.trigger}</div>
              <div style={{ fontSize: 10, color: row.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B', fontFamily: "'Geist', sans-serif", marginTop: 4 }}>● {row.severity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', minHeight: '100vh', background: '#0B0D0F', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Geist', 'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", letterSpacing: '-0.02em' },
  subtitle: { margin: '5px 0 0', fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" },
};
