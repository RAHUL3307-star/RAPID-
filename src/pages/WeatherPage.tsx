import React, { useState, useEffect, useCallback } from 'react';
import { fetchWeatherData } from '../lib/weatherService';
import type { WeatherData } from '../lib/weatherService';

/* ─────────────────────────────────────────────
   WeatherPage — Real-time & Forecast View
   Uses WeatherAPI.com when a key is set in .env
   VITE_WEATHER_API_KEY=your_key_here
────────────────────────────────────────────── */

/* ── Animated gauge ring ── */
const Ring: React.FC<{ pct: number; color: string; size?: number; label?: string }> = ({
  pct, color, size = 80, label,
}) => {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22252A" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {label && (
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          style={{ fontSize: size < 70 ? 11 : 14, fontWeight: 700, fill: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>
          {label}
        </text>
      )}
    </svg>
  );
};

/* ── Hourly forecast bar ── */
const HourBar: React.FC<{ hour: string; rainMm: number; maxMm: number; prob: number }> = ({
  hour, rainMm, maxMm, prob,
}) => {
  const h = maxMm > 0 ? (rainMm / maxMm) * 80 : 0;
  const color = prob > 70 ? '#EF4444' : prob > 40 ? '#F59E0B' : '#63D9FF';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
      <span style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>{prob}%</span>
      <div style={{ width: 20, height: 80, display: 'flex', alignItems: 'flex-end', background: '#1A1D21', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: `${h}px`, background: color, borderRadius: 4, transition: 'height 0.8s ease', opacity: 0.85 }} />
      </div>
      <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap' }}>{rainMm.toFixed(1)}mm</span>
      <span style={{ fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{hour}</span>
    </div>
  );
};

/* ── Weather condition icon mapping ── */
const conditionEmoji = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes('thunder'))  return '⛈️';
  if (t.includes('heavy rain')) return '🌧️';
  if (t.includes('rain') || t.includes('drizzle')) return '🌦️';
  if (t.includes('snow'))     return '❄️';
  if (t.includes('cloud'))    return '☁️';
  if (t.includes('overcast')) return '🌫️';
  if (t.includes('fog') || t.includes('mist')) return '🌫️';
  if (t.includes('sun') || t.includes('clear')) return '☀️';
  return '🌡️';
};

/* ── Risk pill ── */
const RiskBadge: React.FC<{ prob: number }> = ({ prob }) => {
  const [label, color] =
    prob >= 80 ? ['CRITICAL FLOOD RISK', '#EF4444'] :
    prob >= 60 ? ['HIGH RAIN RISK',       '#F97316'] :
    prob >= 40 ? ['MODERATE RISK',        '#F59E0B'] :
                 ['LOW RISK',             '#B7F34A'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`, padding: '4px 12px', borderRadius: 20, fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>
      {label}
    </span>
  );
};

/* ── Simulated hourly data (used when API unavailable) ── */
const DEMO_HOURLY = [
  { hour: '06:00', rain: 0.0, prob: 5  },
  { hour: '08:00', rain: 0.2, prob: 12 },
  { hour: '10:00', rain: 1.5, prob: 35 },
  { hour: '12:00', rain: 4.2, prob: 62 },
  { hour: '14:00', rain: 8.8, prob: 80 },
  { hour: '16:00', rain: 12.4, prob: 88 },
  { hour: '18:00', rain: 6.1, prob: 70 },
  { hour: '20:00', rain: 2.3, prob: 45 },
  { hour: '22:00', rain: 0.8, prob: 20 },
  { hour: '00:00', rain: 0.1, prob: 8  },
];

const DEMO_DAILY = [
  { day: 'Today',    icon: '🌧️', high: 29, low: 24, rain: 14.2, prob: 82 },
  { day: 'Tomorrow', icon: '⛈️', high: 27, low: 23, rain: 22.5, prob: 91 },
  { day: 'Wed',      icon: '🌦️', high: 30, low: 25, rain: 6.8,  prob: 55 },
  { day: 'Thu',      icon: '☁️', high: 31, low: 26, rain: 1.2,  prob: 20 },
  { day: 'Fri',      icon: '☀️', high: 33, low: 27, rain: 0.0,  prob: 5  },
  { day: 'Sat',      icon: '☀️', high: 34, low: 28, rain: 0.0,  prob: 3  },
  { day: 'Sun',      icon: '🌦️', high: 32, low: 26, rain: 3.5,  prob: 35 },
];

export const WeatherPage: React.FC = () => {
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastFetch, setLastFetch]   = useState<Date | null>(null);
  const [hasKey, setHasKey]         = useState(false);
  const [location, setLocation]     = useState(
    () => localStorage.getItem('rapid_weather_location') || import.meta.env.VITE_WEATHER_LOCATION || 'Chennai, Tamil Nadu, India'
  );
  const [editingLoc, setEditingLoc] = useState(false);
  const [locInput, setLocInput]     = useState(location);

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    if (apiKey) {
      setHasKey(true);
      const data = await fetchWeatherData(apiKey, location);
      setWeather(data);
    } else {
      setHasKey(false);
      setWeather(null);
    }
    setLastFetch(new Date());
    setLoading(false);
  }, [apiKey, location]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const saveLocation = () => {
    setLocation(locInput);
    localStorage.setItem('rapid_weather_location', locInput);
    setEditingLoc(false);
  };

  const temp     = weather?.temperature    ?? 29;
  const cond     = weather?.conditionText  ?? 'Partly Cloudy';
  const rainProb = weather?.rainProbability ?? 62;
  const rainfall = weather?.expectedRainfall ?? 8.4;
  const loc      = weather?.locationName   ?? location;
  const emoji    = conditionEmoji(cond);
  const maxHour  = Math.max(...DEMO_HOURLY.map(h => h.rain));

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Weather Intelligence</h1>
          <p style={S.subtitle}>
            {hasKey
              ? `Live forecast for ${loc} · Auto-refreshes every 10 min`
              : 'Showing simulated forecast · Add VITE_WEATHER_API_KEY in .env for live data'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!hasKey && (
            <span style={S.demoChip}>⚡ DEMO MODE</span>
          )}
          {hasKey && (
            <span style={S.liveChip}>
              <span style={S.liveDot} />
              LIVE DATA
            </span>
          )}
          {lastFetch && (
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>
              Updated {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button style={S.refreshBtn} onClick={fetchWeather}>↻ Refresh</button>
        </div>
      </div>

      {/* ── Location bar ── */}
      <div style={S.locationBar}>
        <span style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>📍 Location:</span>
        {editingLoc ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={locInput}
              onChange={e => setLocInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveLocation()}
              style={{ ...S.input, width: 220 }}
              placeholder="e.g. Kolkata, India"
            />
            <button style={S.saveBtn} onClick={saveLocation}>Save</button>
            <button style={S.cancelBtn} onClick={() => { setEditingLoc(false); setLocInput(location); }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>{location}</span>
            <button style={S.editBtn} onClick={() => setEditingLoc(true)}>✏️ Change</button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: 10 }}>↻</span>
          Fetching weather data…
        </div>
      ) : (
        <>
          {/* ── Current Conditions ── */}
          <div style={S.currentRow}>
            {/* Main weather card */}
            <div style={{ ...S.card, flex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 60, lineHeight: 1, marginBottom: 8 }}>{emoji}</div>
                  <div style={{ fontSize: 52, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace", lineHeight: 1 }}>
                    {temp.toFixed(0)}<span style={{ fontSize: 24, color: '#8B9298' }}>°C</span>
                  </div>
                  <div style={{ fontSize: 15, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginTop: 6 }}>{cond}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <RiskBadge prob={rainProb} />
                  <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", textAlign: 'right', marginTop: 4 }}>
                    📍 {loc}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Ring pct={rainProb} color={rainProb >= 70 ? '#EF4444' : rainProb >= 40 ? '#F59E0B' : '#63D9FF'} size={80} label={`${rainProb}%`} />
                    <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", textAlign: 'center', marginTop: 4 }}>Rain Prob.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                { icon: '🌧️', label: 'Expected Rainfall', val: `${rainfall.toFixed(1)} mm`, color: '#63D9FF' },
                { icon: '💧', label: 'Flood Alert Level',  val: rainProb >= 70 ? 'HIGH' : rainProb >= 40 ? 'MODERATE' : 'LOW', color: rainProb >= 70 ? '#EF4444' : '#F59E0B' },
                { icon: '💨', label: 'Pump Recommendation', val: rainProb >= 70 ? 'HIGH SPEED' : rainProb >= 40 ? 'LOW SPEED' : 'STANDBY', color: '#B7F34A' },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {[
                { label: 'Mine Inundation Risk',   val: rainProb >= 80 ? 'CRITICAL' : rainProb >= 60 ? 'HIGH' : 'MEDIUM', color: rainProb >= 80 ? '#EF4444' : '#F97316' },
                { label: 'Pump Pre-activation',    val: rainProb >= 60 ? 'RECOMMENDED' : 'NOT REQUIRED',  color: rainProb >= 60 ? '#B7F34A' : '#8B9298' },
                { label: 'Drainage Capacity Req.', val: `${(rainfall * 1.4).toFixed(0)} L/min`,          color: '#63D9FF' },
                { label: 'Alert Status',           val: rainProb >= 70 ? '🔴 ACTIVE' : '🟢 NORMAL',      color: rainProb >= 70 ? '#EF4444' : '#B7F34A' },
              ].map(m => (
                <div key={m.label} style={{ ...S.card, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.color, fontFamily: "'Geist Mono', monospace" }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Hourly Forecast ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>Hourly Rainfall Forecast</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', padding: '8px 0 4px' }}>
              {DEMO_HOURLY.map(h => (
                <HourBar key={h.hour} hour={h.hour} rainMm={h.rain} maxMm={maxHour} prob={h.prob} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[['🔴', '>70% prob — HIGH risk'], ['🟡', '40–70% — MODERATE'], ['🔵', '<40% — LOW risk']].map(([dot, label]) => (
                <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
                  <span>{dot as string}</span>{label as string}
                </div>
              ))}
            </div>
          </div>

          {/* ── 7-Day Forecast ── */}
          <div style={S.card}>
            <div style={S.cardTitle}>7-Day Rainfall Outlook</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginTop: 8 }}>
              {DEMO_DAILY.map(d => (
                <div key={d.day} style={{
                  background: '#0B0D0F', borderRadius: 12, padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  border: d.prob >= 80 ? '1px solid rgba(239,68,68,0.3)' : '1px solid #1A1D21',
                }}>
                  <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{d.day}</span>
                  <span style={{ fontSize: 26 }}>{d.icon}</span>
                  <div style={{ display: 'flex', gap: 4, fontSize: 11, fontFamily: "'Geist Mono', monospace" }}>
                    <span style={{ color: '#F5F7F2' }}>{d.high}°</span>
                    <span style={{ color: '#8B9298' }}>{d.low}°</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#63D9FF', fontFamily: "'Geist Mono', monospace' " }}>{d.rain.toFixed(1)}mm</span>
                  <div style={{ fontSize: 10, fontWeight: 700, color: d.prob >= 70 ? '#EF4444' : d.prob >= 40 ? '#F59E0B' : '#B7F34A', fontFamily: "'Geist', sans-serif" }}>
                    {d.prob}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Integration Note ── */}
          {!hasKey && (
            <div style={{ ...S.card, border: '1px solid rgba(183,243,74,0.25)', background: 'rgba(183,243,74,0.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#B7F34A', fontFamily: "'Geist', sans-serif", marginBottom: 8 }}>
                🔑 Connect Live Weather API
              </div>
              <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.7 }}>
                This page currently shows simulated data. To get <strong style={{ color: '#F5F7F2' }}>real live rainfall predictions</strong> for your mine location:
                <br />1. Get a free API key from <strong style={{ color: '#63D9FF' }}>weatherapi.com</strong>
                <br />2. Open your <code style={{ color: '#B7F34A', background: '#0B0D0F', padding: '2px 6px', borderRadius: 4 }}>.env</code> file and add: <code style={{ color: '#B7F34A', background: '#0B0D0F', padding: '2px 6px', borderRadius: 4 }}>VITE_WEATHER_API_KEY=your_key_here</code>
                <br />3. Also set: <code style={{ color: '#B7F34A', background: '#0B0D0F', padding: '2px 6px', borderRadius: 4 }}>VITE_WEATHER_LOCATION=your_mine_city</code>
                <br />4. Restart the dev server — this page will show real hourly + 7-day forecasts automatically.
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', minHeight: '100vh', background: '#0B0D0F', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: "'Geist', 'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", letterSpacing: '-0.02em' },
  subtitle: { margin: '5px 0 0', fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" },
  locationBar: { display: 'flex', alignItems: 'center', gap: 10, background: '#15181B', border: '1px solid #22252A', borderRadius: 10, padding: '10px 16px' },
  liveChip: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(183,243,74,0.08)', border: '1px solid rgba(183,243,74,0.25)', borderRadius: 100, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#B7F34A', fontFamily: "'Geist', sans-serif" },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A', animation: 'pulseDot 1.5s ease infinite', flexShrink: 0 },
  demoChip: { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 100, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#A78BFA', fontFamily: "'Geist', sans-serif" },
  refreshBtn: { background: '#15181B', border: '1px solid #22252A', borderRadius: 8, color: '#8B9298', fontSize: 12, padding: '7px 14px', cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'all 0.2s' },
  currentRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  card: { background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '20px 22px' },
  cardTitle: { fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 4 },
  input: { background: '#0B0D0F', border: '1px solid #22252A', borderRadius: 8, color: '#F5F7F2', fontSize: 12, padding: '7px 12px', fontFamily: "'Geist', sans-serif", outline: 'none' },
  saveBtn: { background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Geist', sans-serif" },
  cancelBtn: { background: 'transparent', color: '#8B9298', border: '1px solid #22252A', borderRadius: 7, fontSize: 12, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Geist', sans-serif" },
  editBtn: { background: 'transparent', color: '#8B9298', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: "'Geist', sans-serif", padding: '4px 8px' },
};
