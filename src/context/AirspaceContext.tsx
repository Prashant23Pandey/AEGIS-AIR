import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { 
  DroneTrack, 
  SecurityEvent, 
  SystemKPIs, 
  ActiveTab, 
  CountermeasureType, 
  IFFStatus, 
  Sector, 
  ThreatLevel, 
  TrackStatus,
  TelemetryTimeSeriesPoint,
  PerformanceTimings,
  ScenarioType
} from '../types/telemetry';
import { INITIAL_TRACKS, INITIAL_EVENTS, INITIAL_KPIS } from '../utils/seedData';
import { computeTrackQuality } from '../utils/telemetryQuality';
import { tacticalAudio } from '../utils/audio';
import { AirspaceContext } from './airspaceContextDef';

// Helper to produce deterministic initial tracks
const createInitialTracks = (): DroneTrack[] => {
  const baseTimeMs = 1730000000000; // Deterministic epoch reference
  return INITIAL_TRACKS.map((t, idx) => ({
    ...t,
    lastUpdatedTimestamp: baseTimeMs - (idx * 1200),
    dataQualityPercent: computeTrackQuality(t),
    lastPredictionErrorMeters: Number((1.2 + idx * 0.8).toFixed(1))
  }));
};

// Helper to produce deterministic initial events
const createInitialEvents = (): SecurityEvent[] => {
  const baseTimeMs = 1730000000000;
  return INITIAL_EVENTS.map((e, idx) => ({
    ...e,
    timestampMs: baseTimeMs - (idx * 45000),
    category: (e.severity === 'CRITICAL' ? 'INCURSION' : e.severity === 'SUCCESS' ? 'SYSTEM' : 'RECONNAISSANCE') as SecurityEvent['category'],
    measurementsSnapshot: {
      distanceKm: 4.5 + idx,
      altitudeMeters: 250 + idx * 50,
      speedKmh: 75 + idx * 20,
      rfFrequencyGhz: 2.4 + idx * 0.5,
      rssiDbm: -65 - idx * 3
    }
  }));
};

export const AirspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<DroneTrack[]>(createInitialTracks);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>('TRK-7082');

  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    const initial = createInitialEvents();
    try {
      const savedAcked = localStorage.getItem('vayunet_acked_events');
      if (savedAcked) {
        const ackedSet = new Set<string>(JSON.parse(savedAcked));
        return initial.map(e => ackedSet.has(e.id) ? { ...e, acknowledged: true } : e);
      }
    } catch {
      // Ignore
    }
    return initial;
  });

  const [kpis, setKpis] = useState<SystemKPIs>(() => {
    try {
      const saved = localStorage.getItem('vayunet_kpis_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_KPIS,
          audioAlertsEnabled: parsed.audioAlertsEnabled ?? INITIAL_KPIS.audioAlertsEnabled,
          simulationSpeed: parsed.simulationSpeed ?? INITIAL_KPIS.simulationSpeed
        };
      }
    } catch {
      // Ignore
    }
    return INITIAL_KPIS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('vayunet_active_tab');
      if (saved && ['overview', 'events', 'analytics', 'reports'].includes(saved)) {
        return saved as ActiveTab;
      }
    } catch {
      // Ignore
    }
    return 'overview';
  });

  const [sectorFilter, setSectorFilter] = useState<Sector | 'ALL'>('ALL');
  const [radarSweepAngle, setRadarSweepAngle] = useState<number>(0);
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('BASELINE');
  const [simElapsedSeconds, setSimElapsedSeconds] = useState<number>(0);

  // De-duplication ref for restricted zone incursion events (prevents duplicate alert spam)
  const breachedTrackIdsRef = useRef<Set<string>>(new Set());

  // Synchronized refs to prevent interval recreation jitter on state updates
  const tracksRef = useRef(tracks);
  const eventsRef = useRef(events);
  const simElapsedSecondsRef = useRef(simElapsedSeconds);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    simElapsedSecondsRef.current = simElapsedSeconds;
  }, [simElapsedSeconds]);

  // Time-Series buffer
  const [timeSeriesData, setTimeSeriesData] = useState<TelemetryTimeSeriesPoint[]>(() => {
    const baseline: TelemetryTimeSeriesPoint[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(now - i * 3000);
      baseline.push({
        time: d.toLocaleTimeString('en-IN', { hour12: false }),
        simElapsedSec: Math.max(0, 20 - i),
        activeCount: 6,
        eventCount: 5,
        criticalCount: 2,
        latencyMs: Number((1.1 + Math.sin(i) * 0.4).toFixed(2))
      });
    }
    return baseline;
  });

  // Performance timings buffer
  const [performanceTimings, setPerformanceTimings] = useState<PerformanceTimings>({
    currentLatencyMs: 1.25,
    avgLatencyMs: 1.18,
    minLatencyMs: 0.62,
    maxLatencyMs: 2.85,
    history: [1.1, 1.3, 0.9, 1.4, 1.2, 1.1, 1.5, 0.8, 1.2, 1.3]
  });

  const latencyHistoryRef = useRef<number[]>([1.1, 1.3, 0.9, 1.4, 1.2, 1.1, 1.5, 0.8, 1.2, 1.3]);

  const handleSetActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('vayunet_active_tab', tab);
    } catch {
      // Ignore
    }
  }, []);

  // Audio mute/unmute sync with persistence
  const toggleAudio = useCallback(() => {
    setKpis(prev => {
      const next = !prev.audioAlertsEnabled;
      tacticalAudio.enabled = next;
      const updated = { ...prev, audioAlertsEnabled: next };
      try {
        localStorage.setItem('vayunet_kpis_prefs', JSON.stringify({
          audioAlertsEnabled: next,
          simulationSpeed: prev.simulationSpeed
        }));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const selectTrack = useCallback((id: string | null) => {
    setSelectedTrackId(id);
  }, []);

  const acknowledgeEvent = useCallback((id: string) => {
    setEvents(prev => {
      const updated = prev.map(evt => evt.id === id ? { ...evt, acknowledged: true } : evt);
      try {
        const ackedIds = updated.filter(e => e.acknowledged).map(e => e.id);
        localStorage.setItem('vayunet_acked_events', JSON.stringify(ackedIds));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const clearResolvedEvents = useCallback(() => {
    setEvents(prev => prev.filter(evt => !evt.acknowledged || evt.severity === 'CRITICAL'));
  }, []);

  const setSimulationSpeed = useCallback((speed: number) => {
    setKpis(prev => {
      const updated = { ...prev, simulationSpeed: speed };
      try {
        localStorage.setItem('vayunet_kpis_prefs', JSON.stringify({
          audioAlertsEnabled: prev.audioAlertsEnabled,
          simulationSpeed: speed
        }));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const toggleSimulation = useCallback(() => {
    setKpis(prev => ({ ...prev, simulationRunning: !prev.simulationRunning }));
  }, []);

  // Strict deterministic reset
  const resetToDefault = useCallback(() => {
    breachedTrackIdsRef.current.clear();
    try {
      localStorage.removeItem('vayunet_acked_events');
    } catch {
      // Ignore
    }

    const freshTracks = createInitialTracks();
    const freshEvents = createInitialEvents();

    setTracks(freshTracks);
    setEvents(freshEvents);
    setKpis(INITIAL_KPIS);
    setSelectedTrackId('TRK-7082');
    setSectorFilter('ALL');
    setCurrentScenario('BASELINE');
    setSimElapsedSeconds(0);
    setRadarSweepAngle(0);

    const resetPoint: TelemetryTimeSeriesPoint = {
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      simElapsedSec: 0,
      activeCount: freshTracks.filter(t => t.status === 'ACTIVE').length,
      eventCount: freshEvents.length,
      criticalCount: freshEvents.filter(e => e.severity === 'CRITICAL').length,
      latencyMs: 1.0
    };
    setTimeSeriesData([resetPoint]);
    setPerformanceTimings({
      currentLatencyMs: 1.0,
      avgLatencyMs: 1.0,
      minLatencyMs: 0.8,
      maxLatencyMs: 1.5,
      history: [1.0, 1.1, 0.9]
    });
  }, []);

  // Update IFF Status
  const updateIFF = useCallback((trackId: string, iff: IFFStatus) => {
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const nowMs = Date.now();

    let targetTrack: DroneTrack | undefined;

    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        let threatLevel: ThreatLevel = 'LOW';
        if (iff === 'hostile') threatLevel = 'HIGH';
        if (iff === 'unknown') threatLevel = 'MEDIUM';
        const updated = {
          ...t,
          iff,
          threatLevel,
          lastUpdated: nowStr,
          lastUpdatedTimestamp: nowMs,
          dataQualityPercent: computeTrackQuality({ ...t, iff })
        };
        targetTrack = updated;
        return updated;
      }
      return t;
    }));

    const newEvent: SecurityEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      timestampMs: nowMs,
      severity: iff === 'hostile' ? 'WARNING' : 'INFO',
      title: `IFF Reclassified: ${trackId}`,
      message: `Operator manual override: Track ${trackId} designated as ${iff.toUpperCase()}.`,
      trackId,
      operator: 'COMMAND-OPERATOR',
      category: 'IFF_OVERRIDE',
      acknowledged: true,
      measurementsSnapshot: targetTrack ? {
        distanceKm: targetTrack.distanceKm,
        altitudeMeters: targetTrack.altitudeMeters,
        speedKmh: targetTrack.speedKmh,
        rfFrequencyGhz: targetTrack.rfFrequencyGhz,
        rssiDbm: targetTrack.rssiDbm
      } : undefined
    };
    setEvents(prev => [newEvent, ...prev]);
  }, []);

  // Trigger Countermeasure
  const triggerCountermeasure = useCallback((trackId: string, type: CountermeasureType) => {
    tacticalAudio.playEngagementSound();
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const nowMs = Date.now();

    let eventTitle = '';
    let eventMsg = '';
    let newStatus: DroneTrack['status'] = 'ACTIVE';

    if (type === 'RF_JAM') {
      eventTitle = `Directional RF Jammer Engaged: ${trackId}`;
      eventMsg = `Broadband RF disruption emitted on 2.4/5.8GHz and control uplink. C2 link severed.`;
      newStatus = 'JAMMED';
    } else if (type === 'GPS_SPOOF') {
      eventTitle = `GNSS Spoofing Active: ${trackId}`;
      eventMsg = `Coordinated false ephemeris beacon transmitted. Target navigation system recalibrated to false waypoint.`;
      newStatus = 'SPOOFED';
    } else if (type === 'NET_CATCH') {
      eventTitle = `Kinetic Interceptor Deployed: ${trackId}`;
      eventMsg = `Sentry-02 Autonomous Interceptor launched. High-speed net entanglement initiated.`;
      newStatus = 'INTERCEPTED';
    } else if (type === 'KINETIC_EMP') {
      eventTitle = `High-Power EMP Strobe Fired: ${trackId}`;
      eventMsg = `Electromagnetic pulse targeted at avionics. Onboard ESCs and MCU deactivated.`;
      newStatus = 'NEUTRALIZED';
    }

    let targetTrack: DroneTrack | undefined;

    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        let newHeading = t.headingDeg;
        let newSpeed = t.speedKmh;
        if (type === 'GPS_SPOOF') newHeading = (t.headingDeg + 180) % 360;
        if (type === 'RF_JAM') newSpeed = Math.max(10, t.speedKmh * 0.4);

        const updated = {
          ...t,
          status: newStatus,
          activeCountermeasure: type,
          headingDeg: newHeading,
          speedKmh: newSpeed,
          lastUpdated: nowStr,
          lastUpdatedTimestamp: nowMs,
          dataQualityPercent: computeTrackQuality({ ...t, status: newStatus })
        };
        targetTrack = updated;
        return updated;
      }
      return t;
    }));

    setKpis(prev => ({
      ...prev,
      jammerReadinessPercent: Math.max(40, prev.jammerReadinessPercent - (type === 'RF_JAM' ? 15 : 5)),
      interceptorDronesAvailable: type === 'NET_CATCH' ? Math.max(0, prev.interceptorDronesAvailable - 1) : prev.interceptorDronesAvailable
    }));

    const newEvent: SecurityEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      timestampMs: nowMs,
      severity: 'WARNING',
      title: eventTitle,
      message: eventMsg,
      trackId,
      actionTaken: type,
      category: 'COUNTERMEASURE',
      operator: 'TAC-OFFICER-01',
      acknowledged: false,
      measurementsSnapshot: targetTrack ? {
        distanceKm: targetTrack.distanceKm,
        altitudeMeters: targetTrack.altitudeMeters,
        speedKmh: targetTrack.speedKmh,
        rfFrequencyGhz: targetTrack.rfFrequencyGhz,
        rssiDbm: targetTrack.rssiDbm
      } : undefined
    };

    setEvents(prev => [newEvent, ...prev]);
  }, []);

  // Inject Threats
  const injectThreat = useCallback((scenario: 'SWARM' | 'KAMIKAZE' | 'RECON' | 'DEGRADATION' | 'UNKNOWN' = 'SWARM') => {
    const idSuffix = Math.floor(1000 + Math.random() * 9000);
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const nowMs = Date.now();

    setCurrentScenario(
      scenario === 'SWARM' ? 'SWARM' :
      scenario === 'KAMIKAZE' ? 'KAMIKAZE' :
      scenario === 'DEGRADATION' ? 'DEGRADATION' : 'RECON'
    );

    if (scenario === 'SWARM') {
      const baseAngle = Math.floor(Math.random() * 360);
      const rad = (baseAngle * Math.PI) / 180;
      const dist = 6.8;

      const swarmNodes: DroneTrack[] = [1, 2, 3].map(i => {
        const offset = (i - 2) * 0.3;
        const x = Number((Math.sin(rad) * dist + offset).toFixed(2));
        const y = Number((Math.cos(rad) * dist + offset).toFixed(2));
        const heading = (baseAngle + 180) % 360;

        return {
          id: `TRK-${idSuffix + i}`,
          callsign: `SWARM-BETA-0${i}`,
          classification: 'swarm-node',
          iff: 'hostile',
          threatLevel: 'CRITICAL',
          x,
          y,
          distanceKm: Number(Math.hypot(x, y).toFixed(2)),
          azimuthDeg: baseAngle,
          altitudeMeters: 120 + i * 15,
          speedKmh: 110,
          headingDeg: heading,
          rfFrequencyGhz: 5.765 + (i * 0.02),
          rssiDbm: -58,
          protocol: 'Mesh Telemetry 915MHz',
          payloadEstimate: 'Shaped Frag Charge (Kamikaze)',
          originSector: baseAngle > 270 ? 'NORTH-WEST' : baseAngle > 180 ? 'SOUTH-WEST' : baseAngle > 90 ? 'SOUTH-EAST' : 'NORTH-EAST',
          status: 'ACTIVE',
          firstDetected: nowStr,
          lastUpdated: nowStr,
          lastUpdatedTimestamp: nowMs,
          history: [{ x, y }],
          etaToPerimeterSeconds: 65,
          batteryPercent: 85,
          lastPredictionErrorMeters: 1.5,
          dataQualityPercent: 88
        };
      });

      setTracks(prev => [...swarmNodes, ...prev]);
      tacticalAudio.playThreatAlarm();

      const newEvt: SecurityEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        timestampMs: nowMs,
        severity: 'CRITICAL',
        title: 'ALERT: Coordinated Tri-Drone Swarm Detected',
        message: `High-speed 3-unit FPV drone swarm identified approaching sector azimuth ${baseAngle}°. Rapid engagement authorized.`,
        operator: 'RADAR-AUTOMATION',
        category: 'INCURSION',
        acknowledged: false,
        measurementsSnapshot: {
          distanceKm: dist,
          altitudeMeters: 135,
          speedKmh: 110,
          rfFrequencyGhz: 5.78,
          rssiDbm: -58
        }
      };
      setEvents(prev => [newEvt, ...prev]);
    } else if (scenario === 'KAMIKAZE') {
      const angle = 220;
      const rad = (angle * Math.PI) / 180;
      const x = Number((Math.sin(rad) * 8.2).toFixed(2));
      const y = Number((Math.cos(rad) * 8.2).toFixed(2));

      const newKamikaze: DroneTrack = {
        id: `TRK-${idSuffix}`,
        callsign: 'VIPER-FPV-KAMIKAZE',
        classification: 'micro',
        iff: 'hostile',
        threatLevel: 'CRITICAL',
        x,
        y,
        distanceKm: 8.2,
        azimuthDeg: angle,
        altitudeMeters: 65,
        speedKmh: 145,
        headingDeg: 40,
        rfFrequencyGhz: 5.865,
        rssiDbm: -54,
        protocol: 'Low-Latency Analogue VTX',
        payloadEstimate: 'Contact Detonation Warhead',
        originSector: 'SOUTH-WEST',
        status: 'ACTIVE',
        firstDetected: nowStr,
        lastUpdated: nowStr,
        lastUpdatedTimestamp: nowMs,
        history: [{ x, y }],
        etaToPerimeterSeconds: 48,
        batteryPercent: 92,
        lastPredictionErrorMeters: 2.1,
        dataQualityPercent: 92
      };

      setTracks(prev => [newKamikaze, ...prev]);
      setSelectedTrackId(newKamikaze.id);
      tacticalAudio.playThreatAlarm();

      const newEvt: SecurityEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        timestampMs: nowMs,
        severity: 'CRITICAL',
        title: 'High-Speed Low-Altitude Ingress Detected',
        message: `VIPER-FPV detected at 65m altitude. Ingress speed 145 km/h. High priority countermeasure recommended.`,
        trackId: newKamikaze.id,
        operator: 'RADAR-AUTOMATION',
        category: 'INCURSION',
        acknowledged: false,
        measurementsSnapshot: {
          distanceKm: 8.2,
          altitudeMeters: 65,
          speedKmh: 145,
          rfFrequencyGhz: 5.865,
          rssiDbm: -54
        }
      };
      setEvents(prev => [newEvt, ...prev]);
    } else if (scenario === 'DEGRADATION') {
      setCurrentScenario('DEGRADATION');
      tacticalAudio.playThreatAlarm();

      setTracks(prev => prev.map(t => {
        if (t.status === 'ACTIVE') {
          return {
            ...t,
            rssiDbm: Math.max(-95, t.rssiDbm - 24),
            dataQualityPercent: Math.max(25, (t.dataQualityPercent || 80) - 45),
            lastPredictionErrorMeters: Number(((t.lastPredictionErrorMeters || 1.2) * 2.8).toFixed(1))
          };
        }
        return t;
      }));

      const newEvt: SecurityEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        timestampMs: nowMs,
        severity: 'WARNING',
        title: 'ALERT: Environmental RF Noise / Telemetry Degradation Injected',
        message: 'Broadband interference detected on 2.4/5.8 GHz ISM bands. Telemetry packet jitter elevated; SNR dropped across sector receivers.',
        operator: 'EW-MONITORING',
        category: 'SYSTEM',
        acknowledged: false,
        measurementsSnapshot: {
          distanceKm: 0,
          altitudeMeters: 0,
          speedKmh: 0,
          rfFrequencyGhz: 2.45,
          rssiDbm: -92
        }
      };
      setEvents(prev => [newEvt, ...prev]);
    } else {
      const x = Number((Math.random() * 8 - 4).toFixed(2));
      const y = Number((Math.random() * 8 - 4).toFixed(2));
      const dist = Number(Math.hypot(x, y).toFixed(2));
      const az = Math.floor(((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360);

      const newRecon: DroneTrack = {
        id: `TRK-${idSuffix}`,
        callsign: `UAV-INTRUDER-${idSuffix % 100}`,
        classification: 'commercial-diy',
        iff: 'unknown',
        threatLevel: 'MEDIUM',
        x,
        y,
        distanceKm: dist,
        azimuthDeg: az,
        altitudeMeters: 280,
        speedKmh: 50,
        headingDeg: (az + 180) % 360,
        rfFrequencyGhz: 2.457,
        rssiDbm: -72,
        protocol: 'Wi-Fi Broadcast FPV',
        payloadEstimate: '4K Surveillance Gimbal',
        originSector: 'NORTH',
        status: 'ACTIVE',
        firstDetected: nowStr,
        lastUpdated: nowStr,
        lastUpdatedTimestamp: nowMs,
        history: [{ x, y }],
        etaToPerimeterSeconds: 150,
        batteryPercent: 78,
        lastPredictionErrorMeters: 0.9,
        dataQualityPercent: 74
      };

      setTracks(prev => [newRecon, ...prev]);
      setSelectedTrackId(newRecon.id);

      const newEvt: SecurityEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        timestampMs: nowMs,
        severity: 'WARNING',
        title: 'New Unidentified Air Contact',
        message: `Contact ${newRecon.id} detected at ${dist} km. No IFF response received.`,
        trackId: newRecon.id,
        operator: 'RF-ARRAY',
        category: 'RECONNAISSANCE',
        acknowledged: false,
        measurementsSnapshot: {
          distanceKm: dist,
          altitudeMeters: 280,
          speedKmh: 50,
          rfFrequencyGhz: 2.457,
          rssiDbm: -72
        }
      };
      setEvents(prev => [newEvt, ...prev]);
    }
  }, []);

  // Main Simulation Loop with Ground-Truth & Latency Measurement
  useEffect(() => {
    // If paused, timer is cleared immediately
    if (!kpis.simulationRunning) return;

    const intervalMs = 1000 / kpis.simulationSpeed;

    const timer = setInterval(() => {
      const tickStart = performance.now();
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const nowMs = Date.now();

      // 1. Radar sweep angle
      setRadarSweepAngle(prev => (prev + (6 * kpis.simulationSpeed)) % 360);
      setSimElapsedSeconds(prev => prev + 1);

      // 2. Physics & Prediction Error vs Synthetic Ground Truth
      setTracks(prevTracks => {
        let perimeterBreached = false;

        const updated = prevTracks.map(track => {
          if (track.status === 'NEUTRALIZED' || track.status === 'LOST_TRACK') {
            return track;
          }

          let speed = track.speedKmh;
          let heading = track.headingDeg;
          let alt = track.altitudeMeters;
          let status: TrackStatus = track.status;
          let battery = Math.max(0, track.batteryPercent - 0.05);

          // Countermeasure physics
          if (track.activeCountermeasure === 'RF_JAM') {
            heading = (heading + (Math.random() * 40 - 20)) % 360;
            alt = Math.max(0, alt - 15);
            speed = Math.max(5, speed * 0.85);
            if (alt <= 5) {
              status = 'NEUTRALIZED';
              alt = 0;
              speed = 0;
            }
          } else if (track.activeCountermeasure === 'GPS_SPOOF') {
            alt = Math.max(50, alt - 5);
          } else if (track.activeCountermeasure === 'NET_CATCH') {
            alt = Math.max(0, alt - 35);
            speed = Math.max(0, speed * 0.5);
            if (alt <= 5) {
              status = 'NEUTRALIZED';
              alt = 0;
              speed = 0;
            }
          }

          const dt = (intervalMs / 1000) * 1.8;
          const deltaKm = (speed / 3600) * dt;
          const radHeading = (heading * Math.PI) / 180;

          // Pure Extrapolated Position (Model Prediction)
          const predX = Number((track.x + Math.sin(radHeading) * deltaKm).toFixed(3));
          const predY = Number((track.y + Math.cos(radHeading) * deltaKm).toFixed(3));

          // Synthetic Ground Truth: Actual movement has small simulated atmospheric drag/gust
          const gustJitter = (Math.sin(track.azimuthDeg + alt) * 0.003);
          const actualX = Number((predX + gustJitter).toFixed(3));
          const actualY = Number((predY + gustJitter * 0.5).toFixed(3));

          // Prediction Error in meters (Euclidean distance between prediction and ground truth)
          const predErrorM = Number((Math.hypot(actualX - predX, actualY - predY) * 1000).toFixed(1));

          const newDistance = Number(Math.hypot(actualX, actualY).toFixed(2));
          const newAzimuth = Math.floor(((Math.atan2(actualX, actualY) * 180 / Math.PI) + 360) % 360);
          const distToPerimeter = Math.max(0, newDistance - 2.5);
          const etaSec = speed > 5 ? Math.round((distToPerimeter / (speed / 3600))) : 999;

          if (newDistance <= 2.5 && track.distanceKm > 2.5 && track.iff === 'hostile') {
            if (!breachedTrackIdsRef.current.has(track.id)) {
              breachedTrackIdsRef.current.add(track.id);
              perimeterBreached = true;

              const incursionEvt: SecurityEvent = {
                id: `EVT-${Date.now().toString().slice(-4)}`,
                timestamp: nowStr,
                timestampMs: nowMs,
                severity: 'CRITICAL',
                title: `ALERT: Core Perimeter Incursion (${track.callsign})`,
                message: `Hostile contact ${track.callsign} (${track.id}) crossed the 2.5 km protected core zone boundary at altitude ${Math.round(alt)}m and speed ${Math.round(speed)} km/h. Countermeasure engagement authorized.`,
                trackId: track.id,
                operator: 'AUTOMATED-RADAR-PERIMETER',
                category: 'INCURSION',
                acknowledged: false,
                measurementsSnapshot: {
                  distanceKm: newDistance,
                  altitudeMeters: Math.round(alt),
                  speedKmh: Math.round(speed),
                  rfFrequencyGhz: track.rfFrequencyGhz,
                  rssiDbm: track.rssiDbm
                }
              };
              setEvents(prev => [incursionEvt, ...prev]);
            }
          }

          const newHistory = [
            ...track.history.slice(-8),
            { x: actualX, y: actualY }
          ];

          const updatedTrack: DroneTrack = {
            ...track,
            x: actualX,
            y: actualY,
            distanceKm: newDistance,
            azimuthDeg: newAzimuth,
            altitudeMeters: Math.round(alt),
            speedKmh: Math.round(speed),
            headingDeg: Math.round((heading + 360) % 360),
            status,
            history: newHistory,
            etaToPerimeterSeconds: etaSec,
            batteryPercent: Number(battery.toFixed(1)),
            lastUpdated: nowStr,
            lastUpdatedTimestamp: nowMs,
            predictedX: predX,
            predictedY: predY,
            lastPredictionErrorMeters: predErrorM,
            dataQualityPercent: computeTrackQuality({ ...track, status, history: newHistory })
          };

          return updatedTrack;
        });

        if (perimeterBreached) {
          tacticalAudio.playThreatAlarm();
        }

        return updated;
      });

      // Slowly recharge jammer
      setKpis(prev => ({
        ...prev,
        jammerReadinessPercent: Math.min(100, prev.jammerReadinessPercent + 1)
      }));

      // 3. Record Actual Processing Latency
      const tickDurationMs = Number((performance.now() - tickStart).toFixed(2));
      latencyHistoryRef.current = [...latencyHistoryRef.current.slice(-29), tickDurationMs];
      const latencies = latencyHistoryRef.current;
      const avgLat = Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2));
      const minLat = Number(Math.min(...latencies).toFixed(2));
      const maxLat = Number(Math.max(...latencies).toFixed(2));

      setPerformanceTimings({
        currentLatencyMs: tickDurationMs,
        avgLatencyMs: avgLat,
        minLatencyMs: minLat,
        maxLatencyMs: maxLat,
        history: [...latencies]
      });

      // 4. Record Time-Series Sample using ref snapshot to prevent loop restarts
      setTimeSeriesData(prev => {
        const curTracks = tracksRef.current;
        const curEvents = eventsRef.current;
        const curSec = simElapsedSecondsRef.current;

        const active = curTracks.filter(t => t.status !== 'NEUTRALIZED' && t.status !== 'LOST_TRACK').length;
        const newPoint: TelemetryTimeSeriesPoint = {
          time: nowStr,
          simElapsedSec: curSec + 1,
          activeCount: active,
          eventCount: curEvents.length,
          criticalCount: curEvents.filter(e => e.severity === 'CRITICAL').length,
          latencyMs: tickDurationMs
        };
        return [...prev.slice(-49), newPoint];
      });

    }, intervalMs);

    return () => clearInterval(timer);
  }, [kpis.simulationRunning, kpis.simulationSpeed]);

  // Dynamically compute KPIs
  const dynamicKpis = useMemo(() => {
    const active = tracks.filter(t => t.status !== 'NEUTRALIZED' && t.status !== 'LOST_TRACK').length;
    const hostile = tracks.filter(t => t.iff === 'hostile' && t.status !== 'NEUTRALIZED').length;
    const neutralized = tracks.filter(t => t.status === 'NEUTRALIZED' || t.status === 'INTERCEPTED').length;
    
    let defcon: 1 | 2 | 3 | 4 | 5 = 4;
    const closestHostile = tracks
      .filter(t => t.iff === 'hostile' && t.status === 'ACTIVE')
      .reduce((min, t) => Math.min(min, t.distanceKm), 999);

    if (closestHostile < 2.5) defcon = 1;
    else if (closestHostile < 5.0) defcon = 2;
    else if (closestHostile < 8.0) defcon = 3;
    else defcon = 4;

    const integrity = Math.max(10, Math.min(100, Math.round(100 - (hostile * 7) - (defcon === 1 ? 25 : 0))));

    return {
      ...kpis,
      activeTracks: active,
      hostileThreats: hostile,
      neutralizedThreats: neutralized,
      defconLevel: defcon,
      airspaceIntegrityScore: integrity
    };
  }, [tracks, kpis]);

  const selectedTrack = useMemo(() => {
    return tracks.find(t => t.id === selectedTrackId) || null;
  }, [tracks, selectedTrackId]);

  return (
    <AirspaceContext.Provider value={{
      tracks,
      selectedTrack,
      selectedTrackId,
      events,
      kpis: dynamicKpis,
      activeTab,
      sectorFilter,
      radarSweepAngle,
      timeSeriesData,
      performanceTimings,
      currentScenario,
      simElapsedSeconds,
      selectTrack,
      setActiveTab: handleSetActiveTab,
      setSectorFilter,
      triggerCountermeasure,
      updateIFF,
      injectThreat,
      toggleSimulation,
      setSimulationSpeed,
      toggleAudio,
      acknowledgeEvent,
      clearResolvedEvents,
      resetToDefault
    }}>
      {children}
    </AirspaceContext.Provider>
  );
};
