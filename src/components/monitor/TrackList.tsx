import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { DroneTrack } from '../../types/telemetry';

const iffDot = (iff: string): string => {
  switch (iff) {
    case 'hostile': return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]';
    case 'friendly': return 'bg-lime-glow shadow-[0_0_6px_rgba(112,255,0,0.6)]';
    case 'neutral': return 'bg-slate-400';
    default: return 'bg-sunshine-yellow shadow-[0_0_6px_rgba(255,199,0,0.6)]';
  }
};

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    ACTIVE:      { bg: 'bg-white', text: 'text-pitch-black', border: 'border-pitch-black' },
    JAMMED:      { bg: 'bg-sunshine-yellow', text: 'text-pitch-black', border: 'border-pitch-black' },
    SPOOFED:     { bg: 'bg-creator-pink', text: 'text-pitch-black', border: 'border-pitch-black' },
    INTERCEPTED: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-900' },
    NEUTRALIZED: { bg: 'bg-surface-2', text: 'text-ink-500', border: 'border-ink-400' },
    LOST_TRACK:  { bg: 'bg-surface-2', text: 'text-ink-400', border: 'border-ink-400' },
  };
  const s = map[status] || map.ACTIVE;
  return `${s.bg} ${s.text} ${s.border} border shadow-[1px_1px_0px_#0D0D0D]`;
};

const TrackRow: React.FC<{ track: DroneTrack; selected: boolean; onSelect: () => void }> = ({ track, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-all border-l-4 ${
        selected
          ? 'bg-creator-pink/15 border-l-creator-pink'
          : 'border-l-transparent hover:bg-surface-2/60'
      }`}
    >
      {/* IFF status dot */}
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border border-pitch-black ${iffDot(track.iff)}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold text-pitch-black truncate">{track.callsign}</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${statusBadge(track.status)}`}>
            {track.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[11px] text-ink-500 mt-0.5 font-mono">
          {track.distanceKm} km · {track.azimuthDeg}° · {track.altitudeMeters}m
        </div>
      </div>

      {/* Speed */}
      <span className="text-2xs text-pitch-black font-mono font-bold flex-shrink-0 bg-white border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] px-2 py-0.5 rounded-md">
        {track.speedKmh} km/h
      </span>
    </button>
  );
};

export const TrackList: React.FC = () => {
  const { tracks, selectedTrackId, selectTrack } = useAirspace();

  return (
    <div className="pop-card rounded-2xl bg-white border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b border-pitch-black bg-surface-0 flex items-center justify-between">
        <div>
          <h3 className="font-display font-extrabold text-base text-pitch-black tracking-tight">Radar Inventory</h3>
          <p className="text-2xs text-ink-500 font-mono">Active tracking signatures</p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
          {tracks.length} TARGETS
        </span>
      </div>

      <div className="divide-y divide-border-subtle overflow-y-auto max-h-[300px] flex-1">
        {tracks.map(t => (
          <TrackRow
            key={t.id}
            track={t}
            selected={t.id === selectedTrackId}
            onSelect={() => selectTrack(t.id)}
          />
        ))}
      </div>
    </div>
  );
};
