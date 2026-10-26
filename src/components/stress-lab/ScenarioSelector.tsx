import React from 'react';
import type { StressScenarioId } from './types';
import { SCENARIO_DEFINITIONS } from './ScenarioSimulator';
import {
  Radio,
  Compass,
  AlertTriangle,
  Flame,
  Target
} from 'lucide-react';

interface ScenarioSelectorProps {
  selectedId: StressScenarioId;
  onSelectScenario: (id: StressScenarioId) => void;
  isRunning: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedId,
  onSelectScenario,
  isRunning
}) => {
  const scenarioKeys: StressScenarioId[] = [
    'signal-fade',
    'unexpected-motion',
    'alert-surge',
    'combined-failure'
  ];

  const getIcon = (id: StressScenarioId) => {
    switch (id) {
      case 'signal-fade':
        return <Radio className="w-5 h-5 text-indigo-600" />;
      case 'unexpected-motion':
        return <Compass className="w-5 h-5 text-creator-pink" />;
      case 'alert-surge':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'combined-failure':
        return <Flame className="w-5 h-5 text-rose-600" />;
    }
  };

  const getDifficultyBadge = (diff: 'Routine' | 'Challenging' | 'Degraded') => {
    switch (diff) {
      case 'Routine':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Challenging':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Degraded':
        return 'bg-rose-100 text-rose-900 border-rose-300';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-extrabold text-sm text-pitch-black uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 text-creator-pink" />
          <span>Select Stress Test Scenario</span>
        </h4>
        <span className="text-[10px] font-mono text-ink-500">
          4 Core Stress Regimes Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarioKeys.map((id) => {
          const scn = SCENARIO_DEFINITIONS[id];
          const isSelected = selectedId === id;

          return (
            <button
              key={id}
              onClick={() => {
                if (isRunning) {
                  const confirmChange = window.confirm(
                    'A stress test is currently running. Switching scenarios will reset the active test run. Proceed?'
                  );
                  if (!confirmChange) return;
                }
                onSelectScenario(id);
              }}
              className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-white border-pitch-black shadow-[4px_4px_0px_#0D0D0D] ring-2 ring-pitch-black'
                  : 'bg-white/90 hover:bg-white border-pitch-black/30 shadow-[1.5px_1.5px_0px_#0D0D0D] hover:shadow-[3px_3px_0px_#0D0D0D]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="p-2 rounded-xl bg-surface-1 border border-pitch-black/20">
                    {getIcon(id)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-ink-400">
                      {scn.tag}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${getDifficultyBadge(scn.difficulty)}`}>
                      {scn.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <h5 className="font-display font-extrabold text-sm text-pitch-black tracking-tight">
                    {scn.name}
                  </h5>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-creator-pink animate-ping" />
                  )}
                </div>

                <p className="text-2xs text-ink-600 font-sans mt-1.5 line-clamp-2 leading-snug">
                  {scn.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border-subtle text-[10px] font-mono text-ink-500">
                <span className="font-bold text-pitch-black">Tests: </span>
                <span className="truncate">{scn.testedAspect}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
