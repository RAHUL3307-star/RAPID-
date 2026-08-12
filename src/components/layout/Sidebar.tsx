import React from 'react';
import type { AuthUser } from '../../hooks/useAuth';

interface SidebarProps {
  activePage:   string;
  onNavigate:   (page: string) => void;
  alertCount:   number;
  systemStatus: 'safe' | 'warn' | 'danger';
  user?:        AuthUser | null;
  onSignOut?:   () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',   icon: '📊' },
  { id: 'analytics', label: 'Analytics',   icon: '📈' },
  { id: 'demo',      label: 'Demo Mode',   icon: '🎭' },
  { id: 'settings',  label: 'Settings',    icon: '⚙️' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage, onNavigate, alertCount, systemStatus, user, onSignOut,
}) => {
  const statusLabels: Record<string, string> = {
    safe:   'All Systems Normal',
    warn:   'Elevated Risk',
    danger: 'Critical Alert',
  };

  const statusColor = systemStatus === 'danger' ? 'var(--status-danger)'
                    : systemStatus === 'warn'   ? 'var(--status-warn)'
                    : 'var(--status-safe)';

  const statusBorder = systemStatus === 'danger' ? 'rgba(220,38,38,0.3)'
                     : systemStatus === 'warn'   ? 'rgba(217,119,6,0.3)'
                     : 'rgba(13,148,136,0.25)';

  const statusBg = systemStatus === 'danger' ? 'rgba(220,38,38,0.06)'
                 : systemStatus === 'warn'   ? 'rgba(217,119,6,0.06)'
                 : 'rgba(13,148,136,0.06)';

  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" aria-hidden="true">⚡</div>
        <div>
          <div className="sidebar-logo-text">RAPID</div>
          <div className="sidebar-logo-sub">Pump Intelligence</div>
        </div>
      </div>

      {/* Nav items */}
      <div className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <span className="nav-icon" role="img" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.id === 'dashboard' && alertCount > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--accent-red)', color: 'white',
                borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                padding: '1px 6px', minWidth: 18, textAlign: 'center',
              }}>
                {alertCount}
              </span>
            )}
            {item.id === 'demo' && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                color: 'var(--accent-purple)', borderRadius: 'var(--radius-full)',
                fontSize: 9, fontWeight: 700, padding: '1px 6px',
              }}>SIH</span>
            )}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 'var(--space-lg)' }}>Hardware</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">📡</span>
          <span>ESP32 Status</span>
          <span style={{ marginLeft:'auto', fontSize:10, color:'var(--status-safe)', fontFamily:'var(--font-mono)' }}>LIVE</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">🌐</span>
          <span>WeatherAPI</span>
          <span style={{ marginLeft:'auto', fontSize:10, color:'var(--status-safe)', fontFamily:'var(--font-mono)' }}>OK</span>
        </div>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User info */}
        {user && (
          <div style={{
            padding: '10px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            marginBottom: '10px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div style={{
                width:30, height:30,
                background:'linear-gradient(135deg,#06B6D4,#0D9488)',
                borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700, color:'white', flexShrink:0,
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', lineHeight:1.2 }}>
                  {user.name}
                </div>
                <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                  {user.email}
                </div>
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                style={{
                  width:'100%', padding:'6px', background:'transparent',
                  border:'1px solid #e2e8f0', borderRadius:'var(--radius-sm)',
                  color:'var(--text-muted)', fontSize:11, cursor:'pointer',
                  fontFamily:'inherit', transition:'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(220,38,38,0.4)', e.currentTarget.style.color='var(--status-danger)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor='#e2e8f0', e.currentTarget.style.color='var(--text-muted)')}
              >
                ← Sign Out
              </button>
            )}
          </div>
        )}

        <div className="system-status-pill" style={{ color:statusColor, borderColor:statusBorder, background:statusBg }}>
          <div className={`status-dot ${systemStatus !== 'safe' ? systemStatus : ''}`} />
          <span>{statusLabels[systemStatus]}</span>
        </div>

        <div style={{ marginTop:8, fontSize:10, color:'var(--text-muted)', textAlign:'center', fontFamily:'var(--font-mono)' }}>
          RAPID v1.0 · SIH 2026
        </div>
      </div>
    </nav>
  );
};
