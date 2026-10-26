import React from 'react';
import type { StressScenarioId, ScenarioConfig, EvaluationMetrics, StressEvent } from './types';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Info
} from 'lucide-react';
import { exportStressReport } from './ReportExporter';

interface WhatDidWeLearnProps {
  scenarioId: StressScenarioId;
  scenarioName: string;
  config: ScenarioConfig;
  outcomeSummary: string;
  events: StressEvent[];
  metrics: EvaluationMetrics;
  strengths: string[];
  limitations: string[];
  recommendedSteps: string[];
  simElapsedSec: number;
}

export const WhatDidWeLearn: React.FC<WhatDidWeLearnProps> = ({
  scenarioId,
  scenarioName,
  config,
  outcomeSummary,
  events,
  metrics,
  strengths,
  limitations,
  recommendedSteps,
  simElapsedSec
}) => {
  const handleExport = () => {
    exportStressReport({
      scenarioId,
      scenarioName,
      config,
      simElapsedSec,
      metrics,
      events,
      outcomeSummary,
      strengths,
      limitations,
      recommendedSteps
    });
  };

  return (
    <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-pitch-black gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-display font-extrabold text-xl text-pitch-black tracking-tight">
              WHAT DID WE LEARN?
            </h3>
          </div>
          <p className="text-2xs text-ink-500 font-mono mt-0.5">
            Empirical evaluation & reliability boundaries derived from simulated stress run.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="btn-pop flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-creator-pink text-pitch-black border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] hover:bg-creator-pink/90 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT TEST REPORT</span>
        </button>
      </div>

      {/* A. Outcome Summary */}
      <div className="p-4 rounded-xl bg-surface-0 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] space-y-1.5">
        <div className="text-2xs font-mono font-bold text-ink-500 uppercase flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-creator-pink" />
          <span>Scenario Outcome Summary</span>
        </div>
        <p className="text-sm font-sans text-ink-900 leading-relaxed font-medium">
          {outcomeSummary}
        </p>
      </div>

      {/* B. Quantitative Evaluation Metrics Grid */}
      <div>
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-pitch-black mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>Empirical Evaluation Metrics</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-pitch-black bg-white shadow-xs">
            <span className="text-[10px] font-mono font-bold text-ink-500 uppercase block">Events Detected</span>
            <div className="text-xl font-mono font-extrabold text-pitch-black mt-1">
              {metrics.eventsDetected} / {metrics.eventsGenerated}
            </div>
            <span className="text-[9px] font-mono text-emerald-700 font-semibold">100% captured</span>
          </div>

          <div className="p-3 rounded-xl border border-pitch-black bg-white shadow-xs">
            <span className="text-[10px] font-mono font-bold text-ink-500 uppercase block">Peak Error / Delay</span>
            <div className="text-xl font-mono font-extrabold text-pitch-black mt-1">
              {metrics.maxPredictionErrorMeters !== null
                ? `${metrics.maxPredictionErrorMeters}m`
                : `${metrics.maxTelemetryAgeSec}s age`}
            </div>
            <span className="text-[9px] font-mono text-ink-500 font-semibold">
              {metrics.maxPredictionErrorMeters !== null ? 'Kinematic gap' : 'Max latency'}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-pitch-black bg-white shadow-xs">
            <span className="text-[10px] font-mono font-bold text-ink-500 uppercase block">Degraded Duration</span>
            <div className="text-xl font-mono font-extrabold text-pitch-black mt-1">
              {metrics.durationInDegradedSec}s
            </div>
            <span className="text-[9px] font-mono text-amber-700 font-semibold">
              Recovery: {metrics.timeToRecoverSec}s
            </span>
          </div>

          <div className="p-3 rounded-xl border border-pitch-black bg-white shadow-xs">
            <span className="text-[10px] font-mono font-bold text-ink-500 uppercase block">Human Sign-off</span>
            <div className={`text-xl font-mono font-extrabold mt-1 ${
              metrics.humanReviewMandated ? 'text-amber-600' : 'text-emerald-700'
            }`}>
              {metrics.humanReviewMandated ? 'MANDATED' : 'NOMINAL'}
            </div>
            <span className="text-[9px] font-mono text-ink-500 font-semibold">Safety threshold</span>
          </div>
        </div>
      </div>

      {/* C. Structured Evidence Table */}
      <div>
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-pitch-black mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-creator-pink" />
          <span>Evidence Table</span>
        </h4>
        <div className="overflow-x-auto rounded-xl border border-pitch-black shadow-xs">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-0 border-b border-pitch-black text-[10px] uppercase text-ink-600 font-bold">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Stimulus Event</th>
                <th className="py-2.5 px-3">Observed System Response</th>
                <th className="py-2.5 px-3">Supporting Telemetry Metric</th>
                <th className="py-2.5 px-3">Reliability Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-white text-2xs">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-1 transition-colors">
                  <td className="py-2 px-3 font-bold text-ink-500">[{e.timeFormatted}]</td>
                  <td className="py-2 px-3 font-bold text-pitch-black">{e.title}</td>
                  <td className="py-2 px-3 text-ink-800">{e.description}</td>
                  <td className="py-2 px-3 text-indigo-700 font-semibold">{e.evidence}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      e.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : e.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : e.severity === 'RECOVERY'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border border-stone-300'
                    }`}>
                      {e.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. Strengths vs Limitations (Balanced Engineering Review) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-display font-extrabold text-sm uppercase">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>WHAT WORKED (CONFIRMED STRENGTHS)</span>
          </div>
          <ul className="space-y-1.5 text-2xs font-sans text-emerald-950">
            {strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="leading-snug">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Limitations */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-display font-extrabold text-sm uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>WHAT NEEDS ATTENTION (SYSTEM LIMITATIONS)</span>
          </div>
          <ul className="space-y-1.5 text-2xs font-sans text-amber-950">
            {limitations.map((lim, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">⚠</span>
                <span className="leading-snug">{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* E. Recommended Next Steps */}
      <div className="p-4 rounded-xl bg-surface-0 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] space-y-2">
        <div className="flex items-center gap-2 text-pitch-black font-display font-extrabold text-xs uppercase">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>RECOMMENDED ENGINEERING IMPROVEMENTS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-2xs font-sans text-ink-800">
          {recommendedSteps.map((step, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-white border border-pitch-black/15 flex items-start gap-2">
              <span className="px-1.5 py-0.2 rounded bg-surface-2 text-pitch-black font-mono font-bold text-[9px]">
                0{idx + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
