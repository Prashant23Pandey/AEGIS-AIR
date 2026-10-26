import type {
  StressScenarioId,
  ScenarioConfig,
  SystemHealthState,
  SimulatedStressTrack,
  StressEvent,
  BreakpointNode,
  EvaluationMetrics
} from './types';

export const SCENARIO_DEFINITIONS: Record<StressScenarioId, {
  name: string;
  tag: string;
  difficulty: 'Routine' | 'Challenging' | 'Degraded';
  description: string;
  testedAspect: string;
  defaultDurationSec: number;
  keyHypothesis: string;
}> = {
  'signal-fade': {
    name: 'SIGNAL FADE',
    tag: 'SCN-01',
    difficulty: 'Challenging',
    description: 'Simulate intermittent telemetry updates and observe how the system responds when information becomes incomplete.',
    testedAspect: 'Telemetry Freshness, Stale Data Marking & Autonomous Recovery',
    defaultDurationSec: 24,
    keyHypothesis: 'System must flag stale data and reduce confidence without assuming missing updates equal hostile behavior.'
  },
  'unexpected-motion': {
    name: 'UNEXPECTED MOTION',
    tag: 'SCN-02',
    difficulty: 'Challenging',
    description: 'Compare a predicted path with a simulated observed outcome when movement changes unexpectedly.',
    testedAspect: 'Kinematic Extrapolation, Divergence Error & Model Limits',
    defaultDurationSec: 22,
    keyHypothesis: 'Linear extrapolation models break down under sharp maneuvers; error must be quantified with explicit units.'
  },
  'alert-surge': {
    name: 'ALERT SURGE',
    tag: 'SCN-03',
    difficulty: 'Degraded',
    description: 'Generate several independent simulated events to test how clearly the system organizes competing alerts.',
    testedAspect: 'Queue Prioritization, Duplicate Rejection & Triage Workflow',
    defaultDurationSec: 26,
    keyHypothesis: 'Operator cognitive load must be protected by deterministic severity sorting and zero duplicate alert spam.'
  },
  'combined-failure': {
    name: 'COMBINED FAILURE',
    tag: 'SCN-04',
    difficulty: 'Degraded',
    description: 'Combine delayed telemetry with a change in simulated movement to observe how multiple limitations affect the monitoring picture.',
    testedAspect: 'Compound Uncertainty, Human Review Boundary & Multi-variable Faults',
    defaultDurationSec: 28,
    keyHypothesis: 'Compound data-quality and kinematic faults must trigger an explicit mandate for human verification.'
  }
};

export const DEFAULT_CONFIGS: Record<StressScenarioId, ScenarioConfig> = {
  'signal-fade': {
    durationSec: 24,
    telemetryDelaySeverity: 'HIGH',
    dropProbability: 0.65,
    movementVariationDeg: 30,
    concurrentTracksCount: 1
  },
  'unexpected-motion': {
    durationSec: 22,
    telemetryDelaySeverity: 'LOW',
    dropProbability: 0.0,
    movementVariationDeg: 90,
    concurrentTracksCount: 1
  },
  'alert-surge': {
    durationSec: 26,
    telemetryDelaySeverity: 'MEDIUM',
    dropProbability: 0.2,
    movementVariationDeg: 45,
    concurrentTracksCount: 5
  },
  'combined-failure': {
    durationSec: 28,
    telemetryDelaySeverity: 'HIGH',
    dropProbability: 0.5,
    movementVariationDeg: 80,
    concurrentTracksCount: 2
  }
};

export interface ScenarioFrameState {
  simTimeSec: number;
  timeFormatted: string;
  progressPercent: number;
  healthState: SystemHealthState;
  phaseLabel: string;
  tracks: SimulatedStressTrack[];
  activeEvents: StressEvent[];
  telemetryFreshnessSec: number;
  observationCompletenessPercent: number;
  predictionErrorMeters: number | null;
  confidenceStatus: 'HIGH' | 'DEGRADED' | 'LOW' | 'RECOVERING';
  humanReviewMandated: boolean;
  activeAlertCount: number;
  breakpoints: BreakpointNode[];
  metrics: EvaluationMetrics;
  outcomeSummary: string;
  strengths: string[];
  limitations: string[];
  recommendedSteps: string[];
}

// Format seconds into MM:SS.S
export const formatSimTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${parseFloat(secs) < 10 ? '0' : ''}${secs}`;
};

/**
 * Deterministic Scenario Generator: Computes exact frame state for any given elapsed simulation time.
 * Pure function: Given the same scenarioId, config, and simTimeSec, it returns identical deterministic results.
 */
export function computeScenarioFrame(
  scenarioId: StressScenarioId,
  config: ScenarioConfig,
  simTimeSec: number,
  existingAcknowledgedIds: Set<string> = new Set()
): ScenarioFrameState {
  const duration = config.durationSec;
  const clampedTime = Math.min(simTimeSec, duration);
  const progressPercent = Math.min(100, Math.round((clampedTime / duration) * 100));

  switch (scenarioId) {
    case 'signal-fade':
      return computeSignalFadeScenario(config, clampedTime, progressPercent, existingAcknowledgedIds);
    case 'unexpected-motion':
      return computeUnexpectedMotionScenario(config, clampedTime, progressPercent, existingAcknowledgedIds);
    case 'alert-surge':
      return computeAlertSurgeScenario(config, clampedTime, progressPercent, existingAcknowledgedIds);
    case 'combined-failure':
      return computeCombinedFailureScenario(config, clampedTime, progressPercent, existingAcknowledgedIds);
    default:
      return computeSignalFadeScenario(config, clampedTime, progressPercent, existingAcknowledgedIds);
  }
}

/* =========================================================================
   SCENARIO 1: SIGNAL FADE
   ========================================================================= */
function computeSignalFadeScenario(
  config: ScenarioConfig,
  t: number,
  progressPercent: number,
  acknowledgedIds: Set<string>
): ScenarioFrameState {
  const duration = config.durationSec;
  let healthState: SystemHealthState = 'NORMAL';
  let phaseLabel = 'Nominal Telemetry Ingestion';
  let telemetryFreshnessSec = 0.5;
  let completeness = 100;
  let confidence: 'HIGH' | 'DEGRADED' | 'LOW' | 'RECOVERING' = 'HIGH';
  let isStale = false;
  let isDropped = false;

  // Track position: flying smoothly from West to East
  const baseX = -7.0 + (t * 0.45);
  const baseY = 2.0 + Math.sin(t * 0.2) * 0.3;

  if (t < 5.0) {
    healthState = 'NORMAL';
    phaseLabel = 'Nominal Ingestion (Stream Active)';
    telemetryFreshnessSec = 0.4 + (t % 1.0) * 0.6;
    completeness = 100;
    confidence = 'HIGH';
  } else if (t < 11.0) {
    healthState = 'DEGRADED';
    phaseLabel = 'Packet Latency Spike (Telemetry Delayed)';
    telemetryFreshnessSec = 1.0 + ((t - 5.0) * 0.7);
    completeness = 72;
    confidence = 'DEGRADED';
    isDropped = t > 8.0 && t < 10.0;
  } else if (t < 18.0) {
    healthState = 'CRITICAL';
    phaseLabel = 'Signal Dropout (Observation Stale)';
    telemetryFreshnessSec = 5.2 + ((t - 11.0) * 1.0); // climbs to ~12.2s
    completeness = 35;
    confidence = 'LOW';
    isStale = true;
    isDropped = true;
  } else {
    healthState = 'RECOVERING';
    phaseLabel = 'Telemetry Re-established (Recovery)';
    const recoveryProgress = Math.min(1.0, (t - 18.0) / 4.0);
    telemetryFreshnessSec = Math.max(0.5, 8.0 * (1 - recoveryProgress) + 0.5);
    completeness = Math.round(35 + (65 * recoveryProgress));
    confidence = recoveryProgress > 0.8 ? 'HIGH' : 'RECOVERING';
    isStale = false;
    isDropped = false;
  }

  // Define synthetic events
  const allEvents: StressEvent[] = [
    {
      id: 'SF-01',
      simTimeSec: 0.0,
      timeFormatted: '00:00.0',
      category: 'SYSTEM',
      severity: 'INFO',
      title: 'Stress Lab Initialized',
      description: 'Deterministic synthetic telemetry generator started for Track T-03.',
      evidence: 'RF Link: 2.44 GHz · Expected Heartbeat: 1000ms · Buffer: Nominal',
      acknowledged: acknowledgedIds.has('SF-01')
    },
    {
      id: 'SF-02',
      simTimeSec: 5.2,
      timeFormatted: '00:05.2',
      category: 'DATA_QUALITY',
      severity: 'WARNING',
      title: 'Telemetry Interval Exceeded',
      description: 'Expected packet heartbeat delayed. Update age reached 2.4s (threshold: 1.5s).',
      trackId: 'T-03',
      evidence: 'Interval: 2,420ms · Dropped sequence: #104 · RF RSSI: -84 dBm',
      acknowledged: acknowledgedIds.has('SF-02')
    },
    {
      id: 'SF-03',
      simTimeSec: 11.1,
      timeFormatted: '00:11.1',
      category: 'DATA_QUALITY',
      severity: 'CRITICAL',
      title: 'Observation Marked Stale (Dropout)',
      description: 'No valid telemetry frame for 6.0s. Trajectory confidence reduced to LOW.',
      trackId: 'T-03',
      evidence: 'Age: 6.2s (Threshold: 5.0s) · Confidence: LOW · Threat state unchanged (Missing ≠ Hostile)',
      acknowledged: acknowledgedIds.has('SF-03')
    },
    {
      id: 'SF-04',
      simTimeSec: 18.2,
      timeFormatted: '00:18.2',
      category: 'DATA_QUALITY',
      severity: 'RECOVERY',
      title: 'Telemetry Stream Restored',
      description: 'Fresh valid observation frame received with verified cyclic redundancy check.',
      trackId: 'T-03',
      evidence: 'Packet #112 valid · Latency: 210ms · Freshness restored: 0.4s · State: NOMINAL',
      acknowledged: acknowledgedIds.has('SF-04')
    }
  ];

  const activeEvents = allEvents.filter(e => e.simTimeSec <= t);

  // Single track representation
  const track: SimulatedStressTrack = {
    id: 'T-03',
    callsign: 'SPECTRE-03 (SIM)',
    x: baseX,
    y: baseY,
    altitudeMeters: 140,
    speedKmh: 65,
    headingDeg: 88,
    iff: 'unknown',
    classification: 'tactical-quad',
    isStale,
    isDropped,
    telemetryAgeSec: Number(telemetryFreshnessSec.toFixed(1)),
    history: [
      { x: -7.0, y: 2.0 },
      { x: -5.5, y: 2.1 },
      { x: -3.8, y: 2.0 },
      { x: -2.2, y: 2.1 }
    ],
    predictedTrajectory: [
      { x: baseX + 1.2, y: baseY + 0.05 },
      { x: baseX + 2.4, y: baseY + 0.1 },
      { x: baseX + 3.6, y: baseY + 0.15 }
    ]
  };

  const breakpoints: BreakpointNode[] = [
    {
      id: 'BP-SF-1',
      simTimeSec: 0.0,
      timeLabel: '00:00.0',
      state: 'NORMAL',
      title: 'Nominal Baseline',
      shortSummary: 'Telemetry arriving at 1.0s intervals. Track continuity 100%.',
      detailedExplanation: 'Under standard conditions, observations arrive every 1,000ms. Observation age stays under 1.0s, and confidence metrics remain at 100%.',
      evidenceData: [
        { metric: 'Observation Age', value: '0.4s', threshold: '< 1.5s', status: 'PASS' },
        { metric: 'Completeness', value: '100%', threshold: '> 90%', status: 'PASS' },
        { metric: 'Trajectory Confidence', value: 'HIGH (96%)', threshold: '> 80%', status: 'PASS' }
      ],
      reliabilityImpact: 'Full situational assurance. Autonomous tracking fully reliable.'
    },
    {
      id: 'BP-SF-2',
      simTimeSec: 5.2,
      timeLabel: '00:05.2',
      state: 'DEGRADED',
      title: 'Packet Jitter & Delay',
      shortSummary: 'Telemetry latency exceeded 2.4s. System marked state as DEGRADED.',
      detailedExplanation: 'Simulated RF interference caused packet sequence #104 to arrive late. The system recognized the jitter and marked the stream as DEGRADED without sounding false alarms.',
      evidenceData: [
        { metric: 'Observation Age', value: '2.4s', threshold: '< 1.5s', status: 'WARN' },
        { metric: 'Completeness', value: '72%', threshold: '> 90%', status: 'WARN' },
        { metric: 'Confidence', value: 'DEGRADED (64%)', threshold: '> 80%', status: 'WARN' }
      ],
      reliabilityImpact: 'Velocity calculations less precise. Extrapolation variance widening.'
    },
    {
      id: 'BP-SF-3',
      simTimeSec: 11.1,
      timeLabel: '00:11.1',
      state: 'CRITICAL',
      title: 'Reliability Drop: Stale Data',
      shortSummary: 'Observation age reached 6.2s. System reduced confidence to LOW.',
      detailedExplanation: 'The primary breakpoint occurs when updates cease for >5.0 seconds. Crucially, the system marks data as STALE rather than interpreting missing frames as hostile evasive maneuvering.',
      evidenceData: [
        { metric: 'Observation Age', value: '6.2s', threshold: '< 5.0s', status: 'FAIL' },
        { metric: 'Completeness', value: '35%', threshold: '> 70%', status: 'FAIL' },
        { metric: 'Track Status', value: 'STALE / DEGRADED', threshold: 'ACTIVE', status: 'FAIL' }
      ],
      reliabilityImpact: 'Autonomous kinetic or countermeasure engagement prohibited due to stale coordinates.'
    },
    {
      id: 'BP-SF-4',
      simTimeSec: 18.2,
      timeLabel: '00:18.2',
      state: 'RECOVERING',
      title: 'Re-acquisition & Recovery',
      shortSummary: 'Fresh observation frame received. System recovered to NOMINAL.',
      detailedExplanation: 'Fresh telemetry arrived with valid checksums. The position was updated, observation age dropped back below 1.0s, and track continuity re-synchronized.',
      evidenceData: [
        { metric: 'Observation Age', value: '0.4s', threshold: '< 1.5s', status: 'PASS' },
        { metric: 'Frame Integrity', value: 'VERIFIED', threshold: 'VERIFIED', status: 'PASS' },
        { metric: 'System State', value: 'RECOVERED', threshold: 'NORMAL', status: 'PASS' }
      ],
      reliabilityImpact: 'Full confidence restored. Normal situational monitoring resumes.'
    }
  ];

  const metrics: EvaluationMetrics = {
    eventsGenerated: allEvents.length,
    eventsDetected: activeEvents.length,
    eventsMissed: 0,
    maxPredictionErrorMeters: null, // Not applicable in signal fade
    maxTelemetryAgeSec: Number(telemetryFreshnessSec.toFixed(1)),
    durationInDegradedSec: t > 5.0 ? Number(Math.min(13.2, t - 5.0).toFixed(1)) : 0,
    timeToRecoverSec: t > 18.0 ? Number(Math.min(4.2, t - 18.0).toFixed(1)) : 0,
    humanReviewMandated: isStale,
    duplicateRejectionRate: 100,
    unacknowledgedAlerts: activeEvents.filter(e => !e.acknowledged && e.severity !== 'INFO').length
  };

  return {
    simTimeSec: t,
    timeFormatted: formatSimTime(t),
    progressPercent,
    healthState,
    phaseLabel,
    tracks: [track],
    activeEvents,
    telemetryFreshnessSec: Number(telemetryFreshnessSec.toFixed(1)),
    observationCompletenessPercent: completeness,
    predictionErrorMeters: null,
    confidenceStatus: confidence,
    humanReviewMandated: isStale,
    activeAlertCount: activeEvents.filter(e => !e.acknowledged).length,
    breakpoints,
    metrics,
    outcomeSummary: t >= duration
      ? 'Telemetry experienced progressive latency and dropout reaching 12.2s stale age. The system correctly downgraded track confidence without falsely classifying the target as hostile. Upon stream resumption, confidence recovered in 4.2 seconds.'
      : 'Simulating intermittent telemetry latency and packet loss against Track T-03.',
    strengths: [
      'Correctly flagged delayed updates at 2.4s threshold without triggering false hostile alerts.',
      'Explicitly distinguished missing data from evasive hostile behavior (Zero false-positive escalations).',
      'Cleanly recovered to NORMAL within 4.2 seconds of telemetry restoration.'
    ],
    limitations: [
      'Kinematic velocity estimates remained fixed during the 7.1s dropout window.',
      'No secondary multilateration fallback was active to verify target position during the blackout.'
    ],
    recommendedSteps: [
      'Integrate dual-redundant RF receiver timestamps to differentiate transmission latency from packet loss.',
      'Implement an automated stale-decay filter that expands the uncertainty ellipse as observation age increases.'
    ]
  };
}

/* =========================================================================
   SCENARIO 2: UNEXPECTED MOTION
   ========================================================================= */
function computeUnexpectedMotionScenario(
  config: ScenarioConfig,
  t: number,
  progressPercent: number,
  acknowledgedIds: Set<string>
): ScenarioFrameState {
  const duration = config.durationSec;
  let healthState: SystemHealthState = 'NORMAL';
  let phaseLabel = 'Predictable Trajectory Forecast';
  let predictionErrorMeters = 14;
  let confidence: 'HIGH' | 'DEGRADED' | 'LOW' | 'RECOVERING' = 'HIGH';

  // Maneuver occurs at t = 6.0 seconds
  const maneuverTime = 6.0;
  let currentX: number;
  let currentY: number;
  let currentHeading = 45;
  let speed = 60;

  // Forecast path based on linear extrapolation before maneuver
  // Baseline path: starts at (-6, -4), moves at 45 deg
  const linearForecastX = -6.0 + (t * 0.55);
  const linearForecastY = -4.0 + (t * 0.55);

  if (t < maneuverTime) {
    currentX = linearForecastX;
    currentY = linearForecastY;
    currentHeading = 45;
    predictionErrorMeters = Math.round(12 + Math.sin(t) * 4);
    healthState = 'NORMAL';
    phaseLabel = 'Stable Linear Flight (Error < 25m)';
    confidence = 'HIGH';
  } else {
    // Executes sharp 90 deg right turn toward heading 135 deg and accelerates
    const dtAfter = t - maneuverTime;
    const turnX = -6.0 + (maneuverTime * 0.55);
    const turnY = -4.0 + (maneuverTime * 0.55);

    // Moves southeast: dx positive, dy negative
    currentX = turnX + (dtAfter * 0.85);
    currentY = turnY - (dtAfter * 0.35);
    currentHeading = 135;
    speed = 95;

    // Divergence error: Distance between linear forecast and actual observed coordinates
    const deltaKm = Math.hypot(currentX - linearForecastX, currentY - linearForecastY);
    predictionErrorMeters = Math.round(deltaKm * 1000);

    if (dtAfter < 5.0) {
      healthState = 'DEGRADED';
      phaseLabel = 'Kinematic Breakpoint: Divergence Surge';
      confidence = 'DEGRADED';
    } else if (dtAfter < 11.0) {
      healthState = 'CRITICAL';
      phaseLabel = 'Forecast Invalidation (Error > 800m)';
      confidence = 'LOW';
    } else {
      healthState = 'RECOVERING';
      phaseLabel = 'Polynomial Filter Re-converged';
      confidence = 'RECOVERING';
      predictionErrorMeters = Math.max(45, Math.round(predictionErrorMeters * 0.15));
    }
  }

  const allEvents: StressEvent[] = [
    {
      id: 'UM-01',
      simTimeSec: 0.0,
      timeFormatted: '00:00.0',
      category: 'SYSTEM',
      severity: 'INFO',
      title: 'Kinematic Predictor Initialized',
      description: 'Linear extrapolation filter active for Track T-06. Baseline heading: 045° at 60 km/h.',
      evidence: 'Model: 1st-Order Taylor Series · Variance: ±15m · Ground Truth: Synchronized',
      acknowledged: acknowledgedIds.has('UM-01')
    },
    {
      id: 'UM-02',
      simTimeSec: 6.2,
      timeFormatted: '00:06.2',
      category: 'KINEMATIC',
      severity: 'WARNING',
      title: 'High-G Lateral Maneuver Detected',
      description: 'Track executed sudden 90° heading change to 135°. Observed vector diverged from prediction.',
      trackId: 'T-06',
      evidence: 'Lateral Accel: 3.4G · Heading Shift: +90° · Forecast Error: 285m (Threshold: 100m)',
      acknowledged: acknowledgedIds.has('UM-02')
    },
    {
      id: 'UM-03',
      simTimeSec: 10.5,
      timeFormatted: '00:10.5',
      category: 'KINEMATIC',
      severity: 'CRITICAL',
      title: 'Extrapolation Model Invalidated',
      description: 'Prediction error exceeded 800m. Linear model cannot predict target envelope.',
      trackId: 'T-06',
      evidence: 'Error: 1,180m · Model Confidence: LOW · Notice: Unusual motion is an anomaly, NOT proof of hostile intent',
      acknowledged: acknowledgedIds.has('UM-03')
    },
    {
      id: 'UM-04',
      simTimeSec: 17.0,
      timeFormatted: '00:17.0',
      category: 'KINEMATIC',
      severity: 'RECOVERY',
      title: 'Adaptive Filter Convergence',
      description: 'Higher-order kinematic model stabilized on new heading 135°. Error dropped to 45m.',
      trackId: 'T-06',
      evidence: 'Heading Locked: 135° · Speed: 95 km/h · Residual Error: 45m · State: RESTORED',
      acknowledged: acknowledgedIds.has('UM-04')
    }
  ];

  const activeEvents = allEvents.filter(e => e.simTimeSec <= t);

  const track: SimulatedStressTrack = {
    id: 'T-06',
    callsign: 'PHANTOM-06 (SIM)',
    x: Number(currentX.toFixed(3)),
    y: Number(currentY.toFixed(3)),
    altitudeMeters: 165,
    speedKmh: speed,
    headingDeg: currentHeading,
    iff: 'unknown',
    classification: 'fixed-wing',
    isStale: false,
    isDropped: false,
    telemetryAgeSec: 0.3,
    history: [
      { x: -6.0, y: -4.0 },
      { x: -4.5, y: -2.5 },
      { x: -3.0, y: -1.0 }
    ],
    predictedTrajectory: [
      { x: linearForecastX + 1.0, y: linearForecastY + 1.0 },
      { x: linearForecastX + 2.0, y: linearForecastY + 2.0 },
      { x: linearForecastX + 3.0, y: linearForecastY + 3.0 }
    ],
    actualObservedTrajectory: [
      { x: currentX, y: currentY },
      { x: currentX + 0.8, y: currentY - 0.3 },
      { x: currentX + 1.6, y: currentY - 0.6 }
    ]
  };

  const breakpoints: BreakpointNode[] = [
    {
      id: 'BP-UM-1',
      simTimeSec: 0.0,
      timeLabel: '00:00.0',
      state: 'NORMAL',
      title: 'Linear Flight Baseline',
      shortSummary: 'Straight track at 045°. Prediction error minimal (14m).',
      detailedExplanation: 'While flight dynamics remain linear, forecast trajectory matches real-time observation with less than 20m variance.',
      evidenceData: [
        { metric: 'Prediction Error', value: '14 meters', threshold: '< 50m', status: 'PASS' },
        { metric: 'Heading Variance', value: '0.2°', threshold: '< 5.0°', status: 'PASS' },
        { metric: 'Model Status', value: 'NOMINAL', threshold: 'NOMINAL', status: 'PASS' }
      ],
      reliabilityImpact: 'Trajectory interception vectors completely reliable.'
    },
    {
      id: 'BP-UM-2',
      simTimeSec: 6.2,
      timeLabel: '00:06.2',
      state: 'DEGRADED',
      title: 'Maneuver Point (Break)',
      shortSummary: 'Sharp 90° turn. Prediction error jumped to 285m.',
      detailedExplanation: 'The target initiated a high-G turn. The first-order predictor assumes continuation of previous heading, causing immediate divergence.',
      evidenceData: [
        { metric: 'Prediction Error', value: '285 meters', threshold: '< 100m', status: 'WARN' },
        { metric: 'Lateral G-Force', value: '3.4 G', threshold: '< 1.5 G', status: 'WARN' },
        { metric: 'Confidence', value: 'DEGRADED', threshold: 'HIGH', status: 'WARN' }
      ],
      reliabilityImpact: 'Interception corridor invalidated. Model warning raised.'
    },
    {
      id: 'BP-UM-3',
      simTimeSec: 10.5,
      timeLabel: '00:10.5',
      state: 'CRITICAL',
      title: 'Peak Error Exceedance',
      shortSummary: 'Prediction error peaked at 1,180m. Model invalidated.',
      detailedExplanation: 'Linear model produced a 1.18 km forecast error. The system flagged the forecast as unreliable. Crucially, unusual flight path is recorded as an anomaly rather than confirmed hostile intent.',
      evidenceData: [
        { metric: 'Prediction Error', value: '1,180 meters', threshold: '< 500m', status: 'FAIL' },
        { metric: 'Model Reliability', value: 'LOW (Invalid)', threshold: 'HIGH', status: 'FAIL' },
        { metric: 'Classification', value: 'Anomaly (Unconfirmed)', threshold: 'N/A', status: 'WARN' }
      ],
      reliabilityImpact: 'Predictive interception disabled. Fallback to point-in-time observation mode.'
    },
    {
      id: 'BP-UM-4',
      simTimeSec: 17.0,
      timeLabel: '00:17.0',
      state: 'RECOVERING',
      title: 'Filter Convergence',
      shortSummary: 'Adaptive kinematics re-aligned to heading 135°. Error: 45m.',
      detailedExplanation: 'After 8 consecutive frames of stable flight along the new vector, the polynomial filter re-converged, restoring prediction reliability.',
      evidenceData: [
        { metric: 'Prediction Error', value: '45 meters', threshold: '< 100m', status: 'PASS' },
        { metric: 'Heading Lock', value: '135° Confirmed', threshold: 'Locked', status: 'PASS' },
        { metric: 'Model Status', value: 'RE-CONVERGED', threshold: 'NOMINAL', status: 'PASS' }
      ],
      reliabilityImpact: 'Reliable predictive tracking restored on new vector.'
    }
  ];

  const metrics: EvaluationMetrics = {
    eventsGenerated: allEvents.length,
    eventsDetected: activeEvents.length,
    eventsMissed: 0,
    maxPredictionErrorMeters: predictionErrorMeters,
    maxTelemetryAgeSec: 0.4,
    durationInDegradedSec: t > 6.0 ? Number(Math.min(11.0, t - 6.0).toFixed(1)) : 0,
    timeToRecoverSec: t > 17.0 ? Number(Math.min(5.0, t - 17.0).toFixed(1)) : 0,
    humanReviewMandated: predictionErrorMeters > 500,
    duplicateRejectionRate: 100,
    unacknowledgedAlerts: activeEvents.filter(e => !e.acknowledged && e.severity !== 'INFO').length
  };

  return {
    simTimeSec: t,
    timeFormatted: formatSimTime(t),
    progressPercent,
    healthState,
    phaseLabel,
    tracks: [track],
    activeEvents,
    telemetryFreshnessSec: 0.3,
    observationCompletenessPercent: 100,
    predictionErrorMeters,
    confidenceStatus: confidence,
    humanReviewMandated: predictionErrorMeters > 500,
    activeAlertCount: activeEvents.filter(e => !e.acknowledged).length,
    breakpoints,
    metrics,
    outcomeSummary: t >= duration
      ? 'A sudden 90° lateral turn produced a peak forecast divergence of 1,180 meters, proving the vulnerability of linear extrapolation. The system detected the divergence, downgraded model reliability, and avoided treating the flight anomaly as hostile intent before re-converging.'
      : 'Simulating kinematic divergence and prediction error against Track T-06.',
    strengths: [
      'Quantified prediction error in real-time with explicit metric units (1,180m).',
      'Refrained from classifying kinematic deviation as proof of hostile intent.',
      'Re-converged adaptive model within 6.5 seconds of post-maneuver straight flight.'
    ],
    limitations: [
      'Linear extrapolation model generated false trajectory extrapolation for 4.5 seconds.',
      'Did not maintain parallel multiple-hypothesis maneuver models during the turn.'
    ],
    recommendedSteps: [
      'Implement an Interacting Multiple Model (IMM) Kalman filter to maintain turning vs straight hypotheses.',
      'Trigger an automated alert when prediction error exceeds 3x sensor measurement variance.'
    ]
  };
}

/* =========================================================================
   SCENARIO 3: ALERT SURGE
   ========================================================================= */
function computeAlertSurgeScenario(
  config: ScenarioConfig,
  t: number,
  progressPercent: number,
  acknowledgedIds: Set<string>
): ScenarioFrameState {
  const duration = config.durationSec;
  let healthState: SystemHealthState = 'NORMAL';
  let phaseLabel = 'Low-Density Monitoring';

  if (t < 4.0) {
    healthState = 'NORMAL';
    phaseLabel = 'Calm Baseline (1 Active Target)';
  } else if (t < 12.0) {
    healthState = 'CRITICAL';
    phaseLabel = 'Alert Surge Ingestion (5 Simultaneous Events)';
  } else if (t < 20.0) {
    healthState = 'DEGRADED';
    phaseLabel = 'Operator Queue Triage Active';
  } else {
    healthState = 'RECOVERING';
    phaseLabel = 'Post-Surge Equilibrium';
  }

  // 5 Simulated tracks distributed around the base
  const tracks: SimulatedStressTrack[] = [
    {
      id: 'T-01',
      callsign: 'RECON-01 (SIM)',
      x: -4.2 + (t * 0.1),
      y: 3.5,
      altitudeMeters: 180,
      speedKmh: 45,
      headingDeg: 110,
      iff: 'unknown',
      classification: 'commercial-diy',
      isStale: false,
      isDropped: false,
      telemetryAgeSec: 0.4,
      history: [{ x: -5.0, y: 3.8 }, { x: -4.6, y: 3.6 }],
      predictedTrajectory: [{ x: -3.8, y: 3.4 }, { x: -3.4, y: 3.3 }]
    },
    {
      id: 'T-02',
      callsign: 'GHOST-02 (SIM)',
      x: 3.8,
      y: 5.2 - (t * 0.08),
      altitudeMeters: 220,
      speedKmh: 75,
      headingDeg: 185,
      iff: 'unknown',
      classification: 'mini',
      isStale: t > 6.0 && t < 16.0,
      isDropped: t > 7.0 && t < 14.0,
      telemetryAgeSec: t > 6.0 && t < 16.0 ? 4.8 : 0.5,
      history: [{ x: 3.8, y: 6.0 }, { x: 3.8, y: 5.5 }],
      predictedTrajectory: [{ x: 3.8, y: 4.8 }, { x: 3.8, y: 4.2 }]
    },
    {
      id: 'T-03',
      callsign: 'SWARM-ALPHA (SIM)',
      x: -1.8 + (t * 0.15),
      y: -2.4 + (t * 0.15),
      altitudeMeters: 110,
      speedKmh: 82,
      headingDeg: 45,
      iff: 'hostile',
      classification: 'swarm-node',
      isStale: false,
      isDropped: false,
      telemetryAgeSec: 0.3,
      history: [{ x: -2.5, y: -3.1 }, { x: -2.1, y: -2.7 }],
      predictedTrajectory: [{ x: -1.2, y: -1.8 }, { x: -0.6, y: -1.2 }]
    },
    {
      id: 'T-04',
      callsign: 'KINDLE-04 (SIM)',
      x: 2.1 - (t * 0.12),
      y: -1.5,
      altitudeMeters: 95,
      speedKmh: 92,
      headingDeg: 270,
      iff: 'hostile',
      classification: 'tactical-quad',
      isStale: false,
      isDropped: false,
      telemetryAgeSec: 0.2,
      history: [{ x: 3.0, y: -1.5 }, { x: 2.5, y: -1.5 }],
      predictedTrajectory: [{ x: 1.5, y: -1.5 }, { x: 0.9, y: -1.5 }]
    },
    {
      id: 'T-05',
      callsign: 'DARTER-05 (SIM)',
      x: 0.5,
      y: 6.1 - (t * 0.2),
      altitudeMeters: Math.max(30, 240 - ((t - 4) * 18)),
      speedKmh: 110,
      headingDeg: 180,
      iff: 'unknown',
      classification: 'fixed-wing',
      isStale: false,
      isDropped: false,
      telemetryAgeSec: 0.3,
      history: [{ x: 0.5, y: 7.2 }, { x: 0.5, y: 6.6 }],
      predictedTrajectory: [{ x: 0.5, y: 5.5 }, { x: 0.5, y: 4.8 }]
    }
  ];

  const allEvents: StressEvent[] = [
    {
      id: 'AS-01',
      simTimeSec: 0.0,
      timeFormatted: '00:00.0',
      category: 'SYSTEM',
      severity: 'INFO',
      title: 'Alert Subsystem Baseline Active',
      description: 'Alert priority sorting queue ready. Rule: CRITICAL > WARNING > INFO.',
      evidence: 'Deduplication window: 5000ms · Buffer capacity: 250 events',
      acknowledged: acknowledgedIds.has('AS-01')
    },
    {
      id: 'AS-02',
      simTimeSec: 4.2,
      timeFormatted: '00:04.2',
      category: 'ALERT_SURGE',
      severity: 'CRITICAL',
      title: 'Core Zone Incursion Proximity: T-04',
      description: 'Track T-04 breached 2.5 km perimeter at 92 km/h. Ingress Sector: SOUTH-EAST.',
      trackId: 'T-04',
      evidence: 'Dist: 2.1 km · Heading: 270° · Speed: 92 km/h · ETA Core: 42s',
      acknowledged: acknowledgedIds.has('AS-04')
    },
    {
      id: 'AS-03',
      simTimeSec: 4.8,
      timeFormatted: '00:04.8',
      category: 'DATA_QUALITY',
      severity: 'WARNING',
      title: 'Telemetry Intermittent: T-02',
      description: 'RF stream latency rose to 4.8s. 2 sequential frames unacknowledged.',
      trackId: 'T-02',
      evidence: 'Heartbeat lost · Age: 4.8s · RF Band: 5.8 GHz · Quality: DEGRADED',
      acknowledged: acknowledgedIds.has('AS-02')
    },
    {
      id: 'AS-04',
      simTimeSec: 5.4,
      timeFormatted: '00:05.4',
      category: 'KINEMATIC',
      severity: 'WARNING',
      title: 'Rapid Altitude Dive: T-05',
      description: 'Track T-05 descending at -18 m/s. Potential terrain masking approach.',
      trackId: 'T-05',
      evidence: 'Alt: 150m (was 240m) · Vertical Rate: -18.2 m/s · Speed: 110 km/h',
      acknowledged: acknowledgedIds.has('AS-05')
    },
    {
      id: 'AS-05',
      simTimeSec: 6.1,
      timeFormatted: '00:06.1',
      category: 'ALERT_SURGE',
      severity: 'CRITICAL',
      title: 'Swarm Ingress Convergence: T-03',
      description: 'Track T-03 vector aligned directly with radar origin centerpoint.',
      trackId: 'T-03',
      evidence: 'Dist: 2.8 km · Azimuth: 225° · Heading: 045° · Multi-target signature',
      acknowledged: acknowledgedIds.has('AS-03')
    },
    {
      id: 'AS-06',
      simTimeSec: 7.0,
      timeFormatted: '00:07.0',
      category: 'SYSTEM',
      severity: 'INFO',
      title: 'Transponder Response Logged: T-01',
      description: 'Track T-01 broadcast civilian Remote ID broadcast payload.',
      trackId: 'T-01',
      evidence: 'Protocol: OpenDroneID · FAA ID: FA391482 · Operator Lat/Lng provided',
      acknowledged: acknowledgedIds.has('AS-06')
    }
  ];

  const activeEvents = allEvents.filter(e => e.simTimeSec <= t);
  const unacknowledgedCount = activeEvents.filter(e => !e.acknowledged && e.severity !== 'INFO').length;

  const breakpoints: BreakpointNode[] = [
    {
      id: 'BP-AS-1',
      simTimeSec: 0.0,
      timeLabel: '00:00.0',
      state: 'NORMAL',
      title: 'Routine Queue Baseline',
      shortSummary: '0 pending alerts. Queue latency < 10ms.',
      detailedExplanation: 'Under standard conditions, isolated notifications are logged and cleared without operator overload.',
      evidenceData: [
        { metric: 'Queue Depth', value: '0 items', threshold: '< 5', status: 'PASS' },
        { metric: 'Priority Ingestion', value: 'NOMINAL', threshold: 'NOMINAL', status: 'PASS' },
        { metric: 'Cognitive Load', value: 'LOW (1 target)', threshold: 'LOW', status: 'PASS' }
      ],
      reliabilityImpact: 'Immediate operator awareness.'
    },
    {
      id: 'BP-AS-2',
      simTimeSec: 4.8,
      timeLabel: '00:04.8',
      state: 'CRITICAL',
      title: 'Surge Ingestion (Breakpoint)',
      shortSummary: '4 concurrent alerts received within 1.9 seconds.',
      detailedExplanation: 'Simultaneous events from disparate target sectors arrived in rapid succession. The queue sorted them strictly by threat severity (Core Incursion > Telemetry Jitter).',
      evidenceData: [
        { metric: 'Burst Rate', value: '2.8 alerts/sec', threshold: '< 1.0/s', status: 'FAIL' },
        { metric: 'Severity Sorting', value: 'CRITICAL first', threshold: 'ORDERED', status: 'PASS' },
        { metric: 'Duplicate Count', value: '0 duplicates', threshold: '0', status: 'PASS' }
      ],
      reliabilityImpact: 'High cognitive demand. Priority filtering prevents critical misses.'
    },
    {
      id: 'BP-AS-3',
      simTimeSec: 12.0,
      timeLabel: '00:12.0',
      state: 'DEGRADED',
      title: 'Triage Processing',
      shortSummary: 'Operator interacting with queue. 3 alerts triaged.',
      detailedExplanation: 'Evidence panels opened for high-priority targets. De-duplication successfully suppressed repeated re-announcements.',
      evidenceData: [
        { metric: 'Suppressed Dupes', value: '6 suppressed', threshold: '> 0', status: 'PASS' },
        { metric: 'Triage Latency', value: '4.2s avg', threshold: '< 10s', status: 'PASS' },
        { metric: 'Queue Status', value: 'PROCESSING', threshold: 'STEADY', status: 'WARN' }
      ],
      reliabilityImpact: 'Controlled processing without visual clutter or alarm fatigue.'
    },
    {
      id: 'BP-AS-4',
      simTimeSec: 22.0,
      timeLabel: '00:22.0',
      state: 'NORMAL',
      title: 'Equilibrium Restored',
      shortSummary: 'All surge events acknowledged and organized.',
      detailedExplanation: 'Once competing notifications were triaged, the queue returned to steady state. Total event history remains completely accessible.',
      evidenceData: [
        { metric: 'Pending Criticals', value: '0', threshold: '0', status: 'PASS' },
        { metric: 'Queue State', value: 'STABLE', threshold: 'STABLE', status: 'PASS' },
        { metric: 'Log Integrity', value: '100% Retained', threshold: '100%', status: 'PASS' }
      ],
      reliabilityImpact: 'Full situational control maintained throughout surge.'
    }
  ];

  const metrics: EvaluationMetrics = {
    eventsGenerated: allEvents.length,
    eventsDetected: activeEvents.length,
    eventsMissed: 0,
    maxPredictionErrorMeters: null,
    maxTelemetryAgeSec: 4.8,
    durationInDegradedSec: t > 4.0 ? Number(Math.min(16.0, t - 4.0).toFixed(1)) : 0,
    timeToRecoverSec: t > 20.0 ? Number(Math.min(6.0, t - 20.0).toFixed(1)) : 0,
    humanReviewMandated: unacknowledgedCount > 2,
    duplicateRejectionRate: 100,
    unacknowledgedAlerts: unacknowledgedCount
  };

  return {
    simTimeSec: t,
    timeFormatted: formatSimTime(t),
    progressPercent,
    healthState,
    phaseLabel,
    tracks,
    activeEvents,
    telemetryFreshnessSec: 0.4,
    observationCompletenessPercent: 92,
    predictionErrorMeters: null,
    confidenceStatus: unacknowledgedCount > 2 ? 'DEGRADED' : 'HIGH',
    humanReviewMandated: unacknowledgedCount > 2,
    activeAlertCount: unacknowledgedCount,
    breakpoints,
    metrics,
    outcomeSummary: t >= duration
      ? '5 asynchronous alerts flooded the queue within 2.8 seconds. The system prioritized the critical perimeter breach over secondary telemetry warnings, filtered 100% of duplicate alerts, and gave the operator clear triage controls without audio-visual clutter.'
      : 'Simulating concurrent multi-track alert surge.',
    strengths: [
      'Ranked alerts strictly by threat severity (CRITICAL > WARNING > INFO).',
      '100% duplicate suppression rate prevented notification cascade.',
      'Provided direct per-alert evidence inspection with zero UI freeze.'
    ],
    limitations: [
      'Operator cognitive capacity saturated when 4+ alerts arrived within a 2-second window.',
      'No automated correlation grouping (e.g., grouping T-03 & T-04 as a unified coordinated swarm).'
    ],
    recommendedSteps: [
      'Implement multi-agent clustering to bundle concurrent swarm incursions into a single parent dossier.',
      'Add an operator workload throttle that rolls secondary informational logs into a collapsed drawer during surges.'
    ]
  };
}

/* =========================================================================
   SCENARIO 4: COMBINED FAILURE
   ========================================================================= */
function computeCombinedFailureScenario(
  config: ScenarioConfig,
  t: number,
  progressPercent: number,
  acknowledgedIds: Set<string>
): ScenarioFrameState {
  const duration = config.durationSec;
  let healthState: SystemHealthState = 'NORMAL';
  let phaseLabel = 'Nominal Multi-sensor Tracking';
  let telemetryFreshnessSec = 0.4;
  let completeness = 100;
  let predictionErrorMeters = 18;
  let confidence: 'HIGH' | 'DEGRADED' | 'LOW' | 'RECOVERING' = 'HIGH';
  let isStale = false;
  let isDropped = false;

  // Track starts linear from (-5, 3) heading southeast
  let currentX = -5.0 + (t * 0.4);
  let currentY = 3.0 - (t * 0.25);
  let currentHeading = 120;

  // Linear prediction
  const forecastX = -5.0 + (t * 0.4);
  const forecastY = 3.0 - (t * 0.25);

  if (t < 5.0) {
    healthState = 'NORMAL';
    phaseLabel = 'Phase 1: Stable Multi-sensor Baseline';
    telemetryFreshnessSec = 0.4;
    completeness = 100;
    predictionErrorMeters = 16;
    confidence = 'HIGH';
  } else if (t < 11.0) {
    // Stage 1: Telemetry degradation begins
    healthState = 'DEGRADED';
    phaseLabel = 'Phase 2: RF Signal Degradation (Latency Climbing)';
    telemetryFreshnessSec = 0.4 + ((t - 5.0) * 0.8);
    completeness = 65;
    isDropped = t > 8.0;
    confidence = 'DEGRADED';
  } else if (t < 19.0) {
    // Stage 2: Kinematic diversion happens during the telemetry blackout!
    healthState = 'CRITICAL';
    phaseLabel = 'Phase 3: Compound Failure (Maneuver during Dropout)';
    isStale = true;
    isDropped = true;
    telemetryFreshnessSec = 5.2 + ((t - 11.0) * 0.6); // climbs to ~10s
    completeness = 30;
    confidence = 'LOW';

    // Maneuver during blackout
    const dt = t - 11.0;
    currentX = (-5.0 + (11.0 * 0.4)) + (dt * 0.1);
    currentY = (3.0 - (11.0 * 0.25)) - (dt * 0.6); // Sharp south dive
    currentHeading = 175;

    const deltaKm = Math.hypot(currentX - forecastX, currentY - forecastY);
    predictionErrorMeters = Math.round(deltaKm * 1000);
  } else {
    // Stage 3: Resynchronization & Human Review
    healthState = 'RECOVERING';
    phaseLabel = 'Phase 4: Telemetry Restored · Human Review Mandated';
    const recT = t - 19.0;
    telemetryFreshnessSec = Math.max(0.4, 7.0 * (1 - (recT / 5.0)));
    completeness = Math.round(30 + (70 * (recT / 5.0)));
    predictionErrorMeters = Math.max(52, Math.round(840 * (1 - (recT / 6.0))));
    confidence = 'RECOVERING';
    isStale = false;
    isDropped = false;
  }

  const allEvents: StressEvent[] = [
    {
      id: 'CF-01',
      simTimeSec: 0.0,
      timeFormatted: '00:00.0',
      category: 'SYSTEM',
      severity: 'INFO',
      title: 'Compound Stress Test Initialized',
      description: 'Dual fault generators primed for Track T-07: RF Latency + Kinematic Divergence.',
      evidence: 'Nominal telemetry: 1000ms · Extrapolation: 1st-Order Linear',
      acknowledged: acknowledgedIds.has('CF-01')
    },
    {
      id: 'CF-02',
      simTimeSec: 5.4,
      timeFormatted: '00:05.4',
      category: 'DATA_QUALITY',
      severity: 'WARNING',
      title: 'Telemetry Freshness Degraded',
      description: 'Observation age reached 2.8s. RF link SNR dropped to 11 dB.',
      trackId: 'T-07',
      evidence: 'Age: 2.8s · Missing frame #209 · Status: DEGRADED',
      acknowledged: acknowledgedIds.has('CF-02')
    },
    {
      id: 'CF-03',
      simTimeSec: 11.2,
      timeFormatted: '00:11.2',
      category: 'DATA_QUALITY',
      severity: 'CRITICAL',
      title: 'Telemetry Blackout Initiated',
      description: 'Observation age reached 6.0s. Trajectory forecast running open-loop without sensor ground truth.',
      trackId: 'T-07',
      evidence: 'Age: 6.1s · Dropout duration: 5.8s · Confidence: LOW',
      acknowledged: acknowledgedIds.has('CF-03')
    },
    {
      id: 'CF-04',
      simTimeSec: 14.8,
      timeFormatted: '00:14.8',
      category: 'KINEMATIC',
      severity: 'CRITICAL',
      title: 'Compound Breakpoint: Latency + Kinematic Error',
      description: 'Delayed packet revealed sharp 55° heading divergence during blackout. Forecast error: 890m.',
      trackId: 'T-07',
      evidence: 'Prediction Error: 890m · Telemetry Age: 7.4s · Human Review Required: MANDATED',
      acknowledged: acknowledgedIds.has('CF-04')
    },
    {
      id: 'CF-05',
      simTimeSec: 19.5,
      timeFormatted: '00:19.5',
      category: 'SYSTEM',
      severity: 'RECOVERY',
      title: 'Re-synchronization & Human Verification Flag',
      description: 'Fresh telemetry confirmed new vector heading 175°. Human operator sign-off required.',
      trackId: 'T-07',
      evidence: 'Latency: 380ms · Freshness: 0.6s · Vector: Verified · Flag: MANUAL_INSPECTION',
      acknowledged: acknowledgedIds.has('CF-05')
    }
  ];

  const activeEvents = allEvents.filter(e => e.simTimeSec <= t);

  const track: SimulatedStressTrack = {
    id: 'T-07',
    callsign: 'KHAIBAR-07 (SIM)',
    x: Number(currentX.toFixed(3)),
    y: Number(currentY.toFixed(3)),
    altitudeMeters: 175,
    speedKmh: 88,
    headingDeg: currentHeading,
    iff: 'hostile',
    classification: 'tactical-quad',
    isStale,
    isDropped,
    telemetryAgeSec: Number(telemetryFreshnessSec.toFixed(1)),
    history: [
      { x: -5.0, y: 3.0 },
      { x: -3.8, y: 2.2 },
      { x: -2.6, y: 1.5 }
    ],
    predictedTrajectory: [
      { x: forecastX + 0.8, y: forecastY - 0.5 },
      { x: forecastX + 1.6, y: forecastY - 1.0 },
      { x: forecastX + 2.4, y: forecastY - 1.5 }
    ],
    actualObservedTrajectory: [
      { x: currentX, y: currentY },
      { x: currentX + 0.2, y: currentY - 0.7 },
      { x: currentX + 0.4, y: currentY - 1.4 }
    ]
  };

  const breakpoints: BreakpointNode[] = [
    {
      id: 'BP-CF-1',
      simTimeSec: 0.0,
      timeLabel: '00:00.0',
      state: 'NORMAL',
      title: 'Nominal Operations',
      shortSummary: 'Observation age 0.4s. Prediction error 16m.',
      detailedExplanation: 'Both data acquisition and kinematic extrapolation are operating within nominal thresholds.',
      evidenceData: [
        { metric: 'Observation Age', value: '0.4s', threshold: '< 1.5s', status: 'PASS' },
        { metric: 'Prediction Error', value: '16m', threshold: '< 50m', status: 'PASS' },
        { metric: 'Integrity', value: '100%', threshold: '> 90%', status: 'PASS' }
      ],
      reliabilityImpact: 'Full automated confidence.'
    },
    {
      id: 'BP-CF-2',
      simTimeSec: 5.4,
      timeLabel: '00:05.4',
      state: 'DEGRADED',
      title: 'Phase 1: Telemetry Degrades',
      shortSummary: 'Packets delayed to 2.8s. Data quality flagged DEGRADED.',
      detailedExplanation: 'RF noise delayed frame arrival. The system registered the lag and raised a telemetry alert.',
      evidenceData: [
        { metric: 'Observation Age', value: '2.8s', threshold: '< 1.5s', status: 'WARN' },
        { metric: 'Completeness', value: '65%', threshold: '> 90%', status: 'WARN' },
        { metric: 'Confidence', value: 'DEGRADED', threshold: 'HIGH', status: 'WARN' }
      ],
      reliabilityImpact: 'Extrapolation variance increasing.'
    },
    {
      id: 'BP-CF-3',
      simTimeSec: 14.8,
      timeLabel: '00:14.8',
      state: 'CRITICAL',
      title: 'Compound Fault Breakpoint',
      shortSummary: 'Simultaneous 7.4s telemetry delay + 890m prediction error.',
      detailedExplanation: 'The target altered course during a communication blackout. When packet #212 finally arrived, both observation freshness AND kinematic accuracy failed simultaneously.',
      evidenceData: [
        { metric: 'Observation Age', value: '7.4s (Stale)', threshold: '< 5.0s', status: 'FAIL' },
        { metric: 'Prediction Error', value: '890 meters', threshold: '< 200m', status: 'FAIL' },
        { metric: 'Autonomous Safety', value: 'DISALLOWED', threshold: 'ALLOWED', status: 'FAIL' }
      ],
      reliabilityImpact: 'Autonomous actions suspended. Human operator inspection mandated.'
    },
    {
      id: 'BP-CF-4',
      simTimeSec: 19.5,
      timeLabel: '00:19.5',
      state: 'RECOVERING',
      title: 'Re-sync & Human Sign-off',
      shortSummary: 'Telemetry fresh (0.6s). Target position verified.',
      detailedExplanation: 'Fresh telemetry re-locked the target. The system clearly communicated that human inspection was required before returning to automated engagement readiness.',
      evidenceData: [
        { metric: 'Observation Age', value: '0.6s', threshold: '< 1.5s', status: 'PASS' },
        { metric: 'Heading Confirmed', value: '175° South', threshold: 'VERIFIED', status: 'PASS' },
        { metric: 'Human Review', value: 'MANDATED (Flagged)', threshold: 'N/A', status: 'WARN' }
      ],
      reliabilityImpact: 'Safe, explainable recovery with clear boundaries between automation and human authority.'
    }
  ];

  const metrics: EvaluationMetrics = {
    eventsGenerated: allEvents.length,
    eventsDetected: activeEvents.length,
    eventsMissed: 0,
    maxPredictionErrorMeters: predictionErrorMeters,
    maxTelemetryAgeSec: Number(telemetryFreshnessSec.toFixed(1)),
    durationInDegradedSec: t > 5.0 ? Number(Math.min(14.5, t - 5.0).toFixed(1)) : 0,
    timeToRecoverSec: t > 19.5 ? Number(Math.min(5.5, t - 19.5).toFixed(1)) : 0,
    humanReviewMandated: isStale || predictionErrorMeters > 500,
    duplicateRejectionRate: 100,
    unacknowledgedAlerts: activeEvents.filter(e => !e.acknowledged && e.severity !== 'INFO').length
  };

  return {
    simTimeSec: t,
    timeFormatted: formatSimTime(t),
    progressPercent,
    healthState,
    phaseLabel,
    tracks: [track],
    activeEvents,
    telemetryFreshnessSec: Number(telemetryFreshnessSec.toFixed(1)),
    observationCompletenessPercent: completeness,
    predictionErrorMeters,
    confidenceStatus: confidence,
    humanReviewMandated: isStale || predictionErrorMeters > 500,
    activeAlertCount: activeEvents.filter(e => !e.acknowledged).length,
    breakpoints,
    metrics,
    outcomeSummary: t >= duration
      ? 'A compound stress scenario combined a 7.4s telemetry blackout with an unannounced 55° heading change. The system distinguished the data-quality fault from the kinematic divergence and correctly suspended autonomous engagement until a human operator completed verification.'
      : 'Simulating compound failure: Telemetry latency concurrent with kinematic diversion.',
    strengths: [
      'Disentangled data-quality faults (stale packet age) from trajectory prediction error (890m).',
      'Enforced an unambiguous Human Review boundary when compound uncertainties exceeded safety thresholds.',
      'Re-synchronized tracking seamlessly once continuous sensor telemetry resumed.'
    ],
    limitations: [
      'During the 8.4s blackout, the projected threat envelope grew to over 3.2 km² without sensor feedback.',
      'Did not cross-validate with ground-based optical/acoustic azimuth sensors.'
    ],
    recommendedSteps: [
      'Incorporate multi-modal sensor fusion (RF + Optical tracking) to maintain situational certainty when one modality fades.',
      'Establish a formal Human-in-the-Loop (HITL) gatekeeper token for re-authorizing kinetic action after compound dropouts.'
    ]
  };
}
