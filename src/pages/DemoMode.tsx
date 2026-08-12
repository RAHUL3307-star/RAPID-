import React, { useState, useRef, useEffect } from 'react';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, ComposedChart,
} from 'recharts';

interface ScenarioStep {
  id:           number;
  title:        string;
  description:  string;
  duration:     number; // ms
  waterLevel:   number;
  rainProb:     number;
  pumpStatus:   'OFF' | 'LOW' | 'HIGH';
  riskLevel:    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  event?:       string;
}

const SCENARIO_STEPS: ScenarioStep[] = [
  { id: 1, title: 'Normal Condition',     description: 'Water level is safe. Solar power is high. Pump is OFF to conserve battery.', duration: 3000, waterLevel: 38, rainProb: 20, pumpStatus: 'OFF',  riskLevel: 'LOW',      event: '🟢 System normal. All sensors healthy.' },
  { id: 2, title: 'Rain Forecast Arrives',description: 'WeatherAPI detects 85% rain probability and 30mm expected rainfall in 30 minutes.', duration: 3000, waterLevel: 42, rainProb: 78, pumpStatus: 'LOW',  riskLevel: 'HIGH',     event: '🌧️ WEATHER ALERT: Heavy rain incoming!' },
  { id: 3, title: 'Water Level Rising',   description: 'Rainfall begins. Water level rising rapidly at 3.2%/min. AI model detects trend.', duration: 3500, waterLevel: 55, rainProb: 85, pumpStatus: 'LOW',  riskLevel: 'HIGH',     event: '📈 Rise rate: 3.2%/min. AI alert triggered.' },
  { id: 4, title: 'Predictive Alert',     description: 'AI predicts 89% water level within 60 minutes. System raises CRITICAL alert.', duration: 3500, waterLevel: 63, rainProb: 88, pumpStatus: 'HIGH', riskLevel: 'CRITICAL', event: '⚠️ CRITICAL ALERT: Predicted 89% in 60 min!' },
  { id: 5, title: 'Pump at HIGH SPEED',   description: 'System automatically switches pump to HIGH SPEED. 34 L/min drainage initiated.', duration: 4000, waterLevel: 70, rainProb: 85, pumpStatus: 'HIGH', riskLevel: 'CRITICAL', event: '⚙️ PUMP → HIGH SPEED. 34 L/min drainage.' },
  { id: 6, title: 'Water Level Falling',  description: 'Pump overcomes inflow. Water level dropping. System confirms safe trajectory.', duration: 4000, waterLevel: 58, rainProb: 72, pumpStatus: 'HIGH', riskLevel: 'HIGH',     event: '💧 Water dropping: 70% → 58% → stabilizing.' },
  { id: 7, title: 'System Stabilizes',    description: 'Water level returns to safe range. Pump reduces to LOW speed. Mission complete.', duration: 3000, waterLevel: 42, rainProb: 50, pumpStatus: 'LOW',  riskLevel: 'MEDIUM',   event: '✅ Stabilized. Pump reducing to LOW speed.' },
];

const riskColors: Record<string, string> = {
  LOW:      'var(--status-safe)',
  MEDIUM:   'var(--status-warn)',
  HIGH:     'var(--status-high)',
  CRITICAL: 'var(--status-danger)',
};

export const DemoMode: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => timeoutRef.current.forEach(clearTimeout);
  }, []);

  const runScenario = () => {
    // Reset
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
        // Finish
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

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎭 Demo Mode — Heavy Rainfall Simulation</h1>
        <p>Watch the full RAPID AI decision cycle: normal → heavy rain → prediction → pump response → stabilization</p>
      </div>

      {/* Control */}
      <div className="demo-stage mb-xl">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 className="demo-title">🌧️ RAPID — Judge Demo Scenario</h2>
            <p className="demo-desc">
              Press <strong>Start Simulation</strong> to watch the RAPID system respond to a heavy rainfall scenario in real-time.
              The AI predicts water level rise 30–60 minutes ahead and automatically controls the pump.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                id="demo-start-btn"
                className="demo-start-btn"
                onClick={runScenario}
                disabled={running}
              >
                {running ? '▶ Running Simulation…' : '▶ Start Simulation'}
              </button>
              {(currentStep >= 0) && (
                <button
                  onClick={reset}
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'none',
                    border: '1px solid var(--border-normal)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                  }}
                >
                  ↺ Reset
                </button>
              )}
            </div>
          </div>

          {/* Live status panel */}
          {activeStep && (
            <div style={{
              background: 'var(--bg-glass-light)',
              border: `1px solid ${riskColors[activeStep.riskLevel]}40`,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md) var(--space-lg)',
              minWidth: 220,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>LIVE STATUS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Water', value: `${activeStep.waterLevel}%`, color: riskColors[activeStep.riskLevel] },
                  { label: 'Rain',  value: `${activeStep.rainProb}%`,   color: activeStep.rainProb >= 70 ? 'var(--status-danger)' : 'var(--accent-cyan)' },
                  { label: 'Pump',  value: activeStep.pumpStatus, color: activeStep.pumpStatus === 'HIGH' ? 'var(--accent-red)' : activeStep.pumpStatus === 'LOW' ? 'var(--accent-cyan)' : 'var(--text-muted)' },
                  { label: 'Risk',  value: activeStep.riskLevel, color: riskColors[activeStep.riskLevel] },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="demo-steps">
          {SCENARIO_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`demo-step ${
                doneSteps.includes(idx) ? 'done'   :
                currentStep === idx     ? 'active' : ''
              }`}
            >
              <div className="demo-step-num">
                {doneSteps.includes(idx) ? '✓' : idx + 1}
              </div>
              <div className="demo-step-content">
                <h4>
                  {step.title}
                  {currentStep === idx && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      ← ACTIVE
                    </span>
                  )}
                </h4>
                <p>{step.description}</p>
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: riskColors[step.riskLevel],
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {step.riskLevel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo chart */}
      {chartData.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title-large">📈 Water Level During Simulation</span>
            </div>
            <div className="chart-wrapper-tall">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <ReferenceLine y={80} stroke="rgba(255,59,92,0.5)" strokeDasharray="4 4"
                    label={{ value: 'DANGER', position: 'insideTopRight', fill: 'var(--status-danger)', fontSize: 10 }} />
                  <Area type="monotone" dataKey="predict" name="AI Prediction" fill="rgba(255,59,92,0.06)"
                    stroke="var(--status-danger)" strokeDasharray="5 3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="water" name="Actual Water %" stroke="var(--accent-cyan)"
                    strokeWidth={3} dot={{ fill: 'var(--accent-cyan)', r: 5 }}
                    style={{ filter: 'drop-shadow(0 0 6px rgba(0,200,255,0.5))' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event log */}
          <div className="card">
            <div className="card-header">
              <span className="card-title-large">📋 Event Log</span>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              maxHeight: 300, overflowY: 'auto',
            }}>
              {log.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 16, textAlign: 'center' }}>
                  Start simulation to see events…
                </div>
              )}
              {log.map((entry, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  background: 'var(--bg-glass-light)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  animation: 'fadeSlideIn 0.3s ease',
                }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
