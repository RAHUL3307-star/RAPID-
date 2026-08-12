/**
 * RAPID — Sensor Data Types
 * Shared TypeScript interfaces across the app
 */

export interface SensorReading {
  id:               string;
  created_at:       string;
  water_level:      number;
  flow_rate:        number;
  solar_power:      number;
  battery_level:    number;
  pump_power:       number;
  pump_status:      'OFF' | 'LOW' | 'HIGH';
  rain_probability: number;
  expected_rainfall: number;
  temperature:      number | null;
}

export interface Prediction {
  id:                 string;
  created_at:         string;
  predicted_30min:    number;
  predicted_60min:    number;
  risk_level:         'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action: string;
}

export interface Alert {
  id:           string;
  created_at:   string;
  type:         string;
  severity:     'INFO' | 'WARNING' | 'CRITICAL';
  message:      string;
  acknowledged: boolean;
}

export interface PumpCommand {
  id:            string;
  created_at:    string;
  command:       'OFF' | 'LOW' | 'HIGH';
  source:        'AI' | 'MANUAL';
  operator_note: string | null;
}
