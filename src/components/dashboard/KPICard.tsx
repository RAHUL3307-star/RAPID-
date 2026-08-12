import React from 'react';
import type { ReactNode } from 'react';

interface KPICardProps {
  label:    string;
  value:    number | string;
  unit?:    string;
  icon:     ReactNode;
  iconBg?:  string;
  color?:   string;
  sub?:     string;
  trend?:   { direction: 'up' | 'down'; label: string };
}

export const KPICard: React.FC<KPICardProps> = ({
  label, value, unit, icon, iconBg, color, sub, trend,
}) => {
  const cssColor = color || 'var(--accent-cyan)';
  const cssBg    = iconBg || 'rgba(0,200,255,0.08)';

  return (
    <div
      className="kpi-card"
      style={{ '--kpi-color': cssColor, '--kpi-bg': cssBg } as React.CSSProperties}
    >
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">{icon}</div>
      </div>

      <div className="kpi-value">
        {typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value}
        {unit && <span className="kpi-unit"> {unit}</span>}
      </div>

      {sub && <div className="kpi-sub">{sub}</div>}

      {trend && (
        <div className={`kpi-trend ${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
        </div>
      )}
    </div>
  );
};
