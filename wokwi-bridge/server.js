/**
 * RAPID — Wokwi Hardware Bridge Server
 * ======================================
 * Receives ESP32 sensor data via HTTP POST from Wokwi simulation
 * and rebroadcasts it to all connected React app clients via WebSocket.
 *
 * Run: node server.js
 * Then open Settings in the RAPID app and enable "Hardware Mode"
 */

const express = require('express');
const cors    = require('cors');
const http    = require('http');
const { WebSocketServer } = require('ws');

const PORT = 8080;

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// ── State ──────────────────────────────────────────────────────────────────
let latestReading = null;
let readingCount  = 0;
let connectedClients = 0;
const startTime   = Date.now();

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converts raw ESP32 values into the SensorReading format
 * that RAPID's React app expects.
 *
 * ESP32 sends:
 *   distance_cm  — HC-SR04 ultrasonic distance (water surface to sensor)
 *   tank_depth   — total tank depth in cm
 *   rain         — 0 (dry) or 1 (rain detected)
 *   rain_raw     — ADC raw 0-4095 (optional, more accurate)
 *   battery_raw  — ADC raw 0-4095 from battery divider
 *   pump         — "OFF" | "LOW" | "HIGH"
 *   solar_raw    — ADC raw 0-4095 from solar panel (optional)
 */
function normaliseReading(raw) {
  const now = new Date().toISOString();

  // Water level: distance from sensor to water. The closer the water, the higher the level.
  // water_level% = (1 - distance/tank_depth) * 100
  const tankDepth = raw.tank_depth ?? 100.0;
  const distCm    = typeof raw.distance_cm === 'number'
    ? Math.max(0, raw.distance_cm)
    : null;

  let waterLevel = typeof raw.water_level === 'number'
    ? raw.water_level  // ESP32 already computed %
    : distCm !== null
      ? Math.min(100, Math.max(0, (1 - distCm / tankDepth) * 100))
      : 40;

  waterLevel = parseFloat(waterLevel.toFixed(1));

  // Battery: raw ADC (0-4095) on 3.3V rail via voltage divider → 0-100%
  // Using 4095 = 100%, 0 = 0%
  let battery = typeof raw.battery === 'number'
    ? raw.battery  // already %
    : typeof raw.battery_raw === 'number'
      ? parseFloat(((raw.battery_raw / 4095) * 100).toFixed(1))
      : 85;

  // Solar power: raw ADC → approximate watts (max ~1200W at full sun)
  let solar = typeof raw.solar_power === 'number'
    ? raw.solar_power
    : typeof raw.solar_raw === 'number'
      ? parseFloat(((raw.solar_raw / 4095) * 1200).toFixed(0))
      : 700;

  // Rain probability from rain sensor
  // If raw rain = boolean 0/1, map to probability range
  let rainProb = typeof raw.rain_probability === 'number'
    ? raw.rain_probability
    : typeof raw.rain_raw === 'number'
      ? parseFloat(((1 - raw.rain_raw / 4095) * 100).toFixed(0))  // lower ADC = more rain
      : raw.rain === 1 ? 85 : 15;

  rainProb = Math.min(100, Math.max(0, parseFloat(rainProb.toFixed(0))));

  // Pump status
  const pumpStatus = ['OFF', 'LOW', 'HIGH'].includes(raw.pump)
    ? raw.pump
    : waterLevel > 65 || rainProb > 70 ? 'HIGH'
    : waterLevel > 40 || rainProb > 40 ? 'LOW'
    : 'OFF';

  // Pump power watts estimate
  const pumpPower = pumpStatus === 'HIGH' ? 610
    : pumpStatus === 'LOW'  ? 300
    : 0;

  // Flow rate L/min
  const flowRate = typeof raw.flow_rate === 'number'
    ? raw.flow_rate
    : pumpStatus === 'HIGH' ? 34
    : pumpStatus === 'LOW'  ? 18
    : 0;

  // Expected rainfall mm
  const expectedRainfall = typeof raw.expected_rainfall === 'number'
    ? raw.expected_rainfall
    : rainProb > 70 ? 28
    : rainProb > 40 ? 12
    : 2;

  return {
    id:                crypto.randomUUID ? crypto.randomUUID() : `hw-${Date.now()}`,
    created_at:        raw.timestamp ?? now,
    water_level:       waterLevel,
    flow_rate:         parseFloat(flowRate.toFixed(1)),
    solar_power:       parseFloat(solar.toFixed(0)),
    battery_level:     parseFloat(battery.toFixed(1)),
    pump_power:        pumpPower,
    pump_status:       pumpStatus,
    rain_probability:  rainProb,
    expected_rainfall: parseFloat(expectedRainfall.toFixed(1)),
    temperature:       typeof raw.temperature === 'number' ? raw.temperature : null,
    // Extra hardware metadata (optional, ignored by app if unknown)
    _source: 'hardware',
    _distance_cm: distCm,
  };
}

// ── WebSocket broadcast ──────────────────────────────────────────────────────

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(ws => {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(msg);
    }
  });
}

// ── WebSocket server ─────────────────────────────────────────────────────────

wss.on('connection', (ws, req) => {
  connectedClients++;
  console.log(`[WS] Client connected (${connectedClients} total) from ${req.socket.remoteAddress}`);

  // Send latest reading immediately on connect
  if (latestReading) {
    ws.send(JSON.stringify({ type: 'reading', data: latestReading }));
  }

  // Send a welcome/handshake
  ws.send(JSON.stringify({
    type: 'handshake',
    server: 'RAPID Wokwi Bridge v1.0',
    status: 'connected',
    readingCount,
    hasData: latestReading !== null,
  }));

  ws.on('close', () => {
    connectedClients--;
    console.log(`[WS] Client disconnected (${connectedClients} remaining)`);
  });

  ws.on('error', err => console.error('[WS] Error:', err.message));

  // React app can send pump commands back to ESP32 (future: relay to ESP32)
  ws.on('message', (msg) => {
    try {
      const cmd = JSON.parse(msg.toString());
      if (cmd.type === 'pump_command') {
        console.log(`[CMD] Pump command received: ${cmd.command}`);
        // TODO: forward to ESP32 via HTTP if needed
        broadcast({ type: 'pump_ack', command: cmd.command, ts: Date.now() });
      }
    } catch {}
  });
});

// ── HTTP API ─────────────────────────────────────────────────────────────────

/**
 * POST /data — ESP32 sends sensor readings here every ~2 seconds
 * Body: JSON object with sensor fields
 */
app.post('/data', (req, res) => {
  const raw = req.body;

  if (!raw || typeof raw !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  try {
    const reading = normaliseReading(raw);
    latestReading = reading;
    readingCount++;

    // Broadcast to all React clients
    broadcast({ type: 'reading', data: reading });

    console.log(
      `[DATA #${readingCount}] WL:${reading.water_level}% Rain:${reading.rain_probability}% ` +
      `Battery:${reading.battery_level}% Pump:${reading.pump_status} ` +
      `(${connectedClients} clients)`
    );

    res.json({ ok: true, readingCount, clients: connectedClients });
  } catch (err) {
    console.error('[DATA] Parse error:', err);
    res.status(500).json({ error: 'Parse error', detail: err.message });
  }
});

/**
 * GET /status — Health check & debug dashboard
 */
app.get('/status', (req, res) => {
  const uptime = Math.round((Date.now() - startTime) / 1000);
  res.json({
    server:          'RAPID Wokwi Bridge v1.0',
    status:          'running',
    uptime_seconds:  uptime,
    ws_clients:      connectedClients,
    readings_received: readingCount,
    latest_reading:  latestReading,
  });
});

/**
 * GET /health — Simple health check for the React app
 */
app.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * GET / — Status page (HTML)
 */
app.get('/', (_req, res) => {
  const uptime = Math.round((Date.now() - startTime) / 1000);
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>RAPID Wokwi Bridge</title>
  <meta http-equiv="refresh" content="3">
  <style>
    body { font-family: 'Outfit', system-ui, sans-serif; background:#f8fafc; color:#0f172a; padding:32px; }
    h1   { color:#06b6d4; font-size:28px; margin:0 0 8px; }
    .badge { display:inline-block; padding:4px 12px; border-radius:100px; font-size:13px; font-weight:700; }
    .green { background:rgba(13,148,136,.1); color:#0d9488; border:1px solid rgba(13,148,136,.3); }
    .card  { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:16px 0; }
    pre    { background:#f1f5f9; padding:12px; border-radius:8px; font-size:12px; overflow:auto; }
    .stat  { display:inline-block; margin-right:24px; font-size:14px; color:#475569; }
    .val   { font-weight:700; color:#0f172a; font-size:18px; font-family:monospace; }
  </style>
</head>
<body>
  <h1>⚡ RAPID Wokwi Bridge</h1>
  <span class="badge green">● RUNNING</span>
  <div class="card">
    <div class="stat">Uptime <div class="val">${uptime}s</div></div>
    <div class="stat">WebSocket Clients <div class="val">${connectedClients}</div></div>
    <div class="stat">Readings Received <div class="val">${readingCount}</div></div>
  </div>
  ${latestReading ? `
  <div class="card">
    <strong>Latest Reading</strong>
    <pre>${JSON.stringify(latestReading, null, 2)}</pre>
  </div>` : '<div class="card">⏳ Waiting for first reading from ESP32...</div>'}
  <div class="card">
    <strong>ESP32 should POST to:</strong><br>
    <code>http://YOUR_PC_IP:8080/data</code><br><br>
    <strong>React app connects to:</strong><br>
    <code>ws://localhost:8080</code>
  </div>
</body>
</html>
  `);
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ⚡ RAPID Wokwi Hardware Bridge v1.0      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n✅ HTTP  → http://localhost:${PORT}`);
  console.log(`✅ WS    → ws://localhost:${PORT}`);
  console.log(`\n📡 ESP32 should POST sensor data to:`);
  console.log(`   http://YOUR_PC_LOCAL_IP:${PORT}/data\n`);
  console.log('📊 Status dashboard: http://localhost:8080/');
  console.log('🔍 JSON status:      http://localhost:8080/status');
  console.log('\nWaiting for connections...\n');
});
