import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useSensorData } from '../hooks/useSensorData';
import { useIsMobile } from '../hooks/useIsMobile';

/* ─────────────────────────────────────────────────────────────
   SolarEnergy Page
   • Solar panel output (current wattage, % of max)
   • Battery charge level + estimated runtime for pump
   • Energy history over last readings
   • How long can the pump run on solar / battery alone
───────────────────────────────────────────────────────────── */

/* ── Constants (configure to match actual hardware) ── */
const SOLAR_PANEL_MAX_W  = 1200;  // Peak solar output watts
const BATTERY_CAPACITY_WH = 2400; // Battery total capacity in Wh
const PUMP_POWER_HIGH_W  = 610;   // Pump draw at HIGH speed
const PUMP_POWER_LOW_W   = 300;   // Pump draw at LOW speed

/* ── Animated solar ring ── */
const SolarRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 56, c = 2 * Math.PI * r;
  const color = pct > 60 ? '#F59E0B' : pct > 30 ? '#F97316' : '#8B9298';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="#22252A" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }} />
        {/* Animated glow for high solar */}
        {pct > 50 && (
          <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={3}
            opacity={0.2} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            transform="rotate(-90 70 70)" style={{ filter: 'blur(4px)' }} />
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>{pct.toFixed(0)}%</span>
        <span style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>of {SOLAR_PANEL_MAX_W}W</span>
      </div>
    </div>
  );
};

/* ── Battery bar ── */
const BatteryBar: React.FC<{ pct: number }> = ({ pct }) => {
  const color = pct > 50 ? '#B7F34A' : pct > 20 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>Battery Charge</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'Geist Mono', monospace" }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 14, background: '#1A1D21', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
        {/* Segment lines */}
        {[25, 50, 75].map(mark => (
          <div key={mark} style={{ position: 'absolute', left: `${mark}%`, top: 0, bottom: 0, width: 1, background: '#0B0D0F', zIndex: 1 }} />
        ))}
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${pct < 20 ? '#EF4444' : '#B7F34A'}, ${color})`,
          borderRadius: 7, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: '#EF4444', fontFamily: "'Geist', sans-serif" }}>⚠ 20% Critical</span>
        <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>100% Full</span>
      </div>
    </div>
  );
};

/* ── Metric card ── */
const MetricCard: React.FC<{ icon: string; label: string; value: string; sub?: string; color: string }> = ({
  icon, label, value, sub, color,
}) => (
  <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '18px 20px', flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 9, color, background: `${color}15`, border: `1px solid ${color}25`, padding: '2px 8px', borderRadius: 20, fontWeight: 700, fontFamily: "'Geist', sans-serif" }}>LIVE</span>
    </div>
    <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 4 }}>{sub}</div>}
  </div>
);

/* ── Runtime estimate row ── */
const RuntimeRow: React.FC<{ label: string; hours: number; max: number; color: string }> = ({
  label, hours, max, color,
}) => (
  <div style={{ padding: '12px 0', borderBottom: '1px solid #1A1D21' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Geist Mono', monospace" }}>
        {hours >= 100 ? '∞' : `${hours.toFixed(1)} hrs`}
      </span>
    </div>
    <div style={{ height: 6, background: '#1A1D21', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min((hours / max) * 100, 100)}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
    </div>
  </div>
);

/* ── Custom tooltip ── */
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A1D21', border: '1px solid #22252A', borderRadius: 10, padding: '8px 12px', fontFamily: "'Geist', sans-serif" }}>
      <div style={{ fontSize: 10, color: '#8B9298', marginBottom: 4 }}>Reading #{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: 11, color: p.color, fontFamily: "'Geist Mono', monospace" }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

export const SolarEnergy: React.FC = () => {
  const { readings, latest } = useSensorData();
  const isMobile = useIsMobile();

  const solarW    = latest?.solar_power    ?? 0;
  const battPct   = latest?.battery_level  ?? 0;
  const pumpPow   = latest?.pump_power     ?? 0;
  const pumpMode  = latest?.pump_status    ?? 'OFF';

  const solarPct  = (solarW / SOLAR_PANEL_MAX_W) * 100;
  const battWh    = (battPct / 100) * BATTERY_CAPACITY_WH;

  // ── Runtime calculations ──
  const netSolar  = Math.max(0, solarW - pumpPow);  // Solar after powering pump
  const pumpOnHighW = PUMP_POWER_HIGH_W;
  const pumpOnLowW  = PUMP_POWER_LOW_W;

  // Battery only runtime
  const battRunHigh = pumpOnHighW > 0 ? battWh / pumpOnHighW : 999;
  const battRunLow  = pumpOnLowW  > 0 ? battWh / pumpOnLowW  : 999;

  // Solar + battery runtime
  const solarSupportHigh = Math.max(0, solarW - pumpOnHighW); // extra charging when pump on high
  const solarSupportLow  = Math.max(0, solarW - pumpOnLowW);

  const totalRunHigh = solarSupportHigh > 0
    ? battRunHigh + (solarSupportHigh / pumpOnHighW) * 24  // simplified: days of extension
    : battRunHigh;
  const totalRunLow  = solarSupportLow  > 0 ? 999 : battRunLow; // often infinite on solar

  const chargeTime = battPct < 100 && solarW > pumpPow
    ? ((100 - battPct) / 100 * BATTERY_CAPACITY_WH) / netSolar
    : 0;

  // ── History data ──
  const histData = readings.slice(-20).map((r, i) => ({
    t: i,
    solar: +(r.solar_power / 1000).toFixed(2),
    battery: +r.battery_level.toFixed(1),
    pump: +(r.pump_power / 1000).toFixed(2),
  }));

  const tickStyle = { fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" };
  const gridStyle = { strokeDasharray: '3 3', stroke: '#22252A', strokeOpacity: 0.6 };
  const axisProps = { tickLine: false, axisLine: false, tick: tickStyle };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Solar &amp; Battery Grid</h1>
          <p style={S.subtitle}>Real-time solar panel output, battery charge, and pump runtime estimates</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {solarW > 200 && (
            <span style={S.solarChip}>☀️ SOLAR ACTIVE</span>
          )}
        </div>
      </div>

      {/* ── Top metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 14 }}>
        <MetricCard icon="☀️" label="SOLAR OUTPUT"   value={`${solarW.toFixed(0)} W`}      sub={`${solarPct.toFixed(0)}% of max capacity`} color="#F59E0B" />
        <MetricCard icon="🔋" label="BATTERY LEVEL"  value={`${battPct.toFixed(1)}%`}       sub={`${battWh.toFixed(0)} Wh stored`}          color="#B7F34A" />
        <MetricCard icon="⚡" label="PUMP POWER DRAW" value={`${(pumpPow / 1000).toFixed(2)} kW`} sub={`Mode: ${pumpMode}`}                color="#F97316" />
        <MetricCard icon="📊" label="NET SOLAR SURPLUS" value={`${(netSolar / 1000).toFixed(2)} kW`} sub={netSolar > 0 ? 'Charging battery' : 'Drawing from battery'} color="#63D9FF" />
      </div>

      {/* ── Middle row ── */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
        {/* Solar ring + battery bar */}
        <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>Solar Panel Output</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <SolarRing pct={solarPct} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#F59E0B', fontFamily: "'Geist Mono', monospace" }}>
                {solarW.toFixed(0)}<span style={{ fontSize: 16, color: '#8B9298', fontWeight: 400 }}>W</span>
              </div>
              <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 4 }}>
                Peak capacity: {SOLAR_PANEL_MAX_W}W
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Status', val: solarW > 600 ? 'PEAK OUTPUT' : solarW > 200 ? 'PARTIAL' : 'LOW / NIGHT', color: solarW > 600 ? '#B7F34A' : '#F59E0B' },
                  { label: 'Inverter Eff.', val: '96.8%', color: '#63D9FF' },
                  { label: 'Daily Est.',    val: `${((solarPct / 100) * SOLAR_PANEL_MAX_W * 5 / 1000).toFixed(1)} kWh`, color: '#F5F7F2' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.color, fontFamily: "'Geist Mono', monospace" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <BatteryBar pct={battPct} />
        </div>

        {/* Pump runtime estimates */}
        <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '24px', flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 16 }}>
            Pump Runtime Estimates
          </div>
          <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 16, lineHeight: 1.6 }}>
            How long can the pump run from current energy sources?
          </div>
          <RuntimeRow label="Battery only — HIGH speed"      hours={battRunHigh} max={12} color="#EF4444" />
          <RuntimeRow label="Battery only — LOW speed"       hours={battRunLow}  max={24} color="#F59E0B" />
          <RuntimeRow label="Solar + Battery — HIGH speed"   hours={Math.min(totalRunHigh, 48)} max={48} color="#F97316" />
          <RuntimeRow label="Solar + Battery — LOW speed"    hours={totalRunLow > 900 ? 48 : totalRunLow} max={48} color="#B7F34A" />

          <div style={{ marginTop: 16, background: '#0B0D0F', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 6 }}>RECHARGE TIME</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: chargeTime > 0 ? '#63D9FF' : '#B7F34A', fontFamily: "'Geist Mono', monospace" }}>
              {chargeTime > 0 ? `${chargeTime.toFixed(1)} hrs` : 'Battery Full'}
            </div>
            <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 3 }}>
              Estimated time to full charge from current solar surplus
            </div>
          </div>
        </div>
      </div>

      {/* ── Energy history chart ── */}
      <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>Energy History (last 20 readings)</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[['#F59E0B', 'Solar (kW)'], ['#B7F34A', 'Battery (%)'], ['#F97316', 'Pump (kW)']].map(([color, label]) => (
              <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} />
                {label as string}
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={histData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="t" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="solar"   name="Solar (kW)"   stroke="#F59E0B" strokeWidth={2}   dot={false} />
              <Line type="monotone" dataKey="battery" name="Battery (%)"  stroke="#B7F34A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="pump"    name="Pump Draw (kW)" stroke="#F97316" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── System info ── */}
      <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 14 }}>
          System Configuration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Solar Panel Max',       val: `${SOLAR_PANEL_MAX_W} W` },
            { label: 'Battery Capacity',      val: `${BATTERY_CAPACITY_WH} Wh` },
            { label: 'Pump (HIGH) Draw',       val: `${PUMP_POWER_HIGH_W} W` },
            { label: 'Pump (LOW) Draw',        val: `${PUMP_POWER_LOW_W} W` },
          ].map(c => (
            <div key={c.label} style={{ background: '#0B0D0F', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>{c.val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.6 }}>
          💡 These constants match the RAPID hardware specification. Update <code style={{ color: '#B7F34A', background: '#0B0D0F', padding: '1px 5px', borderRadius: 3 }}>SolarEnergy.tsx</code> constants if your hardware specs differ.
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
  solarChip: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: '#F59E0B', fontFamily: "'Geist', sans-serif" },
};
