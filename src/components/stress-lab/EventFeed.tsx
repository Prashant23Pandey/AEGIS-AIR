import React, { useState } from 'react';
import type { StressEvent, EventCategory } from './types';
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';

interface EventFeedProps {
  events: StressEvent[];
  onAcknowledgeAlert?: (eventId: string) => void;
}

export const EventFeed: React.FC<EventFeedProps> = ({ events, onAcknowledgeAlert }) => {
  const [filter, setFilter] = useState<EventCategory | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.category === filter;
  });

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />;
      case 'RECOVERY':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />;
    }
  };

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'WARNING':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'RECOVERY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden flex flex-col h-full">
      {/* Feed Header */}
      <div className="px-4 py-3 border-b border-pitch-black bg-surface-0 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-creator-pink" />
          <h4 className="font-display font-extrabold text-sm text-pitch-black tracking-tight">
            Deterministic Event Feed
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            {events.length} LOGGED
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1">
          {(['ALL', 'DATA_QUALITY', 'KINEMATIC', 'ALERT_SURGE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                filter === cat
                  ? 'bg-pitch-black text-white'
                  : 'bg-white text-pitch-black hover:bg-surface-2 border border-pitch-black/20'
              }`}
            >
              {cat === 'ALL'
                ? 'All'
                : cat === 'DATA_QUALITY'
                ? 'Data Quality'
                : cat === 'KINEMATIC'
                ? 'Kinematics'
                : 'Surge Alerts'}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="flex-1 divide-y divide-border-subtle overflow-y-auto max-h-[360px] p-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-500">
            No events logged yet. Start the stress test to observe deterministic events.
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isExpanded = expandedId === e.id;
            return (
              <div
                key={e.id}
                className={`p-3 transition-colors ${
                  e.acknowledged ? 'bg-stone-50/60 opacity-80' : 'hover:bg-surface-1'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5">{severityIcon(e.severity)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-2xs font-mono font-bold text-ink-500 bg-surface-2 px-1.5 py-0.5 rounded">
                          [{e.timeFormatted}]
                        </span>
                        <span className="text-xs font-display font-bold text-pitch-black truncate">
                          {e.title}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border ${severityBadge(e.severity)}`}>
                          {e.severity}
                        </span>
                        {e.trackId && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                            {e.trackId}
                          </span>
                        )}
                        {e.acknowledged && (
                          <span className="text-[9px] font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Triaged
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-ink-700 font-sans mt-1 leading-snug">
                        {e.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {onAcknowledgeAlert && !e.acknowledged && e.severity !== 'INFO' && (
                      <button
                        onClick={() => onAcknowledgeAlert(e.id)}
                        className="btn-pop px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white hover:bg-lime-glow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] transition-colors"
                        title="Acknowledge and mark triaged"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : e.id)}
                      className="p-1 text-ink-500 hover:text-pitch-black rounded transition-colors"
                      title="Inspect sensor evidence"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Evidence Drawer */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-pitch-black/20 text-2xs font-mono bg-stone-50 p-2.5 rounded-xl space-y-1">
                    <div className="font-bold text-pitch-black flex items-center gap-1">
                      <Zap className="w-3 h-3 text-creator-pink" />
                      <span>TELEMETRY & HEURISTIC EVIDENCE:</span>
                    </div>
                    <div className="text-ink-700">{e.evidence}</div>
                    <div className="text-[9px] text-ink-400">
                      Category: {e.category} · Event ID: {e.id} · Log Source: Deterministic Scenario Engine
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
