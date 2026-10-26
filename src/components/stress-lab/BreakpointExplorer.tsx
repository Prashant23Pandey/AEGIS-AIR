import React, { useState } from 'react';
import type { BreakpointNode } from './types';
import {
  GitCommit,
  ShieldAlert,
  HelpCircle,
  Activity
} from 'lucide-react';

interface BreakpointExplorerProps {
  breakpoints: BreakpointNode[];
  currentSimTimeSec: number;
}

export const BreakpointExplorer: React.FC<BreakpointExplorerProps> = ({
  breakpoints,
  currentSimTimeSec
}) => {
  // Default to selecting the most recent active breakpoint, or the first one
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const activeNode =
    breakpoints.find((b) => b.id === selectedNodeId) ||
    [...breakpoints].reverse().find((b) => b.simTimeSec <= currentSimTimeSec) ||
    breakpoints[0];

  const stateBadgeColor = (state: string) => {
    switch (state) {
      case 'NORMAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-400';
      case 'DEGRADED':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'CRITICAL':
        return 'bg-red-100 text-red-900 border-red-500';
      case 'RECOVERING':
        return 'bg-sky-100 text-sky-800 border-sky-400';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-400';
    }
  };

  return (
    <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-pitch-black gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-creator-pink text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
              <GitCommit className="w-4 h-4" />
            </span>
            <h3 className="font-display font-extrabold text-lg text-pitch-black tracking-tight">
              THE BREAKPOINT — Where Did Reliability Drop?
            </h3>
          </div>
          <p className="text-2xs text-ink-500 font-mono mt-0.5">
            Interactive cause-and-effect timeline: Click any transition node to inspect system metrics and evidence at that moment.
          </p>
        </div>
        <div className="flex items-center gap-2 text-2xs font-mono font-bold">
          <span className="px-2.5 py-1 rounded-full bg-surface-2 text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            POST-RUN EXPLORER
          </span>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        {breakpoints.map((node) => {
          const isSelected = activeNode?.id === node.id;
          const isPast = node.simTimeSec <= currentSimTimeSec;

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-pitch-black text-white border-pitch-black shadow-[3px_3px_0px_#FF2E93]'
                  : isPast
                  ? 'bg-surface-0 hover:bg-surface-1 border-pitch-black/30 shadow-xs'
                  : 'bg-stone-50/50 opacity-60 border-stone-200 hover:opacity-90'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-creator-pink text-pitch-black' : 'bg-surface-2 text-ink-600'
                }`}>
                  [{node.timeLabel}]
                </span>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${stateBadgeColor(node.state)}`}>
                  {node.state}
                </span>
              </div>
              <div className="text-xs font-display font-bold leading-snug truncate">
                {node.title}
              </div>
              <p className={`text-[10px] line-clamp-2 mt-1 leading-snug ${
                isSelected ? 'text-slate-300' : 'text-ink-500'
              }`}>
                {node.shortSummary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detailed Selected Node Inspection Pane */}
      {activeNode && (
        <div className="rounded-xl border border-pitch-black bg-surface-0 p-4 sm:p-5 space-y-3 shadow-[1.5px_1.5px_0px_#0D0D0D]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pitch-black/15 pb-2.5">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${stateBadgeColor(activeNode.state)}`}>
                {activeNode.state}
              </span>
              <h4 className="font-display font-extrabold text-base text-pitch-black tracking-tight">
                {activeNode.title}
              </h4>
              <span className="text-2xs font-mono text-ink-500">
                Timestamp: T+{activeNode.timeLabel}
              </span>
            </div>
            <div className="text-2xs font-mono text-ink-600 font-bold bg-white px-2.5 py-1 rounded-md border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
              Node {breakpoints.findIndex((b) => b.id === activeNode.id) + 1} of {breakpoints.length}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 space-y-2">
              <div className="text-xs font-mono font-bold text-pitch-black flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-creator-pink" />
                <span>WHY DID THE SYSTEM BEHAVE THIS WAY?</span>
              </div>
              <p className="text-xs text-ink-800 font-sans leading-relaxed bg-white p-3 rounded-xl border border-pitch-black/15">
                {activeNode.detailedExplanation}
              </p>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-mono text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reliability Impact: </span>
                  <span>{activeNode.reliabilityImpact}</span>
                </div>
              </div>
            </div>

            {/* Evidence Metric Snapshot */}
            <div className="lg:col-span-5 space-y-2">
              <div className="text-xs font-mono font-bold text-pitch-black flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>SENSOR & METRIC SNAPSHOT</span>
              </div>
              <div className="bg-white rounded-xl border border-pitch-black overflow-hidden shadow-xs divide-y divide-border-subtle">
                {activeNode.evidenceData.map((ev, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between text-2xs font-mono">
                    <span className="text-ink-600 font-semibold">{ev.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pitch-black">{ev.value}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                        ev.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.status === 'WARN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
