export type DataSourceProvenance = 'LIVE_API' | 'SIMULATED' | 'CACHED' | 'UNAVAILABLE' | 'LOCAL';

export interface ProvenanceMeta {
  source: DataSourceProvenance;
  lastUpdated: string;
  lastUpdatedMs: number;
  originName: string;
  notes?: string;
}

export interface WeatherData {
  temperatureC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationMm: number;
  relativeHumidityPercent: number;
  observationTime: string;
  lastRefresh: string;
  provenance: DataSourceProvenance;
  sourceNote: string;
  error?: string;
  isStale?: boolean;
}

export interface GeographicArea {
  id: string;
  name: string;
  category: 'CIVILIAN_AERO' | 'MARITIME_CORRIDOR' | 'TECH_PARK' | 'CUSTOM';
  lat: number;
  lng: number;
  description: string;
  radiusKm: number;
}
