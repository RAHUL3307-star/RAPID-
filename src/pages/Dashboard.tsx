import React, { useState, useEffect } from 'react';
import { useSensorData }  from '../hooks/useSensorData';
import { useAlerts }      from '../hooks/useAlerts';
import { usePredictions } from '../hooks/usePredictions';
import { useIsMobile }    from '../hooks/useIsMobile';
import { useWeather }     from '../hooks/useWeather';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';

/* ── Tiny sparkline ── */
const Spark: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) return <div style={{ width: 60, height: 22 }} />;
  const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * 60},${22 - ((v - mn) / r) * 18}`
  ).join(' ');
  return (
    <svg width={60} height={22} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
    </svg>
  );
};

/* ── KPI Card ── */
const KPI: React.FC<{
  label: string; value: string | number; unit: string; icon: React.ReactNode;
  color: string; trend: string; trendUp: boolean; sparkData: number[];
}> = ({ label, value, unit, icon, color, trend, trendUp, sparkData }) => (
  <div style={{
    background: '#15181B', border: '1px solid #22252A', borderRadius: 14,
    padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8,
    flex: 1, position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.09em' }}>
        {label}
      </div>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace", lineHeight: 1 }}>
          {value}
          <span style={{ fontSize: 13, color: '#8B9298', marginLeft: 4, fontWeight: 400, fontFamily: "'Geist', sans-serif" }}>{unit}</span>
        </div>
        <div style={{
          marginTop: 6, fontSize: 11, fontFamily: "'Geist Mono', monospace",
          color: trendUp ? '#B7F34A' : '#EF4444',
        }}>
          {trendUp ? '↑' : '↓'} {trend} vs previous hr
        </div>
      </div>
      <Spark data={sparkData} color={color} />
    </div>
  </div>
);

/* ── Card wrapper ── */
const Card: React.FC<{
  children: React.ReactNode; title?: string; icon?: string; titleRight?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, title, icon, titleRight, style }) => (
  <div style={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 14, overflow: 'hidden', ...style }}>
    {title && (
      <div style={{ padding: '13px 18px', borderBottom: '1px solid #22252A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", display: 'flex', alignItems: 'center', gap: 7 }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          {title}
        </span>
        {titleRight}
      </div>
    )}
    <div style={{ padding: title ? '14px 16px' : 0 }}>{children}</div>
  </div>
);

/* ── Settings cog icon ── */
const Cog = () => (
  <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" stroke="#8B9298" strokeWidth="1.8"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#8B9298" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Pump status row ── */
const PumpRow: React.FC<{ name: string; sub: string; flow: string; status: string; color: string }> = ({ name, sub, flow, status, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: `${color}08`,
    borderRadius: 10, border: `1px solid ${color}20`,
  }}>
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 5px ${color}` }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>{name}</div>
      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{sub}</div>
    </div>
    <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 700, color: '#F5F7F2' }}>{flow}</div>
    <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, padding: '3px 9px', borderRadius: 20, fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  </div>
);

/* ── Alert row ── */
const AlertRow: React.FC<{ color: string; title: string; meta: string }> = ({ color, title, meta }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid #1A1D21' }}>
    <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0, marginTop: 3 }} />
    <div>
      <div style={{ fontSize: 12, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 500, lineHeight: 1.4 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist Mono', monospace", marginTop: 3 }}>{meta}</div>
    </div>
  </div>
);

/* ── Log row ── */
const LogRow: React.FC<{ time: string; msg: string; tag?: string; tagColor?: string }> = ({ time, msg, tag, tagColor = '#B7F34A' }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', borderBottom: '1px solid #1A1D21' }}>
    <span style={{ fontSize: 10, color: '#B7F34A', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
    <span style={{ fontSize: 11, color: '#C8CDD1', fontFamily: "'Geist', sans-serif", flex: 1, lineHeight: 1.4 }}>{msg}</span>
    {tag && <span style={{ fontSize: 9, color: tagColor, background: `${tagColor}15`, border: `1px solid ${tagColor}25`, padding: '2px 7px', borderRadius: 10, fontFamily: "'Geist', sans-serif", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{tag}</span>}
  </div>
);

/* ── Loading ── */
const LoadingScreen: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 20, background: '#0B0D0F' }}>
    <div style={{ position: 'relative', width: 52, height: 52 }}>
      <div style={{ width: 52, height: 52, border: '2px solid #22252A', borderTopColor: '#B7F34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 6, border: '2px solid transparent', borderTopColor: '#63D9FF', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 600, fontSize: 15 }}>Connecting to sensors…</span>
      <span style={{ color: '#8B9298', fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>Establishing Supabase Realtime link</span>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const Dashboard: React.FC = () => {
  const { readings, latest, loading } = useSensorData();
  const { alerts }                    = useAlerts();
  const { decision }                  = usePredictions(readings);
  const { weather: liveWeather }      = useWeather();
  const [mounted, setMounted]         = useState(false);
  const [now, setNow]                 = useState(new Date());
  const isMobile                      = useIsMobile();

  useEffect(() => {
    if (!loading && latest) setTimeout(() => setMounted(true), 80);
  }, [loading, latest]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!latest) return null;

  const risk = decision?.riskLevel ?? 'LOW';
  const riskColor: Record<string, string> = {
    LOW:      '#B7F34A',
    MEDIUM:   '#F59E0B',
    HIGH:     '#F97316',
    CRITICAL: '#EF4444',
  };
  const rc = riskColor[risk] || '#B7F34A';
  const unack = alerts.filter(a => !a.acknowledged).length;

  // Build chart data (last N readings)
  const chartData = readings.slice(-30).map((r, i) => ({
    t: i,
    level: r.water_level,
    flow:  r.flow_rate,
  }));
  if (chartData.length === 0) {
    // Demo fallback
    for (let i = 0; i < 20; i++) {
      chartData.push({ t: i, level: +(3.8 + Math.sin(i * 0.4) * 0.5 + Math.random() * 0.2).toFixed(2), flow: 0 });
    }
  }

  // Hourly rain bar data
  const rainBars = ['15:00','16:00','17:00','18:00','19:00','20:00'].map((h, i) => ({
    h, mm: [8, 12, 28, 14, 6, 4][i],
  }));

  // Spark data
  const wlSpark   = chartData.slice(-8).map(d => d.level);
  const rfSpark   = readings.slice(-8).map(r => r.rain_probability);
  const flSpark   = readings.slice(-8).map(r => r.flow_rate);
  const solSpark  = readings.slice(-8).map(r => r.solar_power);

  const wl  = latest.water_level.toFixed(2);
  const rf  = (liveWeather?.expectedRainfall ?? latest.expected_rainfall ?? 0).toFixed(1);
  const sol = (latest.solar_power / 1000).toFixed(2);

  const tickStyle   = { fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" };
  const gridStyle   = { strokeDasharray: '3 3', stroke: '#22252A', strokeOpacity: 0.6 };
  const axisProps   = { tickLine: false, axisLine: false, tick: tickStyle };

  // Pump matrix data
  const pumps = [
    { name: 'PUMP 1 – SUBMERSED', sub: '162 Hrs Run', flow: '420 L/s', status: 'OPERATIONAL', color: '#B7F34A' },
    { name: 'PUMP 2 – BYPASS',    sub: '122 Hrs Run', flow: '380 L/s', status: 'OPERATIONAL', color: '#B7F34A' },
    { name: 'PUMP 3 – BACKUP',    sub: '40 Hrs Run',  flow: '0 L/s',   status: 'STANDBY',     color: '#F59E0B' },
    { name: 'PUMP 4 – TURBINE',   sub: '310 Hrs Run', flow: '0 L/s',   status: 'MAINTENANCE', color: '#EF4444' },
  ];

  const batteryLevel = latest.battery_level;

  return (
    <div style={{
      ...S.page,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(10px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* ── Top Status Bar ── */}
      {!isMobile && (
        <div style={S.statusBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={S.systemDot} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B7F34A', fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>
              SYSTEM OPERATIONAL
            </span>
            <span style={S.statusSep}>·</span>
            <span style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
              Kelantan River Basin — Station KRB-07
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>
              LIVE: {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')} {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} UTC
            </span>
            <button style={S.bellBtn} onClick={() => {}}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#8B9298" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#8B9298" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              {unack > 0 && <span style={S.bellBadge}>{unack}</span>}
            </button>
          </div>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div style={isMobile
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 12px' }
        : S.kpiRow
      }>
        <KPI
          label="WATER LEVEL" value={wl} unit="m"
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M12 2c0 0-7 7-7 13a7 7 0 0 0 14 0c0-6-7-13-7-13z" stroke="#63D9FF" strokeWidth="1.8"/></svg>}
          color="#63D9FF"
          trend="+1.2%" trendUp={true} sparkData={wlSpark.length ? wlSpark : [3.8,3.9,4.0,4.1,4.2,4.2,4.26]}
        />
        <KPI
          label="RAINFALL LAST 24H" value={rf} unit="mm"
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" stroke="#63D9FF" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 19v2M12 21v2M16 19v2" stroke="#63D9FF" strokeWidth="1.8" strokeLinecap="round"/></svg>}
          color="#63D9FF"
          trend="+8.4%" trendUp={true} sparkData={rfSpark.length ? rfSpark : [20,24,28,30,32,32,32]}
        />
        <KPI
          label="TOTAL FLOW RATE" value="1,240" unit="L/s"
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="#B7F34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" stroke="#B7F34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          color="#B7F34A"
          trend="-8.5%" trendUp={false} sparkData={flSpark.length ? flSpark : [1300,1280,1260,1250,1240,1240]}
        />
        <KPI
          label="SOLAR POWER" value={sol} unit="kW"
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="#F59E0B" strokeWidth="1.8"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          color="#F59E0B"
          trend="+15.2%" trendUp={true} sparkData={solSpark.length ? solSpark : [2.8,2.9,3.0,3.1,3.2,3.24]}
        />
      </div>

      {/* ── Main Row ── */}
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 12px' }
        : S.mainRow
      }>
        {/* Water Level Trend */}
        <Card
          title="WATER LEVEL TREND (24H)" icon="📈"
          titleRight={<button style={S.cogBtn}><Cog /></button>}
          style={{ flex: 1.6 }}
        >
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>Current Telemetry</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#63D9FF', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
              {wl}<span style={{ fontSize: 13, color: '#8B9298', marginLeft: 3, fontWeight: 400 }}>m</span>
              <span style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 400, marginLeft: 8 }}>
                at {now.getHours().toString().padStart(2,'0')}:{now.getMinutes().toString().padStart(2,'0')}
              </span>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="wlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#63D9FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#63D9FF" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="t" {...axisProps} hide />
                <YAxis {...axisProps} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#1A1D21', border: '1px solid #22252A', borderRadius: 10, fontFamily: "'Geist', sans-serif" }}
                  labelStyle={{ color: '#8B9298', fontSize: 10 }}
                  itemStyle={{ color: '#63D9FF', fontSize: 11 }}
                />
                {/* Threshold lines */}
                <ReferenceLine y={4.9} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: 'DANGER THRESHOLD (4.9M)', position: 'insideTopLeft', fill: '#EF4444', fontSize: 9, dy: -4 }} />
                <ReferenceLine y={4.4} stroke="#F59E0B" strokeDasharray="6 3" strokeWidth={1.2}
                  label={{ value: 'WARNING THRESHOLD (4.4M)', position: 'insideTopLeft', fill: '#F59E0B', fontSize: 9, dy: -4 }} />
                <Area type="monotone" dataKey="level" name="Water Level (m)" stroke="#63D9FF" fill="url(#wlGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Flood Prediction */}
        <Card
          title="AI FLOOD PREDICTION CORE" icon="🧠"
          titleRight={<button style={S.cogBtn}><Cog /></button>}
          style={{ flex: 1 }}
        >
          {/* Risk Index */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            {/* Donut */}
            <svg width={68} height={68} viewBox="0 0 68 68">
              <circle cx={34} cy={34} r={26} fill="none" stroke="#22252A" strokeWidth={7} />
              <circle cx={34} cy={34} r={26} fill="none" stroke={rc} strokeWidth={7}
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - (risk === 'CRITICAL' ? 0.95 : risk === 'HIGH' ? 0.82 : risk === 'MEDIUM' ? 0.68 : 0.35))}`}
                strokeLinecap="round" transform="rotate(-90 34 34)" />
              <text x={34} y={38} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>
                {risk === 'CRITICAL' ? '95' : risk === 'HIGH' ? '82' : risk === 'MEDIUM' ? '68' : '35'}%
              </text>
            </svg>
            <div>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>RISK INDEX</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: rc, fontFamily: "'Outfit', sans-serif" }}>
                {risk === 'LOW' ? 'LOW RISK' : risk === 'MEDIUM' ? 'MODERATE RISK' : risk === 'HIGH' ? 'HIGH RISK' : 'CRITICAL RISK'}
              </div>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 3 }}>
                Predicted 4.65m in 4.5 hrs
              </div>
            </div>
          </div>

          <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>
            CONTRIBUTING FACTORS
          </div>

          {[
            { name: 'Upstream Rainfall Rate', sub: '+22km/h', badge: 'Severe',   color: '#EF4444' },
            { name: 'Soil Saturation Index', sub: '91.2%',    badge: 'Critical', color: '#F97316' },
            { name: 'Station Runoff Pattern', sub: 'Stable',  badge: 'Nominal',  color: '#B7F34A' },
          ].map(f => (
            <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1D21' }}>
              <div>
                <div style={{ fontSize: 12, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>{f.name}</div>
                <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>{f.sub}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: f.color, background: `${f.color}15`, border: `1px solid ${f.color}25`, padding: '3px 10px', borderRadius: 20, fontFamily: "'Geist', sans-serif" }}>
                {f.badge}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── Middle Row ── */}
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 12px' }
        : S.middleRow
      }>
        {/* Pump Control Matrix */}
        <Card title="PUMP CONTROL MATRIX" icon="⚙️" titleRight={<button style={S.cogBtn}><Cog /></button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pumps.map(p => (
              <PumpRow key={p.name} name={p.name} sub={p.sub} flow={p.flow} status={p.status} color={p.color} />
            ))}
          </div>
        </Card>

        {/* Telemetry & Weather */}
        <Card title="TELEMETRY &amp; WEATHER" icon="🌦" titleRight={<button style={S.cogBtn}><Cog /></button>}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>
                {liveWeather?.temperature?.toFixed(0) ?? latest.temperature?.toFixed(0) ?? '28'}°C
              </div>
              <div style={{ fontSize: 12, color: '#63D9FF', fontFamily: "'Geist', sans-serif", marginTop: 2 }}>
                {liveWeather?.conditionText ?? 'Rainy'} · Humidity 94%
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>
                1011 <span style={{ fontSize: 11, color: '#8B9298', fontWeight: 400 }}>hPa</span>
              </div>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 2 }}>Pressure</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
            HOURLY RAIN PROJECTION
          </div>
          <div style={{ height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainBars} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Bar dataKey="mm" fill="#63D9FF" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Solar & Battery Grid */}
        <Card title="SOLAR &amp; BATTERY GRID" icon="☀️" titleRight={<button style={S.cogBtn}><Cog /></button>}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>Emergency Battery Level</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#B7F34A', fontFamily: "'Geist Mono', monospace" }}>{batteryLevel.toFixed(0)}%</span>
            </div>
            <div style={{ height: 8, background: '#22252A', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${batteryLevel}%`, background: 'linear-gradient(90deg, #B7F34A, #63D9FF)', borderRadius: 4, transition: 'width 1s ease' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1A1D21' }}>
            <div>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>EST. RUNTIME</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>18.4 <span style={{ fontSize: 12, fontWeight: 400, color: '#8B9298' }}>Hrs</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>SOURCE</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', fontFamily: "'Geist', sans-serif", marginTop: 2 }}>SOLAR ACTIVE</div>
            </div>
          </div>
          {[
            { label: 'Grid Fallback Bridge', val: 'Standby', sub: '(Offline)', valColor: '#8B9298' },
            { label: 'Inverter Efficiency',   val: '96.8%',  sub: '',          valColor: '#B7F34A' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1A1D21' }}>
              <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{r.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: r.valColor, fontFamily: "'Geist Mono', monospace" }}>
                {r.val} <span style={{ fontSize: 10, color: '#4A5158' }}>{r.sub}</span>
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* ── Bottom Row ── */}
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: 12, padding: '0 12px 20px' }
        : S.bottomRow
      }>
        {/* Active Severity Alerts */}
        <Card title="ACTIVE SEVERITY ALERTS" icon="🔔" titleRight={<button style={S.cogBtn}><Cog /></button>} style={{ flex: 1 }}>
          {alerts.filter(a => !a.acknowledged).slice(0, 3).map((a, i) => (
            <AlertRow
              key={a.id || i}
              color={i === 0 ? '#EF4444' : i === 1 ? '#F59E0B' : '#63D9FF'}
              title={a.message || `Alert ${i + 1}`}
              meta={`${a.severity || 'INFO'} · ${a.created_at ? new Date(a.created_at).toLocaleTimeString() : '--'} UTC`}
            />
          ))}
          {/* Fallback demo alerts if none */}
          {alerts.filter(a => !a.acknowledged).length === 0 && (
            <>
              <AlertRow color="#EF4444" title="Water Level Exceeded Warning Threshold at Station KRB-07" meta="ALRT-4029 · 14:32 UTC" />
              <AlertRow color="#F59E0B" title="Pump P3 entered maintenance diagnostic mode"              meta="PUMP-6092 · 14:10 UTC" />
              <AlertRow color="#63D9FF" title="Solar Array automated tracking optimization complete"     meta="ALRT-8812 · 10:60 UTC" />
            </>
          )}
        </Card>

        {/* System Log & Activity */}
        <Card title="SYSTEM LOG &amp; ACTIVITY" icon="📋" titleRight={<button style={S.cogBtn}><Cog /></button>} style={{ flex: 1 }}>
          <LogRow time="14:34:02" msg="Automated telemetry transmit successful."        tag="#telemetry" tagColor="#63D9FF" />
          <LogRow time="14:32:15" msg="Threshold Warning: Water level triggered 4.2m alert." tag="#threshold" tagColor="#F59E0B" />
          <LogRow time="14:35:80" msg="Standard flow test initialized on Pump Station B."    tag="#flowtest"  tagColor="#B7F34A" />
          <LogRow time="13:48:11" msg="Solenoid check cycle finished without latency."       tag="#valves"    tagColor="#A78BFA" />
        </Card>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '0',
    minHeight: '100vh',
    background: '#0B0D0F',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },

  // Status bar
  statusBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 24px', background: '#10141A',
    borderBottom: '1px solid #1C2028',
  },
  systemDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#B7F34A',
    boxShadow: '0 0 6px #B7F34A', flexShrink: 0, animation: 'pulseDot 2s ease infinite',
  },
  statusSep: { color: '#2A2E36', fontSize: 16 },
  bellBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    position: 'relative', padding: 6, color: '#8B9298',
    display: 'flex', alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 0, right: 0, width: 16, height: 16,
    background: '#EF4444', color: '#fff', borderRadius: '50%',
    fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // KPI row
  kpiRow: { display: 'flex', gap: 14, padding: '0 24px' },

  // Main row
  mainRow: { display: 'flex', gap: 16, padding: '0 24px', alignItems: 'stretch' },

  // Middle row
  middleRow: { display: 'flex', gap: 16, padding: '0 24px' },

  // Bottom row
  bottomRow: { display: 'flex', gap: 16, padding: '0 24px 24px' },

  // Cog button
  cogBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: 0.6 },
};
