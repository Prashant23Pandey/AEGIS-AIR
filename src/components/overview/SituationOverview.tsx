import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import { RadarDisplay } from './RadarDisplay';
import { TargetEngagementPanel } from './TargetEngagementPanel';
import { 
  ShieldCheck, 
  AlertOctagon, 
  Target, 
  Zap, 
  Flame, 
  PlaneTakeoff, 
  Filter, 
  PlusCircle
} from 'lucide-react';
import type { Sector } from '../../types/telemetry';

export const SituationOverview: React.FC = () => {
  const { 
    kpis, 
    tracks, 
    selectedTrackId, 
    selectTrack, 
    sectorFilter, 
    setSectorFilter, 
    injectThreat 
  } = useAirspace();

  const sectors: (Sector | 'ALL')[] = [
    'ALL', 
    'NORTH', 
    'NORTH-EAST', 
    'EAST', 
    'SOUTH-EAST', 
    'SOUTH', 
    'SOUTH-WEST', 
    'WEST', 
    'NORTH-WEST'
  ];

  return (
    <div className="space-y-4">
      {/* Top Threat Posture & Critical Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* DEFCON Level Status */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          kpis.defconLevel === 1 ? 'bg-red-950/60 border-red-500/80 shadow-lg shadow-red-950/50' :
          kpis.defconLevel === 2 ? 'bg-orange-950/50 border-orange-500/60' :
          kpis.defconLevel === 3 ? 'bg-amber-950/40 border-amber-500/40' :
          'bg-slate-900/60 border-slate-800'
        }`}>
          <div>
            <div className="text-[10px] font-mono text-slate-400">DEFCON POSTURE</div>
            <div className={`text-xl font-mono font-black ${
              kpis.defconLevel === 1 ? 'text-red-400 animate-pulse' :
              kpis.defconLevel === 2 ? 'text-orange-400' :
              kpis.defconLevel === 3 ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              LEVEL {kpis.defconLevel}
            </div>
          </div>
          <AlertOctagon className={`w-8 h-8 ${
            kpis.defconLevel === 1 ? 'text-red-500 animate-spin' :
            kpis.defconLevel === 2 ? 'text-orange-500' :
            'text-emerald-500'
          }`} style={{ animationDuration: '6s' }} />
        </div>

        {/* Hostile Threats Active */}
        <div className="p-3 rounded-xl tactical-panel border border-red-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400">HOSTILE THREATS</div>
            <div className="text-xl font-mono font-bold text-red-400">{kpis.hostileThreats} ACTIVE</div>
          </div>
          <Target className="w-8 h-8 text-red-500/80" />
        </div>

        {/* Perimeter Integrity */}
        <div className="p-3 rounded-xl tactical-panel border border-cyan-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400">PERIMETER INTEGRITY</div>
            <div className="text-xl font-mono font-bold text-cyan-300">{kpis.airspaceIntegrityScore}%</div>
          </div>
          <ShieldCheck className="w-8 h-8 text-cyan-400/80" />
        </div>

        {/* Countermeasure Jammer Status */}
        <div className="p-3 rounded-xl tactical-panel border border-amber-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400">JAMMER CAPABILITY</div>
            <div className="text-xl font-mono font-bold text-amber-300">{kpis.jammerReadinessPercent}% READY</div>
          </div>
          <Zap className="w-8 h-8 text-amber-400/80" />
        </div>

        {/* Interceptors Available */}
        <div className="p-3 rounded-xl tactical-panel border border-blue-900/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400">INTERCEPTOR DRONES</div>
            <div className="text-xl font-mono font-bold text-blue-300">{kpis.interceptorDronesAvailable} SILOS</div>
          </div>
          <PlaneTakeoff className="w-8 h-8 text-blue-400/80" />
        </div>
      </div>

      {/* Main Tactical Grid: Radar PPI (Left) + Target Engagement Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <RadarDisplay />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <TargetEngagementPanel />
        </div>
      </div>

      {/* Sector Filter Bar & Quick Contact Selector */}
      <div className="p-3 rounded-xl tactical-panel border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Sector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> SECTOR FILTER:
            </span>
            {sectors.map(sec => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  sectorFilter === sec
                    ? 'bg-cyan-500 text-black font-extrabold shadow-sm shadow-cyan-500/50'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Threat Injection for Live Demo Verification */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" /> INJECT TEST THREAT:
            </span>
            <button
              onClick={() => injectThreat('SWARM')}
              className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 transition-all flex items-center gap-1"
              title="Spawn 3-Drone Coordinated Swarm"
            >
              <Flame className="w-3 h-3 text-red-400" /> +SWARM
            </button>
            <button
              onClick={() => injectThreat('KAMIKAZE')}
              className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-orange-950 hover:bg-orange-900 text-orange-200 border border-orange-700 transition-all"
              title="Spawn High-Speed Kamikaze FPV"
            >
              +KAMIKAZE
            </button>
            <button
              onClick={() => injectThreat('UNKNOWN')}
              className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all"
              title="Spawn Rogue Commercial UAV"
            >
              +UNKNOWN
            </button>
          </div>
        </div>

        {/* Quick Contact Ribbon */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
          {tracks.map(track => {
            const isSelected = track.id === selectedTrackId;
            return (
              <button
                key={track.id}
                onClick={() => selectTrack(track.id)}
                className={`px-3 py-2 rounded-lg border text-left shrink-0 transition-all ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs font-mono font-bold">
                  <span className="text-cyan-300">{track.id}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                    track.iff === 'hostile' ? 'bg-red-950 text-red-400' :
                    track.iff === 'friendly' ? 'bg-emerald-950 text-emerald-400' :
                    'bg-amber-950 text-amber-400'
                  }`}>
                    {track.iff}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-2 mt-1">
                  <span>{track.distanceKm} km</span>
                  <span>{track.speedKmh} km/h</span>
                  <span className="text-amber-400 font-semibold">{track.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
