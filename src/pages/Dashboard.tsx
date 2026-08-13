import React, { useState, useEffect } from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { useAlerts } from '../hooks/useAlerts';
import { usePredictions } from '../hooks/usePredictions';
import { useWeather } from '../hooks/useWeather';
import { StatusBanner } from '../components/dashboard/StatusBanner';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { WaterLevelChart } from '../components/charts/WaterLevelChart';
import { PredictionChart } from '../components/charts/PredictionChart';
import { PumpControl } from '../components/controls/PumpControl';
import { GaugeCard } from '../components/dashboard/GaugeCard';

// ── Animated KPI card ─────────────────────────────────────────────────────
const KPI: React.FC<{
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  color: string;
  sub?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; label: string };
  pulse?: boolean;
}> = ({ label, value, unit, icon, color, sub, trend, pulse }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: hovered ? `${color}08` : '#15181B',
        border: `1px solid ${hovered ? `${color}35` : '#22252A'}`,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 30px ${color}12` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 70, height: 70,
        borderRadius: '50%', background: color, opacity: hovered ? 0.1 : 0.05,
        filter: 'blur(20px)', transition: 'opacity 0.25s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: 10, color: '#8B9298',
          fontFamily: "'Geist', sans-serif", fontWeight: 700, letterSpacing: '0.08em',
        }}>
          {label}
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          position: 'relative',
        }}>
          {pulse && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 8, background: color,
              opacity: 0, animation: 'pulseRing 2s ease infinite',
            }} />
          )}
          {icon}
        </div>
      </div>

      <div style={{
        fontSize: 28, fontWeight: 700, color,
        fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
        letterSpacing: '-0.02em', lineHeight: 1,
        position: 'relative', zIndex: 1,
      }}>
        {value}
        <span style={{ fontSize: 13, color: '#8B9298', marginLeft: 3, fontWeight: 400 }}>{unit}</span>
      </div>

      {(sub || trend) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {sub && (
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist', sans-serif" }}>{sub}</span>
          )}
          {trend && (
            <span style={{
              fontSize: 11, fontFamily: "'Geist Mono', monospace",
              color: trend.direction === 'up' ? '#EF4444' : trend.direction === 'down' ? '#B7F34A' : '#8B9298',
              background: trend.direction === 'up' ? 'rgba(239,68,68,0.08)' : 'rgba(183,243,74,0.08)',
              padding: '2px 7px', borderRadius: 20,
            }}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Section card wrapper ───────────────────────────────────────────────────
const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  titleRight?: React.ReactNode;
}> = ({ children, style, title, titleRight }) => (
  <div style={{
    background: '#15181B',
    border: '1px solid #22252A',
    borderRadius: 14,
    overflow: 'hidden',
    ...style,
  }}>
    {title && (
      <div style={{
        padding: '16px 22px',
        borderBottom: '1px solid #22252A',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: '#F5F7F2',
          fontFamily: "'Geist', sans-serif",
        }}>
          {title}
        </span>
        {titleRight}
      </div>
    )}
    <div style={{ padding: title ? '16px 20px' : 0 }}>
      {children}
    </div>
  </div>
);

// ── Loading state ─────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '80vh', flexDirection: 'column', gap: 20,
    background: '#0B0D0F',
  }}>
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <div style={{
        width: 56, height: 56,
        border: '2px solid #22252A',
        borderTopColor: '#B7F34A',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 6,
        border: '2px solid transparent',
        borderTopColor: '#63D9FF',
        borderRadius: '50%',
        animation: 'spin 1.2s linear infinite reverse',
      }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{
        color: '#F5F7F2', fontFamily: "'Geist', sans-serif",
        fontWeight: 600, fontSize: 16,
      }}>
        Connecting to sensors…
      </span>
      <span style={{
        color: '#8B9298', fontFamily: "'Geist Mono', monospace",
        fontSize: 12,
      }}>
        Establishing Supabase Realtime link
      </span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { readings, latest, loading } = useSensorData();
  const { alerts, acknowledge } = useAlerts();
  const { decision } = usePredictions(readings);
  const { weather: liveWeather } = useWeather();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loading && latest) {
      setTimeout(() => setMounted(true), 80);
    }
  }, [loading, latest]);

  if (loading) return <LoadingScreen />;
  if (!latest) return null;

  const risk = decision?.riskLevel ?? 'LOW';
  const pump = latest.pump_status;
  const desc = decision?.recommendedAction ?? 'System initializing…';

  const riskColor: Record<string, string> = {
    LOW:      '#B7F34A',
    MEDIUM:   '#F59E0B',
    HIGH:     '#F97316',
    CRITICAL: '#EF4444',
  };

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <div style={{
      ...S.page,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* ── Page Header ── */}
      <div style={S.pageHeader}>
        <div>
          <div style={S.pageEyebrow}>RAPID COMMAND CENTER</div>
          <h1 style={S.pageTitle}>Dewatering Dashboard</h1>
          <p style={S.pageSubtitle}>
            Real-time telemetry · AI prediction · Automated pump control
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={S.liveChip}>
            <div style={S.liveDot} />
            LIVE
          </div>
          <div style={{ ...S.riskChip, color: riskColor[risk], borderColor: `${riskColor[risk]}35`, background: `${riskColor[risk]}10` }}>
            {risk} RISK
          </div>
          {unackAlerts > 0 && (
            <div style={S.alertChip}>
              🔔 {unackAlerts} ALERT{unackAlerts > 1 ? 'S' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      <StatusBanner
        riskLevel={risk}
        pumpMode={pump}
        waterLevel={latest.water_level}
        description={desc}
      />

      {/* ── KPI Cards ── */}
      <div style={S.kpiGrid}>
        <KPI
          label="WATER LEVEL"
          value={latest.water_level.toFixed(1)}
          unit="%"
          icon="💧"
          color={latest.water_level >= 80 ? '#EF4444' : latest.water_level >= 60 ? '#F97316' : '#63D9FF'}
          trend={{ direction: 'up', label: `+${(decision?.rateOfRise ?? 0.2).toFixed(1)}%/min` }}
          pulse={latest.water_level >= 60}
        />
        <KPI
          label="SOLAR POWER"
          value={latest.solar_power.toFixed(0)}
          unit="W"
          icon="☀️"
          color="#F59E0B"
          sub={latest.solar_power > 600 ? 'High generation' : 'Low generation'}
        />
        <KPI
          label="BATTERY"
          value={latest.battery_level.toFixed(0)}
          unit="%"
          icon="🔋"
          color={latest.battery_level <= 20 ? '#EF4444' : latest.battery_level <= 40 ? '#F59E0B' : '#B7F34A'}
          sub={latest.battery_level > 80 ? 'Fully charged' : 'Charging via solar'}
        />
        <KPI
          label="FLOW RATE"
          value={latest.flow_rate.toFixed(1)}
          unit="L/min"
          icon="🌊"
          color="#63D9FF"
        />
        <KPI
          label="PUMP POWER"
          value={latest.pump_power.toFixed(0)}
          unit="W"
          icon="⚙️"
          color={latest.pump_status === 'HIGH' ? '#EF4444' : latest.pump_status === 'LOW' ? '#63D9FF' : '#8B9298'}
          sub={`Mode: ${latest.pump_status}`}
          pulse={latest.pump_status === 'HIGH'}
        />
        <KPI
          label="RAIN RISK"
          value={latest.rain_probability.toFixed(0)}
          unit="%"
          icon="🌧️"
          color={latest.rain_probability >= 70 ? '#EF4444' : latest.rain_probability >= 40 ? '#F59E0B' : '#B7F34A'}
          sub={`${latest.expected_rainfall.toFixed(1)} mm expected`}
        />
      </div>

      {/* ── Main Charts Row ── */}
      <div style={S.mainGrid}>
        {/* Water Level Chart */}
        <Card
          title="Real-time Water Level"
          titleRight={
            <span style={{ fontSize: 11, color: '#8B9298', fontFamily: "'Geist Mono', monospace" }}>
              Last {readings.length} readings
            </span>
          }
          style={{ gridColumn: 'span 2' }}
        >
          <WaterLevelChart readings={readings} />
        </Card>

        {/* Alert Feed */}
        <Card
          title="Active Alerts"
          titleRight={
            <span style={{
              padding: '3px 10px',
              background: unackAlerts > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(183,243,74,0.08)',
              border: `1px solid ${unackAlerts > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(183,243,74,0.2)'}`,
              borderRadius: 20,
              fontSize: 11, fontWeight: 700,
              color: unackAlerts > 0 ? '#EF4444' : '#B7F34A',
              fontFamily: "'Geist', sans-serif",
            }}>
              {unackAlerts} ACTIVE
            </span>
          }
        >
          <AlertFeed alerts={alerts} onAcknowledge={acknowledge} maxVisible={5} />
        </Card>
      </div>

      {/* ── Bottom Row: Prediction + Weather + Pump ── */}
      <div style={S.bottomGrid}>
        {/* AI Prediction Chart */}
        <Card
          title="AI Water Level Prediction"
          titleRight={
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#63D9FF', fontFamily: "'Geist Mono', monospace" }}>
                +30min: {(decision?.predicted30min ?? 0).toFixed(1)}%
              </span>
              <span style={{
                fontSize: 12, fontFamily: "'Geist Mono', monospace",
                color: (decision?.predicted60min ?? 0) >= 80 ? '#EF4444' : '#63D9FF',
              }}>
                +60min: {(decision?.predicted60min ?? 0).toFixed(1)}%
              </span>
            </div>
          }
          style={{ gridColumn: 'span 3' }}
        >
          <PredictionChart currentLevel={latest.water_level} decision={decision} />
        </Card>

        {/* Weather */}
        <Card title="Weather Forecast">
          <WeatherWidget
            rainProbability={latest.rain_probability}
            expectedRainfall={latest.expected_rainfall}
            riskLevel={risk}
            temperature={latest.temperature}
            liveWeather={liveWeather}
          />
        </Card>

        {/* Pump Control */}
        <Card title="Pump Control">
          <div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '8px 0 16px' }}>
              <GaugeCard value={latest.water_level} label="Water" size={90} />
              <GaugeCard value={latest.battery_level} label="Battery" color="#B7F34A" size={90} thresholds={{ warn: 40, danger: 20 }} />
            </div>
            <PumpControl currentMode={pump} />
          </div>
        </Card>
      </div>

      {/* ── Keyframe CSS ── */}
      <style>{`
        @keyframes pulseRing {
          0%   { opacity: 0.3; transform: scale(1); }
          50%  { opacity: 0; transform: scale(1.8); }
          100% { opacity: 0; transform: scale(1.8); }
        }
      `}</style>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    padding: '36px 40px',
    minHeight: '100vh',
    background: '#0B0D0F',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    fontFamily: "'Geist', 'Inter', sans-serif",
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pageEyebrow: {
    fontSize: 10, fontWeight: 700, color: '#B7F34A',
    fontFamily: "'Geist', sans-serif", letterSpacing: '0.15em',
    marginBottom: 8,
  },
  pageTitle: {
    margin: 0, fontFamily: "'Outfit', sans-serif",
    fontWeight: 700, fontSize: 30, color: '#F5F7F2',
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    margin: '6px 0 0', fontSize: 13, color: '#8B9298',
    fontFamily: "'Geist', sans-serif",
  },
  liveChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(183,243,74,0.08)',
    border: '1px solid rgba(183,243,74,0.2)',
    borderRadius: 100, padding: '6px 12px',
    fontSize: 11, fontWeight: 700, color: '#B7F34A',
    fontFamily: "'Geist', sans-serif", letterSpacing: '0.06em',
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#B7F34A', boxShadow: '0 0 6px #B7F34A',
    animation: 'pulseDot 1.5s ease infinite',
  },
  riskChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    border: '1px solid',
    borderRadius: 100, padding: '6px 14px',
    fontSize: 11, fontWeight: 700,
    fontFamily: "'Geist', sans-serif", letterSpacing: '0.08em',
  },
  alertChip: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 100, padding: '6px 14px',
    fontSize: 11, fontWeight: 700, color: '#EF4444',
    fontFamily: "'Geist', sans-serif",
    animation: 'pulseDot 1.5s ease infinite',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 14,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 18,
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr 1fr',
    gap: 18,
  },
};
