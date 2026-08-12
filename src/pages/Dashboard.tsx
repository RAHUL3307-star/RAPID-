import React from 'react';
import { useSensorData } from '../hooks/useSensorData';
import { useAlerts } from '../hooks/useAlerts';
import { usePredictions } from '../hooks/usePredictions';
import { useWeather } from '../hooks/useWeather';
import { StatusBanner } from '../components/dashboard/StatusBanner';
import { KPICard } from '../components/dashboard/KPICard';
import { AlertFeed } from '../components/dashboard/AlertFeed';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { WaterLevelChart } from '../components/charts/WaterLevelChart';
import { PredictionChart } from '../components/charts/PredictionChart';
import { PumpControl } from '../components/controls/PumpControl';
import { GaugeCard } from '../components/dashboard/GaugeCard';

export const Dashboard: React.FC = () => {
  const { readings, latest, loading } = useSensorData();
  const { alerts, acknowledge } = useAlerts();
  const { decision } = usePredictions(readings);
  const { weather: liveWeather } = useWeather();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--border-normal)',
          borderTopColor: 'var(--accent-cyan)', borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Connecting to sensors…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!latest) return null;

  const risk = decision?.riskLevel ?? 'LOW';
  const pump = latest.pump_status;
  const desc = decision?.recommendedAction ?? 'System initializing…';

  return (
    <div className="page">
      <div className="page-header">
        <h1>🌧️ RAPID — Rainfall Analysis & Pump Intelligence for Dewatering</h1>
        <p>Real-time telemetry · AI water level prediction · Automated pump control</p>
      </div>

      {/* Status Banner */}
      <StatusBanner
        riskLevel={risk}
        pumpMode={pump}
        waterLevel={latest.water_level}
        description={desc}
      />

      {/* KPI Cards */}
      <div className="grid-6 mb-xl">
        <KPICard
          label="Water Level"
          value={latest.water_level}
          unit="%"
          icon="💧"
          color={latest.water_level >= 80 ? 'var(--status-danger)' :
                 latest.water_level >= 60 ? 'var(--status-warn)' : 'var(--accent-cyan)'}
          iconBg={latest.water_level >= 80 ? 'rgba(255,59,92,0.08)' : 'rgba(0,200,255,0.08)'}
          trend={{ direction: 'up', label: `+${(decision?.rateOfRise ?? 0.2).toFixed(1)}%/min` }}
        />
        <KPICard
          label="Solar Power"
          value={latest.solar_power}
          unit="W"
          icon="☀️"
          color="var(--accent-yellow)"
          iconBg="rgba(255,215,0,0.08)"
          sub={latest.solar_power > 600 ? 'High generation' : 'Low generation'}
        />
        <KPICard
          label="Battery"
          value={latest.battery_level}
          unit="%"
          icon="🔋"
          color={latest.battery_level <= 20 ? 'var(--status-danger)' :
                 latest.battery_level <= 40 ? 'var(--status-warn)' : 'var(--status-safe)'}
          iconBg="rgba(0,255,136,0.06)"
          sub={latest.battery_level > 80 ? 'Fully charged' : 'Charging via solar'}
        />
        <KPICard
          label="Flow Rate"
          value={latest.flow_rate}
          unit="L/min"
          icon="💦"
          color="var(--accent-cyan)"
          iconBg="rgba(0,200,255,0.08)"
        />
        <KPICard
          label="Pump Power"
          value={latest.pump_power}
          unit="W"
          icon="⚡"
          color={latest.pump_status === 'HIGH' ? 'var(--accent-red)' :
                 latest.pump_status === 'LOW'  ? 'var(--accent-cyan)' : 'var(--text-muted)'}
          iconBg="rgba(168,85,247,0.08)"
          sub={`Mode: ${latest.pump_status}`}
        />
        <KPICard
          label="Rain Risk"
          value={latest.rain_probability}
          unit="%"
          icon="🌧️"
          color={latest.rain_probability >= 70 ? 'var(--status-danger)' :
                 latest.rain_probability >= 40 ? 'var(--status-warn)' : 'var(--status-safe)'}
          iconBg="rgba(0,200,255,0.05)"
          sub={`${latest.expected_rainfall.toFixed(1)} mm expected`}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid-7-3 mb-md">
        {/* Water Level Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">💧 Real-time Water Level</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Last {readings.length} readings
            </span>
          </div>
          <WaterLevelChart readings={readings} />
        </div>

        {/* Alert Feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">🔔 Active Alerts</span>
            <span style={{
              padding: '2px 10px',
              background: alerts.filter(a => !a.acknowledged).length > 0 ? 'rgba(255,59,92,0.1)' : 'rgba(0,255,136,0.06)',
              border: `1px solid ${alerts.filter(a => !a.acknowledged).length > 0 ? 'rgba(255,59,92,0.3)' : 'rgba(0,255,136,0.2)'}`,
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 700,
              color: alerts.filter(a => !a.acknowledged).length > 0 ? 'var(--accent-red)' : 'var(--status-safe)',
            }}>
              {alerts.filter(a => !a.acknowledged).length} ACTIVE
            </span>
          </div>
          <AlertFeed alerts={alerts} onAcknowledge={acknowledge} maxVisible={5} />
        </div>
      </div>

      {/* Prediction + Weather + Pump */}
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        {/* AI Prediction Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">🧠 AI Water Level Prediction</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                +30min: {(decision?.predicted30min ?? 0).toFixed(1)}%
              </span>
              <span style={{ fontSize: 12, color: (decision?.predicted60min ?? 0) >= 80 ? 'var(--status-danger)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                +60min: {(decision?.predicted60min ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <PredictionChart currentLevel={latest.water_level} decision={decision} />
        </div>

        {/* Weather Widget */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">🌦️ Weather Forecast</span>
          </div>
          <WeatherWidget
            rainProbability={latest.rain_probability}
            expectedRainfall={latest.expected_rainfall}
            riskLevel={risk}
            temperature={latest.temperature}
            liveWeather={liveWeather}
          />
        </div>

        {/* Pump Control */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">⚙️ Pump Control</span>
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', padding: 'var(--space-sm) 0' }}>
              <GaugeCard
                value={latest.water_level}
                label="Water"
                size={100}
              />
              <GaugeCard
                value={latest.battery_level}
                label="Battery"
                color="var(--status-safe)"
                size={100}
                thresholds={{ warn: 40, danger: 20 }}
              />
            </div>
          </div>
          <PumpControl currentMode={pump} />
        </div>
      </div>
    </div>
  );
};
