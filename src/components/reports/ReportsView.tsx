import React, { useState, useMemo } from 'react';
import { useAirspace } from '../../context/useAirspace';
import {
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  Eye,
  Crosshair,
  Clock
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    tracks,
    events,
    kpis,
    currentScenario,
    simElapsedSeconds,
    selectTrack,
    setActiveTab
  } = useAirspace();

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('ALL'); // ALL, 1MIN, 5MIN, 15MIN, UNACK
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  const [generatedTimestamp] = useState(() => {
    return new Date().toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
      hour12: false
    });
  });

  // Unique tracks associated with recorded events
  const uniqueTrackIds = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(e => {
      if (e.trackId) ids.add(e.trackId);
    });
    tracks.forEach(t => ids.add(t.id));
    return Array.from(ids).sort();
  }, [events, tracks]);

  // Filtered Events Ledger
  const filteredEvents = useMemo(() => {
    const referenceTime = Math.max(
      ...events.map(e => e.timestampMs || 0),
      ...tracks.map(t => t.lastUpdatedTimestamp || 0),
      1
    );

    return events.filter(evt => {
      // 1. Severity filter
      if (severityFilter !== 'ALL') {
        if (severityFilter === 'COUNTERMEASURE') {
          if (!evt.actionTaken && evt.category !== 'COUNTERMEASURE') return false;
        } else if (evt.severity !== severityFilter) {
          return false;
        }
      }

      // 2. Track filter
      if (trackFilter !== 'ALL' && evt.trackId !== trackFilter) {
        return false;
      }

      // 3. Time filter
      if (timeFilter === 'UNACK' && evt.acknowledged) {
        return false;
      }
      if (evt.timestampMs) {
        const ageMs = referenceTime - evt.timestampMs;
        if (timeFilter === '1MIN' && ageMs > 60 * 1000) return false;
        if (timeFilter === '5MIN' && ageMs > 5 * 60 * 1000) return false;
        if (timeFilter === '15MIN' && ageMs > 15 * 60 * 1000) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = evt.title.toLowerCase().includes(q);
        const inMsg = evt.message.toLowerCase().includes(q);
        const inId = evt.id.toLowerCase().includes(q);
        const inTrack = evt.trackId ? evt.trackId.toLowerCase().includes(q) : false;
        const inOp = evt.operator.toLowerCase().includes(q);
        if (!inTitle && !inMsg && !inId && !inTrack && !inOp) return false;
      }

      return true;
    });
  }, [events, tracks, severityFilter, trackFilter, timeFilter, searchQuery]);

  // Jump to track in Live Airspace
  const handleInspectTrack = (trackId: string) => {
    selectTrack(trackId);
    setActiveTab('overview');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Scenario',
      'Event ID',
      'Timestamp',
      'Severity',
      'Category',
      'Track ID',
      'Distance (km)',
      'Altitude (m)',
      'Speed (km/h)',
      'RF Frequency (GHz)',
      'RSSI (dBm)',
      'Operator',
      'Action Taken',
      'Acknowledged',
      'Title',
      'Message'
    ];

    const rows = filteredEvents.map(e => {
      // Match current track data if snapshot missing
      const matchedTrack = tracks.find(t => t.id === e.trackId);
      const dist = e.measurementsSnapshot?.distanceKm ?? matchedTrack?.distanceKm ?? '';
      const alt = e.measurementsSnapshot?.altitudeMeters ?? matchedTrack?.altitudeMeters ?? '';
      const spd = e.measurementsSnapshot?.speedKmh ?? matchedTrack?.speedKmh ?? '';
      const freq = e.measurementsSnapshot?.rfFrequencyGhz ?? matchedTrack?.rfFrequencyGhz ?? '';
      const rssi = e.measurementsSnapshot?.rssiDbm ?? matchedTrack?.rssiDbm ?? '';

      return [
        `"${currentScenario}"`,
        `"${e.id}"`,
        `"${e.timestamp}"`,
        `"${e.severity}"`,
        `"${e.category || 'INCURSION'}"`,
        `"${e.trackId || 'N/A'}"`,
        dist,
        alt,
        spd,
        freq,
        rssi,
        `"${e.operator}"`,
        `"${e.actionTaken || 'None'}"`,
        e.acknowledged ? 'YES' : 'NO',
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.message.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegis_air_incident_log_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // JSON Export
  const handleExportJSON = () => {
    const payload = {
      reportTitle: 'AEGIS AIR Counter-Drone Airspace Mission Dossier',
      compiledAt: new Date().toISOString(),
      scenario: currentScenario,
      simulationState: {
        isRunning: kpis.simulationRunning,
        speedMultiplier: kpis.simulationSpeed,
        elapsedSeconds: simElapsedSeconds,
        airspaceIntegrityScore: kpis.airspaceIntegrityScore,
        rfSensorHealth: kpis.rfSensorHealth,
        jammerReadiness: kpis.jammerReadinessPercent,
        interceptorDronesAvailable: kpis.interceptorDronesAvailable
      },
      summaryMetrics: {
        totalLoggedEvents: events.length,
        filteredEventsCount: filteredEvents.length,
        criticalIncursions: events.filter(e => e.severity === 'CRITICAL').length,
        unacknowledgedEvents: events.filter(e => !e.acknowledged).length,
        catalogedTracks: tracks.length,
        neutralizedTracks: tracks.filter(t => t.status === 'NEUTRALIZED').length
      },
      incidentLedger: filteredEvents.map(e => {
        const matched = tracks.find(t => t.id === e.trackId);
        return {
          id: e.id,
          timestamp: e.timestamp,
          severity: e.severity,
          category: e.category || 'INCURSION',
          title: e.title,
          message: e.message,
          trackId: e.trackId || null,
          operator: e.operator,
          actionTaken: e.actionTaken || null,
          acknowledged: e.acknowledged,
          telemetryMeasurements: e.measurementsSnapshot || (matched ? {
            distanceKm: matched.distanceKm,
            altitudeMeters: matched.altitudeMeters,
            speedKmh: matched.speedKmh,
            rfFrequencyGhz: matched.rfFrequencyGhz,
            rssiDbm: matched.rssiDbm
          } : null)
        };
      }),
      activeTracksSnapshot: tracks.map(t => ({
        id: t.id,
        callsign: t.callsign,
        classification: t.classification,
        iff: t.iff,
        status: t.status,
        distanceKm: t.distanceKm,
        azimuthDeg: t.azimuthDeg,
        altitudeMeters: t.altitudeMeters,
        speedKmh: t.speedKmh,
        headingDeg: t.headingDeg,
        rfFrequencyGhz: t.rfFrequencyGhz,
        rssiDbm: t.rssiDbm,
        protocol: t.protocol,
        lastPredictionErrorMeters: t.lastPredictionErrorMeters || 0,
        dataQualityPercent: t.dataQualityPercent || 100
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegis_air_dossier_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case 'WARNING':  return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'SUCCESS':  return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:         return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${isPrintPreview ? 'bg-white p-8 rounded-2xl shadow-xl max-w-5xl mx-auto border border-pitch-black' : ''}`}>
      {/* Editorial Header & Action Toolbar */}
      <div className="pop-card rounded-2xl border border-pitch-black bg-white px-6 py-5 shadow-[2px_2px_0px_#0D0D0D] no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-sunshine-yellow border border-pitch-black text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <FileText className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-pitch-black tracking-tight">Mission Incident Dossier & Audit</h2>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-creator-pink text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                  04 / DOSSIER
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-1 font-mono">
                Chronological incident recording, sensor telemetry measurements, and cryptographic mission audit log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsPrintPreview(!isPrintPreview)}
              className={`btn-pop flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-mono font-bold border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all ${
                isPrintPreview
                  ? 'bg-pitch-black text-white'
                  : 'bg-white text-pitch-black hover:bg-surface-2'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isPrintPreview ? 'Exit Preview' : 'Print Preview'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-pop flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-pitch-black bg-white hover:bg-surface-2 text-pitch-black text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-pitch-black" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="btn-pop flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-pitch-black bg-sunshine-yellow hover:bg-sunshine-yellowHover text-pitch-black text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-pitch-black" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="btn-pop flex items-center gap-1.5 px-4 py-2 rounded-full border border-pitch-black bg-creator-pink hover:bg-creator-pinkHover text-pitch-black text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-pitch-black" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Incident Summary Card */}
      <div className="pop-card rounded-2xl border border-pitch-black bg-white p-6 shadow-[2px_2px_0px_#0D0D0D] print-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pitch-black/20 gap-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-pitch-black font-bold bg-sunshine-yellow border border-pitch-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#0D0D0D]">
              Official Executive Debrief
            </span>
            <h3 className="font-display font-extrabold text-xl text-pitch-black tracking-tight mt-1.5">
              Incident Situation Summary: Sector Defense Report
            </h3>
          </div>
          <div className="text-right font-mono text-2xs text-ink-500">
            <div>Compiled: <strong className="text-pitch-black">{generatedTimestamp}</strong></div>
            <div className="mt-0.5">
              Simulation Status:{' '}
              <span className={`font-bold ${kpis.simulationRunning ? 'text-emerald-700' : 'text-amber-700'}`}>
                {kpis.simulationRunning ? 'RUNNING' : 'PAUSED'} ({kpis.simulationSpeed}×, {simElapsedSeconds}s elapsed)
              </span>
            </div>
          </div>
        </div>

        {/* Narrative & Metric Grid */}
        <div className="mt-4 space-y-4 font-sans text-sm text-pitch-black leading-relaxed">
          <p>
            During active surveillance of the defense perimeter, the AEGIS AIR monitoring system indexed{' '}
            <strong className="text-pitch-black font-bold">{tracks.length} air contacts</strong> under current scenario{' '}
            <strong className="text-pitch-black font-bold font-mono uppercase bg-sunshine-yellow/40 border border-pitch-black px-1.5 py-0.5 rounded-md">{currentScenario}</strong>. A total of{' '}
            <strong className="text-pitch-black font-bold">{events.length} security events</strong> have been recorded in the simulation audit ledger, with{' '}
            <strong className="text-red-600 font-bold">{events.filter(e => e.severity === 'CRITICAL').length} critical boundary breach alerts</strong> and{' '}
            <strong className="text-amber-800 font-bold">{events.filter(e => !e.acknowledged).length} unacknowledged incident flags</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center text-xs">
            <div className="bg-surface-0 border border-pitch-black p-3 rounded-xl shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <span className="text-[10px] uppercase font-mono font-bold text-ink-500">Total Contacts</span>
              <div className="text-3xl font-display font-extrabold text-pitch-black mt-1">{tracks.length}</div>
            </div>
            <div className="bg-surface-0 border border-pitch-black p-3 rounded-xl shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <span className="text-[10px] uppercase font-mono font-bold text-ink-500">Active Hostiles</span>
              <div className="text-3xl font-display font-extrabold text-red-500 mt-1">
                {tracks.filter(t => t.iff === 'hostile' && t.status !== 'NEUTRALIZED').length}
              </div>
            </div>
            <div className="bg-surface-0 border border-pitch-black p-3 rounded-xl shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <span className="text-[10px] uppercase font-mono font-bold text-ink-500">Neutralized</span>
              <div className="text-3xl font-display font-extrabold text-emerald-600 mt-1">
                {tracks.filter(t => t.status === 'NEUTRALIZED' || t.status === 'INTERCEPTED').length}
              </div>
            </div>
            <div className="bg-surface-0 border border-pitch-black p-3 rounded-xl shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <span className="text-[10px] uppercase font-mono font-bold text-ink-500">Integrity Score</span>
              <div className="text-3xl font-display font-extrabold text-pitch-black mt-1">{kpis.airspaceIntegrityScore}%</div>
            </div>
            <div className="bg-surface-0 border border-pitch-black p-3 rounded-xl shadow-[1.5px_1.5px_0px_#0D0D0D]">
              <span className="text-[10px] uppercase font-mono font-bold text-ink-500">Sensor Health</span>
              <div className="text-3xl font-display font-extrabold text-pitch-black mt-1">{kpis.rfSensorHealth}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="pop-card rounded-2xl border border-pitch-black bg-white p-5 shadow-[2px_2px_0px_#0D0D0D] no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Event Severity / Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-pitch-black uppercase">Type:</span>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="text-xs font-mono font-bold bg-white border border-pitch-black rounded-full px-3 py-1.5 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="CRITICAL">Critical Breaches</option>
                <option value="WARNING">Warnings</option>
                <option value="INFO">Informational</option>
                <option value="SUCCESS">Verified Successes</option>
                <option value="COUNTERMEASURE">Countermeasure Engagements</option>
              </select>
            </div>

            {/* Track Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-pitch-black uppercase">Target:</span>
              <select
                value={trackFilter}
                onChange={e => setTrackFilter(e.target.value)}
                className="text-xs font-mono font-bold bg-white border border-pitch-black rounded-full px-3 py-1.5 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none"
              >
                <option value="ALL">All Radar Contacts</option>
                {uniqueTrackIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            {/* Time Window Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-pitch-black uppercase">Window:</span>
              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className="text-xs font-mono font-bold bg-white border border-pitch-black rounded-full px-3 py-1.5 text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none"
              >
                <option value="ALL">All Recorded Time</option>
                <option value="1MIN">Last 1 Minute</option>
                <option value="5MIN">Last 5 Minutes</option>
                <option value="15MIN">Last 15 Minutes</option>
                <option value="UNACK">Unacknowledged Only</option>
              </select>
            </div>
          </div>

          {/* Search Query */}
          <div className="relative flex-1 lg:max-w-xs">
            <Search className="w-3.5 h-3.5 text-pitch-black absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search narrative, ID, operator..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs font-mono font-medium pl-8 pr-3 py-1.5 rounded-full border border-pitch-black bg-white text-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] focus:outline-none placeholder:text-ink-400"
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-pitch-black/10 flex items-center justify-between text-2xs font-mono text-ink-500 font-bold">
          <span>Displaying <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> chronological entries</span>
          {(severityFilter !== 'ALL' || trackFilter !== 'ALL' || timeFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setTrackFilter('ALL');
                setTimeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-pitch-black hover:text-creator-pink font-bold underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Incident Ledger Table */}
      <div className="pop-card rounded-2xl border border-pitch-black bg-white shadow-[2px_2px_0px_#0D0D0D] overflow-hidden">
        <div className="px-6 py-4 border-b border-pitch-black bg-surface-0 flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-lg text-pitch-black tracking-tight">Incident & Telemetry Measurement Ledger</h3>
            <p className="text-2xs text-ink-500 font-mono">Comprehensive record of incursions, kinematics, and defensive engagements</p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            {filteredEvents.length} Events Cataloged
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-20 text-center font-serif text-sm text-stone-400 italic">
            No incident records found matching active filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredEvents.map(evt => {
              const matchedTrack = tracks.find(t => t.id === evt.trackId);
              const dist = evt.measurementsSnapshot?.distanceKm ?? matchedTrack?.distanceKm;
              const spd = evt.measurementsSnapshot?.speedKmh ?? matchedTrack?.speedKmh;
              const alt = evt.measurementsSnapshot?.altitudeMeters ?? matchedTrack?.altitudeMeters;
              const freq = evt.measurementsSnapshot?.rfFrequencyGhz ?? matchedTrack?.rfFrequencyGhz;
              const rssi = evt.measurementsSnapshot?.rssiDbm ?? matchedTrack?.rssiDbm;

              return (
                <div key={evt.id} className="p-6 hover:bg-stone-50/70 transition-colors print-break-inside-avoid">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* Left: Metadata & Incident Narrative */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <span className="mt-0.5 flex-shrink-0">{severityIcon(evt.severity)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-stone-500">{evt.id}</span>
                          <span className="text-sm font-serif italic text-stone-900 font-semibold">{evt.title}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            evt.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            evt.severity === 'WARNING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            evt.severity === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {evt.severity}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                            Scenario: {currentScenario}
                          </span>
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-stone-600 font-serif leading-relaxed mt-1.5">
                          {evt.message}
                        </p>

                        {/* Action Taken if present */}
                        {evt.actionTaken && (
                          <div className="mt-2 text-xs font-serif text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5 inline-block">
                            <strong>Countermeasure Engaged:</strong> {evt.actionTaken}
                          </div>
                        )}

                        {/* Telemetry Measurements Snapshot at Incident Time */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-2xs font-mono text-stone-600">
                          {dist !== undefined && (
                            <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                              Distance: <strong className="text-stone-900">{dist} km</strong>
                            </span>
                          )}
                          {spd !== undefined && (
                            <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                              Speed: <strong className="text-stone-900">{spd} km/h</strong>
                            </span>
                          )}
                          {alt !== undefined && (
                            <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                              Altitude: <strong className="text-stone-900">{alt} m</strong>
                            </span>
                          )}
                          {freq !== undefined && (
                            <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                              RF Freq: <strong className="text-stone-900">{freq} GHz</strong>
                            </span>
                          )}
                          {rssi !== undefined && (
                            <span className="bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-lg">
                              RSSI: <strong className="text-stone-900">{rssi} dBm</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Attribution & Inspection Link */}
                    <div className="flex md:flex-col items-end justify-between md:justify-start gap-2 text-right flex-shrink-0 pt-2 md:pt-0">
                      <div className="text-[11px] font-mono text-stone-400">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>{evt.timestamp}</span>
                        </div>
                        <div className="mt-0.5">Source: {evt.operator}</div>
                      </div>

                      {evt.trackId && (
                        <button
                          onClick={() => handleInspectTrack(evt.trackId!)}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-serif italic font-semibold border border-indigo-200/80 bg-indigo-50/50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-all no-print"
                          title={`Inspect telemetry for ${evt.trackId}`}
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>Inspect {evt.trackId}</span>
                        </button>
                      )}

                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        evt.acknowledged ? 'text-emerald-700 bg-emerald-50' : 'text-stone-500 bg-stone-100'
                      }`}>
                        {evt.acknowledged ? 'Acknowledged' : 'Active Unresolved'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
