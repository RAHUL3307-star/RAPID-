/**
 * RAPID AI Decision Engine
 * Determines pump mode, risk level, and recommended actions
 * based on water level, solar, battery, rain forecast, and rate of rise.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PumpMode  = 'OFF' | 'LOW' | 'HIGH';

export interface SensorSnapshot {
  waterLevel:      number; // 0–100 %
  flowRate:        number; // L/min
  solarPower:      number; // Watts
  batteryLevel:    number; // 0–100 %
  pumpPower:       number; // Watts
  rainProbability: number; // 0–100 %
  expectedRainfall: number; // mm
  prevWaterLevel?: number; // previous reading for rate calc
}

export interface AIDecision {
  pumpMode:          PumpMode;
  riskLevel:         RiskLevel;
  recommendedAction: string;
  predicted30min:    number;
  predicted60min:    number;
  rateOfRise:        number; // % per minute
}

/** Simple linear model for water level prediction */
function predictWaterLevel(
  current:         number,
  rateOfRisePct:   number,
  rainProb:        number,
  expectedRainfall: number,
  minutes:         number
): number {
  const rainContribution = (rainProb / 100) * expectedRainfall * 0.5; // simplified
  const naturalRise = rateOfRisePct * minutes;
  return Math.min(100, Math.max(0, current + naturalRise + rainContribution * (minutes / 60)));
}

export function computeDecision(snap: SensorSnapshot): AIDecision {
  const {
    waterLevel, solarPower, batteryLevel,
    rainProbability, expectedRainfall, prevWaterLevel,
  } = snap;

  // Rate of rise (% per minute) — default 0.2 if no prev reading
  const rateOfRise = prevWaterLevel !== undefined
    ? Math.max(0, (waterLevel - prevWaterLevel) / 1) // assume 1-min interval
    : 0.2;

  // Predictions
  const predicted30min = predictWaterLevel(waterLevel, rateOfRise, rainProbability, expectedRainfall, 30);
  const predicted60min = predictWaterLevel(waterLevel, rateOfRise, rainProbability, expectedRainfall, 60);

  // Energy availability score (0–1)
  const energyScore = Math.min(1, (solarPower / 1000) * 0.6 + (batteryLevel / 100) * 0.4);

  // Risk scoring
  let riskLevel: RiskLevel;
  let pumpMode: PumpMode;
  let recommendedAction: string;

  if (waterLevel >= 85 || predicted30min >= 90 || rainProbability >= 80) {
    riskLevel = 'CRITICAL';
    pumpMode = 'HIGH';
    recommendedAction = '⚠️ CRITICAL: Activate HIGH SPEED pump immediately. Heavy rainfall imminent. Monitor every 5 min.';
  } else if (waterLevel >= 65 || predicted60min >= 80 || rainProbability >= 60) {
    riskLevel = 'HIGH';
    pumpMode = 'HIGH';
    recommendedAction = '🟠 HIGH RISK: Run pump at HIGH speed. Predicted water level may reach danger zone within 60 min.';
  } else if (waterLevel >= 45 || rainProbability >= 40 || rateOfRise > 0.5) {
    riskLevel = 'MEDIUM';
    pumpMode = energyScore > 0.3 ? 'LOW' : 'OFF';
    recommendedAction = '🟡 MEDIUM: Water rising. Running pump at LOW speed. Solar power is ' + (solarPower > 500 ? 'adequate' : 'limited') + '.';
  } else {
    riskLevel = 'LOW';
    pumpMode = waterLevel > 30 && energyScore > 0.5 ? 'LOW' : 'OFF';
    recommendedAction = `🟢 LOW RISK: Water level safe at ${waterLevel.toFixed(0)}%. ${pumpMode === 'OFF' ? 'Pump is OFF to conserve battery.' : 'Pump running at LOW speed.'}`;
  }

  // Override: if battery critically low and solar also low, reduce pump
  if (batteryLevel < 15 && solarPower < 100 && pumpMode === 'HIGH') {
    pumpMode = 'LOW';
    recommendedAction += ' ⚡ Warning: Low battery + low solar — pump throttled to LOW to preserve power.';
  }

  return { pumpMode, riskLevel, recommendedAction, predicted30min, predicted60min, rateOfRise };
}

export function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'LOW':      return 'var(--status-safe)';
    case 'MEDIUM':   return 'var(--status-warn)';
    case 'HIGH':     return 'var(--status-high)';
    case 'CRITICAL': return 'var(--status-danger)';
  }
}

export function getRiskEmoji(risk: RiskLevel): string {
  switch (risk) {
    case 'LOW':      return '🟢';
    case 'MEDIUM':   return '🟡';
    case 'HIGH':     return '🟠';
    case 'CRITICAL': return '🔴';
  }
}

export function getWaterLevelColor(level: number): string {
  if (level >= 80) return 'var(--status-danger)';
  if (level >= 60) return 'var(--status-high)';
  if (level >= 40) return 'var(--status-warn)';
  return 'var(--status-safe)';
}

export function getBatteryColor(level: number): string {
  if (level <= 20) return 'var(--status-danger)';
  if (level <= 40) return 'var(--status-warn)';
  return 'var(--status-safe)';
}
