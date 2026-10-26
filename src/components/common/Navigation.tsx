import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { ActiveTab } from '../../types/telemetry';
import { Radar, AlertTriangle, BarChart3, FileText } from 'lucide-react';

const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; tag: string }[] = [
  { id: 'overview',  label: 'Live Airspace', icon: <Radar className="w-4 h-4" />,        tag: '01' },
  { id: 'events',    label: 'Incident Log',  icon: <AlertTriangle className="w-4 h-4" />, tag: '02' },
  { id: 'analytics', label: 'Telemetry',     icon: <BarChart3 className="w-4 h-4" />,     tag: '03' },
  { id: 'reports',   label: 'Dossier',       icon: <FileText className="w-4 h-4" />,      tag: '04' },
];

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, events } = useAirspace();
  const unacked = events.filter(e => !e.acknowledged && (e.severity === 'CRITICAL' || e.severity === 'WARNING')).length;

  return (
    <nav className="flex items-center gap-2 px-4 md:px-8 py-2.5 bg-white border-b border-border flex-shrink-0 overflow-x-auto">
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              active
                ? 'bg-accent-cyan text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span className={active ? 'text-white' : 'text-stone-400'}>{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
            <span className={`text-[10px] uppercase font-mono tracking-wider ${active ? 'text-indigo-200' : 'text-stone-400'}`}>
              {tab.tag}
            </span>
            {tab.id === 'events' && unacked > 0 && (
              <span className={`ml-1 px-1.5 py-px rounded-full text-2xs font-bold ${
                active ? 'bg-white text-indigo-600' : 'bg-rose-100 text-rose-700'
              }`}>
                {unacked}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
