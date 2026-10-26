import { createContext } from 'react';
import type { 
  DroneTrack, 
  SecurityEvent, 
  SystemKPIs, 
  ActiveTab, 
  CountermeasureType, 
  IFFStatus, 
  Sector, 
  TelemetryTimeSeriesPoint,
  PerformanceTimings,
  ScenarioType
} from '../types/telemetry';

export interface AirspaceContextType {
  tracks: DroneTrack[];
  selectedTrack: DroneTrack | null;
  selectedTrackId: string | null;
  events: SecurityEvent[];
  kpis: SystemKPIs;
  activeTab: ActiveTab;
  sectorFilter: Sector | 'ALL';
  radarSweepAngle: number;
  timeSeriesData: TelemetryTimeSeriesPoint[];
  performanceTimings: PerformanceTimings;
  currentScenario: ScenarioType;
  simElapsedSeconds: number;
  
  // Actions
  selectTrack: (id: string | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSectorFilter: (sector: Sector | 'ALL') => void;
  triggerCountermeasure: (trackId: string, type: CountermeasureType) => void;
  updateIFF: (trackId: string, iff: IFFStatus) => void;
  injectThreat: (scenario?: 'SWARM' | 'KAMIKAZE' | 'RECON' | 'DEGRADATION' | 'UNKNOWN') => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  toggleAudio: () => void;
  acknowledgeEvent: (id: string) => void;
  clearResolvedEvents: () => void;
  resetToDefault: () => void;
}

export const AirspaceContext = createContext<AirspaceContextType | undefined>(undefined);
