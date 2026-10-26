import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import { Crosshair, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { kpis, tracks, events } = useAirspace();

  const recentEvents = events.filter(e => !e.acknowledged).length;
  const activeTracks = tracks.filter(t => t.status !== 'NEUTRALIZED' && t.status !== 'LOST_TRACK').length;

  const cards = [
    {
      index: '01 / 04',
      tag: 'AIRSPACE',
      label: 'Active Radar Contacts',
      value: activeTracks,
      sub: `${kpis.hostileThreats} flagged unverified`,
      icon: <Crosshair className="w-4 h-4 text-indigo-600" />,
      tagColor: 'text-amber-700',
    },
    {
      index: '02 / 04',
      tag: 'TELEMETRY',
      label: 'Sensor Clock Rate',
      value: `${kpis.simulationSpeed}× real-time`,
      sub: kpis.simulationRunning ? 'Continuous pulse' : 'Stream paused',
      icon: <Activity className="w-4 h-4 text-emerald-600" />,
      tagColor: 'text-indigo-700',
    },
    {
      index: '03 / 04',
      tag: 'INCIDENTS',
      label: 'Pending Incursions',
      value: recentEvents,
      sub: `${events.length} total events archived`,
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      tagColor: recentEvents > 0 ? 'text-rose-700' : 'text-stone-500',
    },
    {
      index: '04 / 04',
      tag: 'READINESS',
      label: 'Defense Perimeter',
      value: `${kpis.airspaceIntegrityScore}%`,
      sub: `RF triangulation: ${kpis.rfSensorHealth}%`,
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      tagColor: 'text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className="rounded-2xl border border-border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-stone-300 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
              <span className="text-stone-400">{c.index}</span>
              <span className={`font-semibold tracking-widest text-[10px] ${c.tagColor}`}>
                {c.tag}
              </span>
            </div>
            <div className="text-xs text-stone-500 font-medium">{c.label}</div>
            <div className="text-3xl font-serif italic text-stone-900 mt-1 tracking-tight">
              {c.value}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500">
            <span>{c.sub}</span>
            <div className="p-1 rounded-lg bg-stone-50 border border-stone-100">{c.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
