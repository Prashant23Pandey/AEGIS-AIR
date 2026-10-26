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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-lime-glow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">LIVE_API</span>;
      case 'CACHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">CACHED (STALE)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-stone-200 text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">UNAVAILABLE</span>;
    }
  };

  return (
    <div className="pop-card bg-white p-5 rounded-2xl space-y-4 relative overflow-hidden">
      {/* Decorative Dot Grid Overlay */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none rounded-2xl"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-pitch-black/15 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-display font-extrabold text-lg text-pitch-black tracking-[-0.03em]">Environmental & Atmospheric Telemetry</h3>
            {provenanceBadge()}
          </div>
          <p className="text-2xs text-stone-600 mt-0.5 font-mono">
            Ground Station: {area.name} ({area.lat.toFixed(4)}°N, {area.lng.toFixed(4)}°E)
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-pop self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-creator-pink text-pitch-black transition-all disabled:opacity-50"
          title="Refresh Open-Meteo observation"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-pitch-black ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Weather Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-light-linen border border-pitch-black rounded-xl px-3.5 py-2.5 shadow-[1px_1px_0px_#0D0D0D]">
          <div className="flex items-center gap-1.5 text-stone-600 text-2xs mb-0.5 font-mono uppercase font-bold">
            <Thermometer className="w-3.5 h-3.5 text-rose-600" />
            <span>Temperature</span>
          </div>
          <div className="text-xl font-display font-extrabold text-pitch-black">{weather.temperatureC}°C</div>
        </div>

        <div className="bg-light-linen border border-pitch-black rounded-xl px-3.5 py-2.5 shadow-[1px_1px_0px_#0D0D0D]">
          <div className="flex items-center gap-1.5 text-stone-600 text-2xs mb-0.5 font-mono uppercase font-bold">
            <Wind className="w-3.5 h-3.5 text-pitch-black" />
            <span>Wind (10m)</span>
          </div>
          <div className="text-xl font-display font-extrabold text-pitch-black">
            {weather.windSpeedKmh} <span className="text-xs font-mono font-normal text-stone-600">km/h @ {weather.windDirectionDeg}°</span>
          </div>
        </div>

        <div className="bg-light-linen border border-pitch-black rounded-xl px-3.5 py-2.5 shadow-[1px_1px_0px_#0D0D0D]">
          <div className="flex items-center gap-1.5 text-stone-600 text-2xs mb-0.5 font-mono uppercase font-bold">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>Rel. Humidity</span>
          </div>
          <div className="text-xl font-display font-extrabold text-pitch-black">{weather.relativeHumidityPercent}%</div>
        </div>

        <div className="bg-light-linen border border-pitch-black rounded-xl px-3.5 py-2.5 shadow-[1px_1px_0px_#0D0D0D]">
          <div className="flex items-center gap-1.5 text-stone-600 text-2xs mb-0.5 font-mono uppercase font-bold">
            <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
            <span>Precipitation</span>
          </div>
          <div className="text-xl font-display font-extrabold text-pitch-black">{weather.precipitationMm} mm</div>
        </div>
      </div>

      {/* Flight Envelope Assessment */}
      <div className={`relative z-10 px-3.5 py-2.5 rounded-xl border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] text-xs flex items-center justify-between ${
        isHighWind || isRain ? 'bg-orange-100 text-pitch-black' : 'bg-lime-glow/20 text-pitch-black'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-pitch-black" />
          <span className="font-bold">{flightEnvelope.note}</span>
        </div>
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-pitch-black bg-white shadow-[1px_1px_0px_#0D0D0D]">{flightEnvelope.status}</span>
      </div>

      {/* Error / Offline Notice */}
      {weather.error && (
        <div className="relative z-10 px-3 py-2 rounded-xl bg-sunshine-yellow border border-pitch-black text-pitch-black text-xs font-bold flex items-center gap-2 shadow-[1px_1px_0px_#0D0D0D]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-pitch-black" />
          <span>{weather.error}</span>
        </div>
      )}

      {/* Mandatory Provenance & Academic Disclaimer */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-2xs text-stone-500 font-mono border-t border-pitch-black/15 pt-2 gap-1">
        <span>Provenance: <strong className="text-pitch-black">{weather.sourceNote}</strong> · Refreshed: {weather.lastRefresh}</span>
        <span className="italic">Notice: Atmospheric data is contextual; does not constitute radar track detection.</span>
      </div>
    </div>
  );
};
