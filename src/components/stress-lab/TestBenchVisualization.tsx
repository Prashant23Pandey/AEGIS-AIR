import React, { useRef, useEffect } from 'react';
import type { SimulatedStressTrack, StressScenarioId } from './types';
import { Target, Compass, AlertCircle } from 'lucide-react';

interface TestBenchVisualizationProps {
  tracks: SimulatedStressTrack[];
  scenarioId: StressScenarioId;
  predictionErrorMeters: number | null;
  telemetryFreshnessSec: number;
  isStale: boolean;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
}

export const TestBenchVisualization: React.FC<TestBenchVisualizationProps> = ({
  tracks,
  scenarioId,
  predictionErrorMeters,
  telemetryFreshnessSec,
  isStale,
  selectedTrackId,
  onSelectTrack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map km coordinate (-10 to 10) to canvas pixel
  const kmToPx = (kmVal: number, size: number): number => {
    // 0km is center (size / 2), range is -10 to +10 km
    const pad = 25;
    const radiusPx = (size / 2) - pad;
    return (size / 2) + (kmVal / 10) * radiusPx;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, Math.max(380, rect.height || 420));

    // Support high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const pad = 25;
    const maxR = (size / 2) - pad;

    // 1. Background grid fill
    ctx.fillStyle = '#060D1E';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR + 10, 0, Math.PI * 2);
    ctx.fill();

    // 2. Subtle radial tactical grid
    ctx.strokeStyle = '#142547';
    ctx.lineWidth = 1;

    // Range rings: 2.5km, 5km, 7.5km, 10km
    const rings = [
      { rKm: 2.5, label: '2.5 km (Core Protected Zone)', color: '#4F46E5', isCore: true },
      { rKm: 5.0, label: '5.0 km (Sector Alpha)', color: '#1E3A8A' },
      { rKm: 7.5, label: '7.5 km (Outer Perimeter)', color: '#1E293B' },
      { rKm: 10.0, label: '10.0 km (Max Detection Radar)', color: '#334155' }
    ];

    rings.forEach(({ rKm, color, isCore }) => {
      const rPx = (rKm / 10) * maxR;
      ctx.beginPath();
      ctx.arc(cx, cy, rPx, 0, Math.PI * 2);

      if (isCore) {
        ctx.fillStyle = 'rgba(79, 70, 229, 0.08)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.6)';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = color;
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Ring distance labels
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.fillText(`${rKm}km`, cx + 6, cy - rPx + 10);
    });

    // 3. Azimuth crosshairs
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - maxR, cy);
    ctx.lineTo(cx + maxR, cy);
    ctx.moveTo(cx, cy - maxR);
    ctx.lineTo(cx, cy + maxR);
    ctx.stroke();

    // Compass cardinal markers
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N (000°)', cx, cy - maxR - 6);
    ctx.fillText('S (180°)', cx, cy + maxR + 14);
    ctx.fillText('W (270°)', cx - maxR - 4, cy + 3);
    ctx.fillText('E (090°)', cx + maxR + 4, cy + 3);

    // Center base icon
    ctx.fillStyle = '#70FF00';
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A3E635';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AEGIS HQ [0,0]', cx, cy + 13);

    // 4. Render Tracks
    tracks.forEach((t) => {
      const tx = kmToPx(t.x, size);
      // Screen Y is inverted (+Y is North/up)
      const ty = size - kmToPx(t.y, size);

      const isSelected = selectedTrackId === t.id;

      // A. Historical Path
      if (t.history && t.history.length > 0) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        t.history.forEach((pt, idx) => {
          const hx = kmToPx(pt.x, size);
          const hy = size - kmToPx(pt.y, size);
          if (idx === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        });
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // B. Forecast Trajectory (Dashed Amber line)
      if (t.predictedTrajectory && t.predictedTrajectory.length > 0) {
        ctx.strokeStyle = '#F59E0B'; // Amber forecast
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        t.predictedTrajectory.forEach((pt) => {
          const px = kmToPx(pt.x, size);
          const py = size - kmToPx(pt.y, size);
          ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Final predicted point marker
        const lastPt = t.predictedTrajectory[t.predictedTrajectory.length - 1];
        const lastPx = kmToPx(lastPt.x, size);
        const lastPy = size - kmToPx(lastPt.y, size);
        ctx.strokeStyle = '#F59E0B';
        ctx.strokeRect(lastPx - 3, lastPy - 3, 6, 6);
        ctx.fillStyle = '#F59E0B';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('FORECAST', lastPx + 6, lastPy + 2);
      }

      // C. Kinematic Divergence Line (if unexpected motion)
      if (scenarioId === 'unexpected-motion' && predictionErrorMeters && predictionErrorMeters > 50) {
        if (t.predictedTrajectory && t.predictedTrajectory.length > 0) {
          const expectedPt = t.predictedTrajectory[0];
          const ePx = kmToPx(expectedPt.x, size);
          const ePy = size - kmToPx(expectedPt.y, size);

          // Red gap line between actual position and expected
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(ePx, ePy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Error label on line
          const midX = (tx + ePx) / 2;
          const midY = (ty + ePy) / 2;
          ctx.fillStyle = '#EF4444';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`Δ ${predictionErrorMeters}m`, midX + 6, midY - 2);
        }
      }

      // D. Stale / Packet Loss Pulse
      if (t.isStale || isStale) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(tx, ty, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SIGNAL STALE (${telemetryFreshnessSec}s)`, tx, ty - 14);
      }

      // E. Drone Target Marker
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(((t.headingDeg - 90) * Math.PI) / 180);

      const color = t.iff === 'hostile' ? '#EF4444' : t.iff === 'friendly' ? '#70FF00' : '#FFC700';

      // Heading arrow / target glyph
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-7, -6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#FF2E93';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Callsign label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.callsign, tx, ty + 16);

      // Speed & Altitude
      ctx.fillStyle = '#94A3B8';
      ctx.font = '8px monospace';
      ctx.fillText(`${t.speedKmh} km/h · ${t.altitudeMeters}m`, tx, ty + 26);
    });

  }, [tracks, scenarioId, predictionErrorMeters, telemetryFreshnessSec, isStale, selectedTrackId]);

  return (
    <div className="relative w-full rounded-2xl bg-[#030816] border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden flex flex-col items-center p-3 select-none">
      {/* Top Banner: Offline Vector Plane */}
      <div className="w-full flex items-center justify-between px-2 pb-2 border-b border-white/10 text-2xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-creator-pink" />
          <span className="font-bold text-white uppercase tracking-wider">OFFLINE VECTOR TEST BENCH</span>
          <span className="text-white/20">|</span>
          <span className="text-slate-400">Scale: ±10 km Local Cartesian</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sunshine-yellow text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
            SIMULATED DATA
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-lime-glow/20 text-lime-glow border border-lime-glow/40">
            OFFLINE READY
          </span>
        </div>
      </div>

      {/* Main Canvas Host */}
      <div ref={containerRef} className="relative w-full flex items-center justify-center py-2 min-h-[380px]">
        <canvas
          ref={canvasRef}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas || tracks.length === 0) return;
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Find closest track
            let closest = tracks[0];
            let minDist = Infinity;
            tracks.forEach((t) => {
              const tx = kmToPx(t.x, rect.width);
              const ty = rect.height - kmToPx(t.y, rect.height);
              const dist = Math.hypot(clickX - tx, clickY - ty);
              if (dist < minDist) {
                minDist = dist;
                closest = t;
              }
            });

            if (minDist < 35 && closest) {
              onSelectTrack(closest.id);
            }
          }}
          className="cursor-crosshair rounded-xl"
        />

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#060D1E]/90 border border-white/15 backdrop-blur-md rounded-xl p-2.5 text-[10px] font-mono text-slate-300 space-y-1 shadow-lg max-w-[220px]">
          <div className="font-bold text-white border-b border-white/10 pb-1 mb-1 flex items-center gap-1.5">
            <Target className="w-3 h-3 text-creator-pink" />
            <span>RADAR SYMBOLOGY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-glow inline-block" />
            <span>Observed Position</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />
            <span>Forecast Path</span>
          </div>
          {scenarioId === 'unexpected-motion' && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="w-3 h-0.5 border-t border-red-500 inline-block" />
              <span>Divergence Δ Error</span>
            </div>
          )}
          {isStale && (
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-2.5 h-2.5" />
              <span>Stale Dropout Envelope</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Provenance Disclaimer */}
      <div className="w-full pt-1.5 border-t border-white/10 text-center text-[10px] font-mono text-slate-400">
        Deterministic mathematical projection · Zero real military or commercial airspace feeds
      </div>
    </div>
  );
};
