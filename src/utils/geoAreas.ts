import type { GeographicArea } from '../types/provenance';

export const SAFE_DEMO_AREAS: GeographicArea[] = [
  {
    id: 'CORRIDOR-SOUTH',
    name: 'Bengaluru Aero Innovation Corridor',
    category: 'TECH_PARK',
    lat: 12.9716,
    lng: 77.5946,
    description: 'Civilian aerospace testing corridor & sensor validation field (South Sector)',
    radiusKm: 10
  },
  {
    id: 'AERO-RANGE-NORTH',
    name: 'Northern Civilian Drone Proving Ground',
    category: 'CIVILIAN_AERO',
    lat: 28.6139,
    lng: 77.2090,
    description: 'Open civilian test airspace for UAV kinetic and telemetry benchmarks (North Sector)',
    radiusKm: 10
  },
  {
    id: 'MARITIME-WEST',
    name: 'Western Coastal Demonstration Grid',
    category: 'MARITIME_CORRIDOR',
    lat: 18.9220,
    lng: 72.8347,
    description: 'Coastal maritime tracking proving area for marine RF propagation tests',
    radiusKm: 10
  },
  {
    id: 'DECCAN-CENTRAL',
    name: 'Hyderabad Drone Innovation Sandbox',
    category: 'TECH_PARK',
    lat: 17.3850,
    lng: 78.4867,
    description: 'Central Deccan civilian sensor proving field and RF benchmarking testbed',
    radiusKm: 10
  },
  {
    id: 'EASTERN-CORRIDOR',
    name: 'Eastern Civilian UAS Proving Hub',
    category: 'CIVILIAN_AERO',
    lat: 22.5726,
    lng: 88.3639,
    description: 'Eastern sector civilian aerial navigation and transponder test zone',
    radiusKm: 10
  }
];

export const DEFAULT_GEO_AREA: GeographicArea = SAFE_DEMO_AREAS[0];

/**
 * Searches predefined demonstration areas or safely parses custom "lat, lng" coordinates.
 */
export function searchLocationArea(query: string): GeographicArea | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // 1. Check for coordinate pattern "lat, lng"
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

  // 2. Search predefined safe areas by name or ID
  const lower = trimmed.toLowerCase();
  const found = SAFE_DEMO_AREAS.find(a => 
    a.name.toLowerCase().includes(lower) || 
    a.id.toLowerCase().includes(lower) ||
    a.description.toLowerCase().includes(lower)
  );

  return found || null;
}

