import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { ActiveTab } from '../../types/telemetry';
import { Radar, AlertTriangle, BarChart3, FileText, Flame } from 'lucide-react';

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; tag: string }[] = [
  { id: 'overview',   label: 'Live Airspace', icon: <Radar className="w-4 h-4" />,         tag: '01' },
  { id: 'events',     label: 'Incident Log',  icon: <AlertTriangle className="w-4 h-4" />,  tag: '02' },
  { id: 'analytics',  label: 'Telemetry',     icon: <BarChart3 className="w-4 h-4" />,      tag: '03' },
  { id: 'reports',    label: 'Dossier',       icon: <FileText className="w-4 h-4" />,       tag: '04' },
  { id: 'stress-lab', label: 'Stress Lab',    icon: <Flame className="w-4 h-4" />,          tag: '05' },
];

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, events } = useAirspace();
  const unacked = events.filter(e => !e.acknowledged && (e.severity === 'CRITICAL' || e.severity === 'WARNING')).length;

  return (
    <nav className="flex items-center gap-2 px-4 md:px-8 py-2.5 bg-light-linen border-b border-pitch-black flex-shrink-0 overflow-x-auto">
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn-pop flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              active
                ? 'bg-pitch-black text-white'
                : 'bg-white text-pitch-black hover:bg-creator-pink/20'
            }`}
          >
            <span className={active ? 'text-creator-pink' : 'text-stone-500'}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`text-[10px] uppercase font-mono tracking-wider ${active ? 'text-creator-pink' : 'text-stone-400'}`}>
              {tab.tag}
            </span>
            {tab.id === 'events' && unacked > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-creator-pink text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                {unacked}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
