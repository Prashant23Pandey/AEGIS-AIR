import type { DroneTrack } from '../types/telemetry';

// Helper to compute deterministic data quality score (0-100%) from real telemetry properties
export const computeTrackQuality = (t: DroneTrack): number => {
  if (t.status === 'NEUTRALIZED' || t.status === 'LOST_TRACK') return 0;
  // RSSI score: -50 dBm -> 100%, -75 dBm -> 65%, -95 dBm -> 20%
  const rssiScore = Math.min(100, Math.max(10, Math.round(((t.rssiDbm + 105) / 60) * 100)));
  // Fix continuity: up to 8 history fixes
  const historyScore = Math.min(100, (t.history?.length || 1) * 12.5);
  // Status penalty
  let penalty = 0;
  if (t.status === 'JAMMED') penalty = 45;
  if (t.status === 'SPOOFED') penalty = 65;

  return Math.max(5, Math.min(100, Math.round(rssiScore * 0.6 + historyScore * 0.4 - penalty)));
};
