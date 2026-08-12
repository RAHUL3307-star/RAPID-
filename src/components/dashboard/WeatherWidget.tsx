import React from 'react';
import type { RiskLevel } from '../../lib/aiDecisionEngine';
import type { WeatherData } from '../../lib/weatherService';

interface WeatherWidgetProps {
  rainProbability:  number;
  expectedRainfall: number;
  riskLevel:        RiskLevel;
  temperature?:     number | null;
  liveWeather?:     WeatherData | null;
}

function getRainIcon(prob: number): string {
  if (prob >= 70) return '⛈️';
  if (prob >= 50) return '🌧️';
  if (prob >= 25) return '🌦️';
  return '☀️';
}

function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'LOW':      return '✅ LOW — Safe conditions';
    case 'MEDIUM':   return '⚠️ MEDIUM — Monitor water level';
    case 'HIGH':     return '🟠 HIGH — Increase pump speed';
    case 'CRITICAL': return '🔴 CRITICAL — Maximum pumping required';
  }
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  rainProbability, expectedRainfall, riskLevel, temperature, liveWeather,
}) => {
  const riskClass = riskLevel.toLowerCase() as 'low' | 'medium' | 'high' | 'critical';

  const displayTemp = liveWeather?.temperature ?? temperature;
  const displayProb = liveWeather?.rainProbability ?? rainProbability;
  const displayPrecip = liveWeather?.expectedRainfall ?? expectedRainfall;
  const displayDesc = liveWeather?.conditionText ?? (
    displayProb >= 70 ? 'Heavy Rain Expected' :
    displayProb >= 40 ? 'Rain Possible' :
    displayProb >= 20 ? 'Partly Cloudy' : 'Clear / Sunny'
  );

  return (
    <div className="weather-card">
      <div className="weather-main">
        <span className="weather-icon-large" role="img" aria-label="weather">
          {getRainIcon(displayProb)}
        </span>
        <div>
          <div className="weather-temp">
            {displayTemp != null ? `${displayTemp.toFixed(1)}°C` : '--°C'}
          </div>
          <div className="weather-desc">
            {displayDesc}
          </div>
          {liveWeather?.locationName && (
            <div style={{ fontSize: 11, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              📍 {liveWeather.locationName}
            </div>
          )}
        </div>
      </div>

      <div className="weather-stats">
        <div className="weather-stat">
          <div className="weather-stat-label">Rain Prob.</div>
          <div
            className="weather-stat-value"
            style={{
              color: displayProb >= 70 ? 'var(--status-danger)'
                   : displayProb >= 40 ? 'var(--status-warn)'
                   : 'var(--status-safe)',
            }}
          >
            {displayProb.toFixed(0)}%
          </div>
        </div>
        <div className="weather-stat">
          <div className="weather-stat-label">Expected</div>
          <div
            className="weather-stat-value"
            style={{ color: displayPrecip >= 15 ? 'var(--status-danger)' : 'var(--text-primary)' }}
          >
            {displayPrecip.toFixed(1)} mm
          </div>
        </div>
      </div>

      <div className={`weather-risk ${riskClass}`}>
        <span>Mine Water Risk:</span>
        <span style={{ marginLeft: 4 }}>{getRiskLabel(riskLevel)}</span>
      </div>
    </div>
  );
};
