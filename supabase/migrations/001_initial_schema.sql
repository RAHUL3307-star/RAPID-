-- EDMS Smart Mine Dewatering System — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: sensor_readings
-- Stores real-time telemetry from ESP32
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  water_level   FLOAT4 NOT NULL CHECK (water_level BETWEEN 0 AND 100),
  flow_rate     FLOAT4 NOT NULL DEFAULT 0,
  solar_power   FLOAT4 NOT NULL DEFAULT 0,
  battery_level FLOAT4 NOT NULL CHECK (battery_level BETWEEN 0 AND 100),
  pump_power    FLOAT4 NOT NULL DEFAULT 0,
  pump_status   TEXT NOT NULL DEFAULT 'OFF' CHECK (pump_status IN ('OFF', 'LOW', 'HIGH')),
  rain_probability FLOAT4 NOT NULL DEFAULT 0 CHECK (rain_probability BETWEEN 0 AND 100),
  expected_rainfall FLOAT4 NOT NULL DEFAULT 0,
  temperature   FLOAT4 DEFAULT NULL
);

-- ============================================================
-- Table: predictions
-- Stores AI-generated water level forecasts
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  predicted_30min   FLOAT4 NOT NULL,
  predicted_60min   FLOAT4 NOT NULL,
  risk_level        TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  recommended_action TEXT NOT NULL DEFAULT 'Normal operation'
);

-- ============================================================
-- Table: alerts
-- Stores system alerts and notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type         TEXT NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  message      TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- Table: pump_commands
-- Audit log for all pump control decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS pump_commands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  command       TEXT NOT NULL CHECK (command IN ('OFF', 'LOW', 'HIGH')),
  source        TEXT NOT NULL DEFAULT 'AI' CHECK (source IN ('AI', 'MANUAL')),
  operator_note TEXT DEFAULT NULL
);

-- ============================================================
-- Enable Realtime for sensor_readings and alerts
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;

-- ============================================================
-- Seed: Insert sample data for demo
-- ============================================================
INSERT INTO sensor_readings (water_level, flow_rate, solar_power, battery_level, pump_power, pump_status, rain_probability, expected_rainfall, temperature)
VALUES
  (40.0, 12.0, 850.0, 92.0, 0.0,   'OFF',  20.0, 2.0,  28.5),
  (41.2, 14.0, 840.0, 91.5, 150.0, 'LOW',  22.0, 2.5,  28.6),
  (42.5, 16.0, 820.0, 91.0, 300.0, 'LOW',  25.0, 3.0,  28.7),
  (44.0, 18.0, 800.0, 90.5, 310.0, 'LOW',  30.0, 5.0,  28.8),
  (46.5, 20.0, 780.0, 90.0, 320.0, 'LOW',  45.0, 8.0,  29.0),
  (50.0, 25.0, 750.0, 89.0, 330.0, 'LOW',  65.0, 15.0, 29.2),
  (55.0, 30.0, 720.0, 88.0, 610.0, 'HIGH', 80.0, 25.0, 29.5),
  (60.0, 34.0, 700.0, 87.0, 620.0, 'HIGH', 85.0, 30.0, 29.7),
  (58.0, 34.0, 710.0, 86.5, 620.0, 'HIGH', 82.0, 28.0, 29.5),
  (55.0, 34.0, 720.0, 86.0, 610.0, 'HIGH', 78.0, 25.0, 29.3);

INSERT INTO alerts (type, severity, message, acknowledged) VALUES
  ('RAIN_ALERT', 'WARNING', 'Heavy rainfall (85%) expected within 30 minutes. Pre-emptive pumping initiated.', false),
  ('WATER_RISING', 'CRITICAL', 'Water level rising rapidly at 2.5%/min. Pump switched to HIGH SPEED.', false),
  ('BATTERY_LOW', 'INFO', 'Battery at 86%. Solar charging active. Estimated full charge in 2 hours.', true);

INSERT INTO predictions (predicted_30min, predicted_60min, risk_level, recommended_action) VALUES
  (72.0, 89.0, 'CRITICAL', 'Activate HIGH SPEED pump immediately. Monitor every 5 minutes.');

INSERT INTO pump_commands (command, source, operator_note) VALUES
  ('HIGH', 'AI', 'Auto-triggered: Heavy rain predicted + water level rising at 2.5%/min');
