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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border bg-white px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif italic text-2xl text-stone-900 font-medium">Incident Audit Console</h2>
            <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
              02 / INCIDENTS
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 italic font-serif">
            {events.length} chronological air telemetry events registered · Cryptographic simulation audit trail
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100/70 p-1 rounded-xl border border-stone-200">
            {(['ALL', 'CRITICAL', 'WARNING', 'INFO', 'SUCCESS'] as const).map(sev => {
              const active = filter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-accent-cyan text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          <button
            onClick={clearResolvedEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs text-stone-600 hover:text-stone-900 transition-all shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Clear resolved</span>
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden divide-y divide-stone-100">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-stone-400 italic font-serif">
            No incidents match the active severity filter.
          </div>
        ) : (
          filtered.map(evt => {
            const cfg = severityConfig[evt.severity] || severityConfig.INFO;
            return (
              <div
                key={evt.id}
                className={`px-6 py-4 flex flex-col sm:flex-row items-start gap-4 border-l-4 transition-colors ${
                  !evt.acknowledged ? cfg.rowBg : 'border-l-transparent hover:bg-stone-50/60'
                }`}
              >
                {/* Left: Icon + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <span className="mt-0.5 flex-shrink-0">{cfg.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-stone-900">{evt.title}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {evt.severity}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{evt.message}</p>
                    <div className="flex items-center gap-3.5 mt-2 text-2xs text-stone-400 font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" /> {evt.timestamp}
                      </span>
                      <span>Source: {evt.operator}</span>
                      {evt.trackId && (
                        <button
                          onClick={() => handleGoToTrack(evt.trackId)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors font-sans"
                        >
                          <Crosshair className="w-3 h-3" /> View track {evt.trackId}
                        </button>
                      )}
                      {evt.actionTaken && (
                        <span className="text-amber-800 font-sans font-medium">Action: {evt.actionTaken}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status */}
                <div className="flex-shrink-0 self-end sm:self-center">
                  {!evt.acknowledged ? (
                    <button
                      onClick={() => acknowledgeEvent(evt.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 hover:text-stone-900 transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-xl">
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
