import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { SensorReading } from '../../types';

interface WaterLevelChartProps {
  readings: SensorReading[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
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
        <div key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value?.toFixed(1)}
          {p.dataKey === 'water_level' ? '%' :
           p.dataKey === 'flow_rate'   ? ' L/min' :
           p.dataKey === 'solar_power' ? ' W' : ''}
        </div>
      ))}
    </div>
  );
};

export const WaterLevelChart: React.FC<WaterLevelChartProps> = ({ readings }) => {
  const data = readings.map(r => ({
    time:        formatTime(r.created_at),
    water_level: r.water_level,
    flow_rate:   r.flow_rate,
  }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 60]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Danger zone reference lines */}
          <ReferenceLine yAxisId="left" y={80} stroke="rgba(255,59,92,0.4)" strokeDasharray="4 4"
            label={{ value: 'DANGER', position: 'insideTopRight', fill: 'var(--status-danger)', fontSize: 10 }} />
          <ReferenceLine yAxisId="left" y={60} stroke="rgba(255,183,0,0.3)" strokeDasharray="4 4"
            label={{ value: 'WARN', position: 'insideTopRight', fill: 'var(--status-warn)', fontSize: 10 }} />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="water_level"
            name="Water Level"
            stroke="var(--accent-cyan)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent-cyan)' }}
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,200,255,0.5))' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="flow_rate"
            name="Flow Rate"
            stroke="var(--accent-green)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 3"
            activeDot={{ r: 3, fill: 'var(--accent-green)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
