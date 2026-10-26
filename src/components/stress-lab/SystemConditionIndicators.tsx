import React from 'react';
import type { StressScenarioId, SystemHealthState } from './types';
import {
  Clock,
  AlertTriangle,
  Compass,
  Radio,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface SystemConditionIndicatorsProps {
  scenarioId: StressScenarioId;
  healthState: SystemHealthState;
  telemetryFreshnessSec: number;
  observationCompletenessPercent: number;
  predictionErrorMeters: number | null;
  confidenceStatus: 'HIGH' | 'DEGRADED' | 'LOW' | 'RECOVERING';
  humanReviewMandated: boolean;
  activeAlertCount: number;
  simTimeSec: number;
}

export const SystemConditionIndicators: React.FC<SystemConditionIndicatorsProps> = ({
  scenarioId,
  healthState,
  telemetryFreshnessSec,
  observationCompletenessPercent,
  predictionErrorMeters,
  confidenceStatus,
  humanReviewMandated,
  activeAlertCount,
  simTimeSec
}) => {
  // Freshness status badge
  const freshnessStatus =
    telemetryFreshnessSec < 1.5
      ? { label: 'CURRENT', color: 'bg-emerald-100 text-emerald-800 border-emerald-400' }
      : telemetryFreshnessSec < 4.0
      ? { label: 'DELAYED', color: 'bg-amber-100 text-amber-900 border-amber-400' }
      : { label: 'STALE', color: 'bg-red-100 text-red-900 border-red-500' };

  // Confidence status badge
  const confidenceColor =
    confidenceStatus === 'HIGH'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
      : confidenceStatus === 'RECOVERING'
      ? 'bg-sky-100 text-sky-800 border-sky-400'
      : confidenceStatus === 'DEGRADED'
      ? 'bg-amber-100 text-amber-900 border-amber-400'
      : 'bg-red-100 text-red-900 border-red-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-extrabold text-sm text-pitch-black uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-creator-pink" />
          <span>System Condition Indicators</span>
        </h4>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-surface-2 text-pitch-black border border-pitch-black/20">
            STATE: {healthState}
          </span>
          <span className="text-[10px] font-mono text-ink-500">
            T+{simTimeSec.toFixed(1)}s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Indicator 1: Telemetry Freshness */}
        {(scenarioId === 'signal-fade' || scenarioId === 'combined-failure' || scenarioId === 'alert-surge') && (
          <div className="pop-card bg-white p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2">
              <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Telemetry Freshness
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${freshnessStatus.color}`}>
                {freshnessStatus.label}
              </span>
            </div>
            <div>
              <div className="text-2xl font-mono font-extrabold text-pitch-black leading-none">
                {telemetryFreshnessSec.toFixed(1)}s
              </div>
              <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
                {telemetryFreshnessSec < 1.5
                  ? 'Observation is within nominal 1.0s heartbeat window.'
                  : telemetryFreshnessSec < 4.0
                  ? 'Update delayed beyond expected nominal latency (1.5s).'
                  : 'Observation is stale (>5.0s). Kinematic extrapolation unconfirmed.'}
              </p>
            </div>
          </div>
        )}

        {/* Indicator 2: Observation Completeness */}
        {(scenarioId === 'signal-fade' || scenarioId === 'combined-failure') && (
          <div className="pop-card bg-white p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2">
              <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-creator-pink" />
                Stream Completeness
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                observationCompletenessPercent > 80
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  : observationCompletenessPercent > 50
                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                  : 'bg-red-100 text-red-900 border-red-500'
              }`}>
                {observationCompletenessPercent}%
              </span>
            </div>
            <div>
              <div className="text-2xl font-mono font-extrabold text-pitch-black leading-none">
                {observationCompletenessPercent}%
              </div>
              <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
                {observationCompletenessPercent === 100
                  ? 'Zero dropped frames. Continuous sequential packet arrival.'
                  : 'Packet drop observed. Signal loss does not imply hostile intent.'}
              </p>
            </div>
          </div>
        )}

        {/* Indicator 3: Prediction Divergence Error (Unexpected Motion & Combined Failure) */}
        {(scenarioId === 'unexpected-motion' || scenarioId === 'combined-failure') && (
          <div className="pop-card bg-white p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2">
              <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                Prediction Error
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                predictionErrorMeters === null
                  ? 'bg-stone-100 text-stone-600 border-stone-300'
                  : predictionErrorMeters < 50
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  : predictionErrorMeters < 300
                  ? 'bg-amber-100 text-amber-900 border-amber-400'
                  : 'bg-red-100 text-red-900 border-red-500'
              }`}>
                {predictionErrorMeters === null ? 'UNAVAILABLE' : predictionErrorMeters < 50 ? 'ACCURATE' : 'DIVERGED'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-mono font-extrabold text-pitch-black leading-none">
                {predictionErrorMeters !== null ? `${predictionErrorMeters} m` : '—'}
              </div>
              <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
                {predictionErrorMeters === null
                  ? 'Ground-truth comparison unavailable during signal dropout.'
                  : predictionErrorMeters < 50
                  ? 'Linear extrapolation matches observed vector within ±50m.'
                  : 'Divergence error exceeds threshold after sharp maneuver.'}
              </p>
            </div>
          </div>
        )}

        {/* Indicator 4: Model Confidence / Reliability */}
        <div className="pop-card bg-white p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-sunshine-yellow" />
              Model Reliability
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${confidenceColor}`}>
              {confidenceStatus}
            </span>
          </div>
          <div>
            <div className="text-2xl font-mono font-extrabold text-pitch-black leading-none">
              {confidenceStatus}
            </div>
            <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
              {confidenceStatus === 'HIGH'
                ? 'High mathematical confidence in tracking and extrapolation.'
                : confidenceStatus === 'DEGRADED'
                ? 'Confidence downgraded: observational or kinematic limits reached.'
                : confidenceStatus === 'LOW'
                ? 'Model limits reached: predictions suspended until sensor re-lock.'
                : 'Sensor telemetry re-established. Tracking filter re-converging.'}
            </p>
          </div>
        </div>

        {/* Indicator 5: Alert Queue Depth (Alert Surge) */}
        {scenarioId === 'alert-surge' && (
          <div className="pop-card bg-white p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1 mb-2">
              <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-creator-pink" />
                Active Alert Queue
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                DEDUPLICATED
              </span>
            </div>
            <div>
              <div className="text-2xl font-mono font-extrabold text-pitch-black leading-none">
                {activeAlertCount} <span className="text-xs font-normal text-ink-500">pending</span>
              </div>
              <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
                Prioritized queue: Critical incursion events elevated above secondary warnings.
              </p>
            </div>
          </div>
        )}

        {/* Indicator 6: Human Review Mandate */}
        <div className={`pop-card p-3.5 rounded-xl border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex flex-col justify-between transition-colors ${
          humanReviewMandated ? 'bg-amber-50 border-amber-600' : 'bg-white'
        }`}>
          <div className="flex items-start justify-between gap-1 mb-2">
            <span className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1">
              <ShieldAlert className={`w-3.5 h-3.5 ${humanReviewMandated ? 'text-amber-600' : 'text-stone-400'}`} />
              Human Review Gate
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
              humanReviewMandated
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-emerald-100 text-emerald-800 border-emerald-400'
            }`}>
              {humanReviewMandated ? 'REQUIRED' : 'AUTONOMOUS'}
            </span>
          </div>
          <div>
            <div className={`text-xl font-mono font-extrabold leading-none ${humanReviewMandated ? 'text-amber-900' : 'text-pitch-black'}`}>
              {humanReviewMandated ? 'HUMAN SIGN-OFF' : 'SUPERVISED AUTO'}
            </div>
            <p className="text-2xs text-ink-500 font-sans mt-1.5 leading-snug">
              {humanReviewMandated
                ? 'Uncertainty exceeds safety threshold. Automation cannot authorize engagement.'
                : 'Telemetry and kinematic confidence allow nominal automated vectoring.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
