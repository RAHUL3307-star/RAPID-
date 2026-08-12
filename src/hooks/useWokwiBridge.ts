/**
 * useWokwiBridge — Real-time hardware data from Wokwi ESP32
 * ==========================================================
 * Connects to the RAPID bridge server via WebSocket and streams
 * live SensorReading objects into the React app.
 *
 * Usage: enabled via Settings → Hardware Mode toggle.
 * Falls back to demo data if disconnected.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SensorReading } from '../types';

export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WokwiBridgeState {
  latest:         SensorReading | null;
  readings:       SensorReading[];
  status:         BridgeStatus;
  readingCount:   number;
  latency:        number | null;       // ms since last reading
  errorMessage:   string | null;
  isHardwareMode: boolean;
  sendPumpCommand?: (command: 'OFF' | 'LOW' | 'HIGH') => void;
}

const HISTORY_LIMIT = 60;
const RECONNECT_MS  = 3000;

function getBridgeUrl(): string {
  return localStorage.getItem('rapid_bridge_url') || 'ws://localhost:8080';
}

export function useWokwiBridge(enabled: boolean): WokwiBridgeState {
  const [latest,       setLatest]       = useState<SensorReading | null>(null);
  const [readings,     setReadings]     = useState<SensorReading[]>([]);
  const [status,       setStatus]       = useState<BridgeStatus>('disconnected');
  const [readingCount, setReadingCount] = useState(0);
  const [latency,      setLatency]      = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadingTs  = useRef<number | null>(null);
  const latencyTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  const addReading = useCallback((r: SensorReading) => {
    setLatest(r);
    setReadings(prev => {
      const next = [...prev, r];
      return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
    });
    setReadingCount(c => c + 1);
    lastReadingTs.current = Date.now();
    setLatency(0);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    const url = getBridgeUrl();
    setStatus('connecting');
    setErrorMessage(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setStatus('error');
      setErrorMessage(`Cannot create WebSocket to ${url}`);
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      setErrorMessage(null);
      console.log('[Bridge] Connected to', url);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'reading' && msg.data) {
          addReading(msg.data as SensorReading);
        } else if (msg.type === 'handshake') {
          console.log('[Bridge] Handshake:', msg);
        } else if (msg.type === 'pump_ack') {
          console.log('[Bridge] Pump ACK:', msg.command);
        }
      } catch (e) {
        console.warn('[Bridge] Bad message:', evt.data);
      }
    };

    ws.onerror = (_evt) => {
      console.error('[Bridge] WebSocket error');
      setStatus('error');
      setErrorMessage(`Cannot connect to bridge server at ${url}. Is it running?`);
    };

    ws.onclose = () => {
      console.log('[Bridge] Disconnected — reconnecting in', RECONNECT_MS, 'ms');
      setStatus('disconnected');
      wsRef.current = null;
      if (enabled) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_MS);
      }
    };
  }, [enabled, addReading]);

  // Track latency (time since last reading)
  useEffect(() => {
    latencyTimer.current = setInterval(() => {
      if (lastReadingTs.current !== null && status === 'connected') {
        setLatency(Math.round((Date.now() - lastReadingTs.current) / 1000));
      }
    }, 1000);
    return () => {
      if (latencyTimer.current) clearInterval(latencyTimer.current);
    };
  }, [status]);

  useEffect(() => {
    if (!enabled) {
      // Close existing connection if disabled
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setStatus('disconnected');
      setLatency(null);
      return;
    }
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [enabled, connect]);

  /**
   * Send a pump command to the ESP32 (via bridge server)
   * (Optional — bridge forwards to ESP32 if implemented)
   */
  const sendPumpCommand = useCallback((command: 'OFF' | 'LOW' | 'HIGH') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'pump_command', command }));
    }
  }, []);

  return {
    latest,
    readings,
    status,
    readingCount,
    latency,
    errorMessage,
    isHardwareMode: enabled,
    sendPumpCommand,
  };
}
