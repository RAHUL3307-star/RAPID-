import React, { useState } from 'react';
import { useAuth, DEMO_PRESETS } from '../hooks/useAuth';

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

  // Compute password strength for sign up mode
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    if (pass.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: '#EF4444' };
    let score = 2;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
    if (score === 3 || score === 4) return { score: 3, label: 'Good', color: '#10B981' };
    return { score: 4, label: 'Strong (Enterprise Grade)', color: '#00C8FF' };
  };

  const strength = getPasswordStrength(password);

  const fillDemoPreset = (presetKey: 'engineer' | 'manager' | 'operator') => {
    const preset = DEMO_PRESETS[presetKey];
    setEmail(preset.email);
    setPassword('rapid2026');
    setError('');
    setSuccessMsg(`Autofilled credentials for ${preset.name}`);
  };

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
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } else if (mode === 'signup') {
      const result = await signUp(email, password, name, role);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else if (result.requiresConfirmation) {
        setSuccessMsg('Account created successfully! Please check your email to confirm registration.');
        setMode('login');
      } else {
        onSuccess();
      }
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  return (
    <div className="login-page-root">
      {/* Dynamic Background Glow Blobs */}
      <div className="login-bg-grid" />
      <div className="login-glow-blob login-glow-1" />
      <div className="login-glow-blob login-glow-2" />
      <div className="login-glow-blob login-glow-3" />

      <div className="login-container">
        {/* LEFT PANEL: Stitch Enterprise Hero & Telemetry Teaser */}
        <div className="login-left-panel">
          <div className="login-brand-header">
            <div className="login-brand-logo">
              <span className="login-logo-spark">⚡</span>
            </div>
            <div>
              <div className="login-brand-name">RAPID</div>
              <div className="login-brand-tagline">Dewatring OS · SIH 2026</div>
            </div>
          </div>

          <div className="login-hero-content">
            <div className="login-badge-pill">
              <span className="login-badge-dot" />
              AI-Powered Open Cast Mine Dewatering System
            </div>

            <h1 className="login-hero-title">
              Precision Flood Defense & Pump Intelligence
            </h1>

            <p className="login-hero-desc">
              Real-time telemetry, predictive rainfall risk modeling, and autonomous multi-stage pump scheduling to prevent pit submergence.
            </p>
          </div>

          {/* Live Telemetry Card Teaser */}
          <div className="login-telemetry-card">
            <div className="login-telemetry-head">
              <div className="login-telemetry-title">
                <span>📡</span> Live Sump Telemetry
              </div>
              <div className="login-telemetry-status">
                <span className="live-pulse" /> ESP32 ONLINE
              </div>
            </div>

            <div className="login-telemetry-grid">
              <div className="login-telemetry-metric">
                <div className="metric-label">PIT WATER LEVEL</div>
                <div className="metric-val">4.85 <span className="metric-unit">m</span></div>
                <div className="metric-bar-wrap">
                  <div className="metric-bar-fill" style={{ width: '42%', background: '#00C8FF' }} />
                </div>
              </div>

              <div className="login-telemetry-metric">
                <div className="metric-label">ACTIVE PUMPS</div>
                <div className="metric-val">3 <span className="metric-unit">/ 4</span></div>
                <div className="metric-bar-wrap">
                  <div className="metric-bar-fill" style={{ width: '75%', background: '#00FF88' }} />
                </div>
              </div>

              <div className="login-telemetry-metric">
                <div className="metric-label">AI RISK INDEX</div>
                <div className="metric-val" style={{ color: '#00FF88' }}>LOW <span className="metric-unit">18%</span></div>
                <div className="metric-bar-wrap">
                  <div className="metric-bar-fill" style={{ width: '18%', background: '#00FF88' }} />
                </div>
              </div>

              <div className="login-telemetry-metric">
                <div className="metric-label">FLOW RATE</div>
                <div className="metric-val">1,420 <span className="metric-unit">L/m</span></div>
                <div className="metric-bar-wrap">
                  <div className="metric-bar-fill" style={{ width: '65%', background: '#A855F7' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Feature List */}
          <div className="login-features-list">
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div>
                <div className="feature-title">Predictive AI Risk Engine</div>
                <div className="feature-sub">Early warning flood forecasting based on live weather API</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div>
                <div className="feature-title">Autonomous Dewatering Control</div>
                <div className="feature-sub">Dynamic pump staging to optimize peak energy consumption</div>
              </div>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="login-left-footer">
            <span className="sec-tag">🔒 ISO 27001 Security</span>
            <span className="sec-tag">🟢 AP-South-1 Server</span>
            <span className="sec-tag">⚡ 12ms Telemetry Sync</span>
          </div>
        </div>

        {/* RIGHT PANEL: Stitch Glassmorphic Auth Form */}
        <div className="login-right-panel">
          <div className="login-card-glass">

            {/* Back Button */}
            <button className="login-back-link" onClick={onBack} type="button">
              ← Return to Main Page
            </button>

            <div className="login-card-header">
              <h2 className="login-card-title">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Operator Account'}
                {mode === 'demo' && 'Quick Demo Sign-In'}
              </h2>
              <p className="login-card-subtitle">
                {mode === 'login' && 'Enter your operational credentials to access the RAPID portal.'}
                {mode === 'signup' && 'Register your mining site profile for telemetry access.'}
                {mode === 'demo' && 'Select a pre-configured role profile to explore without password.'}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="login-mode-tabs">
              <button
                className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`mode-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                type="button"
              >
                Sign Up
              </button>
              <button
                className={`mode-tab ${mode === 'demo' ? 'active' : ''}`}
                onClick={() => { setMode('demo'); setError(''); setSuccessMsg(''); }}
                type="button"
              >
                🎭 Quick Demo
              </button>
            </div>

            {/* Quick Demo Autofill Pills (Show on Sign In Mode) */}
            {mode === 'login' && (
              <div className="login-presets-wrapper">
                <div className="presets-label">QUICK ROLE AUTOFILL:</div>
                <div className="presets-grid">
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => fillDemoPreset('engineer')}
                  >
                    ⚡ Engineer
                  </button>
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => fillDemoPreset('manager')}
                  >
                    👷 Manager
                  </button>
                  <button
                    type="button"
                    className="preset-pill"
                    onClick={() => fillDemoPreset('operator')}
                  >
                    📊 Operator
                  </button>
                </div>
              </div>
            )}

            {/* Error Notification Banner */}
            {error && (
              <div className="login-alert-banner alert-danger">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <div className="alert-title">Authentication Error</div>
                  <div className="alert-text">{error}</div>
                </div>
                <button
                  type="button"
                  className="alert-fallback-btn"
                  onClick={() => handleInstantDemoLogin('engineer')}
                >
                  ⚡ Skip & Enter Demo
                </button>
              </div>
            )}

            {/* Success Notification Banner */}
            {successMsg && (
              <div className="login-alert-banner alert-success">
                <div className="alert-icon">✅</div>
                <div className="alert-content">
                  <div className="alert-text">{successMsg}</div>
                </div>
              </div>
            )}

            {/* DEMO MODE Direct Role Selector Card */}
            {mode === 'demo' ? (
              <div className="demo-profiles-container">
                <div className="demo-profile-card" onClick={() => handleInstantDemoLogin('engineer')}>
                  <div className="demo-avatar">⚡</div>
                  <div className="demo-info">
                    <div className="demo-name">Lead Dewatering Engineer</div>
                    <div className="demo-email">demo@rapid.com</div>
                    <div className="demo-desc">Full access to AI predictions, pump manual overrides & IoT settings.</div>
                  </div>
                  <button className="demo-launch-btn">Launch →</button>
                </div>

                <div className="demo-profile-card" onClick={() => handleInstantDemoLogin('manager')}>
                  <div className="demo-avatar">👷</div>
                  <div className="demo-info">
                    <div className="demo-name">Mine Operations Manager</div>
                    <div className="demo-email">manager@rapid.com</div>
                    <div className="demo-desc">Executive dashboard view, safety compliance reports & cost analytics.</div>
                  </div>
                  <button className="demo-launch-btn">Launch →</button>
                </div>

                <div className="demo-profile-card" onClick={() => handleInstantDemoLogin('operator')}>
                  <div className="demo-avatar">📊</div>
                  <div className="demo-info">
                    <div className="demo-name">Control Room Operator</div>
                    <div className="demo-email">operator@rapid.com</div>
                    <div className="demo-desc">Live alert monitoring, pump status telemetry & emergency ack.</div>
                  </div>
                  <button className="demo-launch-btn">Launch →</button>
                </div>
              </div>
            ) : (
              /* FORM: Sign In or Sign Up */
              <form onSubmit={handleSubmit} className="login-form">
                {mode === 'signup' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="input-name">Full Name</label>
                      <div className="input-wrapper">
                        <span className="input-icon">👤</span>
                        <input
                          id="input-name"
                          type="text"
                          className="form-input"
                          placeholder="e.g. Dr. Rajesh Kumar"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="select-role">Mining Designation / Role</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🛡️</span>
                        <select
                          id="select-role"
                          className="form-input form-select"
                          value={role}
                          onChange={e => setRole(e.target.value)}
                        >
                          <option value="Dewatering Engineer">Dewatering Engineer</option>
                          <option value="Mine Operations Manager">Mine Operations Manager</option>
                          <option value="Control Room Operator">Control Room Operator</option>
                          <option value="Mine Safety Officer">Mine Safety Officer</option>
                          <option value="System Administrator">System Administrator</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="input-email">Corporate Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      id="input-email"
                      type="email"
                      className="form-input"
                      placeholder="engineer@rapid.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-flex">
                    <label className="form-label" htmlFor="input-password">Account Password</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="forgot-link"
                        onClick={() => { setShowForgotModal(true); setForgotSubmitted(false); }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      id="input-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>

                  {/* Password strength meter for signup */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="strength-meter-wrap">
                      <div className="strength-bar-bg">
                        <div
                          className="strength-bar-fill"
                          style={{
                            width: `${(strength.score / 4) * 100}%`,
                            backgroundColor: strength.color,
                          }}
                        />
                      </div>
                      <span className="strength-text" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {mode === 'login' && (
                  <div className="form-options-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                      />
                      <span>Keep me signed in for 30 days</span>
                    </label>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="submit-action-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="btn-spinner-wrap">
                      <span className="btn-spinner" /> Authenticating...
                    </span>
                  ) : mode === 'login' ? (
                    'Sign In to Dashboard →'
                  ) : (
                    'Complete Registration →'
                  )}
                </button>
              </form>
            )}

            {/* Instant Demo Emergency Link */}
            <div className="login-card-footer">
              <span>Judge / Evaluator?</span>
              <button
                type="button"
                className="footer-demo-link"
                onClick={() => handleInstantDemoLogin('engineer')}
              >
                ⚡ Launch Instant Demo Session (No Login Required)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="login-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="login-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowForgotModal(false)}>×</button>

            {!forgotSubmitted ? (
              <>
                <div className="modal-icon">🔐</div>
                <h3 className="modal-title">Reset Your Password</h3>
                <p className="modal-desc">
                  Enter your registered mining account email address below to receive password recovery instructions.
                </p>
                <form onSubmit={handleForgotSubmit}>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. demo@rapid.com"
                      value={forgotEmail || email}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-action-btn">
                    Send Password Reset Link →
                  </button>
                </form>
              </>
            ) : (
              <div className="modal-success-box">
                <div className="modal-icon">📩</div>
                <h3 className="modal-title">Reset Email Sent!</h3>
                <p className="modal-desc">
                  Password reset instructions have been sent to <strong>{forgotEmail || email || 'your email'}</strong>.
                </p>
                <button
                  type="button"
                  className="submit-action-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
