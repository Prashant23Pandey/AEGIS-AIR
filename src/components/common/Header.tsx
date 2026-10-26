import React, { useState, useEffect } from 'react';
import { useAirspace } from '../../context/useAirspace';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';

export const Header: React.FC = () => {
  const { kpis, toggleSimulation, setSimulationSpeed, toggleAudio, resetToDefault } = useAirspace();
  const [time, setTime] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-6 md:px-8 py-3 bg-white border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex-shrink-0">
      {/* Left: Editorial Brand & Mobile Connectivity Indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-serif italic text-xl sm:text-2xl tracking-tight text-stone-900 leading-none">
              AEGIS AIR
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              — Simulation —
            </span>
            {!isOnline && (
              <span className="sm:hidden px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5 text-amber-600" /> Offline
              </span>
            )}
          </div>
          <p className="text-2xs sm:text-xs text-stone-500 hidden sm:block italic font-serif mt-0.5 truncate">
            Real-time counter-drone intelligence & airspace surveillance
          </p>
        </div>
      </div>

      {/* Center: Clock + Connectivity (Desktop/Tablet) */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-stone-600">
        <div className="flex items-center gap-2 font-mono tracking-wider bg-stone-100/70 border border-stone-200/60 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
          <span>{time} IST</span>
        </div>
        {isOnline ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg" title="Application online and connected">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sensors Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg" title="Operating offline from local service worker cache">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Offline (Cache Active)</span>
          </div>
        )}
      </div>

      {/* Right: Sim controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={toggleSimulation}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all
                     border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-xs"
          title={kpis.simulationRunning ? 'Pause simulation updates' : 'Resume simulation updates'}
        >
          {kpis.simulationRunning ? <Pause className="w-3.5 h-3.5 text-indigo-600" /> : <Play className="w-3.5 h-3.5 text-indigo-600" />}
          <span>{kpis.simulationRunning ? 'Running' : 'Paused'}</span>
        </button>

        {/* Speed selector */}
        <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100/60 p-0.5">
          {[1, 2, 5].map(s => (
            <button
              key={s}
              onClick={() => setSimulationSpeed(s)}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-2xs font-semibold transition-all ${
                kpis.simulationSpeed === s
                  ? 'bg-accent-cyan text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={toggleAudio}
          className={`p-1.5 sm:p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-xs ${
            kpis.audioAlertsEnabled ? 'text-indigo-600' : 'text-stone-400'
          }`}
          title={kpis.audioAlertsEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
        >
          {kpis.audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={resetToDefault}
          className="p-1.5 sm:p-2 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all shadow-xs"
          title="Reset simulation to initial baseline state"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
