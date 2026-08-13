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
  { id: 'dashboard', label: 'Overview',         icon: OverviewIcon  },
  { id: 'analytics', label: 'Analytics & History', icon: AnalyticsIcon },
  { id: 'demo',      label: 'Live Monitoring',   icon: MonitorIcon   },
  { id: 'weather',   label: 'Weather',           icon: WeatherIcon   },
  { id: 'pump',      label: 'Pump Control',      icon: PumpIcon      },
  { id: 'solar',     label: 'Solar & Energy',    icon: SolarIcon     },
  { id: 'alerts',    label: 'Alerts',            icon: AlertIcon,    badge: true },
  { id: 'settings',  label: 'System Settings',   icon: SysSetIcon    },
];

/* ── SVG icons ── */
function OverviewIcon()  { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity=".9"/><rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity=".5"/><rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity=".5"/><rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity=".5"/></svg>; }
function AnalyticsIcon() { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><polyline points="3,17 8,11 13,14 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function MonitorIcon()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function WeatherIcon()   { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 1 0 0-10z" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function PumpIcon()      { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function SolarIcon()     { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function AlertIcon()     { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function SysSetIcon()    { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>; }

export const Sidebar: React.FC<SidebarProps> = ({
  activePage, onNavigate, alertCount, user, onSignOut,
}) => {
  return (
    <nav className="sidebar-root" style={S.sidebar}>
      {/* ── Logo ── */}
      <div className="sidebar-logo-container" style={S.logo}>
        <div style={S.logoMark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0B0D0F" />
          </svg>
        </div>
        <div className="sidebar-logo-details">
          <div style={S.logoText}>RAPID</div>
          <div style={S.logoSub}>WATER COMMAND</div>
        </div>
      </div>

      <div className="sidebar-divider" style={S.divider} />

      {/* ── Nav items ── */}
      <div className="sidebar-nav-list" style={S.navList}>
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          const Icon     = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{
                ...S.navItem,
                background: isActive ? 'rgba(183,243,74,0.12)' : 'transparent',
                borderLeft: isActive ? '2px solid #B7F34A'     : '2px solid transparent',
                color:      isActive ? '#B7F34A'               : '#8B9298',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = '#C8CDD1';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#8B9298';
                }
              }}
            >
              <span style={{ color: isActive ? '#B7F34A' : '#8B9298', display: 'flex', flexShrink: 0 }}>
                <Icon />
              </span>
              <span className="sidebar-nav-label" style={S.navLabel}>{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span style={S.alertBadge}>{alertCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Footer / User ── */}
      <div className="sidebar-footer" style={S.footer}>
        {user && (
          <div className="sidebar-user-card" style={S.userCard}>
            <div style={S.userAvatar}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div style={S.userName}>{user.name || 'Analyst'}</div>
              <div style={S.userRole}>
                {user.email?.split('@')[0] || 'DR-CONSOLE-09'}
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign out"
                style={S.signOutBtn}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8B9298'; }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 220,
    minWidth: 220,
    background: '#10141A',
    borderRight: '1px solid #1C2028',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 18px 16px',
  },
  logoMark: {
    width: 32,
    height: 32,
    background: '#B7F34A',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    color: '#F5F7F2',
    letterSpacing: '-0.01em',
    lineHeight: 1.1,
  },
  logoSub: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 600,
    fontSize: 9,
    color: '#63D9FF',
    letterSpacing: '0.12em',
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: '#1C2028',
    margin: '0 18px 8px',
  },
  navList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '4px 8px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px 9px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    fontFamily: "'Geist', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    textAlign: 'left' as const,
    width: '100%',
    cursor: 'pointer',
  },
  navLabel: {
    flex: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  alertBadge: {
    background: '#EF4444',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 10,
    padding: '1px 5px',
    minWidth: 16,
    textAlign: 'center' as const,
    fontFamily: "'Geist', sans-serif",
  },
  footer: {
    padding: '8px 10px 14px',
    borderTop: '1px solid #1C2028',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid #1C2028',
    borderRadius: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    background: 'linear-gradient(135deg, #63D9FF, #B7F34A)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: '#0B0D0F',
    flexShrink: 0,
    fontFamily: "'Outfit', sans-serif",
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#F5F7F2',
    fontFamily: "'Geist', sans-serif",
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  userRole: {
    fontSize: 10,
    color: '#8B9298',
    fontFamily: "'Geist Mono', monospace",
    marginTop: 1,
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#8B9298',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s',
    flexShrink: 0,
  },
};
