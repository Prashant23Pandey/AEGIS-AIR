import React from 'react';
import { useAirspace } from '../../context/useAirspace';
import type { CountermeasureType, IFFStatus } from '../../types/telemetry';
import { Radio, Navigation, Gauge, Battery, Clock, Zap } from 'lucide-react';

export const TrackDetail: React.FC = () => {
  const { selectedTrack, triggerCountermeasure, updateIFF } = useAirspace();

  if (!selectedTrack) return null;

  const t = selectedTrack;

  const iffOptions: { value: IFFStatus; label: string; activeColor: string }[] = [
    { value: 'hostile', label: 'Hostile', activeColor: 'bg-red-600 text-white border-red-600' },
    { value: 'friendly', label: 'Friendly', activeColor: 'bg-emerald-600 text-white border-emerald-600' },
    { value: 'unknown', label: 'Unknown', activeColor: 'bg-amber-600 text-white border-amber-600' },
    { value: 'neutral', label: 'Neutral', activeColor: 'bg-slate-600 text-white border-slate-600' },
  ];

  const countermeasures: { type: CountermeasureType; label: string; desc: string }[] = [
    { type: 'RF_JAM', label: 'RF Jamming', desc: 'Disrupt 2.4/5.8 GHz C2 link' },
    { type: 'GPS_SPOOF', label: 'GNSS Spoof', desc: 'Inject false waypoints' },
    { type: 'NET_CATCH', label: 'Interceptor Net', desc: 'Kinetic physical capture' },
    { type: 'KINETIC_EMP', label: 'High-Power EMP', desc: 'Directed microwave disrupt' },
  ];

  const isNeutralized = t.status === 'NEUTRALIZED' || t.status === 'LOST_TRACK';

  const fields = [
    { icon: <Navigation className="w-3.5 h-3.5 text-indigo-600" />, label: 'Heading', value: `${t.headingDeg}°` },
    { icon: <Gauge className="w-3.5 h-3.5 text-indigo-600" />, label: 'Speed', value: `${t.speedKmh} km/h` },
    { icon: <Radio className="w-3.5 h-3.5 text-indigo-600" />, label: 'RF Freq', value: `${t.rfFrequencyGhz} GHz` },
    { icon: <Zap className="w-3.5 h-3.5 text-amber-600" />, label: 'RSSI', value: `${t.rssiDbm} dBm` },
    { icon: <Battery className="w-3.5 h-3.5 text-emerald-600" />, label: 'Battery', value: `${t.batteryPercent}%` },
    { icon: <Clock className="w-3.5 h-3.5 text-rose-600" />, label: 'ETA Core', value: t.etaToPerimeterSeconds < 900 ? `${t.etaToPerimeterSeconds}s` : '—' },
  ];

  return (
    <div className="pop-card rounded-2xl bg-white border border-pitch-black shadow-[2px_2px_0px_#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-pitch-black bg-surface-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-xl text-pitch-black tracking-tight">{t.callsign}</h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white text-pitch-black border border-pitch-black shadow-[1px_1px_0px_#0D0D0D]">
                {t.id}
              </span>
            </div>
            <p className="text-2xs text-ink-500 mt-0.5 font-sans">
              Classification: <strong className="font-semibold text-pitch-black">{t.classification}</strong> · {t.protocol}
            </p>
          </div>
          <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-pitch-black shadow-[1px_1px_0px_#0D0D0D] ${
            t.iff === 'hostile' ? 'bg-red-500 text-white' :
            t.iff === 'friendly' ? 'bg-lime-glow text-pitch-black' :
            t.iff === 'unknown' ? 'bg-sunshine-yellow text-pitch-black' :
            'bg-surface-2 text-pitch-black'
          }`}>
            {t.iff}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Telemetry grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {fields.map(f => (
            <div key={f.label} className="bg-surface-0 border border-pitch-black rounded-xl px-2.5 py-2 shadow-[1px_1px_0px_#0D0D0D]">
              <div className="flex items-center gap-1 text-ink-500 mb-0.5">
                {f.icon}
                <span className="text-[10px] font-bold tracking-wide uppercase">{f.label}</span>
              </div>
              <div className="text-xs font-mono text-pitch-black font-bold">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Extra metadata */}
        <div className="bg-surface-0 border border-pitch-black rounded-xl px-3.5 py-2.5 text-xs space-y-1 shadow-[1px_1px_0px_#0D0D0D]">
          <div className="flex justify-between text-ink-500">
            <span>Estimated Payload:</span>
            <span className="text-pitch-black font-semibold">{t.payloadEstimate}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Ingress Sector:</span>
            <span className="text-pitch-black font-semibold">{t.originSector}</span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>Last Telemetry Sync:</span>
            <span className="text-pitch-black font-mono font-bold text-[11px]">{t.lastUpdated}</span>
          </div>
        </div>

        {/* IFF Override Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xs uppercase tracking-widest text-ink-500 font-bold font-mono">IFF Override</span>
          </div>
          <div className="flex gap-1.5">
            {iffOptions.map(o => {
              const active = t.iff === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => updateIFF(t.id, o.value)}
                  className={`flex-1 text-2xs py-1.5 rounded-xl border border-pitch-black font-mono font-bold uppercase transition-all shadow-[1.5px_1.5px_0px_#0D0D0D] active:translate-y-0.5 active:shadow-none ${
                    active
                      ? o.activeColor
                      : 'bg-white text-pitch-black hover:bg-surface-2'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Countermeasures */}
        {!isNeutralized && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xs uppercase tracking-widest text-ink-500 font-bold font-mono">C-UAS Defense Countermeasures</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {countermeasures.map(cm => {
                const active = t.activeCountermeasure === cm.type;
                return (
                  <button
                    key={cm.type}
                    onClick={() => triggerCountermeasure(t.id, cm.type)}
                    disabled={active}
                    className={`text-left px-3 py-2 rounded-xl border border-pitch-black text-xs transition-all shadow-[2px_2px_0px_#0D0D0D] ${
                      active
                        ? 'bg-sunshine-yellow text-pitch-black font-bold ring-2 ring-pitch-black translate-x-0.5 translate-y-0.5 shadow-none'
                        : 'bg-white text-pitch-black hover:bg-creator-pink/20 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#0D0D0D]'
                    }`}
                  >
                    <div className="font-display font-bold text-xs">{cm.label}</div>
                    <div className="text-[10px] text-ink-500 mt-0.5">{cm.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isNeutralized && (
          <div className="text-center py-2.5 text-xs text-pitch-black bg-surface-2 border border-pitch-black rounded-xl font-bold font-mono shadow-[1px_1px_0px_#0D0D0D]">
            CONTACT STATUS: {t.status.replace('_', ' ')} — NEUTRALIZED
          </div>
        )}
      </div>
    </div>
  );
};
