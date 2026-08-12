/**
 * RAPID Weather Service — WeatherAPI.com Integration
 * Fetches real-time weather, forecast, rain probability, and expected precipitation.
 */

export interface WeatherData {
  temperature:       number; // °C
  conditionText:     string; // e.g. "Heavy rain", "Sunny"
  conditionIcon:     string; // icon URL or emoji
  rainProbability:   number; // % (0-100)
  expectedRainfall:  number; // mm
  locationName:      string; // City / Mine location
  lastUpdated:       string;
}

export async function fetchWeatherData(
  apiKey?: string,
  location: string = 'Kolkata'
): Promise<WeatherData | null> {
  const key = apiKey || import.meta.env.VITE_WEATHER_API_KEY;

  if (!key) {
    console.warn('[RAPID WeatherService] No WeatherAPI key provided. Using default fallback/simulated weather.');
    return null;
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${encodeURIComponent(key)}&q=${encodeURIComponent(location)}&days=1&aqi=no&alerts=yes`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[RAPID WeatherService] API Error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const current = data.current;
    const forecastDay = data.forecast?.forecastday?.[0]?.day;

    const rainProbability = forecastDay?.daily_chance_of_rain ?? (current.precip_mm > 0 ? 80 : 20);
    const expectedRainfall = forecastDay?.totalprecip_mm ?? current.precip_mm ?? 0;

    return {
      temperature:      current.temp_c,
      conditionText:    current.condition.text,
      conditionIcon:    current.condition.icon,
      rainProbability:  Number(rainProbability),
      expectedRainfall: Number(expectedRainfall),
      locationName:     `${data.location.name}, ${data.location.country}`,
      lastUpdated:      current.last_updated,
    };
  } catch (error) {
    console.error('[RAPID WeatherService] Fetch failed:', error);
    return null;
  }
}
