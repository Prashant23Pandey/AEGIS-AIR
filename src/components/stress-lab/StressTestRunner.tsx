import React from 'react';
import type { ScenarioStatus } from './types';
import {
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface StressTestRunnerProps {
  status: ScenarioStatus;
  simTimeSec: number;
  durationSec: number;
  speed: number; // 1, 2, 4
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onReplay: () => void;
  onChangeSpeed: (speed: number) => void;
}

export const StressTestRunner: React.FC<StressTestRunnerProps> = ({
  status,
  simTimeSec,
  durationSec,
  speed,
  onRun,
  onPause,
  onResume,
  onReset,
  onReplay,
  onChangeSpeed
}) => {
  const progressPercent = Math.min(100, Math.round((simTimeSec / durationSec) * 100));

  return (
    <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Status & Progress Info */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
            status === 'RUNNING'
              ? 'bg-lime-glow text-pitch-black border-pitch-black shadow-[1px_1px_0px_#0D0D0D] animate-pulse'
              : status === 'PAUSED'
              ? 'bg-sunshine-yellow text-pitch-black border-pitch-black'
              : status === 'COMPLETED'
              ? 'bg-creator-pink text-pitch-black border-pitch-black shadow-[1px_1px_0px_#0D0D0D]'
              : 'bg-surface-2 text-ink-700 border-pitch-black/20'
          }`}>
            {status}
          </span>
          <div className="text-xs font-mono font-bold text-pitch-black flex items-center gap-1.5">
            <span className="text-ink-500">SIM CLOCK:</span>
            <span className="text-sm text-pitch-black">
              {simTimeSec.toFixed(1)}s / {durationSec.toFixed(1)}s
            </span>
            <span className="text-ink-400">({progressPercent}%)</span>
          </div>
        </div>

        {/* Tactical Progress Bar */}
        <div className="w-full bg-surface-2 rounded-full h-2.5 border border-pitch-black overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-creator-pink via-sunshine-yellow to-lime-glow transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Control Buttons Group */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Speed Multiplier Toggle */}
        <div className="flex items-center rounded-full border border-pitch-black bg-surface-1 p-0.5 shadow-[1.5px_1.5px_0px_#0D0D0D]">
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2.5 py-1 rounded-full text-2xs font-mono font-bold transition-all cursor-pointer ${
                speed === s
                  ? 'bg-pitch-black text-white shadow-xs'
                  : 'text-pitch-black hover:bg-surface-2'
              }`}
              title={`Simulation speed: ${s}x`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Primary Action Button */}
        {status === 'READY' && (
          <button
            onClick={onRun}
            className="btn-pop flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-lime-glow text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] hover:bg-lime-glow/90 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-pitch-black" />
            <span>RUN STRESS TEST</span>
          </button>
        )}

        {status === 'RUNNING' && (
          <button
            onClick={onPause}
            className="btn-pop flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] hover:bg-sunshine-yellow/90 transition-all cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-pitch-black" />
            <span>PAUSE</span>
          </button>
        )}

        {status === 'PAUSED' && (
          <button
            onClick={onResume}
            className="btn-pop flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-lime-glow text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] hover:bg-lime-glow/90 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-pitch-black" />
            <span>RESUME</span>
          </button>
        )}

        {status === 'COMPLETED' && (
          <button
            onClick={onReplay}
            className="btn-pop flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono font-bold bg-creator-pink text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] hover:bg-creator-pink/90 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REPLAY SCENARIO</span>
          </button>
        )}

        {/* Reset Button */}
        {(status === 'RUNNING' || status === 'PAUSED' || status === 'COMPLETED') && (
          <button
            onClick={onReset}
            className="btn-pop flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-mono font-bold bg-white hover:bg-surface-2 text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] transition-all cursor-pointer"
            title="Reset scenario state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        )}
      </div>
    </div>
  );
};
