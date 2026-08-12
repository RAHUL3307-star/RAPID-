import { useState, useEffect } from 'react';
import { Sidebar }      from './components/layout/Sidebar';
import { Dashboard }    from './pages/Dashboard';
import { Analytics }    from './pages/Analytics';
import { DemoMode }     from './pages/DemoMode';
import { Settings }     from './pages/Settings';
import { LandingPage }  from './pages/LandingPage';
import { LoginPage }    from './pages/LoginPage';
import { useAlerts }    from './hooks/useAlerts';
import { useSensorData } from './hooks/useSensorData';
import { usePredictions } from './hooks/usePredictions';
import { useAuth }      from './hooks/useAuth';
import { isDemoMode }   from './lib/supabaseClient';

type View    = 'landing' | 'login' | 'app';
type AppPage = 'dashboard' | 'analytics' | 'demo' | 'settings';

const PAGE_TITLES: Record<AppPage, { title: string; subtitle: string }> = {
  dashboard: { title: '⚡ RAPID — Operations Dashboard', subtitle: 'Rainfall Analysis & Pump Intelligence for Dewatering · Real-time telemetry · AI prediction' },
  analytics:  { title: '📊 Analytics & History',          subtitle: 'Historical trends and energy analysis' },
  demo:       { title: '🎭 Demo Mode',                     subtitle: 'Simulate heavy rainfall scenario for judges' },
  settings:   { title: '⚙️ System Settings',               subtitle: 'Configure API keys and alert thresholds' },
};

function AppShell({ user, signOut }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; signOut: () => void }) {
  const [page, setPage] = useState<AppPage>('dashboard');
  const [time, setTime] = useState(new Date());
  const { unacknowledged } = useAlerts();
  const { readings }       = useSensorData();
  const { decision }       = usePredictions(readings);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const systemStatus: 'safe' | 'warn' | 'danger' =
    decision?.riskLevel === 'CRITICAL' ? 'danger' :
    decision?.riskLevel === 'HIGH'     ? 'danger' :
    decision?.riskLevel === 'MEDIUM'   ? 'warn'   : 'safe';

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'analytics':  return <Analytics />;
      case 'demo':       return <DemoMode />;
      case 'settings':   return <Settings />;
    }
  };

  const pageInfo = PAGE_TITLES[page];

  return (
    <div className="app-shell">
      <Sidebar
        activePage={page}
        onNavigate={(p) => setPage(p as AppPage)}
        alertCount={unacknowledged}
        systemStatus={systemStatus}
        user={user}
        onSignOut={signOut}
      />

      <main className="main-content" id="main-content" role="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title">{pageInfo.title}</div>
            <div className="topbar-subtitle">{pageInfo.subtitle}</div>
          </div>

          <div className="topbar-right">
            {isDemoMode && (
              <span style={{
                padding: '4px 12px',
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 11, color: 'var(--accent-purple)', fontWeight: 700,
              }}>
                DEMO MODE
              </span>
            )}

            <div className="live-badge">
              <div className="live-dot" />
              LIVE
            </div>

            <div className="topbar-time">
              {time.toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              })}
            </div>

            <button
              className="alert-bell"
              id="alert-bell-btn"
              onClick={() => setPage('dashboard')}
              aria-label={`${unacknowledged} unacknowledged alerts`}
            >
              🔔
              {unacknowledged > 0 && (
                <span className="alert-count">{unacknowledged}</span>
              )}
            </button>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('landing');

  // Sync view with auth state changes (login/logout)
  // This now reliably fires because user comes from shared AuthContext
  useEffect(() => {
    if (loading) return;
    if (user) {
      setView('app');
    } else if (!user && view === 'app') {
      setView('landing');
    }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0A0F1E', fontFamily: "'Playfair Display', serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌧️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#E2E8F0', marginBottom: 8 }}>RAPID</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Loading system…</div>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onLogin={()      => setView('login')}
        onGetStarted={()  => setView('login')}
        user={user}
        onDashboard={()  => setView('app')}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginPage
        onBack={()    => setView('landing')}
        onSuccess={()  => setView('app')}
      />
    );
  }

  // Guard: if somehow in 'app' view but user is null (race condition), show loader
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0A0F1E', fontFamily: "'Playfair Display', serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌧️</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#E2E8F0', marginBottom: 8 }}>RAPID</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>Loading session…</div>
        </div>
      </div>
    );
  }

  return <AppShell user={user} signOut={() => { signOut(); setView('landing'); }} />;
}
