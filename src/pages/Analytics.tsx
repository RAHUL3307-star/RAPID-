import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Cell,
} from 'recharts';
import { useSensorData } from '../hooks/useSensorData';
import { useIsMobile } from '../hooks/useIsMobile';

/* ── Mini sparkline ── */
const Spark: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (values.length < 2) return <div style={{ width: 70, height: 24 }} />;
  const mn = Math.min(...values), mx = Math.max(...values);
  const r = mx - mn || 1;
  const pts = values.map((v, i) =>
    `${(i / (values.length - 1)) * 70},${24 - ((v - mn) / r) * 20}`
  ).join(' ');
  return (
    <svg width={70} height={24} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
};

/* ── Stat card ── */
interface StatCardProps {
  label: string; value: string; unit: string;
  badge: string; badgeColor: string;
  sub: string; sparkValues: number[]; sparkColor: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, unit, badge, badgeColor, sub, sparkValues, sparkColor }) => (
  <div style={{
    background: '#15181B', border: `1px solid ${badgeColor}20`, borderRadius: 14,
    padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6,
    position: 'relative', overflow: 'hidden', flex: 1, minWidth: 0,
  }}>
    <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: badgeColor, opacity: 0.06, filter: 'blur(16px)' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.1em', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: 9, color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}30`, padding: '2px 7px', borderRadius: 20, fontWeight: 700, fontFamily: "'Geist', sans-serif" }}>
        {badge}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: 28, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace", lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{unit}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.4 }}>{sub}</span>
      <Spark values={sparkValues} color={sparkColor} />
    </div>
  </div>
);

/* ── Chart card ── */
const ChartCard: React.FC<{ title: string; badge?: string; badgeColor?: string; children: React.ReactNode }> =
  ({ title, badge, badgeColor = '#63D9FF', children }) => (
  <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, overflow: 'hidden' }}>
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #22252A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>{title}</span>
      {badge && (
        <span style={{ fontSize: 10, color: badgeColor, background: `${badgeColor}12`, border: `1px solid ${badgeColor}22`, padding: '3px 10px', borderRadius: 20, fontFamily: "'Geist', sans-serif", fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ padding: '14px 10px 10px' }}>{children}</div>
  </div>
);

/* ── Tooltip ── */
const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A1D21', border: '1px solid #22252A', borderRadius: 10, padding: '9px 13px', fontFamily: "'Geist', sans-serif" }}>
      <div style={{ fontSize: 10, color: '#8B9298', marginBottom: 5 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 2 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#8B9298' }}>{p.name}:</span>
          <span style={{ color: p.color, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Pump Mode Badge ── */
const ModeBadge: React.FC<{ mode: string }> = ({ mode }) => {
  const map: Record<string, [string, string]> = {
    AUTO:      ['#B7F34A', 'rgba(183,243,74,0.08)'],
    MANUAL:    ['#63D9FF', 'rgba(99,217,255,0.08)'],
    IDLE:      ['#8B9298', 'rgba(139,146,152,0.08)'],
    EMERGENCY: ['#EF4444', 'rgba(239,68,68,0.08)'],
    HIGH:      ['#F97316', 'rgba(249,115,22,0.08)'],
    LOW:       ['#B7F34A', 'rgba(183,243,74,0.08)'],
    OFF:       ['#8B9298', 'rgba(139,146,152,0.08)'],
  };
  const key = mode?.toUpperCase() || 'IDLE';
  const [color, bg] = map[key] || map.IDLE;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: bg, border: `1px solid ${color}28`,
      padding: '3px 10px', borderRadius: 20, fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>
      {key}
    </span>
  );
};

/* ── Demo fallback rows ── */
const DEMO_ROWS = [
  { time: '14:35:42', water: '3.84', rain: '12.4', flow: '412', solar: '4.12', battery: '72', pumpPower: '45.2', mode: 'AUTO' },
  { time: '14:30:00', water: '3.80', rain: '12.0', flow: '488', solar: '4.08', battery: '73', pumpPower: '44.8', mode: 'MANUAL' },
  { time: '14:20:00', water: '3.75', rain: '11.5', flow: '400', solar: '4.08', battery: '74', pumpPower: '0.0',  mode: 'IDLE' },
  { time: '14:10:00', water: '3.92', rain: '14.2', flow: '425', solar: '3.92', battery: '71', pumpPower: '48.5', mode: 'EMERGENCY' },
  { time: '14:00:00', water: '3.95', rain: '15.0', flow: '430', solar: '3.50', battery: '70', pumpPower: '49.0', mode: 'AUTO' },
  { time: '13:50:00', water: '3.88', rain: '13.8', flow: '428', solar: '3.70', battery: '72', pumpPower: '46.0', mode: 'AUTO' },
  { time: '13:40:00', water: '3.82', rain: '12.2', flow: '410', solar: '4.05', battery: '73', pumpPower: '45.0', mode: 'AUTO' },
  { time: '13:30:00', water: '3.79', rain: '11.0', flow: '395', solar: '4.20', battery: '75', pumpPower: '0.0',  mode: 'IDLE' },
];

export const Analytics: React.FC = () => {
  const { readings } = useSensorData();
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const [station, setStation]     = useState('KRB-07');
  const isMobile = useIsMobile();

  // ── Derived data ──
  const data = readings.map((r, i) => {
    const date = r.created_at ? new Date(r.created_at) : new Date();
    return {
      day: `${date.getDate().toString().padStart(2, '0')} Oct`,
      idx: i + 1,
      water:   r.water_level,
      battery: r.battery_level,
      solar:   +(r.solar_power / 1000).toFixed(2),
      flow:    r.flow_rate,
      pump:    +(r.pump_power  / 1000).toFixed(2),
      rain:    r.rain_probability,
      pumpStatus: r.pump_status,
    };
  });

  // 7-day chart data (use readings if available, else simulate)
  const DAY_LABELS = ['06 Oct', '07 Oct', '08 Oct', '09 Oct', '10 Oct', '11 Oct', '12 Oct'];
  const chartData = DAY_LABELS.map((day, i) => {
    const idx = Math.min(Math.floor((i / 6) * (data.length - 1)), data.length - 1);
    const r = data[idx];
    return {
      day,
      water:   r ? +r.water.toFixed(2) : +(2.5 + Math.sin(i * 0.8) * 1.0 + i * 0.1).toFixed(2),
      rainfall:r ? +(r.rain / 10).toFixed(1) : +(8 + Math.cos(i * 0.6) * 3 + Math.random()).toFixed(1),
      solar:   r ? r.solar : +(3 + Math.sin(i * 1.2) * 1.2).toFixed(2),
      battery: r ? r.battery : +(65 + Math.sin(i * 0.5) * 8).toFixed(1),
      flow:    r ? r.flow : +(400 + Math.sin(i * 0.9) * 90 + Math.random() * 40).toFixed(0),
      pump:    r ? +(r.pump * 10).toFixed(0) : +(30 + Math.sin(i * 1.1) * 40).toFixed(0),
    };
  });



  // Summary stats
  const avgWater   = data.length ? (data.reduce((a, d) => a + d.water,   0) / data.length).toFixed(1) : '3.8';
  const maxWater   = data.length ? Math.max(...data.map(d => d.water)).toFixed(1) : '5.2';
  const avgSolar   = data.length ? (data.reduce((a, d) => a + d.solar,   0) / data.length).toFixed(1) : '4.1';
  const avgBattery = data.length ? (data.reduce((a, d) => a + d.battery, 0) / data.length).toFixed(0) : '72';
  const pumpHrs    = data.length ? Math.max(100, data.filter(d => d.pump > 0).length * 2).toString() : '142';

  const wSpark  = data.length ? data.map(d => d.water)   : [3.2,3.5,3.8,3.6,3.9,3.8];
  const mxSpark = data.length ? data.map(d => d.water)   : [4.5,4.8,5.0,5.2,5.1,5.2];
  const sSpark  = data.length ? data.map(d => d.solar)   : [3.5,4.0,4.2,3.8,4.1,4.1];
  const bSpark  = data.length ? data.map(d => d.battery) : [68,70,72,71,73,72];
  const pSpark  = data.length ? data.map(d => d.pump)    : [130,138,142,136,142,142];

  // Table rows
  const tableRows = readings.slice(0, 8).map(r => {
    const ts = r.created_at ? new Date(r.created_at) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      time:      `${pad(ts.getHours())}:${pad(ts.getMinutes())}:${pad(ts.getSeconds())}`,
      water:     r.water_level.toFixed(2),
      rain:      (r.rain_probability / 10).toFixed(1),
      flow:      r.flow_rate.toFixed(0),
      solar:     (r.solar_power / 1000).toFixed(2),
      battery:   r.battery_level.toFixed(0),
      pumpPower: (r.pump_power / 1000).toFixed(1),
      mode:      r.pump_status || 'AUTO',
    };
  });

  const tickStyle  = { fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" };
  const gridStyle  = { strokeDasharray: '3 3', stroke: '#22252A', strokeOpacity: 0.7 };
  const axisProps  = { tickLine: false, axisLine: false, tick: tickStyle };
  const chartMargin = { top: 8, right: 8, left: -18, bottom: 0 };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Analytics &amp; History</h1>
          <p style={S.subtitle}>Review historical sensor, water level, energy, and pump performance data</p>
        </div>
        <div style={S.controls}>
          <div style={S.ctrlGroup}>
            <span style={S.ctrlLabel}>Date Range:</span>
            <select style={S.ctrlSelect} value={dateRange} onChange={e => setDateRange(e.target.value)}>
              {['Last 7 Days', 'Last 30 Days', 'Last 90 Days'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={S.ctrlGroup}>
            <span style={S.ctrlLabel}>Station:</span>
            <select style={S.ctrlSelect} value={station} onChange={e => setStation(e.target.value)}>
              {['KRB-07', 'KRB-01', 'KRB-04'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button style={S.exportBtn}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={isMobile ? { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10 } : S.statsRow}>
        <StatCard label="AVERAGE WATER LEVEL" value={avgWater}   unit="m"   badge="OPTIMAL" badgeColor="#63D9FF" sub="↑ +9.1m vs last week"             sparkValues={wSpark}  sparkColor="#63D9FF" />
        <StatCard label="MAXIMUM WATER LEVEL" value={maxWater}   unit="m"   badge="HIGH"    badgeColor="#EF4444" sub="⚠ Approaching critical threshold" sparkValues={mxSpark} sparkColor="#EF4444" />
        <StatCard label="SOLAR ENERGY"        value={avgSolar}   unit="kWh" badge="ACTIVE"  badgeColor="#F59E0B" sub="☀ 98% battery conversion rate"    sparkValues={sSpark}  sparkColor="#F59E0B" />
        <StatCard label="BATTERY LEVEL"       value={avgBattery} unit="%"   badge="HEALTHY" badgeColor="#B7F34A" sub="⚡ Est. 18.5h backup life"         sparkValues={bSpark}  sparkColor="#B7F34A" />
        <StatCard label="PUMP RUNTIME"        value={pumpHrs}    unit="h"   badge="NOMINAL" badgeColor="#A78BFA" sub="✓ -4.2h cycles vs avg"             sparkValues={pSpark}  sparkColor="#A78BFA" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 14 } : S.chartsGrid}>
        <ChartCard title="Water Level vs Rainfall" badge="● Water Level (m)  ● Rainfall (mm)" badgeColor="#63D9FF">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={chartMargin}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={5.0} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value: 'CRITICAL RANKING LIMIT : 5.0m', position: 'insideTopLeft', fill: '#EF4444', fontSize: 9, dy: -6 }} />
                <Line type="monotone" dataKey="water"    name="Water Level (m)" stroke="#63D9FF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)"   stroke="#B7F34A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Energy Overview" badge="● Solar (kW)  ● Battery (%)" badgeColor="#F59E0B">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={chartMargin}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="solar"   name="Solar (kW)"  stroke="#F59E0B" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="battery" name="Battery (%)" stroke="#B7F34A" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 14 } : S.chartsGrid}>
        <ChartCard title="Flow Rate Trend (L/s)" badge="● Primary Flow Segment" badgeColor="#63D9FF">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={chartMargin}>
                <defs>
                  <linearGradient id="flowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#63D9FF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#63D9FF" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="flow" name="Flow (L/s)" stroke="#63D9FF" fill="url(#flowG)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Pump Load Distribution" badge="● Loading (%)" badgeColor="#B7F34A">
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ ...chartMargin, left: -10 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="day" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="pump" name="Load (%)" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={+d.pump > 80 ? '#EF4444' : +d.pump > 50 ? '#F59E0B' : '#B7F34A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* ── Telemetry Log History ── */}
      <div style={S.tableCard}>
        <div style={S.tableHeader}>
          <span style={S.tableTitle}>Telemetry Log History</span>
          <div style={S.autoRefresh}>
            <div style={S.autoRefreshDot} />
            <span style={{ fontSize: 10, color: '#B7F34A', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.06em' }}>
              AUTO_REFRESH ON
            </span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ borderBottom: '1px solid #22252A' }}>
                {['Timestamp', 'Water Level', 'Rainfall', 'Flow Rate', 'Solar', 'Battery', 'Pump Power', 'Pump Mode'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tableRows.length ? tableRows : DEMO_ROWS).map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #1A1D21', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ ...S.td, color: '#B7F34A', fontFamily: "'Geist Mono', monospace" }}>{row.time}</td>
                  <td style={S.td}><span style={{ color: '#63D9FF', fontFamily: "'Geist Mono', monospace" }}>{row.water}</span> <span style={S.unit}>m</span></td>
                  <td style={S.td}><span style={{ color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{row.rain}</span> <span style={S.unit}>mm</span></td>
                  <td style={S.td}><span style={{ color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{row.flow}</span> <span style={S.unit}>L/s</span></td>
                  <td style={S.td}><span style={{ color: '#F59E0B', fontFamily: "'Geist Mono', monospace" }}>{row.solar}</span> <span style={S.unit}>kW</span></td>
                  <td style={S.td}><span style={{ color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{row.battery}</span> <span style={S.unit}>%</span></td>
                  <td style={S.td}><span style={{ color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{row.pumpPower}</span> <span style={S.unit}>kW</span></td>
                  <td style={{ ...S.td, paddingRight: 20 }}><ModeBadge mode={row.mode} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px 32px',
    minHeight: '100vh',
    background: '#0B0D0F',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  title:  { margin: 0, fontFamily: "'Geist', sans-serif", fontWeight: 700, fontSize: 26, color: '#F5F7F2', letterSpacing: '-0.02em' },
  subtitle: { margin: '5px 0 0', fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif" },

  controls: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  ctrlGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  ctrlLabel: { fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", whiteSpace: 'nowrap' },
  ctrlSelect: {
    background: '#15181B', border: '1px solid #22252A', borderRadius: 8,
    color: '#F5F7F2', fontSize: 12, padding: '6px 10px',
    fontFamily: "'Geist', sans-serif", cursor: 'pointer', outline: 'none',
  },
  exportBtn: {
    display: 'flex', alignItems: 'center', background: 'rgba(183,243,74,0.1)',
    border: '1px solid rgba(183,243,74,0.3)', borderRadius: 8,
    color: '#B7F34A', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    padding: '7px 14px', fontFamily: "'Geist', sans-serif", transition: 'all 0.2s',
  },

  statsRow: { display: 'flex', gap: 14 },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },

  // Table
  tableCard: { background: '#15181B', border: '1px solid #22252A', borderRadius: 14, overflow: 'hidden' },
  tableHeader: { padding: '14px 18px', borderBottom: '1px solid #22252A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" },
  autoRefresh: { display: 'flex', alignItems: 'center', gap: 6 },
  autoRefreshDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 5px #B7F34A' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: '10px 14px', fontSize: 10, color: '#8B9298',
    fontFamily: "'Geist', sans-serif", fontWeight: 600,
    letterSpacing: '0.06em', textAlign: 'left' as const,
  },
  td: { padding: '11px 14px', fontSize: 12, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", verticalAlign: 'middle' as const },
  unit: { fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" },
};
