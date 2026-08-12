import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useSensorData } from '../hooks/useSensorData';

export const Analytics: React.FC = () => {
  const { readings } = useSensorData();

  const data = readings.map((r, i) => ({
    idx:          i + 1,
    water:        r.water_level,
    battery:      r.battery_level,
    solar:        r.solar_power,
    flow:         r.flow_rate,
    pump:         r.pump_power,
    rain:         r.rain_probability,
  }));

  const avgWater   = data.length ? (data.reduce((a, d) => a + d.water, 0)   / data.length).toFixed(1) : '0';
  const avgSolar   = data.length ? (data.reduce((a, d) => a + d.solar, 0)   / data.length).toFixed(0) : '0';
  const avgBattery = data.length ? (data.reduce((a, d) => a + d.battery, 0) / data.length).toFixed(1) : '0';
  const maxWater   = data.length ? Math.max(...data.map(d => d.water)).toFixed(1) : '0';
  const pumpHours  = data.filter(d => d.pump > 0).length * (3 / 3600); // 3s intervals

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 RAPID — Analytics & History</h1>
        <p>Historical trends, energy analysis, and operational statistics</p>
      </div>

      {/* Summary stats */}
      <div className="grid-6 mb-xl" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Avg Water Level', value: `${avgWater}%`, color: 'var(--accent-cyan)' },
          { label: 'Max Water Level', value: `${maxWater}%`, color: 'var(--status-danger)' },
          { label: 'Avg Solar Power', value: `${avgSolar} W`, color: 'var(--accent-yellow)' },
          { label: 'Avg Battery', value: `${avgBattery}%`, color: 'var(--status-safe)' },
          { label: 'Pump Runtime', value: `${pumpHours.toFixed(2)} hrs`, color: 'var(--accent-purple)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, fontFamily: 'var(--font-mono)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        {/* Water + Rain chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">💧 Water Level vs Rain Probability</span>
          </div>
          <div className="chart-wrapper-tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} label={{ value: 'Reading #', position: 'insideBottom', fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="water" name="Water %" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rain" name="Rain %" stroke="var(--accent-purple)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">⚡ Energy — Solar vs Battery</span>
          </div>
          <div className="chart-wrapper-tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Line type="monotone" dataKey="solar" name="Solar (W)" stroke="var(--accent-yellow)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="battery" name="Battery %" stroke="var(--status-safe)" strokeWidth={2} dot={false} yAxisId="pct" />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pump power bar chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">⚙️ Pump Power Consumption</span>
          </div>
          <div className="chart-wrapper-tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                />
                <Bar dataKey="pump" name="Pump Power (W)" fill="var(--accent-cyan)" opacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flow rate */}
        <div className="card">
          <div className="card-header">
            <span className="card-title-large">💦 Flow Rate History</span>
          </div>
          <div className="chart-wrapper-tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-normal)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-muted)', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="flow" name="Flow (L/min)" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
