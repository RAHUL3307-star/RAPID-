import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isDemoMode } from '../lib/supabaseClient';
import { useWokwiBridge } from './useWokwiBridge';
import type { SensorReading } from '../types';

/** Returns true if the user has enabled hardware mode in Settings */
function useHardwareMode(): boolean {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('rapid_hardware_mode') === 'true'
  );
  useEffect(() => {
    const handler = () =>
      setEnabled(localStorage.getItem('rapid_hardware_mode') === 'true');
    window.addEventListener('storage', handler);
    window.addEventListener('rapid_hardware_mode_changed', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('rapid_hardware_mode_changed', handler);
    };
  }, []);
  return enabled;
}

/** Generates realistic simulated sensor readings for demo mode */
function generateDemoReading(
  prev: SensorReading | null
): SensorReading {
  const now = new Date().toISOString();
  const base = prev || {
    id: crypto.randomUUID(),
    created_at: now,
    water_level: 40,
    flow_rate: 12,
    solar_power: 820,
    battery_level: 90,
    pump_power: 0,
    pump_status: 'OFF' as const,
    rain_probability: 20,
    expected_rainfall: 2,
    temperature: 28.5,
  };

  // Normal random variation
  let wl = base.water_level + (Math.random() - 0.45) * 0.8;
  let rp = base.rain_probability + (Math.random() - 0.5) * 2;
  let sp = base.solar_power + (Math.random() - 0.5) * 30;
  let bl = base.battery_level - 0.05 + (sp > 600 ? 0.1 : 0);
  let er = base.expected_rainfall + (Math.random() - 0.5) * 0.5;

  // Clamp
  wl = Math.min(100, Math.max(0, wl));
  rp = Math.min(100, Math.max(0, rp));
  sp = Math.min(1200, Math.max(0, sp));
  bl = Math.min(100, Math.max(0, bl));
  er = Math.min(50, Math.max(0, er));

  let pump_status: SensorReading['pump_status'] = 'OFF';
  let pump_power = 0;
  let fr = base.flow_rate + (Math.random() - 0.5) * 2;

  if (wl > 65 || rp > 70) {
    pump_status = 'HIGH'; pump_power = 610 + (Math.random() - 0.5) * 40; fr = 34 + Math.random() * 4;
  } else if (wl > 40 || rp > 40) {
    pump_status = 'LOW'; pump_power = 300 + (Math.random() - 0.5) * 30; fr = 18 + Math.random() * 4;
    wl -= 0.3;
  } else {
    wl += 0.1;
  }

  if (pump_status === 'HIGH') wl -= 0.6;

  return {
    id: crypto.randomUUID(),
    created_at: now,
    water_level:      parseFloat(Math.min(100, Math.max(0, wl)).toFixed(1)),
    flow_rate:        parseFloat(Math.max(0, fr).toFixed(1)),
    solar_power:      parseFloat(sp.toFixed(0)),
    battery_level:    parseFloat(bl.toFixed(1)),
    pump_power:       parseFloat(pump_power.toFixed(0)),
    pump_status,
    rain_probability: parseFloat(rp.toFixed(0)),
    expected_rainfall: parseFloat(er.toFixed(1)),
    temperature:      parseFloat((base.temperature! + (Math.random() - 0.5) * 0.2).toFixed(1)),
  };
}

const HISTORY_LIMIT = 60;

/** Main sensor data hook — supports demo, Supabase, and Wokwi hardware modes */
export function useSensorData() {
  const hardwareMode = useHardwareMode();
  const bridge       = useWokwiBridge(hardwareMode);

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [latest,   setLatest]   = useState<SensorReading | null>(null);
  const [loading,  setLoading]  = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addReading = useCallback((r: SensorReading) => {
    setLatest(r);
    setReadings(prev => {
      const next = [...prev, r];
      return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
    });
  }, []);

  // ── Hardware mode: use bridge data directly ──────────────────────
  useEffect(() => {
    if (!hardwareMode) return;
    if (bridge.latest) {
      setLatest(bridge.latest);
      setLoading(false);
    }
    if (bridge.readings.length > 0) {
      setReadings(bridge.readings);
    }
    if (bridge.status === 'connected') {
      setLoading(false);
    }
  }, [hardwareMode, bridge.latest, bridge.readings, bridge.status]);

  // ── Fallback: demo / Supabase mode ──────────────────────────────
  useEffect(() => {
    if (hardwareMode) {
      // clear demo interval if switching to hardware mode
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Function to initialize live simulated data fallback
    const initDemoFallback = () => {
      const seed: SensorReading[] = [];
      let prev: SensorReading | null = null;
      for (let i = 0; i < 30; i++) {
        const r = generateDemoReading(prev);
        seed.push(r);
        prev = r;
      }
      setReadings(seed);
      setLatest(seed[seed.length - 1]);
      setLoading(false);

      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setLatest(p => {
            const next = generateDemoReading(p);
            setReadings(prev => {
              const arr = [...prev, next];
              return arr.length > HISTORY_LIMIT ? arr.slice(-HISTORY_LIMIT) : arr;
            });
            return next;
          });
        }, 3000);
      }
    };

    if (isDemoMode || !supabase) {
      initDemoFallback();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // Real Supabase mode with fast timeout & fallback
    let isMounted = true;
    let handled = false;

    const timeoutTimer = setTimeout(() => {
      if (!handled && isMounted) {
        handled = true;
        console.warn('[useSensorData] Supabase response timed out, using instant live simulated data.');
        initDemoFallback();
      }
    }, 1500);

    supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT)
      .then(
        ({ data, error }) => {
          if (!isMounted || handled) return;
          clearTimeout(timeoutTimer);
          handled = true;

          if (error || !data || data.length === 0) {
            if (error) console.warn('[useSensorData] Supabase error, falling back to local readings:', error.message);
            initDemoFallback();
            return;
          }

          setReadings(data as SensorReading[]);
          setLatest(data[data.length - 1] as SensorReading);
          setLoading(false);
        },
        (err: any) => {
          if (!isMounted || handled) return;
          clearTimeout(timeoutTimer);
          handled = true;
          console.warn('[useSensorData] Supabase query failed:', err);
          initDemoFallback();
        }
      );

    const channel = supabase
      .channel(`sensor-readings-sub-${Math.random()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => addReading(payload.new as SensorReading)
      );

    channel.subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      supabase?.removeChannel(channel);
    };
  }, [hardwareMode, addReading]);

  return {
    readings: hardwareMode ? bridge.readings  : readings,
    latest:   hardwareMode ? bridge.latest    : latest,
    loading:  hardwareMode ? bridge.status === 'connecting' : loading,
    // Hardware extras
    hardwareMode,
    bridgeStatus:   bridge.status,
    bridgeLatency:  bridge.latency,
    bridgeError:    bridge.errorMessage,
    readingCount:   bridge.readingCount,
  };
}

