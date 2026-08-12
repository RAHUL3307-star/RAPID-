import React from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area,
} from 'recharts';
import type { AIDecision } from '../../lib/aiDecisionEngine';

interface PredictionChartProps {
  currentLevel: number;
  decision:     AIDecision | null;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-normal)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || p.fill, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value?.toFixed(1)}%
        </div>
      ))}
    </div>
  );
};

export const PredictionChart: React.FC<PredictionChartProps> = ({ currentLevel, decision }) => {
  const p30 = decision?.predicted30min ?? currentLevel;
  const p60 = decision?.predicted60min ?? currentLevel;

  const data = [
    { time: 'Now',   water: currentLevel, prediction: currentLevel, type: 'actual' },
    { time: '+15m',  water: null,         prediction: (currentLevel + p30) / 2,   type: 'predicted' },
    { time: '+30m',  water: null,         prediction: p30,          type: 'predicted' },
    { time: '+45m',  water: null,         prediction: (p30 + p60) / 2,            type: 'predicted' },
    { time: '+60m',  water: null,         prediction: p60,          type: 'predicted' },
  ];

  const maxPrediction = Math.max(p30, p60);
  const predictionColor = maxPrediction >= 80 ? 'var(--status-danger)'
                        : maxPrediction >= 60 ? 'var(--status-warn)'
                        : 'var(--accent-cyan)';

  return (
    <div className="chart-wrapper-tall">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={80} stroke="rgba(255,59,92,0.5)" strokeDasharray="4 4"
            label={{ value: '80% DANGER', position: 'insideTopRight', fill: 'var(--status-danger)', fontSize: 10 }} />
          <ReferenceLine y={60} stroke="rgba(255,183,0,0.35)" strokeDasharray="4 4"
            label={{ value: '60% WARN', position: 'insideTopRight', fill: 'var(--status-warn)', fontSize: 10 }} />

          {/* Prediction area fill */}
          <Area
            type="monotone"
            dataKey="prediction"
            name="AI Prediction"
            fill={maxPrediction >= 80 ? 'rgba(255,59,92,0.08)' : 'rgba(0,200,255,0.05)'}
            stroke={predictionColor}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            dot={{ fill: predictionColor, r: 4 }}
            activeDot={{ r: 6, fill: predictionColor }}
          />

          {/* Current actual reading */}
          <Line
            type="monotone"
            dataKey="water"
            name="Current"
            stroke="var(--accent-green)"
            strokeWidth={3}
            dot={{ fill: 'var(--accent-green)', r: 5 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {decision && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'var(--bg-glass-light)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>🧠 AI Assessment: </strong>
          {decision.recommendedAction}
        </div>
      )}
    </div>
  );
};
