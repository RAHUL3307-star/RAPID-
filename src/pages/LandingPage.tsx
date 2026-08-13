import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import type { AuthUser } from '../hooks/useAuth';

interface LandingPageProps {
  onLogin:      () => void;
  onGetStarted: () => void;
  user:         AuthUser | null;
  onDashboard:  () => void;
}

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Section wrapper with reveal ── */
function Section({ children, id, bg }: { children: React.ReactNode; id?: string; bg?: string }) {
  const { ref, visible } = useReveal();
  return (
    <section
      id={id}
      ref={ref}
      style={{
        ...sectionBase,
        background: bg,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </section>
  );
}

/* ── Topographic SVG map with premium animations ── */
const TopoMap: React.FC = () => (
  <div style={{
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#071512',
    borderRadius: 'inherit',
    overflow: 'hidden',
  }}>
    <svg
      viewBox="0 0 440 280"
      style={{ width: '100%', height: '100%', opacity: 0.95 }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Animated contour lines */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
        <ellipse
          key={i}
          cx={220 + Math.sin(i * 0.7) * 12}
          cy={140 + Math.cos(i * 0.5) * 8}
          rx={30 + i * 18}
          ry={18 + i * 11}
          fill="none"
          stroke={i % 5 === 0 ? '#1affe4' : '#0d8a78'}
          strokeWidth={i % 5 === 0 ? 1.4 : 0.7}
          strokeDasharray={i % 5 === 0 ? '6 3' : 'none'}
          opacity={1 - i * 0.04}
          transform={`rotate(${i * 8 - 20} 220 140)`}
        >
          {i % 5 === 0 && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`${i * 8 - 20} 220 140`}
              to={`${i * 8 + 340} 220 140`}
              dur={`${30 + i * 5}s`}
              repeatCount="indefinite"
            />
          )}
        </ellipse>
      ))}

      {/* River-like animated path */}
      <path
        d="M80,180 C110,160 140,170 170,155 C200,140 230,150 260,140 C290,130 320,145 350,135 C370,128 390,135 410,130"
        fill="none" stroke="#00e5c4" strokeWidth="3" opacity="0.8" strokeLinecap="round"
        strokeDasharray="8 4"
      >
        <animate attributeName="stroke-dashoffset" from="24" to="0" dur="2s" repeatCount="indefinite" />
      </path>

      {/* Secondary contours */}
      {[0,1,2,3,4,5].map(i => (
        <path
          key={`c${i}`}
          d={`M${50 + i*15},${60+i*8} C${100+i*20},${80+i*5} ${200+i*10},${90+i*7} ${300+i*15},${85+i*6} C${360+i*12},${82+i*5} ${400+i*8},${100+i*4} ${430},${110+i*3}`}
          fill="none"
          stroke={i % 2 === 0 ? '#0d8a78' : '#0a6659'}
          strokeWidth={0.6}
          opacity={0.7}
        />
      ))}

      {/* Grid overlay */}
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`h${i}`} x1="0" y1={i*47} x2="440" y2={i*47} stroke="#0d5047" strokeWidth="0.4" opacity="0.4" />
      ))}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <line key={`v${i}`} x1={i*49} y1="0" x2={i*49} y2="280" stroke="#0d5047" strokeWidth="0.4" opacity="0.4" />
      ))}

      {/* Radar scanning sweep */}
      <g transform="translate(220,140)">
        <line x1="0" y1="0" x2="160" y2="0" stroke="#00e5c4" strokeWidth="1.5" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
        </line>
        <polygon points="0,0 160,-30 160,0" fill="#00e5c4" opacity="0.08">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
        </polygon>
      </g>

      {/* Sensor Node Pings */}
      {[
        { x: 120, y: 100, label: 'S1' },
        { x: 310, y: 90,  label: 'S2' },
        { x: 160, y: 200, label: 'S3' },
        { x: 350, y: 210, label: 'S4' },
      ].map((node, idx) => (
        <g key={node.label}>
          <circle cx={node.x} cy={node.y} r="4" fill="#B7F34A" />
          <circle cx={node.x} cy={node.y} r="10" fill="none" stroke="#B7F34A" strokeWidth="1" opacity="0.6">
            <animate attributeName="r" values="4;16;4" dur={`${1.8 + idx * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur={`${1.8 + idx * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <text x={node.x + 7} y={node.y + 3} fill="#8B9298" fontSize="8" fontFamily="'Geist Mono', monospace">{node.label}</text>
        </g>
      ))}

      {/* Center main pulse */}
      <circle cx="220" cy="140" r="6" fill="#00e5c4" opacity="0.9" />
      <circle cx="220" cy="140" r="14" fill="none" stroke="#00e5c4" strokeWidth="1.8" opacity="0.6">
        <animate attributeName="r" values="8;28;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>

    {/* Zone label */}
    <div style={{
      position: 'absolute', top: 14, left: 16,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5c4', boxShadow: '0 0 8px #00e5c4', animation: 'pulseDot 1.5s ease infinite' }} />
      <span style={{ fontSize: 11, color: '#00e5c4', fontFamily: "'Geist Mono', monospace", letterSpacing: '0.08em' }}>
        ZONE_H4 // COOPER RIVER
      </span>
      <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist Mono', monospace", marginLeft: 8 }}>
        ALT. 12m
      </span>
    </div>

    {/* Rotating Crosshair */}
    <div style={{ position: 'absolute', bottom: 18, right: 18, opacity: 0.85 }}>
      <svg width="28" height="28" fill="none" viewBox="0 0 28 28" style={{ animation: 'spin 12s linear infinite' }}>
        <circle cx="14" cy="14" r="10" stroke="#00e5c4" strokeWidth="1.2" strokeDasharray="4 2" />
        <circle cx="14" cy="14" r="4"  stroke="#00e5c4" strokeWidth="1.2" />
        <line x1="14" y1="2" x2="14" y2="8"   stroke="#00e5c4" strokeWidth="1.2" />
        <line x1="14" y1="20" x2="14" y2="26" stroke="#00e5c4" strokeWidth="1.2" />
        <line x1="2"  y1="14" x2="8"  y2="14" stroke="#00e5c4" strokeWidth="1.2" />
        <line x1="20" y1="14" x2="26" y2="14" stroke="#00e5c4" strokeWidth="1.2" />
      </svg>
    </div>

    {/* Simulated surge badge */}
    <div style={{
      position: 'absolute', bottom: 14, left: 14,
      background: 'rgba(0,229,196,0.12)',
      border: '1px solid rgba(0,229,196,0.35)',
      borderRadius: 8, padding: '5px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      backdropFilter: 'blur(4px)',
    }}>
      <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>SIMULATED SURGE</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#00e5c4', fontFamily: "'Geist Mono', monospace" }}>+2.45m</span>
    </div>
  </div>
);

/* ── Metric sidebar sparkline ── */
const MiniSpark: React.FC<{ color: string }> = ({ color }) => {
  const pts = [0,3,1,5,2,4,6,3,5,7].map((v, i, a) =>
    `${(i / (a.length - 1)) * 60},${16 - (v / 7) * 14}`
  ).join(' ');
  return (
    <svg width={60} height={16} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
    </svg>
  );
};

/* ── Surge donut ── */
const SurgeDonut: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 22, c = 2 * Math.PI * r;
  const fill = c * (1 - pct / 100);
  return (
    <svg width={60} height={60} viewBox="0 0 60 60">
      <circle cx={30} cy={30} r={r} fill="none" stroke="#22252A" strokeWidth={5} />
      <circle cx={30} cy={30} r={r} fill="none" stroke="#EF4444" strokeWidth={5}
        strokeDasharray={`${c}`} strokeDashoffset={fill} strokeLinecap="round"
        transform="rotate(-90 30 30)" />
      <text x={30} y={34} textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 700, fill: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>
        {pct}%
      </text>
    </svg>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGetStarted, user, onDashboard }) => {
  const [scrolled, setScrolled]   = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setTimeout(() => setHeroMounted(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={S.root}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        ...S.nav,
        background: scrolled ? 'rgba(10,12,14,0.96)' : '#0B0D0F',
        borderBottom: '1px solid #1a1e22',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}>
        <div style={S.navInner}>
          {/* Logo */}
          <div style={S.navLogo}>
            <div style={S.navLogoMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" />
              </svg>
            </div>
            <span style={S.navLogoText}>RAPID</span>
          </div>

          {/* Links */}
          <ul style={S.navLinks}>
            {[
              ['Platform',        'how'],
              ['Scientific Data', 'features'],
              ['Risk Simulator',  'modes'],
              ['Hardware',        'tech'],
            ].map(([label, id]) => (
              <li key={id}>
                <button style={S.navLink} onClick={() => scrollTo(id)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div style={S.navActions}>
            {/* SYS_ONLINE chip */}
            <div style={S.sysChip}>
              <div style={S.sysDot} />
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Geist Mono', monospace", letterSpacing: '0.05em' }}>
                SYS_ONLINE
              </span>
            </div>
            {user ? (
              <button style={S.requestBtn} onClick={onDashboard}>
                Open Dashboard →
              </button>
            ) : (
              <button style={S.requestBtn} onClick={onGetStarted}>
                Request Access
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section style={S.hero}>
        {/* Background */}
        <div style={S.heroBg}>
          <div style={{ ...S.glow, ...S.glowLime }} />
          <div style={{ ...S.glow, ...S.glowCyan }} />
          <div style={S.heroGrid} />
        </div>

        <div style={{ ...S.heroInner, gridTemplateColumns: isMobile ? '1fr' : '1fr 1.1fr', gap: isMobile ? 32 : 48 }}>
          {/* ── Left Copy ── */}
          <div style={{
            ...S.heroLeft,
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateX(0)' : 'translateX(-40px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Badge */}
            <div style={S.badge}>
              <div style={S.badgeDot} />
              REAL-TIME FLOOD INTELLIGENCE
            </div>

            <h1 style={S.heroH1}>
              Predict the water.<br />
              Protect what<br />
              matters.
            </h1>

            <p style={S.heroCopy}>
              Hyper-local rainfall monitoring, predictive inundation
              modeling, and real-time scenario simulation. We translate
              complex hydrological dynamics into clear, actionable flood
              intelligence.
            </p>

            <div style={S.heroCtas}>
              <button style={S.ctaPrimary} onClick={onGetStarted}>
                Start Monitoring
              </button>
              <button style={S.ctaOutline} onClick={() => scrollTo('how')}>
                See How It Works
              </button>
            </div>

            {/* Station count */}
            <div style={S.stationLine}>
              <div style={S.stationDot} />
              <span style={{ fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
                Active stream telemetry:{' '}
                <strong style={{ color: '#F5F7F2' }}>2,400+ stations live</strong>
              </span>
            </div>
          </div>

          {/* ── Right Visual ── */}
          <div style={{
            ...S.heroRight,
            flexDirection: isMobile ? 'column' : 'row',
            height: isMobile ? 'auto' : 320,
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}>
            {/* Topo map panel */}
            <div style={S.topoWrap}>
              <TopoMap />
            </div>

            {/* Right metric sidebar */}
            <div style={S.metricSidebar}>
              {/* Rainfall Intensity */}
              <div style={S.metricCard}>
                <div style={S.metricRow}>
                  <span style={S.metricLabel}>RAINFALL INTENSITY</span>
                  <span style={{ ...S.metricBadge, color: '#EF4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>PEAK</span>
                </div>
                <div style={S.metricVal}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>18.4</span>
                  <span style={{ fontSize: 12, color: '#8B9298', marginLeft: 4, fontFamily: "'Geist', sans-serif" }}>mm/hr</span>
                </div>
                <div style={S.metricTrend}>
                  <span style={S.metricTrendLabel}>6hr Historical Trend</span>
                  <MiniSpark color="#63D9FF" />
                </div>
              </div>

              {/* Current Stage */}
              <div style={S.metricCard}>
                <div style={S.metricRow}>
                  <span style={S.metricLabel}>CURRENT STAGE</span>
                  <span style={{ ...S.metricBadge, color: '#63D9FF', background: 'rgba(99,217,255,0.12)', border: '1px solid rgba(99,217,255,0.25)' }}>HIGH</span>
                </div>
                <div style={S.metricVal}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist Mono', monospace" }}>1.84</span>
                  <span style={{ fontSize: 12, color: '#8B9298', marginLeft: 4, fontFamily: "'Geist', sans-serif" }}>m</span>
                </div>
                <div style={S.metricTrend}>
                  <span style={S.metricTrendLabel}>6hr Historical Trend</span>
                  <MiniSpark color="#B7F34A" />
                </div>
              </div>

              {/* Surge Probability */}
              <div style={S.metricCard}>
                <div style={S.metricRow}>
                  <span style={S.metricLabel}>SURGE PROBABILITY</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444', animation: 'pulseDot 1.5s ease infinite' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                  <SurgeDonut pct={84} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', fontFamily: "'Geist', sans-serif", marginBottom: 4 }}>High Risk</div>
                    <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.5 }}>
                      Exceeds normal peak<br />levels in 2.4 hrs.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <Section id="how">
        <div style={S.secInner}>
          <div style={S.eyebrow}>HOW IT WORKS</div>
          <h2 style={S.h2}>From Rain Forecast to Pump Action<br />in Under a Second</h2>
          <p style={S.secP}>
            RAPID's AI pipeline monitors live weather data, calculates rising water risk, and automatically
            switches your dewatering pump to the right mode — before the mine floods.
          </p>

          <div style={{ ...S.stepsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
            {[
              { ico: '🌧️', n: 1, title: 'Weather Ingestion', desc: 'WeatherAPI fetches live rainfall, storm probability, and 3-day forecasts for your mine location every 10 minutes.', color: '#63D9FF' },
              { ico: '🧠', n: 2, title: 'AI Risk Analysis',  desc: 'The RAPID AI engine calculates predicted water level rise at +30 min and +60 min using inflow rate and rain probability.', color: '#B7F34A' },
              { ico: '⚙️', n: 3, title: 'Intelligent Decision', desc: 'Based on risk level (LOW/MEDIUM/HIGH/CRITICAL), the AI selects the optimal pump mode automatically.', color: '#F59E0B' },
              { ico: '💧', n: 4, title: 'Automated Control', desc: 'ESP32 hardware receives the pump command and executes it in real time. Every action is logged to Supabase.', color: '#A78BFA' },
            ].map((step, i) => (
              <div key={step.n} style={{ ...S.stepCard, animationDelay: `${i * 0.1}s` }}>
                <div style={{ ...S.stepIconWrap, background: `${step.color}12`, border: `1px solid ${step.color}25` }}>
                  <span style={{ fontSize: 28 }}>{step.ico}</span>
                  <div style={{ ...S.stepNum, color: step.color, borderColor: `${step.color}30` }}>{step.n}</div>
                </div>
                <h3 style={{ ...S.stepTitle, color: step.color }}>{step.title}</h3>
                <p style={S.stepDesc}>{step.desc}</p>
                {i < 3 && <div style={S.stepConnector} />}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════ FEATURES ══════════════ */}
      <Section id="features" bg="#0B0D0F">
        <div style={S.secInner}>
          <div style={S.eyebrow}>CORE FEATURES</div>
          <h2 style={S.h2}>Everything Your Mine Needs,<br />In One Dashboard</h2>

          <div style={{ ...S.featsGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' }}>
            {[
              { ico: '🌧️', color: '#63D9FF', title: '60-Min Rain Prediction', desc: 'AI forecasts water inflow rate up to 60 minutes ahead using live rainfall data, giving you a critical head start before flooding.' },
              { ico: '💧', color: '#63D9FF', title: 'Real-Time Water Level',   desc: 'Ultrasonic sensor data from ESP32 streams live water level readings to your dashboard every few seconds via Supabase Realtime.' },
              { ico: '⚡', color: '#F59E0B', title: 'Solar & Battery Monitor', desc: 'Track solar panel output, battery charge, and pump energy consumption to maximize efficiency during off-grid operation.' },
              { ico: '🤖', color: '#B7F34A', title: 'AI Decision Engine',      desc: 'Our local rule-based AI evaluates 5+ parameters simultaneously and selects the optimal pump mode with zero human input.' },
              { ico: '📊', color: '#A78BFA', title: 'Historical Analytics',    desc: 'Visualize 30-day trends, energy reports, and rainfall correlation charts to identify patterns and optimize future operations.' },
              { ico: '🔔', color: '#EF4444', title: 'Smart Alert System',      desc: 'Instant alerts for critical water levels, low battery, heavy rain forecasts, and emergency pump activations — never miss an event.' },
            ].map((f) => (
              <div key={f.title} style={{ ...S.featCard, '--feat-color': f.color } as any}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${f.color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#22252A'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ ...S.featIco, background: `${f.color}12` }}>
                  <span style={{ fontSize: 22 }}>{f.ico}</span>
                </div>
                <h3 style={{ ...S.featTitle, color: f.color }}>{f.title}</h3>
                <p style={S.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════ PUMP MODES ══════════════ */}
      <Section id="modes">
        <div style={S.secInner}>
          <div style={S.eyebrow}>PUMP INTELLIGENCE</div>
          <h2 style={S.h2}>Four Modes. One Intelligent System.</h2>
          <p style={S.secP}>
            RAPID's AI automatically selects the correct pump intensity based on real-time water levels,
            predicted rainfall, and rate of rise.
          </p>

          <div style={{ ...S.modesGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
            {[
              { color: '#8B9298', bg: '#22252A',                 tag: 'STANDBY',   name: 'OFF Mode',   desc: 'Normal conditions. No rain risk. Water level stable below threshold.', when: 'Water < 40% · Rain < 30%',     ico: '⚪' },
              { color: '#B7F34A', bg: 'rgba(183,243,74,0.08)',   tag: 'LOW',       name: 'Low Speed',  desc: 'Mild inflow detected. Pump operates at 30% capacity to manage gradual rise.', when: 'Water 40–55% · Rain 30–60%', ico: '🟢' },
              { color: '#F97316', bg: 'rgba(249,115,22,0.08)',   tag: 'HIGH',      name: 'High Speed', desc: 'Significant rainfall predicted. Pump at full capacity to prevent dangerous accumulation.', when: 'Water 55–75% · Rain 60–80%', ico: '🟠' },
              { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    tag: 'EMERGENCY', name: 'Emergency',  desc: 'Critical flood risk. Maximum pump power. Immediate human alert triggered.', when: 'Water > 75% · Rain > 80%',   ico: '🔴' },
            ].map(m => (
              <div key={m.name} style={{ ...S.modeCard, borderColor: `${m.color}30`, background: m.bg }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.ico}</div>
                <div style={{ ...S.modeTag, color: m.color, background: `${m.color}15` }}>{m.tag}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Outfit', sans-serif", margin: '12px 0 8px' }}>{m.name}</h3>
                <p style={{ fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.6, marginBottom: 16 }}>{m.desc}</p>
                <div style={{ fontSize: 11, color: m.color, fontFamily: "'Geist Mono', monospace", background: `${m.color}10`, padding: '5px 10px', borderRadius: 6, display: 'inline-block' }}>{m.when}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════ TECHNOLOGY ══════════════ */}
      <Section id="tech" bg="#0B0D0F">
        <div style={S.secInner}>
          <div style={S.eyebrow}>TECHNOLOGY STACK</div>
          <h2 style={S.h2}>Built with Production-Grade Tools</h2>
          <p style={S.secP}>
            Every component of RAPID is chosen for reliability, performance, and ease of hackathon deployment.
          </p>

          <div style={{ ...S.techGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)' }}>
            {[
              { ico: '🌧️', name: 'WeatherAPI',     desc: '1M free calls/mo · Real-time + 3-day forecast', color: '#63D9FF' },
              { ico: '⚛️',  name: 'React 19',       desc: 'TypeScript · Vite · Hot reload',                color: '#63D9FF' },
              { ico: '🗄️', name: 'Supabase',        desc: 'PostgreSQL · Realtime subscriptions',           color: '#B7F34A' },
              { ico: '📡', name: 'ESP32',            desc: 'IoT hardware · REST + Realtime bridge',         color: '#F59E0B' },
              { ico: '📈', name: 'Recharts',         desc: 'Live charts · Prediction visualization',        color: '#A78BFA' },
            ].map(t => (
              <div key={t.name} style={{ ...S.techCard, borderColor: `${t.color}20` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${t.color}50`; (e.currentTarget as HTMLElement).style.background = `${t.color}06`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${t.color}20`; (e.currentTarget as HTMLElement).style.background = '#15181B'; }}
              >
                <div style={{ fontSize: 30, marginBottom: 12 }}>{t.ico}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════ CTA SECTION ══════════════ */}
      <Section id="contact">
        <div style={S.ctaSection}>
          <div style={S.ctaGlow} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={S.eyebrow}>GET IN TOUCH</div>
            <h2 style={{ ...S.h2, fontSize: 40 }}>Ready to Deploy RAPID?</h2>
            <p style={{ ...S.secP, maxWidth: 500, margin: '0 auto 40px' }}>
              Have questions about RAPID or want to deploy it for your mining operations? We'd love to hear from you.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 48, flexWrap: 'wrap' }}>
              {[
                { icon: '✉️', label: 'Email',    val: 'embeddedriders@gmail.com', href: 'mailto:embeddedriders@gmail.com' },
                { icon: '📞', label: 'Phone',    val: '+91 7358962980',            href: 'tel:+917358962980' },
                { icon: '📍', label: 'Location', val: 'Chennai, Tamil Nadu',        href: '#' },
              ].map(c => (
                <a key={c.label} href={c.href} style={S.contactCard}>
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", fontWeight: 500 }}>{c.val}</div>
                  </div>
                </a>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={S.ctaPrimary} onClick={onGetStarted}>🚀 Launch RAPID Now</button>
              <button style={S.ctaOutline} onClick={onLogin}>Sign In to Dashboard</button>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={{ ...S.footerTop, gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? 24 : 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={S.navLogoMark}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" />
                  </svg>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F5F7F2', fontFamily: "'Outfit', sans-serif" }}>RAPID</span>
              </div>
              <p style={{ fontSize: 12, color: '#8B9298', lineHeight: 1.6, maxWidth: 200, fontFamily: "'Geist', sans-serif" }}>
                Rainfall Analysis &amp; Pump Intelligence for Dewatering. SIH 2026.
              </p>
            </div>
            <div>
              <div style={S.footerHead}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Platform', 'how'], ['Scientific Data', 'features'], ['Risk Simulator', 'modes'], ['Hardware', 'tech']].map(([l, id]) => (
                  <button key={id} onClick={() => scrollTo(id)} style={S.footerLink}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={S.footerHead}>Resources</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['Documentation', onLogin], ['Get Started', onGetStarted], ['Contact Us', () => scrollTo('contact')]].map(([l, fn]) => (
                  <button key={String(l)} onClick={fn as () => void} style={S.footerLink}>{String(l)}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={S.footerHead}>Follow Us</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['⌨', 'https://github.com'], ['in', 'https://linkedin.com'], ['𝕏', 'https://twitter.com']].map(([ico, href]) => (
                  <a key={href} href={href} target="_blank" rel="noreferrer" style={S.socialBtn}>{ico}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={S.footerBottom}>
            <span>© 2026 RAPID – Rainfall Analysis &amp; Pump Intelligence for Dewatering. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A' }} />
              <span style={{ color: '#B7F34A' }}>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Keyframe style tag ── */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

/* ── Styles ── */
const sectionBase: React.CSSProperties = {
  padding: '80px 24px',
};

const S: Record<string, React.CSSProperties> = {
  root: { background: '#0B0D0F', minHeight: '100vh', fontFamily: "'Geist', 'Inter', sans-serif", overflowX: 'hidden' },

  // Navbar
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'all 0.3s ease', padding: '0 24px' },
  navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  navLogoMark: { width: 26, height: 26, background: '#B7F34A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navLogoText: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 18, color: '#F5F7F2', letterSpacing: '-0.02em' },
  navLinks: { display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: 4 },
  navLink: { background: 'none', border: 'none', color: '#8B9298', fontSize: 14, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontFamily: "'Geist', sans-serif", transition: 'color 0.2s, background 0.2s' },
  navActions: { display: 'flex', gap: 12, alignItems: 'center' },

  // SYS chip
  sysChip: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(183,243,74,0.08)', border: '1px solid rgba(183,243,74,0.2)', borderRadius: 100, padding: '5px 12px', color: '#B7F34A' },
  sysDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A', animation: 'pulseDot 2s ease infinite', flexShrink: 0 },

  // Request Access button
  requestBtn: { background: 'transparent', color: '#F5F7F2', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'all 0.2s' },

  // Hero
  hero: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: 60 },
  heroBg: { position: 'absolute', inset: 0, zIndex: 0 },
  glow: { position: 'absolute', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' },
  glowLime: { width: 500, height: 500, background: '#B7F34A', opacity: 0.05, top: '-15%', left: '0%' },
  glowCyan: { width: 400, height: 400, background: '#00e5c4', opacity: 0.04, top: '10%', right: '5%' },
  heroGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' },

  heroInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%',
    display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center',
    position: 'relative', zIndex: 1,
  },
  heroLeft: { display: 'flex', flexDirection: 'column', gap: 24 },

  // Badge
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(183,243,74,0.08)', border: '1px solid rgba(183,243,74,0.2)', borderRadius: 100, padding: '6px 14px', fontSize: 11, color: '#B7F34A', fontFamily: "'Geist', sans-serif", fontWeight: 700, width: 'fit-content', letterSpacing: '0.05em' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 8px #B7F34A', animation: 'pulseDot 2s ease infinite', flexShrink: 0 },

  // Hero text
  heroH1: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 60, color: '#F5F7F2', lineHeight: 1.05, margin: 0, letterSpacing: '-0.03em' },
  heroCopy: { fontSize: 16, color: '#8B9298', lineHeight: 1.7, margin: 0, fontFamily: "'Geist', sans-serif", maxWidth: 420 },
  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  ctaPrimary: { background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'opacity 0.2s, transform 0.15s' },
  ctaOutline: { background: 'transparent', color: '#F5F7F2', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'border-color 0.2s' },
  stationLine: { display: 'flex', alignItems: 'center', gap: 8 },
  stationDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A', flexShrink: 0 },

  // Hero right
  heroRight: { display: 'flex', gap: 12, alignItems: 'stretch', height: 320 },
  topoWrap: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    border: '1px solid rgba(0,229,196,0.2)',
    boxShadow: '0 0 40px rgba(0,229,196,0.06)',
  },
  metricSidebar: { width: 160, display: 'flex', flexDirection: 'column', gap: 8 },
  metricCard: {
    background: '#10181A',
    border: '1px solid #1C2828',
    borderRadius: 10,
    padding: '12px 14px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.08em' },
  metricBadge: { fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, fontFamily: "'Geist', sans-serif" },
  metricVal: { display: 'flex', alignItems: 'baseline' },
  metricTrend: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metricTrendLabel: { fontSize: 9, color: '#8B9298', fontFamily: "'Geist', sans-serif" },

  // Partner strip
  partnerStrip: {
    borderTop: '1px solid #1a1e22', borderBottom: '1px solid #1a1e22',
    padding: '20px 48px', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap',
    background: '#0B0D0F',
  },
  partnerLabel: { fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.12em', flexShrink: 0 },
  partnerName:  { fontSize: 15, color: '#4A5158', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },

  // Section commons
  secInner: { maxWidth: 1100, margin: '0 auto' },
  eyebrow: { fontSize: 11, fontWeight: 700, color: '#B7F34A', fontFamily: "'Geist', sans-serif", letterSpacing: '0.15em', marginBottom: 16 },
  h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 44, color: '#F5F7F2', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' },
  secP: { fontSize: 16, color: '#8B9298', lineHeight: 1.7, margin: '0 0 48px', fontFamily: "'Geist', sans-serif", maxWidth: 600 },

  // Steps
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' },
  stepCard: { display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' },
  stepIconWrap: { width: 64, height: 64, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4 },
  stepNum: { position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', border: '1px solid', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0D0F', fontFamily: "'Geist', sans-serif" },
  stepTitle: { fontSize: 16, fontWeight: 700, fontFamily: "'Geist', sans-serif" },
  stepDesc: { fontSize: 13, color: '#8B9298', lineHeight: 1.6, fontFamily: "'Geist', sans-serif" },
  stepConnector: { position: 'absolute', top: 32, left: '100%', width: 24, height: 1, background: 'linear-gradient(90deg, #22252A, transparent)' },

  // Features
  featsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 },
  featCard: { background: '#15181B', border: '1px solid #22252A', borderRadius: 14, padding: '24px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' },
  featIco: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: 15, fontWeight: 700, fontFamily: "'Geist', sans-serif" },
  featDesc: { fontSize: 13, color: '#8B9298', lineHeight: 1.6, fontFamily: "'Geist', sans-serif" },

  // Modes
  modesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 },
  modeCard: { border: '1px solid', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' },
  modeTag: { display: 'inline-block', fontSize: 11, fontWeight: 700, fontFamily: "'Geist', sans-serif", letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 20, width: 'fit-content' },

  // Tech
  techGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 },
  techCard: { background: '#15181B', border: '1px solid', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },

  // CTA
  ctaSection: { maxWidth: 900, margin: '0 auto', position: 'relative', background: 'rgba(183,243,74,0.04)', border: '1px solid rgba(183,243,74,0.12)', borderRadius: 24, padding: '64px 48px', overflow: 'hidden', textAlign: 'center' },
  ctaGlow: { position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, background: '#B7F34A', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.08, pointerEvents: 'none' },
  contactCard: { display: 'flex', alignItems: 'center', gap: 12, background: '#15181B', border: '1px solid #22252A', borderRadius: 12, padding: '14px 20px', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s, background 0.2s' },

  // Footer
  footer: { background: '#0B0D0F', borderTop: '1px solid #22252A', padding: '48px 24px 32px' },
  footerInner: { maxWidth: 1100, margin: '0 auto' },
  footerTop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 32 },
  footerHead: { fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", marginBottom: 16 },
  footerLink: { background: 'none', border: 'none', color: '#8B9298', fontSize: 13, cursor: 'pointer', fontFamily: "'Geist', sans-serif", textAlign: 'left', padding: 0, transition: 'color 0.2s' },
  footerBottom: { borderTop: '1px solid #22252A', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" },
  socialBtn: { width: 36, height: 36, background: '#15181B', border: '1px solid #22252A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B9298', textDecoration: 'none', fontSize: 14, transition: 'all 0.2s' },
};
