import { useState, useEffect } from 'react';
import { fetchWeatherData } from '../lib/weatherService';
import type { WeatherData } from '../lib/weatherService';

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const apiKey   = import.meta.env.VITE_WEATHER_API_KEY;
      const location = import.meta.env.VITE_WEATHER_LOCATION || 'Chennai, Tamil Nadu, India';

      if (apiKey) {
        const data = await fetchWeatherData(apiKey, location);
        if (isMounted && data) {
          setWeather(data);
        }
      }
      if (isMounted) setLoading(false);
    }

    load();

    // Poll every 10 minutes
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { weather, loading };
}
