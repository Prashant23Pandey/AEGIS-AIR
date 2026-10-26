import React, { useState } from 'react';
import type { ScenarioConfig, StressScenarioId } from './types';
import { DEFAULT_CONFIGS } from './ScenarioSimulator';
import { Sliders, RotateCcw, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ScenarioConfigPanelProps {
  scenarioId: StressScenarioId;
  config: ScenarioConfig;
  onChangeConfig: (newConfig: ScenarioConfig) => void;
  isRunning: boolean;
}

export const ScenarioConfigPanel: React.FC<ScenarioConfigPanelProps> = ({
  scenarioId,
  config,
  onChangeConfig,
  isRunning
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleResetDefaults = () => {
    onChangeConfig({ ...DEFAULT_CONFIGS[scenarioId] });
  };

  return (
    <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 bg-surface-0 flex items-center justify-between hover:bg-surface-1 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-creator-pink" />
          <span className="font-display font-extrabold text-sm text-pitch-black tracking-tight">
            Scenario Settings & Parameters
          </span>
          <span className="text-[10px] font-mono text-ink-500 font-normal">
            (Duration: {config.durationSec}s · Delay: {config.telemetryDelaySeverity} · Variation: ±{config.movementVariationDeg}°)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold text-ink-500">
            {isOpen ? 'COLLAPSE' : 'EXPAND'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-pitch-black" /> : <ChevronDown className="w-4 h-4 text-pitch-black" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-pitch-black bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Duration */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-pitch-black">
                <span>Simulation Duration</span>
                <span>{config.durationSec} seconds</span>
              </div>
              <input
                type="range"
                min={15}
                max={45}
                step={1}
                value={config.durationSec}
                disabled={isRunning}
                onChange={(e) =>
                  onChangeConfig({ ...config, durationSec: parseInt(e.target.value, 10) })
                }
                className="w-full accent-creator-pink cursor-pointer disabled:opacity-50"
              />
              <p className="text-[10px] text-ink-500 font-sans">
                Length of the stress scenario timeline (15s to 45s).
              </p>
            </div>

            {/* 2. Delay Severity */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-pitch-black">
                <span>Telemetry Delay Severity</span>
                <span className="uppercase">{config.telemetryDelaySeverity}</span>
              </div>
              <div className="flex rounded-lg border border-pitch-black bg-surface-1 p-0.5 shadow-xs">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    disabled={isRunning}
                    onClick={() => onChangeConfig({ ...config, telemetryDelaySeverity: sev })}
                    className={`flex-1 py-1 rounded text-2xs font-mono font-bold transition-all disabled:opacity-50 ${
                      config.telemetryDelaySeverity === sev
                        ? 'bg-pitch-black text-white'
                        : 'text-pitch-black hover:bg-surface-2'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-ink-500 font-sans">
                Controls simulated RF packet lag and jitter magnitude.
              </p>
            </div>

            {/* 3. Movement Variation (Degrees) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-pitch-black">
                <span>Kinematic Variation Angle</span>
                <span>±{config.movementVariationDeg}°</span>
              </div>
              <input
                type="range"
                min={30}
                max={120}
                step={5}
                value={config.movementVariationDeg}
                disabled={isRunning}
                onChange={(e) =>
                  onChangeConfig({ ...config, movementVariationDeg: parseInt(e.target.value, 10) })
                }
                className="w-full accent-creator-pink cursor-pointer disabled:opacity-50"
              />
              <p className="text-[10px] text-ink-500 font-sans">
                Magnitude of the simulated lateral vector maneuver.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-dashed border-pitch-black/20 text-xs font-mono">
            <span className="text-ink-500 flex items-center gap-1.5 text-2xs">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              Settings modify only the isolated stress lab without altering the live dashboard.
            </span>
            <button
              type="button"
              disabled={isRunning}
              onClick={handleResetDefaults}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-2xs font-mono font-bold bg-white hover:bg-surface-2 text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
