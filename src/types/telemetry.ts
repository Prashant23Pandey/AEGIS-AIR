export type DroneClassification = 
  | 'micro'
  | 'mini'
  | 'tactical-quad'
  | 'fixed-wing'
  | 'swarm-node'
  | 'commercial-diy';

export type IFFStatus = 'hostile' | 'friendly' | 'unknown' | 'neutral';

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TrackStatus = 
  | 'ACTIVE' 
  | 'JAMMED' 
  | 'SPOOFED' 
  | 'INTERCEPTED' 
  | 'NEUTRALIZED' 
  | 'LOST_TRACK';

export type CountermeasureType = 
  | 'RF_JAM' 
  | 'GPS_SPOOF' 
  | 'NET_CATCH' 
  | 'KINETIC_EMP';

export type Sector = 
  | 'NORTH' 
  | 'EAST' 
  | 'SOUTH' 
  | 'WEST' 
  | 'NORTH-EAST' 
  | 'NORTH-WEST' 
  | 'SOUTH-EAST' 
  | 'SOUTH-WEST';

export interface DroneTrack {
  id: string;
  callsign: string;
  classification: DroneClassification;
  iff: IFFStatus;
  threatLevel: ThreatLevel;
  x: number; // distance in km from base (-10 to 10)
  y: number; // distance in km from base (-10 to 10)
  distanceKm: number;
  azimuthDeg: number;
  altitudeMeters: number;
  speedKmh: number;
  headingDeg: number;
  rfFrequencyGhz: number;
  rssiDbm: number;
  protocol: string;
  payloadEstimate: string;
  originSector: Sector;
  status: TrackStatus;
  firstDetected: string;
  lastUpdated: string;
  lastUpdatedTimestamp?: number; // epoch ms for real freshness measurement
  history: { x: number; y: number }[];
  activeCountermeasure?: CountermeasureType | null;
  etaToPerimeterSeconds: number;
  batteryPercent: number;
  // Synthetic Ground Truth & Prediction Tracking
  predictedX?: number;
  predictedY?: number;
  lastPredictionErrorMeters?: number;
  dataQualityPercent?: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  timestampMs?: number; // epoch ms for exact time-window filtering
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  trackId?: string;
  actionTaken?: string;
  operator: string;
  acknowledged: boolean;
  category?: 'INCURSION' | 'COUNTERMEASURE' | 'IFF_OVERRIDE' | 'SYSTEM' | 'RECONNAISSANCE';
  measurementsSnapshot?: {
    distanceKm: number;
    altitudeMeters: number;
    speedKmh: number;
    rfFrequencyGhz: number;
    rssiDbm: number;
  };
}

export interface SystemKPIs {
  defconLevel: 1 | 2 | 3 | 4 | 5;
  activeTracks: number;
  hostileThreats: number;
  neutralizedThreats: number;
  radarSweepSpeedRpm: number;
  jammerReadinessPercent: number;
  interceptorDronesAvailable: number;
  perimeterBreaches24h: number;
  airspaceIntegrityScore: number;
  rfSensorHealth: number;
  audioAlertsEnabled: boolean;
  simulationRunning: boolean;
  simulationSpeed: number; // 1x, 2x, 5x
}

export interface TelemetryTimeSeriesPoint {
  time: string;
  simElapsedSec: number;
  activeCount: number;
  eventCount: number;
  criticalCount: number;
  latencyMs: number;
}

export interface PerformanceTimings {
  currentLatencyMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  history: number[];
}

export type ScenarioType = 'BASELINE' | 'SWARM' | 'KAMIKAZE' | 'RECON' | 'DEGRADATION';

export type ActiveTab = 'overview' | 'tracks' | 'events' | 'analytics' | 'reports';
