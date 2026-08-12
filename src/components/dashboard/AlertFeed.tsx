import React from 'react';
import type { Alert } from '../../types';

interface AlertFeedProps {
  alerts:      Alert[];
  onAcknowledge: (id: string) => void;
  maxVisible?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const typeEmoji: Record<string, string> = {
  RAIN_ALERT:     '🌧️',
  WATER_RISING:   '💧',
  BATTERY_LOW:    '🔋',
  PUMP_STATUS:    '⚙️',
  SOLAR_LOW:      '☀️',
  SYSTEM:         '🧠',
};

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts, onAcknowledge, maxVisible = 8,
}) => {
  const visible = alerts.slice(0, maxVisible);

  if (visible.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32 }}>✅</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>No active alerts</div>
      </div>
    );
  }

  return (
    <div className="alert-list">
      {visible.map(alert => (
        <div
          key={alert.id}
          className={`alert-item ${alert.severity.toLowerCase()}`}
          style={{ opacity: alert.acknowledged ? 0.5 : 1 }}
        >
          <div className="alert-severity-dot" />
          <div className="alert-body">
            <div className="alert-title">
              <span style={{ marginRight: 6 }}>
                {typeEmoji[alert.type] || '🔔'}
              </span>
              {alert.type.replace(/_/g, ' ')}
            </div>
            <div className="alert-msg">{alert.message}</div>
            <div className="alert-time">{timeAgo(alert.created_at)}</div>
          </div>
          {!alert.acknowledged && (
            <button
              className="alert-ack-btn"
              onClick={() => onAcknowledge(alert.id)}
              title="Acknowledge alert"
            >
              ACK
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
