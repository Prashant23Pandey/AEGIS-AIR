import type { GeographicArea } from '../types/provenance';
import { SAFE_DEMO_AREAS } from '../utils/geoAreas';

/**
 * Fetches user's live geographic location using free live IP Geolocation API.
 * Provides fallback when browser GPS is blocked, unavailable, or on desktop OS.
 */
export async function fetchLiveIpLocation(): Promise<GeographicArea> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const resp = await fetch('https://freeipapi.com/api/json', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`Location API returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      const cityName = data.cityName || data.regionName || 'Live Location';
      const country = data.countryName || '';
      return {
        id: 'LIVE-LOC-API',
        name: `${cityName}${country ? `, ${country}` : ''} (Live Location API)`,
        category: 'CUSTOM',
        lat: Number(data.latitude.toFixed(4)),
        lng: Number(data.longitude.toFixed(4)),
        description: `Live location acquired via Geolocation API (${data.ipAddress || 'IP'}).`,
        radiusKm: 10
      };
    }
    throw new Error('Invalid coordinate format returned by API');
  } catch (err) {
    clearTimeout(timeoutId);
    // Secondary fallback: ipapi.co
    try {
      const secResp = await fetch('https://ipapi.co/json/');
      if (secResp.ok) {
        const secData = await secResp.json();
        if (typeof secData.latitude === 'number' && typeof secData.longitude === 'number') {
          return {
            id: 'LIVE-LOC-API',
            name: `${secData.city || 'Live Location'}, ${secData.country_name || ''} (Live API)`,
            category: 'CUSTOM',
            lat: Number(secData.latitude.toFixed(4)),
            lng: Number(secData.longitude.toFixed(4)),
            description: `Live location acquired via secondary Geolocation API.`,
            radiusKm: 10
          };
        }
      }
    } catch {
      // Ignore secondary error
    }
    throw err instanceof Error ? err : new Error('Unable to query live location API');
  }
}

/**
 * Searches real-world locations via OpenStreetMap Nominatim Live Geocoding API,
 * with instantaneous local fallback to coordinate parsing and safe preset areas.
 */
export async function searchLocationLive(query: string): Promise<GeographicArea | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // 1. Direct coordinate format: "lat, lng"
  const coordRegex = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
  const match = trimmed.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        id: `COORD-${lat.toFixed(2)}-${lng.toFixed(2)}`,
        name: `Custom Coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
        category: 'CUSTOM',
        lat,
        lng,
        description: 'User-specified geographic coordinates for demonstration airspace overlay.',
        radiusKm: 10
      };
    }
  }

  // 2. Check local presets first for instant response
  const lower = trimmed.toLowerCase();
  const localMatch = SAFE_DEMO_AREAS.find(a =>
    a.name.toLowerCase().includes(lower) ||
    a.id.toLowerCase().includes(lower) ||
    a.description.toLowerCase().includes(lower)
  );
  if (localMatch) {
    return localMatch;
  }

  // 3. Query OpenStreetMap Nominatim Live Search API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const encoded = encodeURIComponent(trimmed);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const results = await resp.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const shortName = item.name || item.display_name.split(',')[0] || trimmed;
          return {
            id: `GEO-${item.osm_id || Math.round(lat * 100)}`,
            name: `${shortName} (Nominatim Live Search)`,
            category: 'CUSTOM',
            lat: Number(lat.toFixed(4)),
            lng: Number(lng.toFixed(4)),
            description: item.display_name,
            radiusKm: 10
          };
        }
      }
    }
  } catch {
    // If external geocoding fails, retain null
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}
