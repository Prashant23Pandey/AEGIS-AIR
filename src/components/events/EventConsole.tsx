import React, { useState, useMemo } from 'react';
import { useAirspace } from '../../context/useAirspace';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Check,
  Trash2,
  Crosshair,
  Clock,
} from 'lucide-react';

const severityConfig: Record<string, { icon: React.ReactNode; dot: string; rowBg: string; badge: string }> = {
  CRITICAL: {
    icon: <AlertOctagon className="w-4 h-4 text-red-600" />,
    dot: 'text-red-600',
    rowBg: 'bg-rose-50/50 border-l-red-600',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  WARNING: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    dot: 'text-amber-600',
    rowBg: 'bg-amber-50/40 border-l-amber-600',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  INFO: {
    icon: <Info className="w-4 h-4 text-indigo-600" />,
    dot: 'text-indigo-600',
    rowBg: 'border-l-transparent',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  SUCCESS: {
    icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    dot: 'text-emerald-600',
    rowBg: 'border-l-transparent',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

export const EventConsole: React.FC = () => {
  const { events, acknowledgeEvent, clearResolvedEvents, selectTrack, setActiveTab } = useAirspace();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'>('ALL');

  const filtered = useMemo(() => {
    return filter === 'ALL' ? events : events.filter(e => e.severity === filter);
  }, [events, filter]);

  const handleGoToTrack = (trackId?: string) => {
    if (!trackId) return;
    selectTrack(trackId);
    setActiveTab('overview');
  };

  return (
    <div className="space-y-4">
      {/* Editorial Header & Filter Bar */}
      <div className="pop-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-pitch-black bg-white px-6 py-4 shadow-[2px_2px_0px_#0D0D0D]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-pitch-black tracking-tight">Incident Audit Console</h2>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
              02 / INCIDENTS
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1 font-mono">
            {events.length} chronological air telemetry events registered · Cryptographic simulation audit trail
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-full border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D]">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO', 'SUCCESS'] as const).map(sev => {
              const active = filter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                    active
                      ? 'bg-pitch-black text-white shadow-xs'
                      : 'text-pitch-black hover:bg-white'
                  }`}
                >
                  {sev === 'ALL' ? 'ALL' : sev}
                </button>
              );
            })}
          </div>

          <button
            onClick={clearResolvedEvents}
            className="btn-pop flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-pitch-black bg-white hover:bg-creator-pink/20 text-xs font-bold text-pitch-black transition-all shadow-[1.5px_1.5px_0px_#0D0D0D]"
          >
            <Trash2 className="w-3.5 h-3.5 text-pitch-black" />
            <span>Clear resolved</span>
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="pop-card rounded-2xl border border-pitch-black bg-white shadow-[2px_2px_0px_#0D0D0D] overflow-hidden divide-y divide-border-subtle">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-ink-400 font-mono">
            No incidents match the active severity filter.
          </div>
        ) : (
          filtered.map(evt => {
            const cfg = severityConfig[evt.severity] || severityConfig.INFO;
            return (
              <div
                key={evt.id}
                className={`px-6 py-4 flex flex-col sm:flex-row items-start gap-4 border-l-4 transition-colors ${
                  !evt.acknowledged ? cfg.rowBg : 'border-l-transparent hover:bg-surface-2/60'
                }`}
              >
                {/* Left: Icon + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-display font-bold text-pitch-black">{evt.title}</span>
                      <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] ${
                        evt.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                        evt.severity === 'WARNING' ? 'bg-sunshine-yellow text-pitch-black' :
                        evt.severity === 'SUCCESS' ? 'bg-lime-glow text-pitch-black' :
                        'bg-white text-pitch-black'
                      }`}>
                        {evt.severity}
                      </span>
                    </div>
                    <p className="text-xs text-ink-700 mt-1 leading-relaxed">{evt.message}</p>
                    <div className="flex items-center gap-3.5 mt-2 text-2xs text-ink-500 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pitch-black" /> {evt.timestamp}
                      </span>
                      <span>Source: {evt.operator}</span>
                      {evt.trackId && (
                        <button
                          onClick={() => handleGoToTrack(evt.trackId)}
                          className="btn-pop px-2 py-0.5 rounded-full bg-white border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] flex items-center gap-1 text-pitch-black font-bold transition-colors"
                        >
                          <Crosshair className="w-3 h-3 text-creator-pink" /> View track {evt.trackId}
                        </button>
                      )}
                      {evt.actionTaken && (
                        <span className="text-pitch-black bg-sunshine-yellow/40 border border-pitch-black px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">Action: {evt.actionTaken}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status */}
                <div className="flex-shrink-0 self-end sm:self-center">
                  {!evt.acknowledged ? (
                    <button
                      onClick={() => acknowledgeEvent(evt.id)}
                      className="btn-pop flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-pitch-black bg-lime-glow hover:bg-lime-acid text-xs font-mono font-bold text-pitch-black transition-all shadow-[1.5px_1.5px_0px_#0D0D0D]"
                    >
                      <Check className="w-3.5 h-3.5 text-pitch-black stroke-[3]" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-pitch-black bg-white border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
