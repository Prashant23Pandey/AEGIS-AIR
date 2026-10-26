import React from 'react';
import type { WeatherData, GeographicArea } from '../../types/provenance';
import { CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  loading: boolean;
  area: GeographicArea;
  onRefresh: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading, area, onRefresh }) => {
  if (!weather && loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-center gap-2 text-stone-500 text-xs py-8">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
        <span className="font-serif italic">Synchronizing Open-Meteo atmospheric telemetry...</span>
      </div>
    );
  }

  if (!weather) return null;

  // Flight safety envelope evaluation
  const isHighWind = weather.windSpeedKmh > 35;
  const isRain = weather.precipitationMm > 0.5;
  const flightEnvelope = isHighWind || isRain
    ? { status: 'ADVERSE', color: 'text-rose-700 bg-rose-50 border-rose-200', note: 'Adverse UAS conditions (wind/rain exceeding micro-drone stability limits)' }
    : { status: 'NOMINAL', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', note: 'Nominal operational corridor conditions for rotor & fixed-wing platforms' };

  const provenanceBadge = () => {
    switch (weather.provenance) {
      case 'LIVE_API':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">LIVE_API</span>;
      case 'CACHED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">CACHED (STALE)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-600 border border-stone-200">UNAVAILABLE</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif italic text-base text-stone-900 font-medium">Environmental & Weather Intelligence</h3>
            {provenanceBadge()}
          </div>
          <p className="text-2xs text-stone-500 mt-0.5 font-mono">
            Location: {area.name} ({area.lat.toFixed(4)}°N, {area.lng.toFixed(4)}°E)
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all shadow-xs disabled:opacity-50"
          title="Refresh Open-Meteo observation"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-2xs mb-0.5">
            <Thermometer className="w-3.5 h-3.5 text-rose-600" />
            <span>Temperature</span>
          </div>
          <div className="text-sm font-mono font-bold text-stone-900">{weather.temperatureC}°C</div>
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-2xs mb-0.5">
            <Wind className="w-3.5 h-3.5 text-indigo-600" />
            <span>Wind (10m)</span>
          </div>
          <div className="text-sm font-mono font-bold text-stone-900">
            {weather.windSpeedKmh} <span className="text-xs font-normal text-stone-500">km/h @ {weather.windDirectionDeg}°</span>
          </div>
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-2xs mb-0.5">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>Rel. Humidity</span>
          </div>
          <div className="text-sm font-mono font-bold text-stone-900">{weather.relativeHumidityPercent}%</div>
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 text-stone-500 text-2xs mb-0.5">
            <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
            <span>Precipitation</span>
          </div>
          <div className="text-sm font-mono font-bold text-stone-900">{weather.precipitationMm} mm</div>
        </div>
      </div>

      {/* Flight Envelope Assessment */}
      <div className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${flightEnvelope.color}`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{flightEnvelope.note}</span>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{flightEnvelope.status}</span>
      </div>

      {/* Error / Offline Notice */}
      {weather.error && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>{weather.error}</span>
        </div>
      )}

      {/* Mandatory Provenance & Academic Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-400 font-sans border-t border-stone-100 pt-2 gap-1">
        <span>Provenance: <strong>{weather.sourceNote}</strong> · Refreshed: {weather.lastRefresh}</span>
        <span className="italic">Notice: Atmospheric data is contextual; does not constitute radar track detection.</span>
      </div>
    </div>
  );
};
