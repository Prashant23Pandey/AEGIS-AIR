import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { DroneTrack } from '../../types/telemetry';

const iffDot = (iff: string): string => {
  switch (iff) {
    case 'hostile': return 'bg-red-600';
    case 'friendly': return 'bg-emerald-600';
    case 'neutral': return 'bg-slate-400';
    default: return 'bg-amber-600';
  }
};

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    ACTIVE:      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    JAMMED:      { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    SPOOFED:     { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
    INTERCEPTED: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    NEUTRALIZED: { bg: 'bg-stone-100', text: 'text-stone-500', border: 'border-stone-200' },
    LOST_TRACK:  { bg: 'bg-stone-100', text: 'text-stone-400', border: 'border-stone-200' },
  };
  const s = map[status] || map.ACTIVE;
  return `${s.bg} ${s.text} ${s.border} border`;
};

const TrackRow: React.FC<{ track: DroneTrack; selected: boolean; onSelect: () => void }> = ({ track, selected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-all border-l-2 ${
        selected
          ? 'bg-indigo-50/70 border-l-indigo-600'
          : 'border-l-transparent hover:bg-stone-50'
      }`}
    >
      {/* IFF status dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${iffDot(track.iff)}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-900 truncate">{track.callsign}</span>
          <span className={`text-[10px] px-1.5 py-px rounded-full font-medium ${statusBadge(track.status)}`}>
            {track.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-[11px] text-stone-500 mt-0.5 font-mono">
          {track.distanceKm} km · {track.azimuthDeg}° · {track.altitudeMeters}m
        </div>
      </div>

      {/* Speed */}
      <span className="text-2xs text-stone-600 font-mono font-medium flex-shrink-0 bg-stone-100/80 px-2 py-0.5 rounded-md">
        {track.speedKmh} km/h
      </span>
    </button>
  );
};

export const TrackList: React.FC = () => {
  const { tracks, selectedTrackId, selectTrack } = useAirspace();

  return (
    <div className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-serif italic text-base text-stone-900 font-medium">Radar Inventory</h3>
          <p className="text-2xs text-stone-400 font-mono">Active tracking signatures</p>
        </div>
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
          {tracks.length} targets
        </span>
      </div>

      <div className="divide-y divide-stone-100 overflow-y-auto max-h-[300px] flex-1">
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
