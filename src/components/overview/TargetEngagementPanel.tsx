import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import { 
  Radio, 
  Navigation, 
  Crosshair, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Wifi, 
  Clock, 
  Cpu, 
  AlertTriangle
} from 'lucide-react';
import type { CountermeasureType } from '../../types/telemetry';

export const TargetEngagementPanel: React.FC = () => {
  const { 
    selectedTrack, 
    triggerCountermeasure, 
    updateIFF, 
    kpis 
  } = useAirspace();

  if (!selectedTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 rounded-xl tactical-panel border border-slate-800 text-center">
        <Crosshair className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-mono font-bold text-slate-300">NO TARGET DESIGNATED</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Click any target blip on the radar PPI display or select a contact from the list below to lock telemetry.
        </p>
      </div>
    );
  }

  const isNeutralized = selectedTrack.status === 'NEUTRALIZED' || selectedTrack.status === 'INTERCEPTED';
  const isJammed = selectedTrack.status === 'JAMMED';
  const isSpoofed = selectedTrack.status === 'SPOOFED';

  const handleAction = (cm: CountermeasureType) => {
    triggerCountermeasure(selectedTrack.id, cm);
  };

  return (
    <div className="flex flex-col h-full rounded-xl tactical-panel border border-cyan-900/50 p-4 space-y-4">
      {/* Target Designation Header */}
      <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${
            selectedTrack.iff === 'hostile' ? 'bg-red-950/80 border-red-500/50 text-red-400' :
            selectedTrack.iff === 'friendly' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' :
            'bg-amber-950/80 border-amber-500/50 text-amber-400'
          }`}>
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-white tracking-wide">
                {selectedTrack.id}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {selectedTrack.callsign}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>CLASS: <strong className="text-slate-200 uppercase">{selectedTrack.classification}</strong></span>
              <span>•</span>
              <span>SECTOR: <strong className="text-cyan-400">{selectedTrack.originSector}</strong></span>
            </div>
          </div>
        </div>

        {/* Current Track Threat Badge */}
        <div className="text-right">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold tracking-wider uppercase border ${
            selectedTrack.threatLevel === 'CRITICAL' ? 'bg-red-900/80 text-red-200 border-red-500 animate-pulse' :
            selectedTrack.threatLevel === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-500' :
            selectedTrack.threatLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-300 border-amber-600' :
            'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {selectedTrack.threatLevel} THREAT
          </span>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            STATUS: <span className={
              isNeutralized ? 'text-emerald-400 font-bold' :
              isJammed || isSpoofed ? 'text-amber-400 font-bold' :
              'text-red-400 font-bold'
            }>{selectedTrack.status}</span>
          </div>
        </div>
      </div>

      {/* Target Live Telemetry Matrix */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-cyan-400" /> DISTANCE
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">{selectedTrack.distanceKm} km</div>
          <div className="text-[9px] text-slate-400">AZ: {selectedTrack.azimuthDeg}°</div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> SPEED / HEADING
          </div>
          <div className="text-sm font-bold text-emerald-300 mt-0.5">{selectedTrack.speedKmh} km/h</div>
          <div className="text-[9px] text-slate-400">HDG: {selectedTrack.headingDeg}°</div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-red-400" /> PERIMETER ETA
          </div>
          <div className="text-sm font-bold text-red-400 mt-0.5">
            {selectedTrack.etaToPerimeterSeconds > 600 ? '>10 MIN' : `${selectedTrack.etaToPerimeterSeconds} SEC`}
          </div>
          <div className="text-[9px] text-slate-400">ALT: {selectedTrack.altitudeMeters} m</div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800 col-span-2">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Wifi className="w-3 h-3 text-purple-400" /> RF SIGNATURE & PROTOCOL
          </div>
          <div className="text-xs font-bold text-purple-300 mt-0.5">{selectedTrack.protocol}</div>
          <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
            <span>FREQ: {selectedTrack.rfFrequencyGhz} GHz</span>
            <span>RSSI: {selectedTrack.rssiDbm} dBm</span>
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-amber-400" /> BATTERY / POWER
          </div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">{selectedTrack.batteryPercent}%</div>
          <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
            <div 
              className="bg-amber-400 h-full transition-all" 
              style={{ width: `${selectedTrack.batteryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payload Analysis Warning */}
      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono">
        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>PAYLOAD & MISSION ESTIMATE:</span>
        </div>
        <div className="text-slate-200 font-semibold">{selectedTrack.payloadEstimate}</div>
      </div>

      {/* Countermeasure Engagement System */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> COUNTERMEASURE ENGAGEMENT
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            JAMMER: <strong className="text-emerald-400">{kpis.jammerReadinessPercent}% READY</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Action 1: Directional RF Jammer */}
          <button
            onClick={() => handleAction('RF_JAM')}
            disabled={isNeutralized}
            className={`p-2.5 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
              selectedTrack.activeCountermeasure === 'RF_JAM'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" /> RF JAMMER
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-amber-300">SOFT KILL</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Disrupts 2.4/5.8GHz C2 & video uplink
            </span>
          </button>

          {/* Action 2: GNSS / GPS Spoofing */}
          <button
            onClick={() => handleAction('GPS_SPOOF')}
            disabled={isNeutralized}
            className={`p-2.5 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
              selectedTrack.activeCountermeasure === 'GPS_SPOOF'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" /> GPS SPOOF
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-cyan-300">REDIRECT</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Transmits false ephemeris; forces RTB
            </span>
          </button>

          {/* Action 3: Autonomous Net Interceptor */}
          <button
            onClick={() => handleAction('NET_CATCH')}
            disabled={isNeutralized || kpis.interceptorDronesAvailable === 0}
            className={`p-2.5 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
              selectedTrack.activeCountermeasure === 'NET_CATCH'
                ? 'bg-blue-950/90 border-blue-400 text-blue-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-blue-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-blue-400" /> NET SENTRY
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-blue-300">
                {kpis.interceptorDronesAvailable} READY
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Launches autonomous capture interceptor
            </span>
          </button>

          {/* Action 4: High-Power EMP Strobe */}
          <button
            onClick={() => handleAction('KINETIC_EMP')}
            disabled={isNeutralized}
            className={`p-2.5 rounded-lg border text-left font-mono transition-all flex flex-col justify-between ${
              selectedTrack.activeCountermeasure === 'KINETIC_EMP'
                ? 'bg-red-950/90 border-red-500 text-red-200'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:border-red-500'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-red-400" /> EMP STROBE
              </span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                HARD KILL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              Fries flight controller avionics instantly
            </span>
          </button>
        </div>
      </div>

      {/* Manual IFF Classification Overrides */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-[11px] text-slate-400">IFF RECLASSIFICATION:</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => updateIFF(selectedTrack.id, 'hostile')}
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              selectedTrack.iff === 'hostile'
                ? 'bg-red-900/80 border-red-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-red-400'
            }`}
          >
            HOSTILE
          </button>
          <button
            onClick={() => updateIFF(selectedTrack.id, 'friendly')}
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              selectedTrack.iff === 'friendly'
                ? 'bg-emerald-900/80 border-emerald-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-400'
            }`}
          >
            FRIENDLY
          </button>
          <button
            onClick={() => updateIFF(selectedTrack.id, 'unknown')}
            className={`px-2 py-1 rounded text-[10px] font-bold border ${
              selectedTrack.iff === 'unknown'
                ? 'bg-amber-900/80 border-amber-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400'
            }`}
          >
            UNKNOWN
          </button>
        </div>
      </div>
    </div>
  );
};
