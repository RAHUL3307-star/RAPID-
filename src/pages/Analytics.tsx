import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { useSensorData } from '../hooks/useSensorData';

// ── Animated stat card ────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string; color: string; icon: string;
}> = ({ label, value, color, icon }) => (
  <div style={{
    background: '#15181B',
    border: `1px solid ${color}25`,
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}15`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
    }}
  >
    {/* Background glow */}
    <div style={{
      position: 'absolute', top: -20, right: -20, width: 80, height: 80,
      borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(20px)',
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontSize: 16, width: 30, height: 30, borderRadius: 8,
        background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
    </div>
    <div style={{
      fontSize: 28, fontWeight: 700, color, fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
      letterSpacing: '-0.02em', position: 'relative', zIndex: 1,
    }}>
      {value}
    </div>
  </div>
);

// ── Chart card wrapper ─────────────────────────────────────────────────────
const ChartCard: React.FC<{
  title: string; children: React.ReactNode; badge?: string; badgeColor?: string;
}> = ({ title, children, badge, badgeColor = '#B7F34A' }) => (
  <div style={{
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 14,
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '18px 24px',
      borderBottom: '1px solid #22252A',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{
        fontSize: 15, fontWeight: 600, color: '#F5F7F2',
        fontFamily: "'Geist', sans-serif",
      }}>
        {title}
      </span>
      {badge && (
        <span style={{
          fontSize: 11, color: badgeColor,
          background: `${badgeColor}12`,
          border: `1px solid ${badgeColor}25`,
          padding: '3px 10px', borderRadius: 20,
          fontFamily: "'Geist', sans-serif", fontWeight: 600,
        }}>
          {badge}
        </span>
      )}
    </div>
    <div style={{ padding: '20px 12px 12px' }}>
      {children}
    </div>
  </div>
);

// ── Custom chart tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#15181B', border: '1px solid #22252A', borderRadius: 10,
      padding: '10px 14px', fontFamily: "'Geist', sans-serif",
    }}>
      <div style={{ fontSize: 11, color: '#8B9298', marginBottom: 6 }}>Reading #{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#8B9298' }}>{p.name}:</span>
          <span style={{ color: p.color, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { readings } = useSensorData();

  const data = readings.map((r, i) => ({
    idx:      i + 1,
    water:    r.water_level,
    battery:  r.battery_level,
    solar:    r.solar_power,
    flow:     r.flow_rate,
    pump:     r.pump_power,
    rain:     r.rain_probability,
  }));

  const avgWater   = data.length ? (data.reduce((a, d) => a + d.water,   0) / data.length).toFixed(1) : '0';
  const avgSolar   = data.length ? (data.reduce((a, d) => a + d.solar,   0) / data.length).toFixed(0) : '0';
  const avgBattery = data.length ? (data.reduce((a, d) => a + d.battery, 0) / data.length).toFixed(1) : '0';
  const maxWater   = data.length ? Math.max(...data.map(d => d.water)).toFixed(1) : '0';
  const pumpHours  = (data.filter(d => d.pump > 0).length * 3 / 3600).toFixed(2);

  const chartProps = {
    margin: { top: 8, right: 8, left: -22, bottom: 0 },
  };

  const gridProps = { strokeDasharray: '3 3', stroke: '#22252A', strokeOpacity: 0.8 };
  const tickProps = { fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" };
  const axisProps = { tickLine: false, axisLine: false, tick: tickProps };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Analytics & History</h1>
          <p style={S.pageSubtitle}>
            Historical trends, energy analysis, and operational statistics
          </p>
        </div>
        <div style={S.headerBadge}>
          <div style={S.liveIndicator} />
          <span style={{ fontSize: 12, color: '#B7F34A', fontFamily: "'Geist', sans-serif", fontWeight: 600 }}>
            {data.length} readings logged
          </span>
        </div>
      </div>

      {/* ── Summary stats row ── */}
      <div style={S.statsRow}>
        <StatCard label="AVG WATER LEVEL" value={`${avgWater}%`}      color="#63D9FF" icon="💧" />
        <StatCard label="MAX WATER LEVEL" value={`${maxWater}%`}      color="#EF4444" icon="⚠️" />
        <StatCard label="AVG SOLAR POWER" value={`${avgSolar} W`}     color="#F59E0B" icon="☀️" />
        <StatCard label="AVG BATTERY"     value={`${avgBattery}%`}    color="#B7F34A" icon="🔋" />
        <StatCard label="PUMP RUNTIME"    value={`${pumpHours} hrs`}  color="#A78BFA" icon="⚙️" />
      </div>

      {/* ── Charts grid ── */}
      <div style={S.chartsGrid}>

        {/* Water Level vs Rain — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <ChartCard title="Water Level vs Rain Probability" badge={`${data.length} pts`}>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} {...chartProps}>
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#63D9FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#63D9FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#A78BFA" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="idx" {...axisProps} label={{ value: 'Reading #', position: 'insideBottom', fill: '#8B9298', fontSize: 10, offset: -2 }} />
                  <YAxis domain={[0, 100]} {...axisProps} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8B9298', paddingTop: 12 }} />
                  <Area type="monotone" dataKey="water" name="Water %" stroke="#63D9FF" fill="url(#waterGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="rain"  name="Rain %"  stroke="#A78BFA" fill="url(#rainGrad)"  strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Energy: Solar vs Battery */}
        <ChartCard title="Energy — Solar vs Battery" badge="W / %" badgeColor="#F59E0B">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} {...chartProps}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="idx" {...axisProps} />
                <YAxis {...axisProps} />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8B9298' }} />
                <Line type="monotone" dataKey="solar"   name="Solar (W)"   stroke="#F59E0B" strokeWidth={2} dot={false} style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }} />
                <Line type="monotone" dataKey="battery" name="Battery %"   stroke="#B7F34A" strokeWidth={2} dot={false} yAxisId="pct" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Pump Power */}
        <ChartCard title="Pump Power Consumption" badge="Watts" badgeColor="#A78BFA">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} {...chartProps}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="idx" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pump" name="Pump Power (W)" fill="#A78BFA" opacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Flow Rate */}
        <ChartCard title="Flow Rate History" badge="L/min" badgeColor="#63D9FF">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} {...chartProps}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B7F34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#B7F34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="idx" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="flow" name="Flow (L/min)" stroke="#B7F34A" fill="url(#flowGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Battery deep dive — half width */}
        <ChartCard title="Battery Level Trend" badge="%" badgeColor="#B7F34A">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} {...chartProps}>
                <defs>
                  <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B7F34A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#B7F34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="idx" {...axisProps} />
                <YAxis domain={[0, 100]} {...axisProps} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="battery" name="Battery %" stroke="#B7F34A" fill="url(#battGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '40px 40px',
    minHeight: '100vh',
    background: '#0B0D0F',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageTitle: {
    margin: 0,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 28,
    color: '#F5F7F2',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    margin: '6px 0 0',
    fontSize: 14,
    color: '#8B9298',
    fontFamily: "'Geist', sans-serif",
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(183,243,74,0.08)',
    border: '1px solid rgba(183,243,74,0.2)',
    borderRadius: 100,
    padding: '6px 14px',
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#B7F34A',
    boxShadow: '0 0 6px #B7F34A',
    animation: 'pulseDot 1.5s ease infinite',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 16,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
};
