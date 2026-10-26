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
    <div className="rounded-2xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-stone-50/50">
        <div className="flex items-center gap-2">
          <h2 className="font-serif italic text-base text-stone-900 font-medium">Recent Incident Ticker</h2>
          <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            Real-Time Feed
          </span>
        </div>
        <button
          onClick={() => setActiveTab('events')}
          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-medium flex items-center gap-1"
        >
          <span>View all incidents</span>
          <span>→</span>
        </button>
      </div>
      <div className="divide-y divide-stone-100">
        {recent.map(evt => (
          <div
            key={evt.id}
            className={`px-5 py-2.5 flex items-start gap-3 transition-colors ${
              !evt.acknowledged && evt.severity === 'CRITICAL' ? 'bg-rose-50/40' :
              !evt.acknowledged && evt.severity === 'WARNING' ? 'bg-amber-50/30' : 'hover:bg-stone-50/60'
            }`}
          >
            <span className="mt-0.5 flex-shrink-0">{severityIcon(evt.severity)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-stone-900 truncate">{evt.title}</span>
                <span className="text-[11px] text-stone-400 font-mono flex-shrink-0">{evt.timestamp}</span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5 truncate">{evt.message}</p>
            </div>
            {!evt.acknowledged && (
              <button
                onClick={() => acknowledgeEvent(evt.id)}
                className="text-2xs px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 flex-shrink-0 transition-all shadow-xs"
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
