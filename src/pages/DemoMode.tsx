import React, { useState, useRef, useEffect } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';
import { useIsMobile } from '../hooks/useIsMobile';

interface ScenarioStep {
  id:          number;
  title:       string;
  description: string;
  duration:    number;
  waterLevel:  number;
  rainProb:    number;
  pumpStatus:  'OFF' | 'LOW' | 'HIGH';
  riskLevel:   'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  event?:      string;
}

const SCENARIO_STEPS: ScenarioStep[] = [
  { id: 1, title: 'Normal Condition',      description: 'Water level is safe. Solar power is high. Pump is OFF to conserve battery.',                         duration: 3000, waterLevel: 38, rainProb: 20, pumpStatus: 'OFF',  riskLevel: 'LOW',      event: '🟢 System normal. All sensors healthy.' },
  { id: 2, title: 'Rain Forecast Arrives', description: 'WeatherAPI detects 85% rain probability and 30mm expected rainfall in 30 minutes.',                  duration: 3000, waterLevel: 42, rainProb: 78, pumpStatus: 'LOW',  riskLevel: 'HIGH',     event: '🌧️ WEATHER ALERT: Heavy rain incoming!' },
  { id: 3, title: 'Water Level Rising',    description: 'Rainfall begins. Water level rising rapidly at 3.2%/min. AI model detects trend.',                   duration: 3500, waterLevel: 55, rainProb: 85, pumpStatus: 'LOW',  riskLevel: 'HIGH',     event: '📈 Rise rate: 3.2%/min. AI alert triggered.' },
  { id: 4, title: 'Predictive Alert',      description: 'AI predicts 89% water level within 60 minutes. System raises CRITICAL alert.',                       duration: 3500, waterLevel: 63, rainProb: 88, pumpStatus: 'HIGH', riskLevel: 'CRITICAL', event: '⚠️ CRITICAL ALERT: Predicted 89% in 60 min!' },
  { id: 5, title: 'Pump at HIGH SPEED',    description: 'System automatically switches pump to HIGH SPEED. 34 L/min drainage initiated.',                     duration: 4000, waterLevel: 70, rainProb: 85, pumpStatus: 'HIGH', riskLevel: 'CRITICAL', event: '⚙️ PUMP → HIGH SPEED. 34 L/min drainage.' },
  { id: 6, title: 'Water Level Falling',   description: 'Pump overcomes inflow. Water level dropping. System confirms safe trajectory.',                       duration: 4000, waterLevel: 58, rainProb: 72, pumpStatus: 'HIGH', riskLevel: 'HIGH',     event: '💧 Water dropping: 70% → 58% → stabilizing.' },
  { id: 7, title: 'System Stabilizes',     description: 'Water level returns to safe range. Pump reduces to LOW speed. Mission complete.',                     duration: 3000, waterLevel: 42, rainProb: 50, pumpStatus: 'LOW',  riskLevel: 'MEDIUM',   event: '✅ Stabilized. Pump reducing to LOW speed.' },
];

const riskColors: Record<string, string> = {
  LOW:      '#B7F34A',
  MEDIUM:   '#F59E0B',
  HIGH:     '#F97316',
  CRITICAL: '#EF4444',
};

const pumpColors: Record<string, string> = {
  OFF:  '#8B9298',
  LOW:  '#63D9FF',
  HIGH: '#EF4444',
};

export const DemoMode: React.FC = () => {
  const [running, setRunning]         = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [doneSteps, setDoneSteps]     = useState<number[]>([]);
  const [chartData, setChartData]     = useState<any[]>([]);
  const [log, setLog]                 = useState<string[]>([]);
  const [mounted, setMounted]         = useState(false);
  const timeoutRef                    = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
    return () => timeoutRef.current.forEach(clearTimeout);
  }, []);

  const runScenario = () => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setRunning(true);
    setCurrentStep(0);
    setDoneSteps([]);
    setChartData([{ label: 'Now', water: 38, predict: 38 }]);
    setLog([]);

    let elapsed = 0;
    SCENARIO_STEPS.forEach((step, idx) => {
      const t = elapsed;
      const tid = setTimeout(() => {
        setCurrentStep(idx);
        if (idx > 0) setDoneSteps(prev => [...prev, idx - 1]);
        setChartData(prev => [
          ...prev,
          {
            label: `+${Math.round(t / 1000)}s`,
            water: step.waterLevel,
            predict: step.riskLevel === 'CRITICAL'
              ? Math.min(100, step.waterLevel + 20)
              : step.waterLevel + 5,
          },
        ]);
        if (step.event) {
          setLog(prev => [`[${new Date().toLocaleTimeString()}] ${step.event}`, ...prev]);
        }
        if (idx === SCENARIO_STEPS.length - 1) {
          const finTid = setTimeout(() => {
            setDoneSteps(prev => [...prev, idx]);
            setRunning(false);
          }, step.duration);
          timeoutRef.current.push(finTid);
        }
      }, t);
      timeoutRef.current.push(tid);
      elapsed += step.duration;
    });
  };

  const reset = () => {
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    setRunning(false);
    setCurrentStep(-1);
    setDoneSteps([]);
    setChartData([]);
    setLog([]);
  };

  const activeStep = currentStep >= 0 ? SCENARIO_STEPS[currentStep] : null;
  const hasStarted = currentStep >= 0;
  const isMobile = useIsMobile();

  return (
    <div style={S.root}>
      {/* ── TOP HERO SECTION (Figma layout) ── */}
      <div style={{ ...S.heroSection, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease' }}>

        {/* Left branding column */}
        <div style={S.heroBranding}>
          {/* Glow orbs */}
          <div style={{ ...S.glowOrb, background: '#B7F34A', top: -40, left: -40, width: 200, height: 200 }} />
          <div style={{ ...S.glowOrb, background: '#63D9FF', bottom: 0, right: 20, width: 150, height: 150 }} />

          {/* Logo */}
          <div style={S.logoRow}>
            <div style={S.logoMark}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" />
              </svg>
            </div>
            <span style={S.logoText}>RAPID</span>
          </div>
          <div style={S.tagline}>BUILD FASTER. MOVE FURTHER.</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
            <h2 style={S.heroHeadline}>
              Everything you need to move at RAPID speed.
            </h2>
            <p style={S.heroCopy}>
              Watch the full RAPID AI decision cycle in real-time: normal → heavy rain → prediction → autonomous pump response → stabilization.
            </p>

            {/* Mini metrics card */}
            <div style={S.miniCard}>
              <div style={S.miniCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#B7F34A', boxShadow: '0 0 6px #B7F34A' }} />
                  <span style={{ fontSize: 13, fontFamily: "'Geist', sans-serif", color: '#F5F7F2', fontWeight: 500 }}>
                    rapid-dewatering-prod
                  </span>
                </div>
                <div style={S.speedBadge}>Live Demo</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'AVG LATENCY', value: activeStep ? `${activeStep.waterLevel}%` : '14ms', color: activeStep ? riskColors[activeStep.riskLevel] : '#F5F7F2' },
                  { label: 'PUMP STATUS', value: activeStep?.pumpStatus || 'STANDBY', color: activeStep ? pumpColors[activeStep.pumpStatus] : '#8B9298' },
                  { label: 'AI RISK',     value: activeStep?.riskLevel || 'READY',   color: activeStep ? riskColors[activeStep.riskLevel] : '#8B9298' },
                ].map(m => (
                  <div key={m.label} style={S.metricBox}>
                    <div style={S.metricBoxLabel}>{m.label}</div>
                    <div style={{ ...S.metricBoxValue, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#8B9298' }}>
                  $ rapid simulate --flood-scenario
                </span>
                {running && <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#B7F34A' }}>running...</span>}
                {!running && hasStarted && <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#B7F34A' }}>done in {(SCENARIO_STEPS.reduce((a, s) => a + s.duration, 0) / 1000).toFixed(0)}s ✓</span>}
              </div>
            </div>
          </div>

          {/* Bottom status */}
          <div style={S.statusRow}>
            <div style={S.statusDot} />
            <span style={S.statusLabel}>ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* Right demo controls column */}
        <div style={S.heroControls}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h1 style={S.ctaTitle}>Try RAPID instantly.</h1>
              <p style={S.ctaSubtitle}>
                No account needed. Watch the full flood-defense scenario.
              </p>
            </div>

            {/* Feature bullets card */}
            <div style={S.featureCard}>
              <div style={S.featureCardLabel}>DEMO ENVIRONMENT INCLUDES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Real-time flood telemetry simulation',
                  'AI-powered predictive risk engine',
                  'Autonomous pump scheduling demo',
                  'Live water level analytics chart',
                ].map(feat => (
                  <div key={feat} style={S.featureBullet}>
                    <div style={S.featureDot}>✓</div>
                    <span style={S.featureText}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                id="demo-start-btn"
                type="button"
                style={{ ...S.primaryBtn, opacity: running ? 0.7 : 1 }}
                onClick={runScenario}
                disabled={running}
              >
                {running ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={S.spinner} />
                    Running Simulation…
                  </span>
                ) : '▶ Launch Demo Scenario →'}
              </button>
              {hasStarted && (
                <button type="button" style={S.secondaryBtn} onClick={reset}>
                  ↺ Reset Simulation
                </button>
              )}
            </div>

            {/* Live status panel */}
            {activeStep && (
              <div style={{
                background: `${riskColors[activeStep.riskLevel]}10`,
                border: `1px solid ${riskColors[activeStep.riskLevel]}30`,
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                animation: 'fadeIn 0.3s ease',
              }}>
                <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist Mono', monospace", letterSpacing: '0.1em' }}>
                  LIVE STATUS — STEP {currentStep + 1}/{SCENARIO_STEPS.length}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
                  {activeStep.title}
                </div>
                <div style={{ fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif", lineHeight: 1.5 }}>
                  {activeStep.description}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  {[
                    { label: 'Water', value: `${activeStep.waterLevel}%`, color: riskColors[activeStep.riskLevel] },
                    { label: 'Rain',  value: `${activeStep.rainProb}%`,   color: activeStep.rainProb >= 70 ? '#EF4444' : '#63D9FF' },
                    { label: 'Pump',  value: activeStep.pumpStatus,        color: pumpColors[activeStep.pumpStatus] },
                    { label: 'Risk',  value: activeStep.riskLevel,         color: riskColors[activeStep.riskLevel] },
                  ].map(m => (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 10, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: m.color, fontFamily: "'Geist Mono', monospace" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SCENARIO STEPS ── */}
      <div style={S.stepsSection}>
        <div style={S.stepsSectionHeader}>
          <h3 style={S.stepsSectionTitle}>Simulation Scenario</h3>
          <div style={{ fontSize: 13, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
            {doneSteps.length}/{SCENARIO_STEPS.length} steps completed
          </div>
        </div>
        <div style={S.stepsGrid}>
          {SCENARIO_STEPS.map((step, idx) => {
            const isDone   = doneSteps.includes(idx);
            const isActive = currentStep === idx;
            return (
              <div
                key={step.id}
                style={{
                  ...S.stepCard,
                  borderColor: isDone ? '#B7F34A30' : isActive ? `${riskColors[step.riskLevel]}50` : '#22252A',
                  background: isDone ? 'rgba(183,243,74,0.04)' : isActive ? `${riskColors[step.riskLevel]}08` : '#15181B',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  ...S.stepNum,
                  background: isDone ? '#B7F34A' : isActive ? riskColors[step.riskLevel] : '#22252A',
                  color: isDone ? '#0B0D0F' : isActive ? '#0B0D0F' : '#8B9298',
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isDone ? '#B7F34A' : isActive ? '#F5F7F2' : '#8B9298',
                      fontFamily: "'Geist', sans-serif",
                      transition: 'color 0.3s',
                    }}>
                      {step.title}
                      {isActive && <span style={{ marginLeft: 8, fontSize: 10, color: '#63D9FF', fontFamily: "'Geist Mono', monospace" }}>← ACTIVE</span>}
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'Geist', monospace",
                      fontWeight: 700,
                      color: riskColors[step.riskLevel],
                      background: `${riskColors[step.riskLevel]}15`,
                      padding: '2px 7px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}>
                      {step.riskLevel}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12,
                    color: '#8B9298',
                    fontFamily: "'Geist', sans-serif",
                    margin: 0,
                    lineHeight: 1.5,
                  }}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHART + EVENT LOG (shown after simulation starts) ── */}
      {chartData.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 20 }}>

          {/* Chart panel */}
          <div style={S.chartPanel}>
            <div style={S.chartPanelHeader}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
                Rainfall & Water Level Analysis
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 20, height: 2, background: '#63D9FF', display: 'inline-block', borderRadius: 1 }} />
                  Water Level
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 20, height: 2, background: '#EF4444', display: 'inline-block', borderRadius: 1, opacity: 0.7 }} />
                  AI Forecast
                </span>
              </div>
            </div>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22252A" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8B9298', fontFamily: "'Geist Mono', monospace" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#15181B', border: '1px solid #22252A', borderRadius: 8, fontFamily: "'Geist', sans-serif" }}
                    labelStyle={{ color: '#8B9298', fontSize: 11 }}
                  />
                  <ReferenceLine y={80} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4"
                    label={{ value: 'DANGER', position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }} />
                  <Area type="monotone" dataKey="predict" name="AI Forecast" fill="rgba(239,68,68,0.06)"
                    stroke="#EF4444" strokeDasharray="5 3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="water" name="Water Level %" stroke="#63D9FF"
                    strokeWidth={3} dot={{ fill: '#63D9FF', r: 5 }}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(99,217,255,0.5))' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Live Feed panel */}
          <div style={S.feedPanel}>
            <div style={S.feedPanelHeader}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F7F2', fontFamily: "'Geist', sans-serif" }}>
                Live Simulation Activity
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: running ? '#B7F34A' : '#8B9298', boxShadow: running ? '0 0 8px #B7F34A' : 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: 260 }}>
              {log.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#8B9298', fontSize: 13, fontFamily: "'Geist', sans-serif" }}>
                  Events will appear here…
                </div>
              ) : log.map((entry, i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #22252A',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <span style={{ fontSize: 11, fontFamily: "'Geist Mono', monospace", color: '#8B9298', flexShrink: 0 }}>
                    {entry.substring(1, 10)}
                  </span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B7F34A', marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#F5F7F2', fontFamily: "'Geist', sans-serif", lineHeight: 1.4 }}>
                    {entry.substring(12)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── STYLES ─────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    padding: 32,
    minHeight: '100vh',
    background: '#111416',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },
  // Hero
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    minHeight: 380,
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid #22252A',
  },
  heroBranding: {
    background: '#0B0D0F',
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(60px)',
    opacity: 0.15,
    pointerEvents: 'none',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 1,
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
    fontSize: 20,
    color: '#F5F7F2',
    letterSpacing: '-0.02em',
  },
  tagline: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    color: '#8B9298',
    letterSpacing: '0.1em',
    position: 'relative',
    zIndex: 1,
  },
  heroHeadline: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    color: '#F5F7F2',
    lineHeight: 1.15,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  heroCopy: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: '#8B9298',
    lineHeight: 1.6,
    margin: 0,
  },
  miniCard: {
    background: '#111416',
    borderRadius: 10,
    padding: 16,
    border: '1px solid #22252A',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  miniCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  metricBox: {
    flex: 1,
    background: '#0B0D0F',
    borderRadius: 6,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    transition: 'all 0.3s ease',
  },
  metricBoxLabel: {
    fontSize: 9,
    color: '#8B9298',
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.08em',
  },
  metricBoxValue: {
    fontSize: 15,
    fontFamily: "'Geist Mono', monospace",
    fontWeight: 700,
    color: '#F5F7F2',
    transition: 'color 0.3s ease',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#B7F34A',
    boxShadow: '0 0 6px #B7F34A',
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    color: '#8B9298',
    letterSpacing: '0.1em',
  },
  heroControls: {
    background: '#111416',
    padding: '48px',
    borderLeft: '1px solid #22252A',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: 32,
    color: '#F5F7F2',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  ctaSubtitle: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: '#8B9298',
    margin: 0,
    lineHeight: 1.5,
  },
  featureCard: {
    background: '#0B0D0F',
    border: '1px solid #22252A',
    borderRadius: 12,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureCardLabel: {
    fontSize: 11,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    color: '#8B9298',
    letterSpacing: '0.08em',
  },
  featureBullet: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  featureDot: {
    width: 18,
    height: 18,
    borderRadius: 6,
    background: 'rgba(183,243,74,0.12)',
    color: '#B7F34A',
    fontSize: 10,
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
  primaryBtn: {
    width: '100%',
    background: '#B7F34A',
    color: '#0B0D0F',
    border: 'none',
    borderRadius: 8,
    padding: '14px 20px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s',
  },
  secondaryBtn: {
    width: '100%',
    background: 'transparent',
    color: '#F5F7F2',
    border: '1px solid #22252A',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 14,
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
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
  // Steps
  stepsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stepsSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsSectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#F5F7F2',
    fontFamily: "'Geist', sans-serif",
  },
  stepsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stepCard: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 10,
    padding: '14px 16px',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Geist', sans-serif",
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  // Chart
  chartPanel: {
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  chartPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedPanel: {
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  feedPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px',
    borderBottom: '1px solid #22252A',
  },
};
