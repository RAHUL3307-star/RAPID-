import React from 'react';
import type { RiskLevel, PumpMode } from '../../lib/aiDecisionEngine';

interface StatusBannerProps {
  riskLevel:   RiskLevel;
  pumpMode:    PumpMode;
  waterLevel:  number;
  description: string;
}

const riskConfig = {
  LOW:      { className: 'safe',   icon: '✅', label: 'SYSTEM NORMAL',        color: 'var(--status-safe)' },
  MEDIUM:   { className: 'warn',   icon: '⚠️', label: 'ELEVATED WATER RISK',   color: 'var(--status-warn)' },
  HIGH:     { className: 'high',   icon: '🟠', label: 'HIGH WATER RISK',       color: 'var(--status-high)' },
  CRITICAL: { className: 'danger', icon: '🔴', label: 'CRITICAL — DANGER ZONE', color: 'var(--status-danger)' },
};

const pumpModeLabels: Record<PumpMode, string> = {
  OFF:  'PUMP: STANDBY',
  LOW:  'PUMP: LOW SPEED',
  HIGH: 'PUMP: HIGH SPEED',
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
  riskLevel, pumpMode, waterLevel, description,
}) => {
  const cfg = riskConfig[riskLevel];

  return (
    <div className={`status-banner ${cfg.className}`}>
      <div className="status-banner-left">
        <span className="status-banner-icon" role="img" aria-label={cfg.label}>
          {cfg.icon}
        </span>
        <div className="status-banner-text">
          <h3 style={{ color: cfg.color }}>
            STATUS: {cfg.label}
          </h3>
          <p>{description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            WATER LEVEL
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: cfg.color,
            fontFamily: 'var(--font-mono)',
            letterSpacing: -1,
          }}>
            {waterLevel.toFixed(1)}%
          </div>
        </div>

        <div className={`pump-mode-badge ${pumpMode.toLowerCase()}`}>
          {pumpModeLabels[pumpMode]}
        </div>
      </div>
    </div>
  );
};
