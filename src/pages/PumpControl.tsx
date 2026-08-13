import React, { useState, useEffect, useCallback } from 'react';
import { useSensorData }  from '../hooks/useSensorData';
import { usePredictions } from '../hooks/usePredictions';
import { supabase, isDemoMode } from '../lib/supabaseClient';
import { useIsMobile } from '../hooks/useIsMobile';

/* ─────────────────────────────────────────────────────────────
   PumpControl Page
   • Manual override — send OFF / LOW / HIGH commands to ESP32
   • Auto mode — AI decides based on water level + rain prob.
   • Real-time feedback from sensor readings
   • When connected to real ESP32 via Supabase bridge, commands
     are written to `pump_commands` table and the ESP32 polls it.
───────────────────────────────────────────────────────────── */

type PumpMode = 'OFF' | 'LOW' | 'HIGH';

/* ── Send command to Supabase (ESP32 reads this table) ── */
async function sendPumpCommand(mode: PumpMode, source: 'AI' | 'MANUAL', note?: string) {
  if (isDemoMode || !supabase) {
    console.log(`[PumpControl] Demo mode — simulated command: ${mode} (${source})`);
    return true;
  }
  const { error } = await supabase.from('pump_commands').insert([{
    command: mode,
    source,
    operator_note: note || null,
  }]);
  if (error) {
    console.error('[PumpControl] Failed to send command:', error.message);
    return false;
  }
  return true;
}

/* ── Animated pump status indicator ── */
const PumpIndicator: React.FC<{ mode: PumpMode; running: boolean }> = ({ mode, running }) => {
  const color = mode === 'HIGH' ? '#EF4444' : mode === 'LOW' ? '#B7F34A' : '#8B9298';
  return (
    <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer pulse ring — only when running */}
      {running && (
        <>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${color}`, opacity: 0, animation: 'pumpPulse 1.5s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: `2px solid ${color}`, opacity: 0, animation: 'pumpPulse 1.5s ease-out infinite 0.5s' }} />
        </>
      )}
      {/* Inner circle */}
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${color}18`, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s ease' }}>
        <div style={{ fontSize: 28, animation: running ? 'spin 2s linear infinite' : 'none' }}>⚙️</div>
      </div>
      {/* Mode label */}
      <div style={{ position: 'absolute', bottom: -4, left: 0, right: 0, textAlign: 'center', fontSize: 11, fontWeight: 700, color, fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em' }}>
        {mode === 'OFF' ? 'STANDBY' : mode === 'LOW' ? 'LOW SPEED' : 'HIGH SPEED'}
      </div>
    </div>
  );
};

/* ── Water level bar ── */
const WaterBar: React.FC<{ pct: number }> = ({ pct }) => {
  const color = pct >= 80 ? '#EF4444' : pct >= 60 ? '#F97316' : pct >= 40 ? '#F59E0B' : '#63D9FF';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>Mine Water Level</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Geist Mono', monospace" }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 12, background: '#1A1D21', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
        {/* Danger threshold marker */}
        <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: 2, background: '#EF4444', zIndex: 1, opacity: 0.7 }} />
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #63D9FF, ${color})`, borderRadius: 6, transition: 'width 1s ease, background 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>0%</span>
        <span style={{ fontSize: 9, color: '#EF4444', fontFamily: "'Geist', sans-serif" }}>⚠ 80% Danger</span>
        <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>100%</span>
      </div>
    </div>
  );
};

/* ── Mode button ── */
const ModeBtn: React.FC<{
  mode: PumpMode; currentMode: PumpMode; onClick: () => void;
  label: string; desc: string; color: string; disabled?: boolean;
}> = ({ mode, currentMode, onClick, label, desc, color, disabled }) => {
  const isActive = currentMode === mode;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        border: `2px solid ${isActive ? color : `${color}30`}`,
        background: isActive ? `${color}15` : '#15181B',
        borderRadius: 14,
        padding: '20px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        textAlign: 'left' as const,
        opacity: disabled ? 0.5 : 1,
        boxShadow: isActive ? `0 0 20px ${color}25` : 'none',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? color : '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.1em', marginBottom: 6 }}>
        {isActive && '● '}{label}
      </div>
      <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.5 }}>{desc}</div>
      {isActive && (
        <div style={{ marginTop: 10, fontSize: 10, color, fontFamily: "'Geist Mono', monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', animation: 'pulseDot 1s infinite' }} />
          ACTIVE
        </div>
      )}
    </button>
  );
};

export const PumpControl: React.FC = () => {
  const { readings, latest, hardwareMode, bridgeStatus } = useSensorData();
  const { decision } = usePredictions(readings);

  const [manualMode, setManualMode]     = useState(false);
  const [targetMode, setTargetMode]     = useState<PumpMode>('OFF');
  const [currentMode, setCurrentMode]   = useState<PumpMode>('OFF');
  const [sending, setSending]           = useState(false);
  const [lastCmd, setLastCmd]           = useState<{ mode: PumpMode; time: Date } | null>(null);
  const [cmdLog, setCmdLog]             = useState<Array<{ mode: string; source: string; time: Date; success: boolean }>>([]);
  const [note, setNote]                 = useState('');

  // Mirror hardware pump status
  useEffect(() => {
    if (!manualMode && latest?.pump_status) {
      setCurrentMode(latest.pump_status as PumpMode);
    }
  }, [latest, manualMode]);

  // AI recommended mode
  const aiMode: PumpMode =
    decision?.riskLevel === 'CRITICAL' ? 'HIGH' :
    decision?.riskLevel === 'HIGH'     ? 'HIGH' :
    decision?.riskLevel === 'MEDIUM'   ? 'LOW'  : 'OFF';

  const waterLevel   = latest?.water_level   ?? 0;
  const battery      = latest?.battery_level ?? 0;
  const rainProb     = latest?.rain_probability ?? 0;
  const pumpPower    = latest?.pump_power    ?? 0;

  const handleSendCommand = useCallback(async (mode: PumpMode) => {
    setSending(true);
    const ok = await sendPumpCommand(mode, manualMode ? 'MANUAL' : 'AI', note || undefined);
    const entry = { mode, source: manualMode ? 'MANUAL' : 'AI', time: new Date(), success: ok };
    setCmdLog(prev => [entry, ...prev].slice(0, 10));
    if (ok) {
      setCurrentMode(mode);
      setLastCmd({ mode, time: new Date() });
    }
    setSending(false);
    setNote('');
  }, [manualMode, note]);

  const riskColor = { LOW: '#B7F34A', MEDIUM: '#F59E0B', HIGH: '#F97316', CRITICAL: '#EF4444' };
  const rc = riskColor[decision?.riskLevel ?? 'LOW'];
  const isMobile = useIsMobile();

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Pump Control</h1>
          <p style={S.subtitle}>Manual override &amp; AI-automated pump management · Connected to ESP32 hardware</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {hardwareMode ? (
            <span style={{ ...S.chip, color: bridgeStatus === 'connected' ? '#B7F34A' : '#EF4444', borderColor: bridgeStatus === 'connected' ? 'rgba(183,243,74,0.3)' : 'rgba(239,68,68,0.3)', background: bridgeStatus === 'connected' ? 'rgba(183,243,74,0.08)' : 'rgba(239,68,68,0.08)' }}>
              {bridgeStatus === 'connected' ? '● HARDWARE CONNECTED' : '● HARDWARE DISCONNECTED'}
            </span>
          ) : (
            <span style={{ ...S.chip, color: '#A78BFA', borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.08)' }}>
              ⚡ DEMO MODE
            </span>
          )}
        </div>
      </div>

      {/* ── Main row ── */}
      <div style={{ ...S.mainRow, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Left: Pump status + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1.5 }}>

          {/* Pump indicator card */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <PumpIndicator mode={currentMode} running={currentMode !== 'OFF'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.1em', marginBottom: 6 }}>PUMP STATUS</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: currentMode === 'OFF' ? '#8B9298' : currentMode === 'HIGH' ? '#EF4444' : '#B7F34A', fontFamily: "'Geist Mono', monospace" }}>
                  {currentMode === 'OFF' ? 'STANDBY' : currentMode === 'LOW' ? 'LOW SPEED' : 'HIGH SPEED'}
                </div>
                {lastCmd && (
                  <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 6 }}>
                    Last command: <span style={{ color: '#B7F34A' }}>{lastCmd.mode}</span> at {lastCmd.time.toLocaleTimeString()}
                  </div>
                )}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif' " }}>POWER DRAW</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', fontFamily: "'Geist Mono', monospace" }}>{(pumpPower / 1000).toFixed(2)} kW</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>MODE SOURCE</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: manualMode ? '#63D9FF' : '#B7F34A', fontFamily: "'Geist Mono', monospace" }}>
                        {manualMode ? 'MANUAL' : 'AI AUTO'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode toggle: AUTO vs MANUAL */}
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>Control Mode</div>
              <div style={{ display: 'flex', background: '#0B0D0F', borderRadius: 10, padding: 3, gap: 2 }}>
                <button
                  onClick={() => setManualMode(false)}
                  style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: !manualMode ? '#B7F34A' : 'transparent', color: !manualMode ? '#0B0D0F' : '#8B9298' }}>
                  🤖 AUTO (AI)
                </button>
                <button
                  onClick={() => setManualMode(true)}
                  style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: manualMode ? '#63D9FF' : 'transparent', color: manualMode ? '#0B0D0F' : '#8B9298' }}>
                  🖐 MANUAL
                </button>
              </div>
            </div>

            {!manualMode ? (
              <div style={{ background: '#0B0D0F', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 8 }}>AI RECOMMENDATION</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: rc, fontFamily: "'Geist Mono', monospace" }}>{aiMode}</div>
                    <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 3 }}>
                      Risk: <span style={{ color: rc }}>{decision?.riskLevel ?? 'LOW'}</span> · {decision?.recommendedAction ?? 'System normal'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendCommand(aiMode)}
                    disabled={sending}
                    style={{ background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: "'Geist', sans-serif", opacity: sending ? 0.6 : 1 }}>
                    {sending ? 'Sending…' : '✓ Apply AI Mode'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <ModeBtn mode="OFF"  currentMode={targetMode} onClick={() => setTargetMode('OFF')}  label="OFF / STANDBY" desc="No pumping. System idle. Use when water level is safe."                 color="#8B9298" />
                  <ModeBtn mode="LOW"  currentMode={targetMode} onClick={() => setTargetMode('LOW')}  label="LOW SPEED"     desc="30% capacity. Gentle drainage. Use for moderate water levels."       color="#B7F34A" />
                  <ModeBtn mode="HIGH" currentMode={targetMode} onClick={() => setTargetMode('HIGH')} label="HIGH SPEED"    desc="Full capacity emergency pumping. Use for critical water levels."    color="#EF4444" />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Optional operator note…"
                    style={{ ...S.input, flex: 1 }}
                  />
                  <button
                    onClick={() => handleSendCommand(targetMode)}
                    disabled={sending}
                    style={{ background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: "'Geist', sans-serif", opacity: sending ? 0.6 : 1, whiteSpace: 'nowrap' as const }}>
                    {sending ? 'Sending…' : `⚡ Set ${targetMode}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Water Level */}
          <div style={S.card}>
            <WaterBar pct={waterLevel} />
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              {[
                { label: 'Water Level',   val: `${waterLevel.toFixed(1)}%`,    color: waterLevel >= 80 ? '#EF4444' : '#63D9FF' },
                { label: 'Rain Prob.',    val: `${rainProb.toFixed(0)}%`,       color: rainProb >= 70 ? '#EF4444' : '#F59E0B' },
                { label: 'Battery',       val: `${battery.toFixed(0)}%`,        color: battery < 20 ? '#EF4444' : '#B7F34A' },
                { label: 'Pump Power',    val: `${(pumpPower / 1000).toFixed(2)} kW`, color: '#F59E0B' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: '#0B0D0F', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: "'Geist Mono', monospace" }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Command log + auto thresholds info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          {/* Auto-trigger thresholds */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 12 }}>AI Auto-Trigger Rules</div>
            {[
              { condition: 'Water ≥ 80% OR Rain ≥ 80%', action: 'HIGH SPEED', color: '#EF4444' },
              { condition: 'Water ≥ 60% OR Rain ≥ 60%', action: 'HIGH SPEED', color: '#F97316' },
              { condition: 'Water ≥ 40% OR Rain ≥ 40%', action: 'LOW SPEED',  color: '#F59E0B' },
              { condition: 'Water < 40% AND Rain < 40%', action: 'STANDBY',   color: '#8B9298' },
            ].map(r => (
              <div key={r.condition} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1A1D21' }}>
                <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{r.condition}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.color, background: `${r.color}12`, border: `1px solid ${r.color}25`, padding: '3px 10px', borderRadius: 20, fontFamily: "'Geist', sans-serif" }}>{r.action}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.6 }}>
              💡 When in AUTO mode, the AI monitors water level + rain probability every 3 seconds and issues pump commands automatically to the ESP32.
            </div>
          </div>

          {/* Command log */}
          <div style={S.card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 12 }}>Command History</div>
            {cmdLog.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", padding: '16px 0', textAlign: 'center' as const }}>
                No commands sent yet. Issue a command above.
              </div>
            ) : (
              cmdLog.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1D21' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.mode === 'HIGH' ? '#EF4444' : c.mode === 'LOW' ? '#B7F34A' : '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{c.mode}</span>
                    <span style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginLeft: 8 }}>via {c.source}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: c.success ? '#B7F34A' : '#EF4444' }}>{c.success ? '✓ Sent' : '✗ Failed'}</span>
                    <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{c.time.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ESP32 connection info */}
          <div style={{ ...S.card, border: '1px solid rgba(99,217,255,0.2)', background: 'rgba(99,217,255,0.03)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#63D9FF', fontFamily: "'Geist', sans-serif", marginBottom: 8 }}>
              📡 ESP32 Hardware Connection
            </div>
            <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.8 }}>
              <strong style={{ color: '#F5F7F2' }}>How commands reach the hardware:</strong><br />
              1. Click a pump mode → written to <code style={S.code}>pump_commands</code> table in Supabase<br />
              2. ESP32 polls this table every 2 seconds via WiFi<br />
              3. ESP32 reads the latest command and activates/deactivates the pump relay<br />
              4. Sensor readings flow back via <code style={S.code}>sensor_readings</code> table<br />
              <br />
              Enable <strong style={{ color: '#F5F7F2' }}>Hardware Mode</strong> in System Settings to connect the Wokwi Bridge.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pumpPulse { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', minHeight: '100vh', background: '#0B0D0F', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Geist', 'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", letterSpacing: '-0.02em' },
  subtitle: { margin: '5px 0 0', fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" },
  chip: { fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 100, border: '1px solid', fontFamily: "'Geist', sans-serif", letterSpacing: '0.05em' },
  mainRow: { display: 'flex', gap: 18, alignItems: 'flex-start' },
  card: { background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '18px 20px' },
  input: { background: '#0B0D0F', border: '1px solid #22252A', borderRadius: 8, color: '#F5F7F2', fontSize: 12, padding: '8px 12px', fontFamily: "'Geist', sans-serif", outline: 'none' },
  code: { color: '#B7F34A', background: '#0B0D0F', padding: '1px 5px', borderRadius: 4, fontFamily: "'Geist Mono', monospace", fontSize: 10 },
};
