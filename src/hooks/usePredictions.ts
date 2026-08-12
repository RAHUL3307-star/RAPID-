import { useState, useEffect } from 'react';
import { computeDecision } from '../lib/aiDecisionEngine';
import type { SensorReading } from '../types';
import type { AIDecision } from '../lib/aiDecisionEngine';

export function usePredictions(readings: SensorReading[]) {
  const [decision, setDecision] = useState<AIDecision | null>(null);

  useEffect(() => {
    if (readings.length < 2) return;

    const latest = readings[readings.length - 1];
    const prev   = readings[readings.length - 2];

    const result = computeDecision({
      waterLevel:       latest.water_level,
      flowRate:         latest.flow_rate,
      solarPower:       latest.solar_power,
      batteryLevel:     latest.battery_level,
      pumpPower:        latest.pump_power,
      rainProbability:  latest.rain_probability,
      expectedRainfall: latest.expected_rainfall,
      prevWaterLevel:   prev.water_level,
    });

    setDecision(result);
  }, [readings]);

  return { decision };
}
