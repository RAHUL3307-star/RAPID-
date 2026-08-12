import React, { useState, useEffect, useRef } from 'react';
import type { AuthUser } from '../hooks/useAuth';
import { Mail, Phone, MapPin, Droplet } from 'lucide-react';

interface LandingPageProps {
  onLogin:     () => void;
  onGetStarted: () => void;
  user:        AuthUser | null;
  onDashboard: () => void;
}

/* ── Rain drops data ── */
const DROPS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  height: `${Math.random() * 18 + 12}px`,
  delay: `${Math.random() * 4}s`,
  duration: `${Math.random() * 1.5 + 1.2}s`,
  opacity: Math.random() * 0.5 + 0.2,
}));

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin, onGetStarted, user, onDashboard,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="land-root">

      {/* ── Navbar ── */}
      <nav className={`land-nav${scrolled ? ' scrolled' : ''}`}>
        <a className="land-nav-logo" href="#">
          <div className="land-nav-logo-icon">🌧️</div>
          <span className="land-nav-logo-text">RAPID</span>
        </a>

        <ul className="land-nav-links">
          <li><a href="#" onClick={e=>{ e.preventDefault(); scrollTo('how'); }}>How It Works</a></li>
          <li><a href="#" onClick={e=>{ e.preventDefault(); scrollTo('features'); }}>Features</a></li>
          <li><a href="#" onClick={e=>{ e.preventDefault(); scrollTo('modes'); }}>Pump Modes</a></li>
          <li><a href="#" onClick={e=>{ e.preventDefault(); scrollTo('tech'); }}>Technology</a></li>
        </ul>

        <div className="land-nav-actions">
          {user ? (
            <button className="land-btn-primary" onClick={onDashboard}>
              Open Dashboard →
            </button>
          ) : (
            <>
              <button className="land-btn-ghost" onClick={onLogin}>Log In</button>
              <button className="land-btn-primary" onClick={onGetStarted}>Get Started →</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero" ref={heroRef}>
        <div className="land-hero-decor">
          <div className="land-hero-blob1" />
          <div className="land-hero-blob2" />
          {/* Rain drops */}
          <div className="land-rain">
            {DROPS.map(d => (
              <div key={d.id} className="land-drop" style={{
                left: d.left,
                height: d.height,
                animationDelay: d.delay,
                animationDuration: d.duration,
                opacity: d.opacity,
              }} />
            ))}
          </div>
        </div>

        <div className="land-hero-inner">
          {/* Left — copy */}
          <div className="land-hero-left">
            <div className="land-badge">
              <div className="land-badge-dot" />
              Smart India Hackathon 2026 · SIH Project
            </div>

            <h1 className="land-h1">
              Intelligent<br />
              <span className="land-h1-cyan">Dewatering,</span><br />
              Predictive by Design.
            </h1>

            <p className="land-lead">
              RAPID uses real-time rainfall data + AI to predict water level rise 60 minutes ahead,
              automatically activating the right pump mode before flooding begins.
            </p>

            <div className="land-ctas">
              <button className="land-btn-xl solid" onClick={onGetStarted}>
                🚀 Get Started Free
              </button>
              <button className="land-btn-xl outline" onClick={() => scrollTo('how')}>
                ▶ See How It Works
              </button>
            </div>

            <div className="land-mini-stats">
              {[
                { val: '60 min', lbl: 'Prediction Horizon' },
                { val: '99.9%', lbl: 'System Uptime' },
                { val: '4',     lbl: 'Pump Modes (AI)' },
                { val: '1M+',   lbl: 'Weather API Calls/mo' },
              ].map(s => (
                <div key={s.lbl}>
                  <div className="land-mini-stat-val">{s.val}</div>
                  <div className="land-mini-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — live dashboard preview */}
          <div className="land-hero-right">
            {/* Floating metric 1 */}
            <div className="land-float f1">
              <div className="land-float-lbl">AI Prediction</div>
              <div className="land-float-val">
                <span style={{ color:'#06B6D4' }}>⚡</span>
                +30min: 72%
              </div>
            </div>

            {/* Main card */}
            <div className="land-visual">
              <div className="land-visual-hdr">
                <div className="land-visual-title">🌧️ RAPID Dashboard</div>
                <div className="land-live">
                  <div className="land-live-dot" />
                  LIVE
                </div>
              </div>

              <div className="land-g-row">
                {[
                  { lbl:'Water Level', val:'63', unit:'%', fill:63 },
                  { lbl:'Rain Prob.',  val:'85', unit:'%', fill:85 },
                  { lbl:'Battery',     val:'87', unit:'%', fill:87 },
                  { lbl:'Solar Power', val:'720', unit:'W', fill:72 },
                ].map(g => (
                  <div className="land-g-card" key={g.lbl}>
                    <div className="land-g-lbl">{g.lbl}</div>
                    <div className="land-g-val">{g.val}<span className="land-g-unit"> {g.unit}</span></div>
                    <div className="land-g-bar"><div className="land-g-fill" style={{ width:`${g.fill}%` }} /></div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:10, fontSize:11, color:'#64748B', fontWeight:600 }}>PUMP STATUS</div>
              <div className="land-p-row">
                <div className="land-p-badge off">OFF</div>
                <div className="land-p-badge low">LOW</div>
                <div className="land-p-badge high">HIGH ●</div>
                <div className="land-p-badge emg">EMERGENCY</div>
              </div>
            </div>

            {/* Floating metric 2 */}
            <div className="land-float f2">
              <div className="land-float-lbl">Alert</div>
              <div className="land-float-val">
                <span>🚨</span>
                Heavy Rain Alert
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <div className="land-band">
        <div className="land-band-grid">
          {[
            { val:'60 min', lbl:'AI Prediction Horizon' },
            { val:'4',      lbl:'Intelligent Pump Modes' },
            { val:'1M+',    lbl:'Free Weather API Calls/mo' },
            { val:'24/7',   lbl:'Realtime Monitoring' },
          ].map(s => (
            <div key={s.lbl}>
              <div className="land-band-val">{s.val}</div>
              <div className="land-band-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <section className="land-sec" id="how">
        <div className="land-sec-inner">
          <div className="land-eyebrow">How It Works</div>
          <h2 className="land-h2">From Rain Forecast to Pump Action<br />in Under a Second</h2>
          <p className="land-p">
            RAPID's AI pipeline monitors live weather data, calculates rising water risk, and automatically
            switches your dewatering pump to the right mode — before the mine floods.
          </p>

          <div className="land-steps">
            {[
              { ico:'🌧️', n:1, title:'Weather Ingestion', desc:'WeatherAPI fetches live rainfall, storm probability, and 3-day forecasts for your mine location every 10 minutes.' },
              { ico:'🧠', n:2, title:'AI Risk Analysis',  desc:'The RAPID AI engine calculates predicted water level rise at +30 min and +60 min using inflow rate and rain probability.' },
              { ico:'⚙️', n:3, title:'Intelligent Decision', desc:'Based on risk level (LOW/MEDIUM/HIGH/CRITICAL), the AI selects the optimal pump mode automatically.' },
              { ico:'💧', n:4, title:'Automated Control', desc:'ESP32 hardware receives the pump command and executes it in real time. Every action is logged to Supabase.' },
            ].map(s => (
              <div className="land-step" key={s.n}>
                <div className="land-step-icon">
                  {s.ico}
                  <span className="land-step-n">{s.n}</span>
                </div>
                <div className="land-step-title">{s.title}</div>
                <div className="land-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-sec alt" id="features">
        <div className="land-sec-inner">
          <div className="land-eyebrow">Core Features</div>
          <h2 className="land-h2">Everything Your Mine Needs,<br />In One Dashboard</h2>

          <div className="land-feats">
            {[
              { ico:'🌧️', bg:'rgba(6,182,212,.08)', title:'60-Min Rain Prediction', desc:'AI forecasts water inflow rate up to 60 minutes ahead using live rainfall data, giving you a critical head start before flooding.' },
              { ico:'💧', bg:'rgba(6,182,212,.08)', title:'Real-Time Water Level', desc:'Ultrasonic sensor data from ESP32 streams live water level readings to your dashboard every few seconds via Supabase Realtime.' },
              { ico:'⚡', bg:'rgba(234,179,8,.1)',  title:'Solar & Battery Monitor', desc:'Track solar panel output, battery charge, and pump energy consumption to maximize efficiency during off-grid operation.' },
              { ico:'🤖', bg:'rgba(139,92,246,.1)', title:'AI Decision Engine',    desc:'Our local rule-based AI evaluates 5+ parameters simultaneously and selects the optimal pump mode with zero human input.' },
              { ico:'📊', bg:'rgba(6,182,212,.08)', title:'Historical Analytics',  desc:'Visualize 30-day trends, energy reports, and rainfall correlation charts to identify patterns and optimize future operations.' },
              { ico:'🔔', bg:'rgba(239,68,68,.08)', title:'Smart Alert System',    desc:'Instant alerts for critical water levels, low battery, heavy rain forecasts, and emergency pump activations — never miss an event.' },
            ].map(f => (
              <div className="land-feat" key={f.title}>
                <div className="land-feat-ico" style={{ background:f.bg }}>{f.ico}</div>
                <div className="land-feat-title">{f.title}</div>
                <div className="land-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pump Modes ── */}
      <section className="land-sec" id="modes">
        <div className="land-sec-inner">
          <div className="land-eyebrow">Pump Intelligence</div>
          <h2 className="land-h2">Four Modes. One Intelligent System.</h2>
          <p className="land-p">
            RAPID's AI automatically selects the correct pump intensity based on real-time water levels,
            predicted rainfall, and rate of rise.
          </p>

          <div className="land-modes">
            {[
              { cls:'m-off', ico:'⚪', tag:'STANDBY', name:'OFF Mode',  desc:'Normal conditions. No rain risk. Water level stable below threshold.', when:'Water < 40% · Rain < 30%' },
              { cls:'m-low', ico:'🟢', tag:'LOW',     name:'Low Speed', desc:'Mild inflow detected. Pump operates at 30% capacity to manage gradual rise.', when:'Water 40–55% · Rain 30–60%' },
              { cls:'m-hi',  ico:'🟠', tag:'HIGH',    name:'High Speed', desc:'Significant rainfall predicted. Pump at full capacity to prevent dangerous accumulation.', when:'Water 55–75% · Rain 60–80%' },
              { cls:'m-emg', ico:'🔴', tag:'EMERGENCY', name:'Emergency', desc:'Critical flood risk. Maximum pump power. Immediate human alert triggered.', when:'Water > 75% · Rain > 80%' },
            ].map(m => (
              <div className={`land-mode ${m.cls}`} key={m.name}>
                <span className="land-mode-ico">{m.ico}</span>
                <div className="land-mode-tag">{m.tag}</div>
                <div className="land-mode-name">{m.name}</div>
                <div className="land-mode-desc">{m.desc}</div>
                <div className="land-mode-when">{m.when}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ── */}
      <section className="land-sec dark" id="tech">
        <div className="land-sec-inner">
          <div className="land-eyebrow light">Technology Stack</div>
          <h2 className="land-h2 light">Built with Production-Grade Tools</h2>
          <p className="land-p light">
            Every component of RAPID is chosen for reliability, performance, and ease of hackathon deployment.
          </p>

          <div className="land-tech">
            {[
              { ico:'🌧️', name:'WeatherAPI',  desc:'1M free calls/mo · Real-time + 3-day forecast' },
              { ico:'⚛️', name:'React 19',    desc:'TypeScript · Vite · Hot reload' },
              { ico:'🗄️', name:'Supabase',    desc:'PostgreSQL · Realtime subscriptions' },
              { ico:'📡', name:'ESP32',        desc:'IoT hardware · REST + Realtime' },
              { ico:'📈', name:'Recharts',     desc:'Live charts · Prediction visualization' },
            ].map(t => (
              <div className="land-tech-card" key={t.name}>
                <span className="land-tech-ico">{t.ico}</span>
                <div className="land-tech-name">{t.name}</div>
                <div className="land-tech-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get in Touch */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="contact">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 lg:p-12 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">Get in Touch</h3>
            <p className="text-blue-50 mb-8 text-lg">
              Have questions or want to learn more about RAPID? We'd love to hear from you!
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center gap-2">
                <Mail className="w-6 h-6" />
                <p className="text-blue-100 text-sm font-semibold">Email</p>
                <p className="text-sm">embeddedriders@gmail.com</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Phone className="w-6 h-6" />
                <p className="text-blue-100 text-sm font-semibold">Phone</p>
                <p className="text-sm">+91 7358962980</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="w-6 h-6" />
                <p className="text-blue-100 text-sm font-semibold">Location</p>
                <p className="text-sm">Chennai, Tamil Nadu</p>
              </div>
            </div>
            <button
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium cursor-pointer"
              onClick={() => window.location.href = 'mailto:embeddedriders@gmail.com'}
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-wider">RAPID</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                RAPID – Rainfall Analysis &amp; Pump Intelligence for Dewatering
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-200">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('hero'); }} className="hover:text-white transition-colors">Home</a></li>
                <li><a href="#idea" onClick={(e) => { e.preventDefault(); scrollTo('how'); }} className="hover:text-white transition-colors">Idea</a></li>
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how'); }} className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#scenarios" onClick={(e) => { e.preventDefault(); scrollTo('modes'); }} className="hover:text-white transition-colors">Scenarios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-200">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#components" onClick={(e) => { e.preventDefault(); scrollTo('features'); }} className="hover:text-white transition-colors">Components</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }} className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onLogin(); }} className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onGetStarted(); }} className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-200">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors text-white">
                  <span style={{ fontSize: 18 }}>⌨</span>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors text-white">
                  <span style={{ fontSize: 18 }}>in</span>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors text-white">
                  <span style={{ fontSize: 18 }}>𝕏</span>
                </a>
              </div>
              <p className="text-gray-400 mt-4 text-sm">
                Join our community of RAPID lovers.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 RAPID – Rainfall Analysis &amp; Pump Intelligence for Dewatering. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
