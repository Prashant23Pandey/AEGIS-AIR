import React, { useState, useMemo } from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { IFFStatus, DroneClassification } from '../../types/telemetry';
import { 
  Crosshair, 
  Radio, 
  Navigation, 
  Zap, 
  Search, 
  ArrowUpDown
} from 'lucide-react';

export const LiveTracks: React.FC = () => {
  const { 
    tracks, 
    selectedTrackId, 
    selectTrack, 
    triggerCountermeasure
  } = useAirspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [iffFilter, setIffFilter] = useState<IFFStatus | 'ALL'>('ALL');
  const [classFilter] = useState<DroneClassification | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'distance' | 'speed' | 'threat' | 'eta'>('distance');

  // Filtered & Sorted Tracks
  const filteredTracks = useMemo(() => {
    return tracks
      .filter(t => {
        if (iffFilter !== 'ALL' && t.iff !== iffFilter) return false;
        if (classFilter !== 'ALL' && t.classification !== classFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            t.id.toLowerCase().includes(q) ||
            t.callsign.toLowerCase().includes(q) ||
            t.protocol.toLowerCase().includes(q) ||
            t.payloadEstimate.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        if (sortBy === 'speed') return b.speedKmh - a.speedKmh;
        if (sortBy === 'eta') return a.etaToPerimeterSeconds - b.etaToPerimeterSeconds;
        if (sortBy === 'threat') {
          const rank: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (rank[b.threatLevel] || 0) - (rank[a.threatLevel] || 0);
        }
        return 0;
      });
  }, [tracks, iffFilter, classFilter, searchQuery, sortBy]);

  // Bulk Jam Hostiles
  const handleBulkJam = () => {
    tracks
      .filter(t => t.iff === 'hostile' && t.status === 'ACTIVE')
      .forEach(t => triggerCountermeasure(t.id, 'RF_JAM'));
  };

  return (
    <div className="space-y-4">
      {/* Control & Search Toolbar */}
      <div className="p-4 rounded-xl tactical-panel border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Track ID, Callsign, Protocol..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* IFF Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-500 px-1">IFF:</span>
            {(['ALL', 'hostile', 'friendly', 'unknown'] as const).map(status => (
              <button
                key={status}
                onClick={() => setIffFilter(status)}
                className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${
                  iffFilter === status
                    ? 'bg-cyan-500 text-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-300 text-[11px] font-mono focus:outline-none pr-2"
            >
              <option value="distance" className="bg-slate-900">SORT: DISTANCE (CLOSEST)</option>
              <option value="eta" className="bg-slate-900">SORT: ETA TO BASE</option>
              <option value="threat" className="bg-slate-900">SORT: THREAT SEVERITY</option>
              <option value="speed" className="bg-slate-900">SORT: VELOCITY (FASTEST)</option>
            </select>
          </div>

          {/* Bulk Defense Action Button */}
          <button
            onClick={handleBulkJam}
            className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all"
            title="Fire multi-band broadband jammer at all detected hostile tracks"
          >
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            BROADBAND JAM ALL HOSTILES
          </button>
        </div>
      </div>

      {/* Live Data Grid Table */}
      <div className="rounded-xl tactical-panel border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">TRACK / CALLSIGN</th>
                <th className="py-3 px-3">CLASSIFICATION</th>
                <th className="py-3 px-3">IFF / THREAT</th>
                <th className="py-3 px-3">DISTANCE / AZIMUTH</th>
                <th className="py-3 px-3">ALTITUDE / SPEED</th>
                <th className="py-3 px-3">RF PROTOCOL / FREQ</th>
                <th className="py-3 px-3">PERIMETER ETA</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">ENGAGE ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTracks.map(track => {
                const isSelected = track.id === selectedTrackId;
                const isNeutralized = track.status === 'NEUTRALIZED' || track.status === 'INTERCEPTED';

                return (
                  <tr
                    key={track.id}
                    onClick={() => selectTrack(track.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/50 hover:bg-cyan-950/70 border-l-4 border-cyan-400'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Track ID & Callsign */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <Crosshair className={`w-4 h-4 ${
                          isSelected ? 'text-cyan-400' : 'text-slate-500'
                        }`} />
                        <div>
                          <div className="font-bold text-slate-100">{track.id}</div>
                          <div className="text-[10px] text-cyan-400">{track.callsign}</div>
                        </div>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3 px-3">
                      <div className="text-slate-200 capitalize">{track.classification}</div>
                      <div className="text-[10px] text-slate-500">{track.originSector}</div>
                    </td>

                    {/* IFF & Threat */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          track.iff === 'hostile' ? 'bg-red-950 text-red-400 border border-red-800' :
                          track.iff === 'friendly' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {track.iff}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          track.threatLevel === 'CRITICAL' ? 'text-red-400' :
                          track.threatLevel === 'HIGH' ? 'text-orange-400' :
                          track.threatLevel === 'MEDIUM' ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {track.threatLevel}
                        </span>
                      </div>
                    </td>

                    {/* Distance & Azimuth */}
                    <td className="py-3 px-3">
                      <div className="text-cyan-300 font-semibold">{track.distanceKm} km</div>
                      <div className="text-[10px] text-slate-400">{track.azimuthDeg}° (HDG {track.headingDeg}°)</div>
                    </td>

                    {/* Altitude & Speed */}
                    <td className="py-3 px-3">
                      <div className="text-slate-200">{track.altitudeMeters} m</div>
                      <div className="text-[10px] text-emerald-400 font-medium">{track.speedKmh} km/h</div>
                    </td>

                    {/* RF & Protocol */}
                    <td className="py-3 px-3">
                      <div className="text-slate-300 truncate max-w-[140px]">{track.protocol}</div>
                      <div className="text-[10px] text-purple-400">{track.rfFrequencyGhz} GHz | {track.rssiDbm} dBm</div>
                    </td>

                    {/* ETA to Perimeter */}
                    <td className="py-3 px-3">
                      <span className={`font-bold ${
                        track.etaToPerimeterSeconds < 60 ? 'text-red-400 animate-pulse' :
                        track.etaToPerimeterSeconds < 180 ? 'text-orange-400' :
                        'text-slate-300'
                      }`}>
                        {track.etaToPerimeterSeconds > 600 ? '> 10m' : `${track.etaToPerimeterSeconds}s`}
                      </span>
                    </td>

                    {/* Track Status */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isNeutralized ? 'bg-slate-800 text-slate-400' :
                        track.status === 'JAMMED' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        track.status === 'SPOOFED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                        'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {track.status}
                      </span>
                    </td>

                    {/* Inline Quick Action Controls */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => triggerCountermeasure(track.id, 'RF_JAM')}
                          disabled={isNeutralized}
                          className="p-1.5 rounded bg-slate-900 hover:bg-amber-950 text-amber-400 hover:border-amber-600 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Transmit Targeted RF Jamming Pulse"
                        >
                          <Radio className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerCountermeasure(track.id, 'GPS_SPOOF')}
                          disabled={isNeutralized}
                          className="p-1.5 rounded bg-slate-900 hover:bg-cyan-950 text-cyan-400 hover:border-cyan-600 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Spoof GNSS Navigation Waypoints"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerCountermeasure(track.id, 'NET_CATCH')}
                          disabled={isNeutralized}
                          className="p-1.5 rounded bg-slate-900 hover:bg-blue-950 text-blue-400 hover:border-blue-600 border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Deploy Kinetic Interceptor Drone"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
