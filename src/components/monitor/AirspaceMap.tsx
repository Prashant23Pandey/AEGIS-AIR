import React, { useRef, useEffect, useCallback } from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { DroneTrack } from '../../types/telemetry';
import { Plus } from 'lucide-react';

// Coordinate system: -10km to +10km on both axes, origin at center
const GRID_KM = 10;
const RESTRICTED_ZONES = [
  { cx: 0, cy: 0, r: 2.5, label: 'Protected Core Zone', isCore: true },
  { cx: -4, cy: 3, r: 1.2, label: 'Sector Alpha (Restricted)', isCore: false },
  { cx: 5, cy: -2, r: 1.5, label: 'Sector Bravo (Buffer)', isCore: false },
];

const iffColor = (iff: string): string => {
  switch (iff) {
    case 'hostile': return '#EF4444'; // neon coral/red
    case 'friendly': return '#70FF00'; // electric lime
    case 'neutral': return '#64748B'; // slate
    default: return '#FFC700'; // sunshine yellow
  }
};

const statusAlpha = (status: string): number => {
  if (status === 'NEUTRALIZED' || status === 'LOST_TRACK') return 0.25;
  return 1.0;
};

export const AirspaceMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tracks, selectedTrackId, selectTrack, injectThreat, radarSweepAngle } = useAirspace();

  // Map km coords to canvas pixels
  const toPixel = useCallback((x: number, y: number, w: number, h: number) => {
    const pad = 40;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;
    const px = pad + ((x + GRID_KM) / (GRID_KM * 2)) * drawW;
    const py = pad + ((GRID_KM - y) / (GRID_KM * 2)) * drawH; // flip Y: +Y is up
    return { px, py };
  }, []);

  // Hit-test for click: find track closest to click point
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    let closest: DroneTrack | null = null;
    let closestDist = 22; // px threshold

    for (const track of tracks) {
      const { px, py } = toPixel(track.x, track.y, canvas.width, canvas.height);
      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < closestDist) {
        closest = track;
        closestDist = dist;
      }
    }

    selectTrack(closest?.id || null);
  }, [tracks, toPixel, selectTrack]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = 40;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;

    // Clear with clean ivory canvas
    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(0, 0, w, h);

    // Grid lines - architectural hairline stone
    ctx.strokeStyle = 'rgba(214, 211, 209, 0.65)';
    ctx.lineWidth = 0.75;
    for (let km = -GRID_KM; km <= GRID_KM; km += 2) {
      const { px } = toPixel(km, 0, w, h);
      const { py } = toPixel(0, km, w, h);
      // Vertical
      ctx.beginPath();
      ctx.moveTo(px, pad);
      ctx.lineTo(px, pad + drawH);
      ctx.stroke();
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(pad, py);
      ctx.lineTo(pad + drawW, py);
      ctx.stroke();
    }

    // Axis coordinate labels
    ctx.fillStyle = '#686864';
    ctx.font = 'bold 10px "Space Mono", monospace';
    ctx.textAlign = 'center';
    for (let km = -GRID_KM; km <= GRID_KM; km += 4) {
      const { px } = toPixel(km, 0, w, h);
      const { py } = toPixel(0, km, w, h);
      ctx.fillText(`${km} km`, px, h - 12);
      ctx.textAlign = 'right';
      ctx.fillText(`${km}`, pad - 8, py + 3);
      ctx.textAlign = 'center';
    }

    // Restricted zones
    RESTRICTED_ZONES.forEach(zone => {
      const { px, py } = toPixel(zone.cx, zone.cy, w, h);
      const rPx = (zone.r / (GRID_KM * 2)) * drawW;

      if (zone.isCore) {
        // Protected Core - Soft Royal Indigo
        ctx.fillStyle = 'rgba(79, 70, 229, 0.05)';
        ctx.beginPath();
        ctx.arc(px, py, rPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.35)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(px, py, rPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#0D0D0D';
        ctx.font = 'bold 11px "Syne", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.label.toUpperCase(), px, py - rPx - 6);
      } else {
        // Perimeter restricted zones
        ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
        ctx.beginPath();
        ctx.arc(px, py, rPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(px, py, rPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 10px "Syne", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.label.toUpperCase(), px, py - rPx - 5);
      }
    });

    // Radar sweep line (subtle royal indigo beam)
    const centerPx = toPixel(0, 0, w, h);
    const sweepRad = (radarSweepAngle * Math.PI) / 180;
    const sweepLen = Math.max(drawW, drawH) * 0.6;
    const sweepGrad = ctx.createLinearGradient(
      centerPx.px, centerPx.py,
      centerPx.px + Math.sin(sweepRad) * sweepLen,
      centerPx.py - Math.cos(sweepRad) * sweepLen
    );
    sweepGrad.addColorStop(0, 'rgba(79, 70, 229, 0.18)');
    sweepGrad.addColorStop(1, 'rgba(79, 70, 229, 0)');
    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(centerPx.px, centerPx.py);
    ctx.lineTo(
      centerPx.px + Math.sin(sweepRad) * sweepLen,
      centerPx.py - Math.cos(sweepRad) * sweepLen
    );
    ctx.stroke();

    // Center Origin Crosshair
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(centerPx.px - 8, centerPx.py);
    ctx.lineTo(centerPx.px + 8, centerPx.py);
    ctx.moveTo(centerPx.px, centerPx.py - 8);
    ctx.lineTo(centerPx.px, centerPx.py + 8);
    ctx.stroke();

    // Range rings
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
    ctx.lineWidth = 0.75;
    [2.5, 5, 7.5].forEach(r => {
      const rPx = (r / (GRID_KM * 2)) * drawW;
      ctx.beginPath();
      ctx.arc(centerPx.px, centerPx.py, rPx, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // Range labels
    ctx.fillStyle = '#686864';
    ctx.font = 'bold 9px "Space Mono", monospace';
    ctx.textAlign = 'left';
    [2.5, 5, 7.5].forEach(r => {
      const rPx = (r / (GRID_KM * 2)) * drawW;
      ctx.fillText(`${r} km`, centerPx.px + rPx + 4, centerPx.py - 3);
    });

    // Cardinal directions
    ctx.fillStyle = '#0D0D0D';
    ctx.font = '800 12px "Syne", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerPx.px, pad - 8);
    ctx.fillText('S', centerPx.px, pad + drawH + 18);
    ctx.textAlign = 'left';
    ctx.fillText('E', pad + drawW + 10, centerPx.py + 4);
    ctx.textAlign = 'right';
    ctx.fillText('W', pad - 12, centerPx.py + 4);

    // Tracks
    tracks.forEach(track => {
      const color = iffColor(track.iff);
      const alpha = statusAlpha(track.status);
      const selected = track.id === selectedTrackId;

      // Track history trail
      if (track.history.length > 1) {
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        track.history.forEach((pt, i) => {
          const { px, py } = toPixel(pt.x, pt.y, w, h);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      const { px, py } = toPixel(track.x, track.y, w, h);

      // Predicted position (10s projection)
      if (track.status === 'ACTIVE' && track.speedKmh > 10) {
        const predictSec = 10;
        const dKm = (track.speedKmh / 3600) * predictSec;
        const headRad = (track.headingDeg * Math.PI) / 180;
        const futX = track.x + Math.sin(headRad) * dKm;
        const futY = track.y + Math.cos(headRad) * dKm;
        const futPx = toPixel(futX, futY, w, h);

        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(futPx.px, futPx.py);
        ctx.stroke();
        ctx.restore();

        // Projected dot
        ctx.fillStyle = `${color}55`;
        ctx.beginPath();
        ctx.arc(futPx.px, futPx.py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Track marker - clean diamond shape
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py);

      // Selection ring in Royal Indigo
      // Selection ring with Creator Pink pop accent
      if (selected) {
        ctx.strokeStyle = '#FF90E8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0D0D0D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Heading vector line
      const hdgRad = (track.headingDeg * Math.PI) / 180;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.sin(hdgRad) * 16, -Math.cos(hdgRad) * 16);
      ctx.stroke();

      // Diamond marker
      const s = selected ? 7 : 5.5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
      ctx.fill();

      // Black outline for crisp neo-brutalist pop
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Callsign label in Syne Bold
      ctx.fillStyle = selected ? '#0D0D0D' : '#0D0D0D';
      ctx.font = `800 ${selected ? '13px' : '11px'} "Syne", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(track.callsign, px + 12, py - 4);

      // Altitude tag in Space Mono
      ctx.fillStyle = '#686864';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillText(`${track.altitudeMeters}m · ${track.speedKmh}km/h`, px + 12, py + 8);
    });

  }, [tracks, selectedTrackId, radarSweepAngle, toPixel]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.dispatchEvent(new Event('resize'));
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="pop-card rounded-2xl bg-white border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-pitch-black bg-surface-0 gap-3">
        <div>
          <h2 className="font-display font-extrabold text-lg text-pitch-black tracking-tight">Airspace Vector Plot</h2>
          <p className="text-2xs text-ink-500 font-mono">Simulated ±10 km grid coordinate coverage</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 text-2xs text-pitch-black mr-2 font-mono font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-pitch-black inline-block" /> Hostile</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-lime-glow border border-pitch-black inline-block" /> Friendly</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sunshine-yellow border border-pitch-black inline-block" /> Unknown</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-pitch-black inline-block" /> Neutral</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-pitch-black/20 pl-2">
            <button
              onClick={() => injectThreat('SWARM')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-creator-pink/30 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject simulated swarm scenario"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Swarm</span>
            </button>
            <button
              onClick={() => injectThreat('KAMIKAZE')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-creator-pink/30 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject simulated fast approach scenario"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Fast Approach</span>
            </button>
            <button
              onClick={() => injectThreat('RECON')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-sunshine-yellow/40 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject unidentified contact"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => injectThreat('DEGRADATION')}
              className="btn-pop flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-sunshine-yellow/40 border border-pitch-black shadow-[1.5px_1.5px_0px_#0D0D0D] text-pitch-black transition-all"
              title="Inject synthetic RF noise / telemetry degradation scenario"
            >
              <Plus className="w-3 h-3 text-pitch-black" />
              <span>Degradation</span>
            </button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="relative dot-grid bg-white flex-1 min-h-[440px]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onClick={handleClick}
        />
      </div>
    </div>
  );
};
