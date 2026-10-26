import type { WeatherData } from '../types/provenance';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache to avoid excessive requests

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherData> {
  const cacheKey = `vayunet_weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const now = Date.now();
  const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });

  // 1. Check local cache
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.timestamp && now - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
        return {
          ...parsed.data,
          provenance: 'CACHED',
          isStale: false,
          lastRefresh: `${parsed.data.lastRefresh} (Cached)`
        };
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // 2. Query Open-Meteo API
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const resp = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`Open-Meteo API returned HTTP ${resp.status}`);
    }

    const data: OpenMeteoResponse = await resp.json();

    if (!data.current) {
      throw new Error('Incomplete weather payload returned');
    }

    const result: WeatherData = {
      temperatureC: Number(data.current.temperature_2m.toFixed(1)),
      windSpeedKmh: Number(data.current.wind_speed_10m.toFixed(1)),
      windDirectionDeg: Math.round(data.current.wind_direction_10m),
      precipitationMm: Number(data.current.precipitation.toFixed(1)),
      relativeHumidityPercent: Math.round(data.current.relative_humidity_2m),
      observationTime: data.current.time,
      lastRefresh: nowStr,
      provenance: 'LIVE_API',
      sourceNote: 'Open-Meteo Public Atmospheric API (Real-time Observation)'
    };

    // Cache successful response
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: now,
        data: result
      }));
    } catch {
      // Ignore cache storage errors
    }

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';

    // 3. Fallback to stale cached data if available
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data) {
          return {
            ...parsed.data,
            provenance: 'CACHED',
            isStale: true,
            error: `Live fetch failed (${errorMsg}). Retaining last cached observation.`
          };
        }
      }
    } catch {
      // Fallback
    }

    // 4. Fallback when completely unavailable
    return {
      temperatureC: 24.0,
      windSpeedKmh: 12.0,
      windDirectionDeg: 180,
      precipitationMm: 0.0,
      relativeHumidityPercent: 55,
      observationTime: new Date().toISOString(),
      lastRefresh: nowStr,
      provenance: 'UNAVAILABLE',
      sourceNote: 'Atmospheric API unreachable. Weather service in standby.',
      error: `Open-Meteo unreachable (${errorMsg}). Environmental sensors offline.`
    };
  }
}
