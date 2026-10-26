import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import { Crosshair, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { kpis, tracks, events } = useAirspace();

  const recentEvents = events.filter(e => !e.acknowledged).length;
  const activeTracks = tracks.filter(t => t.status !== 'NEUTRALIZED' && t.status !== 'LOST_TRACK').length;

  const cards = [
    {
      index: '01',
      tag: 'AIRSPACE',
      label: 'Active Radar Contacts',
      value: activeTracks,
      sub: `${kpis.hostileThreats} flagged unverified`,
      icon: <Crosshair className="w-4 h-4 text-pitch-black" />,
      tagBadge: 'bg-creator-pink text-pitch-black',
    },
    {
      index: '02',
      tag: 'TELEMETRY',
      label: 'Sensor Clock Rate',
      value: `${kpis.simulationSpeed}× real-time`,
      sub: kpis.simulationRunning ? 'Continuous pulse' : 'Stream paused',
      icon: <Activity className="w-4 h-4 text-pitch-black" />,
      tagBadge: 'bg-lime-glow text-pitch-black',
    },
    {
      index: '03',
      tag: 'INCIDENTS',
      label: 'Pending Incursions',
      value: recentEvents,
      sub: `${events.length} total events archived`,
      icon: <AlertTriangle className="w-4 h-4 text-pitch-black" />,
      tagBadge: recentEvents > 0 ? 'bg-orange-fire text-white' : 'bg-sunshine-yellow text-pitch-black',
    },
    {
      index: '04',
      tag: 'READINESS',
      label: 'Defense Perimeter',
      value: `${kpis.airspaceIntegrityScore}%`,
      sub: `RF triangulation: ${kpis.rfSensorHealth}%`,
      icon: <ShieldCheck className="w-4 h-4 text-pitch-black" />,
      tagBadge: 'bg-[#C7D2FE] text-pitch-black',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className="pop-card bg-white p-5 rounded-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
              <span className="font-bold text-pitch-black/60 tracking-wider">{c.index}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] ${c.tagBadge}`}>
                {c.tag}
              </span>
            </div>
            <div className="text-xs text-stone-600 font-semibold uppercase tracking-wider">{c.label}</div>
            <div className="text-3xl sm:text-4xl font-display font-extrabold text-pitch-black mt-1.5 tracking-[-0.04em]">
              {c.value}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-200 text-xs font-mono text-stone-600">
            <span>{c.sub}</span>
            <div className="p-1.5 rounded-full bg-light-linen border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">{c.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
