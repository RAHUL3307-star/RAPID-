import React, { useState, useEffect, useRef } from 'react';
import type { AuthUser } from '../hooks/useAuth';

interface LandingPageProps {
  onLogin:      () => void;
  onGetStarted: () => void;
  user:         AuthUser | null;
  onDashboard:  () => void;
}

/* ── Animated rain drops ── */
const DROPS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i / 40) * 100 + (Math.random() * 2.5 - 1.25)}%`,
  height: `${Math.random() * 22 + 10}px`,
  delay: `${Math.random() * 5}s`,
  duration: `${Math.random() * 1.2 + 1}s`,
  opacity: Math.random() * 0.35 + 0.1,
  width: `${Math.random() * 1.5 + 0.5}px`,
}));

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

/* ── Animated counter ── */
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    const dur = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref}>{val}{suffix}</span>;
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

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGetStarted, user, onDashboard }) => {
  const [scrolled, setScrolled] = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState(0);

  useEffect(() => {
    setTimeout(() => setHeroMounted(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cycle through live metrics
  useEffect(() => {
    const t = setInterval(() => setActiveMetric(p => (p + 1) % 4), 2000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={S.root}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        ...S.nav,
        background: scrolled ? 'rgba(11,13,15,0.95)' : 'transparent',
        borderBottom: scrolled ? '1px solid #22252A' : '1px solid transparent',
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
              ['How It Works', 'how'],
              ['Features', 'features'],
              ['Pump Modes', 'modes'],
              ['Technology', 'tech'],
            ].map(([label, id]) => (
              <li key={id}>
                <button
                  style={S.navLink}
                  onClick={() => scrollTo(id)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div style={S.navActions}>
            {user ? (
              <button style={S.primaryBtn} onClick={onDashboard}>
                Open Dashboard →
              </button>
            ) : (
              <>
                <button style={S.ghostBtn} onClick={onLogin}>Log In</button>
                <button style={S.primaryBtn} onClick={onGetStarted}>Get Started →</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section style={S.hero}>
        {/* Background layers */}
        <div style={S.heroBg}>
          <div style={{ ...S.glow, ...S.glowLime }} />
          <div style={{ ...S.glow, ...S.glowCyan }} />
          <div style={{ ...S.glow, ...S.glowPurple }} />
          {/* Grid lines */}
          <div style={S.heroGrid} />
          {/* Rain drops */}
          <div style={S.rainContainer}>
            {DROPS.map(d => (
              <div key={d.id} style={{
                position: 'absolute',
                left: d.left,
                width: d.width,
                height: d.height,
                background: 'linear-gradient(to bottom, transparent, rgba(99,217,255,0.6))',
                borderRadius: 2,
                animation: `rainFall ${d.duration} linear ${d.delay} infinite`,
                opacity: d.opacity,
              }} />
            ))}
          </div>
        </div>

        <div style={S.heroInner}>
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
              Smart India Hackathon 2026 · SIH Project
            </div>

            <h1 style={S.heroH1}>
              Intelligent<br />
              <span style={{ color: '#B7F34A' }}>Dewatering,</span><br />
              Predictive by Design.
            </h1>

            <p style={S.heroCopy}>
              RAPID uses real-time rainfall data + AI to predict water level rise
              60 minutes ahead, automatically activating the right pump mode before flooding begins.
            </p>

            <div style={S.heroCtas}>
              <button style={S.ctaPrimary} onClick={onGetStarted}>
                🚀 Get Started Free
              </button>
              <button style={S.ctaOutline} onClick={() => scrollTo('how')}>
                ▶ See How It Works
              </button>
            </div>

            {/* Mini stats */}
            <div style={S.heroStats}>
              {[
                { val: '60', suffix: ' min', lbl: 'Prediction Horizon' },
                { val: 99,   suffix: '.9%',  lbl: 'System Uptime', isNum: true },
                { val: '4',  suffix: '',     lbl: 'AI Pump Modes' },
                { val: '1M', suffix: '+',    lbl: 'API Calls/mo' },
              ].map((s) => (
                <div key={s.lbl} style={S.heroStat}>
                  <div style={S.heroStatVal}>
                    {s.lbl === 'System Uptime' ? (
                      <><CountUp target={99} />{s.suffix}</>
                    ) : s.val}{s.lbl !== 'System Uptime' ? s.suffix : ''}
                  </div>
                  <div style={S.heroStatLbl}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Visual ── */}
          <div style={{
            ...S.heroRight,
            opacity: heroMounted ? 1 : 0,
            transform: heroMounted ? 'translateX(0)' : 'translateX(40px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}>
            {/* Floating alert badge */}
            <div style={{ ...S.floatCard, top: '5%', right: '-5%', animationDelay: '0s' }}>
              <div style={S.floatBadge}>
                <span style={{ ...S.floatDot, background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                <div>
                  <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>ALERT</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>Heavy Rain Detected</div>
                </div>
              </div>
            </div>

            {/* Main dashboard preview card */}
            <div style={S.dashCard}>
              <div style={S.dashCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={S.logoMarkSmall}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
                    RAPID Dashboard
                  </span>
                </div>
                <div style={S.liveBadge}>
                  <div style={S.liveDot} />
                  LIVE
                </div>
              </div>

              {/* Animated metrics */}
              <div style={S.dashMetrics}>
                {[
                  { lbl: 'Water Level', val: '63', unit: '%', fill: 63, color: '#63D9FF' },
                  { lbl: 'Rain Prob.',  val: '85', unit: '%', fill: 85, color: '#EF4444' },
                  { lbl: 'Battery',     val: '87', unit: '%', fill: 87, color: '#B7F34A' },
                  { lbl: 'Solar',       val: '720', unit: 'W', fill: 72, color: '#F59E0B' },
                ].map((m, i) => (
                  <div key={m.lbl} style={{ ...S.dashMetric, background: activeMetric === i ? `${m.color}12` : '#0B0D0F', transition: 'background 0.4s ease' }}>
                    <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em' }}>{m.lbl}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: "'Geist Mono', monospace" }}>
                      {m.val}<span style={{ fontSize: 11, color: '#8B9298' }}>{m.unit}</span>
                    </div>
                    <div style={{ height: 3, background: '#22252A', borderRadius: 2, marginTop: 6 }}>
                      <div style={{ height: '100%', width: `${m.fill}%`, background: m.color, borderRadius: 2, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pump modes */}
              <div style={S.pumpRow}>
                <div style={{ fontSize: 10, color: '#8B9298', marginBottom: 8, fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em' }}>PUMP MODE</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: 'OFF',       color: '#8B9298', bg: '#22252A' },
                    { label: 'LOW',       color: '#63D9FF', bg: 'rgba(99,217,255,0.15)' },
                    { label: 'HIGH ●',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)', active: true },
                    { label: 'EMERGENCY', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
                  ].map(p => (
                    <div key={p.label} style={{
                      padding: '5px 9px',
                      borderRadius: 5,
                      background: p.bg,
                      fontSize: 10,
                      fontWeight: p.active ? 700 : 500,
                      color: p.color,
                      fontFamily: "'Geist', sans-serif",
                      border: p.active ? `1px solid ${p.color}40` : '1px solid transparent',
                    }}>
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI prediction row */}
              <div style={S.aiRow}>
                <span style={S.aiTag}>🤖 AI PREDICTION</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, fontFamily: "'Geist Mono', monospace" }}>
                  <span style={{ color: '#63D9FF' }}>+30min: 72%</span>
                  <span style={{ color: '#EF4444' }}>+60min: 89%</span>
                </div>
              </div>
            </div>

            {/* Floating AI badge */}
            <div style={{ ...S.floatCard, bottom: '8%', left: '-8%', animationDelay: '1s' }}>
              <div style={S.floatBadge}>
                <span style={{ ...S.floatDot, background: '#B7F34A', boxShadow: '0 0 8px #B7F34A' }} />
                <div>
                  <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>AI DECISION</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>AUTO → HIGH SPEED</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={S.scrollIndicator}>
          <div style={S.scrollDot} />
          <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>Scroll to explore</span>
        </div>
      </section>

      {/* ══════════════ STATS BAND ══════════════ */}
      <Section>
        <div style={S.statsBand}>
          {[
            { val: 60,   suffix: ' min', lbl: 'AI Prediction Horizon',    isCount: true },
            { val: '4',  suffix: '',     lbl: 'Intelligent Pump Modes',    isCount: false },
            { val: '1M', suffix: '+',    lbl: 'Free Weather API Calls/mo', isCount: false },
            { val: '24', suffix: '/7',   lbl: 'Realtime Monitoring',       isCount: true },
          ].map((s, i) => (
            <div key={i} style={S.statItem}>
              <div style={S.statVal}>
                {s.isCount ? <><CountUp target={Number(s.val)} />{s.suffix}</> : `${s.val}${s.suffix}`}
              </div>
              <div style={S.statLbl}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <Section id="how">
        <div style={S.secInner}>
          <div style={S.eyebrow}>HOW IT WORKS</div>
          <h2 style={S.h2}>From Rain Forecast to Pump Action<br />in Under a Second</h2>
          <p style={S.secP}>
            RAPID's AI pipeline monitors live weather data, calculates rising water risk, and automatically
            switches your dewatering pump to the right mode — before the mine floods.
          </p>

          <div style={S.stepsGrid}>
            {[
              { ico: '🌧️', n: 1, title: 'Weather Ingestion', desc: 'WeatherAPI fetches live rainfall, storm probability, and 3-day forecasts for your mine location every 10 minutes.', color: '#63D9FF' },
              { ico: '🧠', n: 2, title: 'AI Risk Analysis',  desc: 'The RAPID AI engine calculates predicted water level rise at +30 min and +60 min using inflow rate and rain probability.', color: '#B7F34A' },
              { ico: '⚙️', n: 3, title: 'Intelligent Decision', desc: 'Based on risk level (LOW/MEDIUM/HIGH/CRITICAL), the AI selects the optimal pump mode automatically.', color: '#F59E0B' },
              { ico: '💧', n: 4, title: 'Automated Control', desc: 'ESP32 hardware receives the pump command and executes it in real time. Every action is logged to Supabase.', color: '#A78BFA' },
            ].map((step, i) => (
              <div key={step.n} style={{
                ...S.stepCard,
                animationDelay: `${i * 0.1}s`,
              }}>
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

          <div style={S.featsGrid}>
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

          <div style={S.modesGrid}>
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

          <div style={S.techGrid}>
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
          <div style={S.footerTop}>
            {/* Brand */}
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
                Rainfall Analysis & Pump Intelligence for Dewatering. SIH 2026.
              </p>
            </div>
            {/* Links */}
            <div>
              <div style={S.footerHead}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['How It Works', 'how'], ['Features', 'features'], ['Pump Modes', 'modes'], ['Technology', 'tech']].map(([l, id]) => (
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
            <span>© 2026 RAPID – Rainfall Analysis & Pump Intelligence for Dewatering. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A' }} />
              <span style={{ color: '#B7F34A' }}>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Keyframe style tag ── */}
      <style>{`
        @keyframes rainFall {
          0%   { transform: translateY(-20px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
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
  root: { background: '#111416', minHeight: '100vh', fontFamily: "'Geist', 'Inter', sans-serif", overflowX: 'hidden' },

  // Navbar
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'all 0.3s ease', padding: '0 24px' },
  navInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  navLogoMark: { width: 26, height: 26, background: '#B7F34A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navLogoText: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: '#F5F7F2', letterSpacing: '-0.02em' },
  navLinks: { display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: 4 },
  navLink: { background: 'none', border: 'none', color: '#8B9298', fontSize: 14, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, fontFamily: "'Geist', sans-serif", transition: 'color 0.2s, background 0.2s' },
  navActions: { display: 'flex', gap: 10, alignItems: 'center' },
  primaryBtn: { background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'opacity 0.2s, transform 0.15s' },
  ghostBtn: { background: 'transparent', color: '#F5F7F2', border: '1px solid #22252A', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'border-color 0.2s' },

  // Hero
  hero: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: 64 },
  heroBg: { position: 'absolute', inset: 0, zIndex: 0 },
  glow: { position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' },
  glowLime: { width: 400, height: 400, background: '#B7F34A', opacity: 0.08, top: '-10%', left: '5%' },
  glowCyan: { width: 300, height: 300, background: '#63D9FF', opacity: 0.07, top: '20%', right: '10%' },
  glowPurple: { width: 250, height: 250, background: '#A78BFA', opacity: 0.06, bottom: '5%', left: '30%' },
  heroGrid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' },
  rainContainer: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' },
  heroInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', position: 'relative', zIndex: 1 },
  heroLeft: { display: 'flex', flexDirection: 'column', gap: 28 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(183,243,74,0.1)', border: '1px solid rgba(183,243,74,0.25)', borderRadius: 100, padding: '6px 14px', fontSize: 12, color: '#B7F34A', fontFamily: "'Geist', sans-serif", fontWeight: 600, width: 'fit-content' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 8px #B7F34A', animation: 'pulseDot 2s ease infinite' },
  heroH1: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 58, color: '#F5F7F2', lineHeight: 1.05, margin: 0, letterSpacing: '-0.03em' },
  heroCopy: { fontSize: 17, color: '#8B9298', lineHeight: 1.7, margin: 0, fontFamily: "'Geist', sans-serif" },
  heroCtas: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  ctaPrimary: { background: '#B7F34A', color: '#0B0D0F', border: 'none', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'opacity 0.2s, transform 0.15s', boxShadow: '0 0 30px rgba(183,243,74,0.25)' },
  ctaOutline: { background: 'transparent', color: '#F5F7F2', border: '1px solid #22252A', borderRadius: 10, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist', sans-serif", transition: 'border-color 0.2s' },
  heroStats: { display: 'flex', gap: 32 },
  heroStat: { display: 'flex', flexDirection: 'column', gap: 2 },
  heroStatVal: { fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: 22, color: '#F5F7F2' },
  heroStatLbl: { fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif", letterSpacing: '0.05em' },
  heroRight: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Float cards
  floatCard: { position: 'absolute', zIndex: 10, animation: 'floatY 3s ease-in-out infinite' },
  floatBadge: { background: 'rgba(21,24,27,0.95)', backdropFilter: 'blur(12px)', border: '1px solid #22252A', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  floatDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, animation: 'pulseDot 1.5s ease infinite' },

  // Dashboard card
  dashCard: { background: '#15181B', border: '1px solid #22252A', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', gap: 16 },
  dashCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoMarkSmall: { width: 22, height: 22, background: '#B7F34A', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#B7F34A', fontFamily: "'Geist', sans-serif", fontWeight: 700 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A', animation: 'pulseDot 1.2s ease infinite' },
  dashMetrics: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  dashMetric: { background: '#0B0D0F', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 },
  pumpRow: { background: '#0B0D0F', borderRadius: 8, padding: 12 },
  aiRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(183,243,74,0.06)', border: '1px solid rgba(183,243,74,0.15)', borderRadius: 8, padding: '10px 14px' },
  aiTag: { fontSize: 11, fontFamily: "'Geist', sans-serif", fontWeight: 700, color: '#B7F34A', letterSpacing: '0.06em' },

  // Scroll indicator
  scrollIndicator: { position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 },
  scrollDot: { width: 20, height: 32, border: '2px solid #22252A', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 3 },

  // Stats band
  statsBand: { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, textAlign: 'center' },
  statItem: { display: 'flex', flexDirection: 'column', gap: 6 },
  statVal: { fontFamily: "'Geist Mono', monospace", fontWeight: 700, fontSize: 36, color: '#B7F34A', letterSpacing: '-0.02em' },
  statLbl: { fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif" },

  // Section commons
  secInner: { maxWidth: 1100, margin: '0 auto' },
  eyebrow: { fontSize: 11, fontWeight: 700, color: '#B7F34A', fontFamily: "'Geist', sans-serif", letterSpacing: '0.15em', marginBottom: 16 },
  h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 44, color: '#F5F7F2', lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em' },
  secP: { fontSize: 16, color: '#8B9298', lineHeight: 1.7, margin: '0 0 48px', fontFamily: "'Geist', sans-serif", maxWidth: 600 },

  // Steps
  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' },
  stepCard: { display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' },
  stepIconWrap: { width: 64, height: 64, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4 },
  stepNum: { position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', border: '1px solid', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111416', fontFamily: "'Geist', sans-serif" },
  stepTitle: { fontSize: 16, fontWeight: 700, fontFamily: "'Geist', sans-serif" },
  stepDesc: { fontSize: 13, color: '#8B9298', lineHeight: 1.6, fontFamily: "'Geist', sans-serif" },
  stepConnector: { position: 'absolute', top: 32, left: '100%', width: 24, height: 1, background: 'linear-gradient(90deg, #22252A, transparent)' },

  // Features grid
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

  // CTA section
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
