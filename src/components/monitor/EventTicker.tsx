import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import { AlertTriangle, AlertOctagon, Info, CheckCircle } from 'lucide-react';

const severityIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return <AlertOctagon className="w-3.5 h-3.5 text-red-600" />;
    case 'WARNING':  return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
    case 'SUCCESS':  return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    default:         return <Info className="w-3.5 h-3.5 text-indigo-600" />;
  }
};

export const EventTicker: React.FC = () => {
  const { events, acknowledgeEvent, setActiveTab } = useAirspace();
  const recent = events.slice(0, 5);

  return (
    <div className="pop-card rounded-2xl bg-white border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-pitch-black bg-surface-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-extrabold text-base text-pitch-black tracking-tight">Recent Incident Ticker</h2>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            LIVE FEED
          </span>
        </div>
        <button
          onClick={() => setActiveTab('events')}
          className="btn-pop px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-creator-pink text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all flex items-center gap-1"
        >
          <span>View all</span>
          <span>→</span>
        </button>
      </div>
      <div className="divide-y divide-border-subtle">
        {recent.map(evt => (
          <div
            key={evt.id}
            className={`px-5 py-2.5 flex items-start gap-3 transition-colors ${
              !evt.acknowledged && evt.severity === 'CRITICAL' ? 'bg-red-500/10' :
              !evt.acknowledged && evt.severity === 'WARNING' ? 'bg-sunshine-yellow/15' : 'hover:bg-surface-2/60'
            }`}
          >
            <span className="mt-0.5 flex-shrink-0">{severityIcon(evt.severity)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-display font-bold text-pitch-black truncate">{evt.title}</span>
                <span className="text-[11px] text-ink-500 font-mono font-medium flex-shrink-0">{evt.timestamp}</span>
              </div>
              <p className="text-xs text-ink-700 mt-0.5 truncate">{evt.message}</p>
            </div>
            {!evt.acknowledged && (
              <button
                onClick={() => acknowledgeEvent(evt.id)}
                className="btn-pop text-2xs px-2.5 py-1 rounded-full border border-pitch-black bg-white hover:bg-creator-pink text-pitch-black font-bold flex-shrink-0 shadow-[1px_1px_0px_#0D0D0D]"
              >
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
