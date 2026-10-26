import React, { useState, useEffect } from 'react';
import { useAirspace } from '../../context/useAirspace';
import { useAuth } from '../../context/AuthContext';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Wifi, WifiOff, LogOut, UserCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { kpis, toggleSimulation, setSimulationSpeed, toggleAudio, resetToDefault } = useAirspace();
  const { user, profile, signOut } = useAuth();
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
    <div className="flex flex-col flex-shrink-0">
      {/* Top Animated Marquee Ticker Tape from svg-scroll-draw */}
      <div className="bg-creator-pink border-b border-pitch-black py-1.5 overflow-hidden select-none">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            AEGIS AIR SURVEILLANCE ACTIVE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            OPEN-METEO ATMOSPHERIC INTELLIGENCE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            SUPABASE RLS DEFENSE ACTIVE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            DETERMINISTIC SIMULATION ENGINE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            LIVE AIRSPACE RADAR 10.0 KM <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            AEGIS AIR SURVEILLANCE ACTIVE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
          <span className="flex items-center text-xs font-display font-bold uppercase tracking-[0.14em] text-pitch-black">
            OPEN-METEO ATMOSPHERIC INTELLIGENCE <span className="mx-4 text-pitch-black/30">◆</span>
          </span>
        </div>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3 px-3.5 sm:px-6 md:px-8 py-3 bg-light-linen border-b border-pitch-black shadow-[0_2px_0px_#0D0D0D]">
        {/* Left: Brand with Syne typography and Marker Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-[-0.04em] text-pitch-black leading-none flex items-center gap-1.5">
                AEGIS <span className="marker-pink text-sm sm:text-base tracking-normal">AIR</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                SIMULATION
              </span>
              {!isOnline && (
                <span className="sm:hidden px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-pitch-black flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5 text-amber-700" /> Offline
                </span>
              )}
            </div>
            <p className="text-2xs sm:text-xs text-graphite-border hidden sm:block font-medium mt-0.5 truncate">
              Tactical Counter-Drone Intelligence & Airspace Surveillance System
            </p>
          </div>
        </div>

        {/* Center: Clock + Connectivity Status */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-xs tracking-wider bg-white border border-pitch-black px-3 py-1 rounded-full shadow-[1px_1px_0px_#0D0D0D]">
            <span className="w-2 h-2 rounded-full bg-lime-glow animate-pulse"></span>
            <span className="font-bold text-pitch-black">{time} IST</span>
          </div>
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-pitch-black bg-white border border-pitch-black px-3 py-1 rounded-full shadow-[1px_1px_0px_#0D0D0D]">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sensors Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-pitch-black bg-sunshine-yellow border border-pitch-black px-3 py-1 rounded-full shadow-[1px_1px_0px_#0D0D0D]">
              <WifiOff className="w-3.5 h-3.5 text-pitch-black" />
              <span>Offline (Cache Active)</span>
            </div>
          )}
        </div>

        {/* Right: Tactile Pop Sim Controls & User Session */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleSimulation}
            className={`btn-pop flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              kpis.simulationRunning
                ? 'bg-pitch-black text-white hover:bg-stone-800'
                : 'bg-sunshine-yellow text-pitch-black hover:bg-yellow-400'
            }`}
            title={kpis.simulationRunning ? 'Pause simulation updates' : 'Resume simulation updates'}
          >
            {kpis.simulationRunning ? <Pause className="w-3.5 h-3.5 text-creator-pink" /> : <Play className="w-3.5 h-3.5 text-pitch-black" />}
            <span>{kpis.simulationRunning ? 'Running' : 'Paused'}</span>
          </button>

          {/* Speed selector */}
          <div className="flex items-center rounded-full border border-pitch-black bg-white p-0.5 shadow-[1px_1px_0px_#0D0D0D]">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSimulationSpeed(s)}
                className={`px-2.5 py-0.5 rounded-full text-2xs font-bold transition-all ${
                  kpis.simulationSpeed === s
                    ? 'bg-pitch-black text-white shadow-xs'
                    : 'text-stone-600 hover:text-pitch-black'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <button
            onClick={toggleAudio}
            className={`btn-pop p-1.5 sm:p-2 rounded-full bg-white text-pitch-black hover:bg-creator-pink transition-colors ${
              kpis.audioAlertsEnabled ? 'text-pitch-black' : 'text-stone-400'
            }`}
            title={kpis.audioAlertsEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
          >
            {kpis.audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5 text-pitch-black" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          <button
            onClick={resetToDefault}
            className="btn-pop p-1.5 sm:p-2 rounded-full bg-white text-pitch-black hover:bg-sunshine-yellow transition-colors"
            title="Reset simulation to initial baseline state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-pitch-black" />
          </button>

          {/* User Profile & Sign Out Button */}
          {user && (
            <div className="flex items-center gap-2 border-l border-pitch-black/20 pl-2 ml-1">
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-0 border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] text-2xs font-mono"
                title={`Signed in as ${user.email}`}
              >
                <UserCheck className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                <span className="font-bold text-pitch-black">{profile?.callsign || user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-pop flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-white hover:bg-creator-pink text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all"
                title="Sign out of tactical operator session"
              >
                <LogOut className="w-3.5 h-3.5 text-pitch-black" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};
