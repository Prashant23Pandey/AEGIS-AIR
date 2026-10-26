import React, { useState, useEffect, useCallback } from 'react';
import { useAirspace } from '../../context/useAirspace';
import { AirspaceMap } from './AirspaceMap';
import { GeoAirspaceMap } from './GeoAirspaceMap';
import { TrackList } from './TrackList';
import { TrackDetail } from './TrackDetail';
import { SummaryCards } from './SummaryCards';
import { EventTicker } from './EventTicker';
import { WeatherWidget } from './WeatherWidget';
import type { GeographicArea, WeatherData } from '../../types/provenance';
import { DEFAULT_GEO_AREA } from '../../utils/geoAreas';
import { fetchLiveWeather } from '../../services/weatherService';
import { Map as MapIcon, Compass, ShieldCheck } from 'lucide-react';

export const MonitorView: React.FC = () => {
  const { selectedTrackId } = useAirspace();

  // Active projection mode: 'schematic' (Vector Canvas) vs 'geographic' (Leaflet Real Map) with persistence
  const [mapMode, setMapModeState] = useState<'schematic' | 'geographic'>(() => {
    try {
      return (localStorage.getItem('vayunet_map_mode') as 'schematic' | 'geographic') || 'schematic';
    } catch {
      return 'schematic';
    }
  });

  const setMapMode = useCallback((mode: 'schematic' | 'geographic') => {
    setMapModeState(mode);
    try {
      localStorage.setItem('vayunet_map_mode', mode);
    } catch {
      // Ignore
    }
  }, []);

  const [geoArea, setGeoAreaState] = useState<GeographicArea>(() => {
    try {
      const saved = localStorage.getItem('vayunet_geo_area');
      return saved ? JSON.parse(saved) : DEFAULT_GEO_AREA;
    } catch {
      return DEFAULT_GEO_AREA;
    }
  });

  const setGeoArea = useCallback((area: GeographicArea) => {
    setGeoAreaState(area);
    try {
      localStorage.setItem('vayunet_geo_area', JSON.stringify(area));
    } catch {
      // Ignore
    }
  }, []);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);

  // Manual refresh trigger
  const handleManualRefresh = useCallback(() => {
    setWeatherLoading(true);
    fetchLiveWeather(geoArea.lat, geoArea.lng)
      .then(data => setWeather(data))
      .finally(() => setWeatherLoading(false));
  }, [geoArea.lat, geoArea.lng]);

  useEffect(() => {
    let ignore = false;
    fetchLiveWeather(geoArea.lat, geoArea.lng)
      .then(data => {
        if (!ignore) setWeather(data);
      })
      .finally(() => {
        if (!ignore) setWeatherLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [geoArea.lat, geoArea.lng]);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <SummaryCards />

      {/* Atmospheric Intelligence (Real-World Weather via Open-Meteo) */}
      <WeatherWidget
        weather={weather}
        loading={weatherLoading}
        area={geoArea}
        onRefresh={handleManualRefresh}
      />

      {/* Map Mode Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-5 py-3 rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif italic text-base text-stone-900 font-medium leading-none">
              Airspace Tactical Projection
            </h3>
            <p className="text-2xs text-stone-500 mt-0.5 font-mono">
              Mode: {mapMode === 'schematic' ? '±10 km Orthographic Vector Grid' : 'Geographic WGS84 Leaflet Overlay'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100/70 p-0.5">
            <button
              onClick={() => setMapMode('schematic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapMode === 'schematic'
                  ? 'bg-accent-cyan text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Vector Schematic</span>
            </button>
            <button
              onClick={() => setMapMode('geographic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapMode === 'geographic'
                  ? 'bg-accent-cyan text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Geographic Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main grid: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Display (Switches seamlessly between Schematic and Geographic) */}
        <div className="lg:col-span-8 xl:col-span-8">
          {mapMode === 'schematic' ? (
            <AirspaceMap />
          ) : (
            <GeoAirspaceMap
              currentArea={geoArea}
              onAreaChange={(newArea) => setGeoArea(newArea)}
            />
          )}
        </div>

        {/* Right sidebar: Track list + detail */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4 min-h-0">
          <TrackList />
          {selectedTrackId && <TrackDetail />}
        </div>
      </div>

      {/* Event Ticker */}
      <EventTicker />

      {/* Data Provenance & Operational Integrity Footer */}
      <div className="px-5 py-3 rounded-2xl bg-stone-50/70 border border-border flex flex-col sm:flex-row sm:items-center justify-between text-2xs text-stone-500 gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Data Provenance: <strong>Weather [LIVE_API / Open-Meteo]</strong> · <strong>Map Tiles [LIVE_TILES / OSM]</strong> · <strong>Air Contacts [SIMULATED]</strong>
          </span>
        </div>
        <div className="font-mono text-stone-400">
          AEGIS AIR Defense Prototype · No real weapon systems or confidential telemetry integrated
        </div>
      </div>
    </div>
  );
};
