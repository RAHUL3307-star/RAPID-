import React, { useState } from 'react';
import { ShieldCheck, Zap, TrendingDown, Activity } from 'lucide-react';

export const InteractiveFloodSimulator: React.FC = () => {
  const [rainfallMm, setRainfallMm] = useState<number>(65);
  const [pitDepthMeters, setPitDepthMeters] = useState<number>(12);

  // Derived simulation calculations
  const inflowRateLps = Math.round(rainfallMm * 4.2); // liters per second

  // Water level peak comparison
  const manualPeakCm = Math.min(100, Math.round(rainfallMm * 1.15));
  const rapidPeakCm = Math.min(100, Math.round(rainfallMm * 0.38));

  // Economic impact estimation
  const hoursSaved = (rainfallMm * 0.18).toFixed(1);
  const costSavedInr = (rainfallMm * 3800).toLocaleString('en-IN');
  const energySavedPercent = Math.min(45, Math.round(rainfallMm * 0.42));

  const getRiskLevel = (mm: number) => {
    if (mm < 35) return { label: 'LOW RISK', color: '#22C55E', mode: 'STANDBY / LOW SPEED' };
    if (mm < 80) return { label: 'MODERATE STORM', color: '#F59E0B', mode: 'HIGH SPEED PUMP' };
    return { label: 'CRITICAL CLOUDBURST', color: '#EF4444', mode: 'EMERGENCY DUAL PUMP' };
  };

  const risk = getRiskLevel(rainfallMm);

  return (
    <section className="land-sec dark" id="simulator" style={{ background: '#080C14', padding: '96px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-sec-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 5vw, 64px)' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="land-eyebrow" style={{ color: '#06B6D4', background: 'rgba(6,182,212,0.1)', padding: '6px 16px', borderRadius: 100, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>
            <Activity className="w-4 h-4" /> Interactive Simulation Sandbox
          </div>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, color: '#F1F5F9', letterSpacing: '-1.5px', margin: '0 0 16px' }}>
            Test RAPID AI vs. Conventional Dewatering
          </h2>
          <p style={{ color: '#64748B', fontSize: 16, maxWidth: 680, margin: '0 auto', lineHeight: 1.7 }}>
            Drag the live storm intensity slider below to simulate real-time water accumulation and compare RAPID's predictive response against traditional reactive pumps.
          </p>
        </div>

        {/* Sandbox Container */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 'clamp(20px, 4vw, 40px)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
          
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls Column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Slider 1: Rainfall Rate */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                <div className="flex justify-between items-center mb-3">
                  <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Simulated Rainfall Rate</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#06B6D4', fontSize: 18, fontWeight: 800 }}>
                    {rainfallMm} <span style={{ fontSize: 12, color: '#64748B' }}>mm/hr</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#06B6D4', cursor: 'pointer', height: 6 }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>10 mm/h (Drizzle)</span>
                  <span>75 mm/h (Heavy)</span>
                  <span>150 mm/h (Cloudburst)</span>
                </div>
              </div>

              {/* Slider 2: Mine Pit Depth */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 }}>
                <div className="flex justify-between items-center mb-3">
                  <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>Sump Depth Target</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#8B5CF6', fontSize: 18, fontWeight: 800 }}>
                    {pitDepthMeters} <span style={{ fontSize: 12, color: '#64748B' }}>meters</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={pitDepthMeters}
                  onChange={(e) => setPitDepthMeters(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#8B5CF6', cursor: 'pointer', height: 6 }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>5m (Shallow)</span>
                  <span>15m (Standard Sump)</span>
                  <span>30m (Deep Mine)</span>
                </div>
              </div>

              {/* Status Badge Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))', border: `1px solid ${risk.color}40`, borderRadius: 16, padding: 20 }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, fontWeight: 800, color: risk.color, letterSpacing: '0.5px' }}>{risk.label}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>Inflow: {inflowRateLps} L/sec</span>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>
                  AI Auto-Selected Mode: <span style={{ color: risk.color }}>{risk.mode}</span>
                </div>
              </div>

            </div>

            {/* Right Comparison Visual & ROI Grid (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Dual Visual Water Level Comparison Bar */}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
                <div className="flex justify-between items-center mb-4">
                  <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Peak Water Accumulation Level</h4>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Lower is Better</span>
                </div>

                {/* Conventional Dewatering */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: '#EF4444', fontWeight: 700 }}>Conventional Reactive Pump</span>
                    <span style={{ color: '#EF4444', fontWeight: 800, fontFamily: 'monospace' }}>{manualPeakCm}% Capacity (Critical Flood)</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${manualPeakCm}%`, height: '100%', background: 'linear-gradient(90deg, #F97316, #EF4444)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* RAPID AI Dewatering */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: '#22D3EE', fontWeight: 700 }}>RAPID AI Predictive Engine</span>
                    <span style={{ color: '#22D3EE', fontWeight: 800, fontFamily: 'monospace' }}>{rapidPeakCm}% Capacity (Controlled)</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${rapidPeakCm}%`, height: '100%', background: 'linear-gradient(90deg, #06B6D4, #10B981)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>

              {/* 3 Metric ROI Cards */}
              <div className="grid grid-cols-3 gap-4">
                
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <Zap className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 900, color: '#F59E0B' }}>
                    {hoursSaved}h
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: 600 }}>Downtime Prevented</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <ShieldCheck className="w-5 h-5 mx-auto mb-2 text-cyan-400" />
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 900, color: '#06B6D4' }}>
                    ₹{costSavedInr}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: 600 }}>Est. Cost Savings</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <TrendingDown className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 900, color: '#10B981' }}>
                    {energySavedPercent}%
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: 600 }}>Energy Reduction</div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
