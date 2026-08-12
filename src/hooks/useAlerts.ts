import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabaseClient';
import type { Alert } from '../types';

const DEMO_ALERTS: Alert[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    type: 'RAIN_ALERT',
    severity: 'WARNING',
    message: 'Heavy rainfall (85%) expected within 30 minutes. Pre-emptive pumping initiated.',
    acknowledged: false,
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    type: 'WATER_RISING',
    severity: 'CRITICAL',
    message: 'Water level rising rapidly at 2.5%/min. Pump switched to HIGH SPEED.',
    acknowledged: false,
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    type: 'BATTERY_LOW',
    severity: 'INFO',
    message: 'Battery at 86%. Solar charging active. Estimated full charge in 2 hours.',
    acknowledged: true,
  },
];

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const acknowledge = useCallback(async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    if (!isDemoMode && supabase) {
      await supabase.from('alerts').update({ acknowledged: true }).eq('id', id);
    }
  }, []);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    if (isDemoMode || !supabase) {
      setAlerts(DEMO_ALERTS);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let handled = false;

    const timeoutTimer = setTimeout(() => {
      if (!handled && isMounted) {
        handled = true;
        setAlerts(DEMO_ALERTS);
        setLoading(false);
      }
    }, 1500);

    supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(
        ({ data, error }) => {
          if (!isMounted || handled) return;
          clearTimeout(timeoutTimer);
          handled = true;

          if (error || !data) {
            if (error) console.warn('[useAlerts] Fetch error, using default alerts:', error.message);
            setAlerts(DEMO_ALERTS);
          } else {
            setAlerts(data as Alert[]);
          }
          setLoading(false);
        },
        (_err: any) => {
          if (!isMounted || handled) return;
          clearTimeout(timeoutTimer);
          handled = true;
          setAlerts(DEMO_ALERTS);
          setLoading(false);
        }
      );

    const channel = supabase
      .channel(`alerts-sub-${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => addAlert(payload.new as Alert)
      );

    channel.subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      supabase?.removeChannel(channel);
    };
  }, [addAlert]);

  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  return { alerts, loading, acknowledge, unacknowledged };
}
