import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';

interface LoginPageProps {
  onBack:    () => void;
  onSuccess: () => void;
}



export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSuccess }) => {
  const { signIn, signUp, signInAsDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Dewatering Engineer');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    if (pass.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: '#EF4444' };
    let score = 2;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
    if (score === 3 || score === 4) return { score: 3, label: 'Good', color: '#10B981' };
    return { score: 4, label: 'Strong', color: '#B7F34A' };
  };

  const strength = getPasswordStrength(password);



  const handleInstantDemoLogin = (presetKey: 'engineer' | 'manager' | 'operator' = 'engineer') => {
    signInAsDemo(presetKey);
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    if (mode === 'login') {
      const result = await signIn(email, password);
      setLoading(false);
      if (result.error) setError(result.error);
      else onSuccess();
    } else if (mode === 'signup') {
      const result = await signUp(email, password, name, role);
      setLoading(false);
      if (result.error) setError(result.error);
      else if (result.requiresConfirmation) {
        setSuccessMsg('Account created! Check your email to confirm.');
        setMode('login');
      } else onSuccess();
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  return (
    <div className="login-page-container" style={{
      ...styles.root,
      ...(isMobile ? { flexDirection: 'column', height: 'auto', minHeight: '100vh', overflowY: 'auto' } : {})
    }}>
      {/* ── LEFT BRANDED PANEL (hidden on mobile portrait for clean form view) ── */}
      {!isMobile && (
        <div className="login-left-panel" style={styles.leftPanel}>
          {/* Background glow orbs */}
          <div style={{ ...styles.glowOrb, ...styles.glowLime }} />
          <div style={{ ...styles.glowOrb, ...styles.glowCyan }} />

          {/* Top: Logo + tagline */}
          <div style={styles.brandingTop}>
            <div style={styles.logoRow}>
              <div style={styles.logoMark}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" strokeWidth="0" />
                </svg>
              </div>
              <span style={styles.logoText}>RAPID</span>
            </div>
            <div style={styles.tagline}>BUILD FASTER. MOVE FURTHER.</div>
          </div>

          {/* Center: Hero text + mini card */}
          <div className="login-branding-center" style={styles.brandingCenter}>
            <div style={styles.heroTextBlock}>
              <h1 className="login-hero-headline" style={styles.heroHeadline}>
                Everything you need to move at RAPID speed.
              </h1>
              <p className="login-hero-copy" style={styles.heroCopy}>
                Real-time telemetry, predictive rainfall risk modeling, and autonomous multi-stage pump scheduling to prevent pit submergence.
              </p>
            </div>

            {/* Mini dashboard card */}
            <div className="login-mini-card" style={styles.miniCard}>
              <div style={styles.miniCardHeader}>
                <div style={styles.miniCardLeft}>
                  <div style={styles.activeDot} />
                  <span style={styles.miniCardLabel}>rapid-api-prod</span>
                </div>
                <div style={styles.speedBadge}>Speed 100%</div>
              </div>
              <div style={styles.metricsRow}>
                <div style={styles.metricBox}>
                  <div style={styles.metricBoxLabel}>PIT WATER LEVEL</div>
                  <div style={styles.metricBoxValue}>4.85<span style={styles.metricUnit}>m</span></div>
                </div>
                <div style={styles.metricBox}>
                  <div style={styles.metricBoxLabel}>ACTIVE PUMPS</div>
                  <div style={styles.metricBoxValue}>3<span style={styles.metricUnit}>/4</span></div>
                </div>
                <div style={styles.metricBox}>
                  <div style={styles.metricBoxLabel}>AI RISK</div>
                  <div style={{ ...styles.metricBoxValue, color: '#B7F34A' }}>LOW</div>
                </div>
              </div>
              <div style={styles.codeRow}>
                <span style={styles.codeText}>$ rapid deploy --flood-defense</span>
                <span style={{ ...styles.codeText, color: '#B7F34A', marginLeft: 8 }}>live in 12ms →</span>
              </div>
            </div>
          </div>

          {/* Bottom: Status */}
          <div style={styles.brandingBottom}>
            <div style={styles.statusDot} />
            <span style={styles.statusLabel}>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      )}

      {/* ── RIGHT AUTH PANEL ── */}
      <div className="login-right-panel" style={{
        ...styles.rightPanel,
        ...(isMobile ? { width: '100%', minHeight: '100vh', padding: '32px 20px 48px' } : {})
      }}>
        <div className="login-auth-card" style={{ ...styles.authCard, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)', transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={styles.logoMark}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" strokeWidth="0" />
                </svg>
              </div>
              <span style={styles.logoText}>RAPID</span>
            </div>
          )}

          {/* Back link */}
          <button onClick={onBack} style={styles.backBtn} type="button">
            ← Return to main page
          </button>

          {/* Header */}
          <div style={styles.authHeader}>
            <h2 style={styles.authTitle}>
              {mode === 'login' && 'Welcome back.'}
              {mode === 'signup' && 'Create your account.'}
              {mode === 'demo' && 'Try RAPID instantly.'}
            </h2>
            <p style={styles.authSubtitle}>
              {mode === 'login' && 'Sign in to continue to your RAPID workspace.'}
              {mode === 'signup' && 'Register your mining site profile for telemetry access.'}
              {mode === 'demo' && 'No account needed. Explore the full experience.'}
            </p>
          </div>

          {/* Tab bar */}
          <div style={styles.tabBar}>
            {(['login', 'signup', 'demo'] as const).map((t) => (
              <button
                key={t}
                type="button"
                style={{ ...styles.tab, ...(mode === t ? styles.tabActive : {}) }}
                onClick={() => { setMode(t); setError(''); setSuccessMsg(''); }}
              >
                {t === 'login' ? 'LOG IN' : t === 'signup' ? 'CREATE ACCOUNT' : 'DEMO'}
                {mode === t && <div style={styles.tabUnderline} />}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={styles.alertDanger}>
              <span>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Authentication Error</div>
                <div style={{ opacity: 0.85 }}>{error}</div>
              </div>
              <button
                type="button"
                style={styles.alertAction}
                onClick={() => handleInstantDemoLogin('engineer')}
              >
                ⚡ Skip & Demo
              </button>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div style={styles.alertSuccess}>
              <span>✅</span>
              <div>{successMsg}</div>
            </div>
          )}

          {/* ── DEMO MODE ── */}
          {mode === 'demo' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={styles.demoFeaturesCard}>
                <div style={styles.demoFeaturesLabel}>DEMO ENVIRONMENT INCLUDES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Real-time flood telemetry simulation',
                    'AI-powered pump scheduling demo',
                    'Rainfall risk analytics dashboard',
                    'Interactive IoT control panel',
                  ].map((feat) => (
                    <div key={feat} style={styles.featureBullet}>
                      <div style={styles.featureDot}>✓</div>
                      <span style={styles.featureText}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(['engineer', 'manager', 'operator'] as const).map((key) => {
                  const labels = { engineer: '⚡ Lead Dewatering Engineer', manager: '👷 Mine Operations Manager', operator: '📊 Control Room Operator' };
                  return (
                    <button
                      key={key}
                      type="button"
                      style={key === 'engineer' ? styles.primaryBtn : styles.secondaryBtn}
                      onClick={() => handleInstantDemoLogin(key)}
                    >
                      {labels[key]} — Launch →
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── FORM ── */
            <form onSubmit={handleSubmit} style={styles.form}>
              {mode === 'signup' && (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Full Name</label>
                    <div style={styles.inputBox}>
                      <span style={styles.inputIcon}>👤</span>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="e.g. Dr. Rajesh Kumar"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabel}>Mining Designation</label>
                    <div style={styles.inputBox}>
                      <span style={styles.inputIcon}>🛡️</span>
                      <select
                        style={{ ...styles.input, cursor: 'pointer' }}
                        value={role}
                        onChange={e => setRole(e.target.value)}
                      >
                        <option>Dewatering Engineer</option>
                        <option>Mine Operations Manager</option>
                        <option>Control Room Operator</option>
                        <option>Mine Safety Officer</option>
                        <option>System Administrator</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Email Address</label>
                <div style={styles.inputBox}>
                  <span style={styles.inputIcon}>✉️</span>
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="you@rapid.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={styles.fieldLabel}>Password</label>
                  {mode === 'login' && (
                    <button type="button" style={styles.forgotLink} onClick={() => { setShowForgotModal(true); setForgotSubmitted(false); }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={styles.inputBox}>
                  <span style={styles.inputIcon}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {mode === 'signup' && password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={styles.strengthBar}>
                      <div style={{ ...styles.strengthFill, width: `${(strength.score / 4) * 100}%`, background: strength.color }} />
                    </div>
                    <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: 'block' }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {mode === 'login' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#B7F34A', width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 13, color: '#8B9298' }}>Keep me signed in for 30 days</span>
                  </label>
                </div>
              )}

              {/* Primary CTA */}
              <button type="submit" style={{ ...styles.primaryBtn, marginTop: 4 }} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={styles.spinner} /> Authenticating...
                  </span>
                ) : mode === 'login' ? 'Sign In →' : 'Complete Registration →'}
              </button>

              {/* Divider + demo fallback */}
              <div style={styles.dividerRow}>
                <div style={styles.dividerLine} />
                <span style={{ fontSize: 11, color: '#8B9298', padding: '0 12px' }}>OR</span>
                <div style={styles.dividerLine} />
              </div>

              <button type="button" style={styles.secondaryBtn} onClick={() => handleInstantDemoLogin('engineer')}>
                Try RAPID Demo →
              </button>
            </form>
          )}

          {/* Footer */}
          <div style={styles.authFooter}>
            <span style={{ color: '#8B9298', fontSize: 13 }}>
              {mode === 'login' ? 'New to RAPID?' : mode === 'signup' ? 'Already have an account?' : 'Judge / Evaluator?'}
            </span>
            <button
              type="button"
              style={styles.footerLink}
              onClick={() => mode === 'login' ? setMode('signup') : mode === 'signup' ? setMode('login') : handleInstantDemoLogin('engineer')}
            >
              {mode === 'login' ? 'Create an account' : mode === 'signup' ? 'Sign in' : '⚡ Instant Demo (No Login)'}
            </button>
          </div>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div style={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowForgotModal(false)}>×</button>
            {!forgotSubmitted ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
                <h3 style={{ color: '#F5F7F2', fontSize: 20, fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 8 }}>
                  Reset Your Password
                </h3>
                <p style={{ color: '#8B9298', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                  Enter your registered email to receive reset instructions.
                </p>
                <form onSubmit={handleForgotSubmit}>
                  <div style={styles.inputBox}>
                    <span style={styles.inputIcon}>✉️</span>
                    <input
                      type="email"
                      style={styles.input}
                      placeholder="demo@rapid.com"
                      value={forgotEmail || email}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" style={{ ...styles.primaryBtn, marginTop: 16 }}>
                    Send Reset Link →
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📩</div>
                <h3 style={{ color: '#F5F7F2', fontSize: 20, fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: 8 }}>
                  Reset Email Sent!
                </h3>
                <p style={{ color: '#8B9298', fontSize: 13, marginBottom: 20 }}>
                  Instructions sent to <strong style={{ color: '#F5F7F2' }}>{forgotEmail || email || 'your email'}</strong>.
                </p>
                <button type="button" style={styles.primaryBtn} onClick={() => setShowForgotModal(false)}>
                  Return to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── STYLES (matches Figma tokens exactly) ──────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: "'Geist', 'Inter', sans-serif",
    background: '#111416',
  },
  // LEFT PANEL
  leftPanel: {
    flex: '0 0 55%',
    background: '#0B0D0F',
    padding: '64px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.18,
    pointerEvents: 'none',
  },
  glowLime: {
    width: 350,
    height: 350,
    background: '#B7F34A',
    top: -80,
    left: -60,
  },
  glowCyan: {
    width: 250,
    height: 250,
    background: '#63D9FF',
    bottom: 60,
    right: 40,
  },
  brandingTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'relative',
    zIndex: 1,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 28,
    height: 28,
    background: '#B7F34A',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 800,
    fontSize: 22,
    color: '#F5F7F2',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    color: '#8B9298',
    letterSpacing: '0.1em',
  },
  brandingCenter: {
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  heroTextBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  heroHeadline: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 44,
    color: '#F5F7F2',
    lineHeight: 1.1,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  heroCopy: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 400,
    fontSize: 16,
    color: '#8B9298',
    lineHeight: 1.6,
    margin: 0,
  },
  miniCard: {
    background: '#111416',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    border: '1px solid #22252A',
  },
  miniCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#B7F34A',
    boxShadow: '0 0 8px #B7F34A',
  },
  miniCardLabel: {
    fontSize: 13,
    fontFamily: "'Geist', sans-serif",
    color: '#F5F7F2',
    fontWeight: 500,
  },
  speedBadge: {
    fontSize: 11,
    color: '#B7F34A',
    background: 'rgba(183,243,74,0.1)',
    border: '1px solid rgba(183,243,74,0.2)',
    padding: '3px 8px',
    borderRadius: 4,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
  },
  metricsRow: {
    display: 'flex',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    background: '#0B0D0F',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  metricBoxLabel: {
    fontSize: 10,
    color: '#8B9298',
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
  metricBoxValue: {
    fontSize: 18,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    color: '#F5F7F2',
  },
  metricUnit: {
    fontSize: 12,
    color: '#8B9298',
    marginLeft: 2,
  },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  codeText: {
    fontSize: 11,
    fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
    color: '#8B9298',
  },
  brandingBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#B7F34A',
    boxShadow: '0 0 6px #B7F34A',
  },
  statusLabel: {
    fontSize: 11,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    color: '#8B9298',
    letterSpacing: '0.1em',
  },
  // RIGHT PANEL
  rightPanel: {
    flex: 1,
    background: '#111416',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 48px',
    overflowY: 'auto',
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#8B9298',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    fontFamily: "'Geist', sans-serif",
    textAlign: 'left',
    transition: 'color 0.2s',
  },
  authHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  authTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    color: '#F5F7F2',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  authSubtitle: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: '#8B9298',
    margin: 0,
    lineHeight: 1.5,
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #22252A',
    gap: 0,
  },
  tab: {
    background: 'none',
    border: 'none',
    color: '#8B9298',
    fontSize: 12,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    padding: '10px 16px 10px 0',
    letterSpacing: '0.06em',
    position: 'relative',
    transition: 'color 0.2s',
    marginRight: 20,
  },
  tabActive: {
    color: '#F5F7F2',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    background: '#B7F34A',
    borderRadius: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    color: '#8B9298',
    letterSpacing: '0.04em',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 8,
    padding: '0 16px',
    gap: 8,
    transition: 'border-color 0.2s',
  },
  inputIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#F5F7F2',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    padding: '12px 0',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    color: '#8B9298',
  },
  strengthBar: {
    height: 3,
    background: '#22252A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease, background 0.3s ease',
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#B7F34A',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    padding: 0,
  },
  primaryBtn: {
    width: '100%',
    background: '#B7F34A',
    color: '#0B0D0F',
    border: 'none',
    borderRadius: 8,
    padding: '13px 20px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s',
    letterSpacing: '0.02em',
  },
  secondaryBtn: {
    width: '100%',
    background: 'transparent',
    color: '#F5F7F2',
    border: '1px solid #22252A',
    borderRadius: 8,
    padding: '13px 20px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#22252A',
  },
  alertDanger: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 13,
    color: '#F5F7F2',
    fontFamily: "'Geist', sans-serif",
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(183,243,74,0.08)',
    border: '1px solid rgba(183,243,74,0.2)',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 13,
    color: '#B7F34A',
    fontFamily: "'Geist', sans-serif",
  },
  alertAction: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6,
    color: '#F5F7F2',
    fontSize: 12,
    padding: '5px 10px',
    cursor: 'pointer',
    fontFamily: "'Geist', sans-serif",
    whiteSpace: 'nowrap',
  },
  demoFeaturesCard: {
    background: '#0B0D0F',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #22252A',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  demoFeaturesLabel: {
    fontSize: 11,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    color: '#8B9298',
    letterSpacing: '0.1em',
  },
  featureBullet: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 20,
    height: 20,
    borderRadius: 8,
    background: 'rgba(183,243,74,0.15)',
    color: '#B7F34A',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    color: '#F5F7F2',
    fontFamily: "'Geist', sans-serif",
  },
  authFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerLink: {
    background: 'none',
    border: 'none',
    color: '#B7F34A',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    padding: 0,
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#0B0D0F',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },
  // MODAL
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalBox: {
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 16,
    padding: 32,
    width: 380,
    position: 'relative',
    textAlign: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 16,
    background: 'none',
    border: 'none',
    color: '#8B9298',
    fontSize: 20,
    cursor: 'pointer',
  },
};
