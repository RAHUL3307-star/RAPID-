/**
 * ================================================================
 *  RAPID — ESP32 Mine Dewatering Monitor  (Wokwi Compatible)
 *  With WiFi HTTP POST → RAPID Bridge Server
 * ================================================================
 *  Hardware (from Wokwi diagram):
 *    - HC-SR04 Ultrasonic Sensor  (TRIG=5, ECHO=18) → water level
 *    - Rain sensor digital        (PIN 34)           → rain detect
 *    - Battery ADC                (PIN 35)           → battery %
 *    - Pump LED indicator         (PIN 23, RED)
 *    - Status LED                 (PIN 21, GREEN)
 *    - Buzzer                     (PIN 19)
 *    - OLED SSD1306 128x64        (I2C: SDA=21, SCL=22)
 *
 *  Network:
 *    WiFi SSID: Wokwi-GUEST (built-in Wokwi WiFi)
 *    Server:    http://<YOUR_PC_IP>:8080/data
 * ================================================================
 *  Paste this into your Wokwi sketch.ino tab.
 *  Change SERVER_IP to your PC's local IP (e.g., 192.168.1.100)
 * ================================================================
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ── Display ──────────────────────────────────────────────────────────
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ── Sensor Pins ──────────────────────────────────────────────────────
#define TRIG_PIN    5
#define ECHO_PIN    18
#define PUMP_PIN    23   // RED LED
#define GREEN_LED   21
#define BUZZER_PIN  19
#define RAIN_PIN    34   // Digital rain sensor
#define BATTERY_PIN 35   // ADC for battery voltage divider

// ── Mine config ──────────────────────────────────────────────────────
#define TANK_DEPTH   100.0f   // cm from sensor to tank bottom
#define LOW_BATTERY  20

// ── WiFi / Server ─────────────────────────────────────────────────────
// Wokwi-GUEST is the built-in WiFi in Wokwi simulator
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// ⚠️ CHANGE THIS to your PC's local IP address (run "ipconfig" in CMD)
const char* SERVER_IP     = "192.168.1.100";
const int   SERVER_PORT   = 8080;

// ── State ─────────────────────────────────────────────────────────────
float   trendStartLevel  = 0;
unsigned long trendStartTime = 0;
bool    trendInitialized = false;
int     loopCount        = 0;
bool    wifiConnected    = false;
String  pumpStatus       = "OFF";

// ── WiFi Connection ─────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Failed to connect — running offline");
  }
}

// ── Read ultrasonic distance ─────────────────────────────────────────
float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  return (duration == 0) ? TANK_DEPTH : (duration * 0.034f / 2.0f);
}

// ── Read battery % from ADC ──────────────────────────────────────────
float readBatteryPct() {
  int raw = analogRead(BATTERY_PIN);
  return constrain((raw / 4095.0f) * 100.0f, 0, 100);
}

// ── Post JSON to RAPID bridge server ────────────────────────────────
void postToServer(float waterLevel, float distCm, bool rain,
                  int rainRaw, float battery, String pump) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + "/data";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(2000);  // 2-second timeout

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["water_level"]    = round(waterLevel * 10) / 10.0;
  doc["distance_cm"]    = round(distCm * 10) / 10.0;
  doc["tank_depth"]     = TANK_DEPTH;
  doc["rain"]           = rain ? 1 : 0;
  doc["rain_raw"]       = rainRaw;
  doc["battery"]        = round(battery * 10) / 10.0;
  doc["pump"]           = pump;
  doc["loop_count"]     = loopCount;
  doc["uptime_ms"]      = millis();
  doc["source"]         = "wokwi-esp32";

  // Estimated solar & rain probability
  float rainProb = rain ? 85.0f : constrain((1.0f - rainRaw / 4095.0f) * 100.0f, 5, 95);
  doc["rain_probability"]  = round(rainProb);
  doc["expected_rainfall"] = rain ? 28.5f : 2.5f;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("[HTTP] POST %s → %d\n", url.c_str(), code);
  } else {
    Serial.printf("[HTTP] POST failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

// ── OLED Display ─────────────────────────────────────────────────────
void updateDisplay(float waterLevel, float battery, bool rain, String pump) {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Title row
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("RAPID Monitor");
  display.setCursor(90, 0);
  display.print(wifiConnected ? "WiFi OK" : "No WiFi");

  // Water level — large
  display.setTextSize(2);
  display.setCursor(0, 14);
  display.print("WL:");
  display.print((int)waterLevel);
  display.print("%");

  // Divider
  display.drawLine(0, 34, 128, 34, SSD1306_WHITE);

  // Status row
  display.setTextSize(1);
  display.setCursor(0, 37);
  display.print("Bat:");
  display.print((int)battery);
  display.print("%");

  display.setCursor(55, 37);
  display.print(rain ? "RAIN" : "DRY ");

  display.setCursor(90, 37);
  display.print("PMP:");
  display.print(pump.substring(0, 3));

  // Risk indicator
  display.setCursor(0, 50);
  if (waterLevel >= 80) {
    display.print("!! CRITICAL — EVACUATE !!");
  } else if (waterLevel >= 60) {
    display.print("HIGH RISK: Pump active");
  } else if (waterLevel >= 40) {
    display.print("MEDIUM: Monitoring...");
  } else {
    display.print("LOW: All systems OK");
  }

  display.display();
}

// ── Determine pump mode from AI logic ───────────────────────────────
String decidePump(float waterLevel, bool rain, float battery) {
  if (waterLevel >= 80 || (rain && waterLevel >= 50)) return "HIGH";
  if (waterLevel >= 50 || rain)                        return "LOW";
  if (battery < LOW_BATTERY)                           return "OFF";
  return waterLevel >= 30 ? "LOW" : "OFF";
}

// ── Buzzer alert ─────────────────────────────────────────────────────
void alertBuzzer(float waterLevel) {
  if (waterLevel >= 85) {
    tone(BUZZER_PIN, 1000, 200);
    delay(100);
    tone(BUZZER_PIN, 1200, 200);
  } else if (waterLevel >= 70) {
    tone(BUZZER_PIN, 800, 100);
  }
}

// ── Setup ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN,   OUTPUT);
  pinMode(ECHO_PIN,   INPUT);
  pinMode(PUMP_PIN,   OUTPUT);
  pinMode(GREEN_LED,  OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // OLED init
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("[OLED] Init failed!");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.print("RAPID Booting...");
    display.display();
  }

  // WiFi connect
  connectWiFi();

  // Boot LED sequence
  digitalWrite(GREEN_LED, HIGH);
  delay(300);
  digitalWrite(GREEN_LED, LOW);

  Serial.println("[RAPID] System ready.");
}

// ── Main Loop ────────────────────────────────────────────────────────
void loop() {
  loopCount++;

  // 1. Read sensors
  float distCm     = readDistanceCm();
  float waterLevel = constrain((1.0f - distCm / TANK_DEPTH) * 100.0f, 0, 100);
  float battery    = readBatteryPct();
  int   rainRaw    = analogRead(RAIN_PIN);
  bool  rain       = (rainRaw < 2000);  // Low ADC = rain present

  // 2. AI pump decision
  pumpStatus = decidePump(waterLevel, rain, battery);

  // 3. Drive outputs
  digitalWrite(PUMP_PIN,  pumpStatus != "OFF" ? HIGH : LOW);
  digitalWrite(GREEN_LED, waterLevel < 40     ? HIGH : LOW);
  alertBuzzer(waterLevel);

  // 4. OLED update
  updateDisplay(waterLevel, battery, rain, pumpStatus);

  // 5. Serial JSON (for debug + Wokwi monitor)
  Serial.printf(
    "{\"water_level\":%.1f,\"distance_cm\":%.1f,\"battery\":%.1f,"
    "\"rain\":%d,\"rain_raw\":%d,\"pump\":\"%s\",\"loop\":%d}\n",
    waterLevel, distCm, battery, rain ? 1 : 0, rainRaw, pumpStatus.c_str(), loopCount
  );

  // 6. POST to bridge server (every loop = every 2s)
  postToServer(waterLevel, distCm, rain, rainRaw, battery, pumpStatus);

  delay(2000);  // 2-second sensor interval
}
