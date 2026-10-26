import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { DroneTrack } from '../../types/telemetry';
import { Crosshair, ZoomIn, ZoomOut, Shield, Compass } from 'lucide-react';

export const RadarDisplay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { 
    tracks, 
    selectedTrackId, 
    selectTrack, 
    radarSweepAngle, 
    sectorFilter 
  } = useAirspace();

  const [zoomRangeKm, setZoomRangeKm] = useState<number>(10);
  const [hoveredTrack, setHoveredTrack] = useState<DroneTrack | null>(null);

  // Handle Canvas Click to select track
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = (canvas.width / 2) / zoomRangeKm;

    let clickedTrack: DroneTrack | null = null;
    let minDistance = 18;

    tracks.forEach(track => {
      const px = centerX + track.x * scale;
      const py = centerY - track.y * scale;

      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < minDistance) {
        minDistance = dist;
        clickedTrack = track;
      }
    });

    if (clickedTrack) {
      selectTrack((clickedTrack as DroneTrack).id);
    }
  }, [tracks, zoomRangeKm, selectTrack]);

  // Handle Hover for tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = (canvas.width / 2) / zoomRangeKm;

    let target: DroneTrack | null = null;
    let minDistance = 16;

    tracks.forEach(track => {
      const px = centerX + track.x * scale;
      const py = centerY - track.y * scale;
      const dist = Math.hypot(mouseX - px, mouseY - py);
      if (dist < minDistance) {
        minDistance = dist;
        target = track;
      }
    });

    setHoveredTrack(target);
  }, [tracks, zoomRangeKm]);

  // Radar Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    const scale = radius / zoomRangeKm;

    // Clear background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Draw circular radar container clipping mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Radar background gradient
    const bgGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
    bgGrad.addColorStop(0, '#0a162b');
    bgGrad.addColorStop(0.7, '#070f1e');
    bgGrad.addColorStop(1, '#040810');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Range rings
    const ringDistances = [2.5, 5.0, 7.5, 10.0].filter(d => d <= zoomRangeKm);
    ringDistances.forEach(distKm => {
      const ringRadius = distKm * scale;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);

      if (distKm === 2.5) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = distKm === 2.5 ? '#f87171' : 'rgba(56, 189, 248, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(`${distKm} km`, centerX + 6, centerY - ringRadius + 12);
    });

    // Azimuth radial crosshairs
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const x2 = centerX + Math.sin(rad) * radius;
      const y2 = centerY - Math.cos(rad) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      const lx = centerX + Math.sin(rad) * (radius - 12);
      const ly = centerY - Math.cos(rad) * (radius - 12);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cardinals: Record<number, string> = { 0: '000° N', 90: '090° E', 180: '180° S', 270: '270° W' };
      ctx.fillText(cardinals[angle] || `${angle.toString().padStart(3, '0')}°`, lx, ly);
    }

    // Draw Sector Filter Highlight
    if (sectorFilter !== 'ALL') {
      const sectorAngles: Record<string, [number, number]> = {
        'NORTH': [315, 45],
        'EAST': [45, 135],
        'SOUTH': [135, 225],
        'WEST': [225, 315],
        'NORTH-EAST': [0, 90],
        'SOUTH-EAST': [90, 180],
        'SOUTH-WEST': [180, 270],
        'NORTH-WEST': [270, 360]
      };
      const [startDeg, endDeg] = sectorAngles[sectorFilter] || [0, 360];
      const startRad = ((startDeg - 90) * Math.PI) / 180;
      const endRad = ((endDeg - 90) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();
    }

    // Draw Rotating Radar Sweep
    const sweepRad = ((radarSweepAngle - 90) * Math.PI) / 180;
    const sweepTrailAngle = Math.PI * 0.35;

    const sweepGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, sweepRad - sweepTrailAngle, sweepRad, false);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(sweepRad) * radius,
      centerY + Math.sin(sweepRad) * radius
    );
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Base Station
    ctx.beginPath();
    ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Drone Tracks
    tracks.forEach(track => {
      if (track.distanceKm > zoomRangeKm * 1.05) return;

      const px = centerX + track.x * scale;
      const py = centerY - track.y * scale;

      const isSelected = track.id === selectedTrackId;
      const isNeutralized = track.status === 'NEUTRALIZED' || track.status === 'INTERCEPTED';

      let trackColor = '#eab308';
      if (isNeutralized) {
        trackColor = '#64748b';
      } else if (track.iff === 'hostile') {
        trackColor = '#ef4444';
      } else if (track.iff === 'friendly') {
        trackColor = '#10b981';
      }

      if (track.history && track.history.length > 1) {
        ctx.beginPath();
        track.history.forEach((pos, idx) => {
          const hx = centerX + pos.x * scale;
          const hy = centerY - pos.y * scale;
          if (idx === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        });
        ctx.strokeStyle = isNeutralized ? 'rgba(100, 116, 139, 0.25)' : `${trackColor}44`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (track.speedKmh > 5 && !isNeutralized) {
        const headingRad = ((track.headingDeg - 90) * Math.PI) / 180;
        const arrowLen = Math.min(28, Math.max(12, (track.speedKmh / 160) * 24));
        const vx = px + Math.cos(headingRad) * arrowLen;
        const vy = py + Math.sin(headingRad) * arrowLen;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(vx, vy);
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      if (track.classification === 'fixed-wing') {
        const size = isSelected ? 9 : 7;
        const headRad = ((track.headingDeg - 90) * Math.PI) / 180;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(headRad + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.8, size);
        ctx.lineTo(0, size * 0.4);
        ctx.lineTo(-size * 0.8, size);
        ctx.closePath();
        ctx.fillStyle = trackColor;
        ctx.fill();
        ctx.restore();
      } else if (track.classification === 'swarm-node') {
        const size = isSelected ? 8 : 6;
        ctx.moveTo(px, py - size);
        ctx.lineTo(px + size, py);
        ctx.lineTo(px, py + size);
        ctx.lineTo(px - size, py);
        ctx.closePath();
        ctx.fillStyle = trackColor;
        ctx.fill();
      } else {
        ctx.arc(px, py, isSelected ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = trackColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isSelected) {
        const bracketSize = 14;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(px - bracketSize, py - bracketSize + 5);
        ctx.lineTo(px - bracketSize, py - bracketSize);
        ctx.lineTo(px - bracketSize + 5, py - bracketSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + bracketSize - 5, py - bracketSize);
        ctx.lineTo(px + bracketSize, py - bracketSize);
        ctx.lineTo(px + bracketSize, py - bracketSize + 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px - bracketSize, py + bracketSize - 5);
        ctx.lineTo(px - bracketSize, py + bracketSize);
        ctx.lineTo(px - bracketSize + 5, py + bracketSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + bracketSize - 5, py + bracketSize);
        ctx.lineTo(px + bracketSize, py + bracketSize);
        ctx.lineTo(px + bracketSize, py + bracketSize - 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.85)';
      ctx.font = isSelected ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${track.id}`, px + 8, py - 4);
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
      ctx.fillText(`${track.speedKmh}km/h | ${track.altitudeMeters}m`, px + 8, py + 7);

      if (track.activeCountermeasure) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`[${track.activeCountermeasure}]`, px + 8, py + 17);
      }
    });

    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

  }, [tracks, selectedTrackId, radarSweepAngle, zoomRangeKm, sectorFilter]);

  return (
    <div className="relative flex flex-col items-center justify-center p-2 rounded-xl tactical-panel border border-cyan-900/40">
      {/* Tactical Canvas Header Bar */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 border-b border-cyan-950/60 mb-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
            RADAR-PPI // 360° SENTRY SCAN
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            ONLINE
          </span>
        </div>

        {/* Range & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1">
            RANGE: <strong className="text-cyan-300">{zoomRangeKm} KM</strong>
          </span>
          <button
            onClick={() => setZoomRangeKm(prev => Math.min(10, prev + 2.5))}
            disabled={zoomRangeKm >= 10}
            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700"
            title="Zoom Out (Expand Radar Horizon)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomRangeKm(prev => Math.max(2.5, prev - 2.5))}
            disabled={zoomRangeKm <= 2.5}
            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700"
            title="Zoom In (Close Perimeter View)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={480}
          height={480}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTrack(null)}
          className="rounded-full shadow-2xl shadow-cyan-950/40 cursor-crosshair border border-cyan-500/20"
        />

        {/* Radar Corner Compass Overlays */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-500/60 flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>FREQ: 9.4 GHz X-BAND</span>
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-red-400/80 flex items-center gap-1">
          <Shield className="w-3 h-3 text-red-400" />
          <span>PERIMETER: 2.5 KM</span>
        </div>

        {/* Interactive Hover Tooltip */}
        {hoveredTrack && (
          <div 
            className="absolute pointer-events-none z-30 p-2.5 rounded-lg bg-slate-950/95 border border-cyan-500/50 text-xs font-mono shadow-2xl backdrop-blur-md"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '200px'
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
              <span className="font-bold text-cyan-300">{hoveredTrack.id} ({hoveredTrack.callsign})</span>
              <span className={`px-1 rounded text-[9px] font-bold uppercase ${
                hoveredTrack.iff === 'hostile' ? 'bg-red-950 text-red-400 border border-red-800' :
                hoveredTrack.iff === 'friendly' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {hoveredTrack.iff}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
              <div>Type: <span className="text-slate-100">{hoveredTrack.classification}</span></div>
              <div>Dist: <span className="text-cyan-400">{hoveredTrack.distanceKm} km</span></div>
              <div>Speed: <span className="text-cyan-400">{hoveredTrack.speedKmh} km/h</span></div>
              <div>Alt: <span className="text-cyan-400">{hoveredTrack.altitudeMeters} m</span></div>
              <div>ETA: <span className="text-red-400 font-bold">{hoveredTrack.etaToPerimeterSeconds}s</span></div>
              <div>Status: <span className="text-amber-300">{hoveredTrack.status}</span></div>
            </div>
            <div className="mt-1.5 text-[9px] text-cyan-400 text-center border-t border-slate-800 pt-1">
              CLICK TO LOCK TARGET & ENGAGE
            </div>
          </div>
        )}
      </div>

      {/* Radar Legend Footer */}
      <div className="w-full mt-3 flex items-center justify-around text-[10px] font-mono text-slate-400 border-t border-cyan-950/40 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          <span>HOSTILE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>FRIENDLY</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
          <span>UNKNOWN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
          <span>NEUTRALIZED</span>
        </div>
      </div>
    </div>
  );
};
