export type StressScenarioId =
  | 'signal-fade'
  | 'unexpected-motion'
  | 'alert-surge'
  | 'combined-failure';

export type ScenarioStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export type SystemHealthState = 'NORMAL' | 'DEGRADED' | 'CRITICAL' | 'RECOVERING';

export type EventCategory = 'DATA_QUALITY' | 'KINEMATIC' | 'ALERT_SURGE' | 'SYSTEM';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'RECOVERY';

export interface StressEvent {
  id: string;
  simTimeSec: number;
  timeFormatted: string; // "00:04.2"
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  description: string;
  trackId?: string;
  evidence: string;
  acknowledged?: boolean;
  resolved?: boolean;
}

export interface BreakpointNode {
  id: string;
  simTimeSec: number;
  timeLabel: string;
  state: SystemHealthState;
  title: string;
  shortSummary: string;
  detailedExplanation: string;
  evidenceData: {
    metric: string;
    value: string;
    threshold: string;
    status: 'PASS' | 'WARN' | 'FAIL';
  }[];
  reliabilityImpact: string;
}

export interface SimulatedStressTrack {
  id: string;
  callsign: string;
  x: number; // km (-10 to 10)
  y: number; // km (-10 to 10)
  altitudeMeters: number;
  speedKmh: number;
  headingDeg: number;
  iff: 'hostile' | 'friendly' | 'unknown' | 'neutral';
  classification: string;
  isStale: boolean;
  isDropped: boolean;
  telemetryAgeSec: number;
  history: { x: number; y: number }[];
  predictedTrajectory: { x: number; y: number }[]; // Linear or extrapolated forecast
  actualObservedTrajectory?: { x: number; y: number }[];
}

export interface ScenarioDefinition {
  id: StressScenarioId;
  name: string;
  tag: string;
  difficulty: 'Routine' | 'Challenging' | 'Degraded';
  description: string;
  testedAspect: string;
  defaultDurationSec: number;
  keyHypothesis: string;
}

export interface ScenarioConfig {
  durationSec: number;
  telemetryDelaySeverity: 'LOW' | 'MEDIUM' | 'HIGH';
  dropProbability: number; // 0 to 1
  movementVariationDeg: number; // 30 to 120 deg
  concurrentTracksCount: number; // 1 to 6
}

export interface EvaluationMetrics {
  eventsGenerated: number;
  eventsDetected: number;
  eventsMissed: number;
  maxPredictionErrorMeters: number | null;
  maxTelemetryAgeSec: number;
  durationInDegradedSec: number;
  timeToRecoverSec: number;
  humanReviewMandated: boolean;
  duplicateRejectionRate: number; // % (always 100%)
  unacknowledgedAlerts: number;
}
