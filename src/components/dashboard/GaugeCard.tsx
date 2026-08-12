import React from 'react';

interface GaugeCardProps {
  value: number;       // 0–100
  label: string;
  unit?: string;
  color?: string;
  size?: number;
  thresholds?: { warn: number; danger: number };
}

export const GaugeCard: React.FC<GaugeCardProps> = ({
  value,
  label,
  unit = '%',
  color,
  size = 120,
  thresholds = { warn: 60, danger: 80 },
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  // SVG arc math
  const radius = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // half circle
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Dynamic color based on value
  const dynamicColor = color || (
    clampedValue >= thresholds.danger ? 'var(--status-danger)' :
    clampedValue >= thresholds.warn   ? 'var(--status-warn)' :
                                        'var(--status-safe)'
  );

  const glowColor = color || (
    clampedValue >= thresholds.danger ? 'rgba(255,59,92,0.4)' :
    clampedValue >= thresholds.warn   ? 'rgba(255,183,0,0.4)' :
                                        'rgba(0,255,136,0.4)'
  );

  return (
    <div className="gauge-container">
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={dynamicColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />

        {/* Center value text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: dynamicColor,
            fontSize: size * 0.18,
            fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'fill 0.5s ease',
          }}
        >
          {clampedValue.toFixed(0)}{unit}
        </text>
      </svg>
      <span className="gauge-label">{label}</span>
    </div>
  );
};
