import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  StressScenarioId,
  ScenarioStatus,
  ScenarioConfig
} from './types';
import {
  SCENARIO_DEFINITIONS,
  DEFAULT_CONFIGS,
  computeScenarioFrame,
  type ScenarioFrameState
} from './ScenarioSimulator';
import { ScenarioSelector } from './ScenarioSelector';
import { ScenarioConfigPanel } from './ScenarioConfigPanel';
import { StressTestRunner } from './StressTestRunner';
import { TestBenchVisualization } from './TestBenchVisualization';
import { SystemConditionIndicators } from './SystemConditionIndicators';
import { EventFeed } from './EventFeed';
import { BreakpointExplorer } from './BreakpointExplorer';
import { WhatDidWeLearn } from './WhatDidWeLearn';
import {
  Flame,
  ShieldCheck
} from 'lucide-react';

export const ScenarioStressLab: React.FC = () => {
  // 1. Scenario Selection & Config State
  const [selectedScenarioId, setSelectedScenarioId] = useState<StressScenarioId>('signal-fade');
  const [configs, setConfigs] = useState<Record<StressScenarioId, ScenarioConfig>>(DEFAULT_CONFIGS);

  // 2. Runner & Simulation Clock State
  const [status, setStatus] = useState<ScenarioStatus>('READY');
  const [simTimeSec, setSimTimeSec] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [acknowledgedEventIds, setAcknowledgedEventIds] = useState<Set<string>>(new Set());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const activeConfig = configs[selectedScenarioId];
  const activeDef = SCENARIO_DEFINITIONS[selectedScenarioId];

  // 3. Compute Current Deterministic Frame
  const frame: ScenarioFrameState = computeScenarioFrame(
    selectedScenarioId,
    activeConfig,
    simTimeSec,
    acknowledgedEventIds
  );

  // Set default selected track if none selected
  useEffect(() => {
    if (frame.tracks.length > 0 && !selectedTrackId) {
      setSelectedTrackId(frame.tracks[0].id);
    }
  }, [frame.tracks, selectedTrackId]);

  // 4. Deterministic Simulation Clock Loop
  const timerRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleRun = useCallback(() => {
    setStatus('RUNNING');
  }, []);

  const handlePause = useCallback(() => {
    setStatus('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    setStatus('RUNNING');
  }, []);

  const handleReset = useCallback(() => {
    stopTimer();
    setStatus('READY');
    setSimTimeSec(0);
    setAcknowledgedEventIds(new Set());
  }, [stopTimer]);

  const handleReplay = useCallback(() => {
    stopTimer();
    setSimTimeSec(0);
    setAcknowledgedEventIds(new Set());
    setStatus('RUNNING');
  }, [stopTimer]);

  // Clock progression effect
  useEffect(() => {
    if (status !== 'RUNNING') {
      stopTimer();
      return;
    }

    const tickIntervalMs = 100; // 10 ticks per second
    timerRef.current = window.setInterval(() => {
      setSimTimeSec((prev) => {
        const next = prev + (tickIntervalMs / 1000) * speed;
        if (next >= activeConfig.durationSec) {
          setStatus('COMPLETED');
          stopTimer();
          return activeConfig.durationSec;
        }
        return next;
      });
    }, tickIntervalMs);

    return () => {
      stopTimer();
    };
  }, [status, speed, activeConfig.durationSec, stopTimer]);

  // Clean teardown when unmounting
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  // Handle switching scenario safely
  const handleSelectScenario = (id: StressScenarioId) => {
    stopTimer();
    setSelectedScenarioId(id);
    setStatus('READY');
    setSimTimeSec(0);
    setAcknowledgedEventIds(new Set());
    setSelectedTrackId(null);
  };

  const handleConfigChange = (newConfig: ScenarioConfig) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedScenarioId]: newConfig
    }));
  };

  const handleAcknowledgeAlert = (eventId: string) => {
    setAcknowledgedEventIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
  };

  return (
    <div className="scenario-stress-lab space-y-6 text-pitch-black selection:bg-creator-pink selection:text-pitch-black">
      {/* A. Page Header */}
      <div className="pop-card bg-white rounded-2xl border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold uppercase bg-creator-pink text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-pitch-black fill-pitch-black" />
                <span>BREAK THE SYSTEM</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-mono font-bold uppercase bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D]">
                SIMULATION MODE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-surface-2 text-ink-700 border border-pitch-black/20">
                OFFLINE BENCH
              </span>
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-pitch-black tracking-tight leading-none pt-1">
              Scenario Stress Lab
            </h2>

            <p className="text-xs sm:text-sm text-ink-700 font-sans leading-relaxed">
              Push simulated conditions beyond normal operation. Observe what the system detects, how confidence changes, and where human review becomes necessary.
            </p>
          </div>

          {/* Session Status & Metadata Badge */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono font-bold text-ink-500 uppercase">SESSION STATUS:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold uppercase border ${
                status === 'RUNNING'
                  ? 'bg-lime-glow text-pitch-black border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] animate-pulse'
                  : status === 'PAUSED'
                  ? 'bg-sunshine-yellow text-pitch-black border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D]'
                  : status === 'COMPLETED'
                  ? 'bg-creator-pink text-pitch-black border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D]'
                  : 'bg-surface-2 text-ink-700 border-pitch-black/20 shadow-xs'
              }`}>
                {status}
              </span>
            </div>

            <div className="text-2xs font-mono text-ink-500 text-left lg:text-right">
              <div>Active Test: <strong>{activeDef.name}</strong></div>
              <div>Duration: <strong>{activeConfig.durationSec}s</strong> · Speed: <strong>{speed}×</strong></div>
            </div>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className="mt-4 pt-3 border-t border-dashed border-pitch-black/15 flex items-center gap-2 text-2xs font-mono text-ink-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>
            Synthetic reliability harness · Completely isolated from live airspace radar feeds · Zero weapon systems integrated
          </span>
        </div>
      </div>

      {/* B. Scenario Selection Area */}
      <ScenarioSelector
        selectedId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        isRunning={status === 'RUNNING'}
      />

      {/* C. Scenario Configuration Panel (Collapsible) */}
      <ScenarioConfigPanel
        scenarioId={selectedScenarioId}
        config={activeConfig}
        onChangeConfig={handleConfigChange}
        isRunning={status === 'RUNNING'}
      />

      {/* D. Live Test Bench Controls */}
      <StressTestRunner
        status={status}
        simTimeSec={simTimeSec}
        durationSec={activeConfig.durationSec}
        speed={speed}
        onRun={handleRun}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        onReplay={handleReplay}
        onChangeSpeed={setSpeed}
      />

      {/* E. Live Test Bench Interactive Visualization & Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Offline Coordinate Canvas */}
        <div className="lg:col-span-7 flex flex-col">
          <TestBenchVisualization
            tracks={frame.tracks}
            scenarioId={selectedScenarioId}
            predictionErrorMeters={frame.predictionErrorMeters}
            telemetryFreshnessSec={frame.telemetryFreshnessSec}
            isStale={frame.telemetryFreshnessSec > 5.0}
            selectedTrackId={selectedTrackId}
            onSelectTrack={setSelectedTrackId}
          />
        </div>

        {/* Right Column: Dynamic System Condition Indicators & Event Feed */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <SystemConditionIndicators
            scenarioId={selectedScenarioId}
            healthState={frame.healthState}
            telemetryFreshnessSec={frame.telemetryFreshnessSec}
            observationCompletenessPercent={frame.observationCompletenessPercent}
            predictionErrorMeters={frame.predictionErrorMeters}
            confidenceStatus={frame.confidenceStatus}
            humanReviewMandated={frame.humanReviewMandated}
            activeAlertCount={frame.activeAlertCount}
            simTimeSec={simTimeSec}
          />

          <div className="flex-1 min-h-[300px]">
            <EventFeed
              events={frame.activeEvents}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          </div>
        </div>
      </div>

      {/* F. The Breakpoint — Where Did Reliability Drop? */}
      <BreakpointExplorer
        breakpoints={frame.breakpoints}
        currentSimTimeSec={simTimeSec}
      />

      {/* G. What Did We Learn? (Results & Evaluation) */}
      <WhatDidWeLearn
        scenarioId={selectedScenarioId}
        scenarioName={activeDef.name}
        config={activeConfig}
        outcomeSummary={frame.outcomeSummary}
        events={frame.activeEvents}
        metrics={frame.metrics}
        strengths={frame.strengths}
        limitations={frame.limitations}
        recommendedSteps={frame.recommendedSteps}
        simElapsedSec={simTimeSec}
      />
    </div>
  );
};
